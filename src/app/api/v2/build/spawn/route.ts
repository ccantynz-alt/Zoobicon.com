/**
 * POST /api/v2/build/spawn — the parallel-spawn engine (v3).
 *
 * Generates a design brief, then spawns every section concurrently against it
 * (see lib/v2/ai-spawn.ts). ~30–40s for a full bespoke page instead of ~200s,
 * Opus-per-section, and a fresh creative direction each build.
 *
 * Body: { prompt, variationHint? }
 * Returns: { ok, engine: "spawn" | "ai" | "registry", html, ... }
 *
 * Reliability: spawn → (on failure) the whole-page engine generateAiSite()
 * → the deterministic registry render. A complete page always comes back; the
 * preview is never blank.
 */

import { NextRequest } from "next/server";
import { spawnSite } from "@/lib/v2/ai-spawn";
import { generateAiSite } from "@/lib/v2/ai-site";
import { renderFromRegistry, detectIndustry } from "@/lib/v2/render-page";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest): Promise<Response> {
  let body: { prompt?: string; variationHint?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return Response.json({ ok: false, error: "Describe the site you want." }, { status: 400 });
  }

  // PRIMARY: parallel-spawn (design brief → concurrent section builders).
  const spawn = await spawnSite({ prompt, variationHint: body.variationHint });
  if (spawn.ok) {
    return Response.json({
      ok: true,
      engine: "spawn",
      html: spawn.html,
      brandName: spawn.brief.brandName,
      industry: spawn.brief.industry || detectIndustry(prompt),
      sectionCount: spawn.sectionCount,
      model: spawn.model,
    });
  }

  // FALLBACK 1: the whole-page engine (single bespoke HTML doc).
  const ai = await generateAiSite({ prompt });
  if (ai.ok) {
    return Response.json({
      ok: true,
      engine: "ai",
      html: ai.html,
      model: ai.model,
      industry: detectIndustry(prompt),
      note: spawn.reason,
    });
  }

  // FALLBACK 2 (never blank): deterministic registry render.
  try {
    const page = await renderFromRegistry({ prompt });
    return Response.json({
      ok: true,
      engine: "registry",
      html: page.html,
      componentIds: page.componentIds,
      industry: page.industry,
      aiUsed: page.aiUsed,
      note: spawn.reason,
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Build failed.", spawnReason: spawn.reason },
      { status: 500 },
    );
  }
}
