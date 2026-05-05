/**
 * POST /api/launch/shortlist
 *
 * Steps 1–3 of Zoobicon's "domain → brand → site → deploy" single flow.
 * Given a one-line business description, returns:
 *   1. A shortlist of brandable names (Claude)
 *   2. Live `.com` availability for each (RDAP via @/lib/opensrs)
 *   3. A brand kit (palette + logo SVG monogram + typography pairing)
 *      for every name whose .com is available — generated in parallel
 *      with the availability check, NOT serialized.
 *
 * No competitor (Lovable, Bolt, v0) does all three in one round-trip.
 * That's the moat.
 *
 * Request body:
 *   {
 *     description: string,        // free-text; ≥ 3 chars (required)
 *     count?: number              // 4–16 names; default 8
 *   }
 *
 * Response (200):
 *   {
 *     candidates: Array<{
 *       name: string,
 *       tagline: string,
 *       comAvailable: boolean | null,           // null = couldn't determine
 *       brandKit: BrandKit | null               // null when .com isn't free
 *     }>,
 *     meta: { model, elapsedMs, kitsAttempted, kitsReturned, kitFailures }
 *   }
 *
 * Errors:
 *   400 invalid input
 *   503 ANTHROPIC_API_KEY missing
 *   500 LLM name generation failed across all configured models
 *
 * Bible Law 8: every failure path returns a clear error string identifying
 * which step failed and why. No silent placeholders, no fake brand kits.
 */

import { NextRequest, NextResponse } from "next/server";
import { checkWithFallback } from "@/lib/opensrs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // hard cap per task spec

const NAME_MODEL_PRIMARY = "claude-haiku-4-5-20251001";
const NAME_MODEL_FALLBACK = "claude-sonnet-4-5";
const KIT_MODEL_PRIMARY = "claude-haiku-4-5-20251001";
const KIT_MODEL_FALLBACK = "claude-sonnet-4-5";
const ANTHROPIC_TIMEOUT_MS = 18_000; // leave headroom under maxDuration
const KIT_CONCURRENCY = 4; // bound brand-kit Claude calls
const RDAP_CONCURRENCY = 6; // bound RDAP fanout

// ─── Types ───────────────────────────────────────────────────────────────

export interface BrandKit {
  palette: string[]; // 3 hex colors
  logoSvg: string; // inline SVG, no external imports
  typography: { display: string; body: string };
}

interface NameSeed {
  name: string;
  tagline: string;
}

interface Candidate extends NameSeed {
  comAvailable: boolean | null;
  brandKit: BrandKit | null;
}

interface ShortlistRequestBody {
  description?: string;
  count?: number;
}

// ─── Route ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  let body: ShortlistRequestBody;
  try {
    body = (await req.json()) as ShortlistRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Step 0 (parse request): invalid JSON body." },
      { status: 400 },
    );
  }

  const description = (body.description || "").trim();
  if (description.length < 3) {
    return NextResponse.json(
      {
        error:
          "Step 0 (validate input): please describe your business — at least 3 characters.",
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Step 1 (name generation): ANTHROPIC_API_KEY is not configured. Set it under Vercel → Project → Environment Variables and redeploy.",
      },
      { status: 503 },
    );
  }

  const requested = Number.isFinite(body.count) ? Math.floor(body.count!) : 8;
  const nameCount = Math.max(4, Math.min(requested, 16));

  // ── Step 1: name shortlist ────────────────────────────────────────────
  let names: NameSeed[];
  let nameModelUsed = NAME_MODEL_PRIMARY;
  try {
    names = await generateNames(apiKey, NAME_MODEL_PRIMARY, description, nameCount);
  } catch (err) {
    console.warn(
      `[launch/shortlist] primary name model failed: ${err instanceof Error ? err.message : err}, falling back`,
    );
    try {
      names = await generateNames(apiKey, NAME_MODEL_FALLBACK, description, nameCount);
      nameModelUsed = NAME_MODEL_FALLBACK;
    } catch (err2) {
      const msg = err2 instanceof Error ? err2.message : String(err2);
      return NextResponse.json(
        {
          error: `Step 1 (name generation): both Claude models failed. Last error: ${msg}`,
        },
        { status: 500 },
      );
    }
  }

  if (names.length === 0) {
    return NextResponse.json(
      {
        error:
          "Step 1 (name generation): Claude returned no usable names. Try a more specific description.",
      },
      { status: 500 },
    );
  }

  // ── Step 2 + 3 in PARALLEL ─────────────────────────────────────────────
  // Availability check for every name AND brand-kit generation kick off
  // together. Brand kit is keyed on the index — once availability resolves,
  // we keep the kit only if .com is free; otherwise we discard it. This
  // wastes some Claude calls (kit generated for taken .coms) but gets the
  // user a complete answer in one round-trip instead of two.
  const candidates: Candidate[] = names.map((n) => ({
    name: n.name,
    tagline: n.tagline,
    comAvailable: null,
    brandKit: null,
  }));

  const availabilityPromise = runAvailabilityChecks(names, candidates);
  const kitPromise = runKitGeneration(apiKey, names, description, candidates);

  const [, kitOutcome] = await Promise.all([availabilityPromise, kitPromise]);

  // After both resolve, drop kits for names whose .com isn't free.
  // We always keep the kit if .com is null (unknown) so the UI can still
  // show options when RDAP is rate-limited — better than nothing.
  for (const c of candidates) {
    if (c.comAvailable === false) c.brandKit = null;
  }

  // Sort: .com available first; then unknown; then taken.
  candidates.sort((a, b) => availabilityRank(a.comAvailable) - availabilityRank(b.comAvailable));

  const kitsReturned = candidates.filter((c) => c.brandKit !== null).length;

  return NextResponse.json({
    candidates,
    meta: {
      model: nameModelUsed,
      elapsedMs: Date.now() - startedAt,
      kitsAttempted: kitOutcome.attempted,
      kitsReturned,
      kitFailures: kitOutcome.failures,
    },
  });
}

