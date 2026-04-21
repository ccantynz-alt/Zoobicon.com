import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

const loginLimiter = { limit: 5, windowMs: 60000 };

/**
 * Sanitize env vars. Vercel env vars frequently pick up invisible characters:
 * trailing newlines, zero-width BOM, wrapping quotes from copy-paste, etc.
 * A single stray byte silently breaks string equality and locks admin out.
 * THE IRON LAW: admin must never be locked out.
 */
function sanitizeEnv(raw: string | undefined): string {
  if (!raw) return "";
  let v = raw.trim();
  // Strip UTF-8 BOM
  if (v.charCodeAt(0) === 0xfeff) v = v.slice(1);
  // Strip wrapping single/double quotes
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  // Strip any remaining control chars (but keep normal printable + space)
  v = v.replace(/[\u0000-\u001f\u007f]/g, "");
  return v.trim();
}

/* Admin credentials — MUST be set via environment variables. No hardcoded defaults. */
const ADMIN_EMAIL = sanitizeEnv(process.env.ADMIN_EMAIL).toLowerCase();
const ADMIN_PASSWORD = sanitizeEnv(process.env.ADMIN_PASSWORD);
/**
 * Emergency recovery token. Craig controls Vercel env vars — he ALWAYS has a
 * path back in by setting this and using it as the password on his own email.
 * If only this is set (no ADMIN_PASSWORD), it becomes the admin password.
 */
const ADMIN_RECOVERY_TOKEN = sanitizeEnv(process.env.ADMIN_RECOVERY_TOKEN);

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, resetAt } = await checkRateLimit(`login:${ip}`, loginLimiter);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return Response.json(
        { error: "Too many login attempts. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    // ── Admin login (env-based, no database needed) ──
    // Input email is already .trim()'d above. Compare lowercase on both sides.
    const inputEmail = email.toLowerCase();
    const inputPassword = password.trim();

    if (ADMIN_EMAIL && inputEmail === ADMIN_EMAIL) {
      // If NEITHER admin password nor recovery token is set, return a clear
      // 503 so Craig can tell the difference between "password wrong" and
      // "server not configured".
      if (!ADMIN_PASSWORD && !ADMIN_RECOVERY_TOKEN) {
        return Response.json(
          {
            error:
              "Admin login is not configured on this server. Set ADMIN_PASSWORD (or ADMIN_RECOVERY_TOKEN) in Vercel env vars.",
          },
          { status: 503 }
        );
      }

      const passwordMatches = ADMIN_PASSWORD && inputPassword === ADMIN_PASSWORD;
      const recoveryMatches = ADMIN_RECOVERY_TOKEN && inputPassword === ADMIN_RECOVERY_TOKEN;

      if (passwordMatches || recoveryMatches) {
        logAudit({
          action: "login",
          email: ADMIN_EMAIL,
          ip,
          metadata: { role: "admin", via: recoveryMatches ? "recovery_token" : "password" },
        }).catch(() => {});
        return Response.json({
          user: {
            email: ADMIN_EMAIL,
            name: "Admin",
            role: "admin",
            plan: "unlimited",
          },
        });
      }
      // Admin email matched but password did not — log + fall through to 401
      logAudit({
        action: "login_failed",
        email: ADMIN_EMAIL,
        ip,
        metadata: { reason: "admin_wrong_password" },
      }).catch(() => {});
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ── Regular user login (database) ──
    try {
      const [user] = await sql`
        SELECT id, email, name, role, plan, password_hash
        FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
      `;

      if (!user || !user.password_hash) {
        logAudit({ action: "login_failed", email: email.toLowerCase(), ip, metadata: { reason: "user_not_found" } }).catch(() => {});
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        logAudit({ action: "login_failed", email: email.toLowerCase(), ip, metadata: { reason: "wrong_password" } }).catch(() => {});
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }

      logAudit({ action: "login", email: user.email, ip, metadata: { role: user.role } }).catch(() => {});
      return Response.json({
        user: {
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
        },
      });
    } catch (dbErr) {
      console.error("Database unavailable for login:", dbErr);
      // If DB is down, only admin can log in (already handled above)
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }
  } catch (err) {
    console.error("Login error:", err);
    return Response.json({ error: "Auth error" }, { status: 500 });
  }
}
