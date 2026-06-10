/**
 * HN FLYWHEEL — daily painkiller intelligence from Hacker News.
 *
 * Pipeline:
 *   poll → harvest → extract → digest
 *
 *   poll      Query Algolia HN Search for stories matching our competitor
 *             + builder keywords. Insert new rows into hn_threads.
 *   harvest   For unharvested threads, fetch the comment tree from the
 *             official Firebase HN API. Store as JSONB.
 *   extract   For harvested-but-unprocessed threads, run Claude Haiku
 *             over the comment tree and pull out pain points, feature
 *             requests, competitor weaknesses, and viral demos with a
 *             confidence score on each. Write to hn_painkillers.
 *   digest    Aggregate the last 24h of new painkillers into a single
 *             hn_digests row with markdown summary + top items.
 *
 * Why two-stage (poll → harvest separately): comment trees can be deep.
 * Polling stays fast and idempotent; harvesting can run separately and
 * skip threads that already have a tree.
 *
 * Rule 28 (proactive competitive intelligence) compliance.
 * Rule 30 (KILLER-MOVES contract) — this is the HN slot of the flywheel.
 */

import { neon } from "@neondatabase/serverless";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { sendEmail, emailSendAvailable } from "@/lib/email-send";

// ─────────────────────────────────────────────────────────────────────────────
// DB
// ─────────────────────────────────────────────────────────────────────────────

