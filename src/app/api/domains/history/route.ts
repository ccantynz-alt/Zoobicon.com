import { NextRequest, NextResponse } from "next/server";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { LruCache, extractJsonObject, sanitizeDomain } from "@/lib/domain-intel";

/**
 * GET /api/domains/history?domain=auromax.com
 *
 * Historical-use intelligence for a domain. We answer the question registrars
 * don't: "was this domain ever used, and for what?"
 *
 * Pipeline:
 *   1. Wayback CDX API (free, no key) — capture count + first/last dates.
 *   2. If we have captures, fetch 3-5 sample archived pages, extract titles +
 *      meta descriptions, and ask Claude Haiku to classify the historical use.
 *   3. If the LLM step fails OR captures === 0, we STILL return the raw
 *      history data so the client always has something to render.
 *
 * Flagged categories: gambling | adult | malware | spam | crypto-scam |
 *                     phishing | parked | — anything else we find noteworthy.
 *
 * Cache: 60 minutes, 500 entries. Wayback history is near-static; burning a
 * Claude call on every reload would be absurd.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface HistoryResponse {
  domain: string;
  firstSeen: string | null;
  lastSeen: string | null;
  snapshots: number;
  flaggedCategories: string[] | null;
  summary: string | null;
  source: "wayback";
}

const CACHE = new LruCache<HistoryResponse>(500, 60 * 60 * 1000);

const WAYBACK_CDX =
  "https://web.archive.org/cdx/search/cdx?url={DOMAIN}&output=json&limit=500&collapse=timestamp:8&fl=timestamp,original,statuscode,mimetype";
const WAYBACK_SNAPSHOT = "https://web.archive.org/web/{TS}id_/{URL}";

const FLAG_VOCAB = new Set([
  "gambling",
  "adult",
  "malware",
  "spam",
  "crypto-scam",
  "phishing",
  "parked",
]);

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

    // ── 1. Wayback CDX ─────────────────────────────────────────────────────
    const cdxUrl = WAYBACK_CDX.replace("{DOMAIN}", encodeURIComponent(domain));
    let cdxRows: string[][] = [];
    try {
      const res = await fetch(cdxUrl, {
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        console.error(
          `[domains/history] Wayback CDX returned ${res.status} for ${domain}`,
        );
        return NextResponse.json(
          { error: `Wayback Machine returned ${res.status}. Try again shortly.` },
          { status: 502 },
        );
      }
      const body = (await res.json()) as unknown;
      if (Array.isArray(body)) {
        cdxRows = body.filter((r) => Array.isArray(r)) as string[][];
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[domains/history] Wayback CDX failed for ${domain}:`, msg);
      return NextResponse.json(
        { error: `Wayback Machine unreachable: ${msg}` },
        { status: 502 },
      );
    }

    // First row is the header row from the CDX API.
    const dataRows = cdxRows.length > 0 ? cdxRows.slice(1) : [];
    const snapshots = dataRows.length;

    if (snapshots === 0) {
      const empty: HistoryResponse = {
        domain,
        firstSeen: null,
        lastSeen: null,
        snapshots: 0,
        flaggedCategories: null,
        summary: "Never captured — clean slate.",
        source: "wayback",
      };
      CACHE.set(domain, empty);
      return NextResponse.json(empty);
    }

    const firstTs = dataRows[0]?.[0] || null;
    const lastTs = dataRows[dataRows.length - 1]?.[0] || null;
    const firstSeen = tsToIso(firstTs);
    const lastSeen = tsToIso(lastTs);

    // ── 2. Pull 3-5 sample snapshots (oldest + newest + 3 middle-ish) ──────
    const samples = pickSampleRows(dataRows, 5);
    const sampleTexts: string[] = [];
    await Promise.all(
      samples.map(async (row) => {
        const ts = row[0];
        const original = row[1];
        if (!ts || !original) return;
        const snapUrl = WAYBACK_SNAPSHOT.replace("{TS}", ts).replace(
          "{URL}",
          original,
        );
        try {
          const res = await fetch(snapUrl, {
            signal: AbortSignal.timeout(4000),
            redirect: "follow",
          });
          if (!res.ok) return;
          const html = await res.text();
          const extracted = extractTitleAndMeta(html);
          if (extracted) {
            sampleTexts.push(`[${ts}] ${extracted}`);
          }
        } catch (err) {
          // One bad snapshot must never poison the rest — log and move on.
          console.warn(
            `[domains/history] snapshot fetch failed (${ts}):`,
            err instanceof Error ? err.message : err,
          );
        }
      }),
    );

    // Heuristic fallback summary — used if Claude fails or returns garbage.
    const heuristicSummary = `${snapshots} capture${snapshots === 1 ? "" : "s"} between ${firstSeen || "unknown"} and ${lastSeen || "unknown"}.`;

    let flaggedCategories: string[] | null = null;
    let summary: string | null = heuristicSummary;

    // ── 3. Classify via Claude Haiku (non-blocking — never fails the route) ─
    if (sampleTexts.length > 0) {
      const system =
        "You classify the historical use of a website from snapshots of its HTML titles and meta descriptions. Be terse. Only output JSON. Never invent data beyond what the snapshots support.";
      const user = buildClassifyPrompt(domain, sampleTexts);

      try {
        const { text: llmText } = await callLLMWithFailover({
          model: "claude-haiku-4-5-20251001",
          system,
          userMessage: user,
          maxTokens: 800,
        });

        const parsed = extractJsonObject<{
          categories?: unknown;
          flagged?: unknown;
          summary?: unknown;
        }>(llmText);

        if (parsed) {
          const rawFlagged = Array.isArray(parsed.flagged)
            ? parsed.flagged.filter((f): f is string => typeof f === "string")
            : [];
          const cleanFlagged = rawFlagged
            .map((f) => f.trim().toLowerCase())
            .filter((f) => FLAG_VOCAB.has(f));
          flaggedCategories = cleanFlagged.length > 0 ? Array.from(new Set(cleanFlagged)) : null;

          if (typeof parsed.summary === "string" && parsed.summary.trim().length > 0) {
            summary = parsed.summary.trim().slice(0, 300);
          }
        } else {
          console.warn(
            `[domains/history] Claude returned unparseable output for ${domain} — falling back to heuristic summary.`,
          );
        }
      } catch (err) {
        // LLM failure is not fatal — we have real Wayback data and a heuristic summary.
        console.error(
          `[domains/history] Claude classification failed for ${domain}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    const response: HistoryResponse = {
      domain,
      firstSeen,
      lastSeen,
      snapshots,
      flaggedCategories,
      summary,
      source: "wayback",
    };
    CACHE.set(domain, response);
    return NextResponse.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[domains/history] Unexpected error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wayback timestamps are YYYYMMDDhhmmss. Convert to an ISO date string.
 * Returns null if the timestamp is malformed — never throws.
 */
