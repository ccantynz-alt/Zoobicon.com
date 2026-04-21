import {
  createHmac,
  createSign,
  createECDH,
  createPrivateKey,
  randomBytes,
  createCipheriv,
} from "node:crypto";
import { sql } from "./db";

export interface PushKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: PushKeys;
}

export interface SubscribeInput {
  userId: string;
  subscription: PushSubscription;
}

export interface SendPushInput {
  userId: string;
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

interface PushSubRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  schemaReady = true;
}

function requireEnv(): {
  publicKey: string;
  privateKey: string;
  subject: string;
} {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    const err = new Error("VAPID env vars missing") as Error & {
      status?: number;
    };
    err.status = 503;
    throw err;
  }
  return { publicKey, privateKey, subject };
}

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function derToJoseEcdsa(der: Buffer): Buffer {
  // Convert DER ECDSA signature to JOSE (r||s) 64 bytes for P-256.
  let offset = 0;
  if (der[offset++] !== 0x30) throw new Error("bad DER");
  if (der[offset] & 0x80) offset += 1 + (der[offset] & 0x7f);
  else offset += 1;
  if (der[offset++] !== 0x02) throw new Error("bad DER r");
  let rLen = der[offset++];
  let r = der.slice(offset, offset + rLen);
  offset += rLen;
  if (der[offset++] !== 0x02) throw new Error("bad DER s");
  let sLen = der[offset++];
  let s = der.slice(offset, offset + sLen);
  while (r.length > 32 && r[0] === 0) r = r.slice(1);
  while (s.length > 32 && s[0] === 0) s = s.slice(1);
  const rPad = Buffer.concat([Buffer.alloc(32 - r.length, 0), r]);
  const sPad = Buffer.concat([Buffer.alloc(32 - s.length, 0), s]);
  return Buffer.concat([rPad, sPad]);
}

function loadVapidPrivateKey(b64urlPriv: string, b64urlPub: string) {
  const d = b64urlDecode(b64urlPriv);
  if (d.length !== 32) throw new Error("invalid VAPID private key length");
  const pub = b64urlDecode(b64urlPub);
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error("invalid VAPID public key");
  }
  const x = pub.slice(1, 33);
  const y = pub.slice(33, 65);
  return createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: b64urlEncode(d),
      x: b64urlEncode(x),
      y: b64urlEncode(y),
    },
    format: "jwk",
  });
}

function signVapidJwt(audience: string): string {
  const { publicKey, privateKey, subject } = requireEnv();
  const header = { typ: "JWT", alg: "ES256" };
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const payload = { aud: audience, exp, sub: subject };
  const headerB64 = b64urlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = b64urlEncode(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;
  const keyObj = loadVapidPrivateKey(privateKey, publicKey);
  const signer = createSign("SHA256");
  signer.update(signingInput);
  signer.end();
  const der = signer.sign(keyObj);
  const jose = derToJoseEcdsa(der);
  return `${signingInput}.${b64urlEncode(jose)}`;
}

function hkdf(
  salt: Buffer,
  ikm: Buffer,
  info: Buffer,
  length: number,
): Buffer {
  const prk = createHmac("sha256", salt).update(ikm).digest();
  let prev = Buffer.alloc(0);
  let output = Buffer.alloc(0);
  let counter = 1;
  while (output.length < length) {
    const h = createHmac("sha256", prk);
    h.update(prev);
    h.update(info);
    h.update(Buffer.from([counter]));
    prev = h.digest();
    output = Buffer.concat([output, prev]);
    counter += 1;
  }
  return output.slice(0, length);
}

function encryptAes128Gcm(
  payload: Buffer,
  uaPublicKey: Buffer,
  authSecret: Buffer,
): { body: Buffer; salt: Buffer; localPublicKey: Buffer } {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  const localPublicKey = ecdh.getPublicKey();
  const sharedSecret = ecdh.computeSecret(uaPublicKey);
  const salt = randomBytes(16);

  // RFC 8291 key derivation
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0"),
    uaPublicKey,
    localPublicKey,
  ]);
  const ikm = hkdf(authSecret, sharedSecret, keyInfo, 32);

  const cekInfo = Buffer.from("Content-Encoding: aes128gcm\0");
  const cek = hkdf(salt, ikm, cekInfo, 16);

  const nonceInfo = Buffer.from("Content-Encoding: nonce\0");
  const nonce = hkdf(salt, ikm, nonceInfo, 12);

  // Pad: payload || 0x02 (last record delimiter)
  const padded = Buffer.concat([payload, Buffer.from([0x02])]);

  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(padded), cipher.final()]);
  const tag = cipher.getAuthTag();

  // aes128gcm content coding header: salt(16) || rs(4) || idlen(1) || keyid(idlen)
  const rs = Buffer.alloc(4);
  rs.writeUInt32BE(4096, 0);
  const idlen = Buffer.from([localPublicKey.length]);
  const header = Buffer.concat([salt, rs, idlen, localPublicKey]);

  const body = Buffer.concat([header, ciphertext, tag]);
  return { body, salt, localPublicKey };
}

function getAudience(endpoint: string): string {
  const u = new URL(endpoint);
  return `${u.protocol}//${u.host}`;
}

export async function subscribe(input: SubscribeInput): Promise<void> {
  await ensureSchema();
  const id =
    typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : randomBytes(16).toString("hex");
  await sql`
    INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
    VALUES (${id}, ${input.userId}, ${input.subscription.endpoint}, ${input.subscription.keys.p256dh}, ${input.subscription.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      p256dh = EXCLUDED.p256dh,
      auth = EXCLUDED.auth
  `;
}

export async function unsubscribe(endpoint: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
}

async function deliverTo(
  row: PushSubRow,
  message: PushMessage,
): Promise<void> {
  const { publicKey } = requireEnv();
  const payload = Buffer.from(JSON.stringify(message), "utf8");
  const uaPublic = b64urlDecode(row.p256dh);
  const auth = b64urlDecode(row.auth);
  const { body } = encryptAes128Gcm(payload, uaPublic, auth);
  const aud = getAudience(row.endpoint);
  const jwt = signVapidJwt(aud);

  const res = await fetch(row.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${publicKey}`,
    },
    body,
  });

  if (res.status === 404 || res.status === 410) {
    await sql`DELETE FROM push_subscriptions WHERE endpoint = ${row.endpoint}`;
    return;
  }
  if (!res.ok) {
    throw new Error(`push failed ${res.status}`);
  }
}

export async function sendPush(input: SendPushInput): Promise<{
  sent: number;
  failed: number;
}> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${input.userId}
  `) as unknown as PushSubRow[];
  let sent = 0;
  let failed = 0;
  const message: PushMessage = {
    title: input.title,
    body: input.body,
    url: input.url,
    icon: input.icon,
  };
  for (const row of rows) {
    try {
      await deliverTo(row, message);
      sent += 1;
    } catch {
      failed += 1;
    }
  }
  return { sent, failed };
}

export async function broadcastPush(message: PushMessage): Promise<{
  sent: number;
  failed: number;
}> {
  await ensureSchema();
  const rows = (await sql`
    SELECT id, user_id, endpoint, p256dh, auth FROM push_subscriptions
  `) as unknown as PushSubRow[];
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      await deliverTo(row, message);
      sent += 1;
    } catch {
      failed += 1;
    }
  }
  return { sent, failed };
}

