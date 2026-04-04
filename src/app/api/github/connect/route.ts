import { NextRequest, NextResponse } from "next/server";
import { getGitHubUser } from "@/lib/github-sync";

/**
 * GET /api/github/connect
 *
 * Check whether the user has a valid GitHub connection.
 * Reads the HttpOnly cookie set during OAuth callback.
 * Returns { connected, user } or { connected: false }.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("zoobicon_github_token")?.value;

  if (!token) {
    return NextResponse.json({ connected: false });
  }

  try {
    const user = await getGitHubUser(token);
    return NextResponse.json({ connected: true, user });
  } catch {
    // Token is invalid or expired
    return NextResponse.json({ connected: false });
  }
}

/**
 * DELETE /api/github/connect
 *
 * Disconnect GitHub by clearing the token cookie.
 */
export async function DELETE() {
  const res = NextResponse.json({ disconnected: true });
  res.cookies.set("zoobicon_github_token", "", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
  });
  res.cookies.set("zoobicon_github_login", "", {
    path: "/",
    secure: true,
    sameSite: "lax",
    maxAge: 0,
  });
  return res;
}
