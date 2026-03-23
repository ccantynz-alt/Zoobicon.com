import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { notifyNewSignup } from "@/lib/admin-notify";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";

const signupLimiter = { limit: 3, windowMs: 60000 };

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, resetAt } = checkRateLimit(`signup:${ip}`, signupLimiter);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return Response.json(
        { error: "Too many signup attempts. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const { name, email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password required" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!/[A-Z]/.test(password)) {
      return Response.json({ error: "Password must contain an uppercase letter" }, { status: 400 });
    }

    if (!/\d/.test(password)) {
      return Response.json({ error: "Password must contain a number" }, { status: 400 });
    }

    // Check if user already exists
    const [existing] = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (existing) {
      // Return same shape as success to prevent email enumeration
      return Response.json({
        user: { email: email.toLowerCase(), name: name || "", role: "user", plan: "free" },
      });
    }

    const passwordHash = await hashPassword(password);

    const [user] = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email.toLowerCase()}, ${name || ""}, ${passwordHash})
      RETURNING id, email, name, role, plan
    `;

    // Notify admin of new signup (fire-and-forget, don't block response)
    notifyNewSignup({ email: user.email, name: user.name }).catch(() => {});
    logAudit({ action: "signup", email: user.email, ip, metadata: { name: user.name } }).catch(() => {});

    return Response.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return Response.json({ error: "Signup failed" }, { status: 500 });
  }
}
