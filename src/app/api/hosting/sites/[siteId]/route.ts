import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

// GET /api/hosting/sites/[siteId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    const [site] = await sql`
      SELECT id, name, slug, email, plan, status, settings, created_at, updated_at
      FROM sites WHERE slug = ${siteId} AND status != 'deleted' LIMIT 1
    `;

    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    const deployments = await sql`
      SELECT id, environment, status, url, size, commit_message, created_at
      FROM deployments WHERE site_id = ${site.id}
      ORDER BY created_at DESC LIMIT 20
    `;

    const domains = await sql`
      SELECT id, domain, status, ssl_status, dns_records, created_at
      FROM custom_domains WHERE site_id = ${site.id}
    `;

    return Response.json({
      site: { ...site, url: `https://${site.slug}.zoobicon.sh` },
      deployments,
      domains,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// PUT /api/hosting/sites/[siteId]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const { name, plan, settings } = await req.json();

    const [site] = await sql`
      SELECT id FROM sites WHERE slug = ${siteId} AND status != 'deleted' LIMIT 1
    `;
    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    const updates: string[] = [];
    if (name !== undefined) updates.push("name");
    if (plan !== undefined) updates.push("plan");
    if (settings !== undefined) updates.push("settings");

    const [updated] = await sql`
      UPDATE sites SET
        name = COALESCE(${name ?? null}, name),
        plan = COALESCE(${plan ?? null}, plan),
        settings = COALESCE(${settings ? JSON.stringify(settings) : null}::jsonb, settings),
        updated_at = NOW()
      WHERE id = ${site.id}
      RETURNING id, name, slug, email, plan, status, settings, created_at, updated_at
    `;

    return Response.json({ site: { ...updated, url: `https://${updated.slug}.zoobicon.sh` } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/hosting/sites/[siteId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    const [site] = await sql`
      UPDATE sites SET status = 'deleted', updated_at = NOW()
      WHERE slug = ${siteId} AND status != 'deleted'
      RETURNING id, slug
    `;

    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    return Response.json({ message: `Site "${siteId}" deleted`, siteId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
