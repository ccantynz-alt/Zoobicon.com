/**
 * Voice Cloning — Production Module
 *
 * Clone a customer's voice from a 10–120 second audio sample, then use that
 * cloned voice for TTS in video generation.
 *
 * Provider chain (per LAW 9 — never depend on a single provider):
 *   1. ElevenLabs Instant Voice Cloning (primary — best quality, emotion control)
 *   2. Replicate XTTS-v2 (fallback — reference-audio cloning, no emotion params)
 *   3. Replicate OpenVoice (final fallback — basic cloning)
 *
 * Emotion / style mapping:
 *   professional → stability 0.7, style 0.15, similarity 0.8
 *   excited      → stability 0.3, style 0.8, similarity 0.7
 *   calm         → stability 0.85, style 0.05, similarity 0.8
 *   serious      → stability 0.75, style 0.2, similarity 0.85
 *
 * Env vars:
 *   ELEVENLABS_API_KEY     — ElevenLabs API key (primary)
 *   REPLICATE_API_TOKEN    — Replicate token (fallback)
 *
 * Revenue: Premium feature — $9/mo add-on or included in Pro plan.
 * Cost:    ElevenLabs ~$0.03/min, Replicate XTTS ~$0.02/min.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VoiceCloneProvider = "elevenlabs" | "replicate-xtts" | "replicate-openvoice";

export type EmotionStyle = "professional" | "excited" | "calm" | "serious";

export interface VoiceCloneProfile {
  /** Unique voice ID — ElevenLabs voice_id or internal reference ID. */
  voiceId: string;
  /** Which provider created the clone. */
  provider: VoiceCloneProvider;
  /** Human-readable name the user gave this voice. */
  name: string;
  /** URL to the original reference audio sample. */
  referenceAudioUrl: string;
  /** URL to a short preview clip spoken by the cloned voice. */
  previewUrl: string | null;
  /** ISO timestamp. */
  createdAt: string;
}

export interface ClonedSpeechResult {
  /** URL (or data-uri) of the generated audio. */
  audioUrl: string;
  /** Estimated duration in seconds. */
  duration: number;
  /** Provider that produced this audio. */
  provider: VoiceCloneProvider;
  /** Which model/engine was used. */
  model: string;
}

// ---------------------------------------------------------------------------
// Emotion → voice-settings mapping (ElevenLabs)
// ---------------------------------------------------------------------------

