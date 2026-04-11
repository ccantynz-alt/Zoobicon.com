import { NextRequest, NextResponse } from "next/server";

/**
 * Google OAuth initiation.
 *
 * Same fix as the GitHub route: previous version used `Response.redirect()`
 * then tried to append Set-Cookie headers, which silently failed because
 * those Response objects are frozen. State cookie never reached the browser.
 *
 * Missing env var used to return JSON 503, which iOS Safari would download
 * instead of render. Now redirects to an HTML error page.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=google_oauth_not_configured`,
    );
  }

  const redirectUri = `${origin}/api/auth/callback/google`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
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
