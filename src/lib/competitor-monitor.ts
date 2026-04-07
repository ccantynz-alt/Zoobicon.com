import { sql } from "./db";
import crypto from "crypto";

export interface Competitor {
  id: string;
  user_id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface Snapshot {
  id: string;
  competitor_id: string;
  html_hash: string;
  title: string;
  meta: Record<string, string>;
  pricing: string[];
  features: string[];
  captured_at: string;
}

export interface Diff {
  added: string[];
  removed: string[];
  changed: string[];
}

export interface Summary {
  summary: string;
  threat: "low" | "medium" | "high";
}

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS competitor_snapshots (
    id TEXT PRIMARY KEY,
    competitor_id TEXT NOT NULL,
    html_hash TEXT NOT NULL,
    title TEXT NOT NULL,
    meta JSONB NOT NULL,
    pricing JSONB NOT NULL,
    features JSONB NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  schemaReady = true;
}

function rid(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

export async function trackCompetitor(input: {
  userId: string;
  name: string;
  url: string;
}): Promise<Competitor> {
  await ensureSchema();
  const id = rid("cmp");
  const rows = (await sql`INSERT INTO competitors (id, user_id, name, url)
    VALUES (${id}, ${input.userId}, ${input.name}, ${input.url})
    RETURNING *`) as Competitor[];
  return rows[0];
}

export async function listCompetitors(userId: string): Promise<Competitor[]> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM competitors WHERE user_id = ${userId} ORDER BY created_at DESC`) as Competitor[];
  return rows;
}

function extractAll(re: RegExp, html: string): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    if (typeof m[1] === "string") out.push(m[1].trim());
  }
  return out;
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function parseHtml(html: string): {
  title: string;
  meta: Record<string, string>;
  h1: string[];
  pricing: string[];
  features: string[];
} {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const title = titleMatch && titleMatch[1] ? stripTags(titleMatch[1]) : "";

  const meta: Record<string, string> = {};
  const metaRe = /<meta\s+[^>]*name=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let mm: RegExpExecArray | null;
  while ((mm = metaRe.exec(html)) !== null) {
    if (mm[1] && mm[2]) meta[mm[1]] = mm[2];
  }
  const ogRe = /<meta\s+[^>]*property=["'](og:[^"']+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  while ((mm = ogRe.exec(html)) !== null) {
    if (mm[1] && mm[2]) meta[mm[1]] = mm[2];
  }

  const h1 = extractAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, html).map(stripTags).filter(Boolean);

  const pricing = Array.from(
    new Set(
      (html.match(/\$\s?\d{1,5}(?:[.,]\d{1,2})?(?:\s?\/\s?(?:mo|month|yr|year|user))?/gi) || []).map((s) =>
        s.trim()
      )
    )
  );

  const features = Array.from(
    new Set(extractAll(/<li[^>]*>([\s\S]*?)<\/li>/gi, html).map(stripTags).filter((s) => s.length > 5 && s.length < 200))
  ).slice(0, 100);

  return { title, meta, h1, pricing, features };
}

export async function crawlCompetitor(id: string): Promise<Snapshot> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM competitors WHERE id = ${id}`) as Competitor[];
  const comp = rows[0];
  if (!comp) throw new Error("Competitor not found");

  const res = await fetch(comp.url, {
    headers: { "User-Agent": "ZoobiconCompetitorMonitor/1.0" },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  const parsed = parseHtml(html);
  const hash = crypto.createHash("sha256").update(html).digest("hex");

  const snapId = rid("snap");
  const inserted = (await sql`INSERT INTO competitor_snapshots
    (id, competitor_id, html_hash, title, meta, pricing, features)
    VALUES (${snapId}, ${id}, ${hash}, ${parsed.title},
      ${JSON.stringify(parsed.meta)}::jsonb,
      ${JSON.stringify(parsed.pricing)}::jsonb,
      ${JSON.stringify([...parsed.h1, ...parsed.features])}::jsonb)
    RETURNING *`) as Snapshot[];
  return inserted[0];
}

export async function diffCompetitor(id: string): Promise<Diff> {
  await ensureSchema();
  const snaps = (await sql`SELECT * FROM competitor_snapshots
    WHERE competitor_id = ${id}
    ORDER BY captured_at DESC LIMIT 2`) as Snapshot[];
  if (snaps.length < 2) return { added: [], removed: [], changed: [] };
  const [latest, prev] = snaps;

  const latestFeatures = new Set<string>(latest.features);
  const prevFeatures = new Set<string>(prev.features);
  const added = [...latestFeatures].filter((f) => !prevFeatures.has(f));
  const removed = [...prevFeatures].filter((f) => !latestFeatures.has(f));

  const changed: string[] = [];
  if (latest.title !== prev.title) changed.push(`title: "${prev.title}" -> "${latest.title}"`);
  const latestPricing = JSON.stringify(latest.pricing);
  const prevPricing = JSON.stringify(prev.pricing);
  if (latestPricing !== prevPricing) changed.push(`pricing changed`);

  return { added, removed, changed };
}

export async function summarizeChanges(diff: Diff): Promise<Summary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");

  const prompt = `You are a competitive intelligence analyst. Given this diff of a competitor website, write a 2-3 sentence plain-English summary and assess threat level (low/medium/high).

Added features: ${JSON.stringify(diff.added.slice(0, 20))}
Removed features: ${JSON.stringify(diff.removed.slice(0, 20))}
Changes: ${JSON.stringify(diff.changed)}

Respond with JSON only: {"summary": "...", "threat": "low|medium|high"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
  const data = (await res.json()) as { content: Array<{ text: string }> };
  const text = data.content[0]?.text || "{}";
  const jsonMatch = /\{[\s\S]*\}/.exec(text);
  if (!jsonMatch) return { summary: "No changes detected.", threat: "low" };
  const parsed = JSON.parse(jsonMatch[0]) as { summary: string; threat: string };
  const threat: "low" | "medium" | "high" =
    parsed.threat === "high" || parsed.threat === "medium" ? parsed.threat : "low";
  return { summary: parsed.summary || "", threat };
}