const EMOTION_SETTINGS: Record<EmotionStyle, {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}> = {
  professional: { stability: 0.70, similarity_boost: 0.80, style: 0.15, use_speaker_boost: true },
  excited:      { stability: 0.30, similarity_boost: 0.70, style: 0.80, use_speaker_boost: true },
  calm:         { stability: 0.85, similarity_boost: 0.80, style: 0.05, use_speaker_boost: true },
  serious:      { stability: 0.75, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true },
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const REPLICATE_API = "https://api.replicate.com/v1";

/** Default timeout for all external HTTP calls (30 seconds). */
const HTTP_TIMEOUT_MS = 30_000;

/** Longer timeout for Replicate polling (5 minutes). */
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

/** Interval between Replicate poll requests. */
const POLL_INTERVAL_MS = 3_000;

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function getElevenLabsKey(): string | null {
  return process.env.ELEVENLABS_API_KEY || null;
}

function getReplicateToken(): string | null {
  return (
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY ||
    null
  );
}

// ---------------------------------------------------------------------------
// Provider availability
// ---------------------------------------------------------------------------

/** Returns the ordered list of available providers for voice cloning. */
export function getAvailableCloneProviders(): VoiceCloneProvider[] {
  const providers: VoiceCloneProvider[] = [];
  if (getElevenLabsKey()) providers.push("elevenlabs");
  if (getReplicateToken()) {
    providers.push("replicate-xtts");
    providers.push("replicate-openvoice");
  }
  return providers;
}

// ---------------------------------------------------------------------------
// Tips (exported for UI)
// ---------------------------------------------------------------------------

export const VOICE_CLONE_TIPS = [
  "Record in a quiet room with minimal background noise",
  "Speak naturally at your normal pace — don't read robotically",
  "Record 10–120 seconds of continuous speech (30 seconds is ideal)",
  "Use a good microphone if possible (phone mic works too)",
  "Avoid music, other voices, or echo in the background",
  "Speak in the same language you want the clone to output",
];

// ---------------------------------------------------------------------------
// 1. Clone a voice (create a reusable voice profile)
// ---------------------------------------------------------------------------

/**
 * Create a voice clone from a reference audio sample.
 *
 * Provider chain: ElevenLabs → Replicate XTTS v2 → Replicate OpenVoice.
 * Each provider that fails logs a warning and the next is tried.
 *
 * Returns a VoiceCloneProfile with a voiceId that can be passed to
 * `generateWithClonedVoice` for TTS.
 */
export async function createVoiceClone(params: {
  name: string;
  audioFileUrl: string;
  description?: string;
}): Promise<VoiceCloneProfile> {
  const { name, audioFileUrl, description } = params;

  if (!audioFileUrl) {
    throw new Error("An audio sample URL is required. Upload an mp3, wav, or m4a file (10–120 seconds).");
  }

  const errors: string[] = [];

  // --- ElevenLabs Instant Voice Cloning ---
  const elevenLabsKey = getElevenLabsKey();
  if (elevenLabsKey) {
    try {
      const profile = await cloneViaElevenLabs(elevenLabsKey, name, audioFileUrl, description);
      console.log(`[voice-clone] ElevenLabs clone succeeded: ${profile.voiceId}`);
      return profile;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[voice-clone] ElevenLabs clone failed: ${msg}`);
      errors.push(`ElevenLabs: ${msg}`);
    }
  } else {
    errors.push("ElevenLabs: ELEVENLABS_API_KEY not configured");
  }

  // --- Replicate XTTS-v2 (reference-based, no API-side clone — just verify it works) ---
  const replicateToken = getReplicateToken();
  if (replicateToken) {
    try {
      const profile = await cloneViaReplicateXTTS(replicateToken, name, audioFileUrl);
      console.log(`[voice-clone] Replicate XTTS clone succeeded: ${profile.voiceId}`);
      return profile;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[voice-clone] Replicate XTTS clone failed: ${msg}`);
      errors.push(`Replicate XTTS: ${msg}`);
    }

    // --- Replicate OpenVoice (final fallback) ---
    try {
      const profile = await cloneViaReplicateOpenVoice(replicateToken, name, audioFileUrl);
      console.log(`[voice-clone] Replicate OpenVoice clone succeeded: ${profile.voiceId}`);
      return profile;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[voice-clone] Replicate OpenVoice clone failed: ${msg}`);
      errors.push(`Replicate OpenVoice: ${msg}`);
    }
  } else {
    errors.push("Replicate: REPLICATE_API_TOKEN not configured");
  }

  throw new Error(
    `Voice cloning failed across all providers. ` +
    `Try a clearer audio sample with less background noise. ` +
    `Details: ${errors.join(" | ")}`
  );
}

// ---------------------------------------------------------------------------
// 2. Generate speech with a cloned voice
// ---------------------------------------------------------------------------

/**
 * Generate TTS audio using a previously cloned voice.
 *
 * If the voiceId starts with "el_" it was cloned via ElevenLabs and we use
 * their TTS endpoint with emotion controls. Otherwise we use the stored
 * reference audio URL with Replicate XTTS-v2 / OpenVoice.
 *
 * @param text        — Script to speak.
 * @param voiceId     — The voiceId from a VoiceCloneProfile.
 * @param referenceAudioUrl — The original reference audio (needed for Replicate providers).
 * @param emotion     — Emotion/style preset (maps to voice_settings on ElevenLabs).
 */
export async function generateWithClonedVoice(params: {
  text: string;
  voiceId: string;
  referenceAudioUrl?: string;
  emotion?: EmotionStyle;
}): Promise<ClonedSpeechResult> {
  const { text, voiceId, referenceAudioUrl, emotion = "professional" } = params;

  if (!text || text.trim().length === 0) {
    throw new Error("Text is required for speech generation.");
  }

  const errors: string[] = [];

  // --- ElevenLabs path (voice was cloned there → voiceId starts with el_ or is a raw EL ID) ---
  const elevenLabsKey = getElevenLabsKey();
  if (elevenLabsKey && isElevenLabsVoiceId(voiceId)) {
    try {
      const result = await ttsViaElevenLabs(elevenLabsKey, text, stripPrefix(voiceId), emotion);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[voice-clone] ElevenLabs TTS failed: ${msg}`);
      errors.push(`ElevenLabs TTS: ${msg}`);
      // If we have reference audio, fall through to Replicate
      if (!referenceAudioUrl) {
        throw new Error(`Speech generation with cloned voice failed: ${msg}`);
      }
    }
  }

  // --- Replicate path (XTTS-v2 → OpenVoice) ---
  const replicateToken = getReplicateToken();
  const refAudio = referenceAudioUrl || (voiceId.startsWith("rep_xtts_") || voiceId.startsWith("rep_ov_") ? voiceId.replace(/^rep_(xtts|ov)_/, "") : null);

  if (replicateToken && refAudio) {
    // Try XTTS-v2
    try {
      const result = await ttsViaReplicateXTTS(replicateToken, text, refAudio);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[voice-clone] Replicate XTTS TTS failed: ${msg}`);
      errors.push(`Replicate XTTS TTS: ${msg}`);
    }

    // Try OpenVoice
    try {
      const result = await ttsViaReplicateOpenVoice(replicateToken, text, refAudio);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[voice-clone] Replicate OpenVoice TTS failed: ${msg}`);
      errors.push(`Replicate OpenVoice TTS: ${msg}`);
    }
  } else if (!replicateToken) {
    errors.push("Replicate: REPLICATE_API_TOKEN not configured");
  } else {
    errors.push("Replicate: no reference audio URL available for this voice");
  }

  throw new Error(
    `Speech generation failed across all providers. ${errors.join(" | ")}`
  );
}

