/**
 * Signed password reset tokens — no database required.
 *
 * Uses HMAC-SHA256 to sign a payload of { email, expiry }.
 * The token is self-contained and verifiable without any DB lookup.
 *
 * Secret key comes from RESET_TOKEN_SECRET env var.
 * Falls back to ADMIN_PASSWORD if not set (ensure you set a dedicated secret in production).
 */

function getSecret(): string {
  const secret = process.env.RESET_TOKEN_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("RESET_TOKEN_SECRET or ADMIN_PASSWORD must be set. Cannot generate secure tokens without a secret.");
  }
  return secret;
}

function toBase64Url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function fromBase64Url(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Buffer.from(sig).toString("base64url");
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Generate a signed reset token valid for 1 hour */
export async function createResetToken(email: string): Promise<string> {
  const payload = toBase64Url(JSON.stringify({ email, exp: Date.now() + 3_600_000 }));
  const sig = await hmacSign(payload, getSecret());
  return `${payload}.${sig}`;
}

export interface VerifyResult {
  valid: boolean;
  email?: string;
  reason?: string;
}

/** Verify a reset token and return the email if valid */
export async function verifyResetToken(token: string): Promise<VerifyResult> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false, reason: "malformed" };
    const [payload, sig] = parts;
    const ok = await hmacVerify(payload, sig, getSecret());
    if (!ok) return { valid: false, reason: "invalid_signature" };
    const { email, exp } = JSON.parse(fromBase64Url(payload));
    if (Date.now() > exp) return { valid: false, reason: "expired" };
    return { valid: true, email };
  } catch {
    return { valid: false, reason: "parse_error" };
  }
}
