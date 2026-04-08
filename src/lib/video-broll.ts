/**
 * Cinematic B-roll text-to-video via fal.ai gateway.
 * All requests routed through src/lib/fal-client.ts (dynamic import).
 */

export const RUNTIME_HINT = "nodejs";

export type BrollTier = "premium" | "budget";
export type BrollResolution = "480p" | "720p" | "1080p" | "4k";

export interface BrollRequest {
  prompt: string;
  durationSec?: number;
  resolution?: BrollResolution;
  style?: string;
  tier?: BrollTier;
}

export interface BrollResult {
  videoUrl: string;
  model: string;
  durationSec: number;
  resolution: BrollResolution;
  estimatedCostUsd: number;
}

export interface MusicRequest {
  prompt: string;
  durationSec: number;
}

export interface BrollWithMusicResult {
  video: BrollResult;
  musicUrl: string;
  musicModel: string;
}

export interface ImageToVideoRequest {
  imageUrl: string;
  motionPrompt: string;
  durationSec?: number;
}

export interface ImageToVideoResult {
  videoUrl: string;
  model: string;
  estimatedCostUsd: number;
}

const PREMIUM_CHAIN: readonly string[] = [
  "fal-ai/veo3",
  "fal-ai/sora-2/text-to-video",
  "fal-ai/runway/gen4-turbo",
];

const BUDGET_CHAIN: readonly string[] = [
  "fal-ai/kling-v2.5-turbo/text-to-video",
  "fal-ai/wan-2.5/text-to-video",
  "fal-ai/hailuo/video-01",
  "fal-ai/pixverse/v4",
];

const I2V_CHAIN: readonly string[] = [
  "fal-ai/kling-v2.5-turbo/image-to-video",
  "fal-ai/luma-dream-machine",
  "fal-ai/pika-2.2",
];

const MUSIC_MODEL = "fal-ai/musicgen";

const COST_PER_SECOND_USD: Record<string, number> = {
  "fal-ai/veo3": 0.30,
  "fal-ai/sora-2/text-to-video": 0.20,
  "fal-ai/runway/gen4-turbo": 0.15,
  "fal-ai/kling-v2.5-turbo/text-to-video": 0.07,
  "fal-ai/kling-v2.5-turbo/image-to-video": 0.07,
  "fal-ai/wan-2.5/text-to-video": 0.05,
  "fal-ai/hailuo/video-01": 0.045,
  "fal-ai/pixverse/v4": 0.04,
  "fal-ai/luma-dream-machine": 0.08,
  "fal-ai/pika-2.2": 0.06,
  "fal-ai/musicgen": 0.005,
};

export function estimateCost(model: string, durationSec: number): number {
  const rate = COST_PER_SECOND_USD[model] ?? 0.10;
  return Math.round(rate * durationSec * 10000) / 10000;
}

interface FalVideoOutput {
  video?: { url?: string };
  videos?: Array<{ url?: string }>;
  url?: string;
  output?: { url?: string } | string;
}

interface FalAudioOutput {
  audio?: { url?: string };
  audio_file?: { url?: string };
  url?: string;
  output?: { url?: string } | string;
}

function extractUrl(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as FalVideoOutput & FalAudioOutput;
  if (p.video && typeof p.video === "object" && typeof p.video.url === "string") return p.video.url;
  if (p.audio && typeof p.audio === "object" && typeof p.audio.url === "string") return p.audio.url;
  if (p.audio_file && typeof p.audio_file === "object" && typeof p.audio_file.url === "string") return p.audio_file.url;
  if (Array.isArray(p.videos) && p.videos.length > 0 && typeof p.videos[0]?.url === "string") return p.videos[0].url;
  if (typeof p.url === "string") return p.url;
  if (typeof p.output === "string") return p.output;
  if (p.output && typeof p.output === "object" && typeof (p.output as { url?: string }).url === "string") {
    return (p.output as { url: string }).url;
  }
  return undefined;
}

async function loadFal(): Promise<typeof import("./fal-client")> {
  return await import("./fal-client");
}

interface BrollFalInput {
  prompt: string;
  duration: number;
  resolution: BrollResolution;
  aspect_ratio: string;
}

