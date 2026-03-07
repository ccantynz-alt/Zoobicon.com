import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory storage — would be backed by a time-series database (e.g.
// ClickHouse, TimescaleDB) in production.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers — realistic mock data generators
// ---------------------------------------------------------------------------
const PERIODS: Record<string, { days: number; label: string }> = {
  "24h": { days: 1, label: "Last 24 hours" },
  "7d": { days: 7, label: "Last 7 days" },
  "30d": { days: 30, label: "Last 30 days" },
  "90d": { days: 90, label: "Last 90 days" },
};

function seededRandom(seed: number): () => number {
  // Simple mulberry32 PRNG for deterministic results per siteId + period.
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash;
}

function generateDateSeries(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

interface AnalyticsPayload {
  siteId: string;
  period: string;
  periodLabel: string;
  visitors: {
    total: number;
    unique: number;
    chart: Array<{ date: string; count: number }>;
  };
  pageViews: {
    total: number;
    topPages: Array<{ path: string; views: number }>;
  };
  bandwidth: {
    total: number;
    chart: Array<{ date: string; bytes: number }>;
  };
  performance: {
    avgLoadTime: number;
    p95LoadTime: number;
    uptime: number;
  };
  geographic: Array<{ country: string; visitors: number; percentage: number }>;
  referrers: Array<{ source: string; visitors: number }>;
  devices: { desktop: number; mobile: number; tablet: number };
  statusCodes: { "200": number; "301": number; "404": number; "500": number };
}

function generateAnalytics(
  siteId: string,
  period: string,
  days: number
): AnalyticsPayload {
  const rand = seededRandom(hashString(siteId + period));

  // Scale baseline by period length
  const baseVisitors = Math.floor(rand() * 4000 + 1000) * days;
  const uniqueRatio = 0.55 + rand() * 0.2;
  const totalVisitors = baseVisitors;
  const uniqueVisitors = Math.floor(totalVisitors * uniqueRatio);

  // Visitor chart
  const dates = generateDateSeries(days);
  const visitorChart = dates.map((date) => ({
    date,
    count: Math.floor(
      (totalVisitors / days) * (0.6 + rand() * 0.8)
    ),
  }));

  // Page views
  const totalPageViews = Math.floor(totalVisitors * (2.1 + rand() * 1.5));
  const topPages = [
    { path: "/", views: Math.floor(totalPageViews * (0.3 + rand() * 0.1)) },
    {
      path: "/pricing",
      views: Math.floor(totalPageViews * (0.1 + rand() * 0.08)),
    },
    {
      path: "/docs",
      views: Math.floor(totalPageViews * (0.08 + rand() * 0.06)),
    },
    {
      path: "/blog",
      views: Math.floor(totalPageViews * (0.06 + rand() * 0.05)),
    },
    {
      path: "/about",
      views: Math.floor(totalPageViews * (0.04 + rand() * 0.03)),
    },
    {
      path: "/contact",
      views: Math.floor(totalPageViews * (0.03 + rand() * 0.02)),
    },
    {
      path: "/login",
      views: Math.floor(totalPageViews * (0.05 + rand() * 0.03)),
    },
    {
      path: "/signup",
      views: Math.floor(totalPageViews * (0.03 + rand() * 0.02)),
    },
  ].sort((a, b) => b.views - a.views);

  // Bandwidth
  const avgBytesPerVisit = 1.2 * 1024 * 1024 + rand() * 3 * 1024 * 1024;
  const totalBandwidth = Math.floor(totalVisitors * avgBytesPerVisit);
  const bandwidthChart = dates.map((date) => ({
    date,
    bytes: Math.floor(
      (totalBandwidth / days) * (0.7 + rand() * 0.6)
    ),
  }));

  // Performance
  const avgLoadTime = Math.round((180 + rand() * 600) * 100) / 100; // ms
  const p95LoadTime = Math.round(avgLoadTime * (2.2 + rand() * 1.5) * 100) / 100;
  const uptime = Math.round((99.9 + rand() * 0.099) * 1000) / 1000;

  // Geographic
  const geoData = [
    { country: "United States", weight: 0.35 + rand() * 0.1 },
    { country: "United Kingdom", weight: 0.08 + rand() * 0.04 },
    { country: "Germany", weight: 0.07 + rand() * 0.03 },
    { country: "Canada", weight: 0.05 + rand() * 0.03 },
    { country: "France", weight: 0.04 + rand() * 0.02 },
    { country: "India", weight: 0.06 + rand() * 0.04 },
    { country: "Australia", weight: 0.03 + rand() * 0.02 },
    { country: "Japan", weight: 0.03 + rand() * 0.02 },
    { country: "Brazil", weight: 0.04 + rand() * 0.02 },
    { country: "Netherlands", weight: 0.02 + rand() * 0.01 },
  ];
  const totalWeight = geoData.reduce((s, g) => s + g.weight, 0);
  const geographic = geoData
    .map((g) => {
      const pct = (g.weight / totalWeight) * 100;
      return {
        country: g.country,
        visitors: Math.floor(uniqueVisitors * (g.weight / totalWeight)),
        percentage: Math.round(pct * 100) / 100,
      };
    })
    .sort((a, b) => b.visitors - a.visitors);

  // Referrers
  const referrers = [
    { source: "Google", visitors: Math.floor(uniqueVisitors * (0.4 + rand() * 0.15)) },
    { source: "Direct", visitors: Math.floor(uniqueVisitors * (0.2 + rand() * 0.1)) },
    { source: "Twitter / X", visitors: Math.floor(uniqueVisitors * (0.05 + rand() * 0.04)) },
    { source: "GitHub", visitors: Math.floor(uniqueVisitors * (0.04 + rand() * 0.03)) },
    { source: "LinkedIn", visitors: Math.floor(uniqueVisitors * (0.03 + rand() * 0.02)) },
    { source: "Reddit", visitors: Math.floor(uniqueVisitors * (0.02 + rand() * 0.02)) },
    { source: "Hacker News", visitors: Math.floor(uniqueVisitors * (0.01 + rand() * 0.01)) },
  ].sort((a, b) => b.visitors - a.visitors);

  // Devices
  const desktopPct = 0.55 + rand() * 0.15;
  const mobilePct = (1 - desktopPct) * (0.7 + rand() * 0.2);
  const tabletPct = 1 - desktopPct - mobilePct;
  const devices = {
    desktop: Math.round(desktopPct * 10000) / 100,
    mobile: Math.round(mobilePct * 10000) / 100,
    tablet: Math.round(tabletPct * 10000) / 100,
  };

  // Status codes
  const totalRequests = totalPageViews + Math.floor(totalPageViews * 3 * rand());
  const statusCodes = {
    "200": Math.floor(totalRequests * (0.92 + rand() * 0.05)),
    "301": Math.floor(totalRequests * (0.02 + rand() * 0.02)),
    "404": Math.floor(totalRequests * (0.005 + rand() * 0.01)),
    "500": Math.floor(totalRequests * (0.001 + rand() * 0.002)),
  };

  return {
    siteId,
    period,
    periodLabel: PERIODS[period]?.label ?? period,
    visitors: { total: totalVisitors, unique: uniqueVisitors, chart: visitorChart },
    pageViews: { total: totalPageViews, topPages },
    bandwidth: { total: totalBandwidth, chart: bandwidthChart },
    performance: { avgLoadTime, p95LoadTime, uptime },
    geographic,
    referrers,
    devices,
    statusCodes,
  };
}

// ---------------------------------------------------------------------------
// GET /api/hosting/analytics?siteId=...&period=24h|7d|30d|90d
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get("siteId");
    const period = req.nextUrl.searchParams.get("period") ?? "24h";

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId query parameter is required." },
        { status: 400 }
      );
    }

    if (!PERIODS[period]) {
      return NextResponse.json(
        {
          error: `Invalid period. Choose one of: ${Object.keys(PERIODS).join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const data = generateAnalytics(siteId, period, PERIODS[period].days);

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
