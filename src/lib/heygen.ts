// ---------------------------------------------------------------------------
// HeyGen API Integration — AI Spokesperson Video Generation
//
// Creates realistic AI avatar videos where a virtual spokesperson
// presents a script on camera. Used for:
//   - Product promo videos (TikTok, Instagram Reels, YouTube Shorts)
//   - Website explainer videos
//   - Personalized sales messages
//
// API Docs: https://docs.heygen.com/reference/create-an-avatar-video-v2
//
// Env vars:
//   HEYGEN_API_KEY — API key from HeyGen dashboard
// ---------------------------------------------------------------------------

const HEYGEN_API = "https://api.heygen.com";

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
}

export interface HeyGenVoice {
  voice_id: string;
  language: string;
  gender: string;
  name: string;
  preview_audio?: string;
  support_pause: boolean;
  emotion_support: boolean;
}

export interface HeyGenVideoRequest {
  script: string;
  avatarId: string;
  voiceId: string;
  background?: { type: "color" | "image"; value: string };
  dimension?: { width: number; height: number };
  speed?: number;
  caption?: boolean;
  test?: boolean; // true = free watermarked test video
}

export interface HeyGenVideoStatus {
  videoId: string;
  status: "pending" | "processing" | "completed" | "failed";
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  error: string | null;
}

// --- Curated avatar presets for quick selection ---
// These are popular HeyGen stock avatars — IDs may change if HeyGen updates their library
export const AVATAR_PRESETS = [
  { id: "Angela-inTshirt-20220820", name: "Angela", gender: "female", style: "casual", description: "Friendly, approachable woman in casual outfit" },
  { id: "Daisy-inskirt-20220818", name: "Daisy", gender: "female", style: "professional", description: "Professional woman, business attire" },
  { id: "josh_lite3_20230714", name: "Josh", gender: "male", style: "casual", description: "Friendly young man, casual style" },
  { id: "Kristin_public_3_20240108", name: "Kristin", gender: "female", style: "energetic", description: "Energetic, expressive woman" },
  { id: "Anna_public_3_20240108", name: "Anna", gender: "female", style: "warm", description: "Warm, welcoming blonde woman" },
  { id: "Tyler-incasualsuit-20220721", name: "Tyler", gender: "male", style: "professional", description: "Professional man in smart casual" },
  { id: "Briana_public_3_20240110", name: "Briana", gender: "female", style: "friendly", description: "Friendly brunette, big smile" },
  { id: "Monica_public_3_20240110", name: "Monica", gender: "female", style: "confident", description: "Confident woman, polished look" },
];

function getApiKey(): string {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) throw new Error("AI spokesperson video is coming soon. Stay tuned!");
  return key;
}

function headers(): Record<string, string> {
  return {
    "X-Api-Key": getApiKey(),
    "Content-Type": "application/json",
  };
}

/**
 * List all available avatars from HeyGen account
 */
export async function listAvatars(): Promise<HeyGenAvatar[]> {
  const res = await fetch(`${HEYGEN_API}/v2/avatars`, {
    headers: headers(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[heygen] Failed to list avatars:", res.status, err);
    throw new Error("Failed to load available presenters.");
  }

  const data = await res.json();
  const avatars = data?.data?.avatars || [];

  return avatars.map((a: Record<string, unknown>) => ({
    avatar_id: a.avatar_id,
    avatar_name: a.avatar_name || a.avatar_id,
    gender: a.gender || "unknown",
    preview_image_url: a.preview_image_url || "",
    preview_video_url: a.preview_video_url || "",
  }));
}

/**
 * List all available voices from HeyGen
 */
export async function listVoices(): Promise<HeyGenVoice[]> {
  const res = await fetch(`${HEYGEN_API}/v2/voices`, {
    headers: headers(),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[heygen] Failed to list voices:", res.status, err);
    throw new Error("Failed to load available voices.");
  }

  const data = await res.json();
  const voices = data?.data?.voices || [];

  return voices
    .filter((v: Record<string, unknown>) => v.language === "en" || (v.language as string)?.startsWith("en"))
    .slice(0, 50) // Limit to 50 English voices
    .map((v: Record<string, unknown>) => ({
      voice_id: v.voice_id,
      language: v.language || "en",
      gender: v.gender || "unknown",
      name: v.display_name || v.name || v.voice_id,
      preview_audio: v.preview_audio || "",
      support_pause: !!v.support_pause,
      emotion_support: !!v.emotion_support,
    }));
}

/**
 * Generate an AI spokesperson video
 * Returns a video_id for polling status
 */
export async function generateVideo(request: HeyGenVideoRequest): Promise<string> {
  if (request.script.length > 5000) {
    throw new Error("Script is too long. Maximum 5,000 characters for AI spokesperson videos.");
  }
  if (request.script.length < 10) {
    throw new Error("Script is too short. Write at least a few sentences for the spokesperson to say.");
  }

  const body = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: request.avatarId,
          avatar_style: "normal",
        },
        voice: {
          type: "text",
          input_text: request.script,
          voice_id: request.voiceId,
          speed: Math.min(1.5, Math.max(0.5, request.speed ?? 1.0)),
        },
        background: request.background || { type: "color", value: "#1a1a2e" },
      },
    ],
    dimension: request.dimension || { width: 1920, height: 1080 },
    test: request.test ?? false,
    caption: request.caption ?? true,
  };

  const res = await fetch(`${HEYGEN_API}/v2/video/generate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[heygen] Video generation failed:", res.status, err);
    console.error("[heygen] Request body was:", JSON.stringify({ avatarId: request.avatarId, voiceId: request.voiceId, scriptLen: request.script.length }));
    const lower = err.toLowerCase();
    if (lower.includes("insufficient") || lower.includes("credit") || lower.includes("quota"))
      throw new Error("AI spokesperson credits exhausted. Please try again later.");
    if (lower.includes("invalid") && lower.includes("avatar"))
      throw new Error(`Selected presenter "${request.avatarId}" is not available. Try a different one.`);
    if (lower.includes("invalid") && lower.includes("voice"))
      throw new Error(`Selected voice "${request.voiceId}" is not available. Try a different one.`);
    if (res.status === 429)
      throw new Error("Too many requests. Please wait a moment and try again.");
    throw new Error(`Video generation failed (${res.status}). Please try again.`);
  }

  const data = await res.json();
  const videoId = data?.data?.video_id;
  if (!videoId) throw new Error("No video ID returned. Please try again.");

  console.log(`[heygen] Video generation started: ${videoId}`);
  return videoId;
}

/**
 * Check the status of a HeyGen video generation job
 */
export async function getVideoStatus(videoId: string): Promise<HeyGenVideoStatus> {
  const res = await fetch(`${HEYGEN_API}/v1/video_status.get?video_id=${videoId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[heygen] Status check failed for ${videoId}: ${res.status} ${errText}`);
    return {
      videoId,
      status: "failed",
      videoUrl: null,
      thumbnailUrl: null,
      duration: null,
      error: `Failed to check video status (${res.status}).`,
    };
  }

  const data = await res.json();
  const info = data?.data;
  console.log(`[heygen] Status for ${videoId}: ${info?.status}${info?.error ? ` error=${info.error}` : ""}${info?.video_url ? " (has video URL)" : ""}`);

  return {
    videoId,
    status: info?.status || "pending",
    videoUrl: info?.video_url || null,
    thumbnailUrl: info?.thumbnail_url || null,
    duration: info?.duration || null,
    error: info?.error || null,
  };
}

/**
 * Check if HeyGen is configured
 */
export function isHeyGenConfigured(): boolean {
  return !!process.env.HEYGEN_API_KEY;
}
