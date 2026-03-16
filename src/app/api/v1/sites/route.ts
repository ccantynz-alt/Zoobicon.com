import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-middleware";
import { sql } from "@/lib/db";

/**
 * GET /api/v1/sites — List sites for the authenticated API user
 *
 * Headers:
 *   Authorization: Bearer zbk_live_...
 *
 * Query params:
 *   page?: number (default 1)
 *   limit?: number (default 20, max 100)
 *   status?: "active" | "inactive"
 *
 * Response:
 *   {
 *     data: {
 *       sites: [...],
 *       pagination: { page, limit, total, totalPages }
 *     }
 *   }
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (auth instanceof Response) return auth;

  try {
    const url = req.nextUrl;
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const status = url.searchParams.get("status");
    const offset = (page - 1) * limit;

    let sites;
    let countResult;

    if (status) {
      sites = await sql`
        SELECT id, name, slug, plan, status, created_at, updated_at
        FROM sites
        WHERE email = 'api@zoobicon.com' AND status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      [countResult] = await sql`
        SELECT COUNT(*)::int as total FROM sites
        WHERE email = 'api@zoobicon.com' AND status = ${status}
      `;
    } else {
      sites = await sql`
        SELECT id, name, slug, plan, status, created_at, updated_at
        FROM sites
        WHERE email = 'api@zoobicon.com'
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      [countResult] = await sql`
        SELECT COUNT(*)::int as total FROM sites
        WHERE email = 'api@zoobicon.com'
      `;
    }

    const total = countResult?.total || 0;

    return apiResponse({
      sites: sites.map((s: Record<string, unknown>) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        url: `https://${s.slug}.zoobicon.sh`,
        plan: s.plan,
        status: s.status,
        created_at: s.created_at,
        updated_at: s.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("v1/sites GET error:", err);
    return apiError(500, "fetch_failed", "Failed to fetch sites");
  }
}

/**
 * DELETE /api/v1/sites — Deactivate a site
 *
 * Body: { site_id: string } or { slug: string }
 */
export async function DELETE(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { site_id, slug } = body;

    if (!site_id && !slug) {
      return apiError(400, "missing_identifier", "Provide site_id or slug");
    }

    let result;
    if (site_id) {
      result = await sql`
        UPDATE sites SET status = 'inactive', updated_at = NOW()
        WHERE id = ${site_id} AND email = 'api@zoobicon.com'
        RETURNING id, slug
      `;
    } else {
      result = await sql`
        UPDATE sites SET status = 'inactive', updated_at = NOW()
        WHERE slug = ${slug} AND email = 'api@zoobicon.com'
        RETURNING id, slug
      `;
    }

    if (result.length === 0) {
      return apiError(404, "site_not_found", "Site not found or not owned by this API key");
    }

    return apiResponse({ deactivated: true, id: result[0].id, slug: result[0].slug });
  } catch (err) {
    console.error("v1/sites DELETE error:", err);
    return apiError(500, "delete_failed", "Failed to deactivate site");
  }
}

/**
 * PUT /api/v1/sites — Update site code
 *
 * Body: { site_id: string, html: string, commit_message?: string }
 */
export async function PUT(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { site_id, slug, html, commit_message } = body;

    if (!site_id && !slug) {
      return apiError(400, "missing_identifier", "Provide site_id or slug");
    }

    if (!html || typeof html !== "string") {
      return apiError(400, "missing_html", "HTML content is required");
    }

    // Find the site
    const [site] = site_id
      ? await sql`SELECT id, slug FROM sites WHERE id = ${site_id} AND email = 'api@zoobicon.com' LIMIT 1`
      : await sql`SELECT id, slug FROM sites WHERE slug = ${slug} AND email = 'api@zoobicon.com' LIMIT 1`;

    if (!site) {
      return apiError(404, "site_not_found", "Site not found or not owned by this API key");
    }

    // Create new deployment version
    const [deployment] = await sql`
      INSERT INTO deployments (site_id, environment, status, code, url, size, commit_message)
      VALUES (${site.id}, 'production', 'active', ${html}, ${`https://${site.slug}.zoobicon.sh`}, ${html.length}, ${commit_message || "API update"})
      RETURNING id, created_at
    `;

    await sql`UPDATE sites SET updated_at = NOW() WHERE id = ${site.id}`;

    return apiResponse({
      updated: true,
      site_id: site.id,
      slug: site.slug,
      deployment_id: deployment.id,
      url: `https://${site.slug}.zoobicon.sh`,
      size: html.length,
      created_at: deployment.created_at,
    });
  } catch (err) {
    console.error("v1/sites PUT error:", err);
    return apiError(500, "update_failed", "Failed to update site");
  }
}
