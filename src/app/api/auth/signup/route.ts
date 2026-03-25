import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { notifyNewSignup } from "@/lib/admin-notify";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { logAudit } from "@/lib/audit";
import { createResetToken } from "@/lib/resetToken";
import { sendViaMailgun } from "@/lib/mailgun";

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

    // Send verification email (fire-and-forget — don't block signup response)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zoobicon.com";
    createResetToken(user.email).then((token) => {
      const verifyLink = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
      sendViaMailgun({
        from: `Zoobicon <noreply@${process.env.MAILGUN_DOMAIN || "zoobicon.com"}>`,
        to: user.email,
        subject: "Verify your Zoobicon account",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; color: #1a1a2e; margin-bottom: 8px;">Welcome to Zoobicon${user.name ? `, ${user.name}` : ""}!</h1>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">Click the button below to verify your email and start building websites with AI.</p>
            <a href="${verifyLink}" style="display: inline-block; background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 24px 0;">Verify Email</a>
            <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't create an account, ignore this email.</p>
          </div>
        `,
        tags: ["email-verification"],
      }).catch((err) => console.error("[Signup] Failed to send verification email:", err));
    }).catch((err) => console.error("[Signup] Failed to create verification token:", err));

    return Response.json({
      user: {
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        email_verified: false,
      },
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return Response.json({ error: "Signup failed" }, { status: 500 });
  }
}
