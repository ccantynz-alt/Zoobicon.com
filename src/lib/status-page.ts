import { sql } from "@/lib/db";

export type IncidentSeverity = "minor" | "major" | "critical";
export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
export type ServiceStatus = "operational" | "degraded" | "down";

export interface StatusPageRow {
  id: number;
  owner_id: string;
  slug: string;
  name: string;
  brand_color: string;
  created_at: string;
}

export interface StatusServiceRow {
  id: number;
  page_id: number;
  name: string;
  check_url: string;
  check_method: string;
  expected_status: number;
  current_status: ServiceStatus;
  created_at: string;
}

export interface StatusCheckRow {
  id: number;
  service_id: number;
  ok: boolean;
  latency_ms: number;
  error: string | null;
  ts: string;
}

export interface StatusIncidentRow {
  id: number;
  page_id: number;
  title: string;
  body: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  started_at: string;
  resolved_at: string | null;
}

export async function ensureStatusTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS status_pages (
      id SERIAL PRIMARY KEY,
      owner_id TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand_color TEXT NOT NULL DEFAULT '#6366f1',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS status_services (
      id SERIAL PRIMARY KEY,
      page_id INTEGER NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      check_url TEXT NOT NULL,
      check_method TEXT NOT NULL DEFAULT 'GET',
      expected_status INTEGER NOT NULL DEFAULT 200,
      current_status TEXT NOT NULL DEFAULT 'operational',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS status_checks (
      id SERIAL PRIMARY KEY,
      service_id INTEGER NOT NULL REFERENCES status_services(id) ON DELETE CASCADE,
      ok BOOLEAN NOT NULL,
      latency_ms INTEGER NOT NULL,
      error TEXT,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS status_incidents (
      id SERIAL PRIMARY KEY,
      page_id INTEGER NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      severity TEXT NOT NULL DEFAULT 'minor',
      status TEXT NOT NULL DEFAULT 'investigating',
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS status_checks_service_ts_idx ON status_checks(service_id, ts DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS status_incidents_page_idx ON status_incidents(page_id, started_at DESC)`;
}

export async function createPage(
  ownerId: string,
  slug: string,
  name: string,
  brandColor = "#6366f1"
): Promise<StatusPageRow> {
  await ensureStatusTables();
  const rows = (await sql`
    INSERT INTO status_pages (owner_id, slug, name, brand_color)
    VALUES (${ownerId}, ${slug}, ${name}, ${brandColor})
    RETURNING *
  `) as StatusPageRow[];
  return rows[0];
}

export interface AddServiceOptions {
  method?: string;
  expectedStatus?: number;
}

export async function addService(
  pageId: number,
  name: string,
  checkUrl: string,
  options: AddServiceOptions = {}
): Promise<StatusServiceRow> {
  await ensureStatusTables();
  const method = options.method ?? "GET";
  const expectedStatus = options.expectedStatus ?? 200;
  const rows = (await sql`
    INSERT INTO status_services (page_id, name, check_url, check_method, expected_status)
    VALUES (${pageId}, ${name}, ${checkUrl}, ${method}, ${expectedStatus})
    RETURNING *
  `) as StatusServiceRow[];
  return rows[0];
}

interface CheckOutcome {
  serviceId: number;
  ok: boolean;
  latencyMs: number;
  error: string | null;
}

async function performCheck(service: StatusServiceRow): Promise<CheckOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const start = Date.now();
  try {
    const res = await fetch(service.check_url, {
      method: service.check_method,
      signal: controller.signal,
    });
    const latency = Date.now() - start;
    const ok = res.status === service.expected_status;
    return {
      serviceId: service.id,
      ok,
      latencyMs: latency,
      error: ok ? null : `status ${res.status}`,
    };
  } catch (err) {
    return {
      serviceId: service.id,
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "unknown error",
    };
  } finally {
    clearTimeout(timer);
  }
}

function deriveStatus(last5: boolean[]): ServiceStatus {
  const okCount = last5.filter(Boolean).length;
  if (okCount >= 5) return "operational";
  if (okCount >= 3) return "degraded";
  return "down";
}

export async function runChecks(pageId: number): Promise<CheckOutcome[]> {
  await ensureStatusTables();
  const services = (await sql`
    SELECT * FROM status_services WHERE page_id = ${pageId}
  `) as StatusServiceRow[];

  const results = await Promise.allSettled(services.map((s) => performCheck(s)));
  const outcomes: CheckOutcome[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const svc = services[i];
    const outcome: CheckOutcome =
      r.status === "fulfilled"
        ? r.value
        : {
            serviceId: svc.id,
            ok: false,
            latencyMs: 0,
            error: r.reason instanceof Error ? r.reason.message : "rejected",
          };
    outcomes.push(outcome);

    await sql`
      INSERT INTO status_checks (service_id, ok, latency_ms, error)
      VALUES (${outcome.serviceId}, ${outcome.ok}, ${outcome.latencyMs}, ${outcome.error})
    `;

    const recent = (await sql`
      SELECT ok FROM status_checks
      WHERE service_id = ${svc.id}
      ORDER BY ts DESC
      LIMIT 5
    `) as { ok: boolean }[];
    const last5 = recent.map((row) => row.ok);
    while (last5.length < 5) last5.push(false);
    const newStatus = deriveStatus(last5);
    await sql`
      UPDATE status_services SET current_status = ${newStatus} WHERE id = ${svc.id}
    `;
  }

  return outcomes;
}

export async function createIncident(
  pageId: number,
  title: string,
  body: string,
  severity: IncidentSeverity
): Promise<StatusIncidentRow> {
  await ensureStatusTables();
  const rows = (await sql`
    INSERT INTO status_incidents (page_id, title, body, severity, status)
    VALUES (${pageId}, ${title}, ${body}, ${severity}, 'investigating')
    RETURNING *
  `) as StatusIncidentRow[];
  return rows[0];
}

export async function updateIncident(
  id: number,
  status: IncidentStatus,
  body?: string
): Promise<StatusIncidentRow> {
  await ensureStatusTables();
  const resolvedAt = status === "resolved" ? new Date().toISOString() : null;
  const rows = (await sql`
    UPDATE status_incidents
    SET status = ${status},
        body = COALESCE(${body ?? null}, body),
        resolved_at = CASE WHEN ${status} = 'resolved' THEN ${resolvedAt} ELSE resolved_at END
    WHERE id = ${id}
    RETURNING *
  `) as StatusIncidentRow[];
  return rows[0];
}

export async function resolveIncident(id: number): Promise<StatusIncidentRow> {
  return updateIncident(id, "resolved");
}

export interface ServiceWithChecks extends StatusServiceRow {
  recentChecks: StatusCheckRow[];
}

export interface PageData {
  page: StatusPageRow;
  services: ServiceWithChecks[];
  openIncidents: StatusIncidentRow[];
  recentIncidents: StatusIncidentRow[];
  uptime30d: number;
}

export async function getPageData(slug: string): Promise<PageData | null> {
  await ensureStatusTables();
  const pageRows = (await sql`
    SELECT * FROM status_pages WHERE slug = ${slug} LIMIT 1
  `) as StatusPageRow[];
  if (pageRows.length === 0) return null;
  const page = pageRows[0];

  const services = (await sql`
    SELECT * FROM status_services WHERE page_id = ${page.id} ORDER BY id ASC
  `) as StatusServiceRow[];

  const servicesWithChecks: ServiceWithChecks[] = [];
  for (const svc of services) {
    const checks = (await sql`
      SELECT * FROM status_checks
      WHERE service_id = ${svc.id}
      ORDER BY ts DESC
      LIMIT 20
    `) as StatusCheckRow[];
    servicesWithChecks.push({ ...svc, recentChecks: checks });
  }

  const openIncidents = (await sql`
    SELECT * FROM status_incidents
    WHERE page_id = ${page.id} AND status != 'resolved'
    ORDER BY started_at DESC
  `) as StatusIncidentRow[];

  const recentIncidents = (await sql`
    SELECT * FROM status_incidents
    WHERE page_id = ${page.id}
    ORDER BY started_at DESC
    LIMIT 20
  `) as StatusIncidentRow[];

  const serviceIds = services.map((s) => s.id);
  let uptime30d = 100;
  if (serviceIds.length > 0) {
    const totals = (await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE ok)::int AS ok_count
      FROM status_checks
      WHERE service_id = ANY(${serviceIds})
        AND ts > NOW() - INTERVAL '30 days'
    `) as { total: number; ok_count: number }[];
    const t = totals[0];
    if (t && t.total > 0) {
      uptime30d = Math.round((t.ok_count / t.total) * 10000) / 100;
    }
  }

  return {
    page,
    services: servicesWithChecks,
    openIncidents,
    recentIncidents,
    uptime30d,
  };
}
