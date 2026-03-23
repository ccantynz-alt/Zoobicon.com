/**
 * Industry-aware image provider for generated websites.
 *
 * Strategy:
 * 1. If PEXELS_API_KEY is set → fetch real, keyword-matched photos from Pexels CDN
 * 2. Otherwise → provide detailed image description guidance so the AI uses
 *    descriptive picsum seeds (images will be random but alt text will be correct)
 *
 * Pexels is free (15K req/month), no attribution required for API usage,
 * and returns industry-relevant photos by keyword search.
 */

// ── Industry search queries ─────────────────────────────────────────────────
// Each industry has specific Pexels search queries for different sections.
// These are optimized for Pexels search relevance.

interface IndustryQueries {
  hero: string;
  features: string[];
  about: string;
  avatars: string;
}

const INDUSTRY_QUERIES: Record<string, IndustryQueries> = {
  cybersecurity: {
    hero: "cybersecurity server room",
    features: [
      "server room blue lights",
      "network cables data center",
      "code on computer screen dark",
      "data center corridor",
      "cloud computing server",
      "digital security lock",
    ],
    about: "cybersecurity team working",
    avatars: "business professional portrait",
  },
  restaurant: {
    hero: "fine dining plated food",
    features: [
      "fresh pasta dish gourmet",
      "grilled steak dinner",
      "dessert plating",
      "wine glasses restaurant table",
      "chef cooking kitchen",
      "fresh ingredients cutting board",
    ],
    about: "chef kitchen cooking",
    avatars: "person portrait smiling",
  },
  realestate: {
    hero: "luxury modern house exterior",
    features: [
      "modern living room interior",
      "spacious kitchen island",
      "master bedroom design",
      "landscaped backyard pool",
      "modern bathroom design",
      "penthouse city view",
    ],
    about: "real estate agent showing home",
    avatars: "business professional portrait",
  },
  saas: {
    hero: "team working on laptops office",
    features: [
      "code on laptop screen",
      "team meeting software",
      "cloud computing dashboard",
      "developer workspace setup",
      "analytics chart dashboard",
      "server room infrastructure",
    ],
    about: "startup team meeting",
    avatars: "professional headshot portrait",
  },
  healthcare: {
    hero: "modern medical facility",
    features: [
      "medical technology equipment",
      "doctor patient consultation",
      "laboratory research",
      "medical team hospital",
      "health app technology",
      "wellness spa treatment",
    ],
    about: "medical team doctors nurses",
    avatars: "doctor nurse portrait",
  },
  fitness: {
    hero: "modern gym equipment interior",
    features: [
      "weight training gym",
      "yoga class people",
      "gym exercise equipment",
      "group fitness class",
      "personal trainer client",
      "healthy meal nutrition",
    ],
    about: "fitness trainer gym",
    avatars: "fitness person portrait",
  },
  legal: {
    hero: "law office interior modern",
    features: [
      "law office modern",
      "legal meeting consultation",
      "law library books",
      "courthouse building",
      "contract signing business",
      "business meeting conference",
    ],
    about: "lawyer team office",
    avatars: "business professional portrait",
  },
  ecommerce: {
    hero: "online shopping experience",
    features: [
      "shopping bags retail",
      "product display store",
      "package delivery box",
      "unboxing product",
      "ecommerce analytics dashboard",
      "mobile phone shopping",
    ],
    about: "small business owner",
    avatars: "customer smiling portrait",
  },
  education: {
    hero: "modern classroom students",
    features: [
      "classroom students learning",
      "library study students",
      "online learning laptop",
      "graduation ceremony",
      "university campus",
      "science laboratory",
    ],
    about: "university campus aerial",
    avatars: "student professor portrait",
  },
  finance: {
    hero: "financial district modern office",
    features: [
      "finance office trading",
      "business meeting conference",
      "financial planning desk",
      "data analysis computer",
      "stock market charts",
      "business handshake deal",
    ],
    about: "financial advisory team",
    avatars: "business professional portrait",
  },
  photography: {
    hero: "photographer camera shooting",
    features: [
      "portrait photography session",
      "landscape photography nature",
      "wedding photography couple",
      "product photography studio",
      "event photography",
      "photography studio lights",
    ],
    about: "photographer working camera",
    avatars: "creative person portrait",
  },
  agency: {
    hero: "creative agency workspace design",
    features: [
      "design studio creative",
      "team collaboration office",
      "web development coding",
      "strategy meeting whiteboard",
      "creative brainstorming",
      "brand design mockup",
    ],
    about: "creative team meeting",
    avatars: "professional headshot portrait",
  },
  construction: {
    hero: "construction site building",
    features: [
      "construction site workers",
      "architecture building modern",
      "interior renovation work",
      "blueprint planning desk",
      "construction crane equipment",
      "completed modern building",
    ],
    about: "construction team workers",
    avatars: "construction worker portrait",
  },
};

