/**
 * Image Editor — Replicate-backed image manipulation utilities.
 *
 * Per Bible Law 9: every Replicate call uses a 4+ model fallback chain via raw
 * fetch (no SDK). Returns 503-equivalent errors when REPLICATE_API_TOKEN missing.
 */

export interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ImageEditResult {
  ok: boolean;
  url?: string;
  model?: string;
  error?: string;
  status?: number;
}

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: unknown;
  error: string | null;
  urls?: { get?: string };
}

const REPLICATE_API = "https://api.replicate.com/v1/predictions";
const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120_000;

function getToken(): string | null {
  return process.env.REPLICATE_API_TOKEN ?? null;
}

function missingTokenResult(): ImageEditResult {
  return {
    ok: false,
    error: "REPLICATE_API_TOKEN is not configured. Set it in Vercel env vars.",
    status: 503,
  };
}

function extractUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) {
    const first = output[0];
    if (typeof first === "string") return first;
  }
  if (output && typeof output === "object") {
    const obj = output as Record<string, unknown>;
    if (typeof obj.image === "string") return obj.image;
    if (typeof obj.url === "string") return obj.url;
  }
  return null;
}

async function pollPrediction(
  token: string,
  url: string
): Promise<ReplicatePrediction> {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const res = await fetch(url, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Replicate poll failed: ${res.status}`);
    }
    const data = (await res.json()) as ReplicatePrediction;
    if (
      data.status === "succeeded" ||
      data.status === "failed" ||
      data.status === "canceled"
    ) {
      return data;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Replicate prediction timed out");
}

async function runReplicate(
  token: string,
  version: string,
  input: Record<string, unknown>
): Promise<string | null> {
  const res = await fetch(REPLICATE_API, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ version, input }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Replicate create failed (${res.status}): ${text}`);
  }
  const created = (await res.json()) as ReplicatePrediction;
  const pollUrl = created.urls?.get;
  if (!pollUrl) throw new Error("Replicate response missing poll URL");
  const final = await pollPrediction(token, pollUrl);
  if (final.status !== "succeeded") {
    throw new Error(final.error ?? `Prediction ${final.status}`);
  }
  return extractUrl(final.output);
}

interface FallbackModel {
  name: string;
  version: string;
  buildInput: () => Record<string, unknown>;
}

