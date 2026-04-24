import { NextRequest } from "next/server";
import {
  generateSpokespersonVideo,
  isCustomPipelineAvailable,
  getVideoPipelineInfo,
  AVATAR_PRESETS,
  type VideoGenerationRequest,
} from "@/lib/video-pipeline";

export const maxDuration = 300;

/**
 * POST /api/v1/video/generate
 *
 * Zoobicon's own AI video generation API.
 * Generates spokesperson videos using our custom pipeline:
 *   Fish Speech (voice) → FLUX (avatar) → SadTalker (lip-sync)
 *
 * No HeyGen dependency. We own the stack.
 *
 * Body: {
 *   script: string,                    // What the presenter says
 *   avatarDescription?: string,        // "blonde woman, friendly smile, professional"
 *   avatarImageUrl?: string,           // OR provide your own face image
 *   voiceStyle?: string,               // "professional" | "warm" | "energetic" | "calm"
 *   voiceGender?: string,              // "female" | "male"
 *   background?: string,               // Color hex or description
 *   format?: string,                   // "landscape" | "portrait" | "square"
 * }
 *
 * Returns: SSE stream with progress updates, then final video URL
 */
export async function POST(req: NextRequest) {
  if (!isCustomPipelineAvailable()) {
    return Response.json(
      {
        error:
          "REPLICATE_API_TOKEN is not configured on the server. Add it to Vercel → Settings → Environment Variables (or set ZOOBICON_VIDEO_API_URL for self-hosted) and redeploy.",
        info: getVideoPipelineInfo(),
      },
      { status: 503 }
    );
  }

  let body: VideoGenerationRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.script || body.script.trim().length < 10) {
    return Response.json({ error: "Script must be at least 10 characters." }, { status: 400 });
  }

  if (body.script.length > 5000) {
    return Response.json({ error: "Script is too long (max 5000 characters)." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "status", step: "starting", progress: 0, message: "Starting video generation..." });

        const result = await generateSpokespersonVideo(
          {
            script: body.script.trim(),
            avatarPresetId: body.avatarPresetId as string | undefined,
            avatarDescription: body.avatarDescription,
            avatarImageUrl: body.avatarImageUrl,
            voiceStyle: (body.voiceStyle as VideoGenerationRequest["voiceStyle"]) || "professional",
            voiceGender: (body.voiceGender as VideoGenerationRequest["voiceGender"]) || "female",
            background: body.background || "#0f172a",
            format: (body.format as VideoGenerationRequest["format"]) || "landscape",
          },
          (status) => {
            send({ type: "status", ...status });
          }
        );

        send({
          type: "done",
          videoUrl: result.videoUrl,
          audioUrl: result.audioUrl,
          avatarUrl: result.avatarUrl,
          duration: result.duration,
          cost: result.cost,
          pipeline: result.pipeline,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Video generation failed.";
        // Expose pipeline step details but strip sensitive info (tokens, keys)
        const safeMessage = message
          .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
          .replace(/r8_[A-Za-z0-9]+/g, "[REDACTED]")
          .replace(/sk-[A-Za-z0-9]+/g, "[REDACTED]");
        send({ type: "error", message: safeMessage });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * GET /api/v1/video/generate
 *
 * Check pipeline availability and capabilities.
 */
export async function GET() {
  const info = getVideoPipelineInfo();
  return Response.json({
    available: info.available,
    provider: info.provider,
    models: info.models,
    avatarPresets: AVATAR_PRESETS,
    capabilities: {
      spokesperson: true,
      voiceCloning: info.available,
      customAvatars: info.available,
      elevenLabsVoice: Boolean(process.env.ELEVENLABS_API_KEY),
      formats: ["landscape", "portrait", "square"],
      maxScriptLength: 5000,
      estimatedCostPerMinute: "$0.10-0.20",
    },
  });
}
