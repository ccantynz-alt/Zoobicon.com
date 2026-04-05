import { NextRequest, NextResponse } from "next/server";
import { handleChatbotMessage } from "@/lib/chatbot-builder";

/**
 * POST /api/chatbot/[chatbotId]/message
 *
 * Called by the embeddable widget on customer websites.
 * Receives visitor messages and returns AI-powered replies.
 *
 * CORS enabled — widget runs on any domain.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params;
    const body = await request.json();
    const { messages, conversationId, visitorEmail } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Get the latest user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user" || !lastMessage.content) {
      return NextResponse.json(
        { error: "Last message must be a user message with content" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await handleChatbotMessage(
      chatbotId,
      conversationId || null,
      lastMessage.content,
      visitorEmail
    );

    return NextResponse.json(
      { reply: result.reply, conversationId: result.conversationId },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process message";

    if (message === "Chatbot not found") {
      return NextResponse.json(
        { error: "Chatbot not found or inactive" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    console.error("[chatbot-message]", error);
    return NextResponse.json(
      { reply: "I'm having trouble connecting right now. Please try again in a moment." },
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
