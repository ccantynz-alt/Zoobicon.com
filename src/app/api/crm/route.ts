import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Real CRM backend. Replaces the previous all-mock response.
 * Auto-creates crm_contacts and crm_deals tables on first use.
 *
 * GET  /api/crm                 → pipeline grouped by stage + stats
 * POST /api/crm { action, data } → create_contact | create_deal | move_deal | ai_followup
 */

const STAGES = ["lead", "qualified", "proposal", "negotiation", "won"] as const;
type Stage = (typeof STAGES)[number];

let tableReady = false;
async function ensureTables() {
  if (tableReady) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS crm_contacts (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        company    TEXT,
        email      TEXT,
        phone      TEXT,
        owner_id   TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS crm_deals (
        id            TEXT PRIMARY KEY,
        contact_id    TEXT REFERENCES crm_contacts(id) ON DELETE SET NULL,
        contact_name  TEXT,
        company       TEXT,
        title         TEXT,
        value         NUMERIC NOT NULL DEFAULT 0,
        stage         TEXT NOT NULL DEFAULT 'lead',
        score         TEXT,
        owner_id      TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS crm_deals_stage_idx ON crm_deals(stage)`;
    tableReady = true;
  } catch (err) {
    console.warn("[crm] ensureTables failed:", err);
  }
}

export async function GET() {
  try {
    await ensureTables();

    const rows = (await sql`
      SELECT id, contact_name, company, value, stage, score, updated_at
      FROM crm_deals
      ORDER BY updated_at DESC
      LIMIT 500
    `) as Array<{
      id: string;
      contact_name: string;
      company: string;
      value: string;
      stage: string;
      score: string | null;
      updated_at: string;
    }>;

    const stages = STAGES.map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      deals: rows
        .filter((r) => r.stage === id)
        .map((r) => ({
          id: r.id,
          contact: r.contact_name,
          company: r.company,
          value: Number(r.value),
          score: r.score || "warm",
          lastActivity: r.updated_at,
        })),
    }));

    const totalPipeline = rows
      .filter((r) => r.stage !== "won")
      .reduce((s, r) => s + Number(r.value), 0);
    const wonDeals = rows.filter((r) => r.stage === "won");
    const wonThisMonth = wonDeals.reduce((s, r) => s + Number(r.value), 0);
    const closed = rows.filter((r) => r.stage === "won").length;
    const conversionRate = rows.length > 0 ? (closed / rows.length) * 100 : 0;
    const avgDealSize = closed > 0 ? wonThisMonth / closed : 0;

    return NextResponse.json({
      stages,
      stats: {
        totalPipeline,
        wonThisMonth,
        conversionRate: Math.round(conversionRate * 10) / 10,
        avgDealSize: Math.round(avgDealSize),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load CRM";
    return NextResponse.json(
      { error: message, stages: [], stats: {} },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTables();
    const body = await request.json();
    const { action, data = {} } = body;

    if (action === "create_contact") {
      const id = `contact_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      await sql`
        INSERT INTO crm_contacts (id, name, company, email, phone, owner_id)
        VALUES (${id}, ${data.name || "Unknown"}, ${data.company || null},
                ${data.email || null}, ${data.phone || null}, ${data.ownerId || null})
      `;
      return NextResponse.json({ id, ...data });
    }

    if (action === "create_deal") {
      const id = `deal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const stage: Stage = STAGES.includes(data.stage) ? data.stage : "lead";
      await sql`
        INSERT INTO crm_deals
          (id, contact_id, contact_name, company, title, value, stage, score, owner_id)
        VALUES (
          ${id}, ${data.contactId || null}, ${data.contactName || "Unknown"},
          ${data.company || null}, ${data.title || null},
          ${Number(data.value) || 0}, ${stage}, ${data.score || "warm"},
          ${data.ownerId || null}
        )
      `;
      return NextResponse.json({ id, stage, ...data });
    }

    if (action === "move_deal") {
      const stage: Stage = STAGES.includes(data.newStage) ? data.newStage : "lead";
      await sql`
        UPDATE crm_deals
        SET stage = ${stage}, updated_at = NOW()
        WHERE id = ${data.dealId}
      `;
      return NextResponse.json({ id: data.dealId, stage });
    }

    if (action === "ai_followup") {
      // Lightweight deterministic draft — real LLM call is /api/crm/generate
      return NextResponse.json({
        email: {
          subject: `Following up on ${data.dealName || "our conversation"}`,
          body: `Hi ${data.contactName || "there"},\n\nWanted to circle back on ${
            data.dealName || "our recent discussion"
          }. Happy to jump on a 15-minute call this week to answer any questions and map out next steps.\n\nWhat day works best?\n\nThanks`,
        },
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "CRM action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
