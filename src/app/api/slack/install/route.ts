import { NextResponse } from "next/server";
import crypto from "crypto";
import { getInstallUrl } from "@/lib/slack-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const state = crypto.randomBytes(16).toString("hex");
    const url = getInstallUrl(state);
    const res = NextResponse.redirect(url, 302);
    res.cookies.set("slack_oauth_state", state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "slack_install_failed", message },
      { status: 500 },
    );
  }
}
