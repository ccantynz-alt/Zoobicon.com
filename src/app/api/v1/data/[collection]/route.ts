/**
 * GET/POST /api/v1/data/[collection]
 *
 * Generic per-project data storage for generated sites.
 * A "collection" is any logical bucket: "messages", "bookings", "subscribers", etc.
 * All rows are scoped to a projectId so there's zero cross-site leakage.
 *
 * CORS: by default we only echo back trusted origins (zoobicon.sh + zoobicon.com
 * subdomains). To open up to a customer's external domain, set
 * NEXT_PUBLIC_DATA_API_ALLOWED_ORIGINS to a comma-separated list.
 *
 * Auth: an Authorization header is OPTIONAL. If present, the JWT is fully
 * verified (HS256, signed with JWT_SECRET) and the payload's `sub` is stored
 * with the row. A FORGED or INVALID token is rejected with 401 — the
 * previous implementation silently parsed unverified payloads, which let
 * any caller impersonate any user.
 */

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { verifyJwtHS256 } from "@/lib/jwt-verify";

const ALLOWED_ORIGIN_SUFFIXES = [
  ".zoobicon.sh",
  ".zoobicon.com",
  ".zoobicon.app",
  ".zoobicon.io",
  ".zoobicon.ai",
];

function getExtraAllowedOrigins(): string[] {
  const raw = process.env.NEXT_PUBLIC_DATA_API_ALLOWED_ORIGINS || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === "https://zoobicon.com" || origin === "https://www.zoobicon.com") return true;
  for (const suffix of ALLOWED_ORIGIN_SUFFIXES) {
    if (origin.endsWith(suffix) || origin.includes(`://`) && new URL(origin).hostname.endsWith(suffix)) {
      return true;
    }
  }
  for (const extra of getExtraAllowedOrigins()) {
    if (origin === extra) return true;
  }
  return false;
}

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  const allow = origin && isAllowedOrigin(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

function errRes(req: NextRequest, status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: corsHeaders(req) });
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
  if (!collection) return errRes(req, 400, "Invalid collection name");

  let body: { projectId?: string; data?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return errRes(req, 400, "Invalid JSON");
  }

  const { projectId, data } = body;
  if (!projectId || !data || typeof data !== "object") {
    return errRes(req, 400, "projectId and data are required");
  }

  // Optionally attach the authenticated user's ID if a valid JWT is present.
  // The token MUST be HS256-signed with JWT_SECRET. A malformed, forged, or
  // expired token returns 401 — silently downgrading to anonymous would
  // hide tampering and let callers pick any sub they wanted.
  const authHeader = req.headers.get("authorization");
  let userId: string | null = null;
  if (authHeader) {
    if (!authHeader.startsWith("Bearer ")) {
      return errRes(req, 401, "Authorization header must use Bearer scheme");
    }
    const token = authHeader.slice(7).trim();
    if (token.length > 0) {
      const claims = await verifyJwtHS256(token, process.env.JWT_SECRET);
      if (!claims) {
        return errRes(req, 401, "Invalid or expired token");
      }
      if (typeof claims.sub === "string") userId = claims.sub;
    }
  }

  try {
    const [row] = await sql`
      INSERT INTO site_data (project_id, collection, data, user_id)
      VALUES (${projectId}, ${collection}, ${JSON.stringify(data)}, ${userId})
      RETURNING id, created_at
    `;
    return Response.json({ id: row.id, created_at: row.created_at }, { headers: corsHeaders(req) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("site_data")) {
      return errRes(req, 503, "Database not ready — visit /api/db/init to initialise");
    }
    return errRes(req, 500, "Server error");
  }
}

// GET /api/v1/data/:collection?projectId=...&filters=...
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const { collection: rawCollection } = await params;
  const collection = sanitiseCollection(rawCollection);
  if (!collection) return errRes(req, 400, "Invalid collection name");

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return errRes(req, 400, "projectId query parameter is required");

  try {
    const rows = await sql`
      SELECT id, data, user_id, created_at FROM site_data
      WHERE project_id = ${projectId} AND collection = ${collection}
      ORDER BY created_at DESC
      LIMIT 500
    `;
    return Response.json({ rows }, { headers: corsHeaders(req) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("DATABASE_URL") || msg.includes("site_data")) {
      return errRes(req, 503, "Database not ready — visit /api/db/init to initialise");
    }
    return errRes(req, 500, "Server error");
  }
}

// PATCH /api/v1/data/:collection/:id — handled in separate route
// DELETE /api/v1/data/:collection/:id — handled in separate route