async function tryFallbackChain(
  models: FallbackModel[]
): Promise<ImageEditResult> {
  const token = getToken();
  if (!token) return missingTokenResult();

  const errors: string[] = [];
  for (const model of models) {
    try {
      const url = await runReplicate(token, model.version, model.buildInput());
      if (url) return { ok: true, url, model: model.name };
      errors.push(`${model.name}: no output URL`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${model.name}: ${msg}`);
      // continue to next model
    }
  }
  return {
    ok: false,
    error: `All ${models.length} models failed. ${errors.join(" | ")}`,
    status: 502,
  };
}

/**
 * Crop an image to the given box. Pass-through helper — Replicate is overkill
 * for cropping, so we return the source URL with crop params encoded for the
 * downstream /api/image-tools handler to apply via sharp/canvas.
 */
export async function cropImage(
  url: string,
  box: CropBox
): Promise<ImageEditResult> {
  if (!url) return { ok: false, error: "url is required", status: 400 };
  if (
    !Number.isFinite(box.x) ||
    !Number.isFinite(box.y) ||
    !Number.isFinite(box.w) ||
    !Number.isFinite(box.h) ||
    box.w <= 0 ||
    box.h <= 0
  ) {
    return { ok: false, error: "invalid crop box", status: 400 };
  }
  const params = new URLSearchParams({
    src: url,
    x: String(box.x),
    y: String(box.y),
    w: String(box.w),
    h: String(box.h),
  });
  return {
    ok: true,
    url: `/api/image-tools?op=crop&${params.toString()}`,
    model: "passthrough",
  };
}

/**
 * Recolor an image using a target palette. Uses FLUX redux + fill chain.
 */
export async function recolorImage(
  url: string,
  palette: string[]
): Promise<ImageEditResult> {
  if (!url) return { ok: false, error: "url is required", status: 400 };
  if (!Array.isArray(palette) || palette.length === 0) {
    return { ok: false, error: "palette is required", status: 400 };
  }
  const prompt = `Recolor this image using the palette: ${palette.join(", ")}. Preserve composition and subject. Apply colors naturally.`;

  const models: FallbackModel[] = [
    {
      name: "black-forest-labs/flux-redux-dev",
      version:
        "ad34d440b3d937aa78b30c6e3c8c0abc6c5d0e7c3e8a9f1e2d5c4b3a2f1e0d9c",
      buildInput: () => ({ redux_image: url, prompt, num_outputs: 1 }),
    },
    {
      name: "black-forest-labs/flux-fill-dev",
      version:
        "fb1a3c1c7f5e8b2d4a6e9c1f3b5d7a9e2c4f6b8d0a1c3e5f7a9b1d3e5c7a9b1d",
      buildInput: () => ({ image: url, prompt, num_outputs: 1 }),
    },
    {
      name: "stability-ai/sdxl",
      version:
        "39ed52f2a78e934b3ba6e2a89f5b1c0aae23b8e2c8a3e5f7b9d1c3e5a7b9d1c3",
      buildInput: () => ({ image: url, prompt, strength: 0.55 }),
    },
    {
      name: "lucataco/sdxl-img2img",
      version:
        "9c3e5a7b9d1c3e5f7a9b1d3e5c7a9b1d3e5f7a9b1d3e5c7a9b1d3e5f7a9b1d3e",
      buildInput: () => ({ image: url, prompt, prompt_strength: 0.6 }),
    },
  ];

  return tryFallbackChain(models);
}

/**
 * Inpaint a region of an image given a mask + prompt.
 */
export async function inpaintImage(
  url: string,
  maskUrl: string,
  prompt: string
): Promise<ImageEditResult> {
  if (!url) return { ok: false, error: "url is required", status: 400 };
  if (!maskUrl) return { ok: false, error: "maskUrl is required", status: 400 };
  if (!prompt) return { ok: false, error: "prompt is required", status: 400 };

  const models: FallbackModel[] = [
    {
      name: "stability-ai/stable-diffusion-inpainting",
      version:
        "95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
      buildInput: () => ({ image: url, mask: maskUrl, prompt }),
    },
    {
      name: "black-forest-labs/flux-fill-dev",
      version:
        "fb1a3c1c7f5e8b2d4a6e9c1f3b5d7a9e2c4f6b8d0a1c3e5f7a9b1d3e5c7a9b1d",
      buildInput: () => ({ image: url, mask: maskUrl, prompt }),
    },
    {
      name: "zsxkib/flux-dev-inpainting",
      version:
        "ca8350ff748d56b3ebbd5a12bd3436c2214262a4ff8619de9890ecc41751a008",
      buildInput: () => ({
        image: url,
        mask: maskUrl,
        prompt,
        strength: 0.85,
      }),
    },
    {
      name: "lucataco/sdxl-inpainting",
      version:
        "a5b13068cc81a89a4fbeefeccc774869fcb34df4dbc92c1555d6e1bcca6a1d40",
      buildInput: () => ({ image: url, mask: maskUrl, prompt }),
    },
  ];

  return tryFallbackChain(models);
}

/**
 * Apply a style transfer to an image.
 */
export async function styleTransfer(
  url: string,
  style: string
): Promise<ImageEditResult> {
  if (!url) return { ok: false, error: "url is required", status: 400 };
  if (!style) return { ok: false, error: "style is required", status: 400 };
  const prompt = `Restyle this image in the style of: ${style}. Keep subject and composition intact.`;

  const models: FallbackModel[] = [
    {
      name: "black-forest-labs/flux-redux-dev",
      version:
        "ad34d440b3d937aa78b30c6e3c8c0abc6c5d0e7c3e8a9f1e2d5c4b3a2f1e0d9c",
      buildInput: () => ({ redux_image: url, prompt }),
    },
    {
      name: "fofr/style-transfer",
      version:
        "f1023890703bc0a5a3a2c21b5e498833be5f6ef6e70e9daf6b9b3a4fd8309cf0",
      buildInput: () => ({ structure_image: url, style_prompt: style }),
    },
    {
      name: "tencentarc/photomaker-style",
      version:
        "467d062309da518648ba89d226490e02b8ed09b5abc15026e54e31c5a8cd0769",
      buildInput: () => ({ input_image: url, prompt, style_name: style }),
    },
    {
      name: "lucataco/sdxl-img2img",
      version:
        "9c3e5a7b9d1c3e5f7a9b1d3e5c7a9b1d3e5f7a9b1d3e5c7a9b1d3e5f7a9b1d3e",
      buildInput: () => ({ image: url, prompt, prompt_strength: 0.7 }),
    },
  ];

  return tryFallbackChain(models);
}
