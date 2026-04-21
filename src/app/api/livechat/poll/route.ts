import { NextRequest, NextResponse } from "next/server";
import { pollMessages } from "@/lib/live-chat";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = Number(searchParams.get("conversationId"));
    const sinceId = Number(searchParams.get("sinceId") ?? "0");
    const wait = Math.min(Number(searchParams.get("wait") ?? "20000"), 25000);

    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      return NextResponse.json(
        { error: "conversationId required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const messages = await pollMessages(
      conversationId,
      Number.isFinite(sinceId) ? sinceId : 0,
      Number.isFinite(wait) ? wait : 20000
    );
    const lastId = messages.length > 0 ? messages[messages.length - 1].id : sinceId;
    return NextResponse.json({ messages, lastId }, { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Poll failed";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
