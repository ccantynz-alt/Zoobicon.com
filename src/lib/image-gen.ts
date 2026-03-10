/**
 * AI Image Generation Engine
 *
 * Supports multiple providers:
 * - OpenAI DALL-E 3 (primary)
 * - Stability AI SDXL (fallback)
 * - Unsplash API (free fallback)
 *
 * Set env vars: OPENAI_API_KEY, STABILITY_API_KEY, UNSPLASH_ACCESS_KEY
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
  let match;
  while ((match = seededPattern.exec(html)) !== null) {
    const w = parseInt(match[1]);
    const h = match[2] ? parseInt(match[2]) : w;
    if (!placeholders.find((p) => p.url === match[0])) {
      placeholders.push({ url: match[0], width: w, height: h });
    }
  }

  // Also match bare picsum URLs and unsplash source URLs
  const barePattern = /https?:\/\/(?:picsum\.photos|source\.unsplash\.com)\/(\d+)(?:[x/](\d+))?/g;
  while ((match = barePattern.exec(html)) !== null) {
    const w = parseInt(match[1]);
    const h = match[2] ? parseInt(match[2]) : w;
    if (!placeholders.find((p) => p.url === match[0])) {
      placeholders.push({ url: match[0], width: w, height: h });
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
