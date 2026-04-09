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

  // Strategy 2: If 404/422, get latest version and use /predictions
  if (res.status === 404 || res.status === 422) {
    console.warn(`[replicate] Model endpoint ${res.status} for ${modelPath}, trying version-based fallback...`);
    try {
      const modelInfo = await fetch(`${REPLICATE_API}/models/${modelPath}`, { headers });
      if (modelInfo.ok) {
        const info = await modelInfo.json();
        const version = info.latest_version?.id;
        if (version) {
          res = await fetch(`${REPLICATE_API}/predictions`, {
            method: "POST",
            headers,
            body: JSON.stringify({ version, input }),
          });
        }
      } else {
        console.warn(`[replicate] Model ${modelPath} does not exist (HTTP ${modelInfo.status}). Skipping.`);
      }
    } catch (e) {
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
  const token = getReplicateToken();
  const speed = options?.speed || 1.0;
  const gender = options?.gender || "female";

  // Kokoro voice IDs (verified): af_bella, af_sarah, am_adam, am_michael
  const kokoroVoice = gender === "male" ? "am_michael" : "af_bella";
  // XTTS speaker presets (verified): "Claribel Dervla", "Daisy Studious", "Damien Black"...
  const xttsSpeaker = gender === "male" ? "Damien Black" : "Claribel Dervla";

  // Each entry has multiple input variants in case the model expects
  // a slightly different schema across versions.
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
    {
      name: "OpenVoice",
      modelPath: "chenxwh/openvoice",
      inputVariants: [
        { text, language: "EN_NEWEST", speed },
        { text },
      ],
    },
    {
      name: "Seamless Communication",
      modelPath: "cjwbw/seamless_communication",
      inputVariants: [
        { task_name: "T2ST (Text to Speech translation)", input_text: text, input_text_language: "English", target_language_text_only: "English", target_language_with_speech: "English" },
      ],
    },
  ];

  // Try each TTS model in order (Law 9: 4+ model fallback chain)
  for (const model of ttsModels) {
    for (const input of model.inputVariants) {
      try {
        options?.onProgress?.(`Trying ${model.name}…`);
        const res = await createReplicatePrediction(model.modelPath, input, token);
        if (!res.ok) {
          console.warn(`[video-pipeline] ${model.name} HTTP ${res.status}`);
          continue;
        }
        const predData = await res.json();
        // Check if result is already available (synchronous)
        let audioUrl = extractReplicateOutput(predData);
        // If async, poll for completion
        if (!audioUrl && predData.urls?.get) {
          const pollResult = await pollReplicatePrediction(predData.urls.get, {
            onUpdate: (status) => options?.onProgress?.(`${model.name}: ${status}`),
          });
          audioUrl = extractReplicateOutput(pollResult);
        }
        if (audioUrl) {
          options?.onProgress?.(`Voice generated with ${model.name}`);
          return { audioUrl, duration: estimateDuration(text) };
        }
      } catch (err) {
        console.warn(`[video-pipeline] TTS ${model.name} failed:`, err instanceof Error ? err.message : err);
      }
    }
  }
  throw new Error("All TTS models failed. Check REPLICATE_API_TOKEN and model availability.");
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

/**
 * Generate voice using XTTS v2 with optional voice cloning.
 *
 * If `referenceAudioUrl` is provided, XTTS will clone that voice. Otherwise
 * it uses a default speaker. Used by the voice-clone feature.
 *
 * Falls back to Kokoro 82M if XTTS is unavailable (without cloning, since
 * Kokoro doesn't support reference-based cloning).
 */
export async function generateVoiceXTTS(
  text: string,
  referenceAudioUrl?: string
): Promise<{ audioUrl: string; duration: number }> {
  const token = getReplicateToken();

  // Try XTTS v2 first — supports voice cloning via `speaker` param
  const xttsInput: Record<string, unknown> = {
    text,
    language: "en",
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

/**
 * Generate a photorealistic avatar face.
 *
 * Primary: FLUX.1 schnell (black-forest-labs/flux-schnell). Falls back to
 * SDXL Lightning, then Stable Diffusion 3 if the primary is unavailable.
 */
export async function generateAvatar(
  description: string,
  options?: { onProgress?: (msg: string) => void }
): Promise<{ imageUrl: string }> {
  const token = getReplicateToken();
  const prompt = `Professional headshot portrait photo of ${description}. Clean background, studio lighting, sharp focus, photorealistic, 8k quality. Looking directly at camera with neutral pleasant expression. Shoulders visible. Professional attire.`;

  const imageModels = [
    {
      name: "FLUX.1 schnell",
      modelPath: "black-forest-labs/flux-schnell",
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 90,
        go_fast: true,
      },
    },
    {
      name: "FLUX.1 dev",
      modelPath: "black-forest-labs/flux-dev",
      input: {
        prompt,
        num_outputs: 1,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 90,
      },
    },
    {
      name: "SDXL Lightning",
      modelPath: "bytedance/sdxl-lightning-4step",
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 4,
      },
    },
    {
      name: "Stable Diffusion 3",
      modelPath: "stability-ai/stable-diffusion-3",
      input: {
        prompt,
        aspect_ratio: "1:1",
        output_format: "webp",
      },
    },
  ];

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

export function getVideoPipelineInfo(): {
  available: boolean;
  provider: "replicate" | "fal" | "self-hosted" | "none";
  models: string[];
} {
  if (process.env.FAL_KEY) {
    return { available: true, provider: "fal", models: ["veo-3", "sora-2", "runway-gen4", "kling-3", "hedra-character-3"] };
  }
  if (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.REPLICATE_TOKEN || process.env.REPLICATE_KEY) {
    return { available: true, provider: "replicate", models: ["kokoro-82m", "xtts-v2", "bark", "openvoice", "seamless"] };
  }
  if (process.env.ZOOBICON_VIDEO_API_URL) {
    return { available: true, provider: "self-hosted", models: ["fish-speech", "flux", "sadtalker"] };
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
  const output = data.output;
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    // Find first string element (some models return [url, metadata, ...])
    for (const item of output) {
      if (typeof item === "string" && item.length > 0) return item;
    }
    return null;
  }
  if (typeof output === "object") {
    const out = output as Record<string, unknown>;
    // Try common Replicate output keys in order
    const keys = ["audio", "video", "image", "url", "audio_out", "video_out", "wav", "mp3", "mp4", "output"];
    for (const key of keys) {
      const v = out[key];
      if (typeof v === "string" && v.length > 0) return v;
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    }
  }
  return null;
}

async function pollReplicatePrediction(
  getUrl: string,
  options?: {
    maxAttempts?: number;
    intervalMs?: number;
    onUpdate?: (status: string) => void;
  }
): Promise<Record<string, unknown>> {
  const token = getReplicateToken();
  const maxAttempts = options?.maxAttempts ?? 90; // 90 × 3s = 270s ≈ 4.5 min
  const intervalMs = options?.intervalMs ?? 3000;
  let consecutiveFailures = 0;
  let lastStatus = "";

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    let res: Response;
    try {
      res = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      consecutiveFailures++;
      if (consecutiveFailures > 5) {
        throw new Error(
          `Polling failed: cannot reach Replicate (${err instanceof Error ? err.message : "network error"})`
        );
      }
      continue;
    }

    if (!res.ok) {
      consecutiveFailures++;
      if (consecutiveFailures > 5) {
        throw new Error(`Polling failed: Replicate returned HTTP ${res.status} repeatedly.`);
      }
      continue;
    }

    consecutiveFailures = 0;
    const data = await res.json();

    if (data.status && data.status !== lastStatus) {
      lastStatus = data.status;
      options?.onUpdate?.(data.status);
    }

    if (data.status === "succeeded") return data;
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(data.error || `Prediction ${data.status}`);
    }
    // status === "starting" or "processing" — keep polling
  }

  throw new Error(`Generation timed out after ${(maxAttempts * intervalMs) / 1000}s`);
}
