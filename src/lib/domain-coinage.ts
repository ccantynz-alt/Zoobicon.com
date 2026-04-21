/**
 * Domain Coinage Engine — the intellectual layer behind /api/domains/ai-search.
 *
 * Pipeline:
 *   1. Pattern inference       (Haiku)  — pick coinage patterns that fit the mission
 *   2. Candidate generation    (Sonnet) — produce 20-30 names following those patterns
 *   3. Trademark pre-filter    (local)  — block obvious collisions with major brands
 *   4. Linguistic pre-filter   (Haiku)  — block negative meanings across 16 languages
 *   5. Scoring + shortlisting  (local)  — rank by pattern fit + phonetic feel + length
 *
 * TLD availability is handled by the orchestrator route using checkWithFallback().
 */

// ---------------------------------------------------------------------------
// Coinage Patterns — the intellectual DNA of the generator
// ---------------------------------------------------------------------------

export type CoinagePatternId =
  | "portmanteau"
  | "neo-classical-root"
  | "elided-suffix"
  | "phonetic-symbolic"
  | "vowel-compression"
  | "compound-morpheme"
  | "mythic-reference"
  | "invented-phoneme"
  | "matrix-cell"
  | "latin-micro";

export interface CoinagePattern {
  id: CoinagePatternId;
  label: string;
  description: string;
  reference: string;
  tonality: "short-plosive" | "flowing-liquid" | "hard-tech" | "editorial-soft";
}

export const COINAGE_PATTERNS: CoinagePattern[] = [
  {
    id: "portmanteau",
    label: "Portmanteau",
    description: "Blend two meaningful roots into a single word. Cut each root at a phonetic hinge and fuse.",
    reference: "Instagram (instant+telegram), Pinterest (pin+interest), Groupon (group+coupon)",
    tonality: "short-plosive",
  },
  {
    id: "neo-classical-root",
    label: "Neo-classical Root",
    description: "Borrow a Greek or Latin root with strong meaning, pair with a short modern suffix (-ly, -io, -ex, -ar).",
    reference: "Acuity, Clarius, Veritex, Lumio, Stratis, Vertex",
    tonality: "editorial-soft",
  },
  {
    id: "elided-suffix",
    label: "Elided Suffix",
    description: "Take a recognised English root and drop the ending to create a clipped, modern form.",
    reference: "Prim (primary), Intel (intelligence), Verv (verve), Lev (leverage)",
    tonality: "short-plosive",
  },
  {
    id: "phonetic-symbolic",
    label: "Phonetic-Symbolic",
    description: "Build a word whose sound directly mirrors its meaning — plosives for speed, liquids for flow.",
    reference: "Zap, Bolt, Lume, Flo, Gusto, Zuma",
    tonality: "short-plosive",
  },
  {
    id: "vowel-compression",
    label: "Vowel Compression",
    description: "Take an ordinary word and compress its vowels: drop, double, or substitute for visual density.",
    reference: "Tumblr, Flickr, Scribd, Grindr, Lyft",
    tonality: "hard-tech",
  },
  {
    id: "compound-morpheme",
    label: "Compound Morpheme",
    description: "Join two short morphemes where each half carries meaning independently of the whole.",
    reference: "Dropbox, Airbnb, Shopify, Stripe, Figma",
    tonality: "hard-tech",
  },
  {
    id: "mythic-reference",
    label: "Mythic Reference",
    description: "Re-point a mythological or astronomical name that carries latent brand meaning for modern ears.",
    reference: "Nike, Amazon, Hermes, Atlas, Nova, Orion",
    tonality: "editorial-soft",
  },
  {
    id: "invented-phoneme",
    label: "Invented Phoneme",
    description: "Coin a pure phoneme sequence with no prior meaning. Must be pronounceable in English and neutral in major languages.",
    reference: "Xerox, Kodak, Häagen-Dazs, Etsy, Zynga",
    tonality: "hard-tech",
  },
  {
    id: "matrix-cell",
    label: "Matrix Cell",
    description: "Pair a technical domain noun with an action verb cell: compute, mesh, core, node, stack, fabric, forge, edge.",
    reference: "Databricks, Snowflake, Fastly, Cloudflare, Vercel",
    tonality: "hard-tech",
  },
  {
    id: "latin-micro",
    label: "Latin Micro",
    description: "Use a single Latin word of 4-6 letters whose literal meaning anchors the brand metaphor.",
    reference: "Vivo, Lumen, Arbor, Sigil, Vela, Aero",
    tonality: "editorial-soft",
  },
];

