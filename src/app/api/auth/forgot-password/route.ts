import { NextRequest } from "next/server";
import { createResetToken } from "@/lib/resetToken";
import { sendViaMailgun } from "@/lib/mailgun";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { emailTemplate } from "@/lib/email-template";

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
      from: `Zoobicon <noreply@${process.env.MAILGUN_DOMAIN || "zoobicon.com"}>`,
      to: email,
      subject: "Reset your Zoobicon password",
      html: emailTemplate({
        heading: "Reset your password",
        body: "We received a request to reset the password for your Zoobicon account. Click the button below to choose a new password.",
        buttonText: "Reset Password",
        buttonUrl: resetUrl,
        footerNote: "This link expires in 1 hour. If you didn't request this, you can safely ignore this email.",
      }),
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
