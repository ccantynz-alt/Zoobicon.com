import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/agents";

/**
 * Multi-Agent Pipeline API v2
 *
 * POST /api/generate/pipeline
 * Body: {
 *   prompt: string,
 *   style?: "modern"|"classic"|"bold"|"minimal",
 *   tier?: "standard"|"premium"|"ultra"
 * }
 *
 * Tiers:
 * - standard (default): 6-agent pipeline (Strategist → Brand+Copy → Architect → Developer → QA)
 * - premium: Same as standard with enhanced prompts
 * - ultra: 10-agent pipeline adds Animation, SEO, and Forms agents in parallel
 *
 * Returns the final HTML plus agent metadata.
 */

export const maxDuration = 300; // Allow up to 5 minutes for ultra pipeline

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, tier } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A prompt is required" }, { status: 400 });
    }

    if (prompt.length > 5000) {
      return NextResponse.json({ error: "Prompt too long (max 5000 characters)" }, { status: 400 });
    }

    const validTiers = ["standard", "premium", "ultra"];
    const selectedTier = validTiers.includes(tier) ? tier : "standard";

    const result = await runPipeline({ prompt, style, tier: selectedTier });

    return NextResponse.json({
      html: result.html,
      agents: result.agents.map((a) => ({
        name: a.agent,
        duration: a.duration,
      })),
      totalDuration: result.totalDuration,
      tier: selectedTier,
      agentCount: result.agents.length,
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
