import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { notifySiteDeployed } from "@/lib/admin-notify";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * POST /api/hosting/deploy
 * Body: { name, email, code, siteId?, environment? }
 *
 * Creates a site (if needed) and deploys the code.
 * Returns the live URL.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      code,
      siteId: existingSiteSlug,
      environment = "production",
    } = body as {
      name?: string;
      email?: string;
      code?: string;
      siteId?: string;
      environment?: string;
    };

    if (!code || typeof code !== "string" || !code.trim()) {
      return Response.json({ error: "code is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    let siteRow: Record<string, unknown> | undefined;

    // If an existing site slug was provided, look it up
    if (existingSiteSlug) {
      const [found] = await sql`
        SELECT id, slug FROM sites
        WHERE slug = ${existingSiteSlug} AND email = ${email} AND status != 'deleted'
        LIMIT 1
      `;
      siteRow = found;
    }

    // If no existing site, create one
    if (!siteRow) {
      const siteName = name || "My Site";
      let slug = slugify(siteName);
      if (!slug) slug = "site";

      // Ensure unique slug
      const [dup] = await sql`SELECT id FROM sites WHERE slug = ${slug} LIMIT 1`;
      if (dup) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
      }

      const [created] = await sql`
        INSERT INTO sites (name, slug, email, plan)
        VALUES (${siteName}, ${slug}, ${email}, 'free')
        RETURNING id, slug
      `;
      siteRow = created;
    }

    const siteId = siteRow!.id as string;
    const slug = siteRow!.slug as string;
    const size = new TextEncoder().encode(code).length;

    const url =
      environment === "staging"
        ? `https://${slug}-staging.zoobicon.sh`
        : `https://${slug}.zoobicon.sh`;

    // Create deployment record with the HTML code
    const [deployment] = await sql`
      INSERT INTO deployments (site_id, environment, status, url, size, code, commit_message)
      VALUES (${siteId}, ${environment}, 'live', ${url}, ${size}, ${code}, ${"Deployed from builder"})
      RETURNING id, environment, status, url, size, created_at
    `;

    // Update site timestamp
    await sql`UPDATE sites SET updated_at = NOW() WHERE id = ${siteId}`;

    // Notify admin of new deployment (fire-and-forget)
    notifySiteDeployed({
      siteName: (siteRow as Record<string, unknown>).name as string || name || slug,
      slug,
      email,
    }).catch(() => {});

    return Response.json({
      deploymentId: deployment.id,
      siteSlug: slug,
      url,
      environment,
      status: "live",
      size,
      deployedAt: deployment.created_at,
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
