import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EnvStatus {
  FAL_KEY: "present" | "missing";
  ELEVENLABS_API_KEY: "present" | "missing";
  HEDRA_API_KEY: "present" | "missing";
  ANTHROPIC_API_KEY: "present" | "missing";
}

interface ModelPing {
  model: string;
  status: "ok" | "error";
  httpStatus: number;
  latencyMs: number;
  hint?: string;
}

interface ChainResults {
  tts: ModelPing[];
  avatar: ModelPing[];
  broll: ModelPing[];
  captions: ModelPing[];
  music: ModelPing[];
}

interface HealthBody {
  ok: boolean;
  env: EnvStatus;
  chains: ChainResults;
  summary: {
    healthyModels: number;
    totalModels: number;
    missingEnvCount: number;
  };
  hint?: string;
}

const CHAINS: Record<keyof ChainResults, string[]> = {
  tts: [
    "fal-ai/elevenlabs/tts/multilingual-v2",
    "fal-ai/playai/tts/v3",
    "fal-ai/kokoro/american-english",
    "fal-ai/orpheus-tts",
  ],
  avatar: [
    "fal-ai/hedra/character-3",
    "fal-ai/veed/avatars/text-to-video",
    "fal-ai/sync-lipsync",
    "fal-ai/latentsync",
  ],
  broll: [
    "fal-ai/veo3",
    "fal-ai/kling-video/v2/master/text-to-video",
    "fal-ai/minimax/hailuo-02/standard/text-to-video",
    "fal-ai/wan-25-preview/text-to-video",
  ],
  captions: [
    "fal-ai/whisper",
    "fal-ai/wizper",
    "fal-ai/speech-to-text",
    "fal-ai/elevenlabs/speech-to-text",
  ],
  music: [
    "fal-ai/stable-audio-25/text-to-audio",
    "fal-ai/ace-step",
    "fal-ai/cassetteai/music-generator",
    "fal-ai/lyria2",
  ],
};

function checkEnv(): EnvStatus {
  const has = (k: string): "present" | "missing" =>
    process.env[k] && process.env[k]!.length > 0 ? "present" : "missing";
  return {
    FAL_KEY: has("FAL_KEY"),
    ELEVENLABS_API_KEY: has("ELEVENLABS_API_KEY"),
    HEDRA_API_KEY: has("HEDRA_API_KEY"),
    ANTHROPIC_API_KEY: has("ANTHROPIC_API_KEY"),
  };
}

async function pingFalModel(model: string): Promise<ModelPing> {
  const start = Date.now();
  const key = process.env.FAL_KEY;
  if (!key) {
    return {
      model,
      status: "error",
      httpStatus: 0,
      latencyMs: 0,
      hint: "FAL_KEY missing — set it in Vercel env vars",
    };
  }
  try {
    const url = `https://fal.run/${model}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Key ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;
    // 200, 401, 405, 422 all mean the model exists & is reachable.
    // 404 means the model id is wrong/removed.
    const reachable = res.status !== 404 && res.status < 500;
    return {
      model,
      status: reachable ? "ok" : "error",
      httpStatus: res.status,
      latencyMs,
      hint:
        res.status === 404
          ? "model not found on fal — replace in chain"
          : res.status >= 500
            ? "fal upstream 5xx — retry later"
            : undefined,
    };
  } catch (err) {
    return {
      model,
      status: "error",
      httpStatus: 0,
      latencyMs: Date.now() - start,
      hint: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

async function pingChain(models: string[]): Promise<ModelPing[]> {
  const settled = await Promise.allSettled(models.map((m) => pingFalModel(m)));
  return settled.map((s, i) => {
    if (s.status === "fulfilled") return s.value;
    return {
      model: models[i],
      status: "error" as const,
      httpStatus: 0,
      latencyMs: 0,
      hint: s.reason instanceof Error ? s.reason.message : "settled rejection",
    };
  });
}

export async function GET(): Promise<NextResponse<HealthBody>> {
  try {
    const env = checkEnv();
    const missingEnvCount = Object.values(env).filter(
      (v) => v === "missing",
    ).length;

    const [tts, avatar, broll, captions, music] = await Promise.all([
      pingChain(CHAINS.tts),
      pingChain(CHAINS.avatar),
      pingChain(CHAINS.broll),
      pingChain(CHAINS.captions),
      pingChain(CHAINS.music),
    ]);

    const chains: ChainResults = { tts, avatar, broll, captions, music };
    const all = [...tts, ...avatar, ...broll, ...captions, ...music];
    const healthyModels = all.filter((m) => m.status === "ok").length;
    const totalModels = all.length;
    const ok = missingEnvCount === 0 && healthyModels === totalModels;

    return NextResponse.json<HealthBody>(
      {
        ok,
        env,
        chains,
        summary: { healthyModels, totalModels, missingEnvCount },
        hint: ok
          ? undefined
          : `${missingEnvCount} env var(s) missing, ${totalModels - healthyModels} model(s) unreachable`,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json<HealthBody>(
      {
        ok: false,
        env: checkEnv(),
        chains: { tts: [], avatar: [], broll: [], captions: [], music: [] },
        summary: { healthyModels: 0, totalModels: 0, missingEnvCount: 4 },
        hint: `health check threw: ${err instanceof Error ? err.message : String(err)}`,
      },
      { status: 200 },
    );
  }
}
