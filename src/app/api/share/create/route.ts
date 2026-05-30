/**
 * POST /api/share/create — persist a builder snapshot and return a
 * shareable URL (Sprint 4 T9 full).
 *
 * Body: { prompt, files, brandSpec?, ttlDays? }
 * Returns: { ok, code, url }
 *
 * The 10-char code is enumeration-resistant. ttlDays: null/undefined
 * = never expires. Files capped at 2MB JSON payload.
 */

import { NextResponse } from "next/server";
import { createSharedBuild } from "@/lib/shared-builds";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

interface Body {
  prompt?: string;
  files?: Record<string, string>;
  brandSpec?: Record<string, unknown> | null;
  ttlDays?: number;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.prompt || !body.files || typeof body.files !== "object") {
    return NextResponse.json(
      { ok: false, error: "prompt and files required" },
      { status: 400 }
    );
  }

  try {
    const built = await createSharedBuild({
      prompt: body.prompt,
      files: body.files,
      brandSpec: body.brandSpec,
      ttlDays: body.ttlDays,
    });
    if (!built) {
      return NextResponse.json(
        { ok: false, error: "DATABASE_URL not set — share persistence disabled" },
        { status: 503 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";
    return NextResponse.json({
      ok: true,
      code: built.code,
      url: `${appUrl}/share/${built.code}`,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Share failed" },
      { status: 500 }
    );
  }
}
