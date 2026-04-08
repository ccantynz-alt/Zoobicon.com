import { sql } from "@/lib/db";

export type ConnectorId =
  | "slack"
  | "gmail"
  | "sheets"
  | "notion"
  | "airtable"
  | "hubspot"
  | "salesforce"
  | "mailchimp"
  | "stripe"
  | "github"
  | "linear"
  | "asana"
  | "trello"
  | "jira"
  | "discord"
  | "twilio"
  | "sendgrid"
  | "calendly"
  | "zoom"
  | "dropbox"
  | "intercom"
  | "shopify";

export interface Connector {
  id: ConnectorId;
  name: string;
  category: string;
  triggers: TriggerType[];
  actions: ActionType[];
}

export type TriggerType =
  | "webhook"
  | "schedule"
  | "email_received"
  | "form_submit"
  | "db_change";

export type ActionType =
  | "http_request"
  | "send_email"
  | "post_message"
  | "create_record";

export interface ZapTrigger {
  type: TriggerType;
  connector: ConnectorId;
  config: Record<string, string | number | boolean>;
}

export interface ZapAction {
  type: ActionType;
  connector: ConnectorId;
  config: Record<string, string | number | boolean>;
}

export interface Zap {
  id: string;
  userId: string;
  name: string;
  trigger: ZapTrigger;
  action: ZapAction;
  enabled: boolean;
  createdAt: string;
}

export interface CreateZapInput {
  userId: string;
  name: string;
  trigger: ZapTrigger;
  action: ZapAction;
}

export interface RunResult {
  ok: boolean;
  status?: number;
  body?: string;
  error?: string;
}

const CONNECTORS: Connector[] = [
  { id: "slack", name: "Slack", category: "chat", triggers: ["webhook"], actions: ["post_message", "http_request"] },
  { id: "gmail", name: "Gmail", category: "email", triggers: ["email_received"], actions: ["send_email"] },
  { id: "sheets", name: "Google Sheets", category: "productivity", triggers: ["db_change"], actions: ["create_record", "http_request"] },
  { id: "notion", name: "Notion", category: "productivity", triggers: ["db_change"], actions: ["create_record", "http_request"] },
  { id: "airtable", name: "Airtable", category: "database", triggers: ["db_change"], actions: ["create_record", "http_request"] },
  { id: "hubspot", name: "HubSpot", category: "crm", triggers: ["form_submit", "db_change"], actions: ["create_record", "http_request"] },
  { id: "salesforce", name: "Salesforce", category: "crm", triggers: ["db_change"], actions: ["create_record", "http_request"] },
  { id: "mailchimp", name: "Mailchimp", category: "email", triggers: ["form_submit"], actions: ["send_email", "create_record"] },
  { id: "stripe", name: "Stripe", category: "payments", triggers: ["webhook"], actions: ["http_request", "create_record"] },
  { id: "github", name: "GitHub", category: "dev", triggers: ["webhook"], actions: ["http_request", "create_record"] },
  { id: "linear", name: "Linear", category: "dev", triggers: ["webhook", "db_change"], actions: ["create_record", "http_request"] },
  { id: "asana", name: "Asana", category: "pm", triggers: ["db_change"], actions: ["create_record", "http_request"] },
  { id: "trello", name: "Trello", category: "pm", triggers: ["webhook"], actions: ["create_record", "http_request"] },
  { id: "jira", name: "Jira", category: "pm", triggers: ["webhook"], actions: ["create_record", "http_request"] },
  { id: "discord", name: "Discord", category: "chat", triggers: ["webhook"], actions: ["post_message", "http_request"] },
  { id: "twilio", name: "Twilio", category: "comms", triggers: ["webhook"], actions: ["send_email", "http_request"] },
  { id: "sendgrid", name: "SendGrid", category: "email", triggers: ["webhook"], actions: ["send_email", "http_request"] },
  { id: "calendly", name: "Calendly", category: "scheduling", triggers: ["webhook", "schedule"], actions: ["http_request"] },
  { id: "zoom", name: "Zoom", category: "video", triggers: ["webhook", "schedule"], actions: ["create_record", "http_request"] },
  { id: "dropbox", name: "Dropbox", category: "storage", triggers: ["db_change"], actions: ["create_record", "http_request"] },
  { id: "intercom", name: "Intercom", category: "support", triggers: ["webhook", "form_submit"], actions: ["post_message", "http_request"] },
  { id: "shopify", name: "Shopify", category: "ecommerce", triggers: ["webhook", "db_change"], actions: ["create_record", "http_request"] },
];

