/**
 * REDDIT FLYWHEEL — same pattern as hn-flywheel, different signal source.
 *
 * Reddit is where developers complain in public. The HN flywheel
 * (PR #393) catches Show HN drama and front-page debates; Reddit
 * catches the "just tried Lovable, here's what broke" posts that
 * never make it to HN.
 *
 * Pipeline: poll → harvest → extract → digest (mirrors HN).
 *
 * Key differences from HN:
 *   - Public Reddit JSON API returns the comment tree in one call —
 *     no Firebase round-trips needed. Reduces "harvest" to a single
 *     fetch per thread.
 *   - User-Agent header is REQUIRED by Reddit ToS — set explicitly.
 *   - Subreddit-scoped polling (we control the universe) instead of
 *     keyword-scoped (Algolia's universe). Tighter signal, less noise.
 *
 * Schema is mirrored not merged with HN — keeps the two source
 * streams independent until/if we unify. The painkiller format is
 * identical because the extractor uses the same Claude prompt.
 *
 * Rule 28 (proactive competitive intelligence) compliance.
 */

import { neon } from "@neondatabase/serverless";
import { callLLMWithFailover } from "@/lib/llm-provider";

function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function ensureRedditTables(): Promise<void> {
  const sql = getDb();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS reddit_threads (
      reddit_id        TEXT PRIMARY KEY,
      subreddit        TEXT NOT NULL,
      title            TEXT NOT NULL,
      url              TEXT NOT NULL,
      permalink        TEXT NOT NULL,
      score            INTEGER NOT NULL DEFAULT 0,
      num_comments     INTEGER NOT NULL DEFAULT 0,
      author           TEXT,
      selftext         TEXT,
      reddit_created   TIMESTAMPTZ,
      discovered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      harvested_at     TIMESTAMPTZ,
      processed_at     TIMESTAMPTZ,
      comments         JSONB,
      extraction       JSONB
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reddit_painkillers (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_reddit_id TEXT REFERENCES reddit_threads(reddit_id) ON DELETE CASCADE,
      type             TEXT NOT NULL,
      competitor       TEXT,
      summary          TEXT NOT NULL,
      evidence         TEXT,
      mentions         INTEGER NOT NULL DEFAULT 1,
      sentiment        REAL,
      confidence       REAL NOT NULL DEFAULT 0.5,
      status           TEXT NOT NULL DEFAULT 'new',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS reddit_painkillers_status_idx ON reddit_painkillers(status)`;
  await sql`CREATE INDEX IF NOT EXISTS reddit_painkillers_type_idx ON reddit_painkillers(type)`;
  await sql`CREATE INDEX IF NOT EXISTS reddit_painkillers_thread_idx ON reddit_painkillers(thread_reddit_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS reddit_digests (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      digest_date       DATE NOT NULL UNIQUE,
      thread_count      INTEGER NOT NULL DEFAULT 0,
      painkiller_count  INTEGER NOT NULL DEFAULT 0,
      summary_md        TEXT,
      top_painkillers   JSONB,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subreddits we listen to. Each one represents a developer-audience
// surface where AI-builder pain bubbles up. Keep tight — every extra
// subreddit costs Algolia/Reddit fetches + Haiku tokens.
// ─────────────────────────────────────────────────────────────────────────────
export const REDDIT_SUBS = [
  "SideProject",
  "SaaS",
  "webdev",
  "Entrepreneur",
  "nocode",
  "ChatGPTCoding",
  "ArtificialInteligence", // misspelled on purpose — it's the real subreddit name
];

// Reddit ToS requires a descriptive UA. Don't strip this.
const UA = "Zoobicon-Intel/1.0 (+https://zoobicon.com)";

// Filter keywords — we only extract painkillers from threads that
// actually mention something builder-relevant. Reduces noise from
// generic "what's your stack" posts.
const RELEVANCE_KEYWORDS = [
  "lovable",
  "bolt.new",
  "bolt new",
  "v0.app",
  "v0 ",
  "emergent",
  "vibe coding",
  "ai builder",
  "ai website",
  "ai app builder",
  "cursor",
  "replit agent",
  "no-code ai",
  "claude code",
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RedditPost {
  id: string;
  title: string;
  url: string;
  permalink: string;
  score: number;
  num_comments: number;
  author: string;
  selftext: string;
  created_utc: number;
  subreddit: string;
}

interface RedditPostListing {
  data?: {
    children?: Array<{ kind: string; data: RedditPost }>;
  };
}

interface RedditComment {
  id: string;
  author?: string;
  body?: string;
  score?: number;
  created_utc?: number;
  replies?: RedditListing | "";
}

interface RedditListing {
  kind?: string;
  data?: {
    children?: Array<{ kind: string; data: RedditComment }>;
  };
}

type RedditThreadFetch = [RedditListing, RedditListing];

export type PainkillerType = "pain" | "feature" | "competitor_weakness" | "viral_demo";

export interface ExtractedPainkiller {
  type: PainkillerType;
  competitor: string | null;
  summary: string;
  evidence: string;
  mentions: number;
  sentiment: number;
  confidence: number;
}

export interface RedditPainkillerRow extends ExtractedPainkiller {
  id: string;
  thread_reddit_id: string;
  status: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. POLL — Reddit /r/{sub}/new.json
// ─────────────────────────────────────────────────────────────────────────────

function isRelevant(title: string, body: string): boolean {
  const haystack = `${title}\n${body}`.toLowerCase();
  return RELEVANCE_KEYWORDS.some((k) => haystack.includes(k));
}

export async function pollReddit(): Promise<{ scanned: number; inserted: number }> {
  const sql = getDb();
  if (!sql) return { scanned: 0, inserted: 0 };

  let scanned = 0;
  let inserted = 0;

  for (const sub of REDDIT_SUBS) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/new.json?limit=50`,
        {
          headers: { Accept: "application/json", "User-Agent": UA },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!res.ok) continue;

      const data = (await res.json()) as RedditPostListing;
      const posts = (data.data?.children || []).map((c) => c.data);
      scanned += posts.length;

      for (const p of posts) {
        if (!p?.id || !p.title) continue;
        if (!isRelevant(p.title, p.selftext || "")) continue;
        // Skip threads with no discussion — nothing to extract from
        if ((p.num_comments || 0) < 2) continue;

        try {
          const result = await sql`
            INSERT INTO reddit_threads (
              reddit_id, subreddit, title, url, permalink,
              score, num_comments, author, selftext, reddit_created
            )
            VALUES (
              ${p.id},
              ${p.subreddit || sub},
              ${p.title},
              ${p.url || `https://reddit.com${p.permalink}`},
              ${`https://reddit.com${p.permalink}`},
              ${p.score || 0},
              ${p.num_comments || 0},
              ${p.author || null},
              ${p.selftext || null},
              ${p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null}
            )
            ON CONFLICT (reddit_id) DO UPDATE
              SET score = EXCLUDED.score,
                  num_comments = EXCLUDED.num_comments
            RETURNING (xmax = 0) AS inserted
          `;
          if (Array.isArray(result) && result[0]?.inserted) inserted++;
        } catch (err) {
          console.error(`[reddit-flywheel] insert failed for ${p.id}:`, err);
        }
      }
    } catch (err) {
      console.error(`[reddit-flywheel] poll failed for r/${sub}:`, err);
    }
  }

  return { scanned, inserted };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HARVEST — Reddit returns the comment tree inline. One fetch per thread.
// ─────────────────────────────────────────────────────────────────────────────

function flattenRedditComments(
  listing: RedditListing | "" | undefined,
  out: Array<{ author: string; body: string; score: number }> = [],
  depth = 0,
  cap = 80
): Array<{ author: string; body: string; score: number }> {
  if (!listing || typeof listing === "string" || depth > 4) return out;
  const children = listing.data?.children || [];
  for (const child of children) {
    if (out.length >= cap) return out;
    if (child.kind !== "t1") continue;
    const c = child.data;
    if (c.body && c.body !== "[deleted]" && c.body !== "[removed]") {
      out.push({
        author: c.author || "anon",
        body: c.body,
        score: c.score || 0,
      });
    }
    if (c.replies && typeof c.replies !== "string") {
      flattenRedditComments(c.replies, out, depth + 1, cap);
    }
  }
  return out;
}

export async function harvestNextRedditThreads(
  limit = 5
): Promise<{ harvested: number; failures: number }> {
  const sql = getDb();
  if (!sql) return { harvested: 0, failures: 0 };

  const rows = (await sql`
    SELECT reddit_id, subreddit, num_comments
    FROM reddit_threads
    WHERE harvested_at IS NULL
    ORDER BY num_comments DESC, score DESC
    LIMIT ${limit}
  `) as Array<{ reddit_id: string; subreddit: string; num_comments: number }>;

  let harvested = 0;
  let failures = 0;

  for (const row of rows) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${row.subreddit}/comments/${row.reddit_id}.json?limit=100`,
        {
          headers: { Accept: "application/json", "User-Agent": UA },
          signal: AbortSignal.timeout(12000),
        }
      );
      if (!res.ok) {
        failures++;
        continue;
      }
      // Reddit returns [postListing, commentListing]
      const data = (await res.json()) as RedditThreadFetch;
      const commentListing = Array.isArray(data) ? data[1] : null;
      const comments = commentListing ? flattenRedditComments(commentListing) : [];

      await sql`
        UPDATE reddit_threads
        SET harvested_at = NOW(),
            comments = ${JSON.stringify(comments)}::jsonb
        WHERE reddit_id = ${row.reddit_id}
      `;
      harvested++;
    } catch (err) {
      failures++;
      console.error(`[reddit-flywheel] harvest failed for ${row.reddit_id}:`, err);
    }
  }

  return { harvested, failures };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXTRACT — same Haiku prompt as HN (the format is source-agnostic)
// ─────────────────────────────────────────────────────────────────────────────

const EXTRACTOR_SYSTEM = `You are a product intelligence analyst for an AI website builder called Zoobicon.

You read Reddit threads about competitor AI builders (Lovable, Bolt, v0, Emergent, Cursor, Replit) and extract actionable signal for our roadmap.

Output STRICT JSON only — no preamble, no markdown fences. Schema:

{
  "painkillers": [
    {
      "type": "pain" | "feature" | "competitor_weakness" | "viral_demo",
      "competitor": "Lovable" | "Bolt" | "v0" | "Emergent" | "Cursor" | "Replit" | null,
      "summary": "one-sentence punchy summary, max 140 chars",
      "evidence": "the most representative direct quote from comments, max 280 chars",
      "mentions": <integer — how many distinct commenters raised this>,
      "sentiment": <number from -1 (deeply negative) to 1 (deeply positive)>,
      "confidence": <number from 0 to 1 — how confident you are this is real signal not noise>
    }
  ]
}

Type definitions:
- "pain" — users are frustrated with how AI builders work today (any/all of them)
- "feature" — users wish a feature existed that nobody currently has
- "competitor_weakness" — specific complaint about a named competitor we could exploit
- "viral_demo" — someone shipped something jaw-dropping with an AI builder that we should match

Rules:
- Only include items with confidence >= 0.5 — silence is better than noise
- Skip items with mentions = 1 unless the single comment is exceptionally specific
- Cap output at 8 items per thread — pick the strongest
- Return {"painkillers": []} if nothing rises above the noise floor
`;

export async function extractFromRedditThread(redditId: string): Promise<{
  extracted: number;
  skipped: boolean;
  reason?: string;
}> {
  const sql = getDb();
  if (!sql) return { extracted: 0, skipped: true, reason: "no db" };

  const rows = (await sql`
    SELECT reddit_id, title, selftext, comments
    FROM reddit_threads
    WHERE reddit_id = ${redditId}
      AND harvested_at IS NOT NULL
      AND processed_at IS NULL
    LIMIT 1
  `) as Array<{
    reddit_id: string;
    title: string;
    selftext: string | null;
    comments: Array<{ author: string; body: string; score: number }> | null;
  }>;

  if (rows.length === 0)
    return { extracted: 0, skipped: true, reason: "not found or already processed" };
  const thread = rows[0];

  const comments = thread.comments || [];
  if (comments.length < 2) {
    await sql`UPDATE reddit_threads SET processed_at = NOW(), extraction = '{"painkillers":[]}'::jsonb WHERE reddit_id = ${redditId}`;
    return { extracted: 0, skipped: true, reason: "thread too thin" };
  }

  // Build a clean transcript, top-scoring comments first
  const sorted = [...comments].sort((a, b) => b.score - a.score);
  const lines: string[] = [];
  if (thread.selftext) {
    lines.push(`OP BODY: ${thread.selftext.slice(0, 1500)}`);
  }
  for (const c of sorted) {
    lines.push(`- (${c.score}⇧ ${c.author}): ${c.body.slice(0, 600)}`);
  }
  const transcript = lines.join("\n").slice(0, 24000);
  const userMessage = `THREAD TITLE: ${thread.title}\n\n${transcript}`;

  let parsed: { painkillers?: ExtractedPainkiller[] } = {};
  try {
    const res = await callLLMWithFailover({
      model: "claude-haiku-4-5-20251001",
      system: EXTRACTOR_SYSTEM,
      userMessage,
      maxTokens: 2000,
    });
    const text = res.text.trim();
    const json = text.replace(/^```(?:json)?\n?|\n?```$/g, "");
    parsed = JSON.parse(json);
  } catch (err) {
    await sql`UPDATE reddit_threads SET processed_at = NOW(), extraction = ${JSON.stringify({ error: String(err) })}::jsonb WHERE reddit_id = ${redditId}`;
    return { extracted: 0, skipped: true, reason: `llm/parse: ${err instanceof Error ? err.message : String(err)}` };
  }

  const painkillers = (parsed.painkillers || []).filter(
    (p) => p && typeof p.confidence === "number" && p.confidence >= 0.5
  );

  for (const p of painkillers) {
    try {
      await sql`
        INSERT INTO reddit_painkillers (
          thread_reddit_id, type, competitor, summary, evidence,
          mentions, sentiment, confidence
        )
        VALUES (
          ${redditId},
          ${p.type},
          ${p.competitor},
          ${p.summary},
          ${p.evidence},
          ${p.mentions || 1},
          ${typeof p.sentiment === "number" ? p.sentiment : 0},
          ${p.confidence}
        )
      `;
    } catch (err) {
      console.error(`[reddit-flywheel] painkiller insert failed:`, err);
    }
  }

  await sql`
    UPDATE reddit_threads
    SET processed_at = NOW(),
        extraction = ${JSON.stringify({ count: painkillers.length })}::jsonb
    WHERE reddit_id = ${redditId}
  `;

  return { extracted: painkillers.length, skipped: false };
}

export async function extractNextRedditThreads(
  limit = 5
): Promise<{ processed: number; extracted: number }> {
  const sql = getDb();
  if (!sql) return { processed: 0, extracted: 0 };

  const rows = (await sql`
    SELECT reddit_id FROM reddit_threads
    WHERE harvested_at IS NOT NULL AND processed_at IS NULL
    ORDER BY num_comments DESC
    LIMIT ${limit}
  `) as Array<{ reddit_id: string }>;

  let processed = 0;
  let extracted = 0;

  for (const row of rows) {
    const result = await extractFromRedditThread(row.reddit_id);
    processed += 1;
    extracted += result.extracted;
  }

  return { processed, extracted };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DIGEST — same structure as HN, separate digest table
// ─────────────────────────────────────────────────────────────────────────────

export async function buildRedditDigest(date = new Date()): Promise<{
  threadCount: number;
  painkillerCount: number;
  summary: string;
}> {
  const sql = getDb();
  if (!sql) return { threadCount: 0, painkillerCount: 0, summary: "" };

  const since = new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const isoDate = date.toISOString().slice(0, 10);

  const threadCountRows = (await sql`
    SELECT COUNT(*)::int AS n
    FROM reddit_threads
    WHERE discovered_at >= ${since}
  `) as Array<{ n: number }>;
  const threadCount = threadCountRows[0]?.n || 0;

  const painkillers = (await sql`
    SELECT p.*, t.title AS thread_title, t.url AS thread_url, t.subreddit
    FROM reddit_painkillers p
    JOIN reddit_threads t ON t.reddit_id = p.thread_reddit_id
    WHERE p.created_at >= ${since}
    ORDER BY (p.mentions * p.confidence) DESC, p.confidence DESC
    LIMIT 50
  `) as Array<
    RedditPainkillerRow & {
      thread_title: string;
      thread_url: string;
      subreddit: string;
    }
  >;

  const painkillerCount = painkillers.length;
  const byType: Record<PainkillerType, typeof painkillers> = {
    pain: [],
    feature: [],
    competitor_weakness: [],
    viral_demo: [],
  };
  for (const p of painkillers) {
    if (byType[p.type]) byType[p.type].push(p);
  }

  const lines: string[] = [];
  lines.push(`# Reddit Flywheel — ${isoDate}`);
  lines.push("");
  lines.push(
    `**${threadCount} new threads scanned · ${painkillerCount} painkillers extracted**`
  );
  lines.push("");

  const sections: Array<[string, PainkillerType]> = [
    ["🩹 Top pain points", "pain"],
    ["⭐ Feature requests (no competitor has these)", "feature"],
    ["🎯 Competitor weaknesses we can exploit", "competitor_weakness"],
    ["🚀 Viral demos to study + match", "viral_demo"],
  ];

  for (const [heading, type] of sections) {
    const items = byType[type].slice(0, 10);
    if (items.length === 0) continue;
    lines.push(`## ${heading}`);
    lines.push("");
    for (const p of items) {
      const tag = p.competitor ? ` _(${p.competitor})_` : "";
      const score = `conf ${p.confidence.toFixed(2)}, ${p.mentions}× mentions`;
      lines.push(`- **${p.summary}**${tag} — \`${score}\` _r/${p.subreddit}_`);
      if (p.evidence) lines.push(`  > _${p.evidence}_`);
      lines.push(`  [thread](${p.thread_url})`);
      lines.push("");
    }
  }

  if (painkillerCount === 0) {
    lines.push("");
    lines.push("_No new signal above the confidence threshold today. Quiet day on Reddit._");
  }

  const summary = lines.join("\n");

  await sql`
    INSERT INTO reddit_digests (digest_date, thread_count, painkiller_count, summary_md, top_painkillers)
    VALUES (${isoDate}, ${threadCount}, ${painkillerCount}, ${summary}, ${JSON.stringify(painkillers.slice(0, 20))}::jsonb)
    ON CONFLICT (digest_date) DO UPDATE
      SET thread_count = EXCLUDED.thread_count,
          painkiller_count = EXCLUDED.painkiller_count,
          summary_md = EXCLUDED.summary_md,
          top_painkillers = EXCLUDED.top_painkillers
  `;

  return { threadCount, painkillerCount, summary };
}

// ─────────────────────────────────────────────────────────────────────────────
// Read-side helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function getLatestRedditDigest(): Promise<{
  digest_date: string;
  thread_count: number;
  painkiller_count: number;
  summary_md: string;
  top_painkillers: unknown;
  created_at: string;
} | null> {
  const sql = getDb();
  if (!sql) return null;
  const rows = (await sql`
    SELECT digest_date, thread_count, painkiller_count, summary_md, top_painkillers, created_at
    FROM reddit_digests
    ORDER BY digest_date DESC
    LIMIT 1
  `) as Array<{
    digest_date: string;
    thread_count: number;
    painkiller_count: number;
    summary_md: string;
    top_painkillers: unknown;
    created_at: string;
  }>;
  return rows[0] || null;
}

export async function listRecentRedditPainkillers(
  limit = 50,
  status?: string
): Promise<
  Array<
    RedditPainkillerRow & {
      thread_title: string;
      thread_url: string;
      subreddit: string;
    }
  >
> {
  const sql = getDb();
  if (!sql) return [];
  const rows = status
    ? ((await sql`
        SELECT p.*, t.title AS thread_title, t.url AS thread_url, t.subreddit
        FROM reddit_painkillers p
        JOIN reddit_threads t ON t.reddit_id = p.thread_reddit_id
        WHERE p.status = ${status}
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `) as Array<
        RedditPainkillerRow & {
          thread_title: string;
          thread_url: string;
          subreddit: string;
        }
      >)
    : ((await sql`
        SELECT p.*, t.title AS thread_title, t.url AS thread_url, t.subreddit
        FROM reddit_painkillers p
        JOIN reddit_threads t ON t.reddit_id = p.thread_reddit_id
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `) as Array<
        RedditPainkillerRow & {
          thread_title: string;
          thread_url: string;
          subreddit: string;
        }
      >);
  return rows;
}

export async function setRedditPainkillerStatus(id: string, status: string): Promise<void> {
  const sql = getDb();
  if (!sql) return;
  await sql`UPDATE reddit_painkillers SET status = ${status} WHERE id = ${id}::uuid`;
}
