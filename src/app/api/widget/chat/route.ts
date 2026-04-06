import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * POST /api/widget/chat
 *
 * AI chatbot endpoint for the drop-in customer widget.
 * Customers embed /widget.js on their site and this endpoint handles
 * the actual Claude calls.
 *
 * Body: {
 *   siteId: string,           // customer's site identifier
 *   message: string,          // user's message
 *   history?: Array<{role, content}>, // previous messages
 *   context?: string,         // site description / knowledge base
 *   name?: string,            // bot name (defaults to "Assistant")
 * }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      siteId,
      message,
      history = [],
      context = "",
      name = "Assistant",
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI chat is being configured. Please try again shortly." },
        { status: 503, headers: CORS_HEADERS }
      );
    }

    // Basic rate limiting: cap message length
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message too long. Keep it under 2000 characters." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are ${name}, a friendly customer support assistant for this website. Answer questions helpfully and concisely (2-3 sentences unless more detail is needed).

${context ? `Context about the business:\n${context}\n` : ""}

Rules:
- Be warm, professional, and helpful.
- If you don't know the answer, say so and offer to connect the user with a human.
- Never make up information. Only answer based on the context above.
- Keep responses conversational — this is a chat widget, not a documentation page.
- If asked about pricing or custom quotes, offer to take the user's email for follow-up.
- Never reveal that you're powered by Claude or Anthropic. You are simply "${name}".`;

    // Sanitize history — only allow user/assistant roles with text content
    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            (m: unknown): m is { role: string; content: string } =>
              typeof m === "object" &&
              m !== null &&
              "role" in m &&
              "content" in m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-10) // only last 10 messages to save tokens
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        ...safeHistory,
        { role: "user", content: message },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text") as
      | { type: "text"; text: string }
      | undefined;
    const reply = textBlock?.text || "I'm sorry, I didn't quite catch that. Could you rephrase?";

    return NextResponse.json(
      {
        reply,
        siteId: siteId || null,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    console.error("[widget/chat] error:", message);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
