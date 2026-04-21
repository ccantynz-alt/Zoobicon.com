import { sql } from "@/lib/db";

export interface AuditEvent {
  id: number;
  owner_id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  ts: string;
}

export interface LogEventInput {
  ownerId: string;
  actorId?: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export interface FeedOptions {
  limit?: number;
  offset?: number;
  action?: string;
  resourceType?: string;
  since?: string | Date;
}

let tablesEnsured = false;

export async function ensureAuditTables(): Promise<void> {
  if (tablesEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      owner_id TEXT NOT NULL,
      actor_id TEXT,
      actor_email TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      metadata JSONB,
      ip TEXT,
      user_agent TEXT,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS audit_logs_owner_ts_idx ON audit_logs (owner_id, ts DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_id, ts DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action)`;
  tablesEnsured = true;
}

export async function logEvent(input: LogEventInput): Promise<AuditEvent> {
  await ensureAuditTables();
  const metadataJson = input.metadata ? JSON.stringify(input.metadata) : null;
  const rows = (await sql`
    INSERT INTO audit_logs (
      owner_id, actor_id, actor_email, action, resource_type, resource_id, metadata, ip, user_agent
    ) VALUES (
      ${input.ownerId},
      ${input.actorId ?? null},
      ${input.actorEmail ?? null},
      ${input.action},
      ${input.resourceType},
      ${input.resourceId ?? null},
      ${metadataJson}::jsonb,
      ${input.ip ?? null},
      ${input.userAgent ?? null}
    )
    RETURNING *
  `) as unknown as AuditEvent[];
  return rows[0];
}

export async function getFeed(
  ownerId: string,
  opts: FeedOptions = {}
): Promise<AuditEvent[]> {
  await ensureAuditTables();
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 500);
  const offset = Math.max(opts.offset ?? 0, 0);
  const action = opts.action ?? null;
  const resourceType = opts.resourceType ?? null;
  const since = opts.since
    ? opts.since instanceof Date
      ? opts.since.toISOString()
      : opts.since
    : null;

  const rows = (await sql`
    SELECT * FROM audit_logs
    WHERE owner_id = ${ownerId}
      AND (${action}::text IS NULL OR action = ${action})
      AND (${resourceType}::text IS NULL OR resource_type = ${resourceType})
      AND (${since}::timestamptz IS NULL OR ts >= ${since}::timestamptz)
    ORDER BY ts DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as unknown as AuditEvent[];
  return rows;
}

export async function getActorActivity(
  actorId: string,
  limit = 50
): Promise<AuditEvent[]> {
  await ensureAuditTables();
  const cap = Math.min(Math.max(limit, 1), 500);
  const rows = (await sql`
    SELECT * FROM audit_logs
    WHERE actor_id = ${actorId}
    ORDER BY ts DESC
    LIMIT ${cap}
  `) as unknown as AuditEvent[];
  return rows;
}

const FALLBACK_SUMMARY =
  "Activity summary is temporarily unavailable because no AI provider key is configured. Recent events are still recorded in the audit log and can be reviewed directly via the activity feed.\n\nSet ANTHROPIC_API_KEY in your environment to enable plain-English summaries that highlight notable actions, actors, and trends across the selected time window.";

export async function summarizeForUser(
  ownerId: string,
  days = 30
): Promise<string> {
  await ensureAuditTables();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const events = (await sql`
    SELECT action, resource_type, resource_id, actor_email, ts, metadata
    FROM audit_logs
    WHERE owner_id = ${ownerId} AND ts >= ${since}::timestamptz
    ORDER BY ts DESC
    LIMIT 200
  `) as unknown as Array<Pick<AuditEvent, "action" | "resource_type" | "resource_id" | "actor_email" | "ts" | "metadata">>;

  if (events.length === 0) {
    return `No activity recorded in the last ${days} days for this account.\n\nOnce events start flowing, this summary will highlight the most important changes, who made them, and any trends worth your attention.`;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return FALLBACK_SUMMARY;
  }

  const lines = events
    .map(
      (e) =>
        `${e.ts} ${e.actor_email ?? "system"} ${e.action} ${e.resource_type}${
          e.resource_id ? "#" + e.resource_id : ""
        }`
    )
    .join("\n");

  const prompt = `You are an account activity summarizer. Read the following audit log events and write a clear two-paragraph plain-English summary for the account owner. Highlight notable actions, who performed them, and any patterns worth attention. Avoid jargon.\n\nEVENTS (last ${days} days):\n${lines}`;

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
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return FALLBACK_SUMMARY;
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text;
    return text && text.trim().length > 0 ? text : FALLBACK_SUMMARY;
  } catch {
    return FALLBACK_SUMMARY;
  }
}
