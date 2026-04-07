import { sql } from "@/lib/db";

export type ActionType = "webhook" | "email" | "ai_prompt";

export interface CronJob {
  id: number;
  owner_id: string;
  name: string;
  cron_expr: string;
  action_type: ActionType;
  action_payload: Record<string, unknown>;
  next_run_at: Date;
  last_run_at: Date | null;
  status: string;
  created_at: Date;
}

export interface CronRunResult {
  jobId: number;
  status: "success" | "error";
  output?: string;
  error?: string;
}

export async function ensureSchedulerTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS cron_jobs (
      id SERIAL PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cron_expr TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      next_run_at TIMESTAMPTZ NOT NULL,
      last_run_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS cron_runs (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      output TEXT,
      error TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;
}

type FieldMatcher = (value: number) => boolean;

function parseField(field: string, min: number, max: number): FieldMatcher {
  const allowed = new Set<number>();
  const parts = field.split(",");
  for (const part of parts) {
    let step = 1;
    let range = part;
    const stepIdx = part.indexOf("/");
    if (stepIdx !== -1) {
      step = parseInt(part.slice(stepIdx + 1), 10);
      range = part.slice(0, stepIdx);
    }
    let start = min;
    let end = max;
    if (range === "*" || range === "") {
      start = min;
      end = max;
    } else if (range.includes("-")) {
      const [a, b] = range.split("-");
      start = parseInt(a, 10);
      end = parseInt(b, 10);
    } else {
      start = parseInt(range, 10);
      end = start;
    }
    for (let v = start; v <= end; v += step) {
      allowed.add(v);
    }
  }
  return (value: number) => allowed.has(value);
}

export function parseCron(expr: string): (date: Date) => boolean {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`Invalid cron expression: ${expr}`);
  }
  const [minF, hourF, domF, monF, dowF] = fields;
  const minMatch = parseField(minF, 0, 59);
  const hourMatch = parseField(hourF, 0, 23);
  const domMatch = parseField(domF, 1, 31);
  const monMatch = parseField(monF, 1, 12);
  const dowMatch = parseField(dowF, 0, 6);
  return (date: Date): boolean => {
    return (
      minMatch(date.getUTCMinutes()) &&
      hourMatch(date.getUTCHours()) &&
      domMatch(date.getUTCDate()) &&
      monMatch(date.getUTCMonth() + 1) &&
      dowMatch(date.getUTCDay())
    );
  };
}

export function nextRunAt(expr: string, from: Date = new Date()): Date {
  const matcher = parseCron(expr);
  const cursor = new Date(from.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  const limit = 366 * 24 * 60;
  for (let i = 0; i < limit; i++) {
    if (matcher(cursor)) return new Date(cursor.getTime());
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }
  throw new Error(`No next run found within 366 days for: ${expr}`);
}

export async function registerJob(
  ownerId: string,
  name: string,
  cronExpr: string,
  actionType: ActionType,
  actionPayload: Record<string, unknown>
): Promise<CronJob> {
  await ensureSchedulerTables();
  const next = nextRunAt(cronExpr);
  const rows = (await sql`
    INSERT INTO cron_jobs (owner_id, name, cron_expr, action_type, action_payload, next_run_at, status)
    VALUES (${ownerId}, ${name}, ${cronExpr}, ${actionType}, ${JSON.stringify(actionPayload)}::jsonb, ${next.toISOString()}, 'active')
    RETURNING *
  `) as unknown as CronJob[];
  return rows[0];
}

export async function getDueJobs(now: Date = new Date()): Promise<CronJob[]> {
  await ensureSchedulerTables();
  const rows = (await sql`
    SELECT * FROM cron_jobs
    WHERE next_run_at <= ${now.toISOString()} AND status = 'active'
  `) as unknown as CronJob[];
  return rows;
}

async function dispatchWebhook(payload: Record<string, unknown>): Promise<string> {
  const url = String(payload.url ?? "");
  if (!url) throw new Error("webhook payload missing url");
  const body = payload.body ?? {};
  try {
    const mod = (await import("@/lib/webhook-delivery")) as {
      deliverWebhook?: (url: string, body: unknown) => Promise<unknown>;
    };
    if (typeof mod.deliverWebhook === "function") {
      const result = await mod.deliverWebhook(url, body);
      return JSON.stringify(result).slice(0, 1000);
    }
  } catch {
    // fall through to raw fetch
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return `status=${res.status}`;
}

async function dispatchEmail(payload: Record<string, unknown>): Promise<string> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) throw new Error("Mailgun env vars missing");
  const form = new URLSearchParams();
  form.set("from", String(payload.from ?? `noreply@${domain}`));
  form.set("to", String(payload.to ?? ""));
  form.set("subject", String(payload.subject ?? ""));
  form.set("text", String(payload.text ?? ""));
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  const txt = await res.text();
  return `status=${res.status} ${txt.slice(0, 500)}`;
}

async function dispatchAiPrompt(payload: Record<string, unknown>): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  const prompt = String(payload.prompt ?? "");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = (await res.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "";
  return text.slice(0, 2000);
}

export async function runJob(job: CronJob): Promise<CronRunResult> {
  await ensureSchedulerTables();
  const startedAt = new Date();
  let output = "";
  let error = "";
  let status: "success" | "error" = "success";
  try {
    const payload =
      typeof job.action_payload === "string"
        ? (JSON.parse(job.action_payload) as Record<string, unknown>)
        : job.action_payload;
    if (job.action_type === "webhook") {
      output = await dispatchWebhook(payload);
    } else if (job.action_type === "email") {
      output = await dispatchEmail(payload);
    } else if (job.action_type === "ai_prompt") {
      output = await dispatchAiPrompt(payload);
    } else {
      throw new Error(`Unknown action_type: ${String(job.action_type)}`);
    }
  } catch (e) {
    status = "error";
    error = e instanceof Error ? e.message : String(e);
  }
  const completedAt = new Date();
  await sql`
    INSERT INTO cron_runs (job_id, status, output, error, started_at, completed_at)
    VALUES (${job.id}, ${status}, ${output}, ${error}, ${startedAt.toISOString()}, ${completedAt.toISOString()})
  `;
  const next = nextRunAt(job.cron_expr, completedAt);
  await sql`
    UPDATE cron_jobs
    SET last_run_at = ${completedAt.toISOString()}, next_run_at = ${next.toISOString()}
    WHERE id = ${job.id}
  `;
  return { jobId: job.id, status, output, error };
}

export async function tickScheduler(now: Date = new Date()): Promise<CronRunResult[]> {
  const jobs = await getDueJobs(now);
  const results = await Promise.allSettled(jobs.map((j) => runJob(j)));
  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    return {
      jobId: jobs[i].id,
      status: "error" as const,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });
}
