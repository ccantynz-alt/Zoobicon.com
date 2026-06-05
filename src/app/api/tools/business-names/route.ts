import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/tools/business-names
 *
 * Generates creative brandable business names with taglines using Claude.
 * Free tool — no auth required. The frontend in /domains pipes each
 * returned name into /api/domains/search to check availability.
 *
 * Request body: { description: string, industry?: string, style?: "modern"|"classic"|"playful"|"minimal", count?: number }
 * Success (200): { names: Array<{ name: string, tagline: string }> }
 * Bad input (400): { error: string }
 * Missing key (503): { error: string }
 * LLM failure (500): { error: string }
 *
 * IRONCLAD RULES (Law 8 — never show blank screens):
 * - Always returns a clear error with status code on failure (no silent fallback to garbage names)
 * - Always returns the contracted shape { names: [...] } on success
 * - Logs the model used + parsed name count for Vercel log debugging
 * - Has a 25s timeout so the client never hangs
 * - 2-model fallback chain: Haiku 4.5 → Sonnet 4.5
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PRIMARY_MODEL = "claude-haiku-4-5-20251001";
const FALLBACK_MODEL = "claude-sonnet-4-5";
const ANTHROPIC_TIMEOUT_MS = 25_000;

type GeneratedName = {
  name: string;
  tagline: string;
  /** 0–100 brandability score. Optional — if the model omits or returns garbage, sanitizeNames strips it. */
  score?: number;
  /** 2–4 short tags explaining why the name scores well ("short", "memorable", "latin root"). */
  factors?: string[];
};

