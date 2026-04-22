import { NextRequest, NextResponse } from "next/server";
import { callLLMWithFailover } from "@/lib/llm-provider";
import {
  LruCache,
  extractJsonObject,
  sanitizeDomain,
  valueHeuristic,
} from "@/lib/domain-intel";

/**
 * GET /api/domains/valuation?domain=auromax.com
 *
 * AI-driven estimated resale value. Registrars show $12.99 — we show what
 * the domain could fetch on the aftermarket.
 *
 * Strategy (hybrid, never errors unless input is malformed):
 *   1. Pure heuristic (TLD base × length × penalties × bonuses) — see
 *      src/lib/domain-intel.ts. This gives a deterministic anchor.
 *   2. Feed the heuristic + domain name to Claude Haiku. Claude adjusts for
 *      brandability, keyword demand, phonetic strength, and any comparable
 *      public sales it knows of.
 *   3. If Claude succeeds → return its numbers. Confidence reflects Claude's
 *      self-assessment.
 *   4. If Claude fails → return heuristic values with confidence="low".
 *
 * Cache: 30 minutes, 1000 entries. Valuations move slowly — stale-ish is fine.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ValuationResponse {
  domain: string;
  low: number;
  high: number;
  midpoint: number;
  confidence: "low" | "medium" | "high";
  factors: string[];
  comparable_sales: string | null;
  source: "heuristic-ai";
}

const CACHE = new LruCache<ValuationResponse>(1000, 30 * 60 * 1000);

export async function GET(req: NextRequest) {
  try {
    const rawDomain = req.nextUrl.searchParams.get("domain");
    const domain = sanitizeDomain(rawDomain || "");
    if (!domain) {
      return NextResponse.json(
        { error: "domain query parameter is required (e.g. ?domain=auromax.com)" },
        { status: 400 },
      );
    }

    const cached = CACHE.get(domain);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    const valuation = await valueDomain(domain);
    CACHE.set(domain, valuation);
    return NextResponse.json(valuation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[domains/valuation] Unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Pure internal valuation — exported indirectly through this module so the
 * drops route can call it without HTTP self-calling. Keeps the single source
 * of truth here.
 */
export async function valueDomain(domain: string): Promise<ValuationResponse> {
  const heuristic = valueHeuristic(domain);

  const system =
    "You are a senior domain appraiser with deep knowledge of the aftermarket (Sedo, GoDaddy Auctions, NameBio). You return disciplined, conservative JSON only — never prose, never markdown.";

  const user = `Appraise the domain "${domain}" for aftermarket resale value in 2026.

My heuristic baseline: $${heuristic.low}–$${heuristic.high} (midpoint $${heuristic.midpoint}).
Heuristic factors: ${heuristic.factors.join(", ")}.

Adjust based on:
  • Brandability (pronounceability, memorability, phonetic strength)
  • Keyword demand (industry relevance, search volume implications)
  • Comparable public sales you know of (NameBio, DNJournal, Sedo reports)
  • TLD strength (.com premium, .ai for AI space, etc.)

Output JSON only, matching this shape exactly:
{
  "low": number,
  "high": number,
  "confidence": "low" | "medium" | "high",
  "factors": ["4-8 short factor strings — include the strongest heuristic factors PLUS your brandability adjustments"],
  "comparable_sales": "one-sentence note on any comparable sales you can point to, or null if none"
}

Rules:
  • low must be < high, both positive integers in USD.
  • If you disagree sharply with the heuristic, say so in factors.
  • confidence="high" only if you have direct comparable-sales evidence.
  • confidence="low" if the name is obscure or niche.
  • No prose. No markdown. No preamble. JSON only.`;

  try {
    const { text: llmText } = await callLLMWithFailover({
      model: "claude-haiku-4-5-20251001",
      system,
      userMessage: user,
      maxTokens: 800,
    });

    const parsed = extractJsonObject<{
      low?: unknown;
      high?: unknown;
      confidence?: unknown;
      factors?: unknown;
      comparable_sales?: unknown;
    }>(llmText);

    if (!parsed) {
      console.warn(
        `[domains/valuation] Claude returned unparseable JSON for ${domain} — using heuristic fallback.`,
      );
      return fallbackValuation(domain, heuristic);
    }

    const low = coerceInt(parsed.low);
    const high = coerceInt(parsed.high);
    if (low === null || high === null || low <= 0 || high <= low) {
      console.warn(
        `[domains/valuation] Claude returned invalid range for ${domain} (low=${low} high=${high}) — using heuristic fallback.`,
      );
      return fallbackValuation(domain, heuristic);
    }

    const confidence = normaliseConfidence(parsed.confidence);
    const factors = Array.isArray(parsed.factors)
      ? parsed.factors
          .filter((f): f is string => typeof f === "string")
          .map((f) => f.trim())
          .filter((f) => f.length >= 2 && f.length <= 80)
          .slice(0, 10)
      : [];

    const comparable_sales =
      typeof parsed.comparable_sales === "string" && parsed.comparable_sales.trim().length > 0
        ? parsed.comparable_sales.trim().slice(0, 400)
        : null;

    return {
      domain,
      low,
      high,
      midpoint: Math.round((low + high) / 2),
      confidence,
      factors: factors.length > 0 ? factors : heuristic.factors,
      comparable_sales,
      source: "heuristic-ai",
    };
  } catch (err) {
    console.error(
      `[domains/valuation] LLM failover exhausted for ${domain}:`,
      err instanceof Error ? err.message : err,
    );
    return fallbackValuation(domain, heuristic);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fallbackValuation(
  domain: string,
  heuristic: ReturnType<typeof valueHeuristic>,
): ValuationResponse {
  return {
    domain,
    low: heuristic.low,
    high: heuristic.high,
    midpoint: heuristic.midpoint,
    confidence: "low",
    factors: heuristic.factors,
    comparable_sales: null,
    source: "heuristic-ai",
  };
}

function coerceInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, Math.round(v));
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,\s]/g, "");
    const n = Number(cleaned);
    if (Number.isFinite(n)) return Math.max(0, Math.round(n));
  }
  return null;
}

function normaliseConfidence(v: unknown): "low" | "medium" | "high" {
  if (typeof v !== "string") return "low";
  const c = v.trim().toLowerCase();
  if (c === "high" || c === "medium" || c === "low") return c;
  return "low";
}