// ---------------------------------------------------------------------------
// Trademark Blocklist — obvious collisions with household brands
// ---------------------------------------------------------------------------

/**
 * Hardcoded brand collision list. A candidate is flagged if:
 *  - it exactly matches a blocklist entry
 *  - it is a substring of a blocklist entry of length >= 5
 *  - a blocklist entry is a substring of it with length >= 5
 *
 * This is a conservative pre-filter. The real USPTO/EUIPO search happens
 * downstream of whatever the customer actually wants to register.
 */
export const TRADEMARK_BLOCKLIST = [
  // Tech giants
  "google", "apple", "amazon", "meta", "facebook", "microsoft", "netflix", "nvidia",
  "tesla", "oracle", "ibm", "intel", "adobe", "salesforce", "cisco", "samsung",
  "sony", "xerox", "kodak", "canon", "nikon", "panasonic", "lg", "huawei", "xiaomi",
  // AI / dev tools
  "openai", "anthropic", "claude", "gemini", "chatgpt", "gpt", "copilot", "perplexity",
  "lovable", "bolt", "vercel", "netlify", "cloudflare", "railway", "supabase",
  "firebase", "mongodb", "postgres", "redis", "kafka", "elastic", "databricks",
  "snowflake", "stripe", "plaid", "twilio", "sendgrid", "mailgun", "auth0", "okta",
  "cursor", "github", "gitlab", "bitbucket", "figma", "framer", "canva", "notion",
  "linear", "asana", "monday", "clickup", "airtable", "slack", "discord", "zoom",
  "loom", "miro", "mural", "confluence", "jira", "trello", "atlassian",
  // Cloud / infra
  "aws", "azure", "gcp", "digitalocean", "linode", "heroku", "fastly", "akamai",
  "cloudfront", "lambda", "kubernetes", "docker", "terraform", "ansible", "jenkins",
  // Consumer
  "spotify", "airbnb", "uber", "lyft", "doordash", "instacart", "shopify", "etsy",
  "ebay", "paypal", "venmo", "cashapp", "robinhood", "coinbase", "binance", "kraken",
  "pinterest", "instagram", "tiktok", "snapchat", "whatsapp", "telegram", "signal",
  "twitter", "threads", "reddit", "tumblr", "youtube", "twitch", "vimeo",
  // Auto / industrial
  "ford", "toyota", "honda", "bmw", "mercedes", "audi", "volkswagen", "porsche",
  "ferrari", "lamborghini", "boeing", "airbus", "spacex", "rivian", "lucid",
  // Finance / legacy
  "goldman", "morgan", "chase", "citibank", "barclays", "hsbc", "visa", "mastercard",
  "amex", "discover", "bloomberg", "reuters", "nasdaq",
  // Retail / food
  "walmart", "target", "costco", "starbucks", "mcdonalds", "kfc", "pepsi", "coca",
  "nike", "adidas", "puma", "lululemon", "gucci", "prada", "louis", "hermes",
  // Telecom / media
  "verizon", "att", "tmobile", "vodafone", "comcast", "disney", "pixar", "warner",
  "universal", "paramount", "cnn", "bbc", "nytimes", "wsj",
  // Gaming
  "nintendo", "playstation", "xbox", "steam", "epic", "roblox", "fortnite", "minecraft",
];

export interface TrademarkFlag {
  candidate: string;
  collision: string;
  type: "exact" | "substring-of" | "contains";
}

