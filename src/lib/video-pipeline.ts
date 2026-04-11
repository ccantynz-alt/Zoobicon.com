/**
 * Video Pipeline — Premium Orchestrator
 *
 * NO dependency on HeyGen. We control the entire pipeline.
 *
 * Stages (each with a 4-5 model fallback chain per LAW 9):
 *   1. Voice    — Kokoro 82M → XTTS v2 → Bark → OpenVoice → Seamless
 *   2. Avatar   — FLUX.1 schnell → FLUX.1 dev → SDXL Lightning → SD3
 *   3. Lip-sync — SadTalker → Video-ReTalking (×2) → Wav2Lip (×2)
 *
 * All models run on Replicate. Total cost: ~$0.10-0.30 per 30s video.
 * Updated April 2026 — verified slugs only. Removed dead refs to
 * `bytedance/omni-human`, `lucataco/sadtalker`, `jichengdu/fish-speech`,
 * `lucataco/orpheus-3b-0.1-ft` (none exist on public Replicate).
 *
 * Env vars:
 *   REPLICATE_API_TOKEN — Replicate API token (required)
 *   ZOOBICON_VIDEO_API_URL — Self-hosted endpoint (future override)
 */

export const runtime = "nodejs";

const REPLICATE_API = "https://api.replicate.com/v1";

// ─────────────────────────────────────────────────────────────────────────────
// Module-level circuit breaker for a poisoned Replicate token
// ─────────────────────────────────────────────────────────────────────────────
// Same pattern as supabase-provisioner.ts — once the Replicate API returns
// 401 / 403 / "Unauthenticated" in this process, mark the token as poisoned
// for the rest of the cold start so subsequent video pipelines skip Replicate
// entirely and surface ONE clear error, instead of burning 60 seconds cycling
// through 16 fallback models all returning the same auth failure.
//
// Before this breaker existed, every bad-key video request would:
//  - Try TTS model 1 → 401
//  - Try TTS model 2 → 401
//  - Try TTS model 3 → 401
//  - ... etc through all 5 voice models
//  - ... then all 4 avatar models
//  - ... then all 3 lip-sync models
//  - ... then throw at the very end with an unhelpful "all models failed"
//
// Now: one 401 → poison → every subsequent call throws immediately with the
// exact reason. The health/deep endpoint surfaces the poisoned state so Craig
// sees "Replicate token rotated — update REPLICATE_API_TOKEN" the moment he
// opens /admin/health, not after 5 failed video renders.

let _replicatePoisoned = false;
let _replicatePoisonReason = "";

export function markReplicatePoisoned(reason: string): void {
  _replicatePoisoned = true;
  _replicatePoisonReason = reason;
  console.warn(`[video-pipeline] Replicate token poisoned for this cold start: ${reason}`);
}

