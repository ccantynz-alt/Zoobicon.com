import { sql } from "./db";
import { promises as dns } from "dns";

export interface Lead {
  id: string;
  email: string;
  name?: string | null;
  company?: string | null;
  title?: string | null;
  score: number;
  classification: LeadClassification;
  metadata: LeadMetadata;
  created_at?: string;
}

export interface LeadMetadata {
  employees?: number;
  pageViews?: number;
  downloads?: number;
  formFills?: number;
  lastSeen?: string;
  domainAgeDays?: number;
  hasMx?: boolean;
  [key: string]: unknown;
}

export type LeadClassification = "hot" | "warm" | "cold";

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
]);

const SENIOR_TITLE_KEYWORDS = [
  "ceo",
  "cto",
  "cfo",
  "coo",
  "cmo",
  "founder",
  "co-founder",
  "vp",
  "vice president",
  "president",
  "head of",
  "director",
  "owner",
  "partner",
];

export async function ensureLeadTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      company TEXT,
      title TEXT,
      score INT NOT NULL DEFAULT 0,
      classification TEXT NOT NULL DEFAULT 'cold',
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS lead_events (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      event TEXT NOT NULL,
      weight INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export interface ScoreInput {
  lead: Pick<Lead, "email"> & Partial<Lead>;
}

export function scoreLead({ lead }: ScoreInput): number {
  let score = 0;

  const domain = (lead.email.split("@")[1] || "").toLowerCase();
  if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
    score += 10;
  }

  const title = (lead.title || "").toLowerCase();
  if (SENIOR_TITLE_KEYWORDS.some((kw) => title.includes(kw))) {
    score += 25;
  }

  const meta: LeadMetadata = lead.metadata || {};
  const employees = typeof meta.employees === "number" ? meta.employees : 0;
  score += Math.min(30, Math.floor(employees / 10));

  const pageViews = typeof meta.pageViews === "number" ? meta.pageViews : 0;
  const downloads = typeof meta.downloads === "number" ? meta.downloads : 0;
  const formFills = typeof meta.formFills === "number" ? meta.formFills : 0;
  const engagement = pageViews * 1 + downloads * 3 + formFills * 5;
  score += Math.min(25, engagement);

  if (meta.hasMx) score += 5;
  if (typeof meta.domainAgeDays === "number" && meta.domainAgeDays > 365) {
    score += 5;
  }

  // Recency decay based on lastSeen
  if (typeof meta.lastSeen === "string") {
    const last = Date.parse(meta.lastSeen);
    if (!Number.isNaN(last)) {
      const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
      const decay = Math.min(20, Math.floor(days / 7) * 2);
      score -= decay;
    }
  }

  if (score < 0) score = 0;
  if (score > 100) score = 100;
  return score;
}

