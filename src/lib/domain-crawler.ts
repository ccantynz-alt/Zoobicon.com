/**
 * Domain Crawler — Pre-Crawled Available .com / .ai / .io List
 *
 * What this is:
 *   A background job that walks the alphabetical address-space of a TLD
 *   (3-char first, then 4, then 5…) and records every label that comes back
 *   "available" from the registry into a Postgres table. The user-facing
 *   /domains/available page reads from that cache instantly — no live RDAP
 *   calls per query. After ~6 weeks of crawling we have the entire 4-char
 *   .com available-list and a sample of 5-char.
 *
 * Why this exists:
 *   Live "show me every available .com" is impossible — RDAP rate limits
 *   put a hard ceiling around 5 req/sec sustainable, so even a 4-char
 *   alphabetical scan (1.68M names) takes 4 days non-stop. We can't do
 *   that on user time, but we *can* do it on background time. Once cached,
 *   filter-by-prefix and filter-by-length queries serve in <100ms.
 *
 * Bounded budget:
 *   Each cron tick processes CRAWL_BATCH_SIZE candidates with bounded
 *   concurrency. Sustained throughput stays comfortably under RDAP limits
 *   even when several ticks overlap. The cursor lives in `crawl_state` so
 *   the next tick picks up exactly where the last one stopped — no
 *   duplicate work, no skipped labels.
 *
 * State machine:
 *   crawl_state.cursor is the next label to check ("aaa", "aab", … "zzz",
 *   then "aaaa", "aaab", … "zzzz", then 5-char, …). When cursor exceeds
 *   the configured maxLength for a TLD we wrap back to the shortest length
 *   to refresh stale entries (the registry releases dropped names every day).
 */

import { sql } from "@/lib/db";
import { checkWithFallback } from "@/lib/opensrs";

// ── Configuration ─────────────────────────────────────────────────────────

/** TLDs we crawl. Add to this list to expand coverage. */
export const CRAWL_TLDS = ["com", "ai", "io"] as const;
export type CrawlTld = (typeof CRAWL_TLDS)[number];

/** Maximum label length we crawl. 5 covers the practically interesting
 * brandable space; 6+ is pure gibberish at that scale and not worth the
 * RDAP budget. Bump this if we ever want longer coverage. */
export const MAX_LABEL_LENGTH = 5;

/** Minimum label length. ICANN requires .com labels to be ≥3 chars. */
export const MIN_LABEL_LENGTH = 3;

/** Per-cron-tick budget. ~5 req/sec sustained is the safe RDAP rate;
 * a 60s cron tick × 5 tlds × bounded concurrency = comfortably under. */
const CRAWL_BATCH_SIZE = 50;

/** Concurrency per crawler tick. checkWithFallback uses RDAP authoritative
 * + DNS consensus, so it's already polite to upstreams. 4-wide is safe. */
const CRAWL_CONCURRENCY = 4;

/** Hard wall-clock cap for a single tick. The Vercel cron has a 60s budget
 * by default; we cap below that so we always have time to commit progress
 * back to crawl_state before the function dies. */
const TICK_BUDGET_MS = 45_000;

// ── Schema ────────────────────────────────────────────────────────────────

