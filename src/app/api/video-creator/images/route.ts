import { NextRequest } from "next/server";
import {
  generateSceneImage,
  generateAllSceneImages,
  getAvailableImageProvider,
  type SceneImageRequest,
  type ImageProvider,
} from "@/lib/scene-image-gen";
import {
  getVideoUsage,
  getVideoPlanLimits,
  checkVideoQuota,
  incrementVideoUsage,
  ensureVideoUsageTable,
  getOverageCredits,
  consumeOverageIfNeeded,
} from "@/lib/video-usage";

export const maxDuration = 180;

/**
 * POST /api/video-creator/images — Generate images for storyboard scenes
 *
 * Body: {
 *   scenes: SceneImageRequest[],
 *   provider?: "replicate" | "openai" | "stability",
 *   mode?: "single" | "all",
 *   email?: string,
 *   plan?: string,
 *   hasAddon?: boolean,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenes, provider, mode = "all", email, plan, hasAddon } = body;

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
      const check = checkVideoQuota(usage, limits, "image", overageCredits);
      if (!check.allowed) {
        return Response.json(
          { error: check.reason, quota: { current: check.current, limit: check.limit, remaining: check.remaining }, canBuyMore: true },
          { status: 429 }
        );
      }
      if (check.remaining < scenes.length) {
        return Response.json(
          { error: `Not enough image credits. Need ${scenes.length}, have ${check.remaining} remaining this month. Purchase additional credits to continue.`, quota: { current: check.current, limit: check.limit, remaining: check.remaining }, canBuyMore: true },
          { status: 429 }
        );
      }
    }

    const activeProvider = (provider || getAvailableImageProvider()) as ImageProvider | null;
    if (!activeProvider) {
      return Response.json(
        {
          error: "Image generation is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    if (mode === "single") {
      const scene = scenes[0] as SceneImageRequest;
      const result = await generateSceneImage(scene, activeProvider);
      if (email) {
        await incrementVideoUsage(email, "image", 1);
        await consumeOverageIfNeeded(email, plan, hasAddon, "image", 1);
      }
      return Response.json({
        mode: "single",
        provider: activeProvider,
        image: result,
      });
    } else {
      const results = await generateAllSceneImages(
        scenes as SceneImageRequest[],
        activeProvider
      );
      if (email) {
        await incrementVideoUsage(email, "image", results.length);
        await consumeOverageIfNeeded(email, plan, hasAddon, "image", results.length);
      }
      return Response.json({
        mode: "all",
        provider: activeProvider,
        images: results,
        totalScenes: scenes.length,
        generatedImages: results.length,
      });
    }
  } catch (err) {
    console.error("[video-creator/images] Error:", err);
    return Response.json({ error: "Image generation failed. Please try again." }, { status: 500 });
  }
}

/**
 * GET /api/video-creator/images — Check available image providers
 */
export async function GET() {
  const provider = getAvailableImageProvider();

  return Response.json({
    available: !!provider,
    activeProvider: provider || null,
    providers: {
      replicate: {
        available: !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.REPLICATE_TOKEN || process.env.REPLICATE_KEY),
        models: ["FLUX Schnell", "Stable Diffusion XL"],
      },
      openai: {
        available: !!process.env.OPENAI_API_KEY,
        models: ["DALL-E 3"],
      },
      stability: {
        available: !!process.env.STABILITY_API_KEY,
        models: ["Stable Diffusion 3"],
      },
    },
  });
}
