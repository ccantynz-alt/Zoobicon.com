// Talking-head avatar generation.
// Primary: Hedra Character-3 via fal.ai. Fallback chain: OmniHuman → OmniHuman 1.5 → Sonic → SadTalker.
// Alternative: direct Hedra REST API when fal.ai is unavailable.
// TODO: Direct ByteDance OmniHuman via BytePlus (https://www.byteplusapi.com) — requires SigV4 signing.
//   See https://www.byteplus.com/en/product/OmniHuman for credentials (BYTEPLUS_ACCESS_KEY + BYTEPLUS_SECRET_KEY).

export const runtime = "nodejs";

export interface TalkingHeadInput {
  imageUrl: string;
  audioUrl: string;
  prompt?: string;
}

export interface TalkingHeadResult {
  videoUrl: string;
  model: string;
  durationSec: number;
}

export interface AvatarModelMeta {
  id: string;
  provider: "fal" | "hedra" | "byteplus";
  label: string;
  quality: 1 | 2 | 3 | 4 | 5;
  costPerSecondUsd: number;
  notes: string;
}

export const AVATAR_MODEL_CHAIN: AvatarModelMeta[] = [
  {
    id: "fal-ai/hedra/character-3",
    provider: "fal",
    label: "Hedra Character-3",
    quality: 5,
    costPerSecondUsd: 0.15,
    notes: "Primary. Best lip-sync + expression fidelity available on fal.ai.",
  },
  {
    id: "fal-ai/bytedance/omnihuman",
    provider: "fal",
    label: "ByteDance OmniHuman",
    quality: 5,
    costPerSecondUsd: 0.12,
    notes: "Fallback 1. Photorealistic full-body talking head.",
  },
  {
    id: "fal-ai/bytedance/omnihuman-1.5",
    provider: "fal",
    label: "ByteDance OmniHuman 1.5",
    quality: 4,
    costPerSecondUsd: 0.1,
    notes: "Fallback 2. Newer iteration, slightly faster.",
  },
  {
    id: "fal-ai/sonic",
    provider: "fal",
    label: "Sonic",
    quality: 3,
    costPerSecondUsd: 0.06,
    notes: "Fallback 3. Fast, good for short clips.",
  },
  {
    id: "fal-ai/sadtalker",
    provider: "fal",
    label: "SadTalker",
    quality: 2,
    costPerSecondUsd: 0.03,
    notes: "Fallback 4. Open-source baseline. Lowest cost.",
  },
];

interface FalVideoResult {
  video?: { url?: string; duration?: number };
  output?: { url?: string };
  url?: string;
  duration?: number;
}

interface HedraGenerationResponse {
  id?: string;
  status?: string;
  video_url?: string;
  output_url?: string;
  duration?: number;
}

function extractFalVideo(result: FalVideoResult, model: string): TalkingHeadResult {
  const videoUrl = result.video?.url ?? result.output?.url ?? result.url ?? "";
  if (!videoUrl) {
    throw new Error(`fal model ${model} returned no video url`);
  }
  return {
    videoUrl,
    model,
    durationSec: result.video?.duration ?? result.duration ?? 0,
  };
}

async function generateViaFal(input: TalkingHeadInput): Promise<TalkingHeadResult> {
  const { runFalWithFallback } = await import("@/lib/fal-client");
  const models = AVATAR_MODEL_CHAIN.filter((m) => m.provider === "fal").map((m) => m.id);
  const payload: Record<string, string> = {
    image_url: input.imageUrl,
    audio_url: input.audioUrl,
  };
  if (input.prompt) payload.prompt = input.prompt;

  // Try each model individually so we can label which one succeeded.
  let lastError: unknown = null;
  for (const model of models) {
    try {
      const result = await runFalWithFallback<FalVideoResult, Record<string, string>>({
        models: [model],
        input: payload,
      });
      return extractFalVideo(result, model);
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("all fal avatar models failed");
}

async function generateViaHedra(input: TalkingHeadInput): Promise<TalkingHeadResult> {
  const apiKey = process.env.HEDRA_API_KEY;
  if (!apiKey) throw new Error("HEDRA_API_KEY not set");

  const createRes = await fetch("https://api.hedra.com/v1/characters", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      avatar_image: input.imageUrl,
      voice_url: input.audioUrl,
      aspect_ratio: "1:1",
      text: input.prompt ?? "",
    }),
  });

  if (!createRes.ok) {
    throw new Error(`hedra create failed: ${createRes.status}`);
  }
  const created = (await createRes.json()) as HedraGenerationResponse;
  const jobId = created.id;
  if (!jobId) throw new Error("hedra returned no job id");

  const startedAt = Date.now();
  const maxWaitMs = 5 * 60 * 1000;
  while (Date.now() - startedAt < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusRes = await fetch(`https://api.hedra.com/v1/characters/${jobId}`, {
      headers: { "X-API-Key": apiKey },
    });
    if (!statusRes.ok) continue;
    const status = (await statusRes.json()) as HedraGenerationResponse;
    if (status.status === "completed" || status.video_url || status.output_url) {
      const videoUrl = status.video_url ?? status.output_url ?? "";
      if (!videoUrl) throw new Error("hedra completed without video url");
      return {
        videoUrl,
        model: "hedra/character-3-direct",
        durationSec: status.duration ?? 0,
      };
    }
    if (status.status === "failed" || status.status === "error") {
      throw new Error(`hedra job failed: ${status.status}`);
    }
  }
  throw new Error("hedra job timed out");
}

export async function generateTalkingHead(
  input: TalkingHeadInput,
): Promise<TalkingHeadResult> {
  const hasFal = Boolean(process.env.FAL_KEY);
  const hasHedra = Boolean(process.env.HEDRA_API_KEY);

  if (!hasFal && !hasHedra) {
    const err = new Error(
      "talking-head generation unavailable: set FAL_KEY or HEDRA_API_KEY",
    ) as Error & { status?: number };
    err.status = 503;
    throw err;
  }

  if (hasFal) {
    try {
      return await generateViaFal(input);
    } catch (err) {
      if (!hasHedra) throw err;
    }
  }
  return await generateViaHedra(input);
}
