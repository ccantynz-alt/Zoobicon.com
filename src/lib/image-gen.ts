/**
 * AI Image Generation Engine
 *
 * Two pipelines exported from this file:
 *
 *   1. Legacy multi-provider pipeline (DALL-E / Stability / Unsplash)
 *      - export: generateImage(opts: GenerateOptions): Promise<GeneratedImage>
 *      - Used by /api/generate/images and /api/generate/ai-images
 *
 *   2. New Replicate 4-model fallback pipeline (Bible Law 9)
 *      - export: generateImagePipeline(req: ImageGenRequest): Promise<ImageGenResult>
 *      - export: isImageGenAvailable()
 *      - Used by /api/v1/images public API
 *      - Chain: flux-schnell → flux-dev → sdxl → sdxl-lightning-4step
 *
 * NOTE: the new pipeline is exported under the name `generateImagePipeline`
 * (not `generateImage`) to avoid colliding with the legacy export consumed
 * by existing routes. The /api/v1/images route imports it aliased.
 */

export interface GeneratedImage {
  url: string;
  provider: "dall-e" | "stability" | "unsplash" | "placeholder";
  prompt: string;
  width: number;
  height: number;
}

interface GenerateOptions {
  prompt: string;
  width?: number;
  height?: number;
  style?: "photo" | "illustration" | "3d" | "artistic";
  quality?: "standard" | "hd";
}

// ── DALL-E 3 ──
async function generateWithDallE(opts: GenerateOptions): Promise<GeneratedImage | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    // DALL-E 3 supports: 1024x1024, 1792x1024, 1024x1792
    const w = opts.width || 1024;
    const h = opts.height || 1024;
    let size: string = "1024x1024";
    if (w > h * 1.3) size = "1792x1024";
    else if (h > w * 1.3) size = "1024x1792";

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: opts.prompt,
        n: 1,
        size,
        quality: opts.quality === "hd" ? "hd" : "standard",
        style: opts.style === "photo" ? "natural" : "vivid",
      }),
    });

    if (!res.ok) {
      console.error("DALL-E error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const url = data.data?.[0]?.url;
    if (!url) return null;

    return {
      url,
      provider: "dall-e",
      prompt: opts.prompt,
      width: parseInt(size.split("x")[0]),
      height: parseInt(size.split("x")[1]),
    };
  } catch (err) {
    console.error("DALL-E generation failed:", err);
    return null;
  }
}

// ── Stability AI (SDXL) ──
async function generateWithStability(opts: GenerateOptions): Promise<GeneratedImage | null> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return null;

  try {
    const w = Math.min(opts.width || 1024, 1536);
    const h = Math.min(opts.height || 1024, 1536);
    // Stability needs dimensions divisible by 64
    const width = Math.round(w / 64) * 64;
    const height = Math.round(h / 64) * 64;

    const stylePreset =
      opts.style === "photo" ? "photographic" :
      opts.style === "3d" ? "3d-model" :
      opts.style === "illustration" ? "digital-art" :
      "photographic";

    const res = await fetch(
      "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          text_prompts: [
            { text: opts.prompt, weight: 1 },
            { text: "blurry, low quality, distorted, watermark, text overlay", weight: -1 },
          ],
          cfg_scale: 7,
          width,
          height,
          steps: 30,
          style_preset: stylePreset,
        }),
      }
    );

    if (!res.ok) {
      console.error("Stability error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const base64 = data.artifacts?.[0]?.base64;
    if (!base64) return null;

    return {
      url: `data:image/png;base64,${base64}`,
      provider: "stability",
      prompt: opts.prompt,
      width,
      height,
    };
  } catch (err) {
    console.error("Stability generation failed:", err);
    return null;
  }
}