export async function generateBroll(req: BrollRequest): Promise<BrollResult> {
  const durationSec = req.durationSec ?? 6;
  const resolution: BrollResolution = req.resolution ?? "1080p";
  const tier: BrollTier = req.tier ?? "premium";
  const chain = tier === "premium" ? PREMIUM_CHAIN : BUDGET_CHAIN;

  const styledPrompt = req.style ? `${req.prompt}. Style: ${req.style}` : req.prompt;

  const input: BrollFalInput = {
    prompt: styledPrompt,
    duration: durationSec,
    resolution,
    aspect_ratio: "16:9",
  };

  const fal = await loadFal();
  const errors: Array<{ model: string; error: unknown }> = [];

  for (const model of chain) {
    try {
      const result = await fal.runFal<unknown, BrollFalInput>({
        model,
        input,
        maxWaitMs: 300_000,
      });
      const url = extractUrl(result);
      if (!url) {
        errors.push({ model, error: "no video url in response" });
        continue;
      }
      return {
        videoUrl: url,
        model,
        durationSec,
        resolution,
        estimatedCostUsd: estimateCost(model, durationSec),
      };
    } catch (err) {
      errors.push({ model, error: err });
      continue;
    }
  }

  throw new fal.FalError(
    `all broll models failed: ${errors.map((e) => e.model).join(", ")}`,
    { status: 502, model: chain.join(","), cause: errors },
  );
}

interface MusicFalInput {
  prompt: string;
  duration: number;
}

async function generateMusic(req: MusicRequest): Promise<{ url: string; model: string }> {
  const fal = await loadFal();
  const result = await fal.runFal<unknown, MusicFalInput>({
    model: MUSIC_MODEL,
    input: { prompt: req.prompt, duration: req.durationSec },
    maxWaitMs: 180_000,
  });
  const url = extractUrl(result);
  if (!url) {
    throw new fal.FalError("musicgen returned no audio url", {
      status: 502,
      model: MUSIC_MODEL,
      cause: result,
    });
  }
  return { url, model: MUSIC_MODEL };
}

export async function generateBrollWithMusic(args: {
  prompt: string;
  durationSec: number;
  music: MusicRequest;
  resolution?: BrollResolution;
  style?: string;
  tier?: BrollTier;
}): Promise<BrollWithMusicResult> {
  const [video, music] = await Promise.all([
    generateBroll({
      prompt: args.prompt,
      durationSec: args.durationSec,
      resolution: args.resolution,
      style: args.style,
      tier: args.tier,
    }),
    generateMusic(args.music),
  ]);
  return { video, musicUrl: music.url, musicModel: music.model };
}

interface I2VFalInput {
  image_url: string;
  prompt: string;
  duration: number;
}

export async function generateImageToVideo(req: ImageToVideoRequest): Promise<ImageToVideoResult> {
  const durationSec = req.durationSec ?? 5;
  const input: I2VFalInput = {
    image_url: req.imageUrl,
    prompt: req.motionPrompt,
    duration: durationSec,
  };

  const fal = await loadFal();
  const errors: Array<{ model: string; error: unknown }> = [];

  for (const model of I2V_CHAIN) {
    try {
      const result = await fal.runFal<unknown, I2VFalInput>({
        model,
        input,
        maxWaitMs: 300_000,
      });
      const url = extractUrl(result);
      if (!url) {
        errors.push({ model, error: "no video url in response" });
        continue;
      }
      return {
        videoUrl: url,
        model,
        estimatedCostUsd: estimateCost(model, durationSec),
      };
    } catch (err) {
      errors.push({ model, error: err });
      continue;
    }
  }

  throw new fal.FalError(
    `all image-to-video models failed: ${errors.map((e) => e.model).join(", ")}`,
    { status: 502, model: I2V_CHAIN.join(","), cause: errors },
  );
}

export const PREMIUM_BROLL_CHAIN = PREMIUM_CHAIN;
export const BUDGET_BROLL_CHAIN = BUDGET_CHAIN;
export const IMAGE_TO_VIDEO_CHAIN = I2V_CHAIN;
