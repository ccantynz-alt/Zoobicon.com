import { NextRequest } from "next/server";
import {
  transcribeAudio,
  generateSRT,
  generateVTT,
  generateASS,
  burnCaptions,
  translateCaptions,
  detectLanguage,
  type CaptionSegment,
  type CaptionStyle,
} from "@/lib/video-captions";

/**
 * POST /api/video-creator/captions — Auto-caption pipeline
 *
 * Transcribes audio from a video/audio URL using Whisper on Replicate,
 * converts to the requested subtitle format, optionally translates,
 * and optionally burns captions into the video.
 *
 * Request body:
 * {
 *   videoUrl: string,                          // Video URL (used for burn-in and as audio source if audioUrl omitted)
 *   audioUrl?: string,                         // Separate audio URL (if audio is not embedded in video)
 *   options?: {
 *     format?: "srt" | "vtt" | "ass",          // Caption format (default: "srt")
 *     language?: string,                        // Target translation language (omit to keep original)
 *     burn?: boolean,                           // Burn captions into video (default: false)
 *     style?: {
 *       font?: string,                          // Font name (default: "Arial")
 *       fontSize?: number,                      // Font size (default: 24)
 *       color?: string,                         // Hex color (default: "#FFFFFF")
 *       outlineColor?: string,                  // Hex outline color (default: "#000000")
 *       outlineWidth?: number,                  // Outline width (default: 3)
 *       shadowDepth?: number,                   // Shadow depth (default: 0)
 *       position?: "top" | "bottom" | "center", // Caption position (default: "bottom")
 *       animation?: "none" | "fade" | "pop" | "karaoke"
 *     }
 *   }
 * }
 *
 * Response:
 * {
 *   captions: string,              // Formatted caption string (SRT/VTT/ASS)
 *   format: string,                // The format used
 *   segments: CaptionSegment[],    // Raw timed segments
 *   language: string,              // Detected or translated language
 *   duration: number,              // Audio duration in seconds
 *   burnedVideoUrl?: string        // URL of video with burned-in captions (if burn=true)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting header check
    const rateLimitRemaining = req.headers.get("x-ratelimit-remaining");
    if (rateLimitRemaining !== null && parseInt(rateLimitRemaining, 10) <= 0) {
      return Response.json(
        {
          error: "Rate limit exceeded. Please wait before making another request.",
          retryAfter: req.headers.get("x-ratelimit-reset") || "60",
        },
        { status: 429 }
      );
    }

    // Verify REPLICATE_API_TOKEN is set
    const hasToken =
      process.env.REPLICATE_API_TOKEN ||
      process.env.REPLICATE_API_KEY ||
      process.env.REPLICATE_TOKEN ||
      process.env.REPLICATE_KEY;
    if (!hasToken) {
      return Response.json(
        {
          error:
            "Video captions are being set up. REPLICATE_API_TOKEN is not configured — set it in Vercel environment variables.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { videoUrl, audioUrl, options } = body as {
      videoUrl?: string;
      audioUrl?: string;
      options?: {
        format?: "srt" | "vtt" | "ass";
        language?: string;
        burn?: boolean;
        style?: CaptionStyle;
      };
    };

    if (!videoUrl && !audioUrl) {
      return Response.json(
        { error: "Either videoUrl or audioUrl is required." },
        { status: 400 }
      );
    }

    const format = options?.format || "srt";
    const sourceUrl = audioUrl || videoUrl!;

    // Step 1: Transcribe audio via Whisper
    console.log(`[captions-api] Starting transcription for: ${sourceUrl.slice(0, 80)}...`);
    const transcription = await transcribeAudio(sourceUrl);

    let segments: CaptionSegment[] = transcription.segments;
    let language = transcription.language;

    // Step 2: Translate if requested
    if (options?.language && options.language !== language) {
      console.log(`[captions-api] Translating from ${language} to ${options.language}...`);
      try {
        segments = await translateCaptions(segments, options.language);
        language = options.language;
      } catch (err) {
        console.error(`[captions-api] Translation failed, using original language:`, err);
        // Continue with original language — translation is best-effort
      }
    }

    // Step 3: Detect language if not already known
    if (!language || language === "auto") {
      language = detectLanguage(segments);
    }

    // Step 4: Generate formatted captions
    let captions: string;
    switch (format) {
      case "vtt":
        captions = generateVTT(segments);
        break;
      case "ass":
        captions = generateASS(segments, options?.style);
        break;
      case "srt":
      default:
        captions = generateSRT(segments);
        break;
    }

    // Step 5: Burn captions into video if requested
    let burnedVideoUrl: string | undefined;
    if (options?.burn && videoUrl) {
      console.log(`[captions-api] Burning captions into video...`);
      try {
        const srtForBurn = format === "srt" ? captions : generateSRT(segments);
        burnedVideoUrl = await burnCaptions(videoUrl, srtForBurn, options?.style);
      } catch (err) {
        console.error(`[captions-api] Caption burn failed:`, err);
        // Continue without burn — return captions text at minimum
      }
    }

    const response: Record<string, unknown> = {
      captions,
      format,
      segments,
      language,
      duration: transcription.duration,
    };

    if (burnedVideoUrl) {
      response.burnedVideoUrl = burnedVideoUrl;
    }

    console.log(
      `[captions-api] Done — ${segments.length} segments, ${format} format, language: ${language}` +
        (burnedVideoUrl ? ", burned into video" : "")
    );

    return Response.json(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Caption generation failed. Please try again.";
    console.error("[captions-api] Error:", err);

    // Provide specific error messages
    if (message.includes("REPLICATE_API_TOKEN")) {
      return Response.json({ error: message }, { status: 503 });
    }
    if (message.includes("timed out")) {
      return Response.json(
        { error: "Transcription timed out. The audio file may be too long — try a shorter clip." },
        { status: 504 }
      );
    }
    if (message.includes("failed after trying all models")) {
      return Response.json(
        {
          error:
            "All transcription models are currently unavailable. Please try again in a few minutes.",
        },
        { status: 502 }
      );
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
