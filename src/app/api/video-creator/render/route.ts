import { NextRequest } from "next/server";
import {
  startRender,
  checkRenderStatus,
  getAvailableProvider,
  type RenderJob,
  type VideoProvider,
} from "@/lib/video-render";

export const maxDuration = 120;

/**
 * POST /api/video-creator/render — Start rendering video scenes
 *
 * Body: {
 *   scenes: RenderScene[],
 *   style: string,
 *   platform: string,
 *   provider?: "replicate" | "runway" | "luma"
 * }
 *
 * Returns: { jobId, jobs, status, totalScenes, completedScenes }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenes, style, platform, provider } = body;

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return Response.json(
        { error: "scenes array is required with at least one scene" },
        { status: 400 }
      );
    }

    if (!style) {
      return Response.json({ error: "style is required" }, { status: 400 });
    }

    // Check provider availability
    const activeProvider = provider || getAvailableProvider();
    if (!activeProvider) {
      return Response.json(
        {
          error: "No video rendering provider configured",
          message: "Set REPLICATE_API_TOKEN, RUNWAY_API_KEY, or LUMA_API_KEY in your environment variables.",
          availableProviders: {
            replicate: !!process.env.REPLICATE_API_TOKEN,
            runway: !!process.env.RUNWAY_API_KEY,
            luma: !!process.env.LUMA_API_KEY,
          },
        },
        { status: 503 }
      );
    }

    const result = await startRender({
      scenes,
      style,
      platform: platform || "youtube",
      provider: activeProvider as VideoProvider,
    });

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

    return Response.json({
      jobs: updated,
      status: overallStatus,
      totalScenes: total,
      completedScenes: completed,
      failedScenes: failed,
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

  return Response.json({
    available: !!provider,
    activeProvider: provider,
    providers: {
      replicate: {
        configured: !!process.env.REPLICATE_API_TOKEN,
        models: ["Stable Video Diffusion XT"],
      },
      runway: {
        configured: !!process.env.RUNWAY_API_KEY,
        models: ["Gen-3 Alpha Turbo"],
      },
      luma: {
        configured: !!process.env.LUMA_API_KEY,
        models: ["Dream Machine"],
      },
    },
  });
}
