import { getSQL } from "./db";

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  description: string;
  started_at: string;
  stopped_at: string | null;
  duration_seconds: number;
  billable: boolean;
  created_at: string;
}

export interface Range {
  from?: string;
  to?: string;
}

export interface ProjectReportRow {
  project_id: string;
  total_seconds: number;
  entries: number;
}

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const sql = getSQL();
  await sql`CREATE TABLE IF NOT EXISTS time_entries (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    project_id text NOT NULL,
    description text NOT NULL DEFAULT '',
    started_at timestamptz NOT NULL,
    stopped_at timestamptz,
    duration_seconds integer NOT NULL DEFAULT 0,
    billable boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  schemaReady = true;
}

function newId(): string {
  return `tmr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function startTimer(input: {
  userId: string;
  projectId: string;
  description?: string;
}): Promise<TimeEntry> {
  await ensureSchema();
  const sql = getSQL();
  const id = newId();
  const rows = (await sql`INSERT INTO time_entries
    (id, user_id, project_id, description, started_at, stopped_at, duration_seconds, billable)
    VALUES (${id}, ${input.userId}, ${input.projectId}, ${input.description ?? ""}, now(), NULL, 0, true)
    RETURNING *`) as unknown as TimeEntry[];
  return rows[0];
}

export async function stopTimer(timerId: string): Promise<TimeEntry | null> {
  await ensureSchema();
  const sql = getSQL();
  const rows = (await sql`UPDATE time_entries
    SET stopped_at = now(),
        duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (now() - started_at))::int)
    WHERE id = ${timerId} AND stopped_at IS NULL
    RETURNING *`) as unknown as TimeEntry[];
  return rows[0] ?? null;
}

export async function listTimers(userId: string, range: Range = {}): Promise<TimeEntry[]> {
  await ensureSchema();
  const sql = getSQL();
  const from = range.from ?? "1970-01-01";
  const to = range.to ?? "2999-12-31";
  const rows = (await sql`SELECT * FROM time_entries
    WHERE user_id = ${userId}
      AND started_at >= ${from}
      AND started_at <= ${to}
    ORDER BY started_at DESC`) as unknown as TimeEntry[];
  return rows;
}

export async function reportByProject(
  userId: string,
  range: Range = {}
): Promise<ProjectReportRow[]> {
  const entries = await listTimers(userId, range);
  const map = new Map<string, ProjectReportRow>();
  for (const e of entries) {
    const cur = map.get(e.project_id) ?? {
      project_id: e.project_id,
      total_seconds: 0,
      entries: 0,
    };
    cur.total_seconds += e.duration_seconds;
    cur.entries += 1;
    map.set(e.project_id, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.total_seconds - a.total_seconds);
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportTimesheetCsv(userId: string, range: Range = {}): Promise<string> {
  const entries = await listTimers(userId, range);
  const header = [
    "id",
    "user_id",
    "project_id",
    "description",
    "started_at",
    "stopped_at",
    "duration_seconds",
    "billable",
  ].join(",");
  const lines = entries.map((e) =>
    [
      e.id,
      e.user_id,
      e.project_id,
      csvEscape(e.description ?? ""),
      e.started_at,
      e.stopped_at ?? "",
      String(e.duration_seconds),
      String(e.billable),
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

export async function billableTotal(
  userId: string,
  range: Range,
  hourlyRate: number
): Promise<{ seconds: number; hours: number; amount: number }> {
  const entries = await listTimers(userId, range);
  const seconds = entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.duration_seconds, 0);
  const hours = seconds / 3600;
  const amount = Math.round(hours * hourlyRate * 100) / 100;
  return { seconds, hours, amount };
}
