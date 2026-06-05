/**
 * /api/integrations — per-user third-party integration registry.
 *
 * Backs the /admin/integrations page. Saves opaque connection configs
 * (API keys, OAuth tokens, webhook URLs) keyed by (email, service)
 * so the admin dashboard can render "Connected" state and surface
 * the connected account.
 *
 * NOTE on security: configs are stored as JSONB and may contain
 * secrets. Connection happens through this admin-only surface — the
 * UI is gated by admin auth at the page layer. Don't expose this
 * endpoint to non-admin contexts.
 *
 * Schema (auto-creates on first hit, same pattern as hn-flywheel):
 *   user_integrations (
 *     email TEXT, service TEXT, config JSONB, connected_at TIMESTAMPTZ,
 *     PRIMARY KEY (email, service)
 *   )
 *
 * GET    ?email=<user>          → { integrations: [{ service, config, connectedAt }] }
 * POST   { service, email, config }  → { ok: true }
 * DELETE { service, email }          → { ok: true }
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

async function ensureTable(): Promise<void> {
  const sql = getDb();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS user_integrations (
      email         TEXT NOT NULL,
      service       TEXT NOT NULL,
      config        JSONB NOT NULL DEFAULT '{}',
      connected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (email, service)
    )
  `;
}

export async function GET(request: Request) {
  try {
    await ensureTable();
    const sql = getDb();
    if (!sql) return NextResponse.json({ integrations: [] });

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "email query param required" }, { status: 400 });
    }

    const rows = (await sql`
      SELECT service, config, connected_at
      FROM user_integrations
      WHERE email = ${email}
      ORDER BY connected_at DESC
    `) as Array<{ service: string; config: Record<string, string>; connected_at: string }>;

    return NextResponse.json({
      integrations: rows.map((r) => ({
        service: r.service,
        config: r.config,
        connectedAt: r.connected_at,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureTable();
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
    }

    const body = (await request.json()) as {
      service?: string;
      email?: string;
      config?: Record<string, string>;
    };

    if (!body.service || !body.email) {
      return NextResponse.json({ error: "service and email required" }, { status: 400 });
    }

    const config = body.config || {};

    await sql`
      INSERT INTO user_integrations (email, service, config, connected_at)
      VALUES (${body.email}, ${body.service}, ${JSON.stringify(config)}::jsonb, NOW())
      ON CONFLICT (email, service) DO UPDATE
        SET config = EXCLUDED.config,
            connected_at = NOW()
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureTable();
    const sql = getDb();
    if (!sql) {
      return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
    }

    const body = (await request.json()) as { service?: string; email?: string };

    if (!body.service || !body.email) {
      return NextResponse.json({ error: "service and email required" }, { status: 400 });
    }

    await sql`
      DELETE FROM user_integrations
      WHERE email = ${body.email} AND service = ${body.service}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
