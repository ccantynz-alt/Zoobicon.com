/**
 * Video Pipeline v2 — Premium Orchestrator
 *
 * Bible Law 9: every external call has a 4-model fallback chain provided by
 * the underlying modules:
 *   - TTS:    ElevenLabs → Fish Speech → Kokoro → XTTS v2  (tts-elevenlabs.ts)
 *   - Avatar: OmniHuman → SadTalker → Hallo → Wav2Lip      (avatar-talking.ts)
 *   - B-roll: Kling 3.0 → Veo 3.1 → Seedance 2 → Luma      (video-broll.ts)
 *   - I2V:    Kling I2V → Runway → Pika → Stable Video     (video-broll.ts)
 *   - Whisper/Music/Upscale: routed through fal-client runFalWithFallback
 *
 * Bible Law 8: every failure surfaces a structured error stating which model
 * failed and why. No silent fallbacks — warnings logged + collected.
 *
 * Bible Law 3: generation steps that don't depend on each other run in
 * parallel via Promise.allSettled.
 *
 * Runtime: nodejs (Replicate / fal SDKs require node fetch + buffers).
 */

export const runtime = "nodejs";

export type VideoTier = "standard" | "premium";

export interface BrollSpec {
  prompts: string[];
  durationSec: number;
}

export interface PremiumVideoSpec {
  script: string;
  voiceId: string;
  avatarImageUrl?: string;
  broll?: BrollSpec;
  music?: boolean;
  captions?: boolean;
  tier?: VideoTier;
}

export interface VideoSegment {
  kind: "avatar" | "broll";
  url: string;
  durationSec: number;
  model: string;
}

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

export interface PremiumVideoResult {
  finalVideoUrl: string;
  segments: VideoSegment[];
  captions: CaptionCue[];
  durationSec: number;
  costUsd: number;
  modelsUsed: string[];
  warnings: string[];
}

export interface CostEstimate {
  ttsUsd: number;
  avatarUsd: number;
  brollUsd: number;
  musicUsd: number;
  captionsUsd: number;
  upscaleUsd: number;
  totalUsd: number;
}

// ---------- cost model (rough, updated 2026-04) ----------
const COST = {
  ttsPerChar: 0.00003,
  avatarPerSec: 0.05,
  brollPerSec: 0.08,
  musicFlat: 0.04,
  captionsPerMin: 0.006,
  upscalePerSec: 0.12,
} as const;

export function estimateCost(spec: PremiumVideoSpec): CostEstimate {
  const chars = spec.script.length;
  const brollSec = spec.broll ? spec.broll.durationSec : 0;
  const avatarSec = Math.max(1, Math.ceil(chars / 15)); // ~15 chars/sec speech
  const totalSec = avatarSec + brollSec;

  const ttsUsd = chars * COST.ttsPerChar;
  const avatarUsd = spec.avatarImageUrl ? avatarSec * COST.avatarPerSec : 0;
  const brollUsd = brollSec * COST.brollPerSec;
  const musicUsd = spec.music ? COST.musicFlat : 0;
  const captionsUsd = spec.captions ? (totalSec / 60) * COST.captionsPerMin : 0;
  const upscaleUsd = spec.tier === "premium" ? totalSec * COST.upscalePerSec : 0;

  const totalUsd =
    ttsUsd + avatarUsd + brollUsd + musicUsd + captionsUsd + upscaleUsd;

  return { ttsUsd, avatarUsd, brollUsd, musicUsd, captionsUsd, upscaleUsd, totalUsd };
}

// ---------- helpers ----------
interface PipelineError {
  step: string;
  model?: string;
  message: string;
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "unknown error";
  }
}

function pipelineError(step: string, e: unknown, model?: string): PipelineError {
  return { step, model, message: errMessage(e) };
}

interface TtsResult {
  audioUrl: string;
  durationSec: number;
  model: string;
}

interface AvatarResult {
  videoUrl: string;
  durationSec: number;
  model: string;
}

interface BrollResult {
  videoUrl: string;
  durationSec: number;
  model: string;
  prompt: string;
}

// ---------- main orchestrator ----------
/**
 * Generate a premium video end-to-end.
 *
 * Execution graph:
 *   wave 1 (parallel):  TTS, b-roll[], music
 *   wave 2 (after TTS): avatar talking head (needs audioUrl)
 *   wave 3 (after vid): captions (whisper on final audio)
 *   wave 4 (premium):   topaz upscale
 *
 * Every wave is wrapped so a single failure does not abort the whole render —
 * partial results are returned with warnings, unless the failure is in the
 * critical path (TTS + avatar when avatarImageUrl is provided).
 */
