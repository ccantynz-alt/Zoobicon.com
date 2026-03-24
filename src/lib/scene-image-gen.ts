// ---------------------------------------------------------------------------
// Scene Image Generation — AI images from storyboard scene descriptions
//
// Converts storyboard visual descriptions into images that can be used as
// input frames for video generation (image-to-video models) or as standalone
// storyboard illustrations.
//
// Providers:
//   - Replicate (Stable Diffusion XL, FLUX) — Best quality
//   - OpenAI (DALL-E 3) — Good quality, fast
//   - Stability AI — Direct API, good for batch
//
// Env vars:
//   REPLICATE_API_TOKEN    — Replicate API token
//   OPENAI_API_KEY         — OpenAI API key (shared with GPT)
//   STABILITY_API_KEY      — Stability AI API key
// ---------------------------------------------------------------------------

export type ImageProvider = "replicate" | "openai" | "stability";

export interface SceneImageRequest {
  sceneNumber: number;
  visualDescription: string;
  colorPalette: string[];
  style: string;
  platform: string;  // For aspect ratio
  textOverlay?: string;
}

export interface SceneImageResult {
  sceneNumber: number;
  imageUrl: string;
  provider: ImageProvider;
  width: number;
  height: number;
}

// Platform aspect ratios → image dimensions
const PLATFORM_DIMENSIONS: Record<string, { width: number; height: number }> = {
  tiktok: { width: 576, height: 1024 },
  "instagram-reels": { width: 576, height: 1024 },
  youtube: { width: 1024, height: 576 },
  linkedin: { width: 1024, height: 576 },
  twitter: { width: 1024, height: 1024 },
};

// Style → prompt modifiers for better image gen — these are cinematography-grade directions
const STYLE_MODIFIERS: Record<string, string> = {
  "modern-minimalist": "ultra-clean minimal composition, large negative space, single focal point, muted desaturated palette with one vibrant accent, soft even lighting, shallow depth of field, editorial photography style, shot on Hasselblad",
  "bold-dynamic": "hyper-saturated vibrant colors, extreme contrast, dramatic low-angle composition, volumetric rim lighting, dynamic diagonal lines, motion blur on edges, neon accents, cinematic color grading, shot on RED camera",
  "elegant-luxury": "luxury brand photography, dark moody background, warm golden key light, soft bokeh highlights, rich textures (marble, velvet, glass), elegant serif overlays, shallow DOF, Rembrandt lighting, shot on medium format",
  "fun-playful": "bright saturated candy colors, soft rounded forms, cheerful warm lighting, playful composition with visual rhythm, confetti/sparkle elements, slight tilt-shift effect, lifestyle photography feel, natural daylight",
  "corporate-professional": "clean corporate environment, natural window light, neutral cool palette with teal accents, structured geometric composition, sharp focus throughout, modern glass/steel textures, architectural lighting, editorial business photography",
  "cinematic": "anamorphic lens, 2.39:1 widescreen composition, atmospheric haze, dramatic chiaroscuro lighting, teal-and-orange color grade, deep blacks, film grain, practical light sources visible in frame, shallow DOF with oval bokeh, shot on ARRI Alexa",
};

// --- Provider detection ---

export function getAvailableImageProvider(): ImageProvider | null {
  if (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY) return "replicate";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.STABILITY_API_KEY) return "stability";
  return null;
}

// --- Replicate (FLUX Schnell) ---

