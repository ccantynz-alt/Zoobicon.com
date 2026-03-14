import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

type RouteContext = { params: Promise<{ agencyId: string }> };

/**
 * GET /api/agencies/[agencyId]
 * Returns agency details with member count, client count, site count.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;

    const [agency] = await sql`
      SELECT * FROM agencies WHERE id = ${agencyId} AND status != 'deleted'
    `;
    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    const [memberCount] = await sql`
      SELECT COUNT(*)::int as count FROM agency_members
      WHERE agency_id = ${agencyId} AND status = 'active'
    `;
    const [clientCount] = await sql`
      SELECT COUNT(*)::int as count FROM agency_clients
      WHERE agency_id = ${agencyId} AND status = 'active'
    `;
    const [siteCount] = await sql`
      SELECT COUNT(*)::int as count FROM agency_client_sites
      WHERE agency_id = ${agencyId} AND status = 'active'
    `;

    return Response.json({
      agency: {
        ...agency,
        member_count: memberCount.count,
        client_count: clientCount.count,
        site_count: siteCount.count,
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/agencies/[agencyId] error:", err);
    return Response.json(
      { error: "Failed to fetch agency" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agencies/[agencyId]
 * Update agency settings, name, brand_config.
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const body = await req.json();
    const { name, settings, brand_config } = body as {
      name?: string;
      settings?: Record<string, unknown>;
      brand_config?: Record<string, unknown>;
    };

    const [existing] = await sql`
      SELECT id FROM agencies WHERE id = ${agencyId} AND status != 'deleted'
    `;
    if (!existing) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    const [updated] = await sql`
      UPDATE agencies SET
        name = COALESCE(${name ?? null}, name),
        settings = COALESCE(${settings ? JSON.stringify(settings) : null}::jsonb, settings),
        brand_config = COALESCE(${brand_config ? JSON.stringify(brand_config) : null}::jsonb, brand_config),
        updated_at = NOW()
      WHERE id = ${agencyId}
      RETURNING *
    `;

    return Response.json({ agency: updated });
  } catch (err: unknown) {
    console.error("PUT /api/agencies/[agencyId] error:", err);
    return Response.json(
      { error: "Failed to update agency" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agencies/[agencyId]
 * Soft-delete agency (set status='deleted').
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;

    const [existing] = await sql`
      SELECT id FROM agencies WHERE id = ${agencyId} AND status != 'deleted'
    `;
    if (!existing) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    await sql`
      UPDATE agencies SET status = 'deleted', updated_at = NOW()
      WHERE id = ${agencyId}
    `;

    return Response.json({ success: true });
  } catch (err: unknown) {
    console.error("DELETE /api/agencies/[agencyId] error:", err);
    return Response.json(
      { error: "Failed to delete agency" },
      { status: 500 }
    );
  }
}