function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function ensureHnTables(): Promise<void> {
  const sql = getDb();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS hn_threads (
      hn_id          BIGINT PRIMARY KEY,
      title          TEXT NOT NULL,
      url            TEXT,
      points         INTEGER NOT NULL DEFAULT 0,
      num_comments   INTEGER NOT NULL DEFAULT 0,
      author         TEXT,
      story_text     TEXT,
      hn_created_at  TIMESTAMPTZ,
      query          TEXT NOT NULL,
      discovered_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      harvested_at   TIMESTAMPTZ,
      processed_at   TIMESTAMPTZ,
      comment_tree   JSONB,
      extraction     JSONB
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS hn_painkillers (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_hn_id   BIGINT REFERENCES hn_threads(hn_id) ON DELETE CASCADE,
      type           TEXT NOT NULL,
      competitor     TEXT,
      summary        TEXT NOT NULL,
      evidence       TEXT,
      mentions       INTEGER NOT NULL DEFAULT 1,
      sentiment      REAL,
      confidence     REAL NOT NULL DEFAULT 0.5,
      status         TEXT NOT NULL DEFAULT 'new',
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS hn_painkillers_status_idx ON hn_painkillers(status)`;
  await sql`CREATE INDEX IF NOT EXISTS hn_painkillers_type_idx ON hn_painkillers(type)`;
  await sql`CREATE INDEX IF NOT EXISTS hn_painkillers_thread_idx ON hn_painkillers(thread_hn_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS hn_digests (
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
// Queries — the universe we listen to
// ─────────────────────────────────────────────────────────────────────────────

// Keep the list tight. Each query fires an Algolia search; broad terms
// like "AI" alone would drown the digest in noise. Targets are: direct
// competitors, the "vibe coding" wave, and category terms with a strong
// builder signal.
export const HN_QUERIES = [
  "AI website builder",
  "AI app builder",
  "Lovable AI",
  "Bolt.new",
  "v0 vercel",
  "v0.app",
  "Emergent vibe coding",
  "vibe coding",
  "Cursor AI builder",
  "Replit AI",
  "Claude builder",
  "GPT website builder",
  "no-code AI app",
];

// Competitor canonical names — used to bucket painkillers by target
export const TRACKED_COMPETITORS = [
  "Lovable",
  "Bolt",
  "v0",
  "Emergent",
  "Cursor",
  "Replit",
  "Stitch",
];

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AlgoliaHit {
  objectID: string;
  title: string | null;
  story_title: string | null;
  url: string | null;
  points: number | null;
  num_comments: number | null;
  author: string | null;
  story_text: string | null;
  created_at: string | null;
}

interface HNComment {
  id: number;
  by?: string;
  text?: string;
  time?: number;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
  children?: HNComment[];
}

export interface HNThread {
  hn_id: number;
  title: string;
  url: string | null;
  points: number;
  num_comments: number;
  author: string | null;
  story_text: string | null;
  hn_created_at: string | null;
  query: string;
  discovered_at: string;
  harvested_at: string | null;
  processed_at: string | null;
}

export type PainkillerType = "pain" | "feature" | "competitor_weakness" | "viral_demo";

export interface ExtractedPainkiller {
  type: PainkillerType;
  competitor: string | null;
  summary: string;
  evidence: string;
  mentions: number;
  sentiment: number; // -1 to 1
  confidence: number; // 0 to 1
}

export interface PainkillerRow extends ExtractedPainkiller {
  id: string;
  thread_hn_id: number;
  status: string;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. POLL — Algolia HN Search for relevant stories
// ─────────────────────────────────────────────────────────────────────────────

export async function pollHN(): Promise<{ scanned: number; inserted: number }> {
  const sql = getDb();
  if (!sql) return { scanned: 0, inserted: 0 };

  let scanned = 0;
  let inserted = 0;

  for (const query of HN_QUERIES) {
    try {
      const encoded = encodeURIComponent(query);
      const url = `https://hn.algolia.com/api/v1/search?query=${encoded}&tags=story&hitsPerPage=20`;

      const res = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;

      const data = (await res.json()) as { hits?: AlgoliaHit[] };
      const hits = data.hits || [];
      scanned += hits.length;

      for (const hit of hits) {
        const title = hit.title || hit.story_title;
        if (!title) continue;

        // Stories with no engagement aren't worth processing
        const points = hit.points || 0;
        const numComments = hit.num_comments || 0;
        if (points < 3 && numComments < 2) continue;

        try {
          const result = await sql`
            INSERT INTO hn_threads (
              hn_id, title, url, points, num_comments, author,
              story_text, hn_created_at, query
            )
            VALUES (
              ${Number(hit.objectID)},
              ${title},
              ${hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`},
              ${points},
              ${numComments},
              ${hit.author},
              ${hit.story_text},
              ${hit.created_at},
              ${query}
            )
            ON CONFLICT (hn_id) DO UPDATE
              SET points = EXCLUDED.points,
                  num_comments = EXCLUDED.num_comments
            RETURNING (xmax = 0) AS inserted
          `;
          if (Array.isArray(result) && result[0]?.inserted) inserted++;
        } catch (err) {
          console.error(`[hn-flywheel] insert failed for ${hit.objectID}:`, err);
        }
      }
    } catch (err) {
      console.error(`[hn-flywheel] query "${query}" failed:`, err);
    }
  }

  return { scanned, inserted };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HARVEST — pull comment tree from Firebase HN API
// ─────────────────────────────────────────────────────────────────────────────

async function fetchHNItem(id: number): Promise<HNComment | null> {
  try {
    const res = await fetch(
      `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as HNComment | null;
    return data;
  } catch {
    return null;
  }
}

// Recursive comment fetch with depth + breadth caps so we don't fan
// out into a 5-minute job on a viral 800-comment thread.
async function fetchCommentTree(
  ids: number[],
  depth: number,
  maxDepth: number,
  budgetRef: { left: number }
): Promise<HNComment[]> {
  if (depth >= maxDepth || budgetRef.left <= 0) return [];

  const out: HNComment[] = [];
  // Cap fan-out per level so a thread with 200 top-level replies doesn't
  // blow the budget on one node.
  const slice = ids.slice(0, depth === 0 ? 40 : 8);

  const results = await Promise.all(slice.map((id) => fetchHNItem(id)));

  for (const item of results) {
    if (budgetRef.left <= 0) break;
    if (!item || item.deleted || item.dead) continue;
    budgetRef.left -= 1;

    const children = item.kids
      ? await fetchCommentTree(item.kids, depth + 1, maxDepth, budgetRef)
      : [];

    out.push({
      id: item.id,
      by: item.by,
      text: item.text,
      time: item.time,
      kids: item.kids,
      children,
    });
  }

  return out;
}

export async function harvestNextThreads(
  limit = 5
): Promise<{ harvested: number; failures: number }> {
  const sql = getDb();
  if (!sql) return { harvested: 0, failures: 0 };

  // Pick the highest-engagement unharvested threads first
  const rows = (await sql`
    SELECT hn_id, num_comments
    FROM hn_threads
    WHERE harvested_at IS NULL
    ORDER BY num_comments DESC, points DESC
    LIMIT ${limit}
  `) as Array<{ hn_id: number; num_comments: number }>;

  let harvested = 0;
  let failures = 0;

  for (const row of rows) {
    try {
      const story = await fetchHNItem(row.hn_id);
      if (!story) {
        failures++;
        continue;
      }

      const budgetRef = { left: 120 };
      const tree = story.kids
        ? await fetchCommentTree(story.kids, 0, 3, budgetRef)
        : [];

      await sql`
        UPDATE hn_threads
        SET harvested_at = NOW(),
            comment_tree = ${JSON.stringify(tree)}::jsonb
        WHERE hn_id = ${row.hn_id}
      `;
      harvested++;
    } catch (err) {
      failures++;
      console.error(`[hn-flywheel] harvest failed for ${row.hn_id}:`, err);
    }
  }

  return { harvested, failures };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXTRACT — Claude Haiku → structured painkillers
// ─────────────────────────────────────────────────────────────────────────────

function flattenComments(tree: HNComment[], out: string[] = [], depth = 0): string[] {
  for (const node of tree) {
    if (node.text) {
      // Strip HTML — Algolia returns raw text but Firebase returns
      // sanitised HTML (<p>, <i>, <a>). Quick strip is enough for LLM input.
      const text = node.text
        .replace(/<[^>]+>/g, " ")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
      if (text) {
        out.push(`${"  ".repeat(depth)}- ${text.slice(0, 600)}`);
      }
    }
    if (node.children?.length) flattenComments(node.children, out, depth + 1);
  }
  return out;
}

const EXTRACTOR_SYSTEM = `You are a product intelligence analyst for an AI website builder called Zoobicon.

You read Hacker News comment threads about competitor AI builders (Lovable, Bolt, v0, Emergent, Cursor, Replit) and extract actionable signal for our roadmap.

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

export async function extractFromThread(hnId: number): Promise<{
  extracted: number;
  skipped: boolean;
  reason?: string;
}> {
  const sql = getDb();
  if (!sql) return { extracted: 0, skipped: true, reason: "no db" };

  const rows = (await sql`
    SELECT hn_id, title, comment_tree
    FROM hn_threads
    WHERE hn_id = ${hnId}
      AND harvested_at IS NOT NULL
      AND processed_at IS NULL
    LIMIT 1
  `) as Array<{ hn_id: number; title: string; comment_tree: HNComment[] | null }>;

  if (rows.length === 0) return { extracted: 0, skipped: true, reason: "not found or already processed" };
  const thread = rows[0];

  const tree = thread.comment_tree || [];
  const lines = flattenComments(tree);
  if (lines.length < 3) {
    await sql`UPDATE hn_threads SET processed_at = NOW(), extraction = '{"painkillers":[]}'::jsonb WHERE hn_id = ${hnId}`;
    return { extracted: 0, skipped: true, reason: "thread too thin" };
  }

  // Trim to a sane LLM budget — Haiku context is huge but we pay per token
  const transcript = lines.join("\n").slice(0, 24000);
  const userMessage = `THREAD TITLE: ${thread.title}\n\nCOMMENTS:\n${transcript}`;

  let parsed: { painkillers?: ExtractedPainkiller[] } = {};
  try {
    const res = await callLLMWithFailover({
      model: "claude-haiku-4-5-20251001",
      system: EXTRACTOR_SYSTEM,
      userMessage,
      maxTokens: 2000,
    });
    const text = res.text.trim();
    // Strip accidental fences if the model wraps anyway
    const json = text.replace(/^```(?:json)?\n?|\n?```$/g, "");
    parsed = JSON.parse(json);
  } catch (err) {
    await sql`UPDATE hn_threads SET processed_at = NOW(), extraction = ${JSON.stringify({ error: String(err) })}::jsonb WHERE hn_id = ${hnId}`;
    return { extracted: 0, skipped: true, reason: `llm/parse: ${err instanceof Error ? err.message : String(err)}` };
  }

  const painkillers = (parsed.painkillers || []).filter(
    (p) => p && typeof p.confidence === "number" && p.confidence >= 0.5
  );

  for (const p of painkillers) {
    try {
      await sql`
        INSERT INTO hn_painkillers (
          thread_hn_id, type, competitor, summary, evidence,
          mentions, sentiment, confidence
        )
        VALUES (
          ${hnId},
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
      console.error(`[hn-flywheel] painkiller insert failed:`, err);
    }
  }

  await sql`
    UPDATE hn_threads
    SET processed_at = NOW(),
        extraction = ${JSON.stringify({ count: painkillers.length })}::jsonb
    WHERE hn_id = ${hnId}
  `;

  return { extracted: painkillers.length, skipped: false };
}

export async function extractNextThreads(
  limit = 5
): Promise<{ processed: number; extracted: number }> {
  const sql = getDb();
  if (!sql) return { processed: 0, extracted: 0 };

  const rows = (await sql`
    SELECT hn_id FROM hn_threads
    WHERE harvested_at IS NOT NULL AND processed_at IS NULL
    ORDER BY num_comments DESC
    LIMIT ${limit}
  `) as Array<{ hn_id: number }>;

  let processed = 0;
  let extracted = 0;

  for (const row of rows) {
    const result = await extractFromThread(row.hn_id);
    processed += 1;
    extracted += result.extracted;
  }

  return { processed, extracted };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. DIGEST — aggregate last 24h
// ─────────────────────────────────────────────────────────────────────────────

export async function buildDigest(date = new Date()): Promise<{
  threadCount: number;
  painkillerCount: number;
  summary: string;
}> {
  const sql = getDb();
  if (!sql) return { threadCount: 0, painkillerCount: 0, summary: "" };

  // last 24h window
  const since = new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const isoDate = date.toISOString().slice(0, 10);

  const threadCountRows = (await sql`
    SELECT COUNT(*)::int AS n
    FROM hn_threads
    WHERE discovered_at >= ${since}
  `) as Array<{ n: number }>;
  const threadCount = threadCountRows[0]?.n || 0;

  const painkillers = (await sql`
    SELECT p.*, t.title AS thread_title, t.url AS thread_url
    FROM hn_painkillers p
    JOIN hn_threads t ON t.hn_id = p.thread_hn_id
    WHERE p.created_at >= ${since}
    ORDER BY (p.mentions * p.confidence) DESC, p.confidence DESC
    LIMIT 50
  `) as Array<
    PainkillerRow & { thread_title: string; thread_url: string }
  >;

  const painkillerCount = painkillers.length;

  // Bucket by type
  const byType: Record<PainkillerType, typeof painkillers> = {
    pain: [],
    feature: [],
    competitor_weakness: [],
    viral_demo: [],
  };
  for (const p of painkillers) {
    if (byType[p.type]) byType[p.type].push(p);
  }

  // Build markdown digest
  const lines: string[] = [];
  lines.push(`# HN Flywheel — ${isoDate}`);
  lines.push("");
  lines.push(`**${threadCount} new threads scanned · ${painkillerCount} painkillers extracted**`);
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
      lines.push(`- **${p.summary}**${tag} — \`${score}\``);
      if (p.evidence) lines.push(`  > _${p.evidence}_`);
      lines.push(`  [thread](${p.thread_url})`);
      lines.push("");
    }
  }

  if (painkillerCount === 0) {
    lines.push("");
    lines.push("_No new signal above the confidence threshold today. Quiet day on HN._");
  }

  const summary = lines.join("\n");

  await sql`
    INSERT INTO hn_digests (digest_date, thread_count, painkiller_count, summary_md, top_painkillers)
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
// Read-side helpers for the admin dashboard
// ─────────────────────────────────────────────────────────────────────────────

export async function getLatestDigest(): Promise<{
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
    FROM hn_digests
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

export async function listRecentPainkillers(
  limit = 50,
  status?: string
): Promise<Array<PainkillerRow & { thread_title: string; thread_url: string }>> {
  const sql = getDb();
  if (!sql) return [];
  const rows = status
    ? ((await sql`
        SELECT p.*, t.title AS thread_title, t.url AS thread_url
        FROM hn_painkillers p
        JOIN hn_threads t ON t.hn_id = p.thread_hn_id
        WHERE p.status = ${status}
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `) as Array<PainkillerRow & { thread_title: string; thread_url: string }>)
    : ((await sql`
        SELECT p.*, t.title AS thread_title, t.url AS thread_url
        FROM hn_painkillers p
        JOIN hn_threads t ON t.hn_id = p.thread_hn_id
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `) as Array<PainkillerRow & { thread_title: string; thread_url: string }>);
  return rows;
}

export async function setPainkillerStatus(id: string, status: string): Promise<void> {
  const sql = getDb();
  if (!sql) return;
  await sql`UPDATE hn_painkillers SET status = ${status} WHERE id = ${id}::uuid`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. EMAIL — send the daily digest via Vapron email service
// ─────────────────────────────────────────────────────────────────────────────

// Tiny purpose-built markdown → HTML for the constrained digest format
// (h1/h2, bullets, blockquotes, bold, italic, links). Keeps the dep
// surface zero — no `marked` / `markdown-it` pulled in just for this.
function digestMarkdownToHtml(md: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  const renderInline = (s: string): string => {
    let r = escape(s);
    // links [text](url)
    r = r.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_m, text: string, url: string) =>
        `<a href="${url}" style="color:#8c6b25;text-decoration:underline">${text}</a>`
    );
    // bold **text**
    r = r.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // italic _text_
    r = r.replace(/(^|\s)_([^_]+)_/g, "$1<em>$2</em>");
    // inline code `text`
    r = r.replace(
      /`([^`]+)`/g,
      '<code style="background:#f4f3ed;padding:1px 5px;border-radius:4px;font-size:0.92em">$1</code>'
    );
    return r;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    if (line.startsWith("# ")) {
      closeList();
      out.push(
        `<h1 style="font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#0a0a0b;margin:24px 0 12px">${renderInline(line.slice(2))}</h1>`
      );
    } else if (line.startsWith("## ")) {
      closeList();
      out.push(
        `<h2 style="font-size:16px;font-weight:600;letter-spacing:-0.01em;color:#0a0a0b;margin:28px 0 8px;padding-top:12px;border-top:1px solid #e8e6dc">${renderInline(line.slice(3))}</h2>`
      );
    } else if (line.startsWith("- ")) {
      if (!inList) {
        out.push('<ul style="padding-left:18px;margin:8px 0">');
        inList = true;
      }
      out.push(
        `<li style="margin:6px 0;line-height:1.55;color:#36363a">${renderInline(line.slice(2))}</li>`
      );
    } else if (line.startsWith("  > ")) {
      // continuation blockquote — folded under the previous list item
      out.push(
        `<div style="margin:4px 0 8px 20px;padding:6px 12px;border-left:2px solid #c9a961;color:#6b6b70;font-style:italic;font-size:13px">${renderInline(line.slice(4))}</div>`
      );
    } else if (line.startsWith("  ")) {
      // sub-paragraph for list item (e.g. the thread link line)
      out.push(
        `<div style="margin:2px 0 6px 20px;color:#9b9ba0;font-size:12px">${renderInline(line.trim())}</div>`
      );
    } else {
      closeList();
      out.push(
        `<p style="margin:8px 0;line-height:1.6;color:#36363a">${renderInline(line)}</p>`
      );
    }
  }
  closeList();

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#fafaf7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:32px 24px;background:#fafaf7">
    <div style="padding:32px;background:#ffffff;border:1px solid #e8e6dc;border-radius:16px">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.22em;font-weight:600;color:#8c6b25;margin-bottom:4px">Intel Flywheel · HN</div>
      ${out.join("\n")}
    </div>
    <div style="text-align:center;padding:16px;font-size:11px;color:#9b9ba0">
      Zoobicon · <a href="https://zoobicon.com/admin/intel/hn" style="color:#8c6b25">Open the dashboard</a>
    </div>
  </div>
</body></html>`;
}

export async function sendDigestEmail(opts?: {
  to?: string;
  date?: Date;
}): Promise<{ ok: boolean; sent: boolean; reason?: string }> {
  if (!emailSendAvailable()) {
    return { ok: false, sent: false, reason: "EMAIL_SEND_TOKEN not configured" };
  }

  const to = opts?.to || process.env.ADMIN_NOTIFY_EMAIL || "admin@zoobicon.com";
  const digest = await getLatestDigest();
  if (!digest) {
    return { ok: false, sent: false, reason: "no digest available — run the pipeline first" };
  }

  // Skip if the latest digest isn't from today's window — avoids
  // re-sending yesterday's news if the pipeline didn't run.
  const targetDate = (opts?.date || new Date()).toISOString().slice(0, 10);
  if (digest.digest_date !== targetDate) {
    return {
      ok: false,
      sent: false,
      reason: `latest digest is ${digest.digest_date}, not today (${targetDate})`,
    };
  }

  const html = digestMarkdownToHtml(digest.summary_md);
  const subject = `HN Flywheel · ${digest.digest_date} · ${digest.painkiller_count} painkillers from ${digest.thread_count} threads`;

  const result = await sendEmail({
    to,
    subject,
    html,
    text: digest.summary_md,
    // Idempotency key — Vapron deduplicates within 24h, so even if
    // the cron runs twice the same morning, only one email lands.
    messageId: `hn-digest-${digest.digest_date}-${to}`,
  });

  return {
    ok: result.ok,
    sent: result.ok,
    reason: result.ok ? undefined : result.error,
  };
}