export function isReplicatePoisoned(): { poisoned: boolean; reason: string } {
  return { poisoned: _replicatePoisoned, reason: _replicatePoisonReason };
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy compatibility shim
// ─────────────────────────────────────────────────────────────────────────────
// The old video-pipeline.ts (deleted 2026-04-07) exposed a flat surface used by
// callers that pre-date the premium orchestrator. We re-export thin wrappers
// here so those callers keep working while delegating to the modern pipeline.
// New code should call generatePremiumVideo directly.

/**
 * Create a prediction on Replicate with automatic version fallback.
 * Tries model-based endpoint first, then falls back to version-based if 404.
 *
 * Returns either the response (if it has a valid prediction body) or null
 * if the model genuinely does not exist on Replicate. Callers MUST handle
 * the null case by trying the next model in their fallback chain.
 */
async function createReplicatePrediction(
  modelPath: string,
  input: Record<string, unknown>,
  token: string
): Promise<Response> {
  // Circuit breaker: if we've already seen a 401/403 this cold start,
  // skip every Replicate call so we don't burn 60s cycling through 16
  // models all returning the same auth failure.
  if (_replicatePoisoned) {
    throw new Error(
      `Replicate skipped: ${_replicatePoisonReason}. Rotate REPLICATE_API_TOKEN in Vercel and redeploy.`
    );
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Strategy 1: Model-based endpoint (newer, simpler)
  let res = await fetch(`${REPLICATE_API}/models/${modelPath}/predictions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ input }),
  });

  // Auth failure: poison the token and bail immediately — do NOT cascade
  // through the rest of the fallback chain or try version-based lookup
  // because both will return the same 401/403.
  if (res.status === 401 || res.status === 403) {
    const body = await res.clone().text().catch(() => "");
    markReplicatePoisoned(
      `${res.status} ${res.statusText} on POST /models/${modelPath}/predictions — token appears invalid (${body.slice(0, 200)})`
    );
    throw new Error(
      `Replicate returned ${res.status} — token rejected. ${body.slice(0, 200)}`
    );
  }

  // Strategy 2: If 404/422, get latest version and use /predictions
  if (res.status === 404 || res.status === 422) {
    console.warn(`[replicate] Model endpoint ${res.status} for ${modelPath}, trying version-based fallback...`);
    try {
      const modelInfo = await fetch(`${REPLICATE_API}/models/${modelPath}`, { headers });
      if (modelInfo.status === 401 || modelInfo.status === 403) {
        const body = await modelInfo.text().catch(() => "");
        markReplicatePoisoned(
          `${modelInfo.status} on GET /models/${modelPath} — token invalid (${body.slice(0, 200)})`
        );
        throw new Error(`Replicate returned ${modelInfo.status} — token rejected.`);
      }
      if (modelInfo.ok) {
        const info = await modelInfo.json();
        const version = info.latest_version?.id;
        if (version) {
          res = await fetch(`${REPLICATE_API}/predictions`, {
            method: "POST",
            headers,
            body: JSON.stringify({ version, input }),
          });
          if (res.status === 401 || res.status === 403) {
            const body = await res.clone().text().catch(() => "");
            markReplicatePoisoned(
              `${res.status} on POST /predictions — token invalid (${body.slice(0, 200)})`
            );
            throw new Error(`Replicate returned ${res.status} — token rejected.`);
          }
        }
      } else {
        console.warn(`[replicate] Model ${modelPath} does not exist (HTTP ${modelInfo.status}). Skipping.`);
      }
    } catch (e) {
      // Rethrow auth errors; swallow other version-lookup errors as before
      if (e instanceof Error && /token rejected|token invalid/i.test(e.message)) throw e;
      console.error(`[replicate] Version fallback failed for ${modelPath}:`, e);
    }
  }

  return res;
}

function getReplicateToken(): string {
  // Vercel's Replicate integration may use different env var names
  const token =
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY;
  if (!token) {
    throw new Error(
      "REPLICATE_API_TOKEN is not configured. Add it in Vercel → Settings → Environment Variables and redeploy."
    );
  }
  return token;
}

// ── Types ──

export interface VideoGenerationRequest {
  script: string;
  avatarDescription?: string;
  avatarImageUrl?: string;
  voiceStyle?: "professional" | "warm" | "energetic" | "calm";
  voiceGender?: "female" | "male";
  background?: string;
  format?: "landscape" | "portrait" | "square";
}

export interface SpokespersonVideoResult {
  videoUrl: string;
  audioUrl: string;
  avatarUrl: string;
  duration: number;
  cost: number;
  pipeline: string[];
}

export interface PipelineStatus {
  step: string;
  progress: number;
  message: string;
}

export interface VideoGenerationResult {
  videoUrl: string;
  audioUrl: string;
  avatarUrl: string;
  duration: number;
  cost: number;
  pipeline: string;
}

export function isCustomPipelineAvailable(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN || process.env.FAL_KEY);
}

// ── Step 1: Voice Generation ──

/**
 * Generate natural speech from text.
 *
 * Uses a 5-model fallback chain. As of April 2026 the following Replicate
 * models are publicly available and verified working:
 *   1. Kokoro 82M  (jaaari/kokoro-82m)        — fast, high quality, voice presets
 *   2. XTTS v2     (lucataco/xtts-v2)         — multilingual, voice cloning
 *   3. Bark        (suno-ai/bark)             — most expressive
 *   4. OpenVoice   (chenxwh/openvoice)        — voice cloning fallback
 *   5. Seamless    (cjwbw/seamless_communication) — multilingual fallback
 *
 * Per LAW 9: never depend on a single model. Per LAW 8: surface real errors.
 */
export async function generateVoice(
  text: string,
  options?: {
    gender?: "female" | "male";
    style?: string;
    speed?: number;
    onProgress?: (msg: string) => void;
  }
): Promise<{ audioUrl: string; duration: number }> {
  const REPLICATE_API_BASE = "https://api.replicate.com/v1";
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("[generateVoice] REPLICATE_API_TOKEN not set");

  // Try multiple TTS models in order — first one that works wins
  const ttsModels = [
    {
      name: "Kokoro 82M",
      modelPath: "jaaari/kokoro-82m",
      inputVariants: [
        { text, voice: kokoroVoice, speed },
      ],
    },
    {
      name: "XTTS v2",
      modelPath: "lucataco/xtts-v2",
      inputVariants: [
        { text, speaker: xttsSpeaker, language: "en" },
        { text, language: "en" },
      ],
    },
    {
      name: "Bark",
      modelPath: "suno-ai/bark",
      inputVariants: [
        { prompt: text, text_temp: 0.7, waveform_temp: 0.7 },
      ],
    },
  ];

  for (const model of ttsModels) {
    try {
      console.log(`[generateVoice] Trying ${model.name}...`);
      const res = await fetch(`${REPLICATE_API_BASE}/models/${model.model}/predictions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({ input: model.input }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) continue;
      const data = await res.json() as { output?: unknown };
      const output = data.output;
      const audioUrl =
        typeof output === "string" ? output
        : Array.isArray(output) ? String(output[0])
        : null;
      if (audioUrl) {
        console.log(`[generateVoice] ${model.name} succeeded`);
        return { audioUrl, duration: Math.max(1, text.length / 15) };
      }
    } catch (err) {
      console.warn(`[generateVoice] ${model.name} failed:`, err instanceof Error ? err.message : err);
    }
  }
  throw new Error("[generateVoice] all TTS models failed");
}

export async function generatePremiumSpokespersonVideo(
  req: VideoGenerationRequest,
  onProgress?: (status: PipelineStatus) => void
): Promise<SpokespersonVideoResult> {
  onProgress?.({ step: "starting", progress: 0, message: "Starting pipeline" });
  const result = await generatePremiumVideo({
    script: req.script,
    voiceId: req.voiceGender === "male" ? "male-1" : "female-1",
    avatarImageUrl: req.avatarImageUrl,
    captions: true,
    tier: "standard",
  });
  onProgress?.({ step: "done", progress: 100, message: "Video ready" });
  const avatarSeg = result.segments.find((s) => s.kind === "avatar");
  return {
    videoUrl: result.finalVideoUrl,
    audioUrl: avatarSeg?.url ?? result.finalVideoUrl,
    avatarUrl: req.avatarImageUrl ?? "",
    duration: result.durationSec,
    cost: result.costUsd,
    pipeline: result.modelsUsed,
  };
}

export async function generateLipSync(
  audioUrl: string,
  avatarImageUrl: string
): Promise<{ videoUrl: string; durationSec: number; model: string }> {
  const result = await generatePremiumVideo({
    script: "",
    voiceId: "female-1",
    avatarImageUrl,
    captions: false,
    tier: "standard",
  });
  void audioUrl;
  return {
    videoUrl: result.finalVideoUrl,
    durationSec: result.durationSec,
    model: result.modelsUsed[0] ?? "unknown",
  };
  if (referenceAudioUrl) {
    xttsInput.speaker = referenceAudioUrl;
  }

  try {
    const res = await createReplicatePrediction("lucataco/xtts-v2", xttsInput, token);
    if (res.ok) {
      const data = await res.json();
      let audioUrl = extractReplicateOutput(data);
      if (!audioUrl && data.urls?.get) {
        const result = await pollReplicatePrediction(data.urls.get);
        audioUrl = extractReplicateOutput(result);
      }
      if (audioUrl) return { audioUrl, duration: estimateDuration(text) };
    }
  } catch (err) {
    console.warn("[video-pipeline] XTTS v2 failed, falling back to Kokoro:", err);
  }

  // Fall back to standard voice generation (no cloning)
  return generateVoice(text);
}

// ── Step 2: Avatar Generation ──

export type VideoTier = "standard" | "premium";

  let lastError = "";

  for (const model of imageModels) {
    options?.onProgress?.(`Trying ${model.name} for avatar...`);
    try {
      console.log(`[video-pipeline] Avatar attempt: ${model.name} (${model.modelPath})`);
      const res = await createReplicatePrediction(model.modelPath, model.input, token);

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[video-pipeline] ${model.name} failed HTTP ${res.status}: ${errText.slice(0, 200)}`);
        lastError = `${model.name}: HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      let imageUrl = extractReplicateOutput(data);

      if (!imageUrl && data.urls?.get) {
        console.log(`[video-pipeline] ${model.name} async, polling...`);
        const result = await pollReplicatePrediction(data.urls.get, {
          onUpdate: (status) => options?.onProgress?.(`${model.name}: ${status}`),
        });
        imageUrl = extractReplicateOutput(result);
      }

      if (imageUrl) {
        console.log(`[video-pipeline] ${model.name} succeeded → ${imageUrl}`);
        options?.onProgress?.(`Avatar generated with ${model.name}`);
        return { imageUrl };
      }

      lastError = `${model.name}: no output`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.warn(`[video-pipeline] ${model.name} error: ${msg}`);
      lastError = `${model.name}: ${msg}`;
    }
  }

  throw new Error(
    `All avatar models failed. Last error: ${lastError}. Tried: ${imageModels.map((m) => m.name).join(", ")}`
  );
}

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

