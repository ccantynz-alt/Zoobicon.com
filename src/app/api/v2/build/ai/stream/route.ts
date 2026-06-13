/**
 * POST /api/v2/build/ai/stream — streaming whole-page build (SSE).
 *
 * Streams the page as the model writes it so the builder can show the site
 * being designed live ("watch it build"), and the system prompt is cached
 * (anthropic-cached auto-applies prompt caching), so repeat builds start
 * faster and cost a fraction. Two speed wins in one route.
 *
 * SSE events (each `data: {json}\n\n`):
 *   { type: "delta", text }                      — a chunk of HTML as written
 *   { type: "done", engine, html, model?, ... }  — the final validated page
 *   { type: "error", error }                     — nothing usable (rare)
 *
 * Reliability: streamClaude hits Anthropic directly (no cross-provider
 * failover), so on ANY streaming failure this route falls back to the
 * non-streaming generateAiSite() (which DOES fail over Opus → Sonnet → other
 * providers) and then to the deterministic registry render. A "done" event is
 * always emitted with a complete page — the preview is never blank.
 */

import { NextRequest } from "next/server";
import { streamAiSite, generateAiSite } from "@/lib/v2/ai-site";
import { renderFromRegistry, detectIndustry } from "@/lib/v2/render-page";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest): Promise<Response> {
  let body: { prompt?: string; brandName?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  const brandName = body.brandName;
  if (!prompt) {
    return Response.json({ ok: false, error: "Describe the site you want." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          /* controller already closed */
        }
      };

      let done = false;
      try {
        for await (const ev of streamAiSite({ prompt, brandName })) {
          if (ev.type === "delta") {
            send({ type: "delta", text: ev.text });
          } else if (ev.type === "result") {
            send({
              type: "done",
              engine: "ai",
              html: ev.html,
              model: ev.model,
              industry: detectIndustry(prompt),
            });
            done = true;
          } else if (ev.type === "error") {
            // Hand off to the fallback chain below.
            throw new Error(ev.reason);
          }
        }
        if (!done) throw new Error("stream produced no page");
      } catch {
        // FALLBACK 1: non-streaming AI (has cross-provider failover).
        try {
          const ai = await generateAiSite({ prompt, brandName });
          if (ai.ok) {
            send({
              type: "done",
              engine: "ai",
              html: ai.html,
              model: ai.model,
              industry: detectIndustry(prompt),
            });
            done = true;
          }
        } catch {
          /* fall through to registry */
        }
        // FALLBACK 2 (never blank): deterministic registry render.
        if (!done) {
          try {
            const page = await renderFromRegistry({ prompt, brandName });
            send({
              type: "done",
              engine: "registry",
              html: page.html,
              componentIds: page.componentIds,
              industry: page.industry,
              aiUsed: page.aiUsed,
            });
            done = true;
          } catch (e) {
            send({ type: "error", error: e instanceof Error ? e.message : "Build failed." });
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
