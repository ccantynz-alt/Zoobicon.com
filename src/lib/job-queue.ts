import { sql } from "./db";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "dead";

export interface JobPayload {
  [key: string]: unknown;
}

export interface Job {
  id: string;
  queue: string;
  type: string;
  payload: JobPayload;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  run_at: string;
  error: string | null;
  worker_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface EnqueueOptions {
  queue: string;
  type: string;
  payload: JobPayload;
  runAt?: Date;
  maxAttempts?: number;
}

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id            TEXT PRIMARY KEY,
      queue         TEXT NOT NULL,
      type          TEXT NOT NULL,
      payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
      status        TEXT NOT NULL DEFAULT 'pending',
      attempts      INTEGER NOT NULL DEFAULT 0,
      max_attempts  INTEGER NOT NULL DEFAULT 3,
      run_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      error         TEXT,
      worker_id     TEXT,
      started_at    TIMESTAMPTZ,
      completed_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS jobs_queue_status_run_at_idx ON jobs (queue, status, run_at)`;
  schemaReady = true;
}

function newId(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function rowToJob(row: Record<string, unknown>): Job {
  return {
    id: String(row.id),
    queue: String(row.queue),
    type: String(row.type),
    payload: (row.payload as JobPayload) ?? {},
    status: row.status as JobStatus,
    attempts: Number(row.attempts),
    max_attempts: Number(row.max_attempts),
    run_at: String(row.run_at),
    error: row.error == null ? null : String(row.error),
    worker_id: row.worker_id == null ? null : String(row.worker_id),
    started_at: row.started_at == null ? null : String(row.started_at),
    completed_at: row.completed_at == null ? null : String(row.completed_at),
    created_at: String(row.created_at),
  };
}

export async function enqueue(opts: EnqueueOptions): Promise<Job> {
  await ensureSchema();
  const id = newId();
  const runAt = opts.runAt ?? new Date();
  const maxAttempts = opts.maxAttempts ?? 3;
  const rows = (await sql`
    INSERT INTO jobs (id, queue, type, payload, run_at, max_attempts)
    VALUES (${id}, ${opts.queue}, ${opts.type}, ${JSON.stringify(opts.payload)}::jsonb, ${runAt.toISOString()}, ${maxAttempts})
    RETURNING *
  `) as Record<string, unknown>[];
  return rowToJob(rows[0]);
}

export async function dequeue(queueName: string, workerId: string): Promise<Job | null> {
  await ensureSchema();
  const rows = (await sql`
    UPDATE jobs SET
      status = 'running',
      worker_id = ${workerId},
      started_at = NOW(),
      attempts = attempts + 1
    WHERE id = (
      SELECT id FROM jobs
      WHERE queue = ${queueName}
        AND status = 'pending'
        AND run_at <= NOW()
      ORDER BY run_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `) as Record<string, unknown>[];
  if (rows.length === 0) return null;
  return rowToJob(rows[0]);
}

export async function completeJob(id: string): Promise<Job | null> {
  await ensureSchema();
  const rows = (await sql`
    UPDATE jobs SET status = 'completed', completed_at = NOW(), error = NULL
    WHERE id = ${id}
    RETURNING *
  `) as Record<string, unknown>[];
  return rows.length > 0 ? rowToJob(rows[0]) : null;
}

export async function failJob(id: string, error: string): Promise<Job | null> {
  await ensureSchema();
  const current = (await sql`SELECT attempts, max_attempts FROM jobs WHERE id = ${id}`) as Record<string, unknown>[];
  if (current.length === 0) return null;
  const attempts = Number(current[0].attempts);
  const maxAttempts = Number(current[0].max_attempts);

  if (attempts >= maxAttempts) {
    const rows = (await sql`
      UPDATE jobs SET status = 'dead', error = ${error}, completed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `) as Record<string, unknown>[];
    return rows.length > 0 ? rowToJob(rows[0]) : null;
  }

  const backoffSeconds = Math.min(3600, Math.pow(2, attempts) * 30);
  const nextRun = new Date(Date.now() + backoffSeconds * 1000);
  const rows = (await sql`
    UPDATE jobs SET
      status = 'pending',
      error = ${error},
      run_at = ${nextRun.toISOString()},
      worker_id = NULL,
      started_at = NULL
    WHERE id = ${id}
    RETURNING *
  `) as Record<string, unknown>[];
  return rows.length > 0 ? rowToJob(rows[0]) : null;
}

export async function listJobs(queueName: string, status?: JobStatus): Promise<Job[]> {
  await ensureSchema();
  const rows = status
    ? ((await sql`SELECT * FROM jobs WHERE queue = ${queueName} AND status = ${status} ORDER BY created_at DESC LIMIT 200`) as Record<string, unknown>[])
    : ((await sql`SELECT * FROM jobs WHERE queue = ${queueName} ORDER BY created_at DESC LIMIT 200`) as Record<string, unknown>[]);
  return rows.map(rowToJob);
}

export async function retryJob(id: string): Promise<Job | null> {
  await ensureSchema();
  const rows = (await sql`
    UPDATE jobs SET
      status = 'pending',
      run_at = NOW(),
      error = NULL,
      worker_id = NULL,
      started_at = NULL,
      completed_at = NULL
    WHERE id = ${id}
    RETURNING *
  `) as Record<string, unknown>[];
  return rows.length > 0 ? rowToJob(rows[0]) : null;
}