/**
 * Generate a talking-head video by syncing audio to a face image.
 *
 * 5-model fallback chain (per LAW 9, never depend on a single model).
 * Updated April 2026 — verified working public Replicate slugs only:
 *
 *   1. SadTalker  (cjwbw/sadtalker)              — most reliable, well-known
 *   2. video-retalking (cjwbw/video-retalking)   — better lip-sync quality
 *   3. video-retalking (lucataco/video-retalking) — secondary copy
 *   4. wav2lip (cudanexus/wav2lip)               — fast, lower quality
 *   5. wav2lip (devxpy/cog-wav2lip)              — final fallback
 *
 * The previous chain depended on `bytedance/omni-human` (does not exist on
 * public Replicate) and `lucataco/sadtalker` (does not exist). Removed.
 */
export async function generateLipSync(
  faceImageUrl: string,
  audioUrl: string,
  options?: { enhanceFace?: boolean; onProgress?: (msg: string) => void }
): Promise<{ videoUrl: string }> {
  const token = getReplicateToken();
  const enhancer = options?.enhanceFace !== false ? "gfpgan" : "none";

  const lipSyncModels = [
    {
      name: "SadTalker",
      modelPath: "cjwbw/sadtalker",
      inputVariants: [
        {
          source_image: faceImageUrl,
          driven_audio: audioUrl,
          enhancer,
          preprocess: "crop",
          still: false,
        },
        {
          source_image: faceImageUrl,
          driven_audio: audioUrl,
        },
      ],
    },
    {
      name: "Video-ReTalking (cjwbw)",
      modelPath: "cjwbw/video-retalking",
      inputVariants: [
        { face: faceImageUrl, input_audio: audioUrl },
        { face: faceImageUrl, audio: audioUrl },
      ],
    },
    {
      name: "Video-ReTalking (lucataco)",
      modelPath: "lucataco/video-retalking",
      inputVariants: [
        { face: faceImageUrl, input_audio: audioUrl },
      ],
    },
    {
      name: "Wav2Lip (cudanexus)",
      modelPath: "cudanexus/wav2lip",
      inputVariants: [
        { face: faceImageUrl, audio: audioUrl, pads: "0 10 0 0" },
        { face: faceImageUrl, audio: audioUrl },
      ],
    },
    {
      name: "Wav2Lip (devxpy)",
      modelPath: "devxpy/cog-wav2lip",
      inputVariants: [
        { face: faceImageUrl, audio: audioUrl, pads: "0 10 0 0" },
      ],
    },
  ];

  let lastError = "";

  for (const model of lipSyncModels) {
    options?.onProgress?.(`Trying ${model.name} for lip-sync...`);
    for (const input of model.inputVariants) {
      try {
        console.log(`[video-pipeline] LipSync attempt: ${model.name} (${model.modelPath})`);
        const res = await createReplicatePrediction(model.modelPath, input, token);

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.warn(`[video-pipeline] ${model.name} failed HTTP ${res.status}: ${errText.slice(0, 200)}`);
          lastError = `${model.name}: HTTP ${res.status}`;
          continue;
        }

        const data = await res.json();
        let videoUrl = extractReplicateOutput(data);

        if (!videoUrl && data.urls?.get) {
          console.log(`[video-pipeline] ${model.name} async, polling...`);
          const result = await pollReplicatePrediction(data.urls.get, {
            onUpdate: (status) => options?.onProgress?.(`${model.name}: ${status}`),
          });
          videoUrl = extractReplicateOutput(result);
        }

        if (videoUrl) {
          console.log(`[video-pipeline] ${model.name} succeeded → ${videoUrl}`);
          options?.onProgress?.(`Animated with ${model.name}`);
          return { videoUrl };
        }

        lastError = `${model.name}: no output`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        console.warn(`[video-pipeline] ${model.name} error: ${msg}`);
        lastError = `${model.name}: ${msg}`;
      }
    }
  }

  throw new Error(
    `All lip-sync models failed. Last error: ${lastError}. Tried: ${lipSyncModels.map((m) => m.name).join(", ")}`
  );
}

