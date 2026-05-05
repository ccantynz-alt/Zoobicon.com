/**
 * GET /api/domains/available — Browse the pre-crawled available-domains cache
 *
 * What this is:
 *   A read-only public query endpoint over the `available_domains` table that
 *   the background crawler in src/lib/domain-crawler.ts populates. The
 *   /domains/available browse UI calls this on every filter change and
 *   pagination tick, so the response must be fast and cheap — under 100ms
 *   for the indexed common case.
 *
 * Why a separate endpoint (vs reusing /api/domains/search):
 *   /search runs LIVE registry checks (RDAP + OpenSRS + DNS) per request and
 *   is hard-capped to ~12 names per call by RDAP rate limits. /available
 *   reads pre-cached results, so it can return 200 rows in a single page
 *   with full prefix/suffix/length filtering and never touch the registry.
 *
 * Caching:
 *   We set s-maxage=60 because the crawler ticks roughly once a minute. A
 *   60-second edge cache means at most one DB query per minute per unique
 *   filter combination, which keeps Neon idle even under traffic.
 *
 * Failure modes:
 *   - Bad input (unknown TLD, garbage length) → 400 with `{error, message}`
 *   - DB not initialised (no DATABASE_URL, missing tables) → 503 pointing
 *     the operator at /api/db/init. We catch the specific Postgres errors
 *     rather than swallowing every failure as 500 because the "not set up
 *     yet" case is by far the most common deploy-time gotcha.
 *   - Anything else → 500 with a sanitised message (no stack, no SQL).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  queryAvailable,
  CRAWL_TLDS,
  type CrawlTld,
} from "@/lib/domain-crawler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

type SortOrder = "alpha" | "length" | "recent";
const SORT_VALUES: readonly SortOrder[] = ["alpha", "length", "recent"];

/** Strip everything that isn't a-z0-9 (lowercased) and cap at 5 chars —
 * matches what the crawler stores in prefix_2/prefix_3/suffix_2/suffix_3.
 * Anything longer than that can never index-match anyway. */
function sanitiseAffix(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Heuristic: is this error the "table doesn't exist / no DB" case?
 * We match on Postgres error codes when present (42P01 = undefined_table)
 * and fall back to message sniffing for the @neondatabase/serverless driver
 * which surfaces config errors as plain Error before any SQL runs. */
function isDatabaseUninitialised(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const code = (err as { code?: string }).code;
  if (code === "42P01") return true; // undefined_table
  const msg = err.message.toLowerCase();
  return (
    msg.includes("database_url") ||
    msg.includes("relation") && msg.includes("does not exist") ||
    msg.includes("connection string") ||
    msg.includes("no database")
  );
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;

  // ── tld (required, defaulted) ────────────────────────────────────────────
  const tldRaw = (params.get("tld") ?? "com").toLowerCase();
  if (!CRAWL_TLDS.includes(tldRaw as CrawlTld)) {
    return NextResponse.json(
      {
        error: "invalid_tld",
        message: `tld must be one of: ${CRAWL_TLDS.join(", ")}`,
      },
      { status: 400 },
    );
  }
  const tld = tldRaw as CrawlTld;

  // ── length (optional, 3-5) ───────────────────────────────────────────────
  let length: number | undefined;
  const lengthRaw = params.get("length");
  if (lengthRaw !== null) {
    const parsed = parseInt(lengthRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 3 || parsed > 5) {
      return NextResponse.json(
        { error: "invalid_length", message: "length must be an integer between 3 and 5" },
        { status: 400 },
      );
    }
    length = parsed;
  }

  // ── prefix / suffix (optional, sanitised to alphanumeric ≤5) ────────────
  const prefix = sanitiseAffix(params.get("prefix"));
  const suffix = sanitiseAffix(params.get("suffix"));

  // ── limit (default 50, cap 200) ──────────────────────────────────────────
  const limitRaw = params.get("limit");
  const limit = limitRaw
    ? Math.max(1, Math.min(200, parseInt(limitRaw, 10) || 50))
    : 50;

  // ── offset (default 0, ≥0) ───────────────────────────────────────────────
  const offsetRaw = params.get("offset");
  const offset = offsetRaw ? Math.max(0, parseInt(offsetRaw, 10) || 0) : 0;

  // ── sort (default alpha) ─────────────────────────────────────────────────
  const sortRaw = (params.get("sort") ?? "alpha") as SortOrder;
  if (!SORT_VALUES.includes(sortRaw)) {
    return NextResponse.json(
      {
        error: "invalid_sort",
        message: `sort must be one of: ${SORT_VALUES.join(", ")}`,
      },
      { status: 400 },
    );
  }
  const sort: SortOrder = sortRaw;

  try {
    const { rows, total } = await queryAvailable({
      tld,
      length,
      prefix,
      suffix,
      limit,
      offset,
      sort,
    });

    // hasMore is computed against `total` (post-filter count) rather than
    // a heuristic on rows.length, so the UI's "Load more" button stays
    // correct even on the last page where rows.length < limit.
    const hasMore = offset + rows.length < total;

    const response = NextResponse.json({
      tld,
      filters: {
        length: length ?? null,
        prefix: prefix ?? null,
        suffix: suffix ?? null,
        sort,
      },
      total,
      limit,
      offset,
      hasMore,
      rows: rows.map((r) => ({
        domain: r.domain,
        label: r.label,
        length: r.length,
        premium: r.premium,
        lastCheckedAt: r.last_checked_at,
      })),
    });

    // Edge cache for one minute — see file header for rationale.
    response.headers.set("Cache-Control", "public, s-maxage=60");
    return response;
  } catch (err) {
    if (isDatabaseUninitialised(err)) {
      return NextResponse.json(
        {
          error: "database_not_initialised",
          message:
            "The available-domains cache is not initialised yet. Visit /api/db/init once after deploy, then wait for the crawler cron to populate the table.",
        },
        { status: 503 },
      );
    }
    // Sanitised — never leak SQL fragments or stack traces to the client.
    const message = err instanceof Error ? err.message : "Failed to query available domains";
    return NextResponse.json(
      { error: "internal_error", message },
      { status: 500 },
    );
  }
}
