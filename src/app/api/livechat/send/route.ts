import { NextRequest, NextResponse } from "next/server";
import { sendMessage, startConversation, type ChatSender } from "@/lib/live-chat";

export const dynamic = "force-dynamic";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

interface SendBody {
  conversationId?: number;
  sender?: string;
  body?: string;
  siteId?: string;
  visitorId?: string;
  visitorEmail?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const data = (await req.json()) as SendBody;
    const senderRaw = data.sender;
    const sender: ChatSender =
      senderRaw === "agent" || senderRaw === "ai" ? senderRaw : "visitor";
    const body = (data.body ?? "").toString().trim();

    if (!body) {
      return NextResponse.json(
        { error: "body required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    if (body.length > 4000) {
      return NextResponse.json(
        { error: "message too long" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let conversationId = Number(data.conversationId);
    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      const siteId = (data.siteId ?? "default").toString();
      const visitorId = (data.visitorId ?? "anon").toString();
      const conv = await startConversation(siteId, visitorId, data.visitorEmail);
      conversationId = conv.id;
    }

    const result = await sendMessage(conversationId, sender, body);
    return NextResponse.json(
      {
        message: result.message,
        autoReplyTriggered: result.autoReplyTriggered,
        conversationId,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