// ── Unsplash (free fallback) ──
async function getFromUnsplash(opts: GenerateOptions): Promise<GeneratedImage | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  const w = opts.width || 1024;
  const h = opts.height || 768;
  const query = encodeURIComponent(opts.prompt.split(",")[0].trim().slice(0, 100));

  if (apiKey) {
    try {
      const orientation = w > h * 1.2 ? "landscape" : h > w * 1.2 ? "portrait" : "squarish";
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=${orientation}`,
        { headers: { Authorization: `Client-ID ${apiKey}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const photo = data.results?.[0];
        if (photo) {
          return {
            url: `${photo.urls.raw}&w=${w}&h=${h}&fit=crop&auto=format&q=80`,
            provider: "unsplash",
            prompt: opts.prompt,
            width: w,
            height: h,
          };
        }
      }
    } catch { /* fall through */ }
  }

  // No API key fallback
  return {
    url: `https://source.unsplash.com/${w}x${h}/?${query}`,
    provider: "unsplash",
    prompt: opts.prompt,
    width: w,
    height: h,
  };
}

// ── Main generate function (tries providers in order) ──
export async function generateImage(opts: GenerateOptions): Promise<GeneratedImage> {
  // Try DALL-E first
  const dalle = await generateWithDallE(opts);
  if (dalle) return dalle;

  // Try Stability AI
  const stability = await generateWithStability(opts);
  if (stability) return stability;

  // Fall back to Unsplash
  const unsplash = await getFromUnsplash(opts);
  if (unsplash) return unsplash;

  // Last resort placeholder
  return {
    url: `https://picsum.photos/seed/${Date.now()}/${opts.width || 1024}/${opts.height || 768}`,
    provider: "placeholder",
    prompt: opts.prompt,
    width: opts.width || 1024,
    height: opts.height || 768,
  };
}

// ── Batch generate for a full page ──
export async function generateImagesForPage(
  prompts: Array<{ prompt: string; width?: number; height?: number; style?: GenerateOptions["style"] }>
): Promise<GeneratedImage[]> {
  // Run up to 4 in parallel to avoid rate limits
  const results: GeneratedImage[] = [];
  const batchSize = 4;

  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((p) => generateImage(p))
    );
    results.push(...batchResults);
  }

  return results;
}

