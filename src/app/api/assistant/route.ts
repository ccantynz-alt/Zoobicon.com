/**
 * /api/assistant — streaming chat endpoint for Craig's private Claude interface.
 *
 * Replaces 4× Claude.ai subscriptions ($499/mo each = $1,996/mo) with direct
 * Anthropic API access at ~$3-15 per million tokens. Expected savings: >90%.
 *
 * Internal use only — gated by ADMIN_CHAT_TOKEN env when configured.
 * NOT linked in public nav. This lives next to /api/chat (which edits HTML
 * documents for the builder) so the names are kept distinct.
 */

import { NextRequest } from "next/server";
import { streamClaude, type ClaudeMessage } from "@/lib/anthropic-cached";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MODELS = {
  opus: "claude-opus-4-6",
  sonnet: "claude-sonnet-4-6",
  haiku: "claude-haiku-4-5",
} as const;

type ModelKey = keyof typeof MODELS;

interface AssistantRequestBody {
  messages: ClaudeMessage[];
  model?: ModelKey | string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_SYSTEM = `You are Claude, Anthropic's helpful AI assistant, running inside Craig's private Zoobicon workspace.

Respond in clear, well-structured markdown. Use fenced code blocks with language tags for all code. Be direct, accurate, and pragmatic — no filler, no unnecessary disclaimers. When the user asks for code, return working code. When they ask a question, answer it.`;

function authorized(req: NextRequest): boolean {
  const required = process.env.ADMIN_CHAT_TOKEN;
  // If no token is configured, allow — makes local dev frictionless.
  if (!required) return true;
  const provided =
    req.headers.get("x-chat-token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";
  return provided === required;
}

function resolveModel(input?: string): string {
  if (!input) return MODELS.sonnet;
  if (input in MODELS) return MODELS[input as ModelKey];
  return input; // allow explicit model ids like "claude-opus-4-6"
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let body: AssistantRequestBody;
  try {
    body = (await req.json()) as AssistantRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array required" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "ANTHROPIC_API_KEY is not configured on the server.",
      }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const model = resolveModel(body.model);
  const system = (body.system && body.system.trim()) || DEFAULT_SYSTEM;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        for await (const delta of streamClaude({
          model,
          system,
          messages: body.messages,
          maxTokens: body.maxTokens ?? 4096,
          temperature: body.temperature ?? 0.7,
          stream: true,
        })) {
          if (delta.type === "text" && delta.text) {
            send({ type: "text", text: delta.text });
          } else if (delta.type === "done") {
            send({ type: "done", usage: delta.usage });
          } else if (delta.type === "error") {
            send({ type: "error", error: delta.error });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send({ type: "error", error: message });
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
