import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory storage with DB fallback (same pattern as dns/ssl routes)
// ---------------------------------------------------------------------------
interface Integration {
  id: string;
  service: string;
  status: "connected" | "disconnected";
  config: Record<string, string>;
  connectedAt: string;
  userEmail: string;
}

const memoryStore = new Map<string, Integration>();

// ---------------------------------------------------------------------------
// Database helpers (graceful — returns null if DB unavailable)
// ---------------------------------------------------------------------------
async function getDb() {
  try {
    const { sql } = await import("@/lib/db");
    return sql;
  } catch {
    return null;
  }
}

async function ensureTable() {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        service TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'connected',
        config JSONB DEFAULT '{}',
        connected_at TIMESTAMPTZ DEFAULT NOW(),
        user_email TEXT NOT NULL
      )
    `;
    return true;
  } catch {
    return false;
  }
}

async function dbList(email: string): Promise<Integration[] | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    await ensureTable();
    const rows = await sql`
      SELECT id, service, status, config, connected_at, user_email
      FROM integrations
      WHERE user_email = ${email}
      ORDER BY connected_at DESC
    `;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      service: r.service as string,
      status: r.status as Integration["status"],
      config: (r.config as Record<string, string>) || {},
      connectedAt: (r.connected_at as string) || new Date().toISOString(),
      userEmail: r.user_email as string,
    }));
  } catch {
    return null;
  }
}

async function dbUpsert(integration: Integration): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await ensureTable();
    await sql`
      INSERT INTO integrations (id, service, status, config, connected_at, user_email)
      VALUES (${integration.id}, ${integration.service}, ${integration.status},
              ${JSON.stringify(integration.config)}::jsonb, ${integration.connectedAt}, ${integration.userEmail})
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        config = EXCLUDED.config,
        connected_at = EXCLUDED.connected_at
    `;
    return true;
  } catch {
    return false;
  }
}

async function dbDelete(service: string, email: string): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await ensureTable();
    await sql`
      DELETE FROM integrations WHERE service = ${service} AND user_email = ${email}
    `;
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// GET /api/integrations?email=...
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email query parameter required" }, { status: 400 });
  }

  // Try DB first
  const dbResults = await dbList(email);
  if (dbResults !== null) {
    return NextResponse.json({ integrations: dbResults });
  }

  // Fallback to memory
  const results: Integration[] = [];
  memoryStore.forEach((v) => {
    if (v.userEmail === email && v.status === "connected") results.push(v);
  });

  return NextResponse.json({ integrations: results });
}

// ---------------------------------------------------------------------------
// POST /api/integrations  { service, config, email }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, config, email } = body;

    if (!service || !email) {
      return NextResponse.json({ error: "service and email are required" }, { status: 400 });
    }

    const integration: Integration = {
      id: randomUUID(),
      service,
      status: "connected",
      config: config || {},
      connectedAt: new Date().toISOString(),
      userEmail: email,
    };

    // Try DB first
    const saved = await dbUpsert(integration);
    if (!saved) {
      // Fallback to memory
      memoryStore.set(`${email}:${service}`, integration);
    }

    return NextResponse.json({ integration }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/integrations  { service, email }
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { service, email } = body;

    if (!service || !email) {
      return NextResponse.json({ error: "service and email are required" }, { status: 400 });
    }

    // Try DB first
    const deleted = await dbDelete(service, email);
    if (!deleted) {
      // Fallback to memory
      memoryStore.delete(`${email}:${service}`);
    }

    return NextResponse.json({ success: true, service });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
