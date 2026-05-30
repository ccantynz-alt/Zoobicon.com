/**
 * /api/audit/run — AI Site Audit (Sprint 3 T1).
 *
 * POST { url } → audit report with overall score + per-category
 * (performance / SEO / accessibility / conversion) score + pass/fail
 * lists. Extends the URL extractor from /upgrade with a scoring layer.
 *
 * Used by the /audit page UI. The "Rebuild with these fixes" CTA
 * on the report points at /builder with a prompt composed from the
 * audit's failed checks.
 */

import { NextResponse } from "next/server";
import { extractFromUrl, scoreAudit, composeBuilderPrompt } from "@/lib/seo/url-extractor";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { url: string }" },
      { status: 400 }
    );
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  try {
    const extraction = await extractFromUrl(url);
    const report = scoreAudit(extraction);
    const builderPrompt = composeBuilderPrompt(extraction);
    return NextResponse.json({
      ok: true,
      report,
      builderHref: `/builder?prompt=${encodeURIComponent(builderPrompt)}&from=audit`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Audit failed",
      },
      { status: 502 }
    );
  }
}
