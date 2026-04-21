import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Public subscribe endpoint — can be called from any signup form, widget,
 * or landing page to add an email to em_subscribers. Idempotent: duplicate
 * emails are upserted (last source wins, status reactivated).
 *
 * POST /api/email-marketing/subscribe
 *   Body: { email, source?, segment?, ownerId? }
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source = "api", segment = "all", ownerId } = body;

    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "valid email is required" },
        { status: 400, headers: CORS }
      );
    }

    // ensure table exists (mirrors schema in ../route.ts)
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
      INSERT INTO em_subscribers (email, source, segment, status, owner_id)
      VALUES (${email.toLowerCase()}, ${source}, ${segment}, 'active', ${ownerId || null})
      ON CONFLICT (email) DO UPDATE
        SET source = EXCLUDED.source,
            segment = EXCLUDED.segment,
            status = 'active'
    `;

    return NextResponse.json({ success: true, email }, { headers: CORS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "subscribe failed";
    console.error("[email-marketing/subscribe]", message);
    // Never break the form UX — return 200 even on failure
    return NextResponse.json(
      { success: false, error: message },
      { status: 200, headers: CORS }
    );
  }
}
