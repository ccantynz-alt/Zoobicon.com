/**
 * Cinematic B-roll text-to-video via fal.ai gateway.
 *
 * 4-model fallback chain per Bible Law 9:
 *   Premium: Veo 3.1 → Sora 2 → Runway Gen-4 Turbo → Kling 3.0
 *   Budget:  Kling 3.0 Turbo → Wan 2.5 → Hailuo → PixVerse v4
 *
 * Each model has its own input schema — formatInputForModel() handles the
 * translation so callers never think about fal.ai specifics.
 *
 * Every fetch uses AbortSignal.timeout() (inherited from fal-client.ts).
 * Non-critical failures return partial results with warnings, never throw.
 */

export const RUNTIME_HINT = "nodejs";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrollTier = "premium" | "budget";
export type BrollResolution = "480p" | "720p" | "1080p" | "4k";
export type BrollAspectRatio = "16:9" | "9:16" | "1:1";

export interface BrollClipOptions {
  /** Target aspect ratio. Default 16:9. */
  aspectRatio?: BrollAspectRatio;
  /** Target duration in seconds. Default 5. Most models support 5 or 10. */
  durationSec?: number;
  /** Output resolution hint. Default 1080p. */
  resolution?: BrollResolution;
  /** Model quality tier. Premium uses Veo 3 → Sora 2 chain. Budget uses Kling → Wan. Default premium. */
  tier?: BrollTier;
  /** Optional style modifier appended to the prompt (e.g. "cinematic film grain"). */
  style?: string;
  /** Override the default negative prompt. */
  negativePrompt?: string;
}

export interface BrollResult {
  videoUrl: string;
  model: string;
  durationSec: number;
  resolution: BrollResolution;
  prompt: string;
  estimatedCostUsd: number;
  /** Non-empty when some models failed but a later fallback succeeded. */
  warnings: string[];
}

export interface BrollMultiResult {
  clips: BrollResult[];
  /** Clips that failed entirely — description preserved so caller knows which scene broke. */
  failed: Array<{ description: string; error: string }>;
  totalCostUsd: number;
}

