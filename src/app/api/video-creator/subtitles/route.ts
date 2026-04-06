import { NextRequest } from "next/server";
import {
  generateSubtitles,
  generateSceneSubtitles,
  CAPTION_PRESETS,
} from "@/lib/subtitle-gen";

/**
 * POST /api/video-creator/subtitles — Generate subtitles from script
 *
 * Body: {
 *   script: string,
 *   totalDuration: number,        // seconds
 *   scenes?: { sceneNumber: number, duration: string, narration: string }[],
 *   format?: "srt" | "vtt" | "both",
 *   captionPreset?: string,       // e.g., "tiktok-bold", "youtube-standard"
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { script, totalDuration, scenes, format = "both", captionPreset } = body;

    if (!script && (!scenes || scenes.length === 0)) {
      return Response.json(
        { error: "Either script or scenes array is required" },
        { status: 400 }
      );
    }

    let result;
    if (scenes && scenes.length > 0) {
      result = generateSceneSubtitles(scenes);
    } else {
      result = generateSubtitles(script, totalDuration || 30);
    }

    const response: Record<string, unknown> = {
      entries: result.entries,
      totalDuration: result.totalDuration,
      entryCount: result.entries.length,
    };

    if (format === "srt" || format === "both") {
      response.srt = result.srt;
    }
    if (format === "vtt" || format === "both") {
      response.vtt = result.vtt;
    }
    if (captionPreset && CAPTION_PRESETS[captionPreset]) {
      response.captionStyle = CAPTION_PRESETS[captionPreset];
    }

    return Response.json(response);
  } catch (err) {
    console.error("[video-creator/subtitles] Error:", err);
    return Response.json({ error: "Subtitle generation failed. Please try again." }, { status: 500 });
  }
}

/**
 * GET /api/video-creator/subtitles — List available caption presets
 */
export async function GET() {
  return Response.json({
    presets: Object.entries(CAPTION_PRESETS).map(([id, style]) => ({
      id,
      ...style,
    })),
  });
}
