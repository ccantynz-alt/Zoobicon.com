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
 * All tiers run the full 10-agent pipeline with smart model routing:
 * - Haiku 4.5 for fast JSON agents (Strategist, Brand, Copywriter, Architect)
 * - Opus 4.6 for the Developer agent (the actual website build)
 * - Sonnet 4.6 for enhancement agents (Animation, SEO, Forms, Integrations, QA)
 *
 * Returns the final HTML plus agent metadata.
 */

export const maxDuration = 300; // Allow up to 5 minutes for full pipeline

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, tier, model } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A prompt is required" }, { status: 400 });
    }

    if (prompt.length > 20000) {
      return NextResponse.json({ error: "Prompt too long (max 20,000 characters)" }, { status: 400 });
    }

    const validTiers = ["standard", "premium", "ultra"];
    const selectedTier = validTiers.includes(tier) ? tier : "standard";

    const result = await runPipeline({ prompt, style, tier: selectedTier, model });

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
      ...(result.reactComponents ? { reactComponents: result.reactComponents } : {}),
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
