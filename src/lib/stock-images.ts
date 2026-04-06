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

  block += `\n\nFor testimonial avatars, use https://randomuser.me/api/portraits/men/N.jpg or women/N.jpg (N=1-99). For any gallery images not listed above, use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT.`;

  return block;
}

function buildDescriptiveImageBlock(industry: string, queries: IndustryQueries): string {
  // No Pexels API key — tell the AI to use CSS effects, SVG icons, and randomuser.me
  // Do NOT provide picsum URLs here — picsum returns random unrelated photos
  const block = `\n## IMAGE GUIDANCE (industry: ${industry})
⚠️ No stock photo API is configured. Do NOT use picsum.photos — it returns random unrelated images.

HERO SECTION — use CSS background effects:
- For TECH/SAAS/CYBER: Use the .hero-aurora or .hero-mesh CSS class for an animated gradient background. Add a large centered SVG icon (80-120px, stroke="currentColor") representing the industry.
- For RESTAURANT/REALESTATE/PHOTOGRAPHY: Use a CSS gradient background with brand colors (e.g. linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))).
- Do NOT use any external image URL for the hero.

FEATURE CARDS — use inline SVG icons:
${queries.features.map((q, i) => `${i + 1}. Draw an SVG icon representing: ${q}`).join("\n")}
Each card: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">...</svg>

ABOUT SECTION — use CSS gradient or pattern:
- Use a gradient background div (200-300px) with a large SVG icon. Should represent: ${queries.about}
- Do NOT use picsum or any random image URL.

TESTIMONIAL AVATARS — use randomuser.me (real face photos):
1. https://randomuser.me/api/portraits/men/32.jpg
2. https://randomuser.me/api/portraits/women/44.jpg
3. https://randomuser.me/api/portraits/men/67.jpg
Style: width:60px; height:60px; border-radius:50%; object-fit:cover;

GALLERY/PORTFOLIO — only section where external images are acceptable:
Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with industry-specific keywords here ONLY.`;

  return block;
}

// ── Post-processing: replace picsum URLs in generated HTML ────────────────