export function classifyLead(score: number): LeadClassification {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

export interface EnrichmentResult {
  hasMx: boolean;
  mxRecords: string[];
  domainAgeDays: number | null;
  domain: string;
}

export async function enrichLead(email: string): Promise<EnrichmentResult> {
  const domain = (email.split("@")[1] || "").toLowerCase();
  const result: EnrichmentResult = {
    hasMx: false,
    mxRecords: [],
    domainAgeDays: null,
    domain,
  };
  if (!domain) return result;

  try {
    const mx = await dns.resolveMx(domain);
    result.hasMx = mx.length > 0;
    result.mxRecords = mx.map((m) => m.exchange);
  } catch {
    result.hasMx = false;
  }

  // Crude domain age via SOA serial (best-effort, never throws to caller)
  try {
    const soa = await dns.resolveSoa(domain);
    if (soa && typeof soa.serial === "number") {
      const serialStr = String(soa.serial);
      if (serialStr.length >= 8) {
        const year = parseInt(serialStr.slice(0, 4), 10);
        const month = parseInt(serialStr.slice(4, 6), 10);
        const day = parseInt(serialStr.slice(6, 8), 10);
        if (year > 1990 && year < 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          const dt = Date.UTC(year, month - 1, day);
          const days = Math.floor((Date.now() - dt) / (1000 * 60 * 60 * 24));
          if (days >= 0) result.domainAgeDays = days;
        }
      }
    }
  } catch {
    // ignore
  }

  return result;
}

export interface TrackEventResult {
  ok: boolean;
  newScore: number;
  classification: LeadClassification;
}

const EVENT_WEIGHTS: Record<string, number> = {
  page_view: 1,
  download: 3,
  form_fill: 5,
  pricing_view: 4,
  demo_request: 10,
  email_open: 1,
  email_click: 2,
};

export async function trackEngagement(
  leadId: string,
  event: string
): Promise<TrackEventResult> {
  await ensureLeadTables();
  const weight = EVENT_WEIGHTS[event] ?? 1;
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  await sql`
    INSERT INTO lead_events (id, lead_id, event, weight)
    VALUES (${eventId}, ${leadId}, ${event}, ${weight})
  `;

  const rows = (await sql`
    SELECT id, email, name, company, title, score, classification, metadata
    FROM leads WHERE id = ${leadId} LIMIT 1
  `) as Array<Lead>;

  if (rows.length === 0) {
    return { ok: false, newScore: 0, classification: "cold" };
  }

  const lead = rows[0];
  const meta: LeadMetadata = { ...(lead.metadata || {}) };
  if (event === "page_view") meta.pageViews = (meta.pageViews || 0) + 1;
  if (event === "download") meta.downloads = (meta.downloads || 0) + 1;
  if (event === "form_fill") meta.formFills = (meta.formFills || 0) + 1;
  meta.lastSeen = new Date().toISOString();

  const newScore = scoreLead({ lead: { ...lead, metadata: meta } });
  const classification = classifyLead(newScore);

  await sql`
    UPDATE leads
    SET score = ${newScore},
        classification = ${classification},
        metadata = ${JSON.stringify(meta)}::jsonb
    WHERE id = ${leadId}
  `;

  return { ok: true, newScore, classification };
}

export interface NextActionRecommendation {
  action: string;
  reason: string;
  channel: "email" | "call" | "linkedin" | "nurture";
}

export async function recommendNextAction(
  lead: Lead
): Promise<NextActionRecommendation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return fallbackAction(lead);
  }

  const prompt = `You are a B2B sales strategist. Given this lead, recommend ONE next action.
Lead:
- email: ${lead.email}
- name: ${lead.name || "unknown"}
- company: ${lead.company || "unknown"}
- title: ${lead.title || "unknown"}
- score: ${lead.score}/100 (${lead.classification})
- metadata: ${JSON.stringify(lead.metadata)}

Respond ONLY with strict JSON: {"action": string, "reason": string, "channel": "email"|"call"|"linkedin"|"nurture"}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return fallbackAction(lead);
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      data.content?.find((c) => c.type === "text")?.text?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackAction(lead);
    const parsed = JSON.parse(jsonMatch[0]) as NextActionRecommendation;
    if (
      typeof parsed.action === "string" &&
      typeof parsed.reason === "string" &&
      ["email", "call", "linkedin", "nurture"].includes(parsed.channel)
    ) {
      return parsed;
    }
    return fallbackAction(lead);
  } catch {
    return fallbackAction(lead);
  }
}

function fallbackAction(lead: Lead): NextActionRecommendation {
  if (lead.classification === "hot") {
    return {
      action: "Schedule a discovery call within 24 hours",
      reason: "High intent score and senior title indicate buying readiness",
      channel: "call",
    };
  }
  if (lead.classification === "warm") {
    return {
      action: "Send a personalized case study by email",
      reason: "Engaged but needs more proof points before sales call",
      channel: "email",
    };
  }
  return {
    action: "Add to long-term nurture sequence",
    reason: "Low engagement, focus on educational content",
    channel: "nurture",
  };
}

export async function upsertLead(
  partial: Pick<Lead, "email"> & Partial<Lead>
): Promise<Lead> {
  await ensureLeadTables();
  const id =
    partial.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const score = scoreLead({ lead: partial });
  const classification = classifyLead(score);
  const metadata: LeadMetadata = partial.metadata || {};

  const rows = (await sql`
    INSERT INTO leads (id, email, name, company, title, score, classification, metadata)
    VALUES (
      ${id},
      ${partial.email},
      ${partial.name ?? null},
      ${partial.company ?? null},
      ${partial.title ?? null},
      ${score},
      ${classification},
      ${JSON.stringify(metadata)}::jsonb
    )
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, leads.name),
      company = COALESCE(EXCLUDED.company, leads.company),
      title = COALESCE(EXCLUDED.title, leads.title),
      score = EXCLUDED.score,
      classification = EXCLUDED.classification,
      metadata = EXCLUDED.metadata
    RETURNING id, email, name, company, title, score, classification, metadata, created_at
  `) as Array<Lead>;

  return rows[0];
}

export async function listTopLeads(limit = 50): Promise<Lead[]> {
  await ensureLeadTables();
  const rows = (await sql`
    SELECT id, email, name, company, title, score, classification, metadata, created_at
    FROM leads
    ORDER BY score DESC, created_at DESC
    LIMIT ${limit}
  `) as Array<Lead>;
  return rows;
}
