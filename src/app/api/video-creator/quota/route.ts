import { NextRequest } from "next/server";
import {
  getVideoUsage,
  getVideoPlanLimits,
  getUsageSummary,
  ensureVideoUsageTable,
  checkFullPipelineQuota,
  getOverageCredits,
  OVERAGE_PACKS,
} from "@/lib/video-usage";

/**
 * GET /api/video-creator/quota — Get user's current video usage and limits
 *
 * Query params:
 *   ?email=user@example.com
 *   ?plan=pro
 *   ?addon=true    (has video add-on)
 *   ?scenes=6      (for full pipeline check)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  const plan = searchParams.get("plan") || "free";
  const hasAddon = searchParams.get("addon") === "true";
  const sceneCount = parseInt(searchParams.get("scenes") || "6", 10);

  if (!email) {
    return Response.json({ error: "email parameter required" }, { status: 400 });
  }

  try {
    await ensureVideoUsageTable();

    const limits = getVideoPlanLimits(plan, hasAddon);
    const usage = await getVideoUsage(email);
    const overageCredits = await getOverageCredits(email);
    const summary = getUsageSummary(usage, limits, overageCredits);
    const pipelineCheck = checkFullPipelineQuota(usage, limits, sceneCount);

    return Response.json({
      email,
      plan,
      hasAddon,
      period: usage.period,
      limits: {
        monthlyVideos: limits.monthlyVideos,
        monthlyImageGenerations: limits.monthlyImageGenerations,
        monthlyRenders: limits.monthlyRenders,
        monthlyVoiceovers: limits.monthlyVoiceovers,
        maxDurationSeconds: limits.maxDurationSeconds,
        maxScenesPerVideo: limits.maxScenesPerVideo,
        hasVideoAccess: limits.hasVideoAccess,
      },
      usage: summary,
      overageCredits,
      pipelineAllowed: pipelineCheck.allowed,
      pipelineReason: pipelineCheck.reason,
      overagePacks: OVERAGE_PACKS,
    });
  } catch (err) {
    console.error("[video-creator/quota] Error:", err);
    return Response.json({ error: "Failed to check quota" }, { status: 500 });
  }
}
