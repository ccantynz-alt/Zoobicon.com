import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message?: unknown;
  history?: unknown;
}

function isHistoryArray(v: unknown): v is HistoryMessage[] {
  if (!Array.isArray(v)) return false;
  return v.every(
    (m) =>
      m &&
      typeof m === "object" &&
      (m as { role?: unknown }).role !== undefined &&
      ((m as { role: unknown }).role === "user" ||
        (m as { role: unknown }).role === "assistant") &&
      typeof (m as { content?: unknown }).content === "string",
  );
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ botId: string }> },
): Promise<Response> {
  const { botId } = await params;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Chatbot is not configured. Set ANTHROPIC_API_KEY in the Zoobicon environment variables.",
      },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { ok: false, error: "Message is required." },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  if (message.length > 4000) {
    return NextResponse.json(
      { ok: false, error: "Message is too long (max 4000 characters)." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const history: HistoryMessage[] = isHistoryArray(body.history)
    ? body.history.slice(-20)
    : [];

  const system = `You are a helpful customer support agent for the website (bot id: ${botId}). Be concise (2-4 sentences max), friendly, and direct. If you don't know an answer, say so and offer to escalate to a human.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system,
      messages: [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: message },
      ],
    });

    const reply = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!reply) {
      return NextResponse.json(
        {
          ok: false,
          error: "The assistant returned an empty reply. Please try again.",
        },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { ok: true, reply },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        {
          ok: false,
          error: `Claude API error (${err.status ?? "unknown"}): ${err.message}`,
        },
        { status: 502, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json(
      { ok: false, error: `Chatbot failed: ${msg}` },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