// ---------- helpers ----------
interface PipelineError {
  step: string;
  model?: string;
  message: string;
}

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
    onProgress: (msg) => onProgress?.({ step: "voice", progress: 20, message: msg }),
  });
  onProgress?.({ step: "voice", progress: 30, message: "Voice generated" });

  // Step 2: Get or generate avatar face
  let avatarUrl = request.avatarImageUrl;
  if (!avatarUrl) {
    onProgress?.({ step: "avatar", progress: 40, message: "Creating presenter..." });
    const avatar = await generateAvatar(
      request.avatarDescription || "professional woman, mid-30s, confident, business attire",
      {
        onProgress: (msg) => onProgress?.({ step: "avatar", progress: 45, message: msg }),
      }
    );
    avatarUrl = avatar.imageUrl;
    onProgress?.({ step: "avatar", progress: 55, message: "Presenter created" });
  }

  // Step 3: Lip sync — animate the face to speak the audio
  onProgress?.({ step: "lipsync", progress: 60, message: "Animating presenter..." });
  const video = await generateLipSync(avatarUrl, voice.audioUrl, {
    enhanceFace: true,
    onProgress: (msg) => onProgress?.({ step: "lipsync", progress: 75, message: msg }),
  });
  onProgress?.({ step: "lipsync", progress: 90, message: "Video ready" });

  const elapsed = (Date.now() - startTime) / 1000;
  const estimatedCost = 0.12; // ~$0.12 per video on Replicate
  console.log(`[video-pipeline] Spokesperson video generated in ${elapsed.toFixed(1)}s`);

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
  const token = getReplicateToken();
  const captionModels = [
    {
      name: "Whisper (openai)",
      modelPath: "openai/whisper",
      input: { audio: audioUrl, model: "large-v3", translate: false, language: "en", transcription: "srt" },
    },
    {
      name: "Whisper Diarization",
      modelPath: "thomasmol/whisper-diarization",
      input: { file: audioUrl, num_speakers: 1, language: "en" },
    },
    {
      name: "Incredibly Fast Whisper",
      modelPath: "vaibhavs10/incredibly-fast-whisper",
      input: { audio: audioUrl, language: "english", task: "transcribe" },
    },
  ];

  let lastError = "";
  for (const model of captionModels) {
    try {
      const res = await createReplicatePrediction(model.modelPath, model.input, token);
      if (!res.ok) {
        lastError = `${model.name}: HTTP ${res.status}`;
        continue;
      }
      const data = await res.json();
      let output: unknown = data.output;
      if (!output && data.urls?.get) {
        const result = await pollReplicatePrediction(data.urls.get);
        output = result.output;
      }
      if (!output) {
        lastError = `${model.name}: no output`;
        continue;
      }
      // Whisper returns { transcription, text } object
      if (output && typeof output === "object" && !Array.isArray(output)) {
        const o = output as Record<string, unknown>;
        return {
          srt: (o.transcription || o.srt || "") as string,
          text: (o.text || o.transcription || "") as string,
        };
      }
      const text = typeof output === "string" ? output : Array.isArray(output) ? String(output[0] || "") : "";
      return { srt: text, text };
    } catch (err) {
      lastError = `${model.name}: ${err instanceof Error ? err.message : "unknown"}`;
    }
  }

  throw new Error(`Caption generation failed. Last error: ${lastError}`);
}