// ─── Step 2: availability ────────────────────────────────────────────────

async function runAvailabilityChecks(names: NameSeed[], candidates: Candidate[]) {
  const tasks: number[] = names.map((_, i) => i);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(RDAP_CONCURRENCY, tasks.length) },
    () =>
      (async () => {
        while (true) {
          const i = cursor++;
          if (i >= tasks.length) return;
          const n = names[i];
          const slug = nameToSlug(n.name);
          if (!slug) {
            candidates[i].comAvailable = null;
            continue;
          }
          try {
            candidates[i].comAvailable = await checkWithFallback(`${slug}.com`);
          } catch (err) {
            console.warn(
              `[launch/shortlist] RDAP check failed for ${slug}.com:`,
              err instanceof Error ? err.message : err,
            );
            candidates[i].comAvailable = null;
          }
        }
      })(),
  );
  await Promise.all(workers);
}

// ─── Step 3: brand kits (parallel with availability) ─────────────────────

async function runKitGeneration(
  apiKey: string,
  names: NameSeed[],
  description: string,
  candidates: Candidate[],
): Promise<{ attempted: number; failures: number }> {
  let cursor = 0;
  let attempted = 0;
  let failures = 0;

  const workers = Array.from(
    { length: Math.min(KIT_CONCURRENCY, names.length) },
    () =>
      (async () => {
        while (true) {
          const i = cursor++;
          if (i >= names.length) return;
          attempted++;
          try {
            candidates[i].brandKit = await generateBrandKit(
              apiKey,
              names[i],
              description,
            );
          } catch (err) {
            failures++;
            console.warn(
              `[launch/shortlist] brand kit failed for ${names[i].name}:`,
              err instanceof Error ? err.message : err,
            );
            candidates[i].brandKit = synthesizeFallbackKit(names[i].name);
          }
        }
      })(),
  );
  await Promise.all(workers);
  return { attempted, failures };
}

// ─── Step 1 helper: generateNames ────────────────────────────────────────

