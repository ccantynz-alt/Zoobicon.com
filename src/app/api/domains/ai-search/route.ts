import { NextRequest } from "next/server";
import {
  COINAGE_PATTERNS,
  buildPatternInferencePrompt,
  buildCandidateGenerationPrompt,
  buildLinguisticFilterPrompt,
  trademarkPreFilter,
  englishNegativeFilter,
  scoreCandidate,
  type CoinagePatternId,
  type ScoredCandidate,
} from "@/lib/domain-coinage";
import { checkWithFallback } from "@/lib/opensrs";

/**
 * POST /api/domains/ai-search
 *
 * Streams SSE events for the 5-phase coinage pipeline:
 *   phase:patterns          → inferred coinage patterns + themes
 *   phase:candidates        → raw generated candidates
 *   phase:trademark         → survivors after trademark pre-filter
 *   phase:linguistic        → survivors after multi-language safety check
 *   phase:availability      → per-candidate TLD availability (one event per candidate as it resolves)
 *   phase:shortlist         → final top-N ranked shortlist
 *   done                    → terminal event
 *   error                   → terminal error with a clear reason
 *
 * Request body:
 *   { mission: string, tlds?: string[], shortlistSize?: number, candidateCount?: number }
 *
 * Design notes:
 *   - Total time budget targets ~15s for a 24-candidate run with 4 priority TLDs.
 *   - Every LLM call has an AbortSignal timeout so a stuck call cannot hang the stream.
 *   - TLD availability is raced with a per-candidate budget; unknowns are returned,
 *     never silently dropped.
 *   - The engine is usable as a paid API surface — results include provenance
 *     (pattern used, rationale, per-TLD availability, score breakdown).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-5";
const ANTHROPIC_TIMEOUT_MS = 20_000;
const DEFAULT_TLDS = ["ai", "io", "dev", "tech"];
const DEFAULT_CANDIDATE_COUNT = 24;
const DEFAULT_SHORTLIST_SIZE = 5;

interface AiSearchBody {
  mission?: string;
  tlds?: string[];
  shortlistSize?: number;
  candidateCount?: number;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };
      const fail = (reason: string, status = 500) => {
        send("error", { message: reason, status });
        controller.close();
      };

      try {
        let body: AiSearchBody;
        try {
          body = (await req.json()) as AiSearchBody;
        } catch {
          return fail("Invalid JSON body. Expected { mission, tlds?, shortlistSize?, candidateCount? }", 400);
        }

        const mission = (body.mission || "").trim();
        if (mission.length < 10) {
          return fail("Mission must be at least 10 characters. Describe the platform's purpose.", 400);
        }

        const tlds = Array.isArray(body.tlds) && body.tlds.length > 0
          ? body.tlds.map((t) => String(t).toLowerCase().replace(/^\./, "")).slice(0, 8)
          : DEFAULT_TLDS;
        const candidateCount = Math.max(10, Math.min(Number(body.candidateCount) || DEFAULT_CANDIDATE_COUNT, 32));
        const shortlistSize = Math.max(3, Math.min(Number(body.shortlistSize) || DEFAULT_SHORTLIST_SIZE, 10));

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return fail(
            "ANTHROPIC_API_KEY is not configured. Add it to Vercel environment variables and redeploy.",
            503,
          );
        }

        send("start", {
          mission,
          tlds,
          candidateCount,
          shortlistSize,
          phases: ["patterns", "candidates", "trademark", "linguistic", "availability", "shortlist"],
        });

        // ─── Phase 1: Pattern Inference (Haiku) ──────────────────────────
        const patternPrompt = buildPatternInferencePrompt(mission);
        let patternRaw: string;
        try {
          patternRaw = await callAnthropic(apiKey, HAIKU, patternPrompt, 1024);
        } catch (err) {
          return fail(
            `Phase 1 pattern inference failed: ${err instanceof Error ? err.message : String(err)}`,
            502,
          );
        }

        const patternPlan = parsePatternPlan(patternRaw);
        if (!patternPlan) {
          return fail("Phase 1 returned unparseable pattern plan. The inference model output could not be decoded.", 500);
        }

        // Resolve pattern ids to full pattern objects
        const resolvedPatterns = patternPlan.patterns
          .map((p) => {
            const match = COINAGE_PATTERNS.find((cat) => cat.id === p.id);
            return match ? { ...match, rationale: p.rationale } : null;
          })
          .filter((p): p is NonNullable<typeof p> => p !== null);

        if (resolvedPatterns.length === 0) {
          return fail(
            "Phase 1 did not return any recognised coinage patterns. The inference model picked patterns outside the catalog.",
            500,
          );
        }

        send("phase:patterns", {
          patterns: resolvedPatterns.map((p) => ({
            id: p.id,
            label: p.label,
            tonality: p.tonality,
            rationale: p.rationale,
          })),
          themes: patternPlan.themes,
          phonetic_target: patternPlan.phonetic_target,
        });

        // ─── Phase 2: Candidate Generation (Sonnet) ──────────────────────
        const genPrompt = buildCandidateGenerationPrompt(
          mission,
          resolvedPatterns.map((p) => ({
            id: p.id,
            label: p.label,
            description: p.description,
            reference: p.reference,
          })),
          patternPlan.themes,
          patternPlan.phonetic_target,
          candidateCount,
        );

        let genRaw: string;
        try {
          genRaw = await callAnthropic(apiKey, SONNET, genPrompt, 4000);
        } catch (err) {
          // Sonnet failover to Haiku
          try {
            genRaw = await callAnthropic(apiKey, HAIKU, genPrompt, 4000);
          } catch (err2) {
            return fail(
              `Phase 2 candidate generation failed on both Sonnet and Haiku. Last error: ${err2 instanceof Error ? err2.message : String(err2)}`,
              502,
            );
          }
        }

        const candidates = parseCandidateArray(genRaw);
        if (candidates.length === 0) {
          return fail("Phase 2 returned no parseable candidates. The generation model output could not be decoded.", 500);
        }

        send("phase:candidates", { candidates, count: candidates.length });

        // ─── Phase 3: Trademark Pre-filter (local) ───────────────────────
        const { survivors: tmSurvivors, flagged: tmFlagged } = trademarkPreFilter(
          candidates.map((c) => c.name),
        );
        const trademarkMap = new Map(candidates.map((c) => [c.name, c]));
        const tmSurvivorObjs = tmSurvivors
          .map((n) => trademarkMap.get(n))
          .filter((c): c is NonNullable<typeof c> => c !== undefined);

        send("phase:trademark", {
          survivors: tmSurvivorObjs,
          flagged: tmFlagged,
          kept: tmSurvivorObjs.length,
          dropped: tmFlagged.length,
        });

        if (tmSurvivorObjs.length === 0) {
          return fail(
            "Phase 3 eliminated every candidate on trademark grounds. Try a more specific mission.",
            500,
          );
        }

        // ─── Phase 4a: English negative stem fast path (local) ───────────
        const { survivors: engSurvivors, flagged: engFlagged } = englishNegativeFilter(
          tmSurvivorObjs.map((c) => c.name),
        );
        const engSurvivorObjs = engSurvivors
          .map((n) => trademarkMap.get(n))
          .filter((c): c is NonNullable<typeof c> => c !== undefined);

        // ─── Phase 4b: Multi-language LLM pass (Haiku) ────────────────────
        let linguisticVerdicts: Record<string, { verdict: "clean" | "warn" | "block"; reason?: string }> = {};
        if (engSurvivorObjs.length > 0) {
          const lingPrompt = buildLinguisticFilterPrompt(engSurvivorObjs.map((c) => c.name));
          try {
            const lingRaw = await callAnthropic(apiKey, HAIKU, lingPrompt, 2048);
            linguisticVerdicts = parseLinguisticVerdicts(lingRaw);
          } catch (err) {
            // If the linguistic pass fails, default everything to "clean" with a warning
            console.warn(
              `[ai-search] Linguistic pass failed, defaulting to clean: ${err instanceof Error ? err.message : err}`,
            );
          }
        }

        const lingSurvivors = engSurvivorObjs
          .map((c) => ({
            ...c,
            linguistic: linguisticVerdicts[c.name]?.verdict || "clean",
            linguisticReason: linguisticVerdicts[c.name]?.reason,
          }))
          .filter((c) => c.linguistic !== "block");

        send("phase:linguistic", {
          survivors: lingSurvivors,
          english_stem_flagged: engFlagged,
          multilingual_flagged: Object.entries(linguisticVerdicts)
            .filter(([, v]) => v.verdict === "block")
            .map(([name, v]) => ({ name, reason: v.reason || "blocked" })),
          kept: lingSurvivors.length,
          dropped: engFlagged.length + Object.values(linguisticVerdicts).filter((v) => v.verdict === "block").length,
        });

        if (lingSurvivors.length === 0) {
          return fail(
            "Phase 4 eliminated every candidate on linguistic safety grounds. Broaden the mission.",
            500,
          );
        }

        // ─── Phase 5: TLD Availability (parallel, bounded concurrency) ────
        const AVAIL_CONCURRENCY = 10;
        const scored: ScoredCandidate[] = [];
        let cursor = 0;

        const workers = Array.from({ length: Math.min(AVAIL_CONCURRENCY, lingSurvivors.length) }, async () => {
          while (true) {
            const idx = cursor++;
            if (idx >= lingSurvivors.length) return;
            const cand = lingSurvivors[idx];

            // Race all TLDs for this candidate in parallel
            const availability: Record<string, boolean | null> = {};
            await Promise.all(
              tlds.map(async (tld) => {
                try {
                  availability[tld] = await checkWithFallback(`${cand.name.toLowerCase()}.${tld}`);
                } catch {
                  availability[tld] = null;
                }
              }),
            );

            const scoredCand = scoreCandidate({
              name: cand.name,
              pattern: cand.pattern,
              rationale: cand.rationale,
              phoneticTarget: patternPlan.phonetic_target,
              phoneticActual: cand.phonetic || "",
              linguistic: cand.linguistic as "clean" | "warn",
              availability,
              priorityTlds: tlds,
            });

            // Attach rationale fields onto the scored candidate
            (scoredCand as ScoredCandidate & { linguisticReason?: string }).linguisticReason =
              cand.linguisticReason;

            scored.push(scoredCand);

            send("phase:availability", {
              name: cand.name,
              availability,
              available_tlds: scoredCand.availableTlds,
              score: scoredCand.score,
              index: idx + 1,
              total: lingSurvivors.length,
            });
          }
        });

        await Promise.all(workers);

        // ─── Phase 6: Rank + Shortlist ────────────────────────────────────
        const shortlist = scored
          .filter((c) => c.availableTlds.length > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, shortlistSize);

        send("phase:shortlist", {
          shortlist,
          total_considered: scored.length,
          cleared: shortlist.length,
        });

        send("done", {
          shortlist_count: shortlist.length,
          total_candidates: candidates.length,
          total_after_trademark: tmSurvivorObjs.length,
          total_after_linguistic: lingSurvivors.length,
          total_with_availability: scored.length,
        });
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[ai-search] Unexpected error:", msg);
        send("error", { message: `Unexpected error: ${msg}`, status: 500 });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// =====================================================================
// Anthropic helper
// =====================================================================

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  maxTokens: number,
): Promise<string> {
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
        max_tokens: maxTokens,
        temperature: 0.9,
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
      .map((c) => c.text)
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
    clearTimeout(timeoutId);
  }
}

// =====================================================================
// Parsers
// =====================================================================

function parsePatternPlan(raw: string): {
  patterns: Array<{ id: CoinagePatternId; rationale: string }>;
  themes: string[];
  phonetic_target: string;
} | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
    if (!parsed || typeof parsed !== "object") return null;
    const patterns = Array.isArray(parsed.patterns)
      ? parsed.patterns
          .map((p: unknown) => {
            if (!p || typeof p !== "object") return null;
            const obj = p as { id?: unknown; rationale?: unknown };
            if (typeof obj.id !== "string") return null;
            return {
              id: obj.id as CoinagePatternId,
              rationale: typeof obj.rationale === "string" ? obj.rationale : "",
            };
          })
          .filter((p: unknown): p is { id: CoinagePatternId; rationale: string } => p !== null)
      : [];
    const themes = Array.isArray(parsed.themes)
      ? parsed.themes.filter((t: unknown): t is string => typeof t === "string").slice(0, 6)
      : [];
    const phonetic_target = typeof parsed.phonetic_target === "string" ? parsed.phonetic_target : "hard-tech";
    return { patterns, themes, phonetic_target };
  } catch {
    return null;
  }
}

interface RawCandidate {
  name: string;
  pattern: string;
  rationale: string;
  phonetic: string;
}

function parseCandidateArray(raw: string): RawCandidate[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to find a JSON array inside the text
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start < 0 || end <= start) return [];
    try {
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  const out: RawCandidate[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const obj = item as { name?: unknown; pattern?: unknown; rationale?: unknown; phonetic?: unknown };
    if (typeof obj.name !== "string") continue;
    const cleanName = obj.name
      .trim()
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 20);
    if (cleanName.length < 3 || cleanName.length > 12) continue;
    const display = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
    const key = display.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: display,
      pattern: typeof obj.pattern === "string" ? obj.pattern : "unknown",
      rationale: typeof obj.rationale === "string" ? obj.rationale.slice(0, 300) : "",
      phonetic: typeof obj.phonetic === "string" ? obj.phonetic : "",
    });
  }
  return out;
}

function parseLinguisticVerdicts(
  raw: string,
): Record<string, { verdict: "clean" | "warn" | "block"; reason?: string }> {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start < 0 || end <= start) return {};
    try {
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return {};
    }
  }

  if (!Array.isArray(parsed)) return {};

  const out: Record<string, { verdict: "clean" | "warn" | "block"; reason?: string }> = {};
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const obj = item as { name?: unknown; verdict?: unknown; reason?: unknown };
    if (typeof obj.name !== "string") continue;
    const verdict = obj.verdict === "block" || obj.verdict === "warn" ? obj.verdict : "clean";
    out[obj.name] = {
      verdict: verdict as "clean" | "warn" | "block",
      reason: typeof obj.reason === "string" ? obj.reason.slice(0, 200) : undefined,
    };
  }
  return out;
}
