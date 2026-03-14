import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

type RouteContext = { params: Promise<{ agencyId: string }> };

/**
 * POST /api/agencies/[agencyId]/sites
 * Assign existing site to client: { siteId, clientId }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const body = await req.json();
    const { siteId, clientId } = body as {
      siteId?: string;
      clientId?: string;
    };

    if (!siteId || !clientId) {
      return Response.json(
        { error: "siteId and clientId are required" },
        { status: 400 }
      );
    }

    // Verify agency exists
    const [agency] = await sql`
      SELECT id FROM agencies WHERE id = ${agencyId} AND status != 'deleted'
    `;
    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    // Verify client belongs to this agency
    const [client] = await sql`
      SELECT id FROM agency_clients
      WHERE id = ${clientId} AND agency_id = ${agencyId} AND status = 'active'
    `;
    if (!client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify site exists
    const [site] = await sql`
      SELECT id FROM sites WHERE id = ${siteId} AND status != 'deleted'
    `;
    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    // Check if already assigned
    const [existing] = await sql`
      SELECT id FROM agency_client_sites
      WHERE agency_id = ${agencyId} AND site_id = ${siteId} AND status = 'active'
    `;
    if (existing) {
      return Response.json(
        { error: "Site already assigned" },
        { status: 409 }
      );
    }

    const [assignment] = await sql`
      INSERT INTO agency_client_sites (agency_id, client_id, site_id)
      VALUES (${agencyId}, ${clientId}, ${siteId})
      RETURNING *
    `;

    return Response.json({ assignment }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/agencies/[agencyId]/sites error:", err);
    return Response.json(
      { error: "Failed to assign site" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agencies/[agencyId]/sites
 * List all sites for this agency across all clients.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;

    const sites = await sql`
      SELECT
        s.*,
        acs.client_id,
        ac.name as client_name,
        ac.company as client_company,
        acs.created_at as assigned_at
      FROM agency_client_sites acs
      JOIN sites s ON s.id = acs.site_id
      LEFT JOIN agency_clients ac ON ac.id = acs.client_id
      WHERE acs.agency_id = ${agencyId} AND acs.status = 'active'
      ORDER BY acs.created_at DESC
    `;

    return Response.json({ sites });
  } catch (err: unknown) {
    console.error("GET /api/agencies/[agencyId]/sites error:", err);
    return Response.json(
      { error: "Failed to list sites" },
      { status: 500 }
    );
  }
}