async function generateWithReplicate(
  request: SceneImageRequest
): Promise<SceneImageResult> {
  const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
  if (!token) throw new Error("Image generation service unavailable.");

  const dims = PLATFORM_DIMENSIONS[request.platform] || PLATFORM_DIMENSIONS.youtube;
  const prompt = buildImagePrompt(request);

  // Use FLUX Schnell for speed
  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      version: "5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637", // FLUX Schnell
      input: {
        prompt,
        negative_prompt: "text, watermark, logo, blurry, low quality, distorted, deformed, ugly, bad anatomy",
        width: dims.width,
        height: dims.height,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 4,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Replicate API error: ${res.status} ${err}`);
  }

  const prediction = await res.json();

  // Poll for completion (max 60s)
  const predictionId = prediction.id;
  const startTime = Date.now();
  while (Date.now() - startTime < 60000) {
    const checkRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const checkData = await checkRes.json();

    if (checkData.status === "succeeded") {
      const imageUrl = Array.isArray(checkData.output) ? checkData.output[0] : checkData.output;
      return {
        sceneNumber: request.sceneNumber,
        imageUrl,
        provider: "replicate",
        width: dims.width,
        height: dims.height,
      };
    }
    if (checkData.status === "failed" || checkData.status === "canceled") {
      throw new Error(`Image generation failed: ${checkData.error || "unknown error"}`);
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  throw new Error("Image generation timed out after 60s");
}

// --- OpenAI (DALL-E 3) ---

async function generateWithOpenAI(
  request: SceneImageRequest
): Promise<SceneImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI service is temporarily unavailable.");

  const dims = PLATFORM_DIMENSIONS[request.platform] || PLATFORM_DIMENSIONS.youtube;
  const prompt = buildImagePrompt(request);

  // DALL-E 3 sizes: 1024x1024, 1792x1024, 1024x1792
  let size: string;
  if (dims.width > dims.height) {
    size = "1792x1024";
  } else if (dims.height > dims.width) {
    size = "1024x1792";
  } else {
    size = "1024x1024";
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      quality: "standard",
      response_format: "url",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI DALL-E API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const imageUrl = data.data[0]?.url;
  if (!imageUrl) throw new Error("No image URL in DALL-E response");

  return {
    sceneNumber: request.sceneNumber,
    imageUrl,
    provider: "openai",
    width: dims.width,
    height: dims.height,
  };
}

// --- Stability AI ---

async function generateWithStability(
  request: SceneImageRequest
): Promise<SceneImageResult> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error("Image generation service unavailable.");

  const dims = PLATFORM_DIMENSIONS[request.platform] || PLATFORM_DIMENSIONS.youtube;
  const prompt = buildImagePrompt(request);

  // Round dimensions to nearest multiple of 64 (Stability requirement)
  const width = Math.round(dims.width / 64) * 64;
  const height = Math.round(dims.height / 64) * 64;

  const res = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/sd3",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: (() => {
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("negative_prompt", "text, watermark, logo, blurry, low quality");
        formData.append("output_format", "png");
        formData.append("aspect_ratio", width > height ? "16:9" : height > width ? "9:16" : "1:1");
        return formData;
      })(),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stability API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const base64Image = data.image;
  if (!base64Image) throw new Error("No image in Stability response");

  const imageUrl = `data:image/png;base64,${base64Image}`;

  return {
    sceneNumber: request.sceneNumber,
    imageUrl,
    provider: "stability",
    width,
    height,
  };
}

// --- Unified API ---

/**
 * Generate an image for a single scene.
 */
export async function generateSceneImage(
  request: SceneImageRequest,
  provider?: ImageProvider
): Promise<SceneImageResult> {
  const activeProvider = provider || getAvailableImageProvider();
  if (!activeProvider) {
    throw new Error("Image generation is temporarily unavailable. Please try again later.");
  }

  switch (activeProvider) {
    case "replicate":
      return generateWithReplicate(request);
    case "openai":
      return generateWithOpenAI(request);
    case "stability":
      return generateWithStability(request);
  }
}

/**
 * Generate images for all scenes in a storyboard (parallel, max 3 concurrent).
 */
export async function generateAllSceneImages(
  scenes: SceneImageRequest[],
  provider?: ImageProvider
): Promise<SceneImageResult[]> {
  const results: SceneImageResult[] = [];
  const concurrency = 3;

  for (let i = 0; i < scenes.length; i += concurrency) {
    const batch = scenes.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((scene) => generateSceneImage(scene, provider))
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.error(`[scene-image-gen] Scene failed:`, result.reason);
      }
    }
  }

  return results.sort((a, b) => a.sceneNumber - b.sceneNumber);
}

// --- Helpers ---

function buildImagePrompt(request: SceneImageRequest): string {
  const styleMod = STYLE_MODIFIERS[request.style] || STYLE_MODIFIERS["modern-minimalist"];
  const colorNote = request.colorPalette.length > 0
    ? `Dominant color palette must use: ${request.colorPalette.join(", ")}. These colors should be prominent in the lighting, environment, or subject.`
    : "";

  // Build a cinematography-grade prompt
  return [
    request.visualDescription,
    styleMod,
    colorNote,
    "Ultra high quality, 8K resolution, photorealistic, professional photography, no text, no watermarks, no logos, no UI elements.",
    "The image must look like a frame from a high-budget commercial or film — not a stock photo.",
  ].filter(Boolean).join(". ");
}