interface RequestBody {
  description?: string;
  industry?: string;
  style?: string;
  count?: number;
  excludeNames?: string[];
  refinement?: string;
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body. Expected { description, style?, count? }" },
        { status: 400 },
      );
    }

    const { description, industry, style, count, excludeNames, refinement } = body;

    if (!description || typeof description !== "string" || description.trim().length < 3) {
      return NextResponse.json(
        { error: "Please describe your business (at least 3 characters)." },
        { status: 400 },
      );
    }

    const userExclusions = Array.isArray(excludeNames)
      ? excludeNames.filter((s) => typeof s === "string").map((s) => s.trim()).filter(Boolean).slice(0, 50)
      : [];
    const refinementClean = typeof refinement === "string" ? refinement.trim().slice(0, 200) : "";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error("[business-names] ANTHROPIC_API_KEY is not set in Vercel env");
      return NextResponse.json(
        {
          error:
            "Name generator unavailable: ANTHROPIC_API_KEY is not configured in Vercel environment variables. Add it under Project Settings → Environment Variables and redeploy.",
        },
        { status: 503 },
      );
    }

    const requestedCount = Number.isFinite(count as number) ? Math.floor(count as number) : 18;
    const nameCount = Math.max(1, Math.min(requestedCount, 30));

    const styleDesc = describeStyle(style);
    const industryContext = industry ? ` in the ${industry} industry` : "";
    const cleanDescription = description.trim().slice(0, 800);

    const themes = detectThemes(cleanDescription);
    const industryMatch = detectIndustry(
      industry ? `${cleanDescription} ${industry}` : cleanDescription,
    );
    const inlineExclusions = extractInlineExclusions(cleanDescription);
    const allExclusions = Array.from(
      new Set([...inlineExclusions, ...userExclusions].map((s) => s.toLowerCase())),
    ).slice(0, 60);

    const isComplex =
      cleanDescription.length > 160 ||
      cleanDescription.split(/\s+/).length > 28 ||
      allExclusions.length > 0 ||
      themes.length > 0 ||
      refinementClean.length > 0;

    const prompt = buildPrompt({
      description: cleanDescription,
      industryContext,
      styleDesc,
      nameCount,
      themes,
      exclusions: allExclusions,
      refinement: refinementClean,
    });

    // For complex prompts, Sonnet 4.5 leads (better creative reasoning, themes,
    // exclusions). For simple prompts, Haiku 4.5 leads (10x cheaper, fast).
    const primaryModel = isComplex ? FALLBACK_MODEL : PRIMARY_MODEL;
    const secondaryModel = isComplex ? PRIMARY_MODEL : FALLBACK_MODEL;

    // ---- Primary attempt ------------------------------------------------
    let rawText = "";
    let modelUsed = primaryModel;
    let lastError: string | null = null;

    try {
      rawText = await callAnthropic(apiKey, primaryModel, prompt);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(
        `[business-names] Primary model ${primaryModel} failed: ${lastError}. Falling back to ${secondaryModel}`,
      );
      // ---- Fallback ----------------------------------------------------
      try {
        rawText = await callAnthropic(apiKey, secondaryModel, prompt);
        modelUsed = secondaryModel;
      } catch (err2) {
        const fallbackError = err2 instanceof Error ? err2.message : String(err2);
        console.error(
          `[business-names] Both models failed. Primary: ${lastError}. Fallback: ${fallbackError}`,
        );
        return NextResponse.json(
          {
            error: `Name generator failed. Both Claude Haiku and Sonnet returned errors. Last error: ${fallbackError}`,
          },
          { status: 500 },
        );
      }
    }

    if (!rawText || rawText.length === 0) {
      console.error("[business-names] Empty response text from", modelUsed);
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 },
      );
    }

    // ---- Parse JSON from the response ----------------------------------
    const parsed = extractJsonArray(rawText);
    if (!parsed) {
      console.error(
        "[business-names] Failed to parse JSON array from",
        modelUsed,
        "raw text length:",
        rawText.length,
        "first 200 chars:",
        rawText.slice(0, 200),
      );
      return NextResponse.json(
        { error: "AI returned a malformed response. Please try again." },
        { status: 500 },
      );
    }

    // ---- Sanitize + dedupe + apply exclusions ---------------------------
    const sanitized = sanitizeNames(parsed, nameCount, allExclusions);

    if (sanitized.length === 0) {
      console.error(
        "[business-names] All names were filtered out as invalid. Raw count:",
        parsed.length,
        "exclusions:",
        allExclusions.length,
      );
      return NextResponse.json(
        {
          error:
            allExclusions.length > 0
              ? "AI couldn't find names that avoid your exclusions. Try removing one or rephrasing."
              : "AI returned names but none were valid. Please try a different description.",
        },
        { status: 500 },
      );
    }

    const elapsed = Date.now() - startedAt;
    console.log(
      `[business-names] OK model=${modelUsed} complex=${isComplex} themes=${themes.join("|") || "none"} exclusions=${allExclusions.length} requested=${nameCount} returned=${sanitized.length} elapsed=${elapsed}ms`,
    );

    // Attach per-name TLD recommendations so the UI can show
    // "we recommend .ai for your space" badges next to each suggestion.
    const recommendedTlds = industryMatch
      ? industryMatch.tlds
          .slice()
          .sort((a, b) => b.priority - a.priority)
          .map(({ tld, reason }) => ({ tld, reason }))
      : [];

    const namesWithTldRec = sanitized.map((n) => ({ ...n, recommendedTlds }));

    return NextResponse.json({
      names: namesWithTldRec,
      meta: {
        model: modelUsed,
        themesDetected: themes,
        industryDetected: industryMatch ? industryMatch.industry : null,
        recommendedTlds,
        exclusionsApplied: allExclusions,
        elapsedMs: elapsed,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[business-names] Unexpected error:", message);
    return NextResponse.json(
      { error: `Name generation failed: ${message}` },
      { status: 500 },
    );
  }
}

// =====================================================================
// Helpers
// =====================================================================

function describeStyle(style: string | undefined): string {
  switch (style) {
    case "classic":
      return "established, professional, trustworthy, timeless — think Goldman, Bloomberg, Penguin";
    case "playful":
      return "fun, energetic, approachable, witty — think Mailchimp, Slack, Duolingo";
    case "minimal":
      return "short, clean, one-word, modern, abstract — think Stripe, Notion, Linear";
    case "modern":
    default:
      return "modern, tech-forward, innovative, sharp — think Vercel, Figma, Anthropic";
  }
}

const THEME_LIBRARY: Array<{
  match: RegExp;
  label: string;
  guidance: string;
}> = [
  {
    match: /\b(ancient|antiquity|antique|old[- ]?world|historic(al)?)\b/i,
    label: "ancient",
    guidance:
      "Lean on antiquity. Borrow from Latin, Greek, Egyptian, Sumerian, Norse, Sanskrit, Persian, Aztec roots — emperors, gods, oracles, ruins, dynasties.",
  },
  {
    match: /\b(roman|latin|caesar|julius|augustus|imperial|empire|legion|senate)\b/i,
    label: "roman/latin",
    guidance:
      "Roman / Latin tradition: emperors, generals, gods, virtues, classical Latin words. Avoid the literal name 'Julius' — find peers like Cato, Brutus, Octavian, Trajan, Maximus, Aurelius, Lucius, Cassius, Vesper, Veritas, Imperium, Solarium, Vox.",
  },
  {
    match: /\b(greek|hellenic|olympus|olympian|athena|apollo|zeus|hermes)\b/i,
    label: "greek",
    guidance:
      "Greek mythology: gods, titans, heroes, abstract Greek nouns. Examples: Helios, Kairos, Arete, Atlas, Theseus, Selene, Hyperion.",
  },
  {
    match: /\b(norse|viking|odin|thor|valhalla|ragnarok|asgard)\b/i,
    label: "norse",
    guidance:
      "Norse mythology: gods, ravens, runes, sagas. Examples: Odin, Bragi, Hugin, Fenrir, Skadi, Saga, Mjolnir.",
  },
  {
    match: /\b(mythical|mythology|legendary|legend|gods?|deity|divine)\b/i,
    label: "mythological",
    guidance:
      "Mythological figures and divine concepts across cultures. Avoid clichés (no Phoenix, Apollo, Atlas alone — find rarer ones).",
  },
  {
    match: /\b(powerful|mighty|strong|fierce|warrior|titan|colossal|sovereign)\b/i,
    label: "powerful",
    guidance:
      "Convey strength and authority. Hard consonants (K, T, X, Z), short syllables, references to scale (Atlas, Titan, Forge, Iron, Onyx, Vex).",
  },
  {
    match: /\b(elegant|luxury|premium|refined|sophisticated|prestige)\b/i,
    label: "luxury",
    guidance:
      "Luxury feel: French/Italian phonetics, soft sibilants, words evoking craftsmanship (Maison, Atelier, Soir, Velour, Ardent).",
  },
  {
    match: /\b(voice|speak|speech|dictation|audio|sound|talk|narrat|listen)\b/i,
    label: "voice/audio",
    guidance:
      "Reference speech, sound, listening, breath. Latin/Greek roots: Vox, Loqui, Fonema, Audire, Sonus, Echo, Aural, Vocem, Cantus, Phoneme.",
  },
  {
    match: /\b(ai|artificial intelligence|machine learning|neural|gpt|llm|smart|intelligent)\b/i,
    label: "ai-native",
    guidance:
      "AI-native feel without using 'AI' in the name. Suggest cognition (Cog, Neura, Mens, Sapiens), foresight (Oracle, Augur, Vates), or computation (Compute, Lex, Cipher).",
  },
  {
    match: /\b(fast|speed|instant|quick|rapid|velocity)\b/i,
    label: "speed",
    guidance: "Convey speed: short, sharp names. Roman: Velox, Tachys, Celer, Veloce, Rapid, Bolt, Flash.",
  },
  {
    match: /\b(secure|security|safe|protect|encrypt|privacy|trust)\b/i,
    label: "security",
    guidance:
      "Security/trust: Latin Aegis, Vault, Bastion, Sigil, Castel, Fort, Sentinel, Wardens. Avoid 'Secure' / 'Safe' literals.",
  },
];

function detectThemes(description: string): string[] {
  const found: string[] = [];
  for (const { match, label } of THEME_LIBRARY) {
    if (match.test(description)) found.push(label);
  }
  return found;
}

/**
 * Industry → ranked TLD recommendation. Every name in the result gets a
 * recommendedTlds array so the UI can badge ".ai is critical for your space"
 * or ".io is the startup default". This is the kind of domain-intelligence
 * Namecheap Beast Mode and Squarespace AI ship — we match it here.
 */
const INDUSTRY_TLD_RULES: Array<{
  match: RegExp;
  industry: string;
  tlds: Array<{ tld: string; reason: string; priority: number }>;
}> = [
  {
    match: /\b(ai|artificial intelligence|machine learning|neural|llm|gpt|agent|copilot|chatbot|voice|dictation|intelligent)\b/i,
    industry: "AI / ML",
    tlds: [
      { tld: "ai", reason: "Signals AI-native — highest brand authority in your space", priority: 10 },
      { tld: "com", reason: "Universal credibility fallback", priority: 9 },
      { tld: "io", reason: "Developer-friendly alternative if .ai is taken", priority: 7 },
    ],
  },
  {
    match: /\b(saas|platform|api|developer|startup|launch|build|deploy|dev tool|cli|sdk)\b/i,
    industry: "Developer / SaaS",
    tlds: [
      { tld: "com", reason: "Gold standard for B2B SaaS", priority: 10 },
      { tld: "io", reason: "Startup / developer default", priority: 9 },
      { tld: "dev", reason: "Dev-tool authenticity", priority: 8 },
      { tld: "sh", reason: "Infrastructure / CLI vibes", priority: 6 },
    ],
  },
  {
    match: /\b(app|mobile|ios|android|phone)\b/i,
    industry: "Mobile / App",
    tlds: [
      { tld: "app", reason: "HTTPS-enforced, app-category signal", priority: 10 },
      { tld: "com", reason: "Universal credibility", priority: 9 },
      { tld: "io", reason: "Tech-forward alternative", priority: 7 },
    ],
  },
  {
    match: /\b(commerce|shop|store|retail|ecommerce|marketplace|sell|buy)\b/i,
    industry: "Commerce",
    tlds: [
      { tld: "com", reason: "The commerce gold standard — essential", priority: 10 },
      { tld: "store", reason: "Direct commerce signal", priority: 7 },
      { tld: "co", reason: "Premium commerce alternative", priority: 6 },
    ],
  },
  {
    match: /\b(agency|consult|service|freelance|studio|creative)\b/i,
    industry: "Agency / Service",
    tlds: [
      { tld: "com", reason: "Client-facing credibility", priority: 10 },
      { tld: "co", reason: "Modern agency shorthand", priority: 7 },
      { tld: "studio", reason: "Creative studio signal", priority: 6 },
    ],
  },
  {
    match: /\b(media|blog|news|magazine|publication|content)\b/i,
    industry: "Media / Publishing",
    tlds: [
      { tld: "com", reason: "Publishing default", priority: 10 },
      { tld: "news", reason: "News-category signal", priority: 7 },
      { tld: "media", reason: "Media-category signal", priority: 7 },
    ],
  },
  {
    match: /\b(hosting|server|infrastructure|cloud|backend|devops|kubernetes|docker)\b/i,
    industry: "Infrastructure",
    tlds: [
      { tld: "sh", reason: "Shell / infra authenticity", priority: 10 },
      { tld: "cloud", reason: "Explicit cloud-category signal", priority: 8 },
      { tld: "io", reason: "Infra / dev default", priority: 8 },
      { tld: "com", reason: "Enterprise credibility", priority: 7 },
    ],
  },
];

interface IndustryMatch {
  industry: string;
  tlds: Array<{ tld: string; reason: string; priority: number }>;
}

function detectIndustry(description: string): IndustryMatch | null {
  for (const rule of INDUSTRY_TLD_RULES) {
    if (rule.match.test(description)) {
      return { industry: rule.industry, tlds: rule.tlds };
    }
  }
  return null;
}

/**
 * Extract names the user said are taken / to avoid from a free-text description.
 * Catches patterns like:
 *   "Julius is already taken"
 *   "but Julius has been taken — need another"
 *   "we already tried X, Y and Z"
 *   "not Foo or Bar"
 *   "exclude Foo, Bar, Baz"
 *   "avoid Foo and Bar"
 *   "anything but Foo"
 */
function extractInlineExclusions(description: string): string[] {
  const out = new Set<string>();
  const text = description;

  const patterns: RegExp[] = [
    // "X is/has (already/been) taken"
    /\b([A-Z][a-zA-Z]{2,}|[a-z]{3,})\s+(?:is|has been|was|'s)\s+(?:already\s+)?(?:been\s+)?taken\b/g,
    // "X is unavailable / not available / gone"
    /\b([A-Z][a-zA-Z]{2,}|[a-z]{3,})\s+(?:is|are)\s+(?:already\s+)?(?:unavailable|not available|gone|registered)\b/g,
    // "exclude X, Y and Z" / "avoid X, Y" / "without X" / "anything but X"
    /(?:exclud(?:e|ing)|avoid(?:ing)?|without|except|anything but|not)\s+([A-Za-z][\w, ]{2,80})/gi,
    // "we tried X / already tried X"
    /(?:tried|tested|attempted)\s+([A-Za-z][\w, ]{2,80})/gi,
    // "no X" / "no Foo or Bar"
    /\bno\s+([A-Z][a-zA-Z]{2,}(?:\s*(?:,|or|and)\s*[A-Z][a-zA-Z]{2,}){0,5})\b/g,
  ];

  const splitWords = (chunk: string): string[] =>
    chunk
      .split(/[,\s]+|\band\b|\bor\b/i)
      .map((s) => s.trim().replace(/[^A-Za-z0-9]/g, ""))
      .filter((s) => s.length >= 3 && s.length <= 30);

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      for (const word of splitWords(m[1])) {
        // Skip pure-stopword captures
        if (/^(the|and|but|for|our|app|name|domain|something|similar|else)$/i.test(word)) continue;
        out.add(word);
      }
    }
  }

  return Array.from(out);
}