// Curated Unsplash photo IDs by industry
const INDUSTRY_PHOTOS: Record<string, string[]> = {
  cybersecurity: [
    "photo-1550751827-4bd374c3f58b",
    "photo-1558494949-ef010cbdcc31",
    "photo-1526374965328-7f61d4dc18c5",
    "photo-1563986768609-322da13575f2",
    "photo-1555949963-ff9fe0c870eb",
    "photo-1551808525-51a94da548ce",
    "photo-1544197150-b99a580bb7a8",
    "photo-1504639725590-34d0984388bd",
  ],
  restaurant: [
    "photo-1414235077428-338989a2e8c0",
    "photo-1504674900247-0877df9cc836",
    "photo-1555396273-367ea4eb4db5",
    "photo-1517248135467-4c7edcad34c4",
    "photo-1551218808-94e220e084d2",
    "photo-1466978913421-dad2ebd01d17",
    "photo-1559339352-11d035aa65de",
    "photo-1560512823-829485b8bf24",
  ],
  realestate: [
    "photo-1600596542815-ffad4c1539a9",
    "photo-1600607687939-ce8a6c25118c",
    "photo-1600566753376-12c8ab7fb75b",
    "photo-1600585154340-be6161a56a0c",
    "photo-1613490493576-7fde63acd811",
    "photo-1560448204-e02f11c3d0e2",
    "photo-1600047509807-ba8f99d2cdde",
    "photo-1560185893-a55cbc8c57e8",
  ],
  saas: [
    "photo-1531482615713-2afd69097998",
    "photo-1522071820081-009f0129c71c",
    "photo-1460925895917-afdab827c52f",
    "photo-1553877522-43269d4ea984",
    "photo-1552664730-d307ca884978",
    "photo-1519389950473-47ba0277781c",
    "photo-1551434678-e076c223a692",
    "photo-1498050108023-c5249f4df085",
  ],
  healthcare: [
    "photo-1519494026892-80bbd2d6fd0d",
    "photo-1576091160550-2173dba999ef",
    "photo-1579684385127-1ef15d508118",
    "photo-1631217868264-e5b90bb7e133",
    "photo-1538108149393-fbbd81895907",
    "photo-1559839734-2b71ea197ec2",
    "photo-1551076805-e1869033e561",
    "photo-1582750433449-648ed127bb54",
  ],
  fitness: [
    "photo-1534438327276-14e5300c3a48",
    "photo-1571019613454-1cb2f99b2d8b",
    "photo-1517836357463-d25dfeac3438",
    "photo-1540497077202-7c8a3999166f",
    "photo-1571019614242-c5c5dee9f50b",
    "photo-1576678927484-cc907957088c",
    "photo-1549060279-7e168fcee0c2",
    "photo-1518611012118-696072aa579a",
  ],
  legal: [
    "photo-1589829545856-d10d557cf95f",
    "photo-1521587760476-6c12a4b040da",
    "photo-1507679799987-c73779587ccf",
    "photo-1450101499163-c8848c66ca85",
    "photo-1575505586569-646b2ca898fc",
    "photo-1453945619913-79ec89a82c51",
    "photo-1497366216548-37526070297c",
    "photo-1606857521015-7f9fcf423740",
  ],
  ecommerce: [
    "photo-1556742049-0cfed4f6a45d",
    "photo-1441986300917-64674bd600d8",
    "photo-1472851294608-062f824d29cc",
    "photo-1607082348824-0a96f2a4b9da",
    "photo-1556742111-a301076d9d18",
    "photo-1460925895917-afdab827c52f",
    "photo-1563013544-824ae1b704d3",
    "photo-1531303435785-3853ba035cda",
  ],
  education: [
    "photo-1523580494863-6f3031224c94",
    "photo-1524178232363-1fb2b075b655",
    "photo-1427504494785-3a9ca7044f45",
    "photo-1503676260728-1c00da094a0b",
    "photo-1509062522246-3755977927d7",
    "photo-1546410531-bb4caa6b424d",
    "photo-1488190211105-8b0e65b80b4e",
    "photo-1580582932707-520aed937b7b",
  ],
  finance: [
    "photo-1460925895917-afdab827c52f",
    "photo-1579532537598-459ecdaf39cc",
    "photo-1554224155-6726b3ff858f",
    "photo-1553729459-afe8f2e2ed65",
    "photo-1444653614773-995cb1ef9efa",
    "photo-1551836022-d5d88e9218df",
    "photo-1560472354-b33ff0c44a43",
    "photo-1611974789855-9c2a0a7236a3",
  ],
};

const DEFAULT_PHOTOS = [
  "photo-1497366216548-37526070297c",
  "photo-1522071820081-009f0129c71c",
  "photo-1531482615713-2afd69097998",
  "photo-1460925895917-afdab827c52f",
  "photo-1552664730-d307ca884978",
  "photo-1519389950473-47ba0277781c",
  "photo-1553877522-43269d4ea984",
  "photo-1498050108023-c5249f4df085",
];

/**
 * Replace all picsum.photos URLs in generated HTML with curated Unsplash photos.
 * This is the safety net — no matter what the AI outputs, images will be relevant.
 */
export function replacePicsumUrls(html: string, prompt: string): string {
  const picsumPattern = /https?:\/\/picsum\.photos\/(?:seed\/[^\/\s"']+\/)?(\d+)\/(\d+)/g;
  const matches = [...html.matchAll(picsumPattern)];
  if (matches.length === 0) return html;

  const industry = detectIndustry(prompt);
  const photos = (industry && INDUSTRY_PHOTOS[industry]) || DEFAULT_PHOTOS;

  let imgIndex = 0;
  let result = html;

  for (const match of matches) {
    const fullUrl = match[0];
    const width = parseInt(match[1]) || 800;
    const height = parseInt(match[2]) || 600;

    let replacement: string;

    if (width <= 100 && height <= 100) {
      // Small images → avatar portraits
      const gender = imgIndex % 2 === 0 ? "men" : "women";
      const num = 20 + imgIndex * 7;
      replacement = `https://randomuser.me/api/portraits/${gender}/${num}.jpg`;
    } else {
      // Larger images → curated Unsplash photos
      const photoId = photos[imgIndex % photos.length];
      replacement = `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop&q=80`;
    }

    result = result.replace(fullUrl, replacement);
    imgIndex++;
  }

  return result;
}
