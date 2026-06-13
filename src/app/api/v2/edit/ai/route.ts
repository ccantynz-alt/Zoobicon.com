/**
 * POST /api/v2/edit/ai — conversational refine for AI-built pages.
 *
 * The page produced by /api/v2/build/ai is a single self-contained HTML
 * document, so a refine ("make the hero darker", "add a contact section")
 * is applied to the whole document: the model returns the full updated page
 * and the client hot-swaps it into the preview iframe.
 *
 * Body: { html, instruction }
 * Returns: { ok, html, model } | { ok:false, error }
 */

import { NextRequest } from "next/server";
import { editAiSite } from "@/lib/v2/ai-site";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest): Promise<Response> {
  let body: { html?: string; instruction?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const html = (body.html || "").trim();
  const instruction = (body.instruction || "").trim();
  if (!html) return Response.json({ ok: false, error: "No page to edit yet." }, { status: 400 });
  if (!instruction) return Response.json({ ok: false, error: "Tell me what to change." }, { status: 400 });

  const r = await editAiSite({ html, instruction });
  if (!r.ok) {
    return Response.json(
      { ok: false, error: r.reason || "That change didn't land — try rewording it." },
      { status: 502 },
    );
  }
  return Response.json({ ok: true, html: r.html, model: r.model });
}
