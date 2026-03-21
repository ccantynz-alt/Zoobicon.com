import { NextRequest } from "next/server";
import {
  startRender,
  checkRenderStatus,
  getAvailableProvider,
  getAllConfiguredProviders,
  type RenderJob,
  type VideoProvider,
} from "@/lib/video-render";
import {
  getVideoUsage,
  getVideoPlanLimits,
  checkVideoQuota,
  incrementVideoUsage,
  ensureVideoUsageTable,
  getOverageCredits,
  consumeOverageIfNeeded,
} from "@/lib/video-usage";

export const maxDuration = 120;

/**
 * POST /api/video-creator/render — Start rendering video scenes
 *
 * Body: {
 *   scenes: RenderScene[],
 *   style: string,
 *   platform: string,
 *   provider?: "replicate" | "runway" | "luma" | "pika" | "kling",
 *   email?: string,
 *   plan?: string,
 *   hasAddon?: boolean,
 * }
 *
 * Returns: { jobId, jobs, status, totalScenes, completedScenes }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenes, style, platform, provider, email, plan, hasAddon } = body;

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return Response.json(
        { error: "scenes array is required with at least one scene" },
        { status: 400 }
      );
    }

    // Quota enforcement
    if (email) {
      await ensureVideoUsageTable();
      const limits = getVideoPlanLimits(plan || "free", !!hasAddon);
      const usage = await getVideoUsage(email);
      const overageCredits = await getOverageCredits(email);
      const check = checkVideoQuota(usage, limits, "render", overageCredits);
      if (!check.allowed) {
        return Response.json(
          { error: check.reason, quota: { current: check.current, limit: check.limit, remaining: check.remaining }, canBuyMore: true },
          { status: 429 }
        );
      }
      // Check if enough credits for all scenes
      if (check.remaining < scenes.length) {
        return Response.json(
          { error: `Not enough render credits. Need ${scenes.length}, have ${check.remaining} remaining this month.`, quota: { current: check.current, limit: check.limit, remaining: check.remaining } },
          { status: 429 }
        );
      }
    }

    if (!style) {
      return Response.json({ error: "style is required" }, { status: 400 });
    }

    // Check provider availability
    const activeProvider = provider || getAvailableProvider();
    if (!activeProvider) {
      const allProviders = getAllConfiguredProviders();
      return Response.json(
        {
          error: "No video rendering provider configured",
          message: "Set one of: REPLICATE_API_TOKEN, RUNWAY_API_KEY, LUMA_API_KEY, PIKA_API_KEY, or KLING_API_KEY in your environment variables.",
          providers: allProviders,
        },
        { status: 503 }
      );
    }

    console.log(`[video-creator/render] Starting ${scenes.length} scenes with provider: ${activeProvider}`);

    const result = await startRender({
      scenes,
      style,
      platform: platform || "youtube",
      provider: activeProvider as VideoProvider,
    });

    // Only charge for jobs that actually started (not failed at creation)
    const startedJobs = result.jobs.filter((j) => j.status !== "failed").length;
    const failedJobs = result.jobs.filter((j) => j.status === "failed");

    if (failedJobs.length > 0) {
      console.warn(`[video-creator/render] ${failedJobs.length} scenes failed to start:`,
        failedJobs.map((j) => ({ scene: j.sceneNumber, error: j.error }))
      );
    }

    // Track usage — only count jobs that successfully started
    if (email && startedJobs > 0) {
      await incrementVideoUsage(email, "render", startedJobs);
      await consumeOverageIfNeeded(email, plan, hasAddon, "render", startedJobs);
    }

    return Response.json(result);
  } catch (err) {
    console.error("[video-creator/render] Error:", err);
    const message = err instanceof Error ? err.message : "Render failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/video-creator/render — Check status of render jobs
 *
 * Body: { jobs: RenderJob[] }
 *
 * Returns updated jobs with current status/videoUrl
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobs } = body;

    if (!jobs || !Array.isArray(jobs)) {
      return Response.json({ error: "jobs array required" }, { status: 400 });
    }

    const updated = await checkRenderStatus(jobs as RenderJob[]);

    const completed = updated.filter((j) => j.status === "succeeded").length;
    const failed = updated.filter((j) => j.status === "failed").length;
    const total = updated.length;

    let overallStatus: "processing" | "completed" | "failed" = "processing";
    if (completed + failed === total) {
      overallStatus = failed === total ? "failed" : "completed";
    }

    // Calculate overall progress
    const progress = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;

    return Response.json({
      jobs: updated,
      status: overallStatus,
      totalScenes: total,
      completedScenes: completed,
      failedScenes: failed,
      progress,
    });
  } catch (err) {
    console.error("[video-creator/render] Status check error:", err);
    return Response.json({ error: "Failed to check render status" }, { status: 500 });
  }
}

/**
 * GET /api/video-creator/render — Get available providers
 */
export async function GET() {
  const provider = getAvailableProvider();
  const allProviders = getAllConfiguredProviders();

  return Response.json({
    available: !!provider,
    activeProvider: provider,
    providers: allProviders.reduce(
      (acc, p) => {
        acc[p.provider] = { configured: p.configured, models: p.models };
        return acc;
      },
      {} as Record<string, { configured: boolean; models: string[] }>
    ),
  });
}
