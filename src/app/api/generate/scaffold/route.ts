import { NextRequest, NextResponse } from "next/server";
import { classifyIntent, getInstantScaffold } from "@/lib/scaffold-matcher";

/**
 * POST /api/generate/scaffold — Instant scaffold endpoint
 *
 * Returns a pre-matched template scaffold in <100ms (no LLM calls).
 * The client shows this immediately while the full AI generation streams on top.
 *
 * Request:  { prompt: string }
 * Response: { scaffold: string | null, templateName: string, confidence: number, category: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body as { prompt?: string };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "A prompt is required." },
        { status: 400 }
      );
    }

    const trimmed = prompt.trim();

    // Classify intent (pure keyword matching, <1ms)
    const intent = classifyIntent(trimmed);

    // Get scaffold HTML if confidence is sufficient
    const result = getInstantScaffold(trimmed);

    if (result) {
      return NextResponse.json({
        scaffold: result.html,
        templateName: result.templateName,
        confidence: result.confidence,
        category: intent.category,
      });
    }

    // Confidence too low — let the full AI generate from scratch
    return NextResponse.json({
      scaffold: null,
      templateName: null,
      confidence: intent.confidence,
      category: intent.category,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
