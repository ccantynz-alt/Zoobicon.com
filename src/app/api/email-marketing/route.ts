import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Real email marketing backend. Replaces all-mock response.
 * Tables: em_subscribers, em_campaigns.
 *
 * GET  ?view=overview|campaigns|subscribers
 * POST create campaign { subject, segment, scheduledAt?, body? }
 */

let ready = false;
async function ensureTables() {
  if (ready) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS em_subscribers (
        id         BIGSERIAL PRIMARY KEY,
        email      TEXT UNIQUE NOT NULL,
        source     TEXT,
        segment    TEXT NOT NULL DEFAULT 'all',
        status     TEXT NOT NULL DEFAULT 'active',
        owner_id   TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS em_campaigns (
        id               TEXT PRIMARY KEY,
        subject          TEXT NOT NULL,
        body             TEXT,
        segment          TEXT NOT NULL DEFAULT 'all',
        status           TEXT NOT NULL DEFAULT 'draft',
        recipient_count  INT NOT NULL DEFAULT 0,
        open_rate        NUMERIC NOT NULL DEFAULT 0,
        click_rate       NUMERIC NOT NULL DEFAULT 0,
        scheduled_at     TIMESTAMPTZ,
        sent_at          TIMESTAMPTZ,
        owner_id         TEXT,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    ready = true;
  } catch (err) {
    console.warn("[email-marketing] ensureTables failed:", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTables();
    const view = new URL(request.url).searchParams.get("view") || "overview";

    if (view === "campaigns") {
      const campaigns = await sql`
        SELECT id, subject, status, segment, sent_at, scheduled_at,
               recipient_count, open_rate, click_rate, created_at
        FROM em_campaigns
        ORDER BY created_at DESC
        LIMIT 200
      `;
      return NextResponse.json({ campaigns, total: (campaigns as unknown[]).length });
    }

    if (view === "subscribers") {
      const subs = await sql`
        SELECT id, email, source, segment, status, created_at
        FROM em_subscribers
        ORDER BY created_at DESC
        LIMIT 500
      `;
      return NextResponse.json({ subscribers: subs });
    }

    // overview
    const stats = (await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'unsubscribed')::int AS unsubscribed,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int AS growth_this_month
      FROM em_subscribers
    `) as Array<{ total: number; active: number; unsubscribed: number; growth_this_month: number }>;

    const topSources = await sql`
      SELECT source, COUNT(*)::int AS count
      FROM em_subscribers
      WHERE source IS NOT NULL
      GROUP BY source
      ORDER BY count DESC
      LIMIT 5
    `;

    const recentCampaigns = await sql`
      SELECT id, subject, status, segment, sent_at, recipient_count, open_rate, click_rate
      FROM em_campaigns
      ORDER BY created_at DESC
      LIMIT 3
    `;

    const totals = (await sql`
      SELECT
        COUNT(*)::int AS total_campaigns,
        COALESCE(AVG(open_rate) FILTER (WHERE status = 'sent'), 0)::numeric(5,2) AS avg_open_rate,
        COALESCE(AVG(click_rate) FILTER (WHERE status = 'sent'), 0)::numeric(5,2) AS avg_click_rate
      FROM em_campaigns
    `) as Array<{ total_campaigns: number; avg_open_rate: string; avg_click_rate: string }>;

    return NextResponse.json({
      subscribers: { ...stats[0], topSources },
      recentCampaigns,
      totalCampaigns: totals[0]?.total_campaigns || 0,
      avgOpenRate: Number(totals[0]?.avg_open_rate || 0),
      avgClickRate: Number(totals[0]?.avg_click_rate || 0),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { subject, segment, scheduledAt, body: content } = body;

    if (!subject || typeof subject !== "string") {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }
    if (!segment) {
      return NextResponse.json({ error: "Segment is required." }, { status: 400 });
    }

    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const status = scheduledAt ? "scheduled" : "draft";

    // Count recipients in segment
    const countRow = (await sql`
      SELECT COUNT(*)::int AS n FROM em_subscribers
      WHERE status = 'active' AND (${segment} = 'all' OR segment = ${segment})
    `) as Array<{ n: number }>;
    const recipientCount = countRow[0]?.n || 0;

    await sql`
      INSERT INTO em_campaigns
        (id, subject, body, segment, status, recipient_count, scheduled_at)
      VALUES
        (${id}, ${subject}, ${content || null}, ${segment}, ${status},
         ${recipientCount}, ${scheduledAt || null})
    `;

    return NextResponse.json(
      {
        success: true,
        campaign: { id, subject, segment, status, recipientCount, scheduledAt: scheduledAt || null },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request body.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
