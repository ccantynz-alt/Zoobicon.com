/**
 * GET/POST /api/v1/data/[collection]
 *
 * Generic per-project data storage for generated sites.
 * A "collection" is any logical bucket: "messages", "bookings", "subscribers", etc.
 * All rows are scoped to a projectId so there's zero cross-site leakage.
 * CORS is open so deployed sites at *.zoobicon.sh can call this.
 */

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function errRes(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: CORS_HEADERS });
}

function sanitiseCollection(raw: string): string {
  return raw.replace(/[^a-z0-9_-]/gi, "").slice(0, 64);
}

// POST /api/v1/data/:collection — insert a row
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const { collection: rawCollection } = await params;
  const collection = sanitiseCollection(rawCollection);
  if (!collection) return errRes(400, "Invalid collection name");

  let body: { projectId?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return errRes(400, "Invalid JSON");
  }

  const { projectId, data } = body;
  if (!projectId || !data || typeof data !== "object") {
    return errRes(400, "projectId and data are required");
  }

  // Optionally attach the authenticated user's ID if a valid session is present
  const authHeader = req.headers.get("authorization");
  let userId: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(raw));
      if (payload.sub && (!payload.exp || payload.exp > Math.floor(Date.now() / 1000))) {
        userId = payload.sub as string;
      }
    } catch {
      // Invalid token — proceed as anonymous
    }
  }

  try {
    const [row] = await sql`
      INSERT INTO site_data (project_id, collection, data, user_id)
      VALUES (${projectId}, ${collection}, ${JSON.stringify(data)}, ${userId})
      RETURNING id, created_at
    `;
    return Response.json({ id: row.id, created_at: row.created_at }, { headers: CORS_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("site_data")) {
      return errRes(503, "Database not ready — visit /api/db/init to initialise");
    }
    return errRes(500, "Server error");
  }
}

// GET /api/v1/data/:collection?projectId=...&filters=...
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const { collection: rawCollection } = await params;
  const collection = sanitiseCollection(rawCollection);
  if (!collection) return errRes(400, "Invalid collection name");

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return errRes(400, "projectId query parameter is required");

  try {
    const rows = await sql`
      SELECT id, data, user_id, created_at FROM site_data
      WHERE project_id = ${projectId} AND collection = ${collection}
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return Response.json({ rows }, { headers: CORS_HEADERS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("site_data")) {
      return errRes(503, "Database not ready — visit /api/db/init to initialise");
    }
    return errRes(500, "Server error");
  }
}

// PATCH /api/v1/data/:collection/:id — handled in separate route
// DELETE /api/v1/data/:collection/:id — handled in separate route
