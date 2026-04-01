/**
 * Zoobicon Video Pipeline — Our Own AI Video Generation Stack
 *
 * NO dependency on HeyGen. We control the entire pipeline:
 *   1. Voice Generation — Fish Speech 1.5 (text → natural speech)
 *   2. Avatar Generation — FLUX.1 schnell (text → photorealistic face)
 *   3. Lip Sync — OmniHuman v1.5 (ByteDance, best quality) or SadTalker (fallback)
 *   4. Background — FLUX.1 (text → scene background)
 *
 * All models run on Replicate (bridge) or self-hosted GPU (future).
 * Total cost: ~$0.10-0.30 per 30-second video.
 *
 * Model selection based on March 2026 research:
 *   - OmniHuman v1.5 (ByteDance): Full upper-body animation with gestures + emotions
 *   - FLUX.1 schnell: $0.003/image, fastest high-quality image model
 *   - Fish Speech 1.5: Multilingual TTS with voice cloning from 10s of audio
 *   - SadTalker: Reliable fallback for lip-sync if OmniHuman unavailable
 *
 * Env vars:
 *   REPLICATE_API_TOKEN — Replicate API token (required for bridge mode)
 *   ZOOBICON_VIDEO_API_URL — Self-hosted endpoint (future, overrides Replicate)
 */

const REPLICATE_API = "https://api.replicate.com/v1";

function getReplicateToken(): string {
  const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
  if (!token) throw new Error("Video generation is being set up. Please try again shortly.");
  return token;
}

function replicateHeaders() {
  return {
    Authorization: `Bearer ${getReplicateToken()}`,
    "Content-Type": "application/json",
    // NO "Prefer: wait" — community models can cold-start for 60s+
    // We always use async mode with polling for reliability
  };
}

// ── Types ──

export interface VideoGenerationRequest {
  script: string;
  avatarDescription?: string; // "professional woman, mid-30s, dark hair" — we generate the face
  avatarImageUrl?: string; // OR provide an existing face image
  voiceStyle?: "professional" | "warm" | "energetic" | "calm" | "authoritative";
  voiceGender?: "female" | "male";
  background?: string; // "modern office" | "gradient blue" | "#1a1a2e" | image URL
  format?: "landscape" | "portrait" | "square";
  speed?: number; // 0.8-1.2
}

export interface VideoGenerationResult {
  videoUrl: string;
  audioUrl: string;
  avatarUrl?: string;
  duration: number;
  cost: number;
  pipeline: string;
}

export interface PipelineStatus {
  step: string;
  progress: number; // 0-100
  message: string;
}

// ── Step 1: Voice Generation ──

/**
 * Generate natural speech from text using Fish Speech 1.5
 * Returns a URL to the generated audio file
 */
export async function generateVoice(
  text: string,
  options?: { gender?: "female" | "male"; style?: string; speed?: number }
): Promise<{ audioUrl: string; duration: number }> {
  const token = getReplicateToken();

  // Try multiple TTS models in order — first one that works wins
  const ttsModels = [
    {
      name: "Fish Speech V1.5",
      version: "11f3e0394c06dcc099c0cbaf75f4a6e7da84cb4aaa5d53bedfc3234b5c8aaefc",
      input: { text },
    },
    {
      name: "XTTS-v2",
      version: "684bc3855b37866c0c65add2ff39c78f3dea3f4ff103a436465326e0f438d55e",
      input: { text, language: "en" },
    },
    {
      name: "Kokoro TTS",
      version: "dfdf537ba482b029e0a761699e6f55e9162c7d7b148d671f9cf05e3e3b58a837",
      input: { text, speed: options?.speed || 1.0 },
    },
  ];

  let lastError = "";

  for (const model of ttsModels) {
    try {
      console.log(`[video-pipeline] Trying ${model.name} for voice generation...`);

      const res = await fetch(`${REPLICATE_API}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: model.version,
          input: model.input,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[video-pipeline] ${model.name} failed: ${res.status} ${errText}`);
        lastError = `${model.name}: ${res.status}`;
        continue; // Try next model
      }

      const data = await res.json();
      console.log(`[video-pipeline] ${model.name} response status:`, data.status);

      // Check if output is immediately available (unlikely without Prefer:wait)
      let audioUrl = extractReplicateOutput(data);

      if (!audioUrl && data.urls?.get) {
        // Poll for completion — model is processing async
        console.log(`[video-pipeline] ${model.name} processing async, polling...`);
        const result = await pollReplicatePrediction(data.urls.get);
        audioUrl = extractReplicateOutput(result);
      }

      if (audioUrl) {
        console.log(`[video-pipeline] ${model.name} succeeded!`);
        return { audioUrl, duration: estimateDuration(text) };
      }

      console.warn(`[video-pipeline] ${model.name} returned no audio output`);
      lastError = `${model.name}: no output`;
    } catch (err) {
      console.error(`[video-pipeline] ${model.name} error:`, err instanceof Error ? err.message : err);
      lastError = `${model.name}: ${err instanceof Error ? err.message : "unknown error"}`;
    }
  }

  // All models failed
  throw new Error(`Voice generation failed after trying all models. Last error: ${lastError}`);
}

