/**
 * POST /api/v2/build/clone — faithfully copy an existing website.
 *
 * Extracts a URL from the prompt, fetches the real page, and recreates it
 * (see lib/v2/clone.ts). Returns { ok:false, noUrl:true } when there's no URL
 * so the builder falls back to a normal (creative) build, and { ok:false,
 * reason } when a clone genuinely couldn't be made.
 *
 * Body: { prompt }  Returns: { ok, engine:"clone", html, sourceUrl } | { ok:false, ... }
 */

import { NextRequest } from "next/server";
import { findUrlInPrompt, cloneSite } from "@/lib/v2/clone";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest): Promise<Response> {
  let body: { prompt?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const url = (body.url && body.url.trim()) || findUrlInPrompt(body.prompt || "");
  if (!url) return Response.json({ ok: false, noUrl: true });

  const r = await cloneSite(url);
  if (!r.ok) return Response.json({ ok: false, reason: r.reason, sourceUrl: url });
  return Response.json({ ok: true, engine: "clone", html: r.html, sourceUrl: r.sourceUrl, model: r.model });
}
