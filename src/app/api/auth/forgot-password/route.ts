import { NextRequest } from "next/server";
import { createResetToken } from "@/lib/resetToken";
import { sendViaMailgun } from "@/lib/mailgun";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const resetLimiter = { limit: 2, windowMs: 60000 };

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, resetAt } = checkRateLimit(`reset:${ip}`, resetLimiter);
    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ error: "Too many password reset requests. Please try again in a minute." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) } }
      );
    }

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate a signed token (works without a database)
    const token = await createResetToken(email.toLowerCase().trim());
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    // Send via Mailgun
    await sendViaMailgun({
      from: "Zoobicon <noreply@zoobicon.com>",
      to: email,
      subject: "Reset your Zoobicon password",
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#09090f;color:#fff;border-radius:16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px">
            <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#1d4ed8);display:flex;align-items:center;justify-content:center">
              <span style="color:#fff;font-size:18px;font-weight:900">Z</span>
            </div>
            <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px">Zoobicon</span>
          </div>
          <h1 style="font-size:24px;font-weight:800;margin:0 0 8px">Reset your password</h1>
          <p style="color:rgba(255,255,255,0.5);margin:0 0 28px;line-height:1.6">
            We received a request to reset the password for your Zoobicon account.
            Click the button below to choose a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#2563eb,#0ea5e9);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px">
            Reset Password
          </a>
          <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:28px 0 0;line-height:1.6">
            If you didn&apos;t request this, you can safely ignore this email.
            Your password won&apos;t change until you click the link above and create a new one.
          </p>
        </div>
      `,
      tags: ["password-reset"],
    });

    // Always return 200 — never reveal whether the email exists
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
