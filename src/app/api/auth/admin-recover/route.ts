import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

/**
 * Emergency admin recovery endpoint.
 *
 * THE IRON LAW: admin must never be locked out.
 *
 * Craig controls Vercel env vars — so he ALWAYS has a guaranteed path back
 * into the admin dashboard. This endpoint accepts a single env-configured
 * recovery token and, if valid, returns an admin session payload the client
 * can write into localStorage.
 *
 * To use:
 *   1. Set ADMIN_RECOVERY_TOKEN in Vercel (any long random string)
 *   2. Set ADMIN_EMAIL in Vercel (the admin email, case-insensitive)
 *   3. Visit /admin/recover and paste the token
 *
 * This intentionally does NOT touch the database so it works even if
 * Neon is down. It's the "break glass" path.
 */

function sanitizeEnv(raw: string | undefined): string {
  if (!raw) return "";
  let v = raw.trim();
  if (v.charCodeAt(0) === 0xfeff) v = v.slice(1);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  v = v.replace(/[\u0000-\u001f\u007f]/g, "");
  return v.trim();
}

const ADMIN_EMAIL = sanitizeEnv(process.env.ADMIN_EMAIL).toLowerCase();
const ADMIN_RECOVERY_TOKEN = sanitizeEnv(process.env.ADMIN_RECOVERY_TOKEN);

// Tighter rate limit than login — this is a break-glass endpoint
const recoverLimiter = { limit: 3, windowMs: 60_000 };

/**
 * Constant-time string compare. Prevents timing attacks against the token.
 */
function safeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, resetAt } = checkRateLimit(`admin-recover:${ip}`, recoverLimiter);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return Response.json(
        { error: "Too many recovery attempts. Please wait a minute." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    if (!ADMIN_EMAIL) {
      return Response.json(
        {
          error:
            "Recovery is not configured on this server. Set ADMIN_EMAIL in Vercel environment variables.",
        },
        { status: 503 }
      );
    }
    if (!ADMIN_RECOVERY_TOKEN) {
      return Response.json(
        {
          error:
            "Recovery is not configured on this server. Set ADMIN_RECOVERY_TOKEN in Vercel environment variables (any long random string), then try again.",
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return Response.json({ error: "Recovery token required" }, { status: 400 });
    }

    if (!safeEqual(token, ADMIN_RECOVERY_TOKEN)) {
      logAudit({
        action: "admin_recover_failed",
        email: ADMIN_EMAIL,
        ip,
        metadata: { reason: "bad_token" },
      }).catch(() => {});
      return Response.json({ error: "Invalid recovery token" }, { status: 401 });
    }

    logAudit({
      action: "admin_recover",
      email: ADMIN_EMAIL,
      ip,
      metadata: { via: "recovery_token" },
    }).catch(() => {});

    return Response.json({
      user: {
        email: ADMIN_EMAIL,
        name: "Admin",
        role: "admin",
        plan: "unlimited",
      },
    });
  } catch (err) {
    console.error("Admin recover error:", err);
    return Response.json({ error: "Recovery failed" }, { status: 500 });
  }
}

/**
 * GET reports configuration status — lets Craig confirm the env vars are
 * live without exposing the actual token value.
 */
export async function GET() {
  return Response.json({
    configured: Boolean(ADMIN_EMAIL && ADMIN_RECOVERY_TOKEN),
    adminEmailSet: Boolean(ADMIN_EMAIL),
    recoveryTokenSet: Boolean(ADMIN_RECOVERY_TOKEN),
  });
}
