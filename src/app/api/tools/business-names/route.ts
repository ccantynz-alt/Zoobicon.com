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

type GeneratedName = { name: string; tagline: string };

interface RequestBody {
  description?: string;
  industry?: string;
  style?: string;
  count?: number;
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

    const { description, industry, style, count } = body;

    if (!description || typeof description !== "string" || description.trim().length < 3) {
      return NextResponse.json(
        { error: "Please describe your business (at least 3 characters)." },
        { status: 400 },
      );
    }

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

    const requestedCount = Number.isFinite(count as number) ? Math.floor(count as number) : 12;
    const nameCount = Math.max(1, Math.min(requestedCount, 24));

    const styleDesc = describeStyle(style);
    const industryContext = industry ? ` in the ${industry} industry` : "";
    const cleanDescription = description.trim().slice(0, 500);

    const prompt = buildPrompt(cleanDescription, industryContext, styleDesc, nameCount);

    // ---- Primary attempt: Haiku 4.5 ------------------------------------
    let rawText = "";
    let modelUsed = PRIMARY_MODEL;
    let lastError: string | null = null;

    try {
      rawText = await callAnthropic(apiKey, PRIMARY_MODEL, prompt);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(
        `[business-names] Primary model ${PRIMARY_MODEL} failed: ${lastError}. Falling back to ${FALLBACK_MODEL}`,
      );
      // ---- Fallback: Sonnet 4.5 ----------------------------------------
      try {
        rawText = await callAnthropic(apiKey, FALLBACK_MODEL, prompt);
        modelUsed = FALLBACK_MODEL;
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

    // ---- Sanitize + dedupe ---------------------------------------------
    const sanitized = sanitizeNames(parsed, nameCount);

    if (sanitized.length === 0) {
      console.error(
        "[business-names] All names were filtered out as invalid. Raw count:",
        parsed.length,
      );
      return NextResponse.json(
        { error: "AI returned names but none were valid. Please try a different description." },
        { status: 500 },
      );
    }

    const elapsed = Date.now() - startedAt;
    console.log(
      `[business-names] OK model=${modelUsed} requested=${nameCount} returned=${sanitized.length} elapsed=${elapsed}ms`,
    );

    return NextResponse.json({ names: sanitized });
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

function buildPrompt(
  description: string,
  industryContext: string,
  styleDesc: string,
  nameCount: number,
): string {
  return `Generate exactly ${nameCount} creative, brandable business names for: "${description}"${industryContext}.

Style: ${styleDesc}

Rules:
- Each name must be 1-2 words, 3-15 characters total
- Must be easy to spell and pronounce
- Must work as a domain name (letters and digits only — no spaces, no hyphens, no punctuation)
- Mix invented words, compound words, metaphors, abbreviations
- Each name gets a short tagline (5-10 words) explaining the vibe
- Do NOT suggest generic names like "TechSolutions", "BestService", "ProBuilder"
- Be creative — Spotify, Airbnb, Canva, Stripe, Notion, Figma, Vercel level naming
- Names must be unique within your response

CRITICAL OUTPUT FORMAT:
Output ONLY a valid JSON array. No markdown code fences. No preamble. No explanation text. No trailing commentary.
Start your response with [ and end with ]. Nothing else.

Example of the EXACT format required:
[{"name":"Lumio","tagline":"Brilliant ideas, instantly delivered"},{"name":"Hexa","tagline":"Six sides of pure innovation"}]

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
        temperature: 1.0,
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
  raw: Array<{ name?: unknown; tagline?: unknown }>,
  nameCount: number,
): GeneratedName[] {
  const out: GeneratedName[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rawName = typeof item.name === "string" ? item.name : "";
    const rawTagline = typeof item.tagline === "string" ? item.tagline : "";

    // Strip everything that wouldn't be a valid domain label
    const nameClean = rawName.trim().replace(/\s+/g, "");
    if (!nameClean) continue;

    // Slug form for dedupe and domain safety
    const slug = nameClean
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "")
      .slice(0, 63);

    if (slug.length < 2 || slug.length > 63) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    // Capitalise first letter for display
    const display = nameClean.charAt(0).toUpperCase() + nameClean.slice(1);

    out.push({
      name: display,
      tagline: rawTagline.trim().slice(0, 200),
    });

    if (out.length >= nameCount) break;
  }

  return out;
}