// Legacy interfaces kept for backward compatibility with existing API routes
export interface BrollRequest {
  prompt: string;
  durationSec?: number;
  resolution?: BrollResolution;
  style?: string;
  tier?: BrollTier;
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

// ─── Model chains ─────────────────────────────────────────────────────────────

const PREMIUM_CHAIN: readonly string[] = [
  "fal-ai/veo3",                        // Google Veo 3.1 — best quality, cinematic
  "fal-ai/sora-2/text-to-video",        // OpenAI Sora 2 — strong motion, good prompting
  "fal-ai/runway/gen4-turbo",           // Runway Gen-4 Turbo — consistent, fast
  "fal-ai/kling-v2.5-turbo/text-to-video", // Kling 3.0 — cheapest, decent quality
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

// ─── Cost estimation ──────────────────────────────────────────────────────────

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

// ─── Default negative prompt ──────────────────────────────────────────────────

const DEFAULT_NEGATIVE_PROMPT =
  "blurry, low quality, warped faces, extra fingers, extra limbs, jitter, " +
  "artifacts, watermark, text overlay, logo, glitch, morphing, distortion, " +
  "duplicate frames, static noise, out of focus";

// ─── Per-model input formatting ───────────────────────────────────────────────
// Each fal.ai video model expects a different input schema. This function
// translates our canonical parameters into the model-specific format.

interface CanonicalInput {
  prompt: string;
  negativePrompt: string;
  durationSec: number;
  aspectRatio: BrollAspectRatio;
  resolution: BrollResolution;
}

function resolutionToPixels(res: BrollResolution): { width: number; height: number } {
  switch (res) {
    case "4k":   return { width: 3840, height: 2160 };
    case "1080p": return { width: 1920, height: 1080 };
    case "720p": return { width: 1280, height: 720 };
    case "480p": return { width: 854, height: 480 };
    default:     return { width: 1920, height: 1080 };
  }
}

function formatInputForModel(model: string, c: CanonicalInput): Record<string, unknown> {
  const { width, height } = resolutionToPixels(c.resolution);

  // Adjust dimensions for aspect ratio
  let w = width;
  let h = height;
  if (c.aspectRatio === "9:16") {
    w = height; // swap for vertical
    h = width;
  } else if (c.aspectRatio === "1:1") {
    h = width; // square uses width for both
  }

  switch (model) {
    // ── Google Veo 3.1 ──
    // Accepts: prompt, negative_prompt, duration (string "5" or "10"),
    // aspect_ratio ("16:9"|"9:16"|"1:1"), enhance_prompt (boolean)
    case "fal-ai/veo3":
      return {
        prompt: c.prompt,
        negative_prompt: c.negativePrompt,
        duration: String(Math.min(c.durationSec, 10) <= 5 ? 5 : 10),
        aspect_ratio: c.aspectRatio,
        enhance_prompt: true,
      };

    // ── OpenAI Sora 2 ──
    // Accepts: prompt, negative_prompt, duration (number 5-20),
    // aspect_ratio ("16:9"|"9:16"|"1:1"), resolution ("480p"|"720p"|"1080p")
    case "fal-ai/sora-2/text-to-video":
      return {
        prompt: c.prompt,
        negative_prompt: c.negativePrompt,
        duration: Math.max(5, Math.min(c.durationSec, 20)),
        aspect_ratio: c.aspectRatio,
        resolution: c.resolution === "4k" ? "1080p" : c.resolution,
      };

    // ── Runway Gen-4 Turbo ──
    // Accepts: prompt, duration (number 5 or 10), ratio ("16:9"|"9:16"|"1:1"),
    // seed (optional)
    case "fal-ai/runway/gen4-turbo":
      return {
        prompt: c.prompt,
        duration: Math.min(c.durationSec, 10) <= 5 ? 5 : 10,
        ratio: c.aspectRatio,
      };

    // ── Kling v2.5 Turbo ──
    // Accepts: prompt, negative_prompt, duration (string "5" or "10"),
    // aspect_ratio ("16:9"|"9:16"|"1:1")
    case "fal-ai/kling-v2.5-turbo/text-to-video":
      return {
        prompt: c.prompt,
        negative_prompt: c.negativePrompt,
        duration: String(Math.min(c.durationSec, 10) <= 5 ? 5 : 10),
        aspect_ratio: c.aspectRatio,
      };

    // ── Wan 2.5 ──
    // Accepts: prompt, negative_prompt, num_frames (number), image_size
    // (object {width, height} or string)
    case "fal-ai/wan-2.5/text-to-video":
      return {
        prompt: c.prompt,
        negative_prompt: c.negativePrompt,
        num_frames: Math.round(c.durationSec * 24), // 24fps default
        image_size: { width: w, height: h },
      };

    // ── Hailuo Video-01 ──
    // Accepts: prompt, duration (number), aspect_ratio
    case "fal-ai/hailuo/video-01":
      return {
        prompt: c.prompt,
        duration: Math.min(c.durationSec, 6),
        aspect_ratio: c.aspectRatio,
      };

    // ── PixVerse v4 ──
    // Accepts: prompt, negative_prompt, duration (number 4-8), aspect_ratio,
    // quality ("standard"|"high"), style ("cinematic"|"anime"|"realistic")
    case "fal-ai/pixverse/v4":
      return {
        prompt: c.prompt,
        negative_prompt: c.negativePrompt,
        duration: Math.max(4, Math.min(c.durationSec, 8)),
        aspect_ratio: c.aspectRatio,
        quality: "high",
      };

    // ── Fallback: generic schema ──
    default:
      return {
        prompt: c.prompt,
        negative_prompt: c.negativePrompt,
        duration: c.durationSec,
        aspect_ratio: c.aspectRatio,
        image_size: { width: w, height: h },
      };
  }
}

// ─── Image-to-video per-model formatting ──────────────────────────────────────

function formatI2VInput(
  model: string,
  imageUrl: string,
  motionPrompt: string,
  durationSec: number,
): Record<string, unknown> {
  switch (model) {
    case "fal-ai/kling-v2.5-turbo/image-to-video":
      return {
        image_url: imageUrl,
        prompt: motionPrompt,
        duration: String(Math.min(durationSec, 10) <= 5 ? 5 : 10),
        aspect_ratio: "16:9",
      };
    case "fal-ai/luma-dream-machine":
      return {
        image_url: imageUrl,
        prompt: motionPrompt,
        num_frames: Math.round(durationSec * 24),
      };
    case "fal-ai/pika-2.2":
      return {
        image: imageUrl,
        prompt: motionPrompt,
        duration: Math.min(durationSec, 8),
      };
    default:
      return {
        image_url: imageUrl,
        prompt: motionPrompt,
        duration: durationSec,
      };
  }
}

// ─── Response URL extraction ──────────────────────────────────────────────────

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

// ─── Fal client loader ────────────────────────────────────────────────────────

async function loadFal(): Promise<typeof import("./fal-client")> {
  return await import("./fal-client");
}

// ─── Core generation: single B-roll clip ──────────────────────────────────────

/**
 * Generate a single B-roll video clip from a text description.
 *
 * Uses a 4-model fallback chain. Returns the first successful result
 * with warnings about any models that failed along the way.
 *
 * @example
 * ```ts
 * const clip = await generateBrollClip(
 *   "aerial shot of modern city skyline at sunset, cinematic 4K",
 *   { aspectRatio: "16:9", durationSec: 5, tier: "premium" }
 * );
 * console.log(clip.videoUrl, clip.model);
 * ```
 */
export async function generateBrollClip(
  description: string,
  options: BrollClipOptions = {},
): Promise<BrollResult> {
  const {
    aspectRatio = "16:9",
    durationSec = 5,
    resolution = "1080p",
    tier = "premium",
    style,
    negativePrompt = DEFAULT_NEGATIVE_PROMPT,
  } = options;

  const chain = tier === "premium" ? PREMIUM_CHAIN : BUDGET_CHAIN;

  // Build the cinematic prompt with optional style
  const styledPrompt = style
    ? `${description}. Style: ${style}`
    : description;

  const canonical: CanonicalInput = {
    prompt: styledPrompt,
    negativePrompt,
    durationSec,
    aspectRatio,
    resolution,
  };

  const fal = await loadFal();
  const warnings: string[] = [];

  for (const model of chain) {
    const modelInput = formatInputForModel(model, canonical);
    try {
      const result = await fal.runFal<unknown, Record<string, unknown>>({
        model,
        input: modelInput,
        maxWaitMs: 300_000, // 5 min max per model — video gen is slow
        pollMs: 2_000,
      });

      const url = extractUrl(result);
      if (!url) {
        warnings.push(`${model}: completed but returned no video URL`);
        continue;
      }

      return {
        videoUrl: url,
        model,
        durationSec,
        resolution,
        prompt: styledPrompt,
        estimatedCostUsd: estimateCost(model, durationSec),
        warnings,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`${model}: ${msg}`);
      continue;
    }
  }

  // All models failed — throw with full diagnostic info
  throw new fal.FalError(
    `All B-roll models failed for "${description.slice(0, 80)}": ${warnings.join(" | ")}`,
    { status: 502, model: chain.join(","), cause: warnings },
  );
}

// ─── Multi-clip generation ────────────────────────────────────────────────────

/**
 * Generate multiple B-roll clips in parallel with partial failure tolerance.
 *
 * Never throws on individual clip failures — collects them in `failed` array.
 * Callers get whatever clips succeeded plus a list of what didn't.
 *
 * @example
 * ```ts
 * const result = await generateMultipleBroll([
 *   { description: "aerial city at sunset", duration: 5 },
 *   { description: "close-up of hands typing on laptop", duration: 5 },
 *   { description: "ocean waves crashing on rocks", duration: 10 },
 * ], { tier: "premium", aspectRatio: "16:9" });
 *
 * console.log(`${result.clips.length} succeeded, ${result.failed.length} failed`);
 * ```
 */
export async function generateMultipleBroll(
  scenes: Array<{ description: string; duration?: number }>,
  options: BrollClipOptions = {},
): Promise<BrollMultiResult> {
  if (scenes.length === 0) {
    return { clips: [], failed: [], totalCostUsd: 0 };
  }

  // Cap concurrency at 3 to avoid fal.ai rate limits
  const CONCURRENCY = 3;
  const clips: BrollResult[] = [];
  const failed: Array<{ description: string; error: string }> = [];

  // Process in batches of CONCURRENCY
  for (let i = 0; i < scenes.length; i += CONCURRENCY) {
    const batch = scenes.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((scene) =>
        generateBrollClip(scene.description, {
          ...options,
          durationSec: scene.duration ?? options.durationSec ?? 5,
        }),
      ),
    );

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      const scene = batch[j];
      if (r.status === "fulfilled") {
        clips.push(r.value);
      } else {
        const errMsg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        failed.push({ description: scene.description, error: errMsg });
      }
    }
  }

