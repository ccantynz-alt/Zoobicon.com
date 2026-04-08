import { NextRequest, NextResponse } from "next/server";
import {
  handleSlashCommand,
  verifySlackSignature,
  type SlashCommandPayload,
} from "@/lib/slack-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await req.text();

    const headers: Record<string, string | undefined> = {};
    req.headers.forEach((v, k) => {
      headers[k] = v;
    });

    if (!verifySlackSignature(headers, rawBody)) {
      return NextResponse.json(
        { error: "invalid_signature", message: "Slack signature verification failed" },
        { status: 401 },
      );
    }

    const params = new URLSearchParams(rawBody);
    const payload: SlashCommandPayload = {
      token: params.get("token") ?? "",
      team_id: params.get("team_id") ?? "",
      team_domain: params.get("team_domain") ?? "",
      channel_id: params.get("channel_id") ?? "",
      channel_name: params.get("channel_name") ?? "",
      user_id: params.get("user_id") ?? "",
      user_name: params.get("user_name") ?? "",
      command: params.get("command") ?? "",
      text: params.get("text") ?? "",
      response_url: params.get("response_url") ?? "",
      trigger_id: params.get("trigger_id") ?? "",
    };

    if (!payload.team_id || !payload.command) {
      return NextResponse.json(
        { error: "invalid_payload", message: "Missing team_id or command" },
        { status: 400 },
      );
    }

    const response = await handleSlashCommand(payload);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        response_type: "ephemeral",
        text: `Slack command failed: ${message}`,
      },
      { status: 500 },
    );
  }
}
