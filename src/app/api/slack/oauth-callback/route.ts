import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/slack-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error: "slack_oauth_denied", message: error },
      { status: 400 },
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "missing_params", message: "code and state are required" },
      { status: 400 },
    );
  }

  const cookieState = req.cookies.get("slack_oauth_state")?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.json(
      { error: "invalid_state", message: "OAuth state mismatch — possible CSRF" },
      { status: 400 },
    );
  }

  try {
    const team = await handleOAuthCallback(code, state);
    const origin = req.nextUrl.origin;
    const res = NextResponse.redirect(
      `${origin}/admin?slack=connected&team=${encodeURIComponent(team.team_name)}`,
      302,
    );
    res.cookies.delete("slack_oauth_state");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "slack_oauth_failed", message },
      { status: 500 },
    );
  }
}
