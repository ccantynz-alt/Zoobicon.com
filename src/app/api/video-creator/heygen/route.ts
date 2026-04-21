import { NextRequest } from "next/server";
import {
  generateVideo,
  getVideoStatus,
  listAvatars,
  listVoices,
  isHeyGenConfigured,
  AVATAR_PRESETS,
  type HeyGenVideoRequest,
} from "@/lib/heygen";

export const maxDuration = 30;

/**
 * POST /api/video-creator/heygen — Generate an AI spokesperson video
 *
 * Body: {
 *   script: string,          // What the spokesperson says (max 5000 chars)
 *   avatarId: string,        // HeyGen avatar ID
 *   voiceId: string,         // HeyGen voice ID
 *   background?: { type: "color" | "image", value: string },
 *   speed?: number,          // Voice speed 0.5-1.5
 *   caption?: boolean,       // Add subtitles
 *   test?: boolean,          // Free watermarked test
 *   format?: "landscape" | "portrait" | "square",
 * }
 *
 * Returns: { videoId: string }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isHeyGenConfigured()) {
      return Response.json(
        { error: "AI spokesperson videos are coming soon! Stay tuned for updates.", comingSoon: true },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { script, avatarId, voiceId, background, speed, caption, test, format } = body;

    if (!script?.trim()) {
      return Response.json({ error: "Script is required." }, { status: 400 });
    }
    if (!avatarId) {
      return Response.json({ error: "Please select a presenter." }, { status: 400 });
    }
    if (!voiceId) {
      return Response.json({ error: "Please select a voice." }, { status: 400 });
    }

    // Map format to dimensions
    let dimension = { width: 1920, height: 1080 }; // landscape default
    if (format === "portrait") dimension = { width: 1080, height: 1920 }; // TikTok/Reels
    else if (format === "square") dimension = { width: 1080, height: 1080 }; // Instagram

    const request: HeyGenVideoRequest = {
      script: script.trim(),
      avatarId,
      voiceId,
      background: background || { type: "color", value: "#0f2148" },
      dimension,
      speed: speed || 1.0,
      caption: caption !== false,
      test: test === true,
    };

    const videoId = await generateVideo(request);

    return Response.json({
      videoId,
      status: "processing",
      message: "Your AI spokesperson video is being generated. This usually takes 1-3 minutes.",
    });
  } catch (err) {
    console.error("[video-creator/heygen] Error:", err);
    const raw = err instanceof Error ? err.message : "";
    // Error messages from heygen.ts are already user-friendly
    const message = raw.includes("coming soon") || raw.includes("Please") || raw.includes("try again")
      ? raw
      : "AI spokesperson video generation failed. Please try again.";
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/video-creator/heygen — Get available avatars, voices, and video status
 *
 * Query params:
 *   ?action=avatars   — List available avatars
 *   ?action=voices    — List available voices
 *   ?action=status&videoId=xxx — Check video generation status
 *   (no params)       — Return presets + availability info
 */
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action");
    const videoId = req.nextUrl.searchParams.get("videoId");

    if (!isHeyGenConfigured()) {
      return Response.json({
        available: false,
        comingSoon: true,
        presets: AVATAR_PRESETS,
        message: "AI spokesperson videos are coming soon!",
      });
    }

    if (action === "status" && videoId) {
      const status = await getVideoStatus(videoId);
      return Response.json(status);
    }

    if (action === "avatars") {
      const avatars = await listAvatars();
      return Response.json({ avatars, presets: AVATAR_PRESETS });
    }

    if (action === "voices") {
      const voices = await listVoices();
      return Response.json({ voices });
    }

    // Default: return availability + real avatars from API (not just hardcoded presets)
    try {
      const [avatars, voices] = await Promise.all([listAvatars(), listVoices()]);
      // Build presets from REAL API data — first 12 avatars with preview images
      const realPresets = avatars
        .filter((a) => a.preview_image_url)
        .slice(0, 12)
        .map((a) => ({
          id: a.avatar_id,
          name: a.avatar_name,
          gender: a.gender,
          style: "professional",
          description: a.avatar_name,
          preview_image_url: a.preview_image_url,
        }));
      return Response.json({
        available: true,
        presets: realPresets.length > 0 ? realPresets : AVATAR_PRESETS,
        voices: voices.slice(0, 20),
        avatarCount: avatars.length,
      });
    } catch (err) {
      console.error("[heygen] Failed to load real avatars, falling back to presets:", err);
      return Response.json({
        available: true,
        presets: AVATAR_PRESETS,
      });
    }
  } catch (err) {
    console.error("[video-creator/heygen] GET Error:", err);
    return Response.json(
      { error: "Failed to load AI spokesperson data.", available: false, presets: AVATAR_PRESETS },
      { status: 500 }
    );
  }
}