function tsToIso(ts: string | null): string | null {
  if (!ts || ts.length < 8) return null;
  const y = ts.slice(0, 4);
  const m = ts.slice(4, 6);
  const d = ts.slice(6, 8);
  const iso = `${y}-${m}-${d}`;
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  return iso;
}

/**
 * Pick a small, diverse set of sample rows — oldest, newest, plus evenly-
 * spaced middle samples. Bounded at `count` rows total.
 */
function pickSampleRows(rows: string[][], count: number): string[][] {
  if (rows.length <= count) return rows.slice();
  const out: string[][] = [];
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (first) out.push(first);
  const middleSlots = Math.max(0, count - 2);
  for (let i = 1; i <= middleSlots; i++) {
    const idx = Math.floor((rows.length - 1) * (i / (middleSlots + 1)));
    if (idx > 0 && idx < rows.length - 1) out.push(rows[idx]);
  }
  if (last && last !== first) out.push(last);
  // Dedupe by timestamp
  const seen = new Set<string>();
  return out.filter((r) => {
    if (!r || !r[0]) return false;
    if (seen.has(r[0])) return false;
    seen.add(r[0]);
    return true;
  });
}

/**
 * Pull <title> + meta description from an archived HTML page. Regex is fine
 * here — the CDX flow is on a best-effort path and a proper parser would
 * just be overhead.
 */
function extractTitleAndMeta(html: string): string | null {
  if (!html || typeof html !== "string") return null;
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  );
  const title = titleMatch?.[1]?.replace(/\s+/g, " ").trim().slice(0, 200) || "";
  const meta = metaMatch?.[1]?.replace(/\s+/g, " ").trim().slice(0, 300) || "";
  if (!title && !meta) return null;
  return [title && `title: ${title}`, meta && `meta: ${meta}`]
    .filter(Boolean)
    .join(" | ");
}

function buildClassifyPrompt(domain: string, samples: string[]): string {
  return `You are given ${samples.length} historical snapshot(s) of the website at ${domain}.

Each line is a timestamped summary of an archived page's title and meta description:
${samples.map((s) => `- ${s}`).join("\n")}

Classify the historical use. Output JSON only, no preamble, no markdown:
{
  "categories": ["short descriptive tags, e.g. 'ecommerce', 'blog', 'personal site'"],
  "flagged": ["any of: gambling, adult, malware, spam, crypto-scam, phishing, parked — or empty array"],
  "summary": "one sentence describing what this domain was used for"
}

Rules:
- Only flag if the snapshots clearly show the problematic content.
- If snapshots look generic or empty, categories can be ["unknown"] and flagged must be [].
- Summary must be 1 sentence, max 200 characters.
- Return ONLY the JSON object.`;
}
