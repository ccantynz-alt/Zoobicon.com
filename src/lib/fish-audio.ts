/**
 * Fish Audio S1 — Primary TTS provider
 *
 * Fish Audio S1 is the new #1 TTS on TTS-Arena2 (April 2026), beating
 * ElevenLabs on quality benchmarks while costing $15 per million characters
 * (≈80% cheaper than ElevenLabs Turbo). It supports 50+ languages, 48
 * emotion tags, and 5 tone tags out of the box.
 *
 * Bible Law 8: NO silent mocks. If `FISH_AUDIO_API_KEY` is unset OR the
 * upstream call fails, this module returns null + logs a clear reason so
 * callers can fall back to the existing Replicate TTS chain.
 *
 * The audio is uploaded to Vercel Blob (when `BLOB_READ_WRITE_TOKEN` is
 * present) so downstream Replicate models can fetch a public URL. Without
 * Blob the function still returns audio as a base64 data URL — which is
 * fine for direct browser playback but Replicate lip-sync models cannot
 * fetch data URLs, so the caller should treat that path as voice-only.
 *
 * Pricing reference (April 2026):
 *   Fish Audio S1:        $15  / 1M chars
 *   ElevenLabs Turbo v2.5: $90  / 1M chars
 *   Cartesia Sonic-3:     ~$25 / 1M chars
 *
 * Sign up: https://fish.audio/  → Developer → API Keys
 * Voice marketplace (1000s of free voices): https://fish.audio/m/
 */

const FISH_BASE = "https://api.fish.audio/v1";

export type FishEmotion =
  | "neutral"
  | "happy"
  | "sad"
  | "angry"
  | "whisper";

export type FishFormat = "mp3" | "wav" | "opus";

export interface FishGenerateOpts {
  text: string;
  voiceId?: string; // Fish voice/reference_id. Falls back to env or default.
  emotion?: FishEmotion;
  format?: FishFormat;
  // Optional language hint (Fish auto-detects if omitted). ISO code.
  language?: string;
}

export interface FishGenerateResult {
  audioUrl: string;
  bytes: number;
  durationSec: number;
}

function getFishKey(): string | null {
  return (
    process.env.FISH_AUDIO_API_KEY ||
    process.env.FISH_API_KEY ||
    process.env.FISHAUDIO_API_KEY ||
    null
  );
}

function defaultVoiceId(): string | undefined {
  return (
    process.env.FISH_AUDIO_DEFAULT_VOICE_ID ||
    process.env.FISH_DEFAULT_VOICE_ID ||
    undefined
  );
}

/**
 * Estimate playback duration from char count. ~150 wpm, ~5 chars/word.
 * Used when Fish doesn't return an authoritative duration in headers.
 */
function estimateDurationFromText(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil((words / 150) * 60));
}

/**
 * Generate speech with Fish Audio S1.
 *
 * Returns:
 *   { audioUrl, bytes, durationSec } on success, OR
 *   null when FISH_AUDIO_API_KEY is unset or any upstream step fails.
 */
export async function generateFishAudioS1(
  opts: FishGenerateOpts
): Promise<FishGenerateResult | null> {
  const apiKey = getFishKey();
  if (!apiKey) {
    console.warn(
      "[fish-audio] FISH_AUDIO_API_KEY not set — skipping Fish Audio S1 (will fall back to Replicate TTS chain). Sign up at https://fish.audio/."
    );
    return null;
  }

  const { text } = opts;
  if (!text || !text.trim()) {
    console.warn("[fish-audio] empty text — refusing to call upstream");
    return null;
  }

  const format: FishFormat = opts.format ?? "mp3";
  const voiceId = opts.voiceId ?? defaultVoiceId();
  const emotion = opts.emotion ?? "neutral";

  // Fish S1 accepts {text, reference_id, format, latency, model, ...}.
  // We pin model="s1" so we don't accidentally regress to s0 in the future.
  const body: Record<string, unknown> = {
    text,
    format,
    model: "s1",
    latency: "balanced", // "normal" | "balanced" | "low"
  };
  if (voiceId) body.reference_id = voiceId;
  if (emotion && emotion !== "neutral") body.emotion = emotion;
  if (opts.language) body.language = opts.language;

  let res: Response;
  try {
    res = await fetch(`${FISH_BASE}/tts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // Hint to Fish that we want the binary stream back inline.
        Accept: format === "wav" ? "audio/wav" : format === "opus" ? "audio/opus" : "audio/mpeg",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[fish-audio] request failed: ${msg}`);
    return null;
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.warn(
      `[fish-audio] HTTP ${res.status} ${res.statusText}: ${errBody.slice(0, 300)}`
    );
    return null;
  }

  let audioBuffer: ArrayBuffer;
  try {
    audioBuffer = await res.arrayBuffer();
  } catch (err) {
    console.warn(
      `[fish-audio] failed reading audio body: ${err instanceof Error ? err.message : err}`
    );
    return null;
  }

  const bytes = audioBuffer.byteLength;
  if (bytes === 0) {
    console.warn("[fish-audio] upstream returned 0-byte audio");
    return null;
  }

  // Try Vercel Blob upload first so Replicate lip-sync models can fetch a
  // real public URL. Fall back to a base64 data URL otherwise (still useful
  // for direct browser playback).
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    try {
      const { put } = await import("@vercel/blob");
      const ext = format === "opus" ? "opus" : format;
      const { url } = await put(
        `video/tts/fish-${Date.now()}.${ext}`,
        Buffer.from(audioBuffer),
        {
          access: "public",
          token: blobToken,
          contentType:
            format === "wav"
              ? "audio/wav"
              : format === "opus"
                ? "audio/opus"
                : "audio/mpeg",
        }
      );
      return {
        audioUrl: url,
        bytes,
        durationSec: estimateDurationFromText(text),
      };
    } catch (err) {
      console.warn(
        `[fish-audio] blob upload failed, falling back to data URL: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  const mime =
    format === "wav"
      ? "audio/wav"
      : format === "opus"
        ? "audio/opus"
        : "audio/mpeg";
  const audioUrl = `data:${mime};base64,${Buffer.from(audioBuffer).toString("base64")}`;
  return {
    audioUrl,
    bytes,
    durationSec: estimateDurationFromText(text),
  };
}

/**
 * Quick env-presence check for diagnostics.
 */
export function hasFishAudioKey(): boolean {
  return Boolean(getFishKey());
}
