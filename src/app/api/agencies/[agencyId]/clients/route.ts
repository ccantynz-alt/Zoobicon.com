import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { checkClientLimit } from "@/lib/agency-limits";

type RouteContext = { params: Promise<{ agencyId: string }> };

/**
 * POST /api/agencies/[agencyId]/clients
 * Add client: { name, email?, company?, notes? }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const body = await req.json();
    const { name, email, company, notes } = body as {
      name?: string;
      email?: string;
      company?: string;
      notes?: string;
    };

    if (!name) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    const [agency] = await sql`
      SELECT id, plan FROM agencies WHERE id = ${agencyId} AND status != 'deleted'
    `;
    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    // Enforce client limit
    const [clientCount] = await sql`
      SELECT COUNT(*)::int as count FROM agency_clients
      WHERE agency_id = ${agencyId} AND status = 'active'
    `;
    const limitCheck = checkClientLimit(agency.plan as string || "starter", clientCount?.count || 0);
    if (!limitCheck.allowed) {
      return Response.json({ error: limitCheck.reason }, { status: 403 });
    }

    const [client] = await sql`
      INSERT INTO agency_clients (agency_id, name, email, company, notes)
      VALUES (${agencyId}, ${name}, ${email || null}, ${company || null}, ${notes || null})
      RETURNING *
    `;

    return Response.json({ client }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/agencies/[agencyId]/clients error:", err);
    return Response.json(
      { error: "Failed to add client" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agencies/[agencyId]/clients
 * List all clients with their site counts.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;

    const clients = await sql`
      SELECT
        ac.*,
        COALESCE(
          (SELECT COUNT(*)::int FROM agency_client_sites acs
           WHERE acs.client_id = ac.id AND acs.status = 'active'),
          0
        ) as site_count
      FROM agency_clients ac
      WHERE ac.agency_id = ${agencyId} AND ac.status = 'active'
      ORDER BY ac.created_at DESC
    `;

    return Response.json({ clients });
  } catch (err: unknown) {
    console.error("GET /api/agencies/[agencyId]/clients error:", err);
    return Response.json(
      { error: "Failed to list clients" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agencies/[agencyId]/clients
 * Update client: { clientId, name?, email?, company?, notes?, status? }
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const body = await req.json();
    const { clientId, name, email, company, notes, status } = body as {
      clientId?: string;
      name?: string;
      email?: string;
      company?: string;
      notes?: string;
      status?: string;
    };

    if (!clientId) {
      return Response.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const [updated] = await sql`
      UPDATE agency_clients SET
        name = COALESCE(${name ?? null}, name),
        email = COALESCE(${email ?? null}, email),
        company = COALESCE(${company ?? null}, company),
        notes = COALESCE(${notes ?? null}, notes),
        status = COALESCE(${status ?? null}, status),
        updated_at = NOW()
      WHERE id = ${clientId} AND agency_id = ${agencyId}
      RETURNING *
    `;

    if (!updated) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    return Response.json({ client: updated });
  } catch (err: unknown) {
    console.error("PUT /api/agencies/[agencyId]/clients error:", err);
    return Response.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agencies/[agencyId]/clients
 * Remove client: { clientId }
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const body = await req.json();
    const { clientId } = body as { clientId?: string };

    if (!clientId) {
      return Response.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const [client] = await sql`
      SELECT id FROM agency_clients
      WHERE id = ${clientId} AND agency_id = ${agencyId}
    `;
    if (!client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    // Soft-delete client
    await sql`
      UPDATE agency_clients SET status = 'deleted', updated_at = NOW()
      WHERE id = ${clientId} AND agency_id = ${agencyId}
    `;

    // Also soft-delete their site associations
    await sql`
      UPDATE agency_client_sites SET status = 'deleted'
      WHERE client_id = ${clientId} AND agency_id = ${agencyId}
    `;

    return Response.json({ success: true });
  } catch (err: unknown) {
    console.error("DELETE /api/agencies/[agencyId]/clients error:", err);
    return Response.json(
      { error: "Failed to remove client" },
      { status: 500 }
    );
  }
}
