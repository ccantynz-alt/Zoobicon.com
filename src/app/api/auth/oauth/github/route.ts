import { NextRequest, NextResponse } from "next/server";

/**
 * GitHub OAuth initiation.
 *
 * Law 8 fix: previous version used `Response.redirect()` then tried
 * `response.headers.append("Set-Cookie", ...)`. Response objects returned by
 * `Response.redirect()` are frozen by the Web Standards runtime Next.js uses,
 * so the cookie was either silently dropped or threw a TypeError. Result: the
 * state cookie never made it to the browser, every callback failed CSRF check,
 * and the user got dumped on `/auth/login?error=invalid_state`.
 *
 * Fix: use `NextResponse.redirect` which supports `.cookies.set()` — this
 * properly mutates the outgoing response headers.
 *
 * Also: when `GITHUB_OAUTH_CLIENT_ID` is missing we used to return JSON with
 * status 503. Mobile Safari / iOS browsers don't render JSON navigated to via
 * `window.location.href` — they download it. That's exactly the "download
 * mode" symptom Craig reported. Now we redirect to an HTML error page.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;

  if (!clientId) {
    // HTML redirect, not JSON — prevents mobile browsers treating the
    // error response as a downloadable file.
    return NextResponse.redirect(
      `${origin}/auth/login?error=github_oauth_not_configured`,
    );
  }

  const redirectUri = `${origin}/api/auth/callback/github`;
  const state = crypto.randomUUID();

  // "repo" scope: needed so users can push generated projects to their GitHub
  // "read:user user:email": needed for auth
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo read:user user:email",
    state,
  });

  const redirectUrl = `https://github.com/login/oauth/authorize?${params}`;
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("zoobicon_oauth_state", state, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 600,
  });

  return response;
}