export function trademarkPreFilter(candidates: string[]): {
  survivors: string[];
  flagged: TrademarkFlag[];
} {
  const survivors: string[] = [];
  const flagged: TrademarkFlag[] = [];

  for (const raw of candidates) {
    const c = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!c) continue;

    let collision: TrademarkFlag | null = null;

    for (const brand of TRADEMARK_BLOCKLIST) {
      if (c === brand) {
        collision = { candidate: raw, collision: brand, type: "exact" };
        break;
      }
      if (c.length >= 5 && brand.length >= 5) {
        if (brand.includes(c)) {
          collision = { candidate: raw, collision: brand, type: "substring-of" };
          break;
        }
        if (c.includes(brand)) {
          collision = { candidate: raw, collision: brand, type: "contains" };
          break;
        }
      }
    }

    if (collision) flagged.push(collision);
    else survivors.push(raw);
  }

  return { survivors, flagged };
}

// ---------------------------------------------------------------------------
// Linguistic Pre-filter — hardcoded fast path + LLM deep pass
// ---------------------------------------------------------------------------

/**
 * Obvious English negatives we never want to ship, regardless of what
 * the LLM generates. Keep this lowercase and alphanumeric.
 */
const ENGLISH_NEGATIVE_STEMS = [
  "kill", "death", "dead", "hate", "rape", "nazi", "fuck", "shit", "cunt",
  "bitch", "slut", "whore", "nigg", "fag", "dyke", "tranny", "retard",
  "suic", "murde", "abort", "porn", "sex", "anal", "tits", "boob", "dick",
  "penis", "vagi", "fail", "sick", "bad", "poor", "cheap", "ugly", "dumb",
  "scam", "fraud", "fake", "lie", "stink",
];

