import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Real invoicing backend. Replaces previous all-mock response.
 * Auto-creates invoicing_clients and invoicing_invoices on first use.
 *
 * GET  /api/invoicing?view=clients|stats|invoices|all&status=draft|sent|paid|overdue
 * POST /api/invoicing { type: "invoice" | "proposal", data: {...} }
 * PUT  /api/invoicing { id, status }
 */

const VALID_STATUSES = ["draft", "sent", "paid", "overdue"] as const;
type Status = (typeof VALID_STATUSES)[number];

let ready = false;
async function ensureTables() {
  if (ready) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS invoicing_clients (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        email        TEXT,
        company      TEXT,
        owner_id     TEXT,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS invoicing_invoices (
        id          TEXT PRIMARY KEY,
        number      TEXT NOT NULL,
        client_id   TEXT,
        client_name TEXT,
        amount      NUMERIC NOT NULL DEFAULT 0,
        status      TEXT NOT NULL DEFAULT 'draft',
        due_date    DATE,
        paid_at     TIMESTAMPTZ,
        owner_id    TEXT,
        type        TEXT NOT NULL DEFAULT 'invoice',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS invoicing_invoices_status_idx ON invoicing_invoices(status)`;
    ready = true;
  } catch (err) {
    console.warn("[invoicing] ensureTables failed:", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTables();
    const { searchParams } = request.nextUrl;
    const view = searchParams.get("view") || "all";
    const status = searchParams.get("status") || "";

    const result: Record<string, unknown> = { success: true };

    if (view === "clients" || view === "all") {
      const rows = await sql`
        SELECT id, name, email, company,
               (SELECT COALESCE(SUM(amount),0) FROM invoicing_invoices i WHERE i.client_id = c.id) AS total_billed,
               (SELECT COUNT(*)            FROM invoicing_invoices i WHERE i.client_id = c.id) AS invoice_count
        FROM invoicing_clients c
        ORDER BY c.created_at DESC
        LIMIT 500
      `;
      result.clients = rows;
    }

    if (view === "invoices" || view === "all") {
      const rows = status && VALID_STATUSES.includes(status as Status)
        ? await sql`SELECT * FROM invoicing_invoices WHERE status = ${status} ORDER BY created_at DESC LIMIT 500`
        : await sql`SELECT * FROM invoicing_invoices ORDER BY created_at DESC LIMIT 500`;
      result.invoices = rows;
    }

    if (view === "stats" || view === "all") {
      const stats = (await sql`
        SELECT
          COALESCE(SUM(CASE WHEN status IN ('sent','overdue') THEN amount ELSE 0 END), 0) AS outstanding,
          COALESCE(SUM(CASE WHEN status = 'paid' AND paid_at >= date_trunc('month', NOW()) THEN amount ELSE 0 END), 0) AS paid_this_month,
          COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) AS overdue,
          COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_revenue
        FROM invoicing_invoices
      `) as Array<Record<string, string>>;
      result.stats = stats[0] || {};
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ success: false, error: "Missing type or data" }, { status: 400 });
    }

    if (type === "invoice" || type === "proposal") {
      const id = `${type === "invoice" ? "inv" : "prop"}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const number = data.number || `${type === "invoice" ? "INV" : "PROP"}-${1000 + Math.floor(Math.random() * 9000)}`;
      const status: Status = VALID_STATUSES.includes(data.status) ? data.status : "draft";
      await sql`
        INSERT INTO invoicing_invoices
          (id, number, client_id, client_name, amount, status, due_date, owner_id, type)
        VALUES (
          ${id}, ${number}, ${data.clientId || null}, ${data.clientName || null},
          ${Number(data.amount) || 0}, ${status}, ${data.dueDate || null},
          ${data.ownerId || null}, ${type}
        )
      `;
      return NextResponse.json({ success: true, [type]: { id, number, status, ...data } });
    }

    return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing id or status" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: `Invalid status: ${status}` }, { status: 400 });
    }

    if (status === "paid") {
      await sql`UPDATE invoicing_invoices SET status = ${status}, paid_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
    } else {
      await sql`UPDATE invoicing_invoices SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true, updated: { id, status } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