export async function generatePremiumVideo(
  spec: PremiumVideoSpec
): Promise<PremiumVideoResult> {
  const warnings: string[] = [];
  const modelsUsed: string[] = [];
  const segments: VideoSegment[] = [];
  let costUsd = 0;

  // dynamic imports — modules may not exist yet during incremental rollout
  const ttsMod = await import("@/lib/tts-elevenlabs").catch((e) => {
    throw new Error(
      `[video-pipeline-v2] tts-elevenlabs module unavailable: ${errMessage(e)}`
    );
  });
  const avatarMod = spec.avatarImageUrl
    ? await import("@/lib/avatar-talking").catch((e) => {
        throw new Error(
          `[video-pipeline-v2] avatar-talking module unavailable: ${errMessage(e)}`
        );
      })
    : null;
  const brollMod = spec.broll
    ? await import("@/lib/video-broll").catch((e) => {
        throw new Error(
          `[video-pipeline-v2] video-broll module unavailable: ${errMessage(e)}`
        );
      })
    : null;
  const falMod =
    spec.music || spec.captions || spec.tier === "premium"
      ? await import("@/lib/fal-client").catch((e) => {
          throw new Error(
            `[video-pipeline-v2] fal-client module unavailable: ${errMessage(e)}`
          );
        })
      : null;

  // ---------- WAVE 1: TTS + b-roll + music in parallel ----------
  const ttsPromise: Promise<TtsResult> = (async () => {
    const out = await (ttsMod as {
      synthesizeWithFallback: (args: {
        text: string;
        voiceId: string;
      }) => Promise<{ audioUrl: string; durationSec: number; model: string }>;
    }).synthesizeWithFallback({ text: spec.script, voiceId: spec.voiceId });
    return out;
  })();

  const brollPromise: Promise<BrollResult[]> = (async () => {
    if (!spec.broll || !brollMod) return [];
    const perClipSec = Math.max(
      2,
      Math.floor(spec.broll.durationSec / Math.max(1, spec.broll.prompts.length))
    );
    const calls = spec.broll.prompts.map(async (prompt) => {
      const r = await (brollMod as {
        generateBroll: (args: {
          prompt: string;
          durationSec: number;
        }) => Promise<{ videoUrl: string; durationSec: number; model: string }>;
      }).generateBroll({ prompt, durationSec: perClipSec });
      return { ...r, prompt };
    });
    const settled = await Promise.allSettled(calls);
    const ok: BrollResult[] = [];
    settled.forEach((s, i) => {
      if (s.status === "fulfilled") ok.push(s.value);
      else
        warnings.push(
          `[broll] prompt ${i} failed: ${errMessage((s as PromiseRejectedResult).reason)}`
        );
    });
    return ok;
  })();

  const musicPromise: Promise<{ url: string; model: string } | null> = (async () => {
    if (!spec.music || !falMod) return null;
    try {
      const out = await (falMod as {
        runFalWithFallback: <T>(
          chain: string[],
          input: Record<string, unknown>
        ) => Promise<{ data: T; model: string }>;
      }).runFalWithFallback<{ audio: { url: string } }>(
        [
          "fal-ai/musicgen",
          "fal-ai/stable-audio",
          "fal-ai/audiogen",
          "fal-ai/cassetteai/music-generator",
        ],
        { prompt: "cinematic uplifting score, subtle, instrumental", duration: 30 }
      );
      return { url: out.data.audio.url, model: out.model };
    } catch (e) {
      warnings.push(`[music] all 4 models failed: ${errMessage(e)}`);
      return null;
    }
  })();

  const wave1 = await Promise.allSettled([ttsPromise, brollPromise, musicPromise]);

  // TTS is critical path
  const ttsSettled = wave1[0];
  if (ttsSettled.status !== "fulfilled") {
    const err = pipelineError("tts", (ttsSettled as PromiseRejectedResult).reason);
    throw new Error(
      `[video-pipeline-v2] TTS failed (all 4 fallbacks exhausted): ${err.message}`
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
        `[video-pipeline-v2] avatar talking-head failed (all 4 fallbacks exhausted): ${errMessage(e)}`
      );
    }
  }

  // pick the "final" video — avatar if present, else first b-roll, else error
  const primary = avatar
    ? avatar.videoUrl
    : brolls[0]?.videoUrl ?? null;
  if (!primary) {
    throw new Error(
      "[video-pipeline-v2] no video produced — neither avatar nor b-roll succeeded"
    );
  }

  const totalDurationSec =
    (avatar?.durationSec ?? 0) + brolls.reduce((s, b) => s + b.durationSec, 0);

  // ---------- WAVE 3: captions via whisper ----------
  let captions: CaptionCue[] = [];
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
    durationSec: totalDurationSec || tts.durationSec,
    costUsd: Number(costUsd.toFixed(4)),
    modelsUsed,
    warnings,
  };
}