let tableReady = false;

async function ensureTable(): Promise<void> {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS integrations_zaps (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      name text NOT NULL,
      trigger jsonb NOT NULL,
      action jsonb NOT NULL,
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  tableReady = true;
}

function checkDb(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
}

function genId(): string {
  return `zap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

interface ZapRow {
  id: string;
  user_id: string;
  name: string;
  trigger: ZapTrigger;
  action: ZapAction;
  enabled: boolean;
  created_at: string;
}

function rowToZap(row: ZapRow): Zap {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    trigger: row.trigger,
    action: row.action,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

export function listConnectors(): Connector[] {
  return CONNECTORS;
}

export async function createZap(input: CreateZapInput): Promise<Zap> {
  checkDb();
  await ensureTable();
  const id = genId();
  const rows = (await sql`
    INSERT INTO integrations_zaps (id, user_id, name, trigger, action, enabled)
    VALUES (${id}, ${input.userId}, ${input.name}, ${JSON.stringify(input.trigger)}::jsonb, ${JSON.stringify(input.action)}::jsonb, true)
    RETURNING id, user_id, name, trigger, action, enabled, created_at
  `) as unknown as ZapRow[];
  return rowToZap(rows[0]);
}

export async function listZaps(userId: string): Promise<Zap[]> {
  checkDb();
  await ensureTable();
  const rows = (await sql`
    SELECT id, user_id, name, trigger, action, enabled, created_at
    FROM integrations_zaps
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as unknown as ZapRow[];
  return rows.map(rowToZap);
}

async function getZap(zapId: string): Promise<Zap | null> {
  checkDb();
  await ensureTable();
  const rows = (await sql`
    SELECT id, user_id, name, trigger, action, enabled, created_at
    FROM integrations_zaps
    WHERE id = ${zapId}
    LIMIT 1
  `) as unknown as ZapRow[];
  if (rows.length === 0) return null;
  return rowToZap(rows[0]);
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

async function executeAction(action: ZapAction, payload: unknown): Promise<RunResult> {
  try {
    switch (action.type) {
      case "http_request": {
        const url = asString(action.config.url);
        if (!url) return { ok: false, error: "missing url" };
        const method = asString(action.config.method) || "POST";
        const res = await fetch(url, {
          method,
          headers: { "content-type": "application/json" },
          body: method === "GET" ? undefined : JSON.stringify(payload),
        });
        const body = await res.text();
        return { ok: res.ok, status: res.status, body };
      }
      case "send_email": {
        const url = asString(action.config.endpoint);
        if (!url) return { ok: false, error: "missing endpoint" };
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            to: asString(action.config.to),
            subject: asString(action.config.subject),
            payload,
          }),
        });
        return { ok: res.ok, status: res.status, body: await res.text() };
      }
      case "post_message": {
        const url = asString(action.config.webhook);
        if (!url) return { ok: false, error: "missing webhook" };
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: asString(action.config.text), payload }),
        });
        return { ok: res.ok, status: res.status, body: await res.text() };
      }
      case "create_record": {
        const url = asString(action.config.endpoint);
        if (!url) return { ok: false, error: "missing endpoint" };
        const res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ record: payload, table: asString(action.config.table) }),
        });
        return { ok: res.ok, status: res.status, body: await res.text() };
      }
      default:
        return { ok: false, error: "unknown action type" };
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown error" };
  }
}

export async function runZap(zapId: string, payload: unknown): Promise<RunResult> {
  const zap = await getZap(zapId);
  if (!zap) return { ok: false, error: "zap not found" };
  if (!zap.enabled) return { ok: false, error: "zap disabled" };
  return executeAction(zap.action, payload);
}
