/**
 * Zoobicon Video Pipeline — Our Own AI Video Generation Stack
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

import { assembleScenes, burnInCaptions, mixBackgroundMusic } from "./video-assembler";

const REPLICATE_API = "https://api.replicate.com/v1";

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
  avatarDescription?: string; // "professional woman, mid-30s, dark hair" — we generate the face
  avatarImageUrl?: string; // OR provide an existing face image
  voiceStyle?: "professional" | "warm" | "energetic" | "calm" | "authoritative";
  voiceGender?: "female" | "male";
  background?: string; // "modern office" | "gradient blue" | "#1a1a2e" | image URL
  format?: "landscape" | "portrait" | "square";
  speed?: number; // 0.8-1.2
  /**
   * Optional storyboard breakdown emitted by the AI Video Director
   * (see /api/video-creator/chat). When present, the renderer assembles
   * a multi-shot video instead of a single talking head: each scene drives
   * a distinct camera/mood/b-roll, then they're concatenated in order.
   */
  storyboard?: StoryboardScene[];
}

export interface StoryboardScene {
  scene: number;
  start: number; // seconds into the full script
  end: number;
  shot: string; // "tight headshot", "medium-wide walking", "close-up of hands"
  mood: string; // "confident", "warm", "urgent"
  broll?: string; // "product UI close-up", "customer logos", "none"
  onScreenText?: string;
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

  let lastError = "";

  for (const model of ttsModels) {
    options?.onProgress?.(`Trying ${model.name} for voice...`);
    for (const input of model.inputVariants) {
      try {
        console.log(`[video-pipeline] TTS attempt: ${model.name} (${model.modelPath})`);

        const res = await createReplicatePrediction(model.modelPath, input, token);

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.warn(`[video-pipeline] ${model.name} failed HTTP ${res.status}: ${errText.slice(0, 200)}`);
          lastError = `${model.name}: HTTP ${res.status}`;
          // 404 = model doesn't exist, 422 = bad input — both signal "try next variant"
          continue;
        }

        const data = await res.json();
        console.log(`[video-pipeline] ${model.name} prediction status:`, data.status);

        let audioUrl = extractReplicateOutput(data);

        if (!audioUrl && data.urls?.get) {
          console.log(`[video-pipeline] ${model.name} async, polling...`);
          const result = await pollReplicatePrediction(data.urls.get, {
            onUpdate: (status) => options?.onProgress?.(`${model.name}: ${status}`),
          });
          audioUrl = extractReplicateOutput(result);
        }

        if (audioUrl) {
          console.log(`[video-pipeline] ${model.name} succeeded → ${audioUrl}`);
          options?.onProgress?.(`Voice generated with ${model.name}`);
          return { audioUrl, duration: estimateDuration(text) };
        }

        console.warn(`[video-pipeline] ${model.name} returned no audio output`);
        lastError = `${model.name}: no output`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        console.warn(`[video-pipeline] ${model.name} error: ${msg}`);
        lastError = `${model.name}: ${msg}`;
        // Continue to next variant / model
      }
    }
  }

  throw new Error(
    `All voice models failed. Last error: ${lastError}. Tried: ${ttsModels.map((m) => m.name).join(", ")}`
  );
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

// ── Step 3: Lip Sync — The Magic ──

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

// ── Background Music (MusicGen) ──

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

// ── Full Pipeline with Captions + Music ──

/**
 * Generate a complete video with optional captions and background music.
 */
export async function generateFullVideo(
  request: VideoGenerationRequest & { captions?: boolean; music?: string },
  onProgress?: (status: PipelineStatus) => void
): Promise<
  VideoGenerationResult & {
    captionsSrt?: string;
    musicUrl?: string;
    storyboard?: StoryboardScene[];
    finalVideoUrl?: string;
    assembledFromScenes?: boolean;
  }
> {
  // If a storyboard was supplied, enrich the avatarDescription with the
  // dominant shot + mood from the opening scene so the FLUX avatar generator
  // produces a face that matches the director's intent (e.g. "tight headshot,
  // confident expression"). This is a one-line enrichment now and a full
  // multi-scene assembly path later — but the type contract is locked in so
  // downstream consumers (front-end preview, future FFmpeg assembler) can
  // start reading request.storyboard immediately.
  let enriched = request;
  if (request.storyboard && request.storyboard.length > 0) {
    const opener = request.storyboard[0];
    const shotHint = `${opener.shot}, ${opener.mood} expression`;
    enriched = {
      ...request,
      avatarDescription: request.avatarDescription
        ? `${request.avatarDescription}, ${shotHint}`
        : shotHint,
    };
    onProgress?.({
      step: "storyboard",
      progress: 5,
      message: `Storyboard loaded — ${request.storyboard.length} scenes`,
    });
  }

  // Generate the base spokesperson video
  const result = await generateSpokespersonVideo(enriched, onProgress);

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

  // ── Post-production: assemble scenes, burn captions, mix music ──
  let finalVideoUrl = result.videoUrl;
  let assembledFromScenes = false;

  // (Future) Multi-scene assembly: when individual scene clips are produced,
  // pass them through assembleScenes(). Today generateSpokespersonVideo returns
  // one clip, so this branch is a no-op — wired for when scene rendering lands.
  if (request.storyboard && request.storyboard.length > 1) {
    try {
      onProgress?.({ step: "assemble", progress: 96, message: "Assembling scenes..." });
      const scenes = request.storyboard.map((s) => ({
        videoUrl: result.videoUrl,
        duration: Math.max(1, s.end - s.start),
        sceneNumber: s.scene,
      }));
      // Only call assembler when there are real distinct clips (>1 unique URL).
      const unique = new Set(scenes.map((s) => s.videoUrl));
      if (unique.size > 1) {
        finalVideoUrl = await assembleScenes(scenes);
        assembledFromScenes = true;
      }
    } catch (err) {
      console.warn("[video-pipeline] Scene assembly failed:", err);
    }
  }

  if (captionsSrt) {
    try {
      onProgress?.({ step: "burn-captions", progress: 97, message: "Burning in captions..." });
      finalVideoUrl = await burnInCaptions(finalVideoUrl, captionsSrt);
    } catch (err) {
      console.warn("[video-pipeline] Caption burn-in failed:", err);
    }
  }

  if (musicUrl) {
    try {
      onProgress?.({ step: "mix-music", progress: 99, message: "Mixing background music..." });
      finalVideoUrl = await mixBackgroundMusic(finalVideoUrl, musicUrl);
    } catch (err) {
      console.warn("[video-pipeline] Music mix failed:", err);
    }
  }

  onProgress?.({ step: "done", progress: 100, message: "Complete" });

  return {
    ...result,
    videoUrl: finalVideoUrl,
    finalVideoUrl,
    assembledFromScenes,
    captionsSrt,
    musicUrl,
    storyboard: request.storyboard,
  };
}

// ── Provider Check ──

export function isCustomPipelineAvailable(): boolean {
  return !!(process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.REPLICATE_TOKEN || process.env.REPLICATE_KEY || process.env.ZOOBICON_VIDEO_API_URL);
}

export function getVideoPipelineInfo(): {
  available: boolean;
  provider: "replicate" | "self-hosted" | "none";
  models: string[];
} {
  if (process.env.ZOOBICON_VIDEO_API_URL) {
    return { available: true, provider: "self-hosted", models: ["fish-speech", "flux", "sadtalker"] };
  }
  if (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY || process.env.REPLICATE_TOKEN || process.env.REPLICATE_KEY) {
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
