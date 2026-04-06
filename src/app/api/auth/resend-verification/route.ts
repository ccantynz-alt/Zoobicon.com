import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { createResetToken } from "@/lib/resetToken";
import { sendViaMailgun } from "@/lib/mailgun";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { emailTemplate } from "@/lib/email-template";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`resend-verify:${ip}`, { limit: 1, windowMs: 120_000 });
    if (!allowed) {
      return Response.json(
        { error: "Please wait 2 minutes before requesting another verification email." },
        { status: 429 }
      );
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists and is not already verified
    const rows = await sql`SELECT email, name, email_verified FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`;
    if (rows.length === 0) {
      // Don't reveal whether email exists — return success either way
      return Response.json({ message: "If an account exists with that email, a verification link has been sent." });
    }

    const user = rows[0];
    if (user.email_verified) {
      return Response.json({ message: "Your email is already verified. You can sign in." });
    }

    // Generate new token and send email
    const token = await createResetToken(user.email);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zoobicon.com";
    const verifyLink = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

    await sendViaMailgun({
      from: `Zoobicon <noreply@${process.env.MAILGUN_DOMAIN || "zoobicon.com"}>`,
      to: user.email,
      subject: "Verify your Zoobicon account",
      html: emailTemplate({
        heading: "Verify your email",
        body: "Click the button below to verify your email and start building websites with AI.",
        buttonText: "Verify Email",
        buttonUrl: verifyLink,
        footerNote: "This link expires in 1 hour.",
      }),
      tags: ["email-verification-resend"],
    });

    return Response.json({ message: "Verification email sent. Check your inbox." });
  } catch (err) {
    console.error("[Resend Verification] Error:", err);
    return Response.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}
