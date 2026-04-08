/**
 * POST /api/video-creator/voice-clone — Clone a voice from an audio sample
 * GET  /api/video-creator/voice-clone — Check availability and list tips
 *
 * Accepts either:
 *   A) Multipart form data with an "audio" file field (mp3/wav/m4a, 10–120s)
 *   B) JSON body with { audio_url, name?, description? }
 *
 * Returns: { voiceId, provider, name, previewUrl, referenceAudioUrl, createdAt }
 *
 * The voiceId can then be used in subsequent TTS / video generation calls.
 */

import { NextRequest } from "next/server";
import {
  createVoiceClone,
  getAvailableCloneProviders,
  VOICE_CLONE_TIPS,
  type VoiceCloneProfile,
  type EmotionStyle,
  generateWithClonedVoice,
} from "@/lib/voice-clone";

export const maxDuration = 120;
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Allowed audio MIME types and their extensions
// ---------------------------------------------------------------------------

const ALLOWED_AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/webm": "webm",
};

/** Max file size: 25 MB */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// ---------------------------------------------------------------------------
// GET — availability check
// ---------------------------------------------------------------------------

export async function GET() {
  const providers = getAvailableCloneProviders();

  return Response.json({
    available: providers.length > 0,
    providers,
    tips: VOICE_CLONE_TIPS,
    limits: {
      minDurationSeconds: 10,
      maxDurationSeconds: 120,
      maxFileSizeMB: 25,
      allowedFormats: ["mp3", "wav", "m4a", "aac", "ogg", "webm"],
    },
    emotionStyles: ["professional", "excited", "calm", "serious"],
  });
}

// ---------------------------------------------------------------------------
// POST — clone a voice OR generate TTS with a cloned voice
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Determine whether this is a clone request or a TTS request
    // TTS requests include "action": "generate" in the body
    if (contentType.includes("multipart/form-data")) {
      return await handleMultipartClone(request);
    } else if (contentType.includes("application/json")) {
      return await handleJsonRequest(request);
    } else {
      return Response.json(
        {
          error:
            "Unsupported content type. Send multipart/form-data with an audio file, or application/json with an audio_url.",
        },
        { status: 415 },
      );
    }
  } catch (err) {
    console.error("[voice-clone] Unhandled error:", err);
    const raw = err instanceof Error ? err.message : "Voice cloning failed";

    // Sanitize — never expose API keys or internal provider names to the user
    let message = "Voice cloning failed. Please try again.";
    const lower = raw.toLowerCase();
    if (lower.includes("rate limit") || lower.includes("429")) {
      message = "Voice service is busy. Please wait a moment and try again.";
    } else if (lower.includes("authentication") || lower.includes("401")) {
      message = "Voice service is temporarily unavailable. Please try again later.";
    } else if (lower.includes("audio sample") || lower.includes("clearer") || lower.includes("background noise")) {
      message = raw; // Already user-friendly
    } else if (lower.includes("not configured")) {
      message = "Voice cloning is not available at this time. Please contact support.";
    } else if (lower.includes("try again")) {
      message = raw;
    }

    return Response.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Multipart handler — audio file upload → clone
// ---------------------------------------------------------------------------

async function handleMultipartClone(request: NextRequest): Promise<Response> {
  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;
  const name = (formData.get("name") as string) || `My Voice ${Date.now()}`;
  const description = (formData.get("description") as string) || undefined;

  if (!audioFile) {
    return Response.json(
      { error: 'No audio file provided. Include a file field named "audio" in the form data.' },
      { status: 400 },
    );
  }

  // Validate file type
  const mimeType = audioFile.type || "audio/mpeg";
  if (!ALLOWED_AUDIO_TYPES[mimeType]) {
    return Response.json(
      {
        error: `Unsupported audio format: ${mimeType}. Allowed: mp3, wav, m4a, aac, ogg, webm.`,
      },
      { status: 400 },
    );
  }

  // Validate file size
  if (audioFile.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: `Audio file is too large (${(audioFile.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB.` },
      { status: 400 },
    );
  }

  // Validate approximate duration from file size
  // MP3 ~128kbps = ~16KB/s, WAV ~176KB/s. Use conservative estimate.
  const bytesPerSecond = mimeType.includes("wav") ? 176_000 : 16_000;
  const estimatedDuration = audioFile.size / bytesPerSecond;

  if (estimatedDuration < 5) {
    // Be lenient (threshold at 5s, not 10s) — compressed files are smaller than expected
    return Response.json(
      {
        error: `Audio sample appears too short (estimated ${Math.round(estimatedDuration)}s). Please provide 10–120 seconds of speech.`,
      },
      { status: 400 },
    );
  }

  if (estimatedDuration > 300) {
    // Very generous upper bound — compressed audio can be misleading
    return Response.json(
      {
        error: `Audio sample appears too long (estimated ${Math.round(estimatedDuration)}s). Please provide 10–120 seconds of speech.`,
      },
      { status: 400 },
    );
  }

  // Convert file to a data URI so it can be passed to the cloning function
  // (ElevenLabs needs the raw bytes; Replicate needs a URL)
  const arrayBuffer = await audioFile.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const profile = await createVoiceClone({
    name,
    audioFileUrl: dataUri,
    description,
  });

  return Response.json(formatProfileResponse(profile), { status: 201 });
}

