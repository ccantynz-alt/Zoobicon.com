import { NextRequest, NextResponse } from "next/server";
import { callLLMWithFailover, getAvailableProviders } from "@/lib/llm-provider";

/**
 * POST /api/launch/plan
 *
 * Rung 3 — one-prompt business launch. Takes a single natural-language
 * description of a business and returns a full launch plan the UI can
 * walk the user through: concept summary, 12 brand-name candidates
 * (mix of .com/.ai/.io/.sh), target customer, positioning statement,
 * tagline options, ranked TLDs, starter page sections, and suggested
 * email handle prefixes.
 *
 * This is the "Rung 3" entry point for the launch flow at /launch.
 * The page POSTs here first, then (after the user picks a domain)
 * POSTs to /api/launch/assemble for the consolidated launch kit.
 *
 * Contract:
 *   Request body: { prompt: string }
 *   Success 200 : LaunchPlan (shape defined below)
 *   Bad input   : 400 { error }
 *   No LLM key  : 503 { error, missingEnv: string[] }
 *   LLM failure : 500 { error }
 *
 * Law 8 — blank screens are forbidden. Every failure path returns a
 * user-readable message + status code the client can surface directly.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PRIMARY_MODEL = "claude-haiku-4-5-20251001";
const LLM_TIMEOUT_MS = 25_000;
const BRAND_NAME_COUNT = 12;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BrandNameSuggestion {
  name: string;
  tld: "com" | "ai" | "io" | "sh";
  rationale: string;
}

export interface StarterSection {
  id: "hero" | "features" | "pricing" | "about" | "contact";
  headline: string;
  subhead: string;
  bullets: string[];
}

export interface LaunchPlan {
  concept: string;
  targetCustomer: string;
  positioning: string;
  taglines: string[];
  brandNames: BrandNameSuggestion[];
  suggestedTlds: Array<{ tld: string; reason: string }>;
  starterSections: StarterSection[];
  emailPrefixes: string[];
  meta: {
    model: string;
    elapsedMs: number;
  };
}

interface RequestBody {
  prompt?: unknown;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const startedAt = Date.now();

  // --- Parse + validate body ------------------------------------------------
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected { prompt: string }." },
      { status: 400 },
    );
  }

  const promptRaw = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (promptRaw.length < 6) {
    return NextResponse.json(
      { error: "Describe your business in at least 6 characters." },
      { status: 400 },
    );
  }
  if (promptRaw.length > 1200) {
    return NextResponse.json(
      { error: "Description is too long. Keep it under 1200 characters." },
      { status: 400 },
    );
  }
  const prompt = promptRaw.slice(0, 1200);

  // --- Require at least one LLM provider ------------------------------------
  const available = getAvailableProviders();
  if (available.length === 0) {
    console.error("[launch/plan] No LLM providers configured");
    return NextResponse.json(
      {
        error:
          "Launch planner unavailable: no AI provider is configured. Set ANTHROPIC_API_KEY (preferred), OPENAI_API_KEY, or GOOGLE_AI_API_KEY in Vercel → Project Settings → Environment Variables and redeploy.",
        missingEnv: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_AI_API_KEY"],
      },
      { status: 503 },
    );
  }

  // --- Build prompt ---------------------------------------------------------
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(prompt);

  // --- Call LLM with cross-provider failover + 25s timeout ------------------
  let rawText = "";
  let modelUsed = PRIMARY_MODEL;
  try {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), LLM_TIMEOUT_MS);

    const callPromise = callLLMWithFailover(
      {
        model: PRIMARY_MODEL,
        system: systemPrompt,
        userMessage,
        maxTokens: 4000,
      },
      (_provider, fallbackModel) => {
        modelUsed = fallbackModel;
      },
    );

    // Race the LLM call against our hard 25s client-side timeout. The
    // underlying providers already have their own timeouts (60s) but we
    // enforce a tighter bound here so the /launch page never shows a
    // loading state longer than 25s.
    const raced = await Promise.race<{ text: string; model: string } | "timeout">([
      callPromise.then((r) => ({ text: r.text, model: r.model })),
      new Promise<"timeout">((resolve) =>
        setTimeout(() => {
          abort.abort();
          resolve("timeout");
        }, LLM_TIMEOUT_MS),
      ),
    ]);
    clearTimeout(timeout);

    if (raced === "timeout") {
      console.error(
        `[launch/plan] LLM call timed out after ${LLM_TIMEOUT_MS}ms model=${modelUsed}`,
      );
      return NextResponse.json(
        {
          error:
            "The AI planner took too long to respond. Please try again — usually works on the second attempt.",
        },
        { status: 504 },
      );
    }

    rawText = raced.text;
    modelUsed = raced.model;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[launch/plan] LLM call failed: ${msg}`);
    return NextResponse.json(
      { error: `Launch planner failed: ${msg}` },
      { status: 500 },
    );
  }

  if (!rawText) {
    console.error(`[launch/plan] Empty response from model=${modelUsed}`);
    return NextResponse.json(
      { error: "AI returned an empty response. Please try again." },
      { status: 500 },
    );
  }

  // --- Parse JSON (direct → bracket-matching extractor) ---------------------
  const parsed = extractJsonObject(rawText);
  if (!parsed) {
    console.error(
      `[launch/plan] Failed to parse JSON from model=${modelUsed} length=${rawText.length} head=${rawText.slice(0, 180)}`,
    );
    return NextResponse.json(
      { error: "AI returned a malformed response. Please try again." },
      { status: 500 },
    );
  }

  // --- Sanitize + normalize -------------------------------------------------
  const plan = sanitizePlan(parsed, modelUsed, Date.now() - startedAt);
  if (plan.brandNames.length === 0) {
    console.error("[launch/plan] All brand names were filtered out as invalid");
    return NextResponse.json(
      { error: "AI returned invalid brand suggestions. Please rephrase and try again." },
      { status: 500 },
    );
  }

  console.log(
    `[launch/plan] OK model=${modelUsed} names=${plan.brandNames.length} taglines=${plan.taglines.length} sections=${plan.starterSections.length} elapsed=${plan.meta.elapsedMs}ms`,
  );

  return NextResponse.json(plan);
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return `You are Zoobicon's Launch Strategist — a combined brand strategist, naming consultant, and positioning expert. You specialise in turning a one-sentence business idea into a complete launch plan.

Your output MUST be a single valid JSON object. No markdown fences. No preamble. No commentary. Start with { and end with }. Nothing else.

The JSON shape is STRICTLY:
{
  "concept": "1-2 sentence crisp summary of the business idea in plain English",
  "targetCustomer": "1 sentence describing the specific person who would buy this (role, size, pain)",
  "positioning": "1 sentence positioning statement following the pattern: For [customer], [brand] is the [category] that [unique value] unlike [alternative]",
  "taglines": ["5 distinct one-liners, 4-9 words each, punchy, no clichés"],
  "brandNames": [
    { "name": "Brandable", "tld": "com", "rationale": "short reason this name fits" },
    { "name": "Brandable", "tld": "ai", "rationale": "..." }
  ],
  "suggestedTlds": [
    { "tld": "com", "reason": "why this TLD ranks here for this business" }
  ],
  "starterSections": [
    { "id": "hero", "headline": "...", "subhead": "...", "bullets": ["3-4 supporting points"] },
    { "id": "features", "headline": "...", "subhead": "...", "bullets": ["3-5 feature names"] },
    { "id": "pricing", "headline": "...", "subhead": "...", "bullets": ["3 tier names"] },
    { "id": "about", "headline": "...", "subhead": "...", "bullets": ["2-3 credibility points"] },
    { "id": "contact", "headline": "...", "subhead": "...", "bullets": ["1-2 contact CTAs"] }
  ],
  "emailPrefixes": ["6 sensible handle prefixes like hello, support, sales, team, founders, billing"]
}

BRAND NAME RULES (critical — this is the revenue-producing part):
- Generate EXACTLY ${BRAND_NAME_COUNT} names.
- Distribute across all four TLDs: roughly 4 × .com, 3 × .ai, 3 × .io, 2 × .sh.
- Each "name" is the domain label only (no dots, no TLD, no spaces). 3-15 chars, lowercase letters + digits only, must be a valid DNS label.
- Names must be UNIQUE (both across the list and as phonetic siblings).
- AVOID: generic tech mashups (TechSolutions, ProApp, BestAI), overused roots (apex, nova, phoenix, helios, atlas, vertex, pulse, forge, lumen — all saturated on .com), and anything suggestive of a famous brand.
- PREFER: invented coinages (Vexion, Lumeris), two-root compounds (AurumVox, CelerMens), rare mythological deep cuts, Latin abstract nouns, letter-mutated classics (Julius → Julix).
- Match the tld to vibe: .ai for AI-native, .io for dev/infra, .sh for shell/infra, .com for consumer/B2B.

TLD RANKING RULES:
- suggestedTlds is ranked HIGHEST FIRST. Include 3-5 entries.
- If the business is AI, .ai goes first. If devtool, .io. If consumer, .com. If shell/CLI infra, .sh.
- Always include .com somewhere because it's universal fallback.

SECTION RULES:
- Write in the voice of a top-tier SaaS landing page. Opinionated, specific, no fluff.
- Hero headline ≤ 10 words. Subhead ≤ 22 words.
- Bullets are SHORT — 3-6 words each, not full sentences.

EMAIL PREFIX RULES:
- Lowercase, a-z and digits only, 2-12 chars, no punctuation.
- Exactly 6 entries. Good defaults: hello, support, billing. Pick 3 more that fit the business.`;
}

function buildUserMessage(prompt: string): string {
  return `Business description:
"${prompt}"

Produce the launch plan JSON now. Start with { and end with }. No other text.`;
}

// ---------------------------------------------------------------------------
// JSON extraction — direct parse → bracket-matching fallback
// Mirrors src/app/api/tools/business-names/route.ts
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- LLM output is untyped until sanitized
function extractJsonObject(text: string): any | null {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");

  // 1. Direct parse
  try {
    const direct = JSON.parse(cleaned);
    if (direct && typeof direct === "object" && !Array.isArray(direct)) return direct;
  } catch {
    // fall through
  }

  // 2. Bracket-matching extractor — find the largest balanced {…} block.
  const candidates: Array<{ start: number; end: number }> = [];
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
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      // try next
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Sanitize — coerce whatever the LLM returned into the strict LaunchPlan shape.
// ---------------------------------------------------------------------------

const ALLOWED_TLDS = new Set<BrandNameSuggestion["tld"]>(["com", "ai", "io", "sh"]);
const ALLOWED_SECTION_IDS = new Set<StarterSection["id"]>([
  "hero",
  "features",
  "pricing",
  "about",
  "contact",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- narrowing happens inline
function sanitizePlan(raw: any, modelUsed: string, elapsedMs: number): LaunchPlan {
  const concept = coerceString(raw?.concept, 400) || "An AI-native business ready to launch.";
  const targetCustomer =
    coerceString(raw?.targetCustomer, 300) || "Early-adopter teams looking for a faster path to market.";
  const positioning =
    coerceString(raw?.positioning, 400) || "The fastest way to go from idea to deployed product.";

  // Taglines — 5
  const taglines = coerceStringArray(raw?.taglines, { min: 4, max: 12, cap: 5, maxLen: 120 });

  // Brand names — up to 12
  const brandNames: BrandNameSuggestion[] = [];
  const seenSlugs = new Set<string>();
  const rawNames = Array.isArray(raw?.brandNames) ? raw.brandNames : [];
  for (const n of rawNames) {
    if (!n || typeof n !== "object") continue;
    const rawName = typeof n.name === "string" ? n.name.trim() : "";
    const slug = rawName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 63);
    if (slug.length < 2 || slug.length > 63) continue;
    if (seenSlugs.has(slug)) continue;
    const tldRaw = typeof n.tld === "string" ? n.tld.toLowerCase().replace(/^\./, "") : "";
    const tld = (ALLOWED_TLDS.has(tldRaw as BrandNameSuggestion["tld"])
      ? tldRaw
      : "com") as BrandNameSuggestion["tld"];
    const rationale = coerceString(n.rationale, 160) || "";
    seenSlugs.add(slug);
    brandNames.push({ name: slug, tld, rationale });
    if (brandNames.length >= BRAND_NAME_COUNT) break;
  }

  // Suggested TLDs — dedupe, cap at 5
  const suggestedTlds: Array<{ tld: string; reason: string }> = [];
  const seenTlds = new Set<string>();
  const rawTlds = Array.isArray(raw?.suggestedTlds) ? raw.suggestedTlds : [];
  for (const t of rawTlds) {
    if (!t || typeof t !== "object") continue;
    const tld = typeof t.tld === "string" ? t.tld.toLowerCase().replace(/^\./, "").trim() : "";
    if (!tld || seenTlds.has(tld) || tld.length > 10) continue;
    const reason = coerceString(t.reason, 200) || "Strong fit for this business.";
    seenTlds.add(tld);
    suggestedTlds.push({ tld, reason });
    if (suggestedTlds.length >= 5) break;
  }
  if (suggestedTlds.length === 0) {
    suggestedTlds.push({ tld: "com", reason: "Universal credibility default." });
  }

  // Starter sections — keep only the 5 canonical ids, in order.
  const rawSections = Array.isArray(raw?.starterSections) ? raw.starterSections : [];
  const sectionsById = new Map<StarterSection["id"], StarterSection>();
  for (const s of rawSections) {
    if (!s || typeof s !== "object") continue;
    const id = typeof s.id === "string" ? (s.id.toLowerCase() as StarterSection["id"]) : undefined;
    if (!id || !ALLOWED_SECTION_IDS.has(id)) continue;
    if (sectionsById.has(id)) continue;
    sectionsById.set(id, {
      id,
      headline: coerceString(s.headline, 160) || defaultHeadline(id),
      subhead: coerceString(s.subhead, 280) || "",
      bullets: coerceStringArray(s.bullets, { min: 0, max: 80, cap: 6, maxLen: 80 }),
    });
  }
  const starterSections: StarterSection[] = (["hero", "features", "pricing", "about", "contact"] as const).map(
    (id) =>
      sectionsById.get(id) || {
        id,
        headline: defaultHeadline(id),
        subhead: "",
        bullets: [],
      },
  );

  // Email prefixes — lowercase handles, 6 total, dedupe.
  const rawPrefixes = Array.isArray(raw?.emailPrefixes) ? raw.emailPrefixes : [];
  const prefixSet = new Set<string>();
  for (const p of rawPrefixes) {
    if (typeof p !== "string") continue;
    const clean = p.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
    if (clean.length < 2) continue;
    prefixSet.add(clean);
    if (prefixSet.size >= 6) break;
  }
  for (const fallback of ["hello", "support", "billing", "sales", "team", "founders"]) {
    if (prefixSet.size >= 6) break;
    prefixSet.add(fallback);
  }
  const emailPrefixes = Array.from(prefixSet).slice(0, 6);

  return {
    concept,
    targetCustomer,
    positioning,
    taglines,
    brandNames,
    suggestedTlds,
    starterSections,
    emailPrefixes,
    meta: { model: modelUsed, elapsedMs },
  };
}

function defaultHeadline(id: StarterSection["id"]): string {
  switch (id) {
    case "hero":
      return "Ship faster than your competition";
    case "features":
      return "Built for the work that matters";
    case "pricing":
      return "Simple pricing, real value";
    case "about":
      return "Built by a team that ships";
    case "contact":
      return "Let's build something together";
  }
}

function coerceString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function coerceStringArray(
  value: unknown,
  opts: { min: number; max: number; cap: number; maxLen: number },
): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of value) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim().slice(0, opts.maxLen);
    if (trimmed.length < opts.min || trimmed.length > opts.max) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
    if (out.length >= opts.cap) break;
  }
  return out;
}
