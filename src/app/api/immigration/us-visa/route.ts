/**
 * POST /api/immigration/us-visa
 *
 * US Visa specialist endpoints:
 * - EB-2 NIW Dhanasar analysis
 * - O-1 Extraordinary Ability analysis
 * - USCIS Evidence Classification
 * - Premium Processing advisor
 * - Boilerplate RFE matching
 */

import { NextResponse } from "next/server";
import {
  analyzeEB2NIW,
  analyzeO1,
  classifyEvidence,
  advisePremiumProcessing,
  findMatchingRFEs,
} from "@/lib/us-visa-compliance";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    switch (action) {
      case "analyze-niw": {
        const { proposedEndeavor, candidateBackground } = body;
        if (!proposedEndeavor) {
          return NextResponse.json({ error: "proposedEndeavor is required" }, { status: 400 });
        }
        const result = analyzeEB2NIW(proposedEndeavor, candidateBackground ?? {});
        return NextResponse.json({ success: true, analysis: result });
      }

      case "analyze-o1": {
        const { candidateEvidence, jobDuties, salary, isPerformingArts } = body;
        if (!candidateEvidence || !jobDuties) {
          return NextResponse.json({ error: "candidateEvidence and jobDuties required" }, { status: 400 });
        }
        const result = analyzeO1(candidateEvidence, jobDuties, salary ?? 0, isPerformingArts ?? false);
        return NextResponse.json({ success: true, analysis: result });
      }

      case "classify-evidence": {
        const { documents } = body;
        if (!documents?.length) {
          return NextResponse.json({ error: "documents array required" }, { status: 400 });
        }
        const result = classifyEvidence(documents);
        return NextResponse.json({ success: true, classifications: result });
      }

      case "premium-advice": {
        const { visaType, overallConfidence, rfeRisk, hasUrgentDeadline } = body;
        if (!visaType || overallConfidence === undefined) {
          return NextResponse.json({ error: "visaType and overallConfidence required" }, { status: 400 });
        }
        const result = advisePremiumProcessing(visaType, overallConfidence, rfeRisk ?? "medium", hasUrgentDeadline ?? false);
        return NextResponse.json({ success: true, advice: result });
      }

      case "match-rfe": {
        const { rfeText } = body;
        if (!rfeText) {
          return NextResponse.json({ error: "rfeText is required" }, { status: 400 });
        }
        const matches = findMatchingRFEs(rfeText);
        return NextResponse.json({ success: true, matches, total: matches.length });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use: analyze-niw, analyze-o1, classify-evidence, premium-advice, match-rfe` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: `US visa analysis failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
