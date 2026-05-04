/**
 * JWT Verification — HS256 with Web Crypto
 *
 * The previous implementation parsed JWTs with `split(".")[1]` + `atob()`
 * and never verified the signature, so anyone could forge a token with any
 * `sub` and impersonate any user. This module replaces that with a real
 * HMAC-SHA256 signature check using Web Crypto so it works in both Node
 * and Edge runtimes without adding a dependency.
 *
 * Usage:
 *   const claims = await verifyJwtHS256(token, process.env.JWT_SECRET);
 *   if (!claims) return errRes(401, "Invalid token");
 *   const userId = claims.sub;
 *
 * Returns null on:
 *   - missing/empty token or secret
 *   - malformed structure (not three base64url segments)
 *   - signature mismatch
 *   - expired token (`exp` in the past)
 *
 * Returns the parsed payload on success.
 */

export interface JwtClaims {
  sub?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string | string[];
  [key: string]: unknown;
}

function base64UrlDecode(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeText(input: string): string {
  return new TextDecoder().decode(base64UrlDecode(input));
}

/**
 * Verify an HS256-signed JWT. Returns the decoded payload claims if the
 * signature is valid and the token is not expired; null otherwise.
 *
 * @param token   The "header.payload.signature" string (no Bearer prefix)
 * @param secret  Shared secret used to sign the token
 */
export async function verifyJwtHS256(
  token: string | null | undefined,
  secret: string | null | undefined,
): Promise<JwtClaims | null> {
  if (!token || !secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

  // Validate header
  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64UrlDecodeText(encodedHeader));
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null;

  // Verify signature
  let signatureValid = false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const data = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);
    const signature = base64UrlDecode(encodedSignature);
    // Cast to BufferSource — Web Crypto accepts Uint8Array at runtime, but
    // TypeScript's @types/node typing tightened in 22.x to reject the
    // ArrayBufferLike variant returned by atob(). The cast is safe.
    signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature as unknown as BufferSource,
      data as unknown as BufferSource,
    );
  } catch {
    return null;
  }
  if (!signatureValid) return null;

  // Parse payload
  let payload: JwtClaims;
  try {
    payload = JSON.parse(base64UrlDecodeText(encodedPayload)) as JwtClaims;
  } catch {
    return null;
  }

  // Reject expired tokens
  if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
