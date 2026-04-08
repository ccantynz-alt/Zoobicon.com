// AI Twins pipeline — selfie + script → lip-synced talking video.
// Self-contained. No imports from other video libs (avoid circular deps).

export interface TwinRequest {
  faceImageUrl: string;
  script: string;
  voiceCloneAudioUrl?: string;
  voiceStyle?: "professional" | "warm" | "energetic" | "calm";
  background?: string;
  format?: "portrait" | "landscape" | "square";
}

export interface TwinResult {
  videoUrl: string;
  audioUrl: string;
  duration: number;
  cost: number;
  pipeline: string;
  steps: string[];
}

export type ProgressFn = (s: { step: string; progress: number; message: string }) => void;

const VOICE_CLONE_MODELS = [
  "lucataco/xtts-v2",
  "cjwbw/seamless_communication",
  "chenxwh/openvoice",
  "jaaari/kokoro-82m",
];

const TTS_MODELS = [
  "jaaari/kokoro-82m",
  "lucataco/xtts-v2",
  "cjwbw/seamless_communication",
  "chenxwh/openvoice",
];

const LIPSYNC_MODELS = [
  "cjwbw/sadtalker",
  "lucataco/sadtalker",
  "cudanexus/wav2lip",
  "devxpy/cog-wav2lip",
];

export function getReplicateToken(): string {
  const t =
    process.env.REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_KEY ||
    process.env.REPLICATE_TOKEN ||
    process.env.REPLICATE_KEY;
  if (!t) {
    throw new Error(
      "Replicate token missing. Set REPLICATE_API_TOKEN in your environment (Vercel → Settings → Environment Variables)."
    );
  }
  return t;
}

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: string | null;
  urls?: { get?: string };
}

export async function runReplicateModel(
  modelSlug: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const token = getReplicateToken();
  const createRes = await fetch(
    `https://api.replicate.com/v1/models/${modelSlug}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=5",
      },
      body: JSON.stringify({ input }),
    }
  );

  if (createRes.status === 404) {
    throw new Error(`MODEL_404:${modelSlug}`);
  }
  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Replicate ${modelSlug} failed (${createRes.status}): ${text}`);
  }

  let pred = (await createRes.json()) as ReplicatePrediction;
  const start = Date.now();
  const timeoutMs = 10 * 60 * 1000;

  while (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Replicate ${modelSlug} timed out after 10 minutes`);
    }
    await new Promise((r) => setTimeout(r, 2000));
    const pollUrl = pred.urls?.get || `https://api.replicate.com/v1/predictions/${pred.id}`;
    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!pollRes.ok) {
      throw new Error(`Replicate poll failed (${pollRes.status})`);
    }
    pred = (await pollRes.json()) as ReplicatePrediction;
  }

  if (pred.status !== "succeeded") {
    throw new Error(`Replicate ${modelSlug} ${pred.status}: ${pred.error || "unknown error"}`);
  }
  return pred.output;
}

export async function runWithFallback(
  models: string[],
  input: Record<string, unknown>,
  steps: string[]
): Promise<{ output: unknown; modelUsed: string }> {
  let lastErr: Error | null = null;
  for (const slug of models) {
    try {
      steps.push(`try:${slug}`);
      const output = await runReplicateModel(slug, input);
      steps.push(`ok:${slug}`);
      return { output, modelUsed: slug };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      steps.push(`fail:${slug}:${msg.slice(0, 80)}`);
      lastErr = err instanceof Error ? err : new Error(msg);
      console.warn(`[ai-twins] model ${slug} failed, trying next:`, msg);
    }
  }
  throw new Error(
    `All models failed. Last error: ${lastErr?.message || "unknown"}. Tried: ${models.join(", ")}`
  );
}

function extractUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === "string") return output[0];
  if (output && typeof output === "object") {
    const o = output as Record<string, unknown>;
    for (const key of ["video", "output", "url", "audio"]) {
      const v = o[key];
      if (typeof v === "string") return v;
      if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    }
  }
  throw new Error(`Could not extract URL from model output: ${JSON.stringify(output).slice(0, 200)}`);
}

export async function generateTwinVideo(
  req: TwinRequest,
  onProgress?: ProgressFn
): Promise<TwinResult> {
  const steps: string[] = [];
  const progress = (step: string, p: number, message: string) => {
    steps.push(`step:${step}`);
    onProgress?.({ step, progress: p, message });
  };

  if (!req.faceImageUrl) throw new Error("faceImageUrl is required");
  if (!req.script || !req.script.trim()) throw new Error("script is required");

  // 1. Voice generation
  progress("voice", 10, req.voiceCloneAudioUrl ? "Cloning your voice..." : "Generating voice...");
  const voiceModels = req.voiceCloneAudioUrl ? VOICE_CLONE_MODELS : TTS_MODELS;
  const voiceInput: Record<string, unknown> = {
    text: req.script,
    speaker: req.voiceCloneAudioUrl,
    audio: req.voiceCloneAudioUrl,
    speaker_wav: req.voiceCloneAudioUrl,
    language: "en",
    voice: req.voiceStyle || "warm",
  };
  const { output: voiceOut, modelUsed: voiceModel } = await runWithFallback(
    voiceModels,
    voiceInput,
    steps
  );
  const audioUrl = extractUrl(voiceOut);
  progress("voice_done", 50, "Voice ready");

  // 2. Lip-sync
  progress("lipsync", 55, "Generating lip-sync video...");
  const lipsyncInput: Record<string, unknown> = {
    source_image: req.faceImageUrl,
    image: req.faceImageUrl,
    face: req.faceImageUrl,
    driven_audio: audioUrl,
    audio: audioUrl,
    preprocess: "full",
    still: false,
    enhancer: "gfpgan",
  };
  const { output: lipOut, modelUsed: lipModel } = await runWithFallback(
    LIPSYNC_MODELS,
    lipsyncInput,
    steps
  );
  const videoUrl = extractUrl(lipOut);
  progress("done", 100, "Done");

  // Rough duration estimate: ~150 wpm
  const wordCount = req.script.trim().split(/\s+/).length;
  const duration = Math.max(2, Math.round((wordCount / 150) * 60));

  return {
    videoUrl,
    audioUrl,
    duration,
    cost: 0.15,
    pipeline: `${voiceModel} → ${lipModel}`,
    steps,
  };
}