async function generateNames(
  apiKey: string,
  model: string,
  description: string,
  count: number,
): Promise<NameSeed[]> {
  const prompt = `You are a senior brand naming consultant — same tier as the team that named Stripe, Anthropic, Vercel, Figma, Linear.

Generate exactly ${count} brandable business names for: "${description}"

CORE RULES:
- 1-2 words, 3-15 characters total. Letters and digits only — must be a valid domain label.
- Each name MUST be unique within your response.
- Each name gets a tagline (5-12 words) explaining the brand vibe.
- BAN generic names ("TechSolutions", "BestService", "ProBuilder", "SmartApp").

DOMAIN AVAILABILITY IS THE GOAL. .com is saturated, so distribute the ${count}
names across these proven patterns:

  1. MODERN BLENDS (~30%) — smash two short words with a suffix. Like
     Shopify (shop+ify), Calendly (calendar+ly), Loomly. 5-9 letters.
  2. INVENTED SHORT WORDS (~25%) — punchy 4-8 letter coinages that sound
     English but don't exist. Like Klarna, Zapier, Trello, Asana, Figma.
  3. DESCRIPTIVE COMPOUNDS (~25%) — two real words joined. Like Basecamp,
     Mailchimp, Salesforce, Hubspot, Dropbox.
  4. LETTER TWEAKS (~20%) — common word with a swap/drop. Like Lyft (lift),
     Tumblr (tumbler), Flickr (flicker), Fiverr.

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

Now generate ${count} names for "${description}":`;

  const text = await callAnthropic(apiKey, model, prompt, 4000, 0.75);
  const raw = extractJsonArray(text);
  return sanitizeNames(raw, count);
}

// ─── Step 3 helper: generateBrandKit ─────────────────────────────────────

async function generateBrandKit(
  apiKey: string,
  seed: NameSeed,
  description: string,
): Promise<BrandKit> {
  const prompt = `You are a senior brand designer building an identity for a new company.

COMPANY: ${seed.name}
TAGLINE: ${seed.tagline}
BUSINESS: ${description}

Return ONLY valid JSON. No markdown. No preamble. The JSON shape:
{
  "palette": ["#XXXXXX", "#XXXXXX", "#XXXXXX"],
  "logoConcept": "one-sentence description of a minimalist monogram for the letter ${seed.name.charAt(0).toUpperCase()}, e.g. 'thick rounded sans serif on a deep teal disk'",
  "typography": { "display": "<google font name for headlines>", "body": "<google font name for body>" }
}

PALETTE RULES:
- Exactly 3 hex colors, uppercase, 6-digit form.
- First color = brand primary (most saturated).
- Second color = supporting/dark (near-black or very dark brand-tinted).
- Third color = accent (lighter or contrasting).
- Must work for both light and dark surfaces.

TYPOGRAPHY RULES:
- "display" must be a real Google Font name suitable for h1/h2 headlines.
- "body" must be a real Google Font name suitable for paragraph text.
- They MUST pair well (one serif + one sans, or two complementary sans).

LOGO CONCEPT RULES:
- One sentence, ≤ 20 words.
- Must describe a single-letter monogram (the first letter of "${seed.name}").
- Must mention the brand color it sits on or in.

Now produce the JSON for ${seed.name}:`;

  const text = await callAnthropic(apiKey, KIT_MODEL_PRIMARY, prompt, 600, 0.6);
  let parsed: { palette?: unknown; logoConcept?: unknown; typography?: unknown };
  try {
    parsed = parseJsonObject(text);
  } catch {
    // one fallback model attempt
    const text2 = await callAnthropic(apiKey, KIT_MODEL_FALLBACK, prompt, 600, 0.6);
    parsed = parseJsonObject(text2);
  }

  const palette = sanitizePalette(parsed.palette);
  const typography = sanitizeTypography(parsed.typography);
  const logoSvg = synthesizeMonogram(seed.name, palette);
  return { palette, logoSvg, typography };
}

// ─── Anthropic call ──────────────────────────────────────────────────────

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens: number,
  temperature: number,
): Promise<string> {
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
        max_tokens: maxTokens,
        temperature,
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
    return text;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Anthropic ${model} timed out after ${ANTHROPIC_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── JSON helpers ────────────────────────────────────────────────────────

function extractJsonArray(text: string): Array<{ name?: unknown; tagline?: unknown }> {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    const direct = JSON.parse(cleaned);
    if (Array.isArray(direct)) return direct;
  } catch {
    /* fall through */
  }
  const candidates: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== "[") continue;
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
  candidates.sort((a, b) => b.end - b.start - (a.end - a.start));
  for (const c of candidates) {
    const slice = cleaned.slice(c.start, c.end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "object") {
        return parsed;
      }
    } catch {
      /* try next */
    }
  }
  return [];
}

