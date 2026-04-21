import { sql } from "@/lib/db";
import crypto from "crypto";

export interface TrackInput {
  siteId: string;
  eventType: "pageview" | "click" | "custom";
  path: string;
  referrer?: string;
  userAgent: string;
  ip: string;
  country?: string;
}

export interface AnalyticsStats {
  pageviews: number;
  uniqueVisitors: number;
  topPaths: Array<{ path: string; count: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  devices: Array<{ device: string; count: number }>;
  browsers: Array<{ browser: string; count: number }>;
  dailyTimeline: Array<{ day: string; pageviews: number; visitors: number }>;
}

export interface AnalyticsSite {
  id: string;
  owner_id: string;
  domain: string;
  created_at: string;
}

let tablesEnsured = false;

export async function ensureAnalyticsTables(): Promise<void> {
  if (tablesEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS analytics_sites (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id BIGSERIAL PRIMARY KEY,
      site_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      path TEXT NOT NULL,
      referrer TEXT,
      country TEXT,
      device TEXT,
      browser TEXT,
      visitor_hash TEXT NOT NULL,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_analytics_site_ts ON analytics_events(site_id, ts DESC)`;
  tablesEnsured = true;
}

function dailySalt(): string {
  const day = new Date().toISOString().slice(0, 10);
  const base = process.env.ANALYTICS_SALT_BASE || "zoobicon-analytics-default-salt";
  return `${base}:${day}`;
}

function hashVisitor(ip: string, ua: string, siteId: string): string {
  return crypto
    .createHash("sha256")
    .update(`${dailySalt()}:${siteId}:${ip}:${ua}`)
    .digest("hex")
    .slice(0, 32);
}

function parseDevice(ua: string): string {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobile|iPhone|Android/i.test(ua)) return "mobile";
  return "desktop";
}

function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Other";
}

export async function trackEvent(input: TrackInput): Promise<void> {
  await ensureAnalyticsTables();
  const visitorHash = hashVisitor(input.ip, input.userAgent, input.siteId);
  const device = parseDevice(input.userAgent);
  const browser = parseBrowser(input.userAgent);
  const referrer = input.referrer ? input.referrer.slice(0, 500) : null;
  const country = input.country || null;
  await sql`
    INSERT INTO analytics_events (site_id, event_type, path, referrer, country, device, browser, visitor_hash)
    VALUES (${input.siteId}, ${input.eventType}, ${input.path.slice(0, 500)}, ${referrer}, ${country}, ${device}, ${browser}, ${visitorHash})
  `;
}

interface CountRow {
  count: string | number;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseInt(v, 10) || 0;
  return 0;
}

export async function getStats(siteId: string, days = 7): Promise<AnalyticsStats> {
  await ensureAnalyticsTables();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const pvRows = (await sql`
    SELECT COUNT(*)::int AS count FROM analytics_events
    WHERE site_id = ${siteId} AND ts >= ${since} AND event_type = 'pageview'
  `) as unknown as CountRow[];
  const uvRows = (await sql`
    SELECT COUNT(DISTINCT visitor_hash)::int AS count FROM analytics_events
    WHERE site_id = ${siteId} AND ts >= ${since}
  `) as unknown as CountRow[];

  const pathRows = (await sql`
    SELECT path, COUNT(*)::int AS count FROM analytics_events
    WHERE site_id = ${siteId} AND ts >= ${since} AND event_type = 'pageview'
    GROUP BY path ORDER BY count DESC LIMIT 10
  `) as unknown as Array<{ path: string; count: number | string }>;

  const refRows = (await sql`
    SELECT COALESCE(referrer, 'direct') AS referrer, COUNT(*)::int AS count FROM analytics_events
    WHERE site_id = ${siteId} AND ts >= ${since}
    GROUP BY referrer ORDER BY count DESC LIMIT 10
  `) as unknown as Array<{ referrer: string; count: number | string }>;

  const countryRows = (await sql`
    SELECT COALESCE(country, 'unknown') AS country, COUNT(*)::int AS count FROM analytics_events
    WHERE site_id = ${siteId} AND ts >= ${since}
    GROUP BY country ORDER BY count DESC LIMIT 10
  `) as unknown as Array<{ country: string; count: number | string }>;

  const deviceRows = (await sql`
    SELECT COALESCE(device, 'unknown') AS device, COUNT(*)::int AS count FROM analytics_events
    WHERE site_id = ${siteId} AND ts >= ${since}
    GROUP BY device ORDER BY count DESC
  `) as unknown as Array<{ device: string; count: number | string }>;

  const browserRows = (await sql`
    SELECT COALESCE(browser, 'unknown') AS browser, COUNT(*)::int AS count FROM analytics_events
    WHERE site_id = ${siteId} AND ts >= ${since}
    GROUP BY browser ORDER BY count DESC
  `) as unknown as Array<{ browser: string; count: number | string }>;

  const timelineRows = (await sql`
    SELECT to_char(date_trunc('day', ts), 'YYYY-MM-DD') AS day,
      COUNT(*) FILTER (WHERE event_type = 'pageview')::int AS pageviews,
      COUNT(DISTINCT visitor_hash)::int AS visitors
    FROM analytics_events
    WHERE site_id = ${siteId} AND ts >= ${since}
    GROUP BY day ORDER BY day ASC
  `) as unknown as Array<{ day: string; pageviews: number | string; visitors: number | string }>;

  return {
    pageviews: toNum(pvRows[0]?.count),
    uniqueVisitors: toNum(uvRows[0]?.count),
    topPaths: pathRows.map((r) => ({ path: r.path, count: toNum(r.count) })),
    topReferrers: refRows.map((r) => ({ referrer: r.referrer, count: toNum(r.count) })),
    topCountries: countryRows.map((r) => ({ country: r.country, count: toNum(r.count) })),
    devices: deviceRows.map((r) => ({ device: r.device, count: toNum(r.count) })),
    browsers: browserRows.map((r) => ({ browser: r.browser, count: toNum(r.count) })),
    dailyTimeline: timelineRows.map((r) => ({
      day: r.day,
      pageviews: toNum(r.pageviews),
      visitors: toNum(r.visitors),
    })),
  };
}

export async function createSite(ownerId: string, domain: string): Promise<AnalyticsSite> {
  await ensureAnalyticsTables();
  const id = crypto.randomBytes(8).toString("hex");
  await sql`
    INSERT INTO analytics_sites (id, owner_id, domain)
    VALUES (${id}, ${ownerId}, ${domain})
  `;
  const rows = (await sql`
    SELECT id, owner_id, domain, created_at FROM analytics_sites WHERE id = ${id}
  `) as unknown as AnalyticsSite[];
  return rows[0];
}

export async function listSites(ownerId: string): Promise<AnalyticsSite[]> {
  await ensureAnalyticsTables();
  const rows = (await sql`
    SELECT id, owner_id, domain, created_at FROM analytics_sites
    WHERE owner_id = ${ownerId} ORDER BY created_at DESC
  `) as unknown as AnalyticsSite[];
  return rows;
}
