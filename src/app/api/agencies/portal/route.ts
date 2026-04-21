import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/**
 * GET /api/agencies/portal?email=client@example.com
 *
 * Client portal endpoint — returns all sites assigned to a client email
 * along with the agency's brand config for white-label display.
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Find all agency clients with this email
    const clients = await sql`
      SELECT
        ac.id as client_id,
        ac.agency_id,
        a.name as agency_name,
        a.brand_config
      FROM agency_clients ac
      JOIN agencies a ON a.id = ac.agency_id AND a.status = 'active'
      WHERE ac.email = ${email} AND ac.status = 'active'
    `;

    if (clients.length === 0) {
      return Response.json(
        { error: "No agency found for this email. Contact your agency for access." },
        { status: 404 }
      );
    }

    // Get all site assignments for these clients
    const clientIds = clients.map((c: Record<string, unknown>) => c.client_id);
    const sites = await sql`
      SELECT
        s.id,
        s.name,
        s.slug,
        s.status,
        s.updated_at,
        acs.client_id
      FROM agency_client_sites acs
      JOIN sites s ON s.id = acs.site_id AND s.status != 'deleted'
      WHERE acs.client_id = ANY(${clientIds}::uuid[]) AND acs.status = 'active'
      ORDER BY s.updated_at DESC
    `;

    // Use the first agency's brand config for white-label display
    const agencyBrand = clients[0]?.brand_config || null;

    return Response.json({
      sites: sites.map((s: Record<string, unknown>) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status || "published",
        updated_at: s.updated_at,
      })),
      agencyBrand: agencyBrand && typeof agencyBrand === "object" ? {
        agencyName: (agencyBrand as Record<string, string>).agencyName || clients[0]?.agency_name,
        primaryColor: (agencyBrand as Record<string, string>).primaryColor,
        secondaryColor: (agencyBrand as Record<string, string>).secondaryColor,
        logoUrl: (agencyBrand as Record<string, string>).logoUrl,
      } : {
        agencyName: clients[0]?.agency_name || "Agency",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/agencies/portal error:", err);
    return Response.json(
      { error: "Failed to load portal data" },
      { status: 500 }
    );
  }
}