export function englishNegativeFilter(candidates: string[]): {
  survivors: string[];
  flagged: Array<{ candidate: string; stem: string }>;
} {
  const survivors: string[] = [];
  const flagged: Array<{ candidate: string; stem: string }> = [];

  for (const raw of candidates) {
    const c = raw.toLowerCase();
    const hit = ENGLISH_NEGATIVE_STEMS.find((s) => c.includes(s));
    if (hit) flagged.push({ candidate: raw, stem: hit });
    else survivors.push(raw);
  }

  return { survivors, flagged };
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

export function buildPatternInferencePrompt(mission: string): string {
  const patternCatalog = COINAGE_PATTERNS.map(
    (p) =>
      `  - "${p.id}" (${p.label}, ${p.tonality}): ${p.description} Reference: ${p.reference}`,
  ).join("\n");

  return `You are a brand linguist. Read the mission below, then choose the THREE coinage patterns from the catalog that best fit this mission's ambition, tonality, and market.

Mission:
"""
${mission.slice(0, 800)}
"""

Catalog:
${patternCatalog}

Also extract:
- 3 to 6 semantic themes the brand must evoke (e.g. "edge", "velocity", "unified compute", "autonomous")
- a single phonetic target for the names, chosen from: "short-plosive", "flowing-liquid", "hard-tech", "editorial-soft"

Output ONLY a JSON object matching this exact shape, nothing else, no markdown fences:
{"patterns":[{"id":"<pattern-id>","rationale":"<one sentence>"},{"id":"<pattern-id>","rationale":"<one sentence>"},{"id":"<pattern-id>","rationale":"<one sentence>"}],"themes":["theme1","theme2","theme3"],"phonetic_target":"short-plosive"}`;
}

export function buildCandidateGenerationPrompt(
  mission: string,
  patterns: Array<{ id: string; label: string; description: string; reference: string }>,
  themes: string[],
  phoneticTarget: string,
  count: number,
): string {
  const patternBlock = patterns
    .map(
      (p, i) =>
        `Pattern ${i + 1} — ${p.label}\n  Technique: ${p.description}\n  Reference: ${p.reference}`,
    )
    .join("\n\n");

  return `You are a brand linguist producing candidate names for a new technology platform. Follow the coinage patterns below with precision.

Mission:
"""
${mission.slice(0, 800)}
"""

Coinage patterns to use (distribute candidates across all three):
${patternBlock}

Semantic themes the name must resonate with: ${themes.join(", ")}
Phonetic target: ${phoneticTarget}

Hard constraints on every candidate:
- 4 to 9 characters, lowercase letters only, no digits, no hyphens
- Pronounceable in English on first reading
- Must be a coinage (an invented or re-pointed word), never a plain dictionary phrase like "FastCloud" or "SmartEdge"
- Must not obviously collide with any existing major brand
- Must not contain a negative or offensive substring in English, Spanish, French, German, Italian, Portuguese, or Japanese Romaji
- Each candidate must use exactly ONE of the patterns above

Produce exactly ${count} candidates.

Output ONLY a JSON array, no markdown fences, no preamble. Each object must look like:
{"name":"Lumex","pattern":"neo-classical-root","rationale":"lumen + suffix -ex, evokes illumination at the edge","phonetic":"short-plosive"}

Start with [ and end with ]. Nothing else.`;
}

export function buildLinguisticFilterPrompt(candidates: string[]): string {
  return `You are a multilingual brand safety reviewer. For each candidate word below, determine whether it has a negative, offensive, vulgar, or unintentionally comedic meaning in any of the following languages:

English, Spanish, French, German, Italian, Portuguese, Dutch, Swedish, Norwegian, Finnish, Danish, Russian, Japanese (Romaji), Korean (Romaji), Mandarin (Pinyin), Arabic (Romaji), Hindi (Romaji), Hebrew (Romaji).

Candidates:
${candidates.map((c, i) => `${i + 1}. ${c}`).join("\n")}

For each candidate, decide one of:
- "clean" — no known issues in any of the languages above
- "warn" — sounds similar to a mildly awkward or comic word (e.g. a common noun with unfortunate resonance)
- "block" — directly matches or closely resembles a vulgar, offensive, or politically charged word

Output ONLY a JSON array of objects, one per candidate, in the SAME order as the numbered list. No markdown fences, no preamble.

Example format:
[{"name":"Lumex","verdict":"clean"},{"name":"Kaka","verdict":"block","reason":"means excrement in several languages"}]`;
}

// ---------------------------------------------------------------------------
// Scoring + shortlisting
// ---------------------------------------------------------------------------

export interface ScoredCandidate {
  name: string;
  slug: string;
  pattern: string;
  rationale: string;
  linguistic: "clean" | "warn";
  linguisticReason?: string;
  availability: Record<string, boolean | null>;
  availableTlds: string[];
  score: number;
  scoreBreakdown: Record<string, number>;
}

export function scoreCandidate(args: {
  name: string;
  pattern: string;
  rationale: string;
  phoneticTarget: string;
  phoneticActual: string;
  linguistic: "clean" | "warn";
  availability: Record<string, boolean | null>;
  priorityTlds: string[]; // ordered high to low
}): ScoredCandidate {
  const breakdown: Record<string, number> = {};
  let score = 0;

  // Length sweet spot: 4-7 chars ideal
  const len = args.name.length;
  if (len >= 4 && len <= 7) {
    breakdown.length = 12;
    score += 12;
  } else if (len === 8 || len === 9) {
    breakdown.length = 6;
    score += 6;
  } else {
    breakdown.length = 0;
  }

  // Priority TLD availability — weighted by TLD rank
  const weights = [20, 14, 10, 7];
  const availableTlds: string[] = [];
  args.priorityTlds.forEach((tld, i) => {
    const result = args.availability[tld];
    if (result === true) {
      const w = weights[i] ?? 5;
      breakdown[`tld.${tld}`] = w;
      score += w;
      availableTlds.push(tld);
    }
  });

  // Phonetic fit with inferred target
  if (args.phoneticActual === args.phoneticTarget) {
    breakdown.phonetic = 8;
    score += 8;
  }

  // Linguistic — warn costs points, block already removed upstream
  if (args.linguistic === "warn") {
    breakdown.linguistic = -4;
    score -= 4;
  }

  // No-vowel penalty (unpronounceable)
  if (!/[aeiouy]/i.test(args.name)) {
    breakdown.pronounceability = -10;
    score -= 10;
  }

  return {
    name: args.name,
    slug: args.name.toLowerCase(),
    pattern: args.pattern,
    rationale: args.rationale,
    linguistic: args.linguistic,
    availability: args.availability,
    availableTlds,
    score,
    scoreBreakdown: breakdown,
  };
}