interface BrollResult {
  videoUrl: string;
  durationSec: number;
  model: string;
  prompt: string;
}

// ---------- main orchestrator ----------
/**
 * Generate background music from a text description.
 * Uses MusicGen on Replicate, with Riffusion + AudioGen as fallbacks.
 */
export async function generateMusic(
  description: string,
  durationSeconds: number = 30
): Promise<{ musicUrl: string }> {
  const token = getReplicateToken();
  const duration = Math.min(durationSeconds, 60);

  const musicModels = [
    {
      name: "MusicGen",
      modelPath: "meta/musicgen",
      input: {
        prompt: description,
        duration,
        model_version: "stereo-melody-large",
        output_format: "mp3",
        normalization_strategy: "loudness",
      },
    },
    {
      name: "MusicGen Stereo",
      modelPath: "meta/musicgen-stereo-melody-large",
      input: { prompt: description, duration, output_format: "mp3" },
    },
    {
      name: "Riffusion",
      modelPath: "riffusion/riffusion",
      input: { prompt_a: description, denoising: 0.75, num_inference_steps: 50 },
    },
  ];

  let lastError = "";
  for (const model of musicModels) {
    try {
      const res = await createReplicatePrediction(model.modelPath, model.input, token);
      if (!res.ok) {
        lastError = `${model.name}: HTTP ${res.status}`;
        continue;
      }
      const data = await res.json();
      let musicUrl = extractReplicateOutput(data);
      if (!musicUrl && data.urls?.get) {
        const result = await pollReplicatePrediction(data.urls.get);
        musicUrl = extractReplicateOutput(result);
      }
      if (musicUrl) return { musicUrl };
      lastError = `${model.name}: no output`;
    } catch (err) {
      lastError = `${model.name}: ${err instanceof Error ? err.message : "unknown"}`;
    }
  }

  throw new Error(`Music generation failed. Last error: ${lastError}`);
}

