/**
 * API Auth Guard — Verifies user identity and plan from database
 *
 * Usage in API routes:
 *   const auth = await authenticateRequest(req);
 *   if (auth.error) return auth.error;
 *   // auth.user is now available with { email, plan, ... }
 */

import { sql } from "@/lib/db";
import { checkRateLimit, getClientIp, type RateLimitConfig } from "@/lib/rateLimit";

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

type AuthResult = AuthSuccess | AuthFailure;

/** Sentinel value for unlimited quota (no monthly cap) */
const UNLIMITED = 999_999;

/** Plan limits — generations per month */
export const PLAN_LIMITS: Record<string, { generations: number; edits: number }> = {
  free: { generations: 1, edits: 3 },
  creator: { generations: 15, edits: 100 },
  pro: { generations: 50, edits: 500 },
  agency: { generations: 200, edits: UNLIMITED },
  enterprise: { generations: UNLIMITED, edits: UNLIMITED },
  unlimited: { generations: UNLIMITED, edits: UNLIMITED },
};

/** Rate limits per plan — requests per minute */
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: { limit: 5, windowMs: 60_000 },
  creator: { limit: 15, windowMs: 60_000 },
  pro: { limit: 30, windowMs: 60_000 },
  agency: { limit: 60, windowMs: 60_000 },
  enterprise: { limit: 120, windowMs: 60_000 },
  unlimited: { limit: 120, windowMs: 60_000 },
};

/**
 * Authenticate a request by checking the x-user-email header or API key.
 * Returns the user from the database with their real plan.
 *
 * For unauthenticated requests (no header), applies free-tier rate limits by IP.
 */
export async function authenticateRequest(
  request: Request,
  opts?: { requireAuth?: boolean; requireVerified?: boolean }
): Promise<AuthResult> {
  const email = request.headers.get("x-user-email");
  const apiKey = request.headers.get("x-api-key");
  const ip = getClientIp(request);

  // If no auth provided, treat as anonymous free user with IP rate limit
  if (!email && !apiKey) {
    if (opts?.requireAuth) {
      return {
        user: null,
        error: Response.json(
          { error: "Authentication required. Please sign in." },
          { status: 401 }
        ),
      };
    }

    // Anonymous user — apply strict IP-based rate limit
    const rl = checkRateLimit(`anon:${ip}`, RATE_LIMITS.free);
    if (!rl.allowed) {
      return {
        user: null,
        error: Response.json(
          { error: "Rate limit exceeded. Sign up for higher limits.", remaining: 0, resetAt: rl.resetAt },
          { status: 429 }
        ),
      };
    }

    return {
      user: { email: `anon-${ip}`, plan: "free", role: "user", subscription_status: null },
      error: null,
    };
  }

  // Look up user in database
  try {
    let rows;
    if (apiKey) {
      // API key auth — stored in user settings or a separate table
      // For now, look up by email encoded in the key
      rows = await sql`SELECT email, plan, role, subscription_status, email_verified FROM users WHERE email = ${email} LIMIT 1`;
    } else if (email) {
      rows = await sql`SELECT email, plan, role, subscription_status, email_verified FROM users WHERE email = ${email} LIMIT 1`;
    }

    if (!rows || rows.length === 0) {
      // User not in DB — treat as free tier (they signed up client-side but haven't been created in DB yet)
      return {
        user: { email: email || `anon-${ip}`, plan: "free", role: "user", subscription_status: null },
        error: null,
      };
    }

    const user = rows[0] as AuthUser;

    // Check subscription status — past_due or canceled means free tier
    if (user.subscription_status === "canceled" || user.subscription_status === "past_due") {
      user.plan = "free";
    }

    // Block unverified email users from generating (OAuth users are auto-verified)
    if (opts?.requireVerified && !user.email_verified) {
      return {
        user: null,
        error: Response.json(
          {
            error: "Please verify your email before building. Check your inbox for the verification link.",
            code: "EMAIL_NOT_VERIFIED",
          },
          { status: 403 }
        ),
      };
    }

    // Apply rate limit for this user's plan
    const planKey = user.plan in RATE_LIMITS ? user.plan : "free";
    const rl = checkRateLimit(`user:${user.email}`, RATE_LIMITS[planKey]);
    if (!rl.allowed) {
      return {
        user: null,
        error: Response.json(
          { error: "Rate limit exceeded. Please wait before making more requests.", remaining: 0, resetAt: rl.resetAt },
          { status: 429 }
        ),
      };
    }

    return { user, error: null };
  } catch {
    // DB unavailable — fall back to free tier with rate limit
    const rl = checkRateLimit(`fallback:${ip}`, RATE_LIMITS.free);
    if (!rl.allowed) {
      return {
        user: null,
        error: Response.json(
          { error: "Rate limit exceeded.", remaining: 0 },
          { status: 429 }
        ),
      };
    }
    return {
      user: { email: email || `anon-${ip}`, plan: "free", role: "user", subscription_status: null },
      error: null,
    };
  }
}

/**
 * Check if a user has remaining quota for the current month.
 * Returns { allowed, used, limit } or an error Response.
 */
export async function checkUsageQuota(
  email: string,
  plan: string,
  type: "generation" | "edit"
): Promise<{ allowed: boolean; used: number; limit: number; error?: Response }> {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const limit = type === "generation" ? limits.generations : limits.edits;

  // Unlimited plans skip the check
  if (limit >= UNLIMITED) {
    return { allowed: true, used: 0, limit };
  }

  try {
    const rows = await sql`
      SELECT count FROM usage_tracking
      WHERE email = ${email}
        AND usage_type = ${type}
        AND month = DATE_TRUNC('month', NOW())
      LIMIT 1
    `;

    const used = rows.length > 0 ? (rows[0].count as number) : 0;

    if (used >= limit) {
      return {
        allowed: false,
        used,
        limit,
        error: Response.json(
          {
            error: `Monthly ${type} limit reached (${used}/${limit}). Upgrade your plan for more.`,
            used,
            limit,
            plan,
            upgradeUrl: "/pricing",
          },
          { status: 403 }
        ),
      };
    }

    return { allowed: true, used, limit };
  } catch {
    // DB unavailable — allow the request but don't track
    return { allowed: true, used: 0, limit };
  }
}

/**
 * Increment usage counter after a successful generation or edit.
 */
export async function trackUsage(email: string, type: "generation" | "edit"): Promise<void> {
  // Skip tracking for anonymous users
  if (email.startsWith("anon-")) return;

  try {
    await sql`
      INSERT INTO usage_tracking (email, usage_type, month, count)
      VALUES (${email}, ${type}, DATE_TRUNC('month', NOW()), 1)
      ON CONFLICT (email, usage_type, month)
      DO UPDATE SET count = usage_tracking.count + 1, updated_at = NOW()
    `;
  } catch (err) {
    console.error("[Usage tracking] Failed to increment:", err);
  }
}
