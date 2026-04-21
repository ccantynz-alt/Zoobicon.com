import { sql } from "@/lib/db";
import crypto from "crypto";

export interface NewsletterList {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  list_id: string;
  email: string;
  name: string | null;
  status: "active" | "unsubscribed" | "bounced";
  confirmed: boolean;
  token: string;
  created_at: string;
}

export interface NewsletterCampaign {
  id: string;
  list_id: string;
  subject: string;
  body_html: string;
  body_text: string;
  status: "draft" | "sending" | "sent";
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  created_at: string;
}

export interface DripStep {
  delayHours: number;
  subject: string;
  html: string;
  text: string;
}

export interface NewsletterDrip {
  id: string;
  list_id: string;
  name: string;
  steps: DripStep[];
  active: boolean;
  created_at: string;
}

export interface MailgunResult {
  ok: boolean;
  id?: string;
  error?: string;
}

let tablesEnsured = false;

export async function ensureNewsletterTables(): Promise<void> {
  if (tablesEnsured) return;
  await sql`CREATE TABLE IF NOT EXISTS newsletter_lists (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    token TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    sent_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS newsletter_drips (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL,
    name TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  tablesEnsured = true;
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

function newToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export async function createList(ownerId: string, name: string): Promise<NewsletterList> {
  await ensureNewsletterTables();
  const id = newId("list");
  const rows = (await sql`INSERT INTO newsletter_lists (id, owner_id, name)
    VALUES (${id}, ${ownerId}, ${name}) RETURNING *`) as unknown as NewsletterList[];
  return rows[0];
}

export async function subscribe(
  listId: string,
  email: string,
  name?: string
): Promise<{ confirmationToken: string }> {
  await ensureNewsletterTables();
  const id = newId("sub");
  const token = newToken();
  await sql`INSERT INTO newsletter_subscribers (id, list_id, email, name, status, confirmed, token)
    VALUES (${id}, ${listId}, ${email}, ${name ?? null}, 'active', FALSE, ${token})`;
  return { confirmationToken: token };
}

export async function confirmSubscription(token: string): Promise<boolean> {
  await ensureNewsletterTables();
  const rows = (await sql`UPDATE newsletter_subscribers SET confirmed = TRUE
    WHERE token = ${token} RETURNING id`) as unknown as { id: string }[];
  return rows.length > 0;
}

export async function unsubscribe(email: string, listId?: string): Promise<number> {
  await ensureNewsletterTables();
  if (listId) {
    const rows = (await sql`UPDATE newsletter_subscribers SET status = 'unsubscribed'
      WHERE email = ${email} AND list_id = ${listId} RETURNING id`) as unknown as { id: string }[];
    return rows.length;
  }
  const rows = (await sql`UPDATE newsletter_subscribers SET status = 'unsubscribed'
    WHERE email = ${email} RETURNING id`) as unknown as { id: string }[];
  return rows.length;
}

export async function createCampaign(
  listId: string,
  subject: string,
  html: string,
  text: string,
  scheduledAt?: string
): Promise<NewsletterCampaign> {
  await ensureNewsletterTables();
  const id = newId("camp");
  const rows = (await sql`INSERT INTO newsletter_campaigns
    (id, list_id, subject, body_html, body_text, status, scheduled_at)
    VALUES (${id}, ${listId}, ${subject}, ${html}, ${text}, 'draft', ${scheduledAt ?? null})
    RETURNING *`) as unknown as NewsletterCampaign[];
  return rows[0];
}

export async function listCampaigns(listId: string): Promise<NewsletterCampaign[]> {
  await ensureNewsletterTables();
  const rows = (await sql`SELECT * FROM newsletter_campaigns WHERE list_id = ${listId}
    ORDER BY created_at DESC`) as unknown as NewsletterCampaign[];
  return rows;
}

function unsubLink(email: string, listId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zoobicon.com";
  const u = new URL(`${base}/api/newsletter/unsubscribe`);
  u.searchParams.set("email", email);
  u.searchParams.set("listId", listId);
  return u.toString();
}

export async function mailgunSend(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<MailgunResult> {
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!key) {
    throw new Error(
      "MAILGUN_API_KEY missing — set MAILGUN_API_KEY in Vercel env vars to enable newsletter sending."
    );
  }
  if (!domain) {
    throw new Error(
      "MAILGUN_DOMAIN missing — set MAILGUN_DOMAIN in Vercel env vars to enable newsletter sending."
    );
  }
  const from = process.env.MAILGUN_FROM ?? `Zoobicon <noreply@${domain}>`;
  const body = new URLSearchParams();
  body.set("from", from);
  body.set("to", to);
  body.set("subject", subject);
  body.set("html", html);
  body.set("text", text);

  const auth = Buffer.from(`api:${key}`).toString("base64");
  let lastErr = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      if (res.ok) {
        const json = (await res.json()) as { id?: string };
        return { ok: true, id: json.id };
      }
      lastErr = `Mailgun ${res.status}: ${await res.text()}`;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
    await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
  }
  return { ok: false, error: lastErr };
}

export async function sendCampaign(campaignId: string): Promise<{ ok: boolean; sentCount: number; error?: string }> {
  await ensureNewsletterTables();
  const campRows = (await sql`SELECT * FROM newsletter_campaigns WHERE id = ${campaignId}`) as unknown as NewsletterCampaign[];
  if (campRows.length === 0) return { ok: false, sentCount: 0, error: "Campaign not found" };
  const camp = campRows[0];
  if (camp.status === "sent") return { ok: true, sentCount: camp.sent_count };

  await sql`UPDATE newsletter_campaigns SET status = 'sending' WHERE id = ${campaignId}`;

  const subs = (await sql`SELECT * FROM newsletter_subscribers
    WHERE list_id = ${camp.list_id} AND status = 'active'`) as unknown as NewsletterSubscriber[];

  let sent = 0;
  const batchSize = 50;
  for (let i = 0; i < subs.length; i += batchSize) {
    const batch = subs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (s) => {
        const link = unsubLink(s.email, camp.list_id);
        const html = `${camp.body_html}<hr/><p style="font-size:12px;color:#888">Don't want these? <a href="${link}">Unsubscribe</a></p>`;
        const text = `${camp.body_text}\n\n---\nUnsubscribe: ${link}`;
        try {
          const r = await mailgunSend(s.email, camp.subject, html, text);
          return r.ok;
        } catch {
          return false;
        }
      })
    );
    sent += results.filter(Boolean).length;
  }

  await sql`UPDATE newsletter_campaigns SET status = 'sent', sent_at = NOW(), sent_count = ${sent}
    WHERE id = ${campaignId}`;

  return { ok: true, sentCount: sent };
}
