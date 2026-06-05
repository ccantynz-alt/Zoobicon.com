/**
 * POST /api/v2/build/stream — Builder V2 PROGRESSIVE build (SSE).
 *
 * The reliability of V2 (server-side render — the browser never transpiles
 * or module-loads generated code) plus the perceived speed of the fastest
 * competitors. Two phases over one Server-Sent-Events stream:
 *
 *   1. INSTANT BASE RENDER (no AI) — every selected $100K-registry component
 *      is rendered to static HTML on the server and streamed section-by-
 *      section. A complete, polished page is on screen in ~1-2s. No spinner.
 *
 *   2. PROGRESSIVE COPY TAILORING (AI, background) — each section's copy is
 *      rewritten by Sonnet to fit the business, then re-rendered and streamed
 *      as a hot-swap. The page sharpens in place; the user is never blocked.
 *
 * Events (each a JSON line, `data: {...}\n\n`):
 *   {type:"meta",  count, componentIds, industry, serif}
 *   {type:"section", index, html, ai}        // ai:false = base, ai:true = tailored
 *   {type:"done",  html, componentIds, industry, aiUsed}
 *   {type:"error", error}
 *
 * Falls back gracefully: a section that fails to render is simply omitted —
 * it can never blank the page. If no LLM key is set, phase 2 is skipped and
 * the polished base page is the result.
 *
 * Runtime is nodejs (react-dom/server + the TypeScript transpiler need it).
 */

import { NextRequest } from "next/server";
import {
  renderComponentToHtml,
  compileComponentToModule,
  aiRewriteCopy,
  detectIndustry,
  usesSerifHeadings,
  pageShell,
  sectionWrap,
} from "@/lib/v2/render-page";
import { selectComponentsForPrompt } from "@/lib/component-registry";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<Response> {
  let body: { prompt?: string; brandName?: string; useExampleFill?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt && !body.useExampleFill) {
    return Response.json(
      { ok: false, error: "Describe the site you want (or pass useExampleFill)." },
      { status: 400 },
    );
  }

  const brandName = (body.brandName || "").trim();
  const industry = detectIndustry(prompt);
  const components = selectComponentsForPrompt(prompt);

  const hasKey = Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY,
  );
  const doAi = !body.useExampleFill && hasKey;

  // Registry component code omits `import React`; the render pipeline prepends
  // it so each component renders in isolation.
  const baseCodeFor = (code: string) => `import React from "react";\n\n${code}\n`;

  const encoder = new TextEncoder();
  // Best HTML per index — base render first, overwritten by AI render if it
  // lands. Joined in order for the final `done` (clean deployable artifact).
  const finalSections: (string | undefined)[] = new Array(components.length);
  let aiUsed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        } catch {
          /* stream closed by client — ignore */
        }
      };

      try {
        send({
          type: "meta",
          count: components.length,
          componentIds: components.map((c) => c.id),
          industry,
          serif: usesSerifHeadings(industry),
          // The empty streaming shell (with the hot-swap listener script) so
          // the client can mount the iframe instantly without importing any
          // server-only render code.
          shell: pageShell("", brandName, { industry, streaming: true }),
        });

        // Compile a component to its live browser module — best-effort, since
        // hydration only enhances the static render (a null here just means
        // that section stays static, never broken).
        const compileLive = (code: string): string | undefined => {
          try {
            return compileComponentToModule(code);
          } catch {
            return undefined;
          }
        };

        // ── Phase 1: instant base render, streamed as each completes ──
        await Promise.all(
          components.map(async (c, index) => {
            const base = baseCodeFor(c.code);
            try {
              const html = await renderComponentToHtml(base);
              finalSections[index] = html;
              send({ type: "section", index, html: sectionWrap(index, html), ai: false, js: compileLive(base) });
            } catch {
              /* a single failed base section never blanks the page */
            }
          }),
        );

        // ── Phase 2: progressive AI copy tailoring, hot-swapped in place ──
        if (doAi) {
          await Promise.all(
            components.map(async (c, index) => {
              try {
                const base = baseCodeFor(c.code);
                const rewritten = await aiRewriteCopy(base, prompt, brandName, c.category);
                if (!rewritten) return;
                const html = await renderComponentToHtml(rewritten);
                finalSections[index] = html;
                aiUsed = true;
                send({ type: "section", index, html: sectionWrap(index, html), ai: true, js: compileLive(rewritten) });
              } catch {
                /* keep the polished base section — never regress */
              }
            }),
          );
        }

        const ordered = finalSections.filter((s): s is string => Boolean(s));
        send({
          type: "done",
          html: pageShell(ordered.join("\n"), brandName, { industry }),
          componentIds: components.map((c) => c.id),
          industry,
          aiUsed,
        });
      } catch (err) {
        send({ type: "error", error: err instanceof Error ? err.message : "Build failed." });
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
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
