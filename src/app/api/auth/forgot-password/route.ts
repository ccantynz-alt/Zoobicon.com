import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { createResetToken } from "@/lib/resetToken";
import { sql } from "@/lib/db";
import { sendViaMailgun } from "@/lib/mailgun";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { emailTemplate } from "@/lib/email-template";

const resetLimiter = { limit: 2, windowMs: 60000 };

// 1-hour TTL for reset tokens. Must match the embedded HMAC expiry in
// createResetToken so both enforcement paths agree.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Best-effort stamp of the reset token hash + expiry on the users row.
 * - Idempotently adds the columns if they don't exist (safe ALTER).
 * - Only updates rows that already exist, so we never reveal whether the
 *   email is registered.
 * - Swallows errors so a DB hiccup can't block the actual reset email.
 */
async function stampResetToken(email: string, token: string): Promise<void> {
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_hash       TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ`;
    const expires = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await sql`
      UPDATE users
      SET reset_token_hash = ${hashToken(token)},
          reset_token_expires_at = ${expires},
          updated_at = NOW()
      WHERE email = ${email}
    `;
  } catch (err) {
    console.warn(
      "[forgot-password] Could not stamp reset token on users row:",
      err instanceof Error ? err.message : err
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { allowed, resetAt } = await checkRateLimit(`reset:${ip}`, resetLimiter);
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
    const normalizedEmail = email.toLowerCase().trim();
    const token = await createResetToken(normalizedEmail);
    // Persist the hashed token + expiry so the reset-password route can
    // enforce single-use and short TTL even if the HMAC is still valid.
    await stampResetToken(normalizedEmail, token);
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
