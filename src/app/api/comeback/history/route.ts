import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ComebackRunRow {
  id: string;
  site_id: string;
  owner_id: string | null;
  ran_at: string;
  steps: unknown;
  email_sent: boolean;
}

interface SiteHistory {
  siteId: string;
  runs: Array<{
    id: string;
    ranAt: string;
    steps: unknown;
    emailSent: boolean;
  }>;
}

async function ensureTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS comeback_runs (
      id         TEXT PRIMARY KEY,
      site_id    TEXT NOT NULL,
      owner_id   TEXT,
      ran_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      steps      JSONB NOT NULL DEFAULT '{}'::jsonb,
      email_sent BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not set" },
      { status: 503 }
    );
  }

  const userId = req.nextUrl.searchParams.get("userId");

  try {
    await ensureTable();

    const rows = (userId
      ? await sql`
          SELECT id, site_id, owner_id, ran_at, steps, email_sent
          FROM comeback_runs
          WHERE owner_id = ${userId}
            AND ran_at >= NOW() - INTERVAL '30 days'
          ORDER BY ran_at DESC
        `
      : await sql`
          SELECT id, site_id, owner_id, ran_at, steps, email_sent
          FROM comeback_runs
          WHERE ran_at >= NOW() - INTERVAL '30 days'
          ORDER BY ran_at DESC
        `) as unknown as ComebackRunRow[];

    const grouped = new Map<string, SiteHistory>();
    for (const row of rows) {
      const existing = grouped.get(row.site_id);
      const entry = {
        id: row.id,
        ranAt:
          typeof row.ran_at === "string"
            ? row.ran_at
            : new Date(row.ran_at).toISOString(),
        steps: row.steps,
        emailSent: row.email_sent,
      };
      if (existing) {
        existing.runs.push(entry);
      } else {
        grouped.set(row.site_id, { siteId: row.site_id, runs: [entry] });
      }
    }

    return NextResponse.json({
      ok: true,
      sites: Array.from(grouped.values()),
      totalRuns: rows.length,
      windowDays: 30,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: `History fetch failed: ${message}` },
      { status: 500 }
    );
  }
}