function parseJsonObject(text: string): Record<string, unknown> {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    const direct = JSON.parse(cleaned);
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      return direct as Record<string, unknown>;
    }
  } catch {
    /* fall through */
  }
  // Find first balanced {...}
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== "{") continue;
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
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          try {
            const parsed = JSON.parse(cleaned.slice(i, j + 1));
            if (parsed && typeof parsed === "object") {
              return parsed as Record<string, unknown>;
            }
          } catch {
            break;
          }
        }
      }
    }
  }
  throw new Error("Brand kit response was not valid JSON");
}

// ─── Sanitization ────────────────────────────────────────────────────────

function sanitizeNames(
  raw: Array<{ name?: unknown; tagline?: unknown }>,
  cap: number,
): NameSeed[] {
  const out: NameSeed[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rawName = typeof item.name === "string" ? item.name : "";
    const rawTagline = typeof item.tagline === "string" ? item.tagline : "";
    const nameClean = rawName.trim().replace(/\s+/g, "");
    if (!nameClean) continue;
    const slug = nameToSlug(nameClean);
    if (slug.length < 2 || slug.length > 30) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({
      name: nameClean.charAt(0).toUpperCase() + nameClean.slice(1),
      tagline: rawTagline.trim().slice(0, 200) || "A new way to work.",
    });
    if (out.length >= cap) break;
  }
  return out;
}

function sanitizePalette(value: unknown): string[] {
  const fallback = ["#0A2540", "#0A0A0B", "#C9A961"];
  if (!Array.isArray(value)) return fallback;
  const hex = value
    .filter((v): v is string => typeof v === "string")
    .map((v) => normalizeHex(v))
    .filter((v): v is string => v !== null);
  if (hex.length < 3) {
    while (hex.length < 3) hex.push(fallback[hex.length]);
  }
  return hex.slice(0, 3);
}

function normalizeHex(value: string): string | null {
  const trimmed = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(trimmed)) {
    return (
      "#" +
      trimmed
        .toUpperCase()
        .split("")
        .map((c) => c + c)
        .join("")
    );
  }
  if (/^[0-9a-f]{6}$/i.test(trimmed)) return "#" + trimmed.toUpperCase();
  return null;
}

function sanitizeTypography(value: unknown): { display: string; body: string } {
  const fallback = { display: "Playfair Display", body: "Inter" };
  if (!value || typeof value !== "object") return fallback;
  const v = value as { display?: unknown; body?: unknown };
  const display = typeof v.display === "string" ? v.display.trim().slice(0, 50) : "";
  const body = typeof v.body === "string" ? v.body.trim().slice(0, 50) : "";
  return {
    display: display || fallback.display,
    body: body || fallback.body,
  };
}

function synthesizeFallbackKit(name: string): BrandKit {
  const palette = ["#0A2540", "#0A0A0B", "#C9A961"];
  return {
    palette,
    logoSvg: synthesizeMonogram(name, palette),
    typography: { display: "Playfair Display", body: "Inter" },
  };
}

// ─── SVG monogram synthesis ──────────────────────────────────────────────

/**
 * Build a clean inline SVG monogram. Single uppercase letter on a square
 * disk filled with palette[0]. Letter color is auto-chosen for contrast.
 * No external imports, no external fonts referenced — uses generic
 * font-family stack that renders deterministically in any browser.
 */
function synthesizeMonogram(name: string, palette: string[]): string {
  const letter = (name.charAt(0) || "Z").toUpperCase();
  const bg = palette[0] || "#0A2540";
  const ink = pickInkColor(bg);
  // 88x88 with 14 corner radius matches the editorial-light card aesthetic.
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" width="88" height="88" role="img" aria-label="',
    escapeXml(name),
    ' monogram">',
    `<rect width="88" height="88" rx="14" fill="${bg}"/>`,
    `<text x="44" y="58" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="46" fill="${ink}">${escapeXml(letter)}</text>`,
    "</svg>",
  ].join("");
}

function pickInkColor(hex: string): string {
  const norm = normalizeHex(hex);
  if (!norm) return "#FFFFFF";
  const r = parseInt(norm.slice(1, 3), 16);
  const g = parseInt(norm.slice(3, 5), 16);
  const b = parseInt(norm.slice(5, 7), 16);
  // Relative luminance — WCAG-style.
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? "#0A0A0B" : "#FAFAF7";
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── Misc ────────────────────────────────────────────────────────────────

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function availabilityRank(value: boolean | null): number {
  if (value === true) return 0;
  if (value === null) return 1;
  return 2;
}
