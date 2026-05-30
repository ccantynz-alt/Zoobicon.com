/**
 * GET /api/share/[code] — fetch a shared build by its 10-char code.
 * Returns { ok, build } or 404 if the code is unknown / expired.
 * Side-effect: increments view_count on each read.
 */

import { NextResponse } from "next/server";
import { getSharedBuild } from "@/lib/shared-builds";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json(
      { ok: false, error: "code required" },
      { status: 400 }
    );
  }
  try {
    const build = await getSharedBuild(code);
    if (!build) {
      return NextResponse.json(
        { ok: false, error: "Shared build not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, build });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
