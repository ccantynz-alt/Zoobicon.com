import { sql } from "@/lib/db";

export interface Customer {
  id: string;
  email: string;
  lastOrderAt: string | Date | null;
  orderCount: number;
  totalSpent: number;
}

export interface RfmScore {
  recency: number;
  frequency: number;
  monetary: number;
  total: number;
  segment: SegmentName;
}

export type SegmentName =
  | "Champions"
  | "Loyal"
  | "Potential Loyalists"
  | "New Customers"
  | "At Risk"
  | "Cant Lose Them"
  | "Hibernating"
  | "Lost";

export interface SegmentCriteria {
  minRecency?: number;
  minFrequency?: number;
  minMonetary?: number;
  segment?: SegmentName;
  [key: string]: unknown;
}

export interface SegmentRecord {
  id: string;
  owner_id: string;
  name: string;
  criteria: SegmentCriteria;
  customer_count: number;
  created_at: string;
}

export async function ensureSegmentTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS customer_segments (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
      customer_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS customer_scores (
      customer_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      rfm_score TEXT NOT NULL,
      recency INTEGER NOT NULL,
      frequency INTEGER NOT NULL,
      monetary INTEGER NOT NULL,
      segment_name TEXT NOT NULL,
      last_computed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (customer_id, owner_id)
    )
  `;
}

function quintile(values: number[], v: number, ascending: boolean): number {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = sorted.findIndex((x) => x >= v);
  const position = idx === -1 ? sorted.length - 1 : idx;
  const pct = position / Math.max(1, sorted.length - 1);
  const score = Math.min(5, Math.max(1, Math.ceil(pct * 5) || 1));
  return ascending ? score : 6 - score;
}

function classify(r: number, f: number, m: number): SegmentName {
  const fm = Math.round((f + m) / 2);
  if (r >= 4 && fm >= 4) return "Champions";
  if (r >= 3 && fm >= 4) return "Loyal";
  if (r >= 4 && fm >= 2 && fm <= 3) return "Potential Loyalists";
  if (r === 5 && fm <= 1) return "New Customers";
  if (r <= 2 && fm >= 3) return "At Risk";
  if (r <= 2 && fm >= 4) return "Cant Lose Them";
  if (r <= 2 && fm === 2) return "Hibernating";
  return "Lost";
}

export function computeRfm(customers: Customer[]): Map<string, RfmScore> {
  const now = Date.now();
  const recencies: number[] = customers.map((c) => {
    if (!c.lastOrderAt) return Number.MAX_SAFE_INTEGER;
    const t = new Date(c.lastOrderAt).getTime();
    return Math.max(0, Math.floor((now - t) / 86400000));
  });
  const frequencies: number[] = customers.map((c) => c.orderCount);
  const monetaries: number[] = customers.map((c) => c.totalSpent);

  const result = new Map<string, RfmScore>();
  customers.forEach((c, i) => {
    const r = quintile(recencies, recencies[i], false);
    const f = quintile(frequencies, frequencies[i], true);
    const m = quintile(monetaries, monetaries[i], true);
    const segment = classify(r, f, m);
    result.set(c.id, {
      recency: r,
      frequency: f,
      monetary: m,
      total: r + f + m,
      segment,
    });
  });
  return result;
}

export interface AiSegmentName {
  name: string;
  description: string;
}

export async function aiNameSegment(
  criteria: SegmentCriteria,
  sampleCustomers: Customer[]
): Promise<AiSegmentName> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error("ANTHROPIC_API_KEY is not set") as Error & {
      status?: number;
    };
    err.status = 503;
    throw err;
  }

  const prompt = `You name customer segments. Given criteria and sample customers, return JSON only:
{"name":"<short name, 2-4 words>","description":"<one line>"}

Criteria: ${JSON.stringify(criteria)}
Samples: ${JSON.stringify(sampleCustomers.slice(0, 5))}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = new Error(`Anthropic error: ${res.status}`) as Error & {
      status?: number;
    };
    err.status = 503;
    throw err;
  }
  const data = (await res.json()) as {
    content?: Array<{ text?: string }>;
  };
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return { name: "Unnamed Segment", description: "AI did not return JSON" };
  }
  const parsed = JSON.parse(match[0]) as AiSegmentName;
  return {
    name: String(parsed.name ?? "Unnamed Segment"),
    description: String(parsed.description ?? ""),
  };
}

export async function createSegment(
  ownerId: string,
  name: string,
  criteria: SegmentCriteria,
  customerIds: string[]
): Promise<SegmentRecord> {
  await ensureSegmentTables();
  const id = `seg_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const rows = (await sql`
    INSERT INTO customer_segments (id, owner_id, name, criteria, customer_count)
    VALUES (${id}, ${ownerId}, ${name}, ${JSON.stringify(criteria)}::jsonb, ${customerIds.length})
    RETURNING id, owner_id, name, criteria, customer_count, created_at
  `) as unknown as SegmentRecord[];
  return rows[0];
}

export async function listSegments(ownerId: string): Promise<SegmentRecord[]> {
  await ensureSegmentTables();
  const rows = (await sql`
    SELECT id, owner_id, name, criteria, customer_count, created_at
    FROM customer_segments
    WHERE owner_id = ${ownerId}
    ORDER BY created_at DESC
  `) as unknown as SegmentRecord[];
  return rows;
}
