/**
 * POST /api/v2/build/ai — Builder V2's quality engine.
 *
 * The model designs + writes a complete, bespoke website for the prompt and
 * returns a finished, self-contained HTML document (see lib/v2/ai-site.ts for
 * the why). The client shows that HTML directly in the preview iframe — no
 * in-browser transpile/module-load, so it can't hit the WebKit/iPad blank-
 * preview failures.
 *
 * Reliability contract: this route ALWAYS tries to return a complete page.
 * If AI generation fails for any reason (no key, transient outage, truncated
 * output), it falls back to the deterministic registry render — the old
 * engine acting purely as a never-blank safety net.
 *
 * Body: { prompt, brandName? }
 * Returns: { ok, engine: "ai" | "registry", html, model?, industry, ... }
 *
 * Runtime is nodejs (the registry fallback uses react-dom/server + the TS
 * transpiler). maxDuration is generous because a full-page design pass is a
 * single large model call.
 */

import { NextRequest } from "next/server";
import { generateAiSite } from "@/lib/v2/ai-site";
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
  if (!prompt) {
    return Response.json({ ok: false, error: "Describe the site you want." }, { status: 400 });
  }

  // PRIMARY: the model designs and writes the whole page → finished HTML.
  const ai = await generateAiSite({ prompt, brandName: body.brandName });
  if (ai.ok) {
    return Response.json({
      ok: true,
      engine: "ai",
      model: ai.model,
      html: ai.html,
      industry: detectIndustry(prompt),
    });
  }

  // FALLBACK (never blank): the deterministic registry render. Works with or
  // without an AI key — it's the old engine kept purely as a safety net.
  try {
    const page = await renderFromRegistry({ prompt, brandName: body.brandName });
    return Response.json({
      ok: true,
      engine: "registry",
      html: page.html,
      componentIds: page.componentIds,
      industry: page.industry,
      aiUsed: page.aiUsed,
      note: ai.reason,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Build failed unexpectedly.",
        aiReason: ai.reason,
      },
      { status: 500 },
    );
  }
}
