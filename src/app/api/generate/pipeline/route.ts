import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/agents";

/**
 * Multi-Agent Pipeline API
 *
 * POST /api/generate/pipeline
 * Body: { prompt: string, style?: "modern"|"classic"|"bold"|"minimal" }
 *
 * Runs the full 4-agent pipeline:
 * Designer → Copywriter → Developer → QA
 *
 * Returns the final HTML plus agent metadata.
 */

export const maxDuration = 120; // Allow up to 2 minutes for full pipeline

export async function POST(req: NextRequest) {
  try {
    const { prompt, style } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A prompt is required" }, { status: 400 });
    }

    if (prompt.length > 5000) {
      return NextResponse.json({ error: "Prompt too long (max 5000 characters)" }, { status: 400 });
    }

    const result = await runPipeline({ prompt, style });

    return NextResponse.json({
      html: result.html,
      agents: result.agents.map((a) => ({
        name: a.agent,
        duration: a.duration,
      })),
      totalDuration: result.totalDuration,
      pipeline: true,
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