  const totalCostUsd = clips.reduce((sum, c) => sum + c.estimatedCostUsd, 0);

  return { clips, failed, totalCostUsd };
}

// ─── Legacy API: generateBroll (backward compat with existing routes) ─────────

/**
 * Legacy wrapper — used by /api/video/broll/route.ts.
 * Maps the old BrollRequest interface to the new generateBrollClip.
 */
export async function generateBroll(req: BrollRequest): Promise<BrollResult> {
  return generateBrollClip(req.prompt, {
    durationSec: req.durationSec,
    resolution: req.resolution,
    style: req.style,
    tier: req.tier,
    aspectRatio: "16:9",
  });
}

// ─── Music generation ─────────────────────────────────────────────────────────

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
    generateBrollClip(args.prompt, {
      durationSec: args.durationSec,
      resolution: args.resolution,
      style: args.style,
      tier: args.tier,
    }),
    generateMusic(args.music),
  ]);
  return { video, musicUrl: music.url, musicModel: music.model };
}

// ─── Image-to-video ───────────────────────────────────────────────────────────

export async function generateImageToVideo(req: ImageToVideoRequest): Promise<ImageToVideoResult> {
  const durationSec = req.durationSec ?? 5;
  const fal = await loadFal();
  const warnings: string[] = [];

  for (const model of I2V_CHAIN) {
    const input = formatI2VInput(model, req.imageUrl, req.motionPrompt, durationSec);
    try {
      const result = await fal.runFal<unknown, Record<string, unknown>>({
        model,
        input,
        maxWaitMs: 300_000,
      });
      const url = extractUrl(result);
      if (!url) {
        warnings.push(`${model}: completed but returned no video URL`);
        continue;
      }
      return {
        videoUrl: url,
        model,
        estimatedCostUsd: estimateCost(model, durationSec),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`${model}: ${msg}`);
      continue;
    }
  }

  throw new fal.FalError(
    `All image-to-video models failed: ${warnings.join(" | ")}`,
    { status: 502, model: I2V_CHAIN.join(","), cause: warnings },
  );
}

// ─── Exports for external use ─────────────────────────────────────────────────

export const PREMIUM_BROLL_CHAIN = PREMIUM_CHAIN;
export const BUDGET_BROLL_CHAIN = BUDGET_CHAIN;
export const IMAGE_TO_VIDEO_CHAIN = I2V_CHAIN;
