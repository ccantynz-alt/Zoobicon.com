import { NextRequest, NextResponse } from "next/server";
import { callLLMWithFailover } from "@/lib/llm-provider";

/**
 * GET /api/domains/trademark-global?name=<brand>[&domain=<brand>.com]
 *
 * Checks for trademark conflicts across the major global registries
 * (USPTO, EUIPO, UKIPO, WIPO Madrid, JPO) by using Claude as the
 * judgment layer. We don't have paid TSDR / TMview API access, so the
 * model's trained knowledge of registered trademarks is the best
 * signal available without a $10K/yr enterprise contract.
 *
 * Accuracy caveat: the model can miss recent filings and can occasionally
 * hallucinate. The UI MUST surface this as guidance, not legal advice —
 * we repeat the disclaimer in the response `notes` field. This is still
 * orders of magnitude better than what Namecheap/GoDaddy/Cloudflare
 * offer (which is nothing).
 *
 * Response shape (strict):
 *   {
 *     status: "clear" | "conflict" | "unknown",
 *     registries_checked: string[],
 *     conflicts: Array<{
 *       registry: string,
 *       mark: string,
 *       class: string | null,
 *       owner: string | null,
 *       status: string | null,
 *       source_url: string | null
 *     }>,
 *     evaluated_by: "ai" | "heuristic",
 *     notes: string | null
 *   }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CLAUDE_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_MAX = 500;
const PRIMARY_MODEL = "claude-haiku-4-5-20251001";

const REGISTRIES = ["USPTO", "EUIPO", "UKIPO", "WIPO", "JPO"] as const;

const DISCLAIMER =
  "AI-sourced trademark signal based on model knowledge; may miss filings made within the last 12 months and can occasionally misattribute marks. Always verify with a trademark attorney before filing, launching, or relying on this for legal decisions.";

// ---------------------------------------------------------------------------
// LRU cache (module-level, bounded)
// ---------------------------------------------------------------------------

type TrademarkResult = {
  status: "clear" | "conflict" | "unknown";
  registries_checked: string[];
  conflicts: Array<{
    registry: string;
    mark: string;
    class: string | null;
    owner: string | null;
    status: string | null;
    source_url: string | null;
  }>;
  evaluated_by: "ai" | "heuristic";
  notes: string | null;
};

const CACHE = new Map<string, { result: TrademarkResult; at: number }>();

function cacheGet(key: string): TrademarkResult | null {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  // Refresh LRU order
  CACHE.delete(key);
  CACHE.set(key, hit);
  return hit.result;
}

function cacheSet(key: string, result: TrademarkResult) {
  if (CACHE.has(key)) CACHE.delete(key);
  CACHE.set(key, { result, at: Date.now() });
  while (CACHE.size > CACHE_MAX) {
    const oldest = CACHE.keys().next().value;
    if (!oldest) break;
    CACHE.delete(oldest);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const nameParam = req.nextUrl.searchParams.get("name") || "";
    const domainParam = req.nextUrl.searchParams.get("domain") || "";

    const name = nameParam.trim().toLowerCase();
    if (!name || name.length < 2 || name.length > 64) {
      return NextResponse.json(
        { error: "name query parameter is required (2-64 characters)." },
        { status: 400 },
      );
    }

    // Accept only safe-ish charset for the brand stem
    if (!/^[a-z0-9][a-z0-9 \-']{0,62}$/.test(name)) {
      return NextResponse.json(
        { error: "Invalid name. Use letters, numbers, spaces, or hyphens only." },
        { status: 400 },
      );
    }

    const domain = domainParam.trim().toLowerCase().slice(0, 253);
    const cacheKey = `${name}|${domain}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const systemPrompt = `You are a trademark research assistant with training-time knowledge of public trademark registries.

You will be asked whether a given brand name collides with existing live trademark registrations across these registries:
- USPTO (United States Patent and Trademark Office)
- EUIPO (European Union Intellectual Property Office)
- UKIPO (United Kingdom Intellectual Property Office)
- WIPO Madrid System
- JPO (Japan Patent Office)

HARD RULES — DO NOT VIOLATE:
1. Report ONLY trademarks you genuinely recall from your training data. If unsure, return status "unknown".
2. NEVER fabricate a trademark owner, class, or registration. Inventing a conflict is worse than returning unknown.
3. Focus on LIVE, commercially significant registrations. Dead/expired marks can be reported with status "dead" but should not block overall status.
4. If a mark is a generic dictionary word AND you cannot recall a specific registration, prefer "unknown" over "clear".
5. For each conflict, include the registry, the mark as registered, the Nice class if you know it, the owner if you know it, and the status. Set any field you are not confident about to null.
6. source_url must be null unless you are certain of the exact public URL (e.g. tsdr.uspto.gov/documentsearch). Never guess a URL.

Output ONLY valid JSON matching this exact shape:
{
  "status": "clear" | "conflict" | "unknown",
  "conflicts": [
    {
      "registry": "USPTO" | "EUIPO" | "UKIPO" | "WIPO" | "JPO",
      "mark": "STRING",
      "class": "STRING or null",
      "owner": "STRING or null",
      "status": "live" | "dead" | "pending" | null,
      "source_url": "STRING or null"
    }
  ],
  "reasoning": "one short sentence"
}

Example (name "apple"):
{"status":"conflict","conflicts":[{"registry":"USPTO","mark":"APPLE","class":"9","owner":"Apple Inc.","status":"live","source_url":null},{"registry":"EUIPO","mark":"APPLE","class":"9","owner":"Apple Inc.","status":"live","source_url":null}],"reasoning":"Apple Inc. holds globally registered APPLE marks across computing, software, and services classes."}

Example (name "qzblorfix"):
{"status":"unknown","conflicts":[],"reasoning":"No recalled trademark registrations for this coined term."}

Start your response with { and end with }. No markdown fences. No preamble.`;

    const userMessage = `Check the brand name: "${name}"${domain ? ` (intended domain: ${domain})` : ""}

Return the JSON only.`;

    let rawText: string;
    try {
      const result = await Promise.race([
        callLLMWithFailover({
          model: PRIMARY_MODEL,
          system: systemPrompt,
          userMessage,
          maxTokens: 1500,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Trademark LLM call timed out after ${CLAUDE_TIMEOUT_MS}ms`)),
            CLAUDE_TIMEOUT_MS,
          ),
        ),
      ]);
      rawText = result.text || "";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[trademark-global] LLM call failed for name="${name}": ${message}`);
      const fallback: TrademarkResult = {
        status: "unknown",
        registries_checked: [...REGISTRIES],
        conflicts: [],
        evaluated_by: "heuristic",
        notes: `Trademark check unavailable right now (${message}). ${DISCLAIMER}`,
      };
      // Don't cache a transient failure
      return NextResponse.json(fallback, { status: 200 });
    }

    const parsed = extractJsonObject(rawText);
    if (!parsed) {
      console.error(
        `[trademark-global] Failed to parse JSON for name="${name}". First 200 chars: ${rawText.slice(0, 200)}`,
      );
      const fallback: TrademarkResult = {
        status: "unknown",
        registries_checked: [...REGISTRIES],
        conflicts: [],
        evaluated_by: "heuristic",
        notes: `Could not parse trademark response. ${DISCLAIMER}`,
      };
      return NextResponse.json(fallback, { status: 200 });
    }

    const result = normalizeResult(parsed);
    cacheSet(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[trademark-global] Unexpected error:", message);
    return NextResponse.json(
      { error: `Trademark check failed: ${message}` },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RawConflict {
  registry?: unknown;
  mark?: unknown;
  class?: unknown;
  owner?: unknown;
  status?: unknown;
  source_url?: unknown;
}

interface RawParsed {
  status?: unknown;
  conflicts?: unknown;
  reasoning?: unknown;
}

function normalizeResult(parsed: RawParsed): TrademarkResult {
  const rawStatus = typeof parsed.status === "string" ? parsed.status.toLowerCase() : "unknown";
  const status: TrademarkResult["status"] =
    rawStatus === "clear" || rawStatus === "conflict" ? rawStatus : "unknown";

  const conflictsRaw = Array.isArray(parsed.conflicts) ? parsed.conflicts : [];
  const conflicts: TrademarkResult["conflicts"] = [];
  for (const item of conflictsRaw) {
    if (!item || typeof item !== "object") continue;
    const c = item as RawConflict;

    const registryRaw = typeof c.registry === "string" ? c.registry.toUpperCase() : "";
    const registry = (REGISTRIES as readonly string[]).includes(registryRaw)
      ? registryRaw
      : registryRaw
        ? registryRaw.slice(0, 20)
        : "";
    if (!registry) continue;

    const mark = typeof c.mark === "string" ? c.mark.trim().slice(0, 120) : "";
    if (!mark) continue;

    const cls = typeof c.class === "string" && c.class.trim().length > 0
      ? c.class.trim().slice(0, 40)
      : null;
    const owner = typeof c.owner === "string" && c.owner.trim().length > 0
      ? c.owner.trim().slice(0, 160)
      : null;

    let markStatus: string | null = null;
    if (typeof c.status === "string") {
      const s = c.status.trim().toLowerCase().slice(0, 40);
      if (s.length > 0) markStatus = s;
    }

    let sourceUrl: string | null = null;
    if (typeof c.source_url === "string") {
      const u = c.source_url.trim();
      if (/^https?:\/\//i.test(u) && u.length <= 500) sourceUrl = u;
    }

    conflicts.push({ registry, mark, class: cls, owner, status: markStatus, source_url: sourceUrl });
  }

  // If the model said "clear" but we caught any live conflict, upgrade to conflict
  // so the UI never greenlights a name the model simultaneously flagged as taken.
  const hasLiveConflict = conflicts.some(
    (c) => c.status === "live" || c.status === "pending" || c.status === null,
  );
  const finalStatus: TrademarkResult["status"] =
    status === "conflict" ? "conflict" : hasLiveConflict && conflicts.length > 0 ? "conflict" : status;

  const reasoning = typeof parsed.reasoning === "string" ? parsed.reasoning.trim().slice(0, 300) : "";

  return {
    status: finalStatus,
    registries_checked: [...REGISTRIES],
    conflicts,
    evaluated_by: "ai",
    notes: reasoning ? `${reasoning}. ${DISCLAIMER}` : DISCLAIMER,
  };
}

/**
 * Extract a JSON object from arbitrary model output. Handles markdown fences,
 * preamble/postamble, and nested strings containing braces.
 */
function extractJsonObject(text: string): RawParsed | null {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");

  // Direct parse first
  try {
    const direct = JSON.parse(cleaned);
    if (direct && typeof direct === "object" && !Array.isArray(direct)) return direct as RawParsed;
  } catch {
    // fall through
  }

  // Walk for the largest balanced {...} block
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
  for (const cand of candidates) {
    const slice = cleaned.slice(cand.start, cand.end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as RawParsed;
    } catch {
      // continue
    }
  }

  return null;
}
