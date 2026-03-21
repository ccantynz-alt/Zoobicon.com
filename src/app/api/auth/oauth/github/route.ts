import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return Response.json({ error: "GitHub OAuth not configured" }, { status: 503 });
  }

  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/callback/github`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user user:email",
    state,
  });

  const redirectUrl = `https://github.com/login/oauth/authorize?${params}`;
  const response = Response.redirect(redirectUrl);
  response.headers.append(
    "Set-Cookie",
    `zoobicon_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`
  );
  return response;
}
