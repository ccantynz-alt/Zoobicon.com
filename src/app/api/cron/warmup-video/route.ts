import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WarmupResult {
  chain: string;
  model: string;
  status: "warm" | "cold" | "error";
  latencyMs: number;
  hint?: string;
}

interface WarmupBody {
  ok: boolean;
  pingedAt: string;
  results: WarmupResult[];
  hint?: string;
}

const TOP_MODELS: Array<{ chain: string; model: string }> = [
  { chain: "tts", model: "fal-ai/elevenlabs/tts/multilingual-v2" },
  { chain: "avatar", model: "fal-ai/hedra/character-3" },
  { chain: "broll", model: "fal-ai/veo3" },
  { chain: "captions", model: "fal-ai/whisper" },
  { chain: "music", model: "fal-ai/stable-audio-25/text-to-audio" },
];

async function warmOne(
  entry: { chain: string; model: string },
): Promise<WarmupResult> {
  const start = Date.now();
  if (!process.env.FAL_KEY) {
    return {
      chain: entry.chain,
      model: entry.model,
      status: "error",
      latencyMs: 0,
      hint: "FAL_KEY missing — set in Vercel env vars",
    };
  }
  try {
    const mod: typeof import("@/lib/fal-client") = await import(
      "@/lib/fal-client"
    );
    // No-op metadata fetch — we don't actually invoke generation, we use a
    // GET against the model endpoint via runFalWithFallback's fallback path.
    // Since runFal POSTs, we instead do a direct lightweight reach via fetch
    // here (still leveraging the imported module's contract for type safety).
    void mod.runFalWithFallback;
    const res = await fetch(`https://fal.run/${entry.model}`, {
      method: "GET",
      headers: { Authorization: `Key ${process.env.FAL_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    const latencyMs = Date.now() - start;
    if (res.status === 404) {
      return {
        chain: entry.chain,
        model: entry.model,
        status: "error",
        latencyMs,
        hint: "model 404 — replace in chain",
      };
    }
    return {
      chain: entry.chain,
      model: entry.model,
      status: latencyMs < 2000 ? "warm" : "cold",
      latencyMs,
    };
  } catch (err) {
    return {
      chain: entry.chain,
      model: entry.model,
      status: "error",
      latencyMs: Date.now() - start,
      hint: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

async function runWarmup(): Promise<WarmupBody> {
  const settled = await Promise.allSettled(TOP_MODELS.map((m) => warmOne(m)));
  const results: WarmupResult[] = settled.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : {
          chain: TOP_MODELS[i].chain,
          model: TOP_MODELS[i].model,
          status: "error" as const,
          latencyMs: 0,
          hint: s.reason instanceof Error ? s.reason.message : "rejected",
        },
  );
  const ok = results.every((r) => r.status !== "error");
  return {
    ok,
    pingedAt: new Date().toISOString(),
    results,
    hint: ok ? undefined : "one or more models failed warmup — check results[]",
  };
}

export async function GET(): Promise<NextResponse<WarmupBody>> {
  try {
    return NextResponse.json<WarmupBody>(await runWarmup(), { status: 200 });
  } catch (err) {
    return NextResponse.json<WarmupBody>(
      {
        ok: false,
        pingedAt: new Date().toISOString(),
        results: [],
        hint: err instanceof Error ? err.message : String(err),
      },
      { status: 200 },
    );
  }
}

export async function POST(): Promise<NextResponse<WarmupBody>> {
  return GET();
}
