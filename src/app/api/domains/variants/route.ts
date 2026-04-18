import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/domains/variants
 *
 * When a user's preferred name is taken across every TLD they checked, the
 * rescue move is to surface brandable variants — prefixed ("get"/"use"/"try"),
 * suffixed ("hq"/"labs"/"io"/"ly"), or semantic coinages that keep the core
 * concept alive. This endpoint is the "don't send the user away empty-handed"
 * safety net the whole domain search hangs on.
 *
 * Request body: { baseName: string, description?: string, count?: number }
 * Success (200): { variants: Array<{ name: string, reason: string }> }
 *
 * Returns valid domain labels only (2-20 chars, [a-z0-9] — we collapse
 * everything else). Never includes the original base name.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const PRIMARY_MODEL = "claude-haiku-4-5-20251001";
const FALLBACK_MODEL = "claude-sonnet-4-5";
const ANTHROPIC_TIMEOUT_MS = 15_000;

interface RequestBody {
  baseName?: string;
  description?: string;
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
        { error: "Invalid JSON body. Expected { baseName, description?, count? }" },
        { status: 400 },
      );
    }

    const { baseName, description, count } = body;
    if (!baseName || typeof baseName !== "string" || baseName.trim().length < 2) {
      return NextResponse.json(
        { error: "baseName must be at least 2 characters." },
        { status: 400 },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Variant generator unavailable: ANTHROPIC_API_KEY is not configured.",
        },
        { status: 503 },
      );
    }

    const base = baseName.trim().slice(0, 30);
    const baseSlug = base.toLowerCase().replace(/[^a-z0-9]/g, "");
    const desc = typeof description === "string" ? description.trim().slice(0, 400) : "";
    const requested = Number.isFinite(count as number) ? Math.floor(count as number) : 8;
    const variantCount = Math.max(3, Math.min(requested, 15));

    const prompt = buildPrompt(base, desc, variantCount);

    let rawText = "";
    let modelUsed = PRIMARY_MODEL;
    try {
      rawText = await callAnthropic(apiKey, PRIMARY_MODEL, prompt);
    } catch (err) {
      console.warn(
        `[variants] Primary ${PRIMARY_MODEL} failed: ${err instanceof Error ? err.message : err}. Falling back.`,
      );
      try {
        rawText = await callAnthropic(apiKey, FALLBACK_MODEL, prompt);
        modelUsed = FALLBACK_MODEL;
      } catch (err2) {
        return NextResponse.json(
          {
            error: `Variant generator failed: ${err2 instanceof Error ? err2.message : "unknown"}`,
          },
          { status: 500 },
        );
      }
    }

    const parsed = extractJsonArray(rawText);
    if (!parsed) {
      return NextResponse.json(
        { error: "AI returned a malformed response. Please try again." },
        { status: 500 },
      );
    }

    const variants = sanitize(parsed, baseSlug, variantCount);
    if (variants.length === 0) {
      return NextResponse.json(
        { error: "AI couldn't generate usable variants. Try a different name." },
        { status: 500 },
      );
    }

    const elapsed = Date.now() - startedAt;
    console.log(
      `[variants] OK model=${modelUsed} base=${baseSlug} requested=${variantCount} returned=${variants.length} elapsed=${elapsed}ms`,
    );

    return NextResponse.json({
      variants,
      meta: { model: modelUsed, baseName: base, elapsedMs: elapsed },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[variants] Unexpected error:", message);
    return NextResponse.json(
      { error: `Variant generation failed: ${message}` },
      { status: 500 },
    );
  }
}

function buildPrompt(base: string, description: string, count: number): string {
  const descBlock = description
    ? `\nORIGINAL CONTEXT — the user is naming: "${description}". Keep variants tonally consistent with this.`
    : "";

  return `You are a senior naming consultant. The founder wanted "${base}" but every useful TLD is taken. Rescue them with ${count} brandable domain variants that keep the spirit of "${base}" alive.${descBlock}

VARIANT PATTERNS — mix across these, 2-3 from each category:
1. Prefixes: get${base}, use${base}, try${base}, join${base}, with${base}, go${base}, my${base}, the${base}
2. Suffixes: ${base}hq, ${base}labs, ${base}app, ${base}hub, ${base}io, ${base}ly, ${base}ify, ${base}co, ${base}ai
3. Semantic siblings — related coinages that share a concept/root with "${base}" but are genuinely different words. Lean toward less-common Latin/Greek/Norse roots or invented coinages likely to be available.
4. Compound: "${base}" + a short evocative word (forge, works, stack, mind, wave, orbit, pulse).

CORE RULES:
- Each variant MUST be a valid domain label: letters and digits only, 3-20 chars, no hyphens, no spaces, no punctuation.
- NEVER return the exact base "${base}" — the whole point is that it's taken.
- Prefer variants ≤10 characters. Shorter = more brandable + more likely to be available.
- Each gets a short "reason" (3-8 words) explaining the pattern: "added 'get' prefix", "mythic sibling of ${base}", "compound with 'labs'".
- Mix the pattern types for variety — don't send 8 prefixes.

CRITICAL OUTPUT FORMAT:
Output ONLY a valid JSON array. No markdown. No preamble. Start with [ end with ].

Example:
[{"name":"get${base}","reason":"added 'get' prefix"},{"name":"${base}labs","reason":"suffix signals product studio"},{"name":"Vexion","reason":"mythic sibling — sharper consonants"}]

Generate ${count} variants now for "${base}":`;
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
        max_tokens: 2000,
        temperature: 0.9,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Anthropic API ${res.status}: ${errBody.slice(0, 300)}`);
    }
    const data = (await res.json()) as { content?: Array<{ type?: string; text?: string }> };
    const text = (data.content || [])
      .filter((c) => c?.type === "text" && typeof c.text === "string")
      .map((c) => c.text)
      .join("\n")
      .trim();
    if (!text) throw new Error(`Anthropic returned no text for ${model}`);
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

function extractJsonArray(text: string): Array<{ name?: unknown; reason?: unknown }> | null {
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  try {
    const direct = JSON.parse(cleaned);
    if (Array.isArray(direct)) return direct;
  } catch {
    // continue
  }
  // Depth-counted bracket scan — same technique as business-names route.
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

function sanitize(
  raw: Array<{ name?: unknown; reason?: unknown }>,
  baseSlug: string,
  cap: number,
): Array<{ name: string; reason: string }> {
  const out: Array<{ name: string; reason: string }> = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rawName = typeof item.name === "string" ? item.name : "";
    const rawReason = typeof item.reason === "string" ? item.reason : "";
    const slug = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (slug.length < 3 || slug.length > 20) continue;
    if (slug === baseSlug) continue; // never regurgitate the taken base name
    if (seen.has(slug)) continue;
    seen.add(slug);
    const display = slug.charAt(0).toUpperCase() + slug.slice(1);
    out.push({
      name: display,
      reason: rawReason.trim().slice(0, 80),
    });
    if (out.length >= cap) break;
  }
  return out;
}
