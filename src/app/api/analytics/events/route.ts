import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Real analytics event tracking API (replaces localStorage-only mock).
 *
 * POST — log an event
 *   Body: { event: string, userId?: string, url?: string, properties?: object }
 *
 * GET — query events
 *   Query: ?event=&userId=&limit=&since=
 *
 * Auto-creates the analytics_events table on first use.
 */

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id            BIGSERIAL PRIMARY KEY,
        event         TEXT NOT NULL,
        user_id       TEXT,
        url           TEXT,
        referrer      TEXT,
        user_agent    TEXT,
        properties    JSONB,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS analytics_events_event_idx ON analytics_events(event)`;
    await sql`CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON analytics_events(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events(created_at DESC)`;
    tableReady = true;
  } catch (err) {
    // DB unavailable — fall through and let the query itself fail
    console.warn("[analytics/events] ensureTable failed:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();

    const body = await req.json();
    const { event, userId, url, properties } = body;

    if (!event || typeof event !== "string") {
      return NextResponse.json({ error: "event is required" }, { status: 400 });
    }

    const referrer = req.headers.get("referer") || null;
    const userAgent = req.headers.get("user-agent") || null;

    await sql`
      INSERT INTO analytics_events (event, user_id, url, referrer, user_agent, properties)
      VALUES (
        ${event},
        ${userId || null},
        ${url || null},
        ${referrer},
        ${userAgent},
        ${properties ? JSON.stringify(properties) : null}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to log event";
    // Don't fail the client — analytics should never break the app
    console.error("[analytics/events] POST error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 200 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTable();

    const params = req.nextUrl.searchParams;
    const event = params.get("event");
    const userId = params.get("userId");
    const limitRaw = parseInt(params.get("limit") || "100", 10);
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 100 : limitRaw), 1000);
    const since = params.get("since"); // ISO timestamp

    // Build conditional query
    let rows;
    if (event && userId && since) {
      rows = await sql`
        SELECT event, user_id, url, properties, created_at
        FROM analytics_events
        WHERE event = ${event} AND user_id = ${userId} AND created_at >= ${since}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else if (event && userId) {
      rows = await sql`
        SELECT event, user_id, url, properties, created_at
        FROM analytics_events
        WHERE event = ${event} AND user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else if (event) {
      rows = await sql`
        SELECT event, user_id, url, properties, created_at
        FROM analytics_events
        WHERE event = ${event}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else if (userId) {
      rows = await sql`
        SELECT event, user_id, url, properties, created_at
        FROM analytics_events
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      rows = await sql`
        SELECT event, user_id, url, properties, created_at
        FROM analytics_events
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    // Aggregate counts by event for summary
    const summary = await sql`
      SELECT event, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY event
      ORDER BY count DESC
      LIMIT 20
    `;

    return NextResponse.json({
      events: rows,
      summary,
      total: rows.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch events";
    return NextResponse.json({ error: message, events: [], summary: [] }, { status: 500 });
  }
}
