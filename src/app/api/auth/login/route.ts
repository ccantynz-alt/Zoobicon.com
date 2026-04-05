import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

const loginLimiter = { limit: 5, windowMs: 60000 };

/* Admin credentials — MUST be set via environment variables. No hardcoded defaults. */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, resetAt } = checkRateLimit(`login:${ip}`, loginLimiter);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return Response.json(
        { error: "Too many login attempts. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    // ── Admin login (env-based, no database needed) ──
    const adminEmail = ADMIN_EMAIL;
    const adminPassword = ADMIN_PASSWORD;

    if (
      email.toLowerCase() === adminEmail.toLowerCase() &&
      password === adminPassword
    ) {
      logAudit({ action: "login", email: adminEmail, ip, metadata: { role: "admin" } }).catch(() => {});
      return Response.json({
        user: {
          email: adminEmail,
          name: "Admin",
          role: "admin",
          plan: "unlimited",
        },
      });
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
