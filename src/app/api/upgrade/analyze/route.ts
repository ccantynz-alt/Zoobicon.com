/**
 * /api/upgrade/analyze — fetch an existing website, extract brand
 * signals, return analysis + a composed prompt that the builder can
 * use to generate a modernized version.
 *
 * This is the front-door endpoint for the URL clone-and-upgrade
 * funnel. Stateless; no DB writes. Designed to feed the /upgrade
 * page UI: paste URL → see what we found → click "Build modernized
 * version" → redirect to /builder with the prompt prefilled.
 *
 * Why we don't auto-build here: keeping analyze and build as separate
 * steps lets the user review what we extracted (and the user-visible
 * "we noticed X" list) before committing to a 60-second generation.
 * Higher trust, higher conversion.
 */

import { NextResponse } from "next/server";
import { extractFromUrl, composeBuilderPrompt } from "@/lib/seo/url-extractor";

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
    const prompt = composeBuilderPrompt(extraction);
    return NextResponse.json({
      ok: true,
      extraction,
      prompt,
      // Builder URL with prompt prefilled — the "Build modernized version" CTA target
      builderHref: `/builder?prompt=${encodeURIComponent(prompt)}&from=upgrade`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to analyze URL",
      },
      { status: 502 }
    );
  }
}
