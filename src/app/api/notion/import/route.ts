/**
 * POST /api/notion/import — fetch a Notion page's properties + top-
 * level blocks and compose a builder prompt that turns Notion content
 * into a published site.
 *
 * Body: { url }
 * Returns: { ok, import, prompt, builderHref }
 *
 * Requires NOTION_TOKEN env var AND the integration must be SHARED
 * with the target page (Notion's permission model — no token alone
 * can read a page; access is per-page-per-integration).
 */

import { NextResponse } from "next/server";
import { importNotionPage, composeNotionBuilderPrompt } from "@/lib/notion-import";

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
    const imp = await importNotionPage(url);
    if (!imp.ok) {
      return NextResponse.json({ ok: false, import: imp, reason: imp.reason }, { status: 200 });
    }
    const prompt = composeNotionBuilderPrompt(imp);
    return NextResponse.json({
      ok: true,
      import: imp,
      prompt,
      builderHref: `/builder?prompt=${encodeURIComponent(prompt)}&from=notion`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Notion import failed" },
      { status: 502 }
    );
  }
}
