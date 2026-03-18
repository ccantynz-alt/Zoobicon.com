/**
 * POST /api/immigration/intake
 *
 * Smart Intake: parses CV/LinkedIn profile text into structured candidate data.
 * Uses AI (Haiku for speed) with rule-based fallback.
 */

import { NextResponse } from "next/server";
import { runSmartIntake } from "@/lib/immigration-agents";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cvText } = body as { cvText: string };

    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: "CV text must be at least 50 characters" },
        { status: 400 }
      );
    }

    const result = await runSmartIntake(cvText);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Intake parsing failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      candidate: result.data,
      executionTimeMs: result.executionTimeMs,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Intake failed: ${String(error)}` },
      { status: 500 }
    );
  }
}