// ── Analyze HTML and generate contextual image prompts ──
export function buildImagePrompts(html: string, industry: string): Array<{
  placeholder: string;
  prompt: string;
  width: number;
  height: number;
  style: GenerateOptions["style"];
}> {
  const placeholders: Array<{ url: string; width: number; height: number }> = [];

  // Match seeded picsum URLs: picsum.photos/seed/KEYWORD/WIDTH/HEIGHT
  const seededPattern = /https?:\/\/picsum\.photos\/seed\/[a-zA-Z0-9_-]+\/(\d+)(?:\/(\d+))?/g;
  let match: RegExpExecArray | null;
  while ((match = seededPattern.exec(html)) !== null) {
    const url = match[0];
    const w = parseInt(match[1]);
    const h = match[2] ? parseInt(match[2]) : w;
    if (!placeholders.find((p) => p.url === url)) {
      placeholders.push({ url, width: w, height: h });
    }
  }

  // Also match bare picsum URLs and unsplash source URLs
  const barePattern = /https?:\/\/(?:picsum\.photos|source\.unsplash\.com)\/(\d+)(?:[x/](\d+))?/g;
  while ((match = barePattern.exec(html)) !== null) {
    const url = match[0];
    const w = parseInt(match[1]);
    const h = match[2] ? parseInt(match[2]) : w;
    if (!placeholders.find((p) => p.url === url)) {
      placeholders.push({ url, width: w, height: h });
    }
  }

  // Generate contextual prompts based on position and industry
  const industryPrompts: Record<string, string[]> = {
    "real estate": [
      "Luxury modern home exterior with manicured lawn at golden hour, architectural photography",
      "Elegant living room interior with designer furniture and natural light, interior photography",
      "Modern kitchen with marble countertops and stainless steel appliances, high-end real estate",
      "Professional real estate agent in business attire smiling confidently, headshot photography",
      "Aerial view of upscale suburban neighborhood, drone photography",
      "Spacious master bedroom with king bed and panoramic windows, luxury interior",
    ],
    restaurant: [
      "Beautifully plated gourmet dish on dark slate, professional food photography",
      "Warm intimate restaurant interior with ambient lighting, fine dining atmosphere",
      "Professional chef preparing food in modern kitchen, culinary photography",
      "Fresh organic ingredients artfully arranged, farm to table concept",
      "Elegant bar area with craft cocktails, upscale dining photography",
      "Happy diners enjoying meal together, authentic restaurant experience",
    ],
    technology: [
      "Modern tech office with collaborative workspace, startup culture photography",
      "Abstract data visualization with flowing lines and nodes, technology concept",
      "Team of diverse professionals collaborating around screens, tech workplace",
      "Clean minimalist product shot of laptop on desk, tech lifestyle",
      "Server room with blue lighting and cable management, data center",
      "Person using smartphone with holographic interface concept, future tech",
    ],
    law: [
      "Impressive law office with floor-to-ceiling bookshelves, professional interior",
      "Confident attorney in tailored suit, professional headshot photography",
      "Courthouse columns and architecture, legal institution photography",
      "Business handshake in conference room, professional partnership",
      "Legal documents and gavel on mahogany desk, law firm still life",
      "Team of lawyers in boardroom meeting, corporate legal team",
    ],
    medical: [
      "Modern medical facility with clean white interior, healthcare photography",
      "Friendly doctor in white coat with stethoscope, medical professional portrait",
      "Advanced medical equipment in bright examination room, healthcare technology",
      "Patient and doctor consultation, compassionate healthcare interaction",
      "Modern hospital lobby with natural light, medical facility interior",
      "Medical team in scrubs walking through corridor, healthcare teamwork",
    ],
    fitness: [
      "Modern gym interior with premium equipment, fitness facility photography",
      "Athletic person performing dynamic exercise, fitness action photography",
      "Yoga class in bright sunlit studio, wellness photography",
      "Personal trainer coaching client, fitness motivation",
      "Healthy meal prep with colorful ingredients, nutrition photography",
      "Group fitness class with energetic atmosphere, gym community",
    ],
    transportation: [
      "Modern shuttle bus or passenger van on the road, professional transportation photography",
      "Airport shuttle service picking up passengers, travel transportation",
      "Professional driver in uniform opening vehicle door, chauffeur service",
      "Fleet of clean shuttle vans parked in a row, transportation company",
      "Happy passengers boarding a shuttle van, ride service photography",
      "Scenic highway with transportation vehicle, professional travel service",
    ],
    shuttle: [
      "Airport shuttle van at terminal pickup area, transportation service photography",
      "Comfortable shuttle interior with passenger seats, ride service",
      "Professional shuttle driver assisting passengers with luggage, chauffeur service",
      "Modern passenger van fleet, shuttle transportation company",
      "City shuttle bus at a stop, urban transportation service",
      "Family boarding a shuttle van for travel, transportation photography",
    ],
    taxi: [
      "Professional ride service vehicle on city street, taxi photography",
      "Chauffeur opening car door for passenger, premium ride service",
      "Modern taxi fleet in urban setting, transportation company",
      "Passenger hailing a ride on a city street, taxi service",
      "Clean luxury sedan for private car service, chauffeur photography",
      "Airport pickup area with ride service vehicles, transportation",
    ],
    logistics: [
      "Fleet of delivery trucks at loading dock, logistics photography",
      "Modern warehouse with organized inventory, supply chain",
      "Cargo containers at shipping port, freight transportation",
      "Delivery driver scanning packages, logistics service",
      "Aerial view of distribution center, supply chain photography",
      "Semi truck on highway at sunset, freight transportation",
    ],
    default: [
      "Professional team meeting in modern office, corporate photography",
      "Abstract geometric shapes with gradient colors, modern design concept",
      "Person working on laptop in contemporary workspace, business lifestyle",
      "Confident business professional portrait, corporate headshot",
      "Modern office building exterior with glass facade, architecture photography",
      "Creative workspace with design tools and inspiration, professional environment",
    ],
  };

  const industryKey = Object.keys(industryPrompts).find((k) =>
    industry.toLowerCase().includes(k)
  ) || "default";
  const prompts = industryPrompts[industryKey];

  return placeholders.map((p, i) => ({
    placeholder: p.url,
    prompt: prompts[i % prompts.length],
    width: p.width,
    height: p.height,
    style: "photo" as const,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW PIPELINE — Replicate 4-model fallback chain (Bible Law 9)
// Self-contained: Replicate runner copied inline from src/lib/ai-twins.ts.
// Exported as `generateImagePipeline` to avoid colliding with legacy export.
// ─────────────────────────────────────────────────────────────────────────────

export interface ImageGenRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  numImages?: number;
  style?: "photo" | "illustration" | "logo" | "icon" | "anime" | "3d";
  seed?: number;
}

export interface ImageGenResult {
  images: string[];
  cost: number;
  model: string;
  durationMs: number;
  steps: string[];
}

export type ImageProgressFn = (s: { step: string; message: string }) => void;

interface ImageModelEntry {
  slug: string;
  costPerImage: number;
  buildInput: (req: Required<ImageGenRequest>) => Record<string, unknown>;
}

const PIPELINE_STYLE_HINTS: Record<NonNullable<ImageGenRequest["style"]>, string> = {
  photo: "Photorealistic, 8k, professional photography, cinematic lighting, sharp focus",
  illustration: "Digital illustration, vibrant colors, detailed, artstation",
  logo: "Vector logo, minimalist, flat design, white background, centered",
  icon: "Simple icon, line art, monochrome, minimal, pictogram",
  anime: "Anime style, vibrant, detailed, studio quality",
  "3d": "3D render, octane, ray-traced, high detail, professional",
};

const DEFAULT_NEGATIVE_PROMPT =
  "blurry, low quality, watermark, text artifacts, deformed";

export const PIPELINE_MODELS: ImageModelEntry[] = [
  {
    slug: "black-forest-labs/flux-schnell",
    costPerImage: 0.003,
    buildInput: (r) => {
      const input: Record<string, unknown> = {
        prompt: r.prompt,
        width: r.width,
        height: r.height,
        num_outputs: r.numImages,
        num_inference_steps: Math.min(Math.max(r.steps, 1), 4),
        aspect_ratio: "custom",
        output_format: "webp",
        output_quality: 90,
      };
      if (r.seed >= 0) input.seed = r.seed;
      return input;
    },
  },
  {
    slug: "black-forest-labs/flux-dev",
    costPerImage: 0.025,
    buildInput: (r) => {
      const input: Record<string, unknown> = {
        prompt: r.prompt,
        width: r.width,
        height: r.height,
        num_outputs: r.numImages,
        num_inference_steps: Math.max(r.steps, 28),
        guidance: 3.5,
        output_format: "webp",
        output_quality: 90,
      };
      if (r.seed >= 0) input.seed = r.seed;
      return input;
    },
  },
  {
    slug: "stability-ai/sdxl",
    costPerImage: 0.0095,
    buildInput: (r) => {
      const input: Record<string, unknown> = {
        prompt: r.prompt,
        negative_prompt: r.negativePrompt,
        width: r.width,
        height: r.height,
        num_outputs: r.numImages,
        num_inference_steps: Math.max(r.steps, 25),
        guidance_scale: 7.5,
        scheduler: "K_EULER",
      };
      if (r.seed >= 0) input.seed = r.seed;
      return input;
    },
  },
  {
    slug: "bytedance/sdxl-lightning-4step",
    costPerImage: 0.005,
    buildInput: (r) => {
      const input: Record<string, unknown> = {
        prompt: r.prompt,
        negative_prompt: r.negativePrompt,
        width: r.width,
        height: r.height,
        num_outputs: r.numImages,
        num_inference_steps: 4,
        guidance_scale: 0,
        scheduler: "K_EULER",
      };
      if (r.seed >= 0) input.seed = r.seed;
      return input;
    },
  },
];

function getReplicateTokenForPipeline(): string {
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

export function isImageGenAvailable(): boolean {
  return Boolean(
    process.env.REPLICATE_API_TOKEN ||
      process.env.REPLICATE_API_KEY ||
      process.env.REPLICATE_TOKEN ||
      process.env.REPLICATE_KEY
  );
}

interface PipelineReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: unknown;
  error?: string | null;
  urls?: { get?: string };
}

async function runPipelineReplicateModel(
  modelSlug: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const token = getReplicateTokenForPipeline();
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

  let pred = (await createRes.json()) as PipelineReplicatePrediction;
  const start = Date.now();
  const timeoutMs = 5 * 60 * 1000;

  while (
    pred.status !== "succeeded" &&
    pred.status !== "failed" &&
    pred.status !== "canceled"
  ) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Replicate ${modelSlug} timed out after 5 minutes`);
    }
    await new Promise((r) => setTimeout(r, 1500));
    const pollUrl =
      pred.urls?.get || `https://api.replicate.com/v1/predictions/${pred.id}`;
    const pollRes = await fetch(pollUrl, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!pollRes.ok) {
      throw new Error(`Replicate poll failed (${pollRes.status})`);
    }
    pred = (await pollRes.json()) as PipelineReplicatePrediction;
  }

  if (pred.status !== "succeeded") {
    throw new Error(
      `Replicate ${modelSlug} ${pred.status}: ${pred.error || "unknown error"}`
    );
  }
  return pred.output;
}

function extractPipelineUrls(output: unknown): string[] {
  if (typeof output === "string") return [output];
  if (Array.isArray(output)) {
    const urls: string[] = [];
    for (const item of output) {
      if (typeof item === "string") urls.push(item);
    }
    if (urls.length > 0) return urls;
  }
  if (output && typeof output === "object") {
    const o = output as Record<string, unknown>;
    for (const key of ["images", "image", "output", "url"]) {
      const v = o[key];
      if (typeof v === "string") return [v];
      if (Array.isArray(v)) {
        const urls = v.filter((x): x is string => typeof x === "string");
        if (urls.length > 0) return urls;
      }
    }
  }
  throw new Error(
    `Could not extract image URLs from output: ${JSON.stringify(output).slice(0, 200)}`
  );
}

function buildPipelinePrompt(req: ImageGenRequest): string {
  const base = req.prompt.trim();
  if (!req.style) return base;
  const hint = PIPELINE_STYLE_HINTS[req.style];
  return `${hint}. ${base}`;
}

/**
 * New pipeline: 4-model fallback chain via Replicate.
 * Exported as `generateImagePipeline` (not `generateImage`) to avoid
 * colliding with the legacy multi-provider export above.
 */
export async function generateImagePipeline(
  req: ImageGenRequest,
  onProgress?: ImageProgressFn
): Promise<ImageGenResult> {
  if (!req.prompt || !req.prompt.trim()) {
    throw new Error("prompt is required");
  }
  if (!isImageGenAvailable()) {
    throw new Error(
      "Image generation unavailable. Set REPLICATE_API_TOKEN in your environment (Vercel → Settings → Environment Variables)."
    );
  }

  const normalised: Required<ImageGenRequest> = {
    prompt: buildPipelinePrompt(req),
    negativePrompt: req.negativePrompt || DEFAULT_NEGATIVE_PROMPT,
    width: req.width ?? 1024,
    height: req.height ?? 1024,
    steps: req.steps ?? 4,
    numImages: Math.min(Math.max(req.numImages ?? 1, 1), 4),
    style: req.style ?? "photo",
    seed: req.seed ?? -1,
  };

  const stepsLog: string[] = [];
  const startedAt = Date.now();
  let lastErr: Error | null = null;

  for (const model of PIPELINE_MODELS) {
    try {
      stepsLog.push(`try:${model.slug}`);
      onProgress?.({ step: model.slug, message: `Generating with ${model.slug}...` });
      const input = model.buildInput(normalised);
      const output = await runPipelineReplicateModel(model.slug, input);
      const images = extractPipelineUrls(output);
      stepsLog.push(`ok:${model.slug}:${images.length}`);
      return {
        images,
        cost: model.costPerImage * images.length,
        model: model.slug,
        durationMs: Date.now() - startedAt,
        steps: stepsLog,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stepsLog.push(`fail:${model.slug}:${msg.slice(0, 80)}`);
      console.warn(`[image-gen] ${model.slug} failed, trying next:`, msg);
      lastErr = err instanceof Error ? err : new Error(msg);
    }
  }

  throw new Error(
    `All image generation models failed — last error: ${lastErr?.message || "unknown"}`
  );
}