// ── Industry keyword detection ──────────────────────────────────────────────

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  cybersecurity: ["cyber", "security", "infosec", "hacking", "firewall", "soc", "threat", "vulnerability", "penetration", "encryption"],
  restaurant: ["restaurant", "cafe", "food", "dining", "bistro", "bar", "grill", "kitchen", "chef", "catering", "bakery", "pizza", "sushi"],
  realestate: ["real estate", "realty", "property", "homes", "housing", "apartment", "condo", "mortgage", "listing", "broker"],
  saas: ["saas", "software", "app", "platform", "dashboard", "startup", "devtool", "developer tool", "api", "cloud"],
  healthcare: ["health", "medical", "clinic", "hospital", "dental", "doctor", "wellness", "therapy", "pharma", "telehealth"],
  fitness: ["fitness", "gym", "workout", "yoga", "pilates", "crossfit", "personal trainer", "athletic", "sports"],
  legal: ["law", "legal", "attorney", "lawyer", "firm", "litigation", "counsel", "barrister"],
  ecommerce: ["ecommerce", "e-commerce", "shop", "store", "retail", "product", "buy", "sell", "merchandise"],
  education: ["education", "school", "university", "course", "learning", "academy", "tutor", "training", "edtech"],
  finance: ["finance", "bank", "investment", "accounting", "insurance", "fintech", "wealth", "advisory", "trading", "crypto"],
  photography: ["photography", "photographer", "photo", "studio", "portrait", "wedding photo", "videography"],
  agency: ["agency", "marketing", "creative", "design agency", "digital agency", "advertising", "branding"],
  construction: ["construction", "building", "contractor", "renovation", "architecture", "roofing", "plumbing", "electric"],
};

/**
 * Detect industry from a user prompt.
 */
export function detectIndustry(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  let bestMatch: string | null = null;
  let bestScore = 0;

  const industries = Object.keys(INDUSTRY_KEYWORDS);
  for (let i = 0; i < industries.length; i++) {
    const industry = industries[i];
    const keywords = INDUSTRY_KEYWORDS[industry];
    let score = 0;
    for (let j = 0; j < keywords.length; j++) {
      if (lower.indexOf(keywords[j]) !== -1) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = industry;
    }
  }

  return bestMatch;
}

// ── Pexels API integration ──────────────────────────────────────────────────

interface PexelsPhoto {
  src: { original: string; large2x: string; large: string; medium: string; small: string };
  alt: string;
  photographer: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}

/**
 * Search Pexels for photos matching a query.
 * Returns CDN URLs ready for use in <img> tags.
 */
async function searchPexels(query: string, count: number = 1): Promise<Array<{ url: string; alt: string }>> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
      {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(3000), // 3s timeout — don't slow down generation
      }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as PexelsResponse;
    return data.photos.map((p) => ({
      url: p.src.large, // 940px wide, good for hero/features
      alt: p.alt || query,
    }));
  } catch {
    return []; // Silently fall back
  }
}

