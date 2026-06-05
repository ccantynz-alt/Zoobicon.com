/**
 * /api/intel/hn/digest — return the latest digest (no auth — admin
 * dashboard reads this).
 */

import { NextResponse } from "next/server";
import { getLatestDigest, ensureHnTables } from "@/lib/hn-flywheel";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureHnTables();
    const digest = await getLatestDigest();
    return NextResponse.json({ digest });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
