import { NextRequest } from "next/server";
import {
  generateSceneImage,
  generateAllSceneImages,
  getAvailableImageProvider,
  type SceneImageRequest,
  type ImageProvider,
} from "@/lib/scene-image-gen";

export const maxDuration = 180;

/**
 * POST /api/video-creator/images — Generate images for storyboard scenes
 *
 * Body: {
 *   scenes: SceneImageRequest[],
 *   provider?: "replicate" | "openai" | "stability",
 *   mode?: "single" | "all"   // Generate one scene or all
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenes, provider, mode = "all" } = body;

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return Response.json(
        { error: "scenes array is required with at least one scene" },
        { status: 400 }
      );
    }

    const activeProvider = (provider || getAvailableImageProvider()) as ImageProvider | null;
    if (!activeProvider) {
      return Response.json(
        {
          error: "No image provider configured",
          message: "Set REPLICATE_API_TOKEN, OPENAI_API_KEY, or STABILITY_API_KEY in your environment.",
          providers: {
            replicate: !!process.env.REPLICATE_API_TOKEN,
            openai: !!process.env.OPENAI_API_KEY,
            stability: !!process.env.STABILITY_API_KEY,
          },
        },
        { status: 503 }
      );
    }

    if (mode === "single") {
      const scene = scenes[0] as SceneImageRequest;
      const result = await generateSceneImage(scene, activeProvider);
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
    const message = err instanceof Error ? err.message : "Image generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/video-creator/images — Check available image providers
 */
export async function GET() {
  const provider = getAvailableImageProvider();

  return Response.json({
    available: !!provider,
    activeProvider: provider,
    providers: {
      replicate: {
        configured: !!process.env.REPLICATE_API_TOKEN,
        models: ["FLUX Schnell", "Stable Diffusion XL"],
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        models: ["DALL-E 3"],
      },
      stability: {
        configured: !!process.env.STABILITY_API_KEY,
        models: ["Stable Diffusion 3"],
      },
    },
  });
}
