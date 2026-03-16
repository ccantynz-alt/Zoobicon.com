import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-middleware";
import { sql } from "@/lib/db";

/**
 * POST /api/v1/deploy — Deploy HTML to zoobicon.sh
 *
 * Headers:
 *   Authorization: Bearer zbk_live_...
 *
 * Body:
 *   {
 *     html: string,              // Required: the HTML to deploy
 *     name?: string,             // Optional: site display name
 *     slug?: string,             // Optional: custom slug (auto-generated if omitted)
 *     commit_message?: string,   // Optional: deployment note
 *   }
 *
 * Response:
 *   {
 *     data: {
 *       site_id: string,
 *       slug: string,
 *       url: string,
 *       deployment_id: string,
 *       size: number,
 *       created_at: string
 *     }
 *   }
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { html, name, slug: requestedSlug, commit_message } = body;

    if (!html || typeof html !== "string") {
      return apiError(400, "missing_html", "HTML content is required");
    }

    if (html.length < 50) {
      return apiError(400, "html_too_short", "HTML must be at least 50 characters");
    }

    if (html.length > 5_000_000) {
      return apiError(400, "html_too_large", "HTML must be under 5MB");
    }

    // Generate or sanitize slug
    const baseSlug = requestedSlug
      ? requestedSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 50)
      : `api-${crypto.randomUUID().slice(0, 8)}`;

    // Try to create or update site
    const [existingSite] = await sql`
      SELECT id, slug FROM sites WHERE slug = ${baseSlug} LIMIT 1
    `;

    let siteId: string;
    let finalSlug: string;

    if (existingSite) {
      // Site exists — check ownership
      const [owned] = await sql`
        SELECT id FROM sites WHERE slug = ${baseSlug} AND email = 'api@zoobicon.com' LIMIT 1
      `;

      if (!owned) {
        // Slug taken by another user — append random suffix
        finalSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`;
        const [newSite] = await sql`
          INSERT INTO sites (name, slug, email, plan, status)
          VALUES (${name || "API Site"}, ${finalSlug}, 'api@zoobicon.com', 'api', 'active')
          RETURNING id
        `;
        siteId = newSite.id;
      } else {
        // We own it — redeploy
        siteId = owned.id;
        finalSlug = baseSlug;
        await sql`UPDATE sites SET status = 'active', updated_at = NOW() WHERE id = ${siteId}`;
      }
    } else {
      // New site
      finalSlug = baseSlug;
      const [newSite] = await sql`
        INSERT INTO sites (name, slug, email, plan, status)
        VALUES (${name || "API Site"}, ${finalSlug}, 'api@zoobicon.com', 'api', 'active')
        RETURNING id
      `;
      siteId = newSite.id;
    }

    // Mark previous deployments as superseded
    await sql`
      UPDATE deployments SET status = 'superseded'
      WHERE site_id = ${siteId} AND environment = 'production' AND status = 'active'
    `;

    // Create new deployment
    const [deployment] = await sql`
      INSERT INTO deployments (site_id, environment, status, code, url, size, commit_message)
      VALUES (${siteId}, 'production', 'active', ${html}, ${`https://${finalSlug}.zoobicon.sh`}, ${html.length}, ${commit_message || "API deployment"})
      RETURNING id, created_at
    `;

    return apiResponse({
      site_id: siteId,
      slug: finalSlug,
      url: `https://${finalSlug}.zoobicon.sh`,
      deployment_id: deployment.id,
      size: html.length,
      created_at: deployment.created_at,
    });
  } catch (err) {
    console.error("v1/deploy error:", err);
    return apiError(500, "deploy_failed", "Deployment failed. Please try again.");
  }
}

/**
 * GET /api/v1/deploy?site_id=xxx — Get deployment history for a site
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (auth instanceof Response) return auth;

  try {
    const siteId = req.nextUrl.searchParams.get("site_id");
    const slug = req.nextUrl.searchParams.get("slug");

    if (!siteId && !slug) {
      return apiError(400, "missing_identifier", "Provide site_id or slug query param");
    }

    // Find the site
    const [site] = siteId
      ? await sql`SELECT id, slug, name, status FROM sites WHERE id = ${siteId} AND email = 'api@zoobicon.com' LIMIT 1`
      : await sql`SELECT id, slug, name, status FROM sites WHERE slug = ${slug} AND email = 'api@zoobicon.com' LIMIT 1`;

    if (!site) {
      return apiError(404, "site_not_found", "Site not found or not owned by this API key");
    }

    const deployments = await sql`
      SELECT id, environment, status, size, commit_message, created_at
      FROM deployments
      WHERE site_id = ${site.id}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return apiResponse({
      site: {
        id: site.id,
        slug: site.slug,
        name: site.name,
        status: site.status,
      },
      deployments: deployments.map((d: Record<string, unknown>) => ({
        id: d.id,
        environment: d.environment,
        status: d.status,
        size: d.size,
        commit_message: d.commit_message,
        created_at: d.created_at,
      })),
    });
  } catch (err) {
    console.error("v1/deploy GET error:", err);
    return apiError(500, "fetch_failed", "Failed to fetch deployment history");
  }
}
