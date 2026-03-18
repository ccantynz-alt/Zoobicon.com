/**
 * GET /api/immigration/regulatory
 *
 * Live-Law Syncer: returns latest regulatory updates across all jurisdictions.
 */

import { NextRequest, NextResponse } from "next/server";
import { runLiveLawSyncer } from "@/lib/immigration-agents";
import type { Jurisdiction } from "@/lib/immigration-compliance";

export async function GET(request: NextRequest) {
  try {
    const jurisdiction = request.nextUrl.searchParams.get("jurisdiction") as Jurisdiction | null;

    const result = await runLiveLawSyncer();

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error ?? "Failed to fetch regulatory updates" },
        { status: 500 }
      );
    }

    let updates = result.data;
    if (jurisdiction) {
      updates = updates.filter((u) => u.jurisdiction === jurisdiction);
    }

    return NextResponse.json({
      success: true,
      updates,
      total: updates.length,
      critical: updates.filter((u) => u.impactLevel === "critical").length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch updates: ${String(error)}` },
      { status: 500 }
    );
  }
}
