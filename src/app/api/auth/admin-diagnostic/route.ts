import { NextResponse } from "next/server";

/**
 * GET /api/auth/admin-diagnostic
 *
 * Safe diagnostic for the admin login path. Never exposes the actual
 * email or password — only length + configured-state. Use this to
 * quickly tell the difference between:
 *   - "I typed the wrong password"
 *   - "Vercel never had ADMIN_EMAIL set"
 *   - "Vercel has ADMIN_PASSWORD with a trailing newline that breaks ==="
 */
export async function GET() {
  const rawEmail = process.env.ADMIN_EMAIL ?? "";
  const rawPassword = process.env.ADMIN_PASSWORD ?? "";

  const trimmedEmail = rawEmail.trim();
  const trimmedPassword = rawPassword.trim();

  return NextResponse.json({
    adminEmail: {
      configured: trimmedEmail.length > 0,
      length: trimmedEmail.length,
      hasWhitespace: rawEmail !== trimmedEmail,
      // Only reveal the domain part so you can confirm which account, not the local part
      domainHint: trimmedEmail.includes("@") ? trimmedEmail.split("@")[1] : null,
    },
    adminPassword: {
      configured: trimmedPassword.length > 0,
      length: trimmedPassword.length,
      hasWhitespace: rawPassword !== trimmedPassword,
      hasTrailingNewline: rawPassword.endsWith("\n") || rawPassword.endsWith("\r"),
      hasLeadingQuote: rawPassword.startsWith('"') || rawPassword.startsWith("'"),
      hasTrailingQuote: rawPassword.endsWith('"') || rawPassword.endsWith("'"),
    },
    oauth: {
      google: {
        clientIdSet: !!process.env.GOOGLE_CLIENT_ID,
        clientSecretSet: !!process.env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientIdSet: !!process.env.GITHUB_CLIENT_ID,
        clientSecretSet: !!process.env.GITHUB_CLIENT_SECRET,
      },
    },
    tip: !trimmedEmail
      ? "ADMIN_EMAIL is NOT set in Vercel — admin login cannot work until you add it."
      : !trimmedPassword
      ? "ADMIN_PASSWORD is NOT set in Vercel — add it and redeploy."
      : rawEmail !== trimmedEmail || rawPassword !== trimmedPassword
      ? "Env vars have leading/trailing whitespace. Vercel: delete the var, re-add it without stray spaces/newlines, redeploy."
      : "Env vars look clean. If login still fails, double-check the exact characters of your password — case matters.",
  });
}
