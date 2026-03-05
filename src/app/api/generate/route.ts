import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are ZOOBICON, the most advanced AI website builder on the planet.
You generate complete, single-file HTML websites based on user descriptions.

RULES:
- Output ONLY valid HTML. No markdown, no explanation, no backticks.
- Include all CSS inline in a <style> tag.
- Include all JavaScript inline in a <script> tag.
- Use modern CSS (grid, flexbox, custom properties, animations, transitions).
- Make designs visually striking — bold colors, smooth animations, clean typography.
- Use Google Fonts via CDN link for beautiful typography.
- The output must be a complete, self-contained HTML document.
- Make it responsive (works on mobile and desktop).
- Include hover effects, micro-interactions, and smooth transitions.
- Use semantic HTML5 elements.
- Add proper meta tags for SEO.
- NEVER include any text before or after the HTML. Just the HTML.`;

export async function POST(request: NextRequest) {
  try {
    const { prompt, template } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "A prompt is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const userMessage = template
      ? `Build me a website based on this template style: "${template}". User requirements: ${prompt}`
      : `Build me a website: ${prompt}`;

    const stream = await client.messages.stream({
      model: "claude-sonnet-4-6",
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
              const chunk = event.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`)
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
    console.error("Generation error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