/**
 * Generate voice using XTTS v2 (alternative — supports voice cloning)
 */
export async function generateVoiceXTTS(
  text: string,
  referenceAudioUrl?: string
): Promise<{ audioUrl: string; duration: number }> {
  const input: Record<string, unknown> = {
    text,
    language: "en",
  };

  if (referenceAudioUrl) {
    input.speaker = referenceAudioUrl; // Clone this voice
  }

  const res = await fetch(`${REPLICATE_API}/models/lucataco/xtts-v2/predictions`, {
    method: "POST",
    headers: replicateHeaders(),
    body: JSON.stringify({ input }),
  });

  if (!res.ok) throw new Error("Voice generation failed.");
  const data = await res.json();

  const audioUrl = extractReplicateOutput(data);
  if (!audioUrl) {
    if (data.urls?.get) {
      const result = await pollReplicatePrediction(data.urls.get);
      const url = extractReplicateOutput(result);
      if (url) return { audioUrl: url, duration: estimateDuration(text) };
    }
    throw new Error("Voice generation returned no audio.");
  }

  return { audioUrl, duration: estimateDuration(text) };
}

// ── Step 2: Avatar Generation ──

/**
 * Generate a photorealistic avatar face using FLUX.1
 */
export async function generateAvatar(
  description: string
): Promise<{ imageUrl: string }> {
  const prompt = `Professional headshot portrait photo of ${description}. Clean background, studio lighting, sharp focus, photorealistic, 8k quality. Looking directly at camera with neutral pleasant expression. Shoulders visible. Professional attire.`;

  // FLUX.1 schnell — official Replicate model, no version hash needed
  const res = await fetch(`${REPLICATE_API}/models/black-forest-labs/flux-schnell/predictions`, {
    method: "POST",
    headers: replicateHeaders(),
    body: JSON.stringify({
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 90,
      },
    }),
  });

  if (!res.ok) throw new Error("Avatar generation failed.");
  const data = await res.json();

  const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
  if (!imageUrl) {
    if (data.urls?.get) {
      const result = await pollReplicatePrediction(data.urls.get);
      const url = Array.isArray(result.output) ? result.output[0] : result.output;
      if (url) return { imageUrl: url };
    }
    throw new Error("Avatar generation returned no image.");
  }

  return { imageUrl };
}

// ── Step 3: Lip Sync — The Magic ──

/**
 * Generate a talking-head video by syncing audio to a face image.
 * Tries OmniHuman v1.5 (ByteDance) first — best quality, full upper-body
 * animation with gestures and emotions. Falls back to SadTalker if unavailable.
 */
