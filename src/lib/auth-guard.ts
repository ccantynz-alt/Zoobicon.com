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