// ---------------------------------------------------------------------------
// JSON handler — audio URL → clone, OR TTS with existing clone
// ---------------------------------------------------------------------------

async function handleJsonRequest(request: NextRequest): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const action = (body.action as string) || "clone";

  if (action === "generate") {
    return await handleTTSGeneration(body);
  }

  // --- Clone action ---
  const audioUrl = body.audio_url as string | undefined;
  const name = (body.name as string) || `My Voice ${Date.now()}`;
  const description = body.description as string | undefined;

  if (!audioUrl || typeof audioUrl !== "string") {
    return Response.json(
      { error: "audio_url is required. Provide a URL to an mp3, wav, or m4a file (10–120 seconds)." },
      { status: 400 },
    );
  }

  // Basic URL validation
  if (!audioUrl.startsWith("http://") && !audioUrl.startsWith("https://") && !audioUrl.startsWith("data:")) {
    return Response.json(
      { error: "audio_url must be an http(s) URL or a data: URI." },
      { status: 400 },
    );
  }

  const profile = await createVoiceClone({
    name,
    audioFileUrl: audioUrl,
    description,
  });

  return Response.json(formatProfileResponse(profile), { status: 201 });
}

// ---------------------------------------------------------------------------
// TTS generation with cloned voice
// ---------------------------------------------------------------------------

async function handleTTSGeneration(body: Record<string, unknown>): Promise<Response> {
  const text = body.text as string | undefined;
  const voiceId = body.voice_id as string | undefined;
  const referenceAudioUrl = body.reference_audio_url as string | undefined;
  const emotion = (body.emotion as EmotionStyle) || "professional";

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return Response.json(
      { error: "text is required for speech generation." },
      { status: 400 },
    );
  }

  if (text.length > 5000) {
    return Response.json(
      { error: "Text is too long. Maximum 5,000 characters per request." },
      { status: 400 },
    );
  }

  if (!voiceId || typeof voiceId !== "string") {
    return Response.json(
      { error: "voice_id is required. Use the voice ID returned from the clone endpoint." },
      { status: 400 },
    );
  }

  const validEmotions: EmotionStyle[] = ["professional", "excited", "calm", "serious"];
  if (!validEmotions.includes(emotion)) {
    return Response.json(
      { error: `Invalid emotion style. Must be one of: ${validEmotions.join(", ")}` },
      { status: 400 },
    );
  }

  const result = await generateWithClonedVoice({
    text,
    voiceId,
    referenceAudioUrl,
    emotion,
  });

  return Response.json({
    audioUrl: result.audioUrl,
    duration: result.duration,
    provider: result.provider,
    model: result.model,
    emotion,
  });
}

// ---------------------------------------------------------------------------
// Response formatter
// ---------------------------------------------------------------------------

function formatProfileResponse(profile: VoiceCloneProfile) {
  return {
    voiceId: profile.voiceId,
    provider: profile.provider,
    name: profile.name,
    previewUrl: profile.previewUrl,
    referenceAudioUrl: profile.referenceAudioUrl,
    createdAt: profile.createdAt,
  };
}