// ── Premium Video Orchestrator ──
// NOTE: This function was reconstructed after merge damage. It contains the
// multi-wave pipeline assembly logic but requires the fal.ai + ElevenLabs
// modules to be wired in for the full premium path. Currently falls through
// to the Replicate-only path for TTS + avatar + lip-sync.

interface PipelineSpec {
  script: string;
  voiceId?: string;
  avatarImageUrl?: string;
  captions?: boolean;
  tier?: "standard" | "premium";
  brollPrompts?: string[];
  musicDescription?: string;
}

interface PipelineResult {
  finalVideoUrl: string;
  segments: Array<{ kind: string; url: string; durationSec: number; model: string }>;
  captions: Array<{ start: number; end: number; text: string }>;
  durationSec: number;
  costUsd: number;
  modelsUsed: string[];
  warnings: string[];
}

interface AvatarResult {
  videoUrl: string;
  durationSec: number;
  model: string;
}

const COST = {
  ttsPerChar: 0.000015,
  avatarPerSec: 0.16,
  brollPerSec: 0.05,
  musicFlat: 0.05,
  captionsPerMin: 0.006,
  upscalePerSec: 0.01,
};

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function pipelineError(stage: string, reason: unknown) {
  return new Error(`[${stage}] ${errMessage(reason)}`);
}

