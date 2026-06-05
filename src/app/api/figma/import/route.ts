/**
 * POST /api/figma/import — fetch a Figma file's top-level frames
 * and compose a builder prompt that recreates them as React.
 *
 * Body: { url }
 * Returns: { ok, import, prompt, builderHref }
 *
 * Requires FIGMA_TOKEN env var. Returns ok: false with a clear
 * setup message when unset.
 */

import { NextResponse } from "next/server";
import { importFigmaFile, composeFigmaBuilderPrompt } from "@/lib/figma-import";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });
  }

  try {
    const imp = await importFigmaFile(url);
    if (!imp.ok) {
      return NextResponse.json({ ok: false, import: imp, reason: imp.reason }, { status: 200 });
    }
    const prompt = composeFigmaBuilderPrompt(imp);
    return NextResponse.json({
      ok: true,
      import: imp,
      prompt,
      builderHref: `/builder?prompt=${encodeURIComponent(prompt)}&from=figma`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Figma import failed" },
      { status: 502 }
    );
  }
}
