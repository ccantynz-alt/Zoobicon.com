import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET /api/market-intel — Fetch latest market intelligence snapshots
 *
 * Query params:
 *   ?category=website-builder|video-generator|code-tool  (optional filter)
 *   ?limit=50  (default 100)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

    const { sql } = await import("@/lib/db");

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS market_intel (
        id            SERIAL PRIMARY KEY,
        competitor_name TEXT NOT NULL,
        url           TEXT NOT NULL,
        category      TEXT NOT NULL,
        title         TEXT,
        description   TEXT,
        pricing       TEXT,
        features      TEXT[] DEFAULT '{}',
        crawled_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Get latest snapshot per competitor
    let latestSnapshots;
    if (category) {
      latestSnapshots = await sql`
        SELECT DISTINCT ON (competitor_name) *
        FROM market_intel
        WHERE category = ${category}
        ORDER BY competitor_name, crawled_at DESC
      `;
    } else {
      latestSnapshots = await sql`
        SELECT DISTINCT ON (competitor_name) *
        FROM market_intel
        ORDER BY competitor_name, crawled_at DESC
      `;
    }

    // Get recent changes (snapshots where something changed vs previous)
    const recentChanges = await sql`
      SELECT m1.*, m2.title AS prev_title, m2.pricing AS prev_pricing, m2.features AS prev_features
      FROM market_intel m1
      LEFT JOIN LATERAL (
        SELECT title, pricing, features
        FROM market_intel m2
        WHERE m2.competitor_name = m1.competitor_name
          AND m2.crawled_at < m1.crawled_at
        ORDER BY m2.crawled_at DESC
        LIMIT 1
      ) m2 ON true
      WHERE m2.title IS NOT NULL
        AND (m1.title != m2.title OR m1.pricing != m2.pricing OR m1.features != m2.features)
      ORDER BY m1.crawled_at DESC
      LIMIT ${limit}
    `;

    // Get total crawl count
    const stats = await sql`
      SELECT
        COUNT(*) AS total_crawls,
        COUNT(DISTINCT competitor_name) AS competitors_tracked,
        MIN(crawled_at) AS first_crawl,
        MAX(crawled_at) AS last_crawl
      FROM market_intel
    `;

    return NextResponse.json({
      snapshots: latestSnapshots,
      changes: recentChanges,
      stats: stats[0] || { total_crawls: 0, competitors_tracked: 0 },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch market intel" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/market-intel — Trigger a manual crawl of all competitors
 */
export async function POST() {
  try {
    const { runAgent } = await import("@/agents");
    const result = await runAgent("market-crawler");

    if (!result) {
      return NextResponse.json(
        { error: "Market crawler agent not found in registry" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: result.status,
      tasksTotal: result.tasksTotal,
      tasksCompleted: result.tasksCompleted,
      tasksFailed: result.tasksFailed,
      duration: result.duration,
      findings: result.findings,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Crawl failed" },
      { status: 500 }
    );
  }
}
