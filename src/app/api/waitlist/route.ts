import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/waitlist
 *
 * Accepts a waitlist signup from the Coming Soon banner (and any other
 * waitlist capture on the site). Persists to Neon if DATABASE_URL is set,
 * otherwise logs to console so we still know about the lead.
 *
 * Deliberately permissive:
 * - No auth required
 * - Never throws on client — worst case we return 200 + logged:false
 * - Safe against schema missing (table may not exist yet)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const source = (body.source || "unknown").toString().slice(0, 64);

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
  }

  // Always log so we have a trail even without a DB
  console.log(`[waitlist] signup email=${email} source=${source}`);

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ ok: true, logged: true, persisted: false });
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(dbUrl);
    // Create the table lazily if missing so the first signup ever still works
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist_signups (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        source TEXT,
        user_agent TEXT,
        ip TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (email, source)
      )
    `;
    const ua = req.headers.get("user-agent")?.slice(0, 300) || null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    await sql`
      INSERT INTO waitlist_signups (email, source, user_agent, ip)
      VALUES (${email}, ${source}, ${ua}, ${ip})
      ON CONFLICT (email, source) DO NOTHING
    `;
    return NextResponse.json({ ok: true, persisted: true });
  } catch (err) {
    // Persistence failure is NOT a user-visible error — we still captured it
    // in the logs above. Return 200 so the UI thanks the visitor.
    console.error("[waitlist] persistence failed:", err);
    return NextResponse.json({ ok: true, persisted: false });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "waitlist",
    method: "POST",
    body: { email: "string", source: "string (optional)" },
  });
}
