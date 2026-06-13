/**
 * POST /api/v2/build/ai/refine — self-review & auto-fix pass (move #2).
 *
 * Takes a freshly built page and runs the senior-design-director review pass
 * (see reviewAndImproveAiSite in lib/v2/ai-site.ts), returning an improved
 * version. The builder calls this in the BACKGROUND after first paint and
 * hot-swaps the result, so it adds no perceived wait. Best-effort: if there's
 * no usable improvement it responds ok:false and the client simply keeps the
 * page it already has — the refine can only ever help, never regress.
 *
 * Body: { html, prompt, brandName? }
 * Returns: { ok, html?, model?, reason? }  (always HTTP 200 — refine is optional)
 */

import { NextRequest } from "next/server";
import { reviewAndImproveAiSite } from "@/lib/v2/ai-site";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest): Promise<Response> {
  let body: { html?: string; prompt?: string; brandName?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, reason: "Invalid JSON body." });
  }

  const html = (body.html || "").trim();
  const prompt = (body.prompt || "").trim();
  if (!html || !prompt) {
    return Response.json({ ok: false, reason: "Need both html and prompt." });
  }

  const r = await reviewAndImproveAiSite({ html, prompt, brandName: body.brandName });
  if (!r.ok) {
    // Not an error condition — the client keeps the page it already has.
    return Response.json({ ok: false, reason: r.reason });
  }
  return Response.json({ ok: true, html: r.html, model: r.model });
}
