import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "Google OAuth not configured" }, { status: 503 });
  }

  const origin = req.nextUrl.origin;
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
  const response = Response.redirect(redirectUrl);
  response.headers.append(
    "Set-Cookie",
    `zoobicon_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`
  );
  return response;
}
