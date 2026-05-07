/**
 * Safe-redirect utility — blocks open-redirect phishing.
 *
 * Caller passes the raw `?redirect=...` query value. We return either the
 * value (when it's a real same-origin path) or a fallback. The previous
 * inline check (`startsWith("/") && !startsWith("//")`) let several known
 * bypasses through:
 *   /\evil.com       — Windows-style backslash separator
 *   /%2f%2fevil.com  — URL-encoded slashes
 *   /\\evil.com      — embedded backslashes
 *
 * Defence-in-depth: prefix sniff first (cheap), then `new URL` reparse to
 * guarantee the resulting URL's origin equals our origin. The reparse step
 * is the catch-all — any input that becomes a different host is rejected.
 */

const ALLOWED_BASE = "https://zoobicon.com";

export function safeRedirect(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!raw || typeof raw !== "string") return fallback;

  // Must be a relative path
  if (!raw.startsWith("/")) return fallback;

  // Block protocol-relative URLs and known parser-confusion prefixes
  if (raw.startsWith("//")) return fallback;
  if (raw.startsWith("/\\") || raw.startsWith("/\\\\")) return fallback;
  if (raw.includes("\\")) return fallback;

  // Block URL-encoded slashes / backslashes that would bypass the prefix sniff
  if (/^\/+%2f/i.test(raw) || /^\/+%5c/i.test(raw)) return fallback;

  // Final guarantee: resolve against our origin and reject anything that
  // becomes a different host.
  try {
    const u = new URL(raw, ALLOWED_BASE);
    if (u.origin !== ALLOWED_BASE) return fallback;
    // Strip any host part the parser may have introduced
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
