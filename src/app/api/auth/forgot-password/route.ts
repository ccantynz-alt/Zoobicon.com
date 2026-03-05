import { NextRequest } from "next/server";

/**
 * Password reset request handler.
 *
 * Currently stubs the email send — wire up a real email provider before launch:
 *   - Resend (resend.com) — simplest, great Next.js support
 *   - SendGrid / Postmark / AWS SES
 *
 * Steps to complete:
 *  1. Install your email SDK, e.g. `npm install resend`
 *  2. Add RESEND_API_KEY (or equivalent) to .env.local and deployment env vars
 *  3. Replace the TODO block below with: send an email containing a signed JWT
 *     reset link (e.g. /auth/reset-password?token=<jwt>)
 *  4. Add a /auth/reset-password page that validates the token and updates the password
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // TODO: look up the user in your database here
    // TODO: generate a signed short-lived JWT reset token
    // TODO: send reset email via your email provider, e.g.:
    //   await resend.emails.send({
    //     from: "noreply@zoobicon.com",
    //     to: email,
    //     subject: "Reset your Zoobicon password",
    //     html: `<a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}">Reset password</a>`,
    //   });

    // Always return 200 — never reveal whether the address exists (security)
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
