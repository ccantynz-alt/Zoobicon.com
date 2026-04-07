import crypto from "crypto";
import { sql } from "@/lib/db";

export interface Webhook {
  id: string;
  customer_id: string;
  url: string;
  events: string[];
  secret: string;
  status: string;
  created_at: string;
}

export interface DeliveryResult {
  ok: boolean;
  statusCode: number;
  attempts: number;
  error?: string;
}

let tablesEnsured = false;

export async function ensureWebhookTables(): Promise<void> {
  if (tablesEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS webhooks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id TEXT NOT NULL,
      url TEXT NOT NULL,
      events TEXT[] NOT NULL,
      secret TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      webhook_id UUID NOT NULL,
      event_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      status_code INTEGER,
      attempt INTEGER NOT NULL,
      delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      error TEXT
    )
  `;
  tablesEnsured = true;
}

export async function registerWebhook(
  customerId: string,
  url: string,
  events: string[],
): Promise<Webhook> {
  await ensureWebhookTables();
  const secret = crypto.randomBytes(32).toString("hex");
  const rows = (await sql`
    INSERT INTO webhooks (customer_id, url, events, secret)
    VALUES (${customerId}, ${url}, ${events}, ${secret})
    RETURNING id, customer_id, url, events, secret, status, created_at
  `) as unknown as Webhook[];
  return rows[0];
}

export function signPayload(payload: unknown, secret: string): string {
  const json = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(json).digest("hex");
}

async function getWebhook(webhookId: string): Promise<Webhook | null> {
  const rows = (await sql`
    SELECT id, customer_id, url, events, secret, status, created_at
    FROM webhooks WHERE id = ${webhookId}
  `) as unknown as Webhook[];
  return rows[0] ?? null;
}

async function logDelivery(
  webhookId: string,
  eventType: string,
  payload: unknown,
  statusCode: number | null,
  attempt: number,
  error: string | null,
): Promise<void> {
  await sql`
    INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status_code, attempt, error)
    VALUES (${webhookId}, ${eventType}, ${JSON.stringify(payload)}, ${statusCode}, ${attempt}, ${error})
  `;
}

const BACKOFF_MS = [1000, 2000, 4000, 8000, 16000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deliverWebhook(
  webhookId: string,
  eventType: string,
  payload: unknown,
): Promise<DeliveryResult> {
  await ensureWebhookTables();
  const webhook = await getWebhook(webhookId);
  if (!webhook) {
    return { ok: false, statusCode: 0, attempts: 0, error: "webhook not found" };
  }
  const json = JSON.stringify(payload);
  const signature = signPayload(json, webhook.secret);

  let lastStatus = 0;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Zoobicon-Signature": `sha256=${signature}`,
          "X-Zoobicon-Event": eventType,
        },
        body: json,
      });
      lastStatus = res.status;
      await logDelivery(webhookId, eventType, payload, res.status, attempt, null);
      if (res.status >= 200 && res.status < 300) {
        return { ok: true, statusCode: res.status, attempts: attempt };
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      await logDelivery(webhookId, eventType, payload, null, attempt, lastError);
    }
    if (attempt < 5) {
      await sleep(BACKOFF_MS[attempt - 1]);
    }
  }

  return { ok: false, statusCode: lastStatus, attempts: 5, error: lastError };
}

export async function dispatchEvent(
  customerId: string,
  eventType: string,
  payload: unknown,
): Promise<DeliveryResult[]> {
  await ensureWebhookTables();
  const rows = (await sql`
    SELECT id FROM webhooks
    WHERE customer_id = ${customerId}
      AND status = 'active'
      AND ${eventType} = ANY(events)
  `) as unknown as { id: string }[];
  const results = await Promise.allSettled(
    rows.map((r) => deliverWebhook(r.id, eventType, payload)),
  );
  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { ok: false, statusCode: 0, attempts: 0, error: String(r.reason) },
  );
}

export async function listWebhooks(customerId: string): Promise<Webhook[]> {
  await ensureWebhookTables();
  const rows = (await sql`
    SELECT id, customer_id, url, events, secret, status, created_at
    FROM webhooks WHERE customer_id = ${customerId}
    ORDER BY created_at DESC
  `) as unknown as Webhook[];
  return rows;
}

export async function revokeWebhook(id: string, customerId: string): Promise<boolean> {
  await ensureWebhookTables();
  const rows = (await sql`
    UPDATE webhooks SET status = 'revoked'
    WHERE id = ${id} AND customer_id = ${customerId}
    RETURNING id
  `) as unknown as { id: string }[];
  return rows.length > 0;
}