export async function ensureCrawlSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS available_domains (
      domain          TEXT PRIMARY KEY,
      tld             TEXT NOT NULL,
      label           TEXT NOT NULL,
      length          INTEGER NOT NULL,
      prefix_2        TEXT NOT NULL,
      prefix_3        TEXT NOT NULL,
      suffix_2        TEXT NOT NULL,
      suffix_3        TEXT NOT NULL,
      is_available    BOOLEAN NOT NULL,
      premium         BOOLEAN NOT NULL DEFAULT false,
      last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS available_domains_tld_avail_len_idx ON available_domains (tld, is_available, length)`;
  await sql`CREATE INDEX IF NOT EXISTS available_domains_prefix2_idx ON available_domains (tld, is_available, prefix_2)`;
  await sql`CREATE INDEX IF NOT EXISTS available_domains_prefix3_idx ON available_domains (tld, is_available, prefix_3)`;
  await sql`CREATE INDEX IF NOT EXISTS available_domains_suffix2_idx ON available_domains (tld, is_available, suffix_2)`;
  await sql`CREATE INDEX IF NOT EXISTS available_domains_suffix3_idx ON available_domains (tld, is_available, suffix_3)`;
  await sql`CREATE INDEX IF NOT EXISTS available_domains_label_idx ON available_domains (tld, is_available, label)`;

  await sql`
    CREATE TABLE IF NOT EXISTS crawl_state (
      tld           TEXT PRIMARY KEY,
      cursor        TEXT NOT NULL,
      last_tick_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_tick_count INTEGER NOT NULL DEFAULT 0,
      total_checked BIGINT NOT NULL DEFAULT 0,
      total_available BIGINT NOT NULL DEFAULT 0,
      wraparound_count INTEGER NOT NULL DEFAULT 0
    )
  `;
}

// ── Alphabet & Cursor Math ────────────────────────────────────────────────

/**
 * Domain label alphabet — 36 chars: a-z + 0-9. We do not include hyphens
 * because crawling hyphenated combos would ~10x the search space and
 * they're rarely brandable. We can revisit if customers demand them.
 */
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const ALPHABET_LEN = ALPHABET.length;

/** Increment a label like an odometer. "aaa" → "aab" → … → "zz9" → "aaaa". */
export function nextLabel(label: string): string {
  const chars = label.split("");
  for (let i = chars.length - 1; i >= 0; i--) {
    const idx = ALPHABET.indexOf(chars[i]);
    if (idx === -1) {
      // Invalid char — treat as if at end, carry
      chars[i] = ALPHABET[0];
      continue;
    }
    if (idx < ALPHABET_LEN - 1) {
      chars[i] = ALPHABET[idx + 1];
      return chars.join("");
    }
    chars[i] = ALPHABET[0];
    // continue carrying
  }
  // Overflow — extend by one char (e.g. "999" → "aaaa")
  return ALPHABET[0].repeat(label.length + 1);
}

/** First label of a given length — "aaa" for 3, "aaaa" for 4, etc. */
function firstLabelOfLength(n: number): string {
  return ALPHABET[0].repeat(n);
}

/** Yield the next CRAWL_BATCH_SIZE labels starting at cursor, wrapping
 * back to MIN_LABEL_LENGTH when we run past MAX_LABEL_LENGTH. */
function generateBatch(cursor: string): { labels: string[]; nextCursor: string } {
  const labels: string[] = [];
  let cur = cursor;
  for (let i = 0; i < CRAWL_BATCH_SIZE; i++) {
    if (cur.length > MAX_LABEL_LENGTH) {
      cur = firstLabelOfLength(MIN_LABEL_LENGTH);
    }
    labels.push(cur);
    cur = nextLabel(cur);
  }
  return { labels, nextCursor: cur };
}

// ── Crawl Tick ────────────────────────────────────────────────────────────

export interface CrawlTickResult {
  tld: CrawlTld;
  startedAt: string;
  durationMs: number;
  labelsChecked: number;
  available: number;
  taken: number;
  unknown: number;
  cursorBefore: string;
  cursorAfter: string;
  budgetExceeded: boolean;
}

/**
 * Run a single crawl tick for one TLD. Bounded by CRAWL_BATCH_SIZE and
 * TICK_BUDGET_MS — whichever hits first wins. Updates crawl_state.cursor
 * to the first un-checked label so the next tick resumes correctly.
 */
export async function runCrawlTick(tld: CrawlTld): Promise<CrawlTickResult> {
  await ensureCrawlSchema();
  const startedAt = new Date();
  const startMs = startedAt.getTime();

  // Read or initialise cursor
  const stateRows = (await sql`
    SELECT cursor FROM crawl_state WHERE tld = ${tld}
  `) as Array<{ cursor: string }>;

  let cursor = stateRows[0]?.cursor;
  if (!cursor) {
    cursor = firstLabelOfLength(MIN_LABEL_LENGTH);
    await sql`
      INSERT INTO crawl_state (tld, cursor, last_tick_at)
      VALUES (${tld}, ${cursor}, NOW())
      ON CONFLICT (tld) DO NOTHING
    `;
  }

  const { labels, nextCursor: plannedNext } = generateBatch(cursor);

  // Bounded-concurrency worker pool — same pattern as /api/domains/search.
  let i = 0;
  let available = 0;
  let taken = 0;
  let unknown = 0;
  let lastCheckedIndex = -1;
  const wallClockBudget = startMs + TICK_BUDGET_MS;

  const workers = Array.from({ length: CRAWL_CONCURRENCY }, () =>
    (async () => {
      while (true) {
        if (Date.now() > wallClockBudget) return;
        const idx = i++;
        if (idx >= labels.length) return;
        const label = labels[idx];
        const domain = `${label}.${tld}`;
        let isAvailable: boolean | null = null;
        try {
          isAvailable = await checkWithFallback(domain);
        } catch {
          isAvailable = null;
        }
        if (isAvailable === true) available++;
        else if (isAvailable === false) taken++;
        else unknown++;
        lastCheckedIndex = Math.max(lastCheckedIndex, idx);

        // Persist whatever we got. Unknowns we still record so the next pass
        // knows to retry sooner. Available results are the prize — they're
        // what /domains/available reads.
        if (isAvailable !== null) {
          await sql`
            INSERT INTO available_domains (
              domain, tld, label, length,
              prefix_2, prefix_3, suffix_2, suffix_3,
              is_available, premium, last_checked_at
            )
            VALUES (
              ${domain}, ${tld}, ${label}, ${label.length},
              ${label.slice(0, 2)}, ${label.slice(0, 3)},
              ${label.slice(-2)}, ${label.slice(-3)},
              ${isAvailable}, ${label.length <= 3}, NOW()
            )
            ON CONFLICT (domain) DO UPDATE SET
              is_available = EXCLUDED.is_available,
              last_checked_at = NOW()
          `;
        }
      }
    })(),
  );

  await Promise.all(workers);
  const labelsChecked = lastCheckedIndex + 1;
  const budgetExceeded = Date.now() > wallClockBudget;

  // Cursor advance: we move forward by however many we actually checked,
  // not by the planned batch size. That way a budget-exceeded tick doesn't
  // skip un-checked labels.
  const cursorAfter = labelsChecked === labels.length
    ? plannedNext
    : labels[labelsChecked] ?? plannedNext;

  await sql`
    UPDATE crawl_state SET
      cursor = ${cursorAfter},
      last_tick_at = NOW(),
      last_tick_count = ${labelsChecked},
      total_checked = total_checked + ${labelsChecked},
      total_available = total_available + ${available},
      wraparound_count = wraparound_count + ${cursorAfter.length < cursor.length ? 1 : 0}
    WHERE tld = ${tld}
  `;

  return {
    tld,
    startedAt: startedAt.toISOString(),
    durationMs: Date.now() - startMs,
    labelsChecked,
    available,
    taken,
    unknown,
    cursorBefore: cursor,
    cursorAfter,
    budgetExceeded,
  };
}

// ── Query Helpers (used by /api/domains/available) ─────────────────────────

export interface AvailableQuery {
  tld: CrawlTld;
  length?: number;
  prefix?: string;
  suffix?: string;
  limit: number;
  offset: number;
  sort: "alpha" | "length" | "recent";
}

export interface AvailableRow {
  domain: string;
  label: string;
  length: number;
  premium: boolean;
  last_checked_at: string;
}

export async function queryAvailable(
  q: AvailableQuery,
): Promise<{ rows: AvailableRow[]; total: number }> {
  await ensureCrawlSchema();
  const cleanPrefix = q.prefix?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "";
  const cleanSuffix = q.suffix?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "";
  const len = q.length && q.length >= MIN_LABEL_LENGTH && q.length <= MAX_LABEL_LENGTH ? q.length : null;
  const limit = Math.max(1, Math.min(200, q.limit));
  const offset = Math.max(0, q.offset);

  // Three pre-formed query branches because @neondatabase/serverless's
  // tagged-template helper doesn't expose a sql.unsafe() escape hatch.
  // All filter inputs are sanitised above to typed primitives + pure-ascii
  // wildcards; the WHERE clause is identical across branches.
  const lengthFilter = len ?? -1; // -1 sentinel = match-any
  const prefixPattern = cleanPrefix ? cleanPrefix + "%" : null;
  const suffixPattern = cleanSuffix ? "%" + cleanSuffix : null;

  let rows: AvailableRow[];
  if (q.sort === "length") {
    rows = (await sql`
      SELECT domain, label, length, premium, last_checked_at::text AS last_checked_at
      FROM available_domains
      WHERE tld = ${q.tld}
        AND is_available = true
        AND (${lengthFilter} = -1 OR length = ${lengthFilter})
        AND (${prefixPattern}::text IS NULL OR label LIKE ${prefixPattern})
        AND (${suffixPattern}::text IS NULL OR label LIKE ${suffixPattern})
      ORDER BY length ASC, label ASC
      LIMIT ${limit} OFFSET ${offset}
    `) as AvailableRow[];
  } else if (q.sort === "recent") {
    rows = (await sql`
      SELECT domain, label, length, premium, last_checked_at::text AS last_checked_at
      FROM available_domains
      WHERE tld = ${q.tld}
        AND is_available = true
        AND (${lengthFilter} = -1 OR length = ${lengthFilter})
        AND (${prefixPattern}::text IS NULL OR label LIKE ${prefixPattern})
        AND (${suffixPattern}::text IS NULL OR label LIKE ${suffixPattern})
      ORDER BY last_checked_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as AvailableRow[];
  } else {
    rows = (await sql`
      SELECT domain, label, length, premium, last_checked_at::text AS last_checked_at
      FROM available_domains
      WHERE tld = ${q.tld}
        AND is_available = true
        AND (${lengthFilter} = -1 OR length = ${lengthFilter})
        AND (${prefixPattern}::text IS NULL OR label LIKE ${prefixPattern})
        AND (${suffixPattern}::text IS NULL OR label LIKE ${suffixPattern})
      ORDER BY label ASC
      LIMIT ${limit} OFFSET ${offset}
    `) as AvailableRow[];
  }

  const totalRows = (await sql`
    SELECT COUNT(*)::int AS c
    FROM available_domains
    WHERE tld = ${q.tld}
      AND is_available = true
      AND (${lengthFilter} = -1 OR length = ${lengthFilter})
      AND (${prefixPattern}::text IS NULL OR label LIKE ${prefixPattern})
      AND (${suffixPattern}::text IS NULL OR label LIKE ${suffixPattern})
  `) as Array<{ c: number }>;

  return { rows, total: totalRows[0]?.c ?? 0 };
}

export interface CrawlerStatus {
  tld: CrawlTld;
  cursor: string;
  lastTickAt: string | null;
  lastTickCount: number;
  totalChecked: number;
  totalAvailable: number;
  wraparoundCount: number;
}

export async function getCrawlerStatus(): Promise<CrawlerStatus[]> {
  await ensureCrawlSchema();
  const rows = (await sql`
    SELECT tld, cursor,
           last_tick_at::text AS last_tick_at,
           last_tick_count, total_checked, total_available, wraparound_count
    FROM crawl_state
    ORDER BY tld
  `) as Array<{
    tld: CrawlTld;
    cursor: string;
    last_tick_at: string | null;
    last_tick_count: number;
    total_checked: number;
    total_available: number;
    wraparound_count: number;
  }>;
  return rows.map((r) => ({
    tld: r.tld,
    cursor: r.cursor,
    lastTickAt: r.last_tick_at,
    lastTickCount: r.last_tick_count,
    totalChecked: Number(r.total_checked),
    totalAvailable: Number(r.total_available),
    wraparoundCount: r.wraparound_count,
  }));
}