export async function generateLipSync(
  faceImageUrl: string,
  audioUrl: string,
  options?: { enhanceFace?: boolean }
): Promise<{ videoUrl: string }> {
  // Try OmniHuman v1.5 first — ByteDance's state-of-the-art
  try {
    console.log("[video-pipeline] Trying OmniHuman v1.5 for lip-sync...");
    const omniRes = await fetch(`${REPLICATE_API}/models/bytedance/omni-human/predictions`, {
      method: "POST",
      headers: replicateHeaders(),
      body: JSON.stringify({
        input: {
          image: faceImageUrl,
          audio: audioUrl,
        },
      }),
    });

    if (omniRes.ok) {
      const omniData = await omniRes.json();
      const videoUrl = extractReplicateOutput(omniData);
      if (videoUrl) {
        console.log("[video-pipeline] OmniHuman succeeded");
        return { videoUrl };
      }
      if (omniData.urls?.get) {
        const result = await pollReplicatePrediction(omniData.urls.get);
        const url = extractReplicateOutput(result);
        if (url) return { videoUrl: url };
      }
    } else {
      console.warn("[video-pipeline] OmniHuman failed, falling back to SadTalker");
    }
  } catch (err) {
    console.warn("[video-pipeline] OmniHuman error, falling back to SadTalker:", err instanceof Error ? err.message : err);
  }

  // Fallback: SadTalker — proven reliable
  console.log("[video-pipeline] Using SadTalker for lip-sync...");
  const res = await fetch(`${REPLICATE_API}/predictions`, {
    method: "POST",
    headers: replicateHeaders(),
    body: JSON.stringify({
      version: "3aa3dac9353cc4d6bd62a8f95957bd844003b401ca4e4a9b33baa574c549d376",
      input: {
        source_image: faceImageUrl,
        driven_audio: audioUrl,
        enhancer: options?.enhanceFace !== false ? "gfpgan" : "none",
        preprocess: "crop",
        still: false,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[video-pipeline] SadTalker also failed:", res.status, err);
    throw new Error("Video animation failed. Please try again.");
  }

  const data = await res.json();
  const videoUrl = extractReplicateOutput(data);

  if (!videoUrl) {
    if (data.urls?.get) {
      const result = await pollReplicatePrediction(data.urls.get);
      const url = extractReplicateOutput(result);
      if (url) return { videoUrl: url };
    }
    throw new Error("Video animation returned no video.");
  }

  return { videoUrl };
}

// ── Full Pipeline ──

/**
 * Generate a complete spokesperson video from scratch.
 * This is our own pipeline — no HeyGen dependency.
 *
 * Flow:
 *   script → voice audio → avatar image → lip sync → final video
 */
export async function generateSpokespersonVideo(
  request: VideoGenerationRequest,
  onProgress?: (status: PipelineStatus) => void
): Promise<VideoGenerationResult> {
  const startTime = Date.now();

  // Step 1: Generate voice
  onProgress?.({ step: "voice", progress: 10, message: "Generating voice..." });
  const voice = await generateVoice(request.script, {
    gender: request.voiceGender || "female",
    style: request.voiceStyle || "professional",
    speed: request.speed,
  });
  onProgress?.({ step: "voice", progress: 30, message: "Voice generated" });

  // Step 2: Get or generate avatar face
  let avatarUrl = request.avatarImageUrl;
  if (!avatarUrl) {
    onProgress?.({ step: "avatar", progress: 40, message: "Creating presenter..." });
    const avatar = await generateAvatar(
      request.avatarDescription || "professional woman, mid-30s, confident, business attire"
    );
    avatarUrl = avatar.imageUrl;
    onProgress?.({ step: "avatar", progress: 55, message: "Presenter created" });
  }

  // Step 3: Lip sync — animate the face to speak the audio
  onProgress?.({ step: "lipsync", progress: 60, message: "Animating presenter..." });
  const video = await generateLipSync(avatarUrl, voice.audioUrl, {
    enhanceFace: true,
  });
  onProgress?.({ step: "lipsync", progress: 90, message: "Video ready" });

  const elapsed = (Date.now() - startTime) / 1000;
  const estimatedCost = 0.12; // ~$0.12 per video on Replicate

  onProgress?.({ step: "done", progress: 100, message: "Complete" });

  return {
    videoUrl: video.videoUrl,
    audioUrl: voice.audioUrl,
    avatarUrl,
    duration: voice.duration,
    cost: estimatedCost,
    pipeline: "zoobicon-v1",
  };
}

// ── Auto-Captions (Whisper) ──

/**
 * Transcribe audio to generate captions/subtitles.
 * Uses Whisper on Replicate — returns SRT format.
 */
export async function generateCaptions(
  audioUrl: string
): Promise<{ srt: string; text: string }> {
  const res = await fetch(`${REPLICATE_API}/models/openai/whisper/predictions`, {
    method: "POST",
    headers: replicateHeaders(),
    body: JSON.stringify({
      input: {
        audio: audioUrl,
        model: "large-v3",
        translate: false,
        language: "en",
        transcription: "srt",
      },
    }),
  });

  if (!res.ok) throw new Error("Caption generation failed.");
  const data = await res.json();

  const transcription = extractReplicateOutput(data);
  if (!transcription) {
    if (data.urls?.get) {
      const result = await pollReplicatePrediction(data.urls.get);
      const output = result.output as Record<string, unknown> | null;
      return {
        srt: (output?.transcription || output?.srt || "") as string,
        text: (output?.text || "") as string,
      };
    }
    throw new Error("No captions generated.");
  }

  return {
    srt: typeof transcription === "string" ? transcription : "",
    text: typeof transcription === "string" ? transcription : "",
  };
}

// ── Background Music (MusicGen) ──

/**
 * Generate background music from a text description.
 * Uses MusicGen on Replicate.
 */
export async function generateMusic(
  description: string,
  durationSeconds: number = 30
): Promise<{ musicUrl: string }> {
  const res = await fetch(`${REPLICATE_API}/models/meta/musicgen/predictions`, {
    method: "POST",
    headers: replicateHeaders(),
    body: JSON.stringify({
      input: {
        prompt: description,
        duration: Math.min(durationSeconds, 60),
        model_version: "stereo-melody-large",
        output_format: "mp3",
        normalization_strategy: "loudness",
      },
    }),
  });

  if (!res.ok) throw new Error("Music generation failed.");
  const data = await res.json();

  const musicUrl = extractReplicateOutput(data);
  if (!musicUrl) {
    if (data.urls?.get) {
      const result = await pollReplicatePrediction(data.urls.get);
      const url = extractReplicateOutput(result);
      if (url) return { musicUrl: url };
    }
    throw new Error("No music generated.");
  }

  return { musicUrl };
}

// ── Full Pipeline with Captions + Music ──

/**
 * Generate a complete video with optional captions and background music.
 */
export async function generateFullVideo(
  request: VideoGenerationRequest & { captions?: boolean; music?: string },
  onProgress?: (status: PipelineStatus) => void
): Promise<VideoGenerationResult & { captionsSrt?: string; musicUrl?: string }> {
  // Generate the base spokesperson video
  const result = await generateSpokespersonVideo(request, onProgress);

  let captionsSrt: string | undefined;
  let musicUrl: string | undefined;

  // Add captions if requested
  if (request.captions !== false) {
    try {
      onProgress?.({ step: "captions", progress: 92, message: "Generating captions..." });
      const captions = await generateCaptions(result.audioUrl);
      captionsSrt = captions.srt;
    } catch (err) {
      console.warn("[video-pipeline] Caption generation failed:", err);
      // Non-fatal — video still works without captions
    }
  }

  // Add background music if requested
  if (request.music) {
    try {
      onProgress?.({ step: "music", progress: 95, message: "Creating background music..." });
      const music = await generateMusic(request.music, result.duration);
      musicUrl = music.musicUrl;
    } catch (err) {
      console.warn("[video-pipeline] Music generation failed:", err);
      // Non-fatal — video still works without music
    }
  }

  onProgress?.({ step: "done", progress: 100, message: "Complete" });

  return {
    ...result,
    captionsSrt,
    musicUrl,
  };
}

// ── Provider Check ──

export function isCustomPipelineAvailable(): boolean {
  return !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.ZOOBICON_VIDEO_API_URL);
}

export function getVideoPipelineInfo(): {
  available: boolean;
  provider: "replicate" | "self-hosted" | "none";
  models: string[];
} {
  if (process.env.ZOOBICON_VIDEO_API_URL) {
    return { available: true, provider: "self-hosted", models: ["fish-speech", "flux", "sadtalker"] };
  }
  if (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY) {
    return { available: true, provider: "replicate", models: ["fish-speech", "flux", "sadtalker"] };
  }
  return { available: false, provider: "none", models: [] };
}

// ── Helpers ──

function estimateDuration(text: string): number {
  // Average speaking rate: ~150 words per minute
  const words = text.split(/\s+/).length;
  return Math.ceil((words / 150) * 60);
}

function extractReplicateOutput(data: Record<string, unknown>): string | null {
  if (typeof data.output === "string") return data.output;
  if (Array.isArray(data.output)) return data.output[0] || null;
  if (data.output && typeof data.output === "object") {
    const out = data.output as Record<string, unknown>;
    return (out.audio || out.video || out.image || out[0]) as string || null;
  }
  return null;
}

async function pollReplicatePrediction(
  getUrl: string,
  maxAttempts = 120,
  intervalMs = 3000
): Promise<Record<string, unknown>> {
  const token = getReplicateToken();
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) continue;
    const data = await res.json();
    if (data.status === "succeeded") return data;
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || "Generation failed.");
    }
  }
  throw new Error("Generation timed out.");
}
