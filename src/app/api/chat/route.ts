import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validateApiKey } from "@/lib/apiKey";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are ZOOBICON's AI editing assistant. The user has a generated HTML website and wants to make changes to it.

RULES:
- You will receive the current HTML code and a user instruction for changes.
- Output ONLY the complete updated HTML. No markdown, no explanation, no backticks.
- Preserve all existing structure and styles unless the user asks to change them.
- Make only the changes the user requests.
- Keep the code clean and well-organized.
- Maintain responsiveness.
- NEVER include any text before or after the HTML. Just the complete updated HTML.`;

export async function POST(request: NextRequest) {
  // API key auth — valid zbk_live_ key gets higher rate limit
  const bearerKey = request.headers.get("authorization")?.replace("Bearer ", "").trim() || "";
  const apiKeyResult = bearerKey ? await validateApiKey(bearerKey) : null;
  const isApiKeyRequest = apiKeyResult?.valid === true;

  // Rate limit: 20 edits/min for browsers, 120/min for valid API key holders
  const ip = getClientIp(request);
  const rateLimitId = isApiKeyRequest ? `chat:key:${bearerKey.slice(-8)}` : `chat:${ip}`;
  const rateLimit = isApiKeyRequest ? { limit: 120, windowMs: 60_000 } : { limit: 20, windowMs: 60_000 };
  const rl = checkRateLimit(rateLimitId, rateLimit);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment and try again." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rl.resetAt),
          "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const { currentCode, instruction } = await request.json();

    if (!instruction || typeof instruction !== "string") {
      return new Response(JSON.stringify({ error: "An instruction is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const userMessage = currentCode
      ? `Here is the current website HTML:\n\n${currentCode}\n\nPlease make this change: ${instruction}`
      : `Create a website with this requirement: ${instruction}`;

    const stream = await client.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: event.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", content: message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    console.error("Chat error:", err);
    const message = err instanceof Error ? err.message : "Chat failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
