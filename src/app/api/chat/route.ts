import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validateApiKey } from "@/lib/apiKey";

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

const SYSTEM_PROMPT = `You are ZOOBICON's elite AI editing assistant. The user has a generated HTML website and wants to make changes.

CRITICAL RULES:
- Output ONLY the complete updated HTML document. No markdown, no explanation, no backticks, no code fences.
- Start with <!DOCTYPE html> and end with </html>. The output MUST be a complete, valid HTML document.
- NEVER truncate, abbreviate, or skip sections. Every section, every style rule, every script block from the original MUST be preserved unless the user explicitly asks to remove it.
- Make ONLY the changes the user requests. Do not remove, reorganize, or "clean up" anything else.
- Preserve ALL existing: CSS custom properties, media queries, animations, keyframes, JavaScript, IntersectionObserver code, form validation, meta tags, JSON-LD, and responsive behavior.
- Preserve ALL existing sections in their original order.
- If the edit is cosmetic (colors, fonts, spacing, text), change ONLY those specific values.
- If adding a new section, match the existing design language exactly.
- Maintain all hover states, transitions, and micro-interactions.
- NEVER output partial HTML. The document must be complete from <!DOCTYPE html> to </html>.`;

export const maxDuration = 120; // Allow up to 2 minutes for large edits

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

    // Classify edit complexity to pick the right model + tokens
    const isSimpleEdit = /^(change|make|set|update|replace|switch)\s+(the\s+)?(color|colour|font|text|heading|title|background|bg|padding|margin|spacing|size|border)/i.test(instruction)
      || /^(change|replace|update)\s+["'].+["']\s+(to|with)\s+["']/i.test(instruction)
      || instruction.split(/\s+/).length <= 8;

    const userMessage = currentCode
      ? `Here is the current website HTML:\n\n${currentCode}\n\n---\n\nIMPORTANT: Output the COMPLETE updated HTML from <!DOCTYPE html> to </html>. Do NOT skip or truncate any sections.\n\nEdit instruction: ${instruction}`
      : `Create a website with this requirement: ${instruction}`;

    // Simple edits (color/text changes) → Sonnet for speed
    // Complex edits (add sections, restructure) → Sonnet with higher tokens
    const model = "claude-sonnet-4-6";
    const maxTokens = isSimpleEdit ? 32000 : 64000;

    let stream;
    try {
      stream = await getClient().messages.stream({
        model,
        max_tokens: maxTokens,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
    } catch (apiErr: unknown) {
      const isAuthError =
        apiErr instanceof Anthropic.AuthenticationError ||
        (apiErr instanceof Error && apiErr.message.includes("authentication"));
      if (isAuthError) {
        return new Response(
          JSON.stringify({ error: "AI service is temporarily unavailable. The site owner needs to update their API key." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
      throw apiErr;
    }

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
