import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/**
 * GET /api/hosting/sites/[siteId]/code
 * Fetch the current live code for a deployed site.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId: slug } = await params;

    const [site] = await sql`
      SELECT id, name, slug, email, plan, created_at, updated_at
      FROM sites WHERE slug = ${slug} AND status = 'active'
      LIMIT 1
    `;

    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    // Get the latest production deployment with code
    const [deployment] = await sql`
      SELECT id, code, commit_message, created_at
      FROM deployments
      WHERE site_id = ${site.id}
        AND environment = 'production'
        AND status = 'live'
        AND code IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!deployment || !deployment.code) {
      return Response.json({ error: "No deployment found" }, { status: 404 });
    }

    // Get version history (last 20 deployments)
    const versions = await sql`
      SELECT id, commit_message, created_at, size
      FROM deployments
      WHERE site_id = ${site.id}
        AND environment = 'production'
        AND code IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return Response.json({
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        email: site.email,
        plan: site.plan,
        url: `https://${site.slug}.zoobicon.sh`,
        createdAt: site.created_at,
        updatedAt: site.updated_at,
      },
      code: deployment.code,
      currentDeployment: {
        id: deployment.id,
        message: deployment.commit_message,
        deployedAt: deployment.created_at,
      },
      versions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/hosting/sites/[siteId]/code
 * Update the live code for a deployed site (creates a new deployment).
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId: slug } = await params;
    const { code, message: commitMessage, email } = await req.json();

    if (!code || typeof code !== "string") {
      return Response.json({ error: "code is required" }, { status: 400 });
    }

    // Verify site exists and user has access
    const [site] = await sql`
      SELECT id, slug, email FROM sites
      WHERE slug = ${slug} AND status = 'active'
      LIMIT 1
    `;

    if (!site) {
      return Response.json({ error: "Site not found" }, { status: 404 });
    }

    // Basic ownership check
    if (email && site.email !== email) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const size = new TextEncoder().encode(code).length;
    const url = `https://${site.slug}.zoobicon.sh`;

    // Create new deployment
    const [deployment] = await sql`
      INSERT INTO deployments (site_id, environment, status, url, size, code, commit_message)
      VALUES (${site.id}, 'production', 'live', ${url}, ${size}, ${code}, ${commitMessage || "Updated via editor"})
      RETURNING id, environment, status, url, size, commit_message, created_at
    `;

    // Update site timestamp
    await sql`UPDATE sites SET updated_at = NOW() WHERE id = ${site.id}`;

    return Response.json({
      deployment: {
        id: deployment.id,
        url,
        size,
        message: deployment.commit_message,
        deployedAt: deployment.created_at,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
