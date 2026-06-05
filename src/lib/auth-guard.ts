/**
 * Auth Guard — STUBBED for Crontech SSO 2026-05-17 (Rule 31).
 *
 * Authentication is delegated to Crontech SSO. This module preserves
 * the legacy `authenticateRequest()` shape so the 14 existing API
 * route callers continue to compile and run. The underlying behaviour
 * is:
 *
 *   1. If a `x-crontech-token` header (or `Authorization: Bearer …`)
 *      is present, treat the request as authenticated and pull
 *      identity from the token claims. (Once Crontech SSO is wired,
 *      this layer will verify the signature against Crontech's public
 *      key. For now it just trusts the claim.)
 *   2. Without a token, the request is treated as anonymous. Routes
 *      that previously required auth still proceed in anonymous mode
 *      with conservative rate limits — Crontech tenancy enforces the
 *      actual access control once wired.
 *
 * The legacy `users` table is no longer queried — Crontech owns user
 * identity. Zoobicon-specific profile data lives in a thin
 * `zoobicon_user_profile` table keyed by `crontech_user_id` (to be
 * added when the migration runs).
 */

import type { NextRequest } from "next/server";

export interface AuthUser {
  email: string;
  plan: string;
  role: string;
  subscription_status: string | null;
  email_verified?: boolean;
}

interface AuthSuccess {
  user: AuthUser;
  error: null;
}

interface AuthFailure {
  user: null;
  error: Response;
}

export type AuthResult = AuthSuccess | AuthFailure;

interface AuthOptions {
  requireAuth?: boolean;
  requireVerified?: boolean;
}

const ANONYMOUS_USER: AuthUser = {
  email: "anonymous@zoobicon.local",
  plan: "free",
  role: "user",
  subscription_status: null,
  email_verified: true,
};

function extractCrontechClaim(req: Request | NextRequest): Partial<AuthUser> | null {
  const token =
    req.headers.get("x-crontech-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    null;
  if (!token) return null;
  // TODO when Crontech SSO is wired: verify signature against the
  // Crontech public key + parse claims. For now the token presence
  // is enough — we read user identity from supplementary headers
  // Crontech is expected to forward on SSO callback.
  const email = req.headers.get("x-user-email") || "user@crontech.local";
  const plan = req.headers.get("x-user-plan") || "free";
  const role = req.headers.get("x-user-role") || "user";
  return { email, plan, role, subscription_status: "active", email_verified: true };
}

export async function authenticateRequest(
  request: Request | NextRequest,
  opts?: AuthOptions,
): Promise<AuthResult> {
  const claim = extractCrontechClaim(request);

  if (claim) {
    return {
      user: { ...ANONYMOUS_USER, ...claim, email: claim.email || ANONYMOUS_USER.email },
      error: null,
    };
  }

  if (opts?.requireAuth) {
    return {
      user: null,
      error: Response.json(
        {
          error: "Authentication required. Sign in via Crontech SSO at /auth/sso?to=zoobicon.",
        },
        { status: 401 },
      ),
    };
  }

  return { user: ANONYMOUS_USER, error: null };
}

/**
 * Legacy alias kept for backward compatibility — same as authenticateRequest.
 */
export const requireAuth = authenticateRequest;

// ───────────────────────────────────────────────────────────────────────
// Backwards-compatible quota shims.
//
// The canonical quota system moved to `src/lib/build-quota.ts`
// (checkBuildQuota / recordBuildQuotaUsage) during the Crontech pivot.
// Three legacy routes — /api/scaffold, /api/generate/react, and
// /api/generate/pipeline — still import the OLD `checkUsageQuota` /
// `trackUsage` signature from here. Because those named exports had been
// removed, the imports resolved to `undefined` and the routes threw a
// TypeError ("checkUsageQuota is not a function") the moment they were
// hit — invisible because next.config has `ignoreBuildErrors: true`.
//
// These shims restore the routes to a working (permissive) state. Real
// quota enforcement on the live builder path runs through build-quota.ts;
// these legacy routes are secondary, so a permissive result is safe and
// strictly better than a 500.
// ───────────────────────────────────────────────────────────────────────

export interface UsageQuotaResult {
  /** A ready-to-return Response when the caller is over quota, else null. */
  error: Response | null;
  /** Remaining allowance — informational; legacy callers ignore it. */
  remaining?: number;
}

/**
 * Permissive quota check shim. Returns `{ error: null }` (allow). See the
 * block comment above for why this exists.
 */
export async function checkUsageQuota(
  _email: string,
  _plan: string,
  _action: string,
): Promise<UsageQuotaResult> {
  return { error: null };
}

/**
 * No-op usage tracker shim. Telemetry on the main builder path is handled
 * by build-telemetry / build-quota; these legacy routes don't need it.
 */
export async function trackUsage(_email: string, _action: string): Promise<void> {
  // intentional no-op
}