async function searchPexelsPortrait(query: string, count: number = 1): Promise<Array<{ url: string; alt: string }>> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=square`,
      {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as PexelsResponse;
    return data.photos.map((p) => ({
      url: p.src.small, // 130px, good for avatars
      alt: p.alt || query,
    }));
  } catch {
    return [];
  }
}

// ── Image descriptions for AI guidance (picsum fallback) ────────────────────

const INDUSTRY_IMAGE_DESCRIPTIONS: Record<string, {
  hero: string;
  features: string[];
  about: string;
  avatars: string[];
}> = {
  cybersecurity: {
    hero: "a dark server room with rows of glowing blue server racks and cable management",
    features: [
      "server room with blue LED lights illuminating rows of racks",
      "close-up of fiber optic cables with glowing data transmission",
      "green code or terminal commands scrolling on a dark monitor",
      "a long corridor of a data center with cold-aisle containment",
      "a cloud computing dashboard with network diagrams",
      "a digital padlock hologram representing encryption",
    ],
    about: "a cybersecurity team analyzing threat data on multiple monitors in a SOC",
    avatars: [
      "a professional security analyst in business attire",
      "an IT security manager with glasses",
      "a Chief Information Security Officer in a suit",
    ],
  },
  restaurant: {
    hero: "an elegantly plated gourmet dish on a white ceramic plate with garnish",
    features: [
      "fresh handmade pasta with herbs on a rustic plate",
      "a perfectly seared steak with vegetables and sauce",
      "an artisan dessert with chocolate and fruit decoration",
      "crystal wine glasses on a candlelit restaurant table",
      "a chef in whites preparing food in a professional kitchen",
      "fresh colorful ingredients arranged on a wooden cutting board",
    ],
    about: "a head chef in a clean white kitchen directing the team",
    avatars: [
      "a happy restaurant patron enjoying a meal",
      "a food critic tasting wine",
      "a sommelier holding a wine glass",
    ],
  },
  realestate: {
    hero: "a luxury modern home exterior with large windows and landscaping at twilight",
    features: [
      "a bright modern living room with floor-to-ceiling windows",
      "a spacious kitchen with marble countertops and an island",
      "a master bedroom with natural light and designer furniture",
      "a landscaped backyard with swimming pool and patio",
      "a modern bathroom with freestanding tub and glass shower",
      "a penthouse balcony overlooking a city skyline",
    ],
    about: "a real estate agent showing a property to buyers",
    avatars: [
      "a real estate agent in professional attire",
      "a couple looking at house details",
      "a homeowner with keys to their new home",
    ],
  },
  cybersecurity_default: {
    hero: "", features: [], about: "", avatars: [],
  },
};

// ── Main export: build image prompt block ───────────────────────────────────

/**
 * Fetch industry-relevant images and build an instruction block for the AI.
 *
 * If PEXELS_API_KEY is set: fetches real photos from Pexels (adds ~200ms).
 * Otherwise: provides detailed image descriptions so the AI uses appropriate
 * alt text and descriptive picsum seeds.
 */
export async function getImagePromptBlock(prompt: string): Promise<string> {
  const industry = detectIndustry(prompt);
  if (!industry) return "";

  const queries = INDUSTRY_QUERIES[industry];
  if (!queries) return "";

  // Try Pexels first
  if (process.env.PEXELS_API_KEY) {
    return await buildPexelsImageBlock(industry, queries);
  }

  // Fallback: descriptive guidance for the AI
  return buildDescriptiveImageBlock(industry, queries);
}

/**
 * Synchronous version — always returns descriptive guidance (no API calls).
 * Use this when you can't await or want zero latency.
 */
export function getImagePromptBlockSync(prompt: string): string {
  const industry = detectIndustry(prompt);
  if (!industry) return "";

  const queries = INDUSTRY_QUERIES[industry];
  if (!queries) return "";

  return buildDescriptiveImageBlock(industry, queries);
}

async function buildPexelsImageBlock(industry: string, queries: IndustryQueries): Promise<string> {
  // Fire all searches in parallel — total ~200ms
  const [heroResults, aboutResults, avatarResults, ...featureResults] = await Promise.all([
    searchPexels(queries.hero, 1),
    searchPexels(queries.about, 1),
    searchPexelsPortrait(queries.avatars, 3),
    ...queries.features.map((q) => searchPexels(q, 1)),
  ]);

  const hero = heroResults[0];
  const about = aboutResults[0];
  const avatars = avatarResults;
  const features = featureResults.map((r) => r[0]).filter(Boolean);

  if (!hero && features.length === 0) {
    // Pexels returned nothing useful — fall back to descriptions
    return buildDescriptiveImageBlock(industry, queries);
  }

  let block = `\n## CURATED IMAGES — USE THESE EXACT URLs (industry: ${industry})
These are real, high-quality stock photos from Pexels. Use them exactly as provided.

HERO IMAGE:`;
  if (hero) {
    block += `\n${hero.url} — ${hero.alt}`;
  }

  block += `\n\nFEATURE CARD IMAGES (one per card):`;
  features.forEach((img, i) => {
    if (img) block += `\n${i + 1}. ${img.url} — ${img.alt}`;
  });

  if (about) {
    block += `\n\nABOUT SECTION IMAGE:\n${about.url} — ${about.alt}`;
  }

  if (avatars.length > 0) {
    block += `\n\nTESTIMONIAL AVATARS:`;
    avatars.forEach((img, i) => {
      block += `\n${i + 1}. ${img.url} — ${img.alt}`;
    });
  }

  block += `\n\nFor any additional images, use https://picsum.photos/seed/DESCRIPTIVE-KEYWORD/WIDTH/HEIGHT with industry-specific keywords like "server-room", "data-center" (NOT generic words like "office" or "building").`;

  return block;
}

function buildDescriptiveImageBlock(industry: string, queries: IndustryQueries): string {
  // No API key — give the AI detailed guidance on what each image should depict
  let block = `\n## IMAGE GUIDANCE (industry: ${industry})
Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for ALL images.
The seed keyword MUST be specific to the industry. Examples of GOOD vs BAD seeds:

GOOD seeds for ${industry}: "${queries.hero.replace(/ /g, "-")}", "${queries.features[0].replace(/ /g, "-")}", "${queries.features[1].replace(/ /g, "-")}"
BAD seeds (too generic): "office", "building", "photo", "image", "hero"

HERO IMAGE (use seed related to: ${queries.hero}):
https://picsum.photos/seed/${queries.hero.replace(/ /g, "-")}/1400/800

FEATURE CARD IMAGES — use these seeds:`;

  queries.features.forEach((q, i) => {
    block += `\n${i + 1}. https://picsum.photos/seed/${q.replace(/ /g, "-")}/${400}/${250} — Should depict: ${q}`;
  });

  block += `\n\nABOUT SECTION IMAGE:
https://picsum.photos/seed/${queries.about.replace(/ /g, "-")}/640/480 — Should depict: ${queries.about}

TESTIMONIAL AVATARS (use unique seeds for each):
1. https://picsum.photos/seed/${industry}-person-1/80/80
2. https://picsum.photos/seed/${industry}-person-2/80/80
3. https://picsum.photos/seed/${industry}-person-3/80/80

IMPORTANT: Every image MUST have descriptive alt text matching what it should depict. Even though picsum returns random photos, the alt text must be industry-accurate for SEO and accessibility.`;

  return block;
}