// ---------------------------------------------------------------------------
// ElevenLabs — Clone
// ---------------------------------------------------------------------------

async function cloneViaElevenLabs(
  apiKey: string,
  name: string,
  audioFileUrl: string,
  description?: string,
): Promise<VoiceCloneProfile> {
  // Step 1: Download the audio file so we can send it as multipart form data
  const audioRes = await fetch(audioFileUrl, {
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!audioRes.ok) {
    throw new Error(`Failed to download audio sample (HTTP ${audioRes.status})`);
  }
  const audioBuffer = await audioRes.arrayBuffer();
  const contentType = audioRes.headers.get("content-type") || "audio/mpeg";

  // Determine file extension from content type
  const extMap: Record<string, string> = {
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
  const ext = extMap[contentType] || "mp3";

  // Step 2: Build multipart form data for ElevenLabs
  const formData = new FormData();
  formData.append("name", name || `Clone ${Date.now()}`);
  formData.append(
    "description",
    description || `Voice clone created on ${new Date().toISOString().slice(0, 10)}`
  );
  formData.append(
    "files",
    new Blob([audioBuffer], { type: contentType }),
    `voice-sample.${ext}`
  );

  // Step 3: Call ElevenLabs Instant Voice Cloning
  const res = await fetch(`${ELEVENLABS_BASE}/voices/add`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      // Do NOT set Content-Type — let fetch set multipart boundary automatically
    },
    body: formData,
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error("ElevenLabs authentication failed. Check ELEVENLABS_API_KEY.");
    }
    if (res.status === 429) {
      throw new Error("ElevenLabs rate limited. Try again in a moment.");
    }
    throw new Error(`ElevenLabs clone API returned ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data = (await res.json()) as { voice_id?: string };
  if (!data.voice_id) {
    throw new Error("ElevenLabs returned success but no voice_id in response");
  }

  // Step 4: Generate a short preview to confirm the clone works
  let previewUrl: string | null = null;
  try {
    const preview = await ttsViaElevenLabs(
      apiKey,
      "Hello, this is my cloned voice. Thank you for choosing Zoobicon.",
      data.voice_id,
      "professional",
    );
    previewUrl = preview.audioUrl;
  } catch (err) {
    console.warn("[voice-clone] Preview generation failed (non-fatal):", err instanceof Error ? err.message : err);
  }

  return {
    voiceId: `el_${data.voice_id}`,
    provider: "elevenlabs",
    name,
    referenceAudioUrl: audioFileUrl,
    previewUrl,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// ElevenLabs — TTS with cloned voice + emotion
// ---------------------------------------------------------------------------

async function ttsViaElevenLabs(
  apiKey: string,
  text: string,
  voiceId: string,
  emotion: EmotionStyle = "professional",
): Promise<ClonedSpeechResult> {
  const settings = EMOTION_SETTINGS[emotion] || EMOTION_SETTINGS.professional;

  // Try models in quality order: multilingual v2 → turbo v2.5 → monolingual v1
  const models = [
    "eleven_multilingual_v2",
    "eleven_turbo_v2_5",
    "eleven_monolingual_v1",
  ];

  let lastError = "";

  for (const modelId of models) {
    const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: cleanTextForTTS(text),
        model_id: modelId,
        voice_settings: settings,
      }),
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });

    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const audioUrl = `data:audio/mpeg;base64,${base64}`;
      const duration = estimateDuration(text);

      return {
        audioUrl,
        duration,
        provider: "elevenlabs",
        model: modelId,
      };
    }

    const errText = await res.text().catch(() => "");
    lastError = `${modelId}: HTTP ${res.status} — ${errText.slice(0, 200)}`;
    console.warn(`[voice-clone] ElevenLabs TTS ${lastError}`);

    // 429 = rate limit — don't try more models on same provider
    if (res.status === 429) {
      throw new Error("ElevenLabs rate limited. Try again in a moment.");
    }
    // 401 = bad key — don't try more models
    if (res.status === 401) {
      throw new Error("ElevenLabs authentication failed. Check ELEVENLABS_API_KEY.");
    }
  }

  throw new Error(`ElevenLabs TTS failed on all models. Last: ${lastError}`);
}

// ---------------------------------------------------------------------------
// Replicate XTTS-v2 — Clone (verify) + TTS
// ---------------------------------------------------------------------------

/**
 * "Clone" via XTTS-v2 — there's no separate clone step. We verify the
 * reference audio produces usable output by generating a short test sample.
 */
async function cloneViaReplicateXTTS(
  token: string,
  name: string,
  audioFileUrl: string,
): Promise<VoiceCloneProfile> {
  // Verify by generating a test sample
  const result = await runReplicateModel(
    token,
    "lucataco/xtts-v2",
    [
      { text: "Voice clone test. This is a verification sample.", speaker: audioFileUrl, language: "en" },
      { text: "Voice clone test.", language: "en", speaker_wav: audioFileUrl },
    ],
  );

  if (!result) {
    throw new Error("XTTS-v2 did not return audio output for the reference sample");
  }

  return {
    voiceId: `rep_xtts_${audioFileUrl}`,
    provider: "replicate-xtts",
    name,
    referenceAudioUrl: audioFileUrl,
    previewUrl: result,
    createdAt: new Date().toISOString(),
  };
}

async function ttsViaReplicateXTTS(
  token: string,
  text: string,
  referenceAudioUrl: string,
): Promise<ClonedSpeechResult> {
  const audioUrl = await runReplicateModel(
    token,
    "lucataco/xtts-v2",
    [
      { text: cleanTextForTTS(text), speaker: referenceAudioUrl, language: "en" },
      { text: cleanTextForTTS(text), language: "en", speaker_wav: referenceAudioUrl },
    ],
  );

  if (!audioUrl) {
    throw new Error("XTTS-v2 returned no audio output");
  }

  return {
    audioUrl,
    duration: estimateDuration(text),
    provider: "replicate-xtts",
    model: "lucataco/xtts-v2",
  };
}

// ---------------------------------------------------------------------------
// Replicate OpenVoice — Clone (verify) + TTS
// ---------------------------------------------------------------------------

async function cloneViaReplicateOpenVoice(
  token: string,
  name: string,
  audioFileUrl: string,
): Promise<VoiceCloneProfile> {
  const result = await runReplicateModel(
    token,
    "chenxwh/openvoice",
    [
      { text: "Voice clone test. This is a verification sample.", language: "EN_NEWEST", reference_speaker: audioFileUrl },
      { text: "Voice clone test.", audio: audioFileUrl },
    ],
  );

  if (!result) {
    throw new Error("OpenVoice did not return audio output for the reference sample");
  }

  return {
    voiceId: `rep_ov_${audioFileUrl}`,
    provider: "replicate-openvoice",
    name,
    referenceAudioUrl: audioFileUrl,
    previewUrl: result,
    createdAt: new Date().toISOString(),
  };
}

async function ttsViaReplicateOpenVoice(
  token: string,
  text: string,
  referenceAudioUrl: string,
): Promise<ClonedSpeechResult> {
  const audioUrl = await runReplicateModel(
    token,
    "chenxwh/openvoice",
    [
      { text: cleanTextForTTS(text), language: "EN_NEWEST", reference_speaker: referenceAudioUrl },
      { text: cleanTextForTTS(text), audio: referenceAudioUrl },
    ],
  );

  if (!audioUrl) {
    throw new Error("OpenVoice returned no audio output");
  }

  return {
    audioUrl,
    duration: estimateDuration(text),
    provider: "replicate-openvoice",
    model: "chenxwh/openvoice",
  };
}

// ---------------------------------------------------------------------------
// Replicate helpers (self-contained — no imports from video-pipeline to avoid
// circular dependencies since video-pipeline imports from us)
// ---------------------------------------------------------------------------

/**
 * Run a Replicate model with multiple input variants (tries each until one
 * produces output). Handles async polling. Returns the output URL or null.
 */
async function runReplicateModel(
  token: string,
  modelPath: string,
  inputVariants: Record<string, unknown>[],
): Promise<string | null> {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  for (const input of inputVariants) {
    try {
      // Try model-based endpoint first
      let res = await fetch(`${REPLICATE_API}/models/${modelPath}/predictions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ input }),
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      });

      // If 404/422, try version-based fallback
      if (res.status === 404 || res.status === 422) {
        try {
          const modelInfo = await fetch(`${REPLICATE_API}/models/${modelPath}`, {
            headers,
            signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
          });
          if (modelInfo.ok) {
            const info = (await modelInfo.json()) as { latest_version?: { id?: string } };
            const version = info.latest_version?.id;
            if (version) {
              res = await fetch(`${REPLICATE_API}/predictions`, {
                method: "POST",
                headers,
                body: JSON.stringify({ version, input }),
                signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
              });
            }
          }
        } catch {
          // Version fallback failed, continue to next input variant
          continue;
        }
      }

      if (!res.ok) {
        continue;
      }

      const data = (await res.json()) as {
        id?: string;
        status?: string;
        output?: unknown;
        urls?: { get?: string };
      };

      // If output is already available (synchronous)
      let audioUrl = extractOutput(data.output);
      if (audioUrl) return audioUrl;

      // Otherwise poll until complete
      if (data.urls?.get) {
        const result = await pollPrediction(token, data.urls.get);
        audioUrl = extractOutput(result.output);
        if (audioUrl) return audioUrl;
      }
    } catch (err) {
      console.warn(`[voice-clone] ${modelPath} variant failed:`, err instanceof Error ? err.message : err);
    }
  }

  return null;
}

