import { NextRequest } from "next/server";
import {
  transcribeAudio,
  generateStyledCaptions,
  getAvailableCaptionStyles,
  type CaptionStyle,
} from "@/lib/video-captions";

export const maxDuration = 120;

/**
 * GET /api/video-creator/captions
 * Returns available caption styles and provider status.
 */
export async function GET() {
  const hasFal = !!process.env.FAL_KEY;
  const hasReplicate = !!(
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN
  );

  return Response.json({
    available: hasFal || hasReplicate,
    providers: {
      fal: hasFal,
      replicate: hasReplicate,
    },
    styles: getAvailableCaptionStyles(),
    tip: !hasFal && !hasReplicate
      ? "Set FAL_KEY or REPLICATE_API_TOKEN to enable captions."
      : undefined,
  });
}

/**
 * POST /api/video-creator/captions
 *
 * Body: {
 *   audioUrl: string       — URL to audio file
 *   style?: CaptionStyle   — "modern" | "bold" | "minimal" | "karaoke" (default: "modern")
 *   language?: string       — language code (default: auto-detect)
 * }
 *
 * Returns: {
 *   cues: CaptionCue[]
 *   srt: string
 *   ass: string
 *   fullText: string
 *   style: CaptionStyle
 *   model: string
 *   durationSec: number
 * }
 */
export async function POST(req: NextRequest) {
  let body: { audioUrl?: string; style?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body. Expected { audioUrl, style?, language? }" },
      { status: 400 }
    );
  }

  const { audioUrl, language } = body;
  const style = (body.style || "modern") as CaptionStyle;

  if (!audioUrl || typeof audioUrl !== "string") {
    return Response.json(
      { error: "audioUrl is required (URL to an audio file)." },
      { status: 400 }
    );
  }

  if (!["modern", "bold", "minimal", "karaoke"].includes(style)) {
    return Response.json(
      { error: `Invalid style "${style}". Use: modern, bold, minimal, karaoke.` },
      { status: 400 }
    );
  }

  try {
    // Step 1: Transcribe
    const transcription = await transcribeAudio(audioUrl, { language });

    // Step 2: Style
    const styled = generateStyledCaptions(transcription.cues, style);

    return Response.json({
      cues: styled.cues,
      srt: styled.srt,
      ass: styled.ass,
      fullText: transcription.fullText,
      style: styled.style,
      model: transcription.model,
      durationSec: transcription.durationSec,
      language: transcription.language,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Caption generation failed";
    console.error("[captions]", message);

    return Response.json(
      {
        error: message,
        hint: message.includes("FAL_KEY") || message.includes("REPLICATE")
          ? "Set FAL_KEY or REPLICATE_API_TOKEN in Vercel environment variables."
          : "Try again. If the problem persists, check the audio URL is accessible.",
      },
      { status: 503 }
    );
  }
}
