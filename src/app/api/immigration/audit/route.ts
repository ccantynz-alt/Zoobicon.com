/**
 * POST /api/immigration/audit
 *
 * Audit Trail Reporter: generates EU AI Act compliant audit reports.
 */

import { NextResponse } from "next/server";
import { runAuditTrailReporter } from "@/lib/immigration-agents";
import { assessEligibility } from "@/lib/immigration-compliance";
import type { Matter } from "@/lib/immigration-compliance";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matter } = body as { matter: Matter };

    if (!matter) {
      return NextResponse.json({ error: "matter is required" }, { status: 400 });
    }

    // Run eligibility first to generate audit trail from
    const eligibilityResults = assessEligibility(matter);
    const result = await runAuditTrailReporter(matter, eligibilityResults);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Audit report generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report: result.data,
      executionTimeMs: result.executionTimeMs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Audit failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
