import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { verifyResetToken } from "@/lib/resetToken";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new Response(redirectHtml("Invalid Link", "No verification token provided.", "/auth/signup"), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const result = await verifyResetToken(token);

    if (!result.valid || !result.email) {
      const reason = result.reason === "expired"
        ? "This verification link has expired. Please request a new one."
        : "This verification link is invalid. Please request a new one.";

      return new Response(redirectHtml("Verification Failed", reason, "/auth/verify-email?expired=true"), {
        status: 400,
        headers: { "Content-Type": "text/html" },
      });
    }

    // Mark email as verified in database
    await sql`
      UPDATE users
      SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
      WHERE email = ${result.email}
    `;

    // Redirect to login with success message
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://zoobicon.com";
    return Response.redirect(`${baseUrl}/auth/login?verified=true`, 302);
  } catch (err) {
    console.error("[Verify Email] Error:", err);
    return new Response(redirectHtml("Error", "Something went wrong. Please try again.", "/auth/signup"), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}

/** Simple HTML page that shows a message and auto-redirects */
function redirectHtml(title: string, message: string, redirectUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title} — Zoobicon</title>
<meta http-equiv="refresh" content="3;url=${redirectUrl}">
<style>body{font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;color:#fff;margin:0}
.card{text-align:center;max-width:400px;padding:40px}h1{font-size:24px;margin-bottom:12px}p{color:#94a3b8;font-size:16px;line-height:1.6}
a{color:#818cf8;text-decoration:none}</style></head>
<body><div class="card"><h1>${title}</h1><p>${message}</p><p>Redirecting... <a href="${redirectUrl}">Click here</a> if not redirected.</p></div></body></html>`;
}
