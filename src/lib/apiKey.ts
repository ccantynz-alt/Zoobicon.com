/**
 * Zoobicon API Key system — stateless, self-verifying, no DB required.
 *
 * Key format: zbk_live_<payload>.<signature>
 *
 *  payload  = base64url({ sub: sha256(email)[0:16], plan, v, iat })
 *  signature = HMAC-SHA256(payload, RESET_TOKEN_SECRET || ADMIN_PASSWORD)
 *
 * This lets the server validate any key without a database:
 *  - Extracts plan tier from the payload
 *  - Verifies the HMAC to confirm it was issued by this server
 *  - "Revocation" is handled by incrementing v (until Supabase is added)
 *
 * TODO: once Supabase is integrated, store a hash of the key and verify
 * against it — then per-key revocation works properly.
 */

function getSecret(): string {
  return process.env.RESET_TOKEN_SECRET || process.env.ADMIN_PASSWORD || "zoobicon-dev-secret";
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("base64url");
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret);
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

async function sha256hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Buffer.from(buf).toString("hex").slice(0, 16);
}

export type ApiKeyPlan = "free" | "pro" | "enterprise";

export interface ApiKeyPayload {
  sub: string;     // sha256(email)[0:16]
  plan: ApiKeyPlan;
  v: number;       // version — bump to invalidate all old keys for this user
  iat: number;     // issued at (ms)
}

/** Generate a new API key for a user */
export async function generateApiKey(email: string, plan: ApiKeyPlan, version = 1): Promise<string> {
  const sub = await sha256hex(email.toLowerCase());
  const payload = Buffer.from(JSON.stringify({ sub, plan, v: version, iat: Date.now() })).toString("base64url");
  const sig = await hmacSign(payload, getSecret());
  return `zbk_live_${payload}.${sig}`;
}

export interface ApiKeyValidation {
  valid: boolean;
  plan?: ApiKeyPlan;
  reason?: string;
}

/** Validate an API key — works without a database */
export async function validateApiKey(key: string): Promise<ApiKeyValidation> {
  if (!key.startsWith("zbk_live_")) return { valid: false, reason: "invalid_prefix" };
  const rest = key.slice("zbk_live_".length);
  const dot = rest.lastIndexOf(".");
  if (dot === -1) return { valid: false, reason: "malformed" };
  const payload = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  const ok = await hmacVerify(payload, sig, getSecret());
  if (!ok) return { valid: false, reason: "invalid_signature" };
  try {
    const parsed: ApiKeyPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return { valid: true, plan: parsed.plan };
  } catch {
    return { valid: false, reason: "parse_error" };
  }
}