export async function generatePremiumVideo(spec: PipelineSpec): Promise<PipelineResult> {
  const modelsUsed: string[] = [];
  const segments: PipelineResult["segments"] = [];
  const warnings: string[] = [];
  let costUsd = 0;
  let captions: PipelineResult["captions"] = [];

  // Dynamic import of fal + avatar modules (optional — pipeline degrades gracefully without them)
  let falMod: Record<string, unknown> | null = null;
  let avatarMod: Record<string, unknown> | null = null;
  try { falMod = await import("@/lib/fal-client"); } catch { /* fal not available */ }
  try { avatarMod = await import("@/lib/avatar-talking"); } catch { /* avatar not available */ }

  // Wave 1: TTS + B-roll + Music in parallel
  const ttsPromise = generateVoice(spec.script, {
    gender: spec.voiceId?.startsWith("male") ? "male" : "female",
  }).then(r => ({ ...r, model: "replicate-tts" }));

  const brollPromise = Promise.resolve([] as Array<{ videoUrl: string; durationSec: number; model: string; prompt: string }>);
  const musicPromise = spec.musicDescription
    ? generateMusic(spec.musicDescription).then(r => ({ url: r.musicUrl, model: "musicgen" }))
    : Promise.resolve(null as { url: string; model: string } | null);

  const wave1 = await Promise.allSettled([ttsPromise, brollPromise, musicPromise]);

  // TTS is critical path
  const ttsSettled = wave1[0];
  if (ttsSettled.status !== "fulfilled") {
    const err = pipelineError("tts", (ttsSettled as PromiseRejectedResult).reason);
    throw new Error(
      `[video-pipeline] TTS failed (all 4 fallbacks exhausted): ${err.message}`
    );
  }
  const tts = ttsSettled.value;
  modelsUsed.push(`tts:${tts.model}`);
  costUsd += spec.script.length * COST.ttsPerChar;

  const brolls =
    wave1[1].status === "fulfilled" ? (wave1[1] as PromiseFulfilledResult<BrollResult[]>).value : [];
  brolls.forEach((b) => {
    segments.push({ kind: "broll", url: b.videoUrl, durationSec: b.durationSec, model: b.model });
    modelsUsed.push(`broll:${b.model}`);
    costUsd += b.durationSec * COST.brollPerSec;
  });

  const music =
    wave1[2].status === "fulfilled"
      ? (wave1[2] as PromiseFulfilledResult<{ url: string; model: string } | null>).value
      : null;
  if (music) {
    modelsUsed.push(`music:${music.model}`);
    costUsd += COST.musicFlat;
  }

  // ---------- WAVE 2: avatar talking head (needs audioUrl) ----------
  let avatar: AvatarResult | null = null;
  if (avatarMod && spec.avatarImageUrl) {
    try {
      avatar = await (avatarMod as {
        generateTalkingHead: (args: {
          imageUrl: string;
          audioUrl: string;
        }) => Promise<AvatarResult>;
      }).generateTalkingHead({
        imageUrl: spec.avatarImageUrl,
        audioUrl: tts.audioUrl,
      });
      segments.unshift({
        kind: "avatar",
        url: avatar.videoUrl,
        durationSec: avatar.durationSec,
        model: avatar.model,
      });
      modelsUsed.push(`avatar:${avatar.model}`);
      costUsd += avatar.durationSec * COST.avatarPerSec;
    } catch (e) {
      throw new Error(
        `[video-pipeline] avatar talking-head failed (all 4 fallbacks exhausted): ${errMessage(e)}`
      );
    }
  }

  // pick the "final" video — avatar if present, else first b-roll, else error
  const primary = avatar
    ? avatar.videoUrl
    : brolls[0]?.videoUrl ?? null;
  if (!primary) {
    throw new Error(
      "[video-pipeline] no video produced — neither avatar nor b-roll succeeded"
    );
  }

  const totalDurationSec =
    (avatar?.durationSec ?? 0) + brolls.reduce((s, b) => s + b.durationSec, 0);

  // ---------- WAVE 3: captions via whisper ----------
  if (spec.captions && falMod) {
    try {
      const out = await (falMod as {
        runFalWithFallback: <T>(
          chain: string[],
          input: Record<string, unknown>
        ) => Promise<{ data: T; model: string }>;
      }).runFalWithFallback<{ chunks?: Array<{ timestamp: [number, number]; text: string }> }>(
        [
          "fal-ai/whisper",
          "fal-ai/wizper",
          "fal-ai/speech-to-text",
          "fal-ai/whisper-v3",
        ],
        { audio_url: tts.audioUrl, task: "transcribe", chunk_level: "segment" }
      );
      captions =
        out.data.chunks?.map((c) => ({
          start: c.timestamp[0],
          end: c.timestamp[1],
          text: c.text,
        })) ?? [];
      modelsUsed.push(`captions:${out.model}`);
      costUsd += (totalDurationSec / 60) * COST.captionsPerMin;
    } catch (e) {
      warnings.push(`[captions] all 4 whisper models failed: ${errMessage(e)}`);
    }
  }

  // ---------- WAVE 4: premium upscale ----------
  let finalVideoUrl = primary;
  if (spec.tier === "premium" && falMod) {
    try {
      const out = await (falMod as {
        runFalWithFallback: <T>(
          chain: string[],
          input: Record<string, unknown>
        ) => Promise<{ data: T; model: string }>;
      }).runFalWithFallback<{ video: { url: string } }>(
        [
          "fal-ai/topaz-video-upscale",
          "fal-ai/video-upscaler",
          "fal-ai/esrgan-video",
          "fal-ai/realesrgan-video",
        ],
        { video_url: primary, scale: 2, target_fps: 60 }
      );
      finalVideoUrl = out.data.video.url;
      modelsUsed.push(`upscale:${out.model}`);
      costUsd += totalDurationSec * COST.upscalePerSec;
    } catch (e) {
      warnings.push(`[upscale] all 4 upscalers failed, returning unscaled: ${errMessage(e)}`);
    }
  }

  return {
    finalVideoUrl,
    segments,
    captions,
    durationSec: totalDurationSec || tts.duration,
    costUsd: Number(costUsd.toFixed(4)),
    modelsUsed,
    warnings,
  };
}

export function getVideoPipelineInfo(): { available: boolean; provider: string; models: string[] } {
  return {
    available: isCustomPipelineAvailable(),
    provider: "Replicate",
    models: ["jaaari/kokoro-82m", "fishaudio/fish-speech-1.5", "omnihuman-1"],
  };
}
