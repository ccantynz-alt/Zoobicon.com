/**
 * GET /api/v2/diag — builder engine diagnostics.
 *
 * Confirms, against the LIVE Anthropic key, which model IDs the API actually
 * accepts and whether the whole-page engine produces a real page — so we can
 * verify the builder instead of guessing (the build sandbox has no key).
 *
 *   /api/v2/diag           → cheap: probes each candidate model with a tiny call
 *   /api/v2/diag?full=1     → also runs one real build through generateAiSite
 *   /api/v2/diag?prompt=... → custom prompt for the full build
 *
 * Returns JSON. Never exposes the API key itself.
 */

import { NextRequest } from "next/server";
import { callClaude } from "@/lib/anthropic-cached";
import { generateAiSite } from "@/lib/v2/ai-site";

export const runtime = "nodejs";
export const maxDuration = 300;

const PROBE_MODELS = ["claude-opus-4-8", "claude-opus-4-7", "claude-sonnet-4-6"];

export async function GET(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const full = url.searchParams.get("full") === "1";
  const prompt = url.searchParams.get("prompt") || "a small artisan coffee roastery in Wellington";
  const keyPresent = Boolean(process.env.ANTHROPIC_API_KEY);

  // 1) Which model IDs does the live API actually accept? (tiny, cheap calls)
  const models: Array<Record<string, unknown>> = [];
  for (const model of PROBE_MODELS) {
    const t = Date.now();
    try {
      const r = await callClaude({
        model,
        system: "Reply with the single word OK.",
        messages: [{ role: "user", content: "OK" }],
        maxTokens: 16,
        temperature: 0,
      });
      models.push({
        model,
        ok: true,
        ms: Date.now() - t,
        reply: (r.content.find((b) => b.type === "text")?.text || "").slice(0, 40),
      });
    } catch (e) {
      const err = e as Error & { status?: number };
      models.push({
        model,
        ok: false,
        ms: Date.now() - t,
        status: err.status,
        error: (err.message || "").slice(0, 300),
      });
    }
  }

  // 2) Optionally run the real builder engine once (more expensive).
  let engine: Record<string, unknown> | null = null;
  if (full) {
    const t = Date.now();
    const site = await generateAiSite({ prompt });
    engine = site.ok
      ? { ok: true, model: site.model, ms: Date.now() - t, htmlLength: site.html.length, htmlHead: site.html.slice(0, 140) }
      : { ok: false, ms: Date.now() - t, reason: site.reason };
  }

  return Response.json(
    { keyPresent, prompt: full ? prompt : "(pass ?full=1 to run a real build)", models, engine },
    { headers: { "Cache-Control": "no-store" } },
  );
}
