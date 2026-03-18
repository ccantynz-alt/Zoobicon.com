/**
 * POST /api/immigration/evidence
 *
 * Evidence Generator: produces jurisdiction-specific legal letters.
 */

import { NextResponse } from "next/server";
import { runEvidenceGenerator } from "@/lib/immigration-agents";
import type { Matter, Jurisdiction } from "@/lib/immigration-compliance";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matter, jurisdiction, letterType } = body as {
      matter: Matter;
      jurisdiction: Jurisdiction;
      letterType: "support" | "cover";
    };

    if (!matter || !jurisdiction || !letterType) {
      return NextResponse.json(
        { error: "matter, jurisdiction, and letterType are required" },
        { status: 400 }
      );
    }

    const result = await runEvidenceGenerator(matter, jurisdiction, letterType);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Evidence generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      letter: result.data,
      executionTimeMs: result.executionTimeMs,
      model: result.model,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Evidence generation failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
