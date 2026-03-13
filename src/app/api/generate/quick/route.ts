import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { injectComponentLibrary } from "@/lib/component-library";

/**
 * POST /api/generate/quick — Bulletproof single-call generation
 *
 * This is the last-resort fallback when pipeline-stream and stream endpoints
 * fail to produce body content. It uses:
 * - Sonnet (fast, reliable)
 * - A radically simplified prompt that forces body-first output
 * - Streaming SSE for real-time preview
 * - No multi-agent overhead
 *
 * Trade-off: slightly lower quality than the 7-agent Opus pipeline,
 * but guaranteed to produce visible content.
 */

export const maxDuration = 120;

const QUICK_SYSTEM = `You are an expert web developer. Build a complete, beautiful HTML page.

YOUR OUTPUT MUST FOLLOW THIS EXACT STRUCTURE:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Page Title]</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
  <style>
    /* MAX 50 lines of CSS. Use :root for colors. Keep it minimal. */
  </style>
</head>
<body>
  <!-- WRITE ALL OF THIS — IT IS YOUR PRIMARY OUTPUT -->
  <nav>...</nav>
  <section class="hero">...</section>
  <section class="features">...</section>
  <section class="about">...</section>
  <section class="testimonials">...</section>
  <section class="cta">...</section>
  <footer>...</footer>
  <script>/* mobile menu, smooth scroll */</script>
</body>
</html>

RULES:
- The <body> is 85% of your output. CSS is just colors, fonts, and basic layout.
- Images: https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT (use descriptive keywords)
- Every section has REAL text content — headlines, descriptions, specific numbers
- Match the industry aesthetic (luxury = light + serif, tech = modern + sans-serif)
- Output ONLY raw HTML. No markdown. No code fences. Start with <!DOCTYPE html>.
- An empty <body> is UNACCEPTABLE.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, model: requestedModel } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "A prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Use Sonnet for reliability. Opus is higher quality but sometimes produces empty body.
    const model = requestedModel || "claude-sonnet-4-6";
    const client = new Anthropic({ apiKey, timeout: 90_000 });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = client.messages.stream({
            model,
            max_tokens: 16000,
            system: QUICK_SYSTEM,
            messages: [{
              role: "user",
              content: `Build a stunning website for: ${prompt}\n\nInclude: navigation, hero with headline and CTA, features/services grid, about section, testimonials with specific results, call-to-action, and footer with contact info.\n\nStart IMMEDIATELY with <!DOCTYPE html>. Output raw HTML only.`,
            }],
          });

          let accumulated = "";

          for await (const ev of stream) {
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              accumulated += ev.delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: ev.delta.text })}\n\n`)
              );
            }
          }

          // Clean up
          let html = accumulated.trim();
          html = html.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
          const ds = html.search(/<!doctype\s+html|<html/i);
          if (ds > 0) html = html.slice(ds);
          const he = html.lastIndexOf("</html>");
          if (he !== -1) html = html.slice(0, he + "</html>".length);

          // Inject component library
          html = injectComponentLibrary(html);

          // Send final version
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "replace", content: html })}\n\n`)
          );
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Quick generation error";
          console.error("[Quick] Error:", message);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`)
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
  } catch (err) {
    console.error("[Quick] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