/**
 * Poll a Replicate prediction until it completes or times out.
 */
async function pollPrediction(
  token: string,
  getUrl: string,
): Promise<{ output?: unknown; status?: string }> {
  const start = Date.now();
  let consecutiveFailures = 0;

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    let res: Response;
    try {
      res = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      });
    } catch {
      consecutiveFailures++;
      if (consecutiveFailures > 5) {
        throw new Error("Replicate polling failed — network unreachable after 5 consecutive errors");
      }
      continue;
    }

    if (!res.ok) {
      consecutiveFailures++;
      if (consecutiveFailures > 5) {
        throw new Error(`Replicate polling failed — HTTP ${res.status} after 5 consecutive errors`);
      }
      continue;
    }

    consecutiveFailures = 0;
    const data = (await res.json()) as { status?: string; output?: unknown; error?: string };

    if (data.status === "succeeded") {
      return data;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate prediction ${data.status}: ${data.error || "unknown error"}`);
    }
  }

  throw new Error("Replicate prediction timed out after 5 minutes");
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

function extractOutput(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === "string" && item.length > 0) return item;
    }
    return null;
  }
  if (typeof output === "object") {
    const obj = output as Record<string, unknown>;
    const keys = ["audio", "audio_out", "wav", "mp3", "output", "url", "audio_url"];
    for (const key of keys) {
      const val = obj[key];
      if (typeof val === "string" && val.length > 0) return val;
      if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
  }
  return null;
}

function estimateDuration(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil((words / 150) * 60));
}

function cleanTextForTTS(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.,!?;:'"()\-–—…@#$%&*/+]/g, "")
    .trim();
}

/**
 * Determine whether a voiceId belongs to ElevenLabs.
 * Our convention: ElevenLabs voice IDs are prefixed with "el_".
 * Raw ElevenLabs IDs (20-char alphanumeric) are also accepted.
 */
function isElevenLabsVoiceId(voiceId: string): boolean {
  if (voiceId.startsWith("el_")) return true;
  // Raw ElevenLabs voice IDs are ~20 char alphanumeric
  if (/^[A-Za-z0-9]{15,30}$/.test(voiceId)) return true;
  return false;
}

function stripPrefix(voiceId: string): string {
  if (voiceId.startsWith("el_")) return voiceId.slice(3);
  return voiceId;
}
