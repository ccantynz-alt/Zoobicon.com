/**
 * Admin Auth — Strict Equality Check
 *
 * Centralizes the "is this request an admin?" question so it can never drift
 * across routes. Several routes previously used loose checks (`if (header)`,
 * `=== "true"`, `!= null`) which let any non-empty header bypass auth.
 * This module is the only place admin status gets decided.
 *
 * A request is admin if EITHER:
 *   - header `x-admin: 1`         (explicit, opt-in for tools/scripts)
 *   - cookie `admin=1`            (set by /api/auth/login for the admin user)
 *
 * The string MUST be exactly "1". Empty, "true", "yes", "0", or any other
 * value is rejected.
 *
 * Usage:
 *   import { requireAdmin } from "@/lib/admin-auth";
 *   const guard = requireAdmin(req);
 *   if (guard) return guard;   // 401 response
 *   // ... admin-only logic
 */

import { NextRequest, NextResponse } from "next/server";

const ADMIN_VALUE = "1";

export function isAdminRequest(req: NextRequest | Request): boolean {
  const header = req.headers.get("x-admin");
  if (header === ADMIN_VALUE) return true;

  // NextRequest exposes typed cookies; fall back to the raw cookie header
  // for plain Request instances (e.g. middleware, edge fn callers).
  const cookieValue =
    "cookies" in req && typeof (req as NextRequest).cookies?.get === "function"
      ? (req as NextRequest).cookies.get("admin")?.value
      : parseCookieHeader(req.headers.get("cookie"))["admin"];

  return cookieValue === ADMIN_VALUE;
}

/**
 * Returns a 401 NextResponse if the request is not admin, or null if the
 * request is authorized. Routes call this once at the top of their handler.
 */
export function requireAdmin(req: NextRequest | Request): NextResponse | null {
  if (isAdminRequest(req)) return null;
  return NextResponse.json(
    {
      error: "unauthorized",
      message:
        "Admin access required. Send header 'x-admin: 1' (exactly) or set cookie 'admin=1'.",
    },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

function parseCookieHeader(raw: string | null): Record<string, string> {
  if (!raw) return {};
  const out: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}
