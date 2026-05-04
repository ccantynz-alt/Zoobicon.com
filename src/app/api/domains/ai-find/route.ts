/**
 * POST /api/domains/ai-find
 *
 * The "AI domain finder" the platform should have shipped from day one.
 * Combines name generation + live availability + per-name pricing in a single
 * call so the UI never shows a wall of names without telling the user what
 * they can actually buy.
 *
 * Why this exists:
 *   The previous /tools/business-names endpoint generated names but did NOT
 *   check availability — the UI had to fire 12 names × 5 TLDs = 60 separate
 *   RDAP calls from the browser to figure out what was buyable. The result
 *   was the wall-of-names UX Craig flagged as "rubbish".
 *
 * Request body:
 *   {
 *     description: string,           // free-text business description (required)
 *     count?: number,                // 4–20 names; default 12
 *     tlds?: string[],               // default ["com", "ai", "io"]
 *     style?: "modern"|"classic"|"playful"|"minimal",
 *     industry?: string,
 *     excludeNames?: string[]
 *   }
 *
 * Response (200):
 *   {
 *     names: Array<{
 *       name: string,
 *       tagline: string,
 *       availability: Record<tld, { available: boolean | null, price: number, domain: string }>,
 *       buyableTlds: string[],     // shortcut: which TLDs are confirmed available
 *       recommendedTlds: Array<{ tld, reason }>
 *     }>,
 *     meta: { model, elapsedMs, exclusionsApplied, namesRequested, namesReturned }
 *   }
 *
 * Errors:
 *   400 invalid input · 503 ANTHROPIC_API_KEY missing · 500 LLM failure
 *
 * Bible Law 8: every failure path returns a clear message; we never silently
 * fall back to garbage names or generic placeholders.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkWithFallback } from "@/lib/opensrs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PRIMARY_MODEL = "claude-haiku-4-5-20251001";
const FALLBACK_MODEL = "claude-sonnet-4-5";
const ANTHROPIC_TIMEOUT_MS = 25_000;

// TLD pricing must match /api/domains/search and /domains/page.tsx.
const TLD_PRICING: Record<string, number> = {
  com: 12.99, ai: 69.99, io: 39.99, sh: 24.99, co: 29.99,
  dev: 14.99, app: 14.99, net: 13.99, org: 12.99, tech: 6.99,
  xyz: 2.99, me: 19.99, us: 9.99,
};

const DEFAULT_TLDS = ["com", "ai", "io"];
const RDAP_CONCURRENCY = 6;

interface RequestBody {
  description?: string;
  industry?: string;
  style?: string;
  count?: number;
  tlds?: string[];
  excludeNames?: string[];
}

interface AIName {
  name: string;
  tagline: string;
}

interface AvailabilityResult {
  domain: string;
  available: boolean | null;
  price: number;
}

interface EnrichedName extends AIName {
  availability: Record<string, AvailabilityResult>;
  buyableTlds: string[];
  recommendedTlds: Array<{ tld: string; reason: string }>;
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const description = (body.description || "").trim();
  if (description.length < 3) {
    return NextResponse.json(
      { error: "Please describe your business (at least 3 characters)." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI domain finder unavailable: ANTHROPIC_API_KEY is not configured. Set it under Project Settings → Environment Variables and redeploy.",
      },
      { status: 503 }
    );
  }

  const requestedCount = Number.isFinite(body.count) ? Math.floor(body.count!) : 12;
  const nameCount = Math.max(4, Math.min(requestedCount, 20));

  const requestedTlds = (Array.isArray(body.tlds) && body.tlds.length > 0 ? body.tlds : DEFAULT_TLDS)
    .map((t) => String(t).trim().toLowerCase().replace(/^\./, ""))
    .filter((t) => /^[a-z0-9]{2,}$/.test(t))
    .slice(0, 6);
  const tlds = requestedTlds.length > 0 ? Array.from(new Set(requestedTlds)) : DEFAULT_TLDS;

  const excludeNames = Array.isArray(body.excludeNames)
    ? body.excludeNames.filter((s) => typeof s === "string").map((s) => s.trim()).filter(Boolean).slice(0, 50)
    : [];

  const styleDesc = describeStyle(body.style);
  const industryHint = body.industry ? ` in the ${body.industry} industry` : "";
  const recommendedTlds = recommendTlds(`${description} ${body.industry || ""}`);

  // ── 1. Generate names ──────────────────────────────────────────────────
  let names: AIName[] = [];
  let modelUsed = PRIMARY_MODEL;
  try {
    names = await generateNames({
      apiKey,
      model: PRIMARY_MODEL,
      description,
      industryHint,
      styleDesc,
      nameCount,
      excludeNames,
    });
  } catch (err) {
    console.warn(`[ai-find] primary model failed: ${err instanceof Error ? err.message : err}, falling back`);
    try {
      names = await generateNames({
        apiKey,
        model: FALLBACK_MODEL,
        description,
        industryHint,
        styleDesc,
        nameCount,
        excludeNames,
      });
      modelUsed = FALLBACK_MODEL;
    } catch (err2) {
      const msg = err2 instanceof Error ? err2.message : String(err2);
      console.error(`[ai-find] both models failed: ${msg}`);
      return NextResponse.json(
        { error: `Name generator failed across both Claude models. Last error: ${msg}` },
        { status: 500 }
      );
    }
  }

  if (names.length === 0) {
    return NextResponse.json(
      { error: "AI returned no usable names. Try a more specific description." },
      { status: 500 }
    );
  }

  // ── 2. Live availability for each name × tld ──────────────────────────
  const tasks: Array<{ nameIdx: number; tld: string; domain: string }> = [];
  names.forEach((n, idx) => {
    const slug = n.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!slug) return;
    for (const tld of tlds) {
      tasks.push({ nameIdx: idx, tld, domain: `${slug}.${tld}` });
    }
  });

  const enriched: EnrichedName[] = names.map((n) => ({
    name: n.name,
    tagline: n.tagline,
    availability: Object.fromEntries(
      tlds.map((tld) => {
        const slug = n.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return [
          tld,
          { domain: `${slug}.${tld}`, available: null as boolean | null, price: TLD_PRICING[tld] || 14.99 },
        ];
      })
    ),
    buyableTlds: [],
    recommendedTlds,
  }));

  // Bounded-concurrency worker pool — RDAP rate-limits aggressively, so
  // unlimited parallelism would cause every check to come back null.
  let cursor = 0;
  const workers = Array.from({ length: Math.min(RDAP_CONCURRENCY, tasks.length) }, () =>
    (async () => {
      while (true) {
        const i = cursor++;
        if (i >= tasks.length) return;
        const { nameIdx, tld, domain } = tasks[i];
        try {
          const available = await checkWithFallback(domain);
          enriched[nameIdx].availability[tld].available = available;
        } catch (err) {
          console.warn(`[ai-find] availability check failed for ${domain}:`, err instanceof Error ? err.message : err);
          enriched[nameIdx].availability[tld].available = null;
        }
      }
    })()
  );
  await Promise.all(workers);

  // Compute buyableTlds shortcut so the client can render "Available on .com"
  // badges without re-walking the availability map.
  for (const e of enriched) {
    e.buyableTlds = tlds.filter((tld) => e.availability[tld]?.available === true);
  }

  // Sort: names with at least one available TLD first; among those, prefer
  // ones where .com is free; then by total available count.
  enriched.sort((a, b) => {
    const aBuy = a.buyableTlds.length;
    const bBuy = b.buyableTlds.length;
    if (aBuy === 0 && bBuy > 0) return 1;
    if (bBuy === 0 && aBuy > 0) return -1;
    const aCom = a.availability.com?.available === true ? 1 : 0;
    const bCom = b.availability.com?.available === true ? 1 : 0;
    if (aCom !== bCom) return bCom - aCom;
    return bBuy - aBuy;
  });

  return NextResponse.json({
    names: enriched,
    meta: {
      model: modelUsed,
      elapsedMs: Date.now() - startedAt,
      exclusionsApplied: excludeNames,
      namesRequested: nameCount,
      namesReturned: enriched.length,
      tldsChecked: tlds,
      recommendedTlds,
    },
  });
}

// ─── helpers ──────────────────────────────────────────────────────────────

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

function recommendTlds(description: string): Array<{ tld: string; reason: string }> {
  const text = description.toLowerCase();
  if (/\b(ai|ml|llm|gpt|agent|copilot|chatbot|intelligent)\b/.test(text)) {
    return [
      { tld: "ai", reason: "Signals AI-native — strongest brand authority in your space" },
      { tld: "com", reason: "Universal credibility fallback" },
      { tld: "io", reason: "Developer-friendly alternative if .ai is taken" },
    ];
  }
  if (/\b(saas|platform|api|developer|startup|cli|sdk)\b/.test(text)) {
    return [
      { tld: "com", reason: "Gold standard for B2B SaaS" },
      { tld: "io", reason: "Startup / developer default" },
      { tld: "dev", reason: "Dev-tool authenticity" },
    ];
  }
  if (/\b(app|mobile|ios|android)\b/.test(text)) {
    return [
      { tld: "app", reason: "HTTPS-enforced, app-category signal" },
      { tld: "com", reason: "Universal credibility" },
      { tld: "io", reason: "Tech-forward alternative" },
    ];
  }
  if (/\b(infra|hosting|server|devops|cloud)\b/.test(text)) {
    return [
      { tld: "sh", reason: "Shell / infra authenticity" },
      { tld: "io", reason: "Infra / dev default" },
      { tld: "com", reason: "Enterprise credibility" },
    ];
  }
  return [
    { tld: "com", reason: "Universal credibility" },
    { tld: "ai", reason: "AI-era brand signal" },
    { tld: "io", reason: "Tech / startup default" },
  ];
}

async function generateNames(args: {
  apiKey: string;
  model: string;
  description: string;
  industryHint: string;
  styleDesc: string;
  nameCount: number;
  excludeNames: string[];
}): Promise<AIName[]> {
  const { apiKey, model, description, industryHint, styleDesc, nameCount, excludeNames } = args;

  const exclusionBlock = excludeNames.length
    ? `\nFORBIDDEN — never suggest these names or close phonetic siblings (e.g. Apexr if Apex is forbidden):\n${excludeNames.map((e) => `• ${e}`).join("\n")}\n`
    : "";

  const prompt = `You are a senior brand naming consultant — same tier as the team that named Stripe, Anthropic, Vercel, Figma, Linear.

Generate exactly ${nameCount} brandable business names for: "${description}"${industryHint}.

Style baseline: ${styleDesc}.${exclusionBlock}

CORE RULES:
- 1-2 words, 3-15 characters total. Letters and digits only — must be a valid domain label.
- Each name MUST be unique within your response.
- Each name gets a tagline (5-12 words) explaining the brand vibe.
- BAN generic names ("TechSolutions", "BestService", "ProBuilder", "SmartApp", "AIvoice").

DOMAIN AVAILABILITY IS THE GOAL. .com is saturated, so distribute the ${nameCount}
names across these proven patterns that real successful startups use:

  1. MODERN BLENDS (~30%) — smash two short words with a suffix. Like
     Shopify (shop+ify), Calendly (calendar+ly), Loomly. 5-9 letters.
  2. INVENTED SHORT WORDS (~25%) — punchy 4-8 letter coinages that sound
     English but don't exist. Like Klarna, Zapier, Trello, Asana, Figma,
     Canva, Miro, Ravio, Tasklo, Qubly.
  3. DESCRIPTIVE COMPOUNDS (~25%) — two real words joined. Like Basecamp,
     Mailchimp, Salesforce, Hubspot, Dropbox, Brightpath, Cleardesk.
  4. LETTER TWEAKS (~20%) — common word with a swap/drop. Like Lyft (lift),
     Tumblr (tumbler), Flickr (flicker), Fiverr, Grubhub, Buildr, Cliqk.

ABSOLUTELY BANNED (all taken on .com):
Solar, Apex, Phoenix, Atlas, Nova, Lumen, Vertex, Pulse, Forge, Spark, Edge,
Flux, Sage, Echo, Lyra, Vox, Helios, Kairos, Orion, Nexus, Zenith, Apollo,
Vega, Titan, Iris, Aura, Sol, Luna, Quest, Bolt, Wave, Core, Rise, Shift,
Flow, Bloom, Craft, Swift, Bright, Clear, True, Prime, Hub, Lab, Labs, Pro,
Cloud, Pixel, Stack, Launch, Rocket.

OUTPUT FORMAT — strict:
Output ONLY a JSON array. No markdown fences. No preamble. No explanation.
Start with [ and end with ].

Example shape:
[{"name":"Loomly","tagline":"Weave your team's work into one calm thread"},{"name":"Vexel","tagline":"Pixel-perfect dashboards in three clicks"}]

Now generate ${nameCount} names for "${description}":`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

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
        temperature: 0.75,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Anthropic ${model} ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
    const text = (data.content || [])
      .filter((c) => c?.type === "text" && typeof c.text === "string")
      .map((c) => c.text!)
      .join("\n")
      .trim();
    if (!text) throw new Error(`Anthropic ${model} returned no text content`);

    return sanitizeNames(extractJsonArray(text), nameCount, excludeNames);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Anthropic ${model} timed out after ${ANTHROPIC_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function extractJsonArray(text: string): Array<{ name?: unknown; tagline?: unknown }> {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    const direct = JSON.parse(cleaned);
    if (Array.isArray(direct)) return direct;
  } catch { /* fall through */ }

  // Find largest [...] block via depth counting (string-aware).
  const candidates: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== "[") continue;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = i; j < cleaned.length; j++) {
      const ch = cleaned[j];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) { candidates.push({ start: i, end: j }); break; }
      }
    }
  }
  candidates.sort((a, b) => b.end - b.start - (a.end - a.start));
  for (const c of candidates) {
    const slice = cleaned.slice(c.start, c.end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") return parsed;
    } catch { /* try next */ }
  }
  return [];
}

function sanitizeNames(
  raw: Array<{ name?: unknown; tagline?: unknown }>,
  cap: number,
  exclusions: string[]
): AIName[] {
  const out: AIName[] = [];
  const seen = new Set<string>();
  const blocked = new Set(exclusions.map((e) => e.toLowerCase().replace(/[^a-z0-9]/g, "")));

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rawName = typeof item.name === "string" ? item.name : "";
    const rawTagline = typeof item.tagline === "string" ? item.tagline : "";
    const nameClean = rawName.trim().replace(/\s+/g, "");
    if (!nameClean) continue;
    const slug = nameClean.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug.length < 2 || slug.length > 30) continue;
    if (seen.has(slug)) continue;

    let excluded = false;
    for (const b of blocked) {
      if (!b) continue;
      if (slug === b) { excluded = true; break; }
      if (b.length >= 4 && slug.startsWith(b)) { excluded = true; break; }
      if (b.length >= 5 && slug.includes(b)) { excluded = true; break; }
    }
    if (excluded) continue;

    seen.add(slug);
    out.push({
      name: nameClean.charAt(0).toUpperCase() + nameClean.slice(1),
      tagline: rawTagline.trim().slice(0, 200),
    });
    if (out.length >= cap) break;
  }
  return out;
}