interface PromptArgs {
  description: string;
  industryContext: string;
  styleDesc: string;
  nameCount: number;
  themes: string[];
  exclusions: string[];
  refinement: string;
}

function buildPrompt(args: PromptArgs): string {
  const { description, industryContext, styleDesc, nameCount, themes, exclusions, refinement } = args;

  const themeBlock = themes.length
    ? `\nDETECTED THEMES — honor these aggressively:\n${themes
        .map((label) => {
          const def = THEME_LIBRARY.find((t) => t.label === label);
          return def ? `• ${label}: ${def.guidance}` : `• ${label}`;
        })
        .join("\n")}`
    : "";

  const exclusionBlock = exclusions.length
    ? `\nFORBIDDEN NAMES — the user explicitly told us these are taken or off-limits. DO NOT suggest these or close phonetic variants (e.g. Juliana, Julien if Julius is forbidden):\n${exclusions
        .map((e) => `• ${e}`)
        .join("\n")}`
    : "";

  const refinementBlock = refinement
    ? `\nREFINEMENT REQUEST from a previous round — apply this on top:\n"${refinement}"`
    : "";

  return `You are a senior naming consultant — same tier as the team that named Stripe, Anthropic, Vercel, Figma, Linear.

Generate exactly ${nameCount} creative, brandable business names for: "${description}"${industryContext}.

Style baseline: ${styleDesc}
${themeBlock}${exclusionBlock}${refinementBlock}

CORE RULES:
- 1-2 words, 3-15 characters total, letters and digits only (no spaces, hyphens, or punctuation — must be a valid domain label).
- Each name MUST be unique within your response.
- Each name gets a short tagline (5-12 words) that captures the brand vibe AND nods to the theme/meaning.
- NEVER suggest generic names ("TechSolutions", "BestService", "ProBuilder", "AIvoice", "SmartApp").
- NEVER reuse a forbidden name or its near-phonetic siblings.

.COM AVAILABILITY IS THE GOAL — .com is saturated after 30 years. To find
AVAILABLE .com names, use these proven patterns that real successful startups use:

DISTRIBUTE your ${nameCount} names across ALL of these patterns (roughly
even split — variety is critical):

  1. MODERN BLENDS (~30%) — smash two short English words together or blend
     fragments. 5-9 letters. Think: Shopify (shop+ify), Spotify (spot+ify),
     Calendly (calendar+ly), Grammarly (grammar+ly), Loomly (loom+ly),
     Dashly, Rentwise, Bookflip, Paystead, Calmhive, Driftway, Peakly.
     These sound professional and are usually available.
  2. INVENTED SHORT WORDS (~25%) — make up a punchy 4-8 letter word that
     SOUNDS English but doesn't exist. Like: Klarna, Zapier, Trello, Asana,
     Figma, Canva, Miro, Ravio, Breely, Tasklo, Qubly, Verato, Crafto,
     Pulsn, Hively, Workli, Boldo, Vendix. Must be easy to spell and say.
  3. DESCRIPTIVE COMPOUNDS (~25%) — two real English words joined.
     Like: Basecamp, Mailchimp, Freshbooks, Salesforce, Hubspot, Dropbox,
     Clockwork, Greenlight, Brightpath, Cleardesk, Swiftpay, Truemark,
     Goldleaf, Ironclad, Sunforge, Wildgrain. Instantly communicates value.
  4. LETTER-PLAY & TWEAKS (~20%) — take a common word and swap/drop/add a
     letter to make it unique: Lyft (lift), Tumblr (tumbler), Flickr (flicker),
     Fiverr (fiver), Grubhub, Raize (raise), Grynd (grind), Buildr,
     Brandd, Reelz, Cliqk, Staqe, Solvd, Shippr. Memorable and available.

ABSOLUTELY BANNED — DO NOT suggest any of these (all taken on .com):
Solar, Apex, Phoenix, Atlas, Nova, Lumen, Vertex, Pulse, Forge, Spark,
Edge, Flux, Sage, Echo, Lyra, Lux, Vox, Helios, Kairos, Orion, Nexus,
Zenith, Apollo, Vega, Titan, Iris, Aura, Sol, Luna, Quest, Bolt, Wave,
Core, Rise, Shift, Flow, Bloom, Craft, Swift, Bright, Clear, True, Prime,
Hub, Lab, Labs, Pro, Cloud, Pixel, Stack, Launch, Rocket.

DO NOT use obscure Latin/Greek/mythological words. Real business owners
want names they can say over the phone and their customers can spell.

CRITICAL OUTPUT FORMAT:
Output ONLY a valid JSON array. No markdown code fences. No preamble. No explanation text. No trailing commentary.
Start your response with [ and end with ]. Nothing else.

Example of the EXACT shape required:
[{"name":"Octavus","tagline":"The eighth voice — clarity from the imperial chorus","score":88,"factors":["latin root","memorable","mythic"]},{"name":"Vocem","tagline":"Latin for 'voice' — speak with authority","score":92,"factors":["short","pronounceable","unique coinage"]}]

Now generate ${nameCount} names for "${description}":`;
}

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Anthropic API ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
    };

    const text = (data.content || [])
      .filter((c) => c?.type === "text" && typeof c.text === "string")
      .map((c) => c.text)
      .join("\n")
      .trim();

    if (!text) {
      throw new Error(`Anthropic returned no text content for model ${model}`);
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Anthropic call to ${model} timed out after ${ANTHROPIC_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extract a JSON array from arbitrary Claude output. Handles:
 *  - Pure JSON `[{...}]`
 *  - JSON wrapped in ```json fences
 *  - JSON wrapped in preamble/postamble text
 *  - Nested arrays inside text (we look for the longest valid candidate)
 */
function extractJsonArray(text: string): Array<{ name?: unknown; tagline?: unknown }> | null {
  // 1. Strip common markdown code fence wrappers
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");

  // 2. Try direct parse first
  try {
    const direct = JSON.parse(cleaned);
    if (Array.isArray(direct)) return direct;
  } catch {
    // continue
  }

  // 3. Find the largest [...] block. Walk forward looking for an opening [
  //    and try to parse from each candidate, taking the LAST valid one (most
  //    likely the actual response array, not a small array inside preamble).
  const candidates: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== "[") continue;
    // Find a matching closing bracket via depth counting (with string awareness)
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = i; j < cleaned.length; j++) {
      const ch = cleaned[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) {
          candidates.push({ start: i, end: j });
          break;
        }
      }
    }
  }

  // Try candidates from largest to smallest (objects-of-objects array is bigger)
  candidates.sort((a, b) => b.end - b.start - (a.end - a.start));
  for (const cand of candidates) {
    const slice = cleaned.slice(cand.start, cand.end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
        return parsed;
      }
    } catch {
      // try next
    }
  }

  return null;
}

/**
 * Sanitize names returned by Claude:
 *  - Trim
 *  - Drop empty/missing names
 *  - Strip whitespace, force first letter cap
 *  - Ensure the slug form is a valid domain label (2-63 chars, [a-z0-9-])
 *  - Dedupe by lowercase slug
 *  - Cap to nameCount
 */
function sanitizeNames(
  raw: Array<{ name?: unknown; tagline?: unknown; score?: unknown; factors?: unknown }>,
  nameCount: number,
  exclusions: string[] = [],
): GeneratedName[] {
  const out: GeneratedName[] = [];
  const seen = new Set<string>();
  const blocked = new Set(exclusions.map((e) => e.toLowerCase().replace(/[^a-z0-9]/g, "")));

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rawName = typeof item.name === "string" ? item.name : "";
    const rawTagline = typeof item.tagline === "string" ? item.tagline : "";

    const nameClean = rawName.trim().replace(/\s+/g, "");
    if (!nameClean) continue;

    const slug = nameClean
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "")
      .slice(0, 63);

    if (slug.length < 2 || slug.length > 63) continue;
    if (seen.has(slug)) continue;

    // Hard-block exact exclusion matches AND obvious phonetic siblings
    // (sibling = slug starts with or contains the exclusion stem ≥4 chars)
    let excluded = false;
    for (const blockedSlug of blocked) {
      if (!blockedSlug) continue;
      if (slug === blockedSlug) { excluded = true; break; }
      if (blockedSlug.length >= 4 && slug.startsWith(blockedSlug)) { excluded = true; break; }
      if (blockedSlug.length >= 5 && slug.includes(blockedSlug)) { excluded = true; break; }
    }
    if (excluded) continue;

    seen.add(slug);

    const display = nameClean.charAt(0).toUpperCase() + nameClean.slice(1);

    // Score: accept 0-100 integers; if the model gives a float, floor it; if it
    // gives garbage, omit rather than fabricate. We never show "Score: 0" —
    // that misleads the user into thinking the model rated the name poorly.
    let score: number | undefined;
    if (typeof item.score === "number" && Number.isFinite(item.score)) {
      const clamped = Math.max(0, Math.min(100, Math.floor(item.score)));
      if (clamped >= 40) score = clamped; // below 40 is model noise, drop it
    }

    // Factors: accept an array of 1-4 short strings; drop anything over 40 chars
    // (if the model paragraph-dumps into a factor, we'd ruin the UI).
    let factors: string[] | undefined;
    if (Array.isArray(item.factors)) {
      const cleaned = item.factors
        .filter((f): f is string => typeof f === "string")
        .map((f) => f.trim().toLowerCase())
        .filter((f) => f.length >= 2 && f.length <= 40)
        .slice(0, 4);
      if (cleaned.length > 0) factors = cleaned;
    }

    out.push({
      name: display,
      tagline: rawTagline.trim().slice(0, 200),
      ...(score !== undefined ? { score } : {}),
      ...(factors !== undefined ? { factors } : {}),
    });

    if (out.length >= nameCount) break;
  }

  return out;
}
