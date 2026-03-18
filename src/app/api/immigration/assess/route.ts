/**
 * POST /api/immigration/assess
 *
 * Core endpoint: runs the Cross-Border Ghost Processor.
 * Takes a matter and returns multi-jurisdictional eligibility assessment.
 */

import { NextResponse } from "next/server";
import { assessEligibility, detectConflictsOfLaw } from "@/lib/immigration-compliance";
import type { Matter } from "@/lib/immigration-compliance";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matter } = body as { matter: Matter };

    if (!matter || !matter.candidate || !matter.targetJurisdictions?.length) {
      return NextResponse.json(
        { error: "Missing required fields: matter with candidate and targetJurisdictions" },
        { status: 400 }
      );
    }

    // Run eligibility assessment across all target jurisdictions
    const eligibilityResults = assessEligibility(matter);
    const conflicts = detectConflictsOfLaw(eligibilityResults);

    // Determine best path
    const eligible = eligibilityResults.filter((r) => r.eligible);
    const bestPath = eligible.length > 0
      ? eligible.sort((a, b) => b.confidence - a.confidence)[0]
      : null;

    return NextResponse.json({
      success: true,
      results: eligibilityResults,
      conflicts,
      bestPath: bestPath
        ? {
            jurisdiction: bestPath.jurisdiction,
            visaCategory: bestPath.visaCategory,
            visaCategoryName: bestPath.visaCategoryName,
            confidence: bestPath.confidence,
          }
        : null,
      summary: {
        jurisdictionsAssessed: eligibilityResults.length,
        eligibleCount: eligible.length,
        conflictsDetected: conflicts.length,
        highestConfidence: eligible.length > 0 ? Math.max(...eligible.map((r) => r.confidence)) : 0,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Assessment failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
