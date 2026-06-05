/**
 * POST /api/wordpress/import — import an existing WordPress site
 * and return a structured snapshot plus a builder prompt.
 *
 * Body: { url }
 * Returns: { ok, import, prompt, builderHref }
 *
 * On failure (wp-json disabled, site down, etc.) returns ok: false
 * with a reason and points the caller at /upgrade as the fallback.
 */

import { NextResponse } from "next/server";
import {
  importWordPressSite,
  composeWordPressBuilderPrompt,
} from "@/lib/wordpress-import";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body. Expected { url: string }" },
      { status: 400 }
    );
  }

  const url = body.url?.trim();
  if (!url) {
    return NextResponse.json(
      { ok: false, error: "url required" },
      { status: 400 }
    );
  }

  try {
    const imp = await importWordPressSite(url);
    if (!imp.ok) {
      return NextResponse.json(
        {
          ok: false,
          import: imp,
          reason: imp.reason,
          fallback: "/upgrade",
        },
        { status: 200 } // not an error — wp-json may be disabled; UI handles
      );
    }

    const prompt = composeWordPressBuilderPrompt(imp);
    return NextResponse.json({
      ok: true,
      import: imp,
      prompt,
      builderHref: `/builder?prompt=${encodeURIComponent(prompt)}&from=wordpress`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Import failed",
        fallback: "/upgrade",
      },
      { status: 502 }
    );
  }
}
