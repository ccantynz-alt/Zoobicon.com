import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/agents";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";

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
 * Restructured 7-agent pipeline optimized for QUALITY + SPEED:
 * Phase 1: Strategist (Haiku) — ~4s
 * Phase 2: Brand + Copywriter + Architect in PARALLEL (Haiku) — ~6s
 * Phase 3: Developer (Opus 4.7) — ~70s — the quality differentiator
 * Phase 4: SEO + Animation in PARALLEL (Sonnet) — ~15s — high-impact polish
 * Total: ~95s — well within 300s limit
 *
 * Returns the final HTML plus agent metadata.
 */

export const maxDuration = 300; // Allow up to 5 minutes for full pipeline

export async function POST(req: NextRequest) {
  try {
    // Auth + quota enforcement — prevent unauthenticated abuse
    const auth = await authenticateRequest(req, { requireAuth: true, requireVerified: true });
    if (auth.error) return auth.error;
    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, "generation");
    if (quota.error) return quota.error;

    const { prompt, style, tier, model, generatorType, agencyBrand, externalContext } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "A prompt is required" }, { status: 400 });
    }

    if (prompt.length > 20000) {
      return NextResponse.json({ error: "Prompt too long (max 20,000 characters)" }, { status: 400 });
    }

    const validTiers = ["standard", "premium", "ultra"];
    const selectedTier = validTiers.includes(tier) ? tier : "standard";

    const result = await runPipeline({ prompt, style, tier: selectedTier, model, generatorType, agencyBrand, externalContext });

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

    let errorMsg = "Pipeline failed — unknown error";
    let statusCode = 500;

    if (err instanceof Error) {
      errorMsg = err.message;
      if (err.message.includes("timed out") || err.message.includes("timeout")) {
        errorMsg = `Pipeline timed out: ${err.message}. Try again — the AI model may be overloaded.`;
        statusCode = 504;
      }
    } else if (typeof err === "string") {
      errorMsg = err;
    } else {
      errorMsg = `Pipeline error: ${JSON.stringify(err)}`;
    }

    return NextResponse.json(
      { error: errorMsg },
      { status: statusCode }
    );
  }
}
