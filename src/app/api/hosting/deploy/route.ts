import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { notifySiteDeployed } from "@/lib/admin-notify";
import { getCreatorBadgeHTML } from "@/components/CreatorBadge";
import { submitDeployedSite } from "@/lib/search-engine-submit";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60); // Cap slug length for clean URLs
}

/** Quick sanity check on the HTML — at minimum it should contain some structure */
function validateCode(code: string): { valid: boolean; reason?: string } {
  const trimmed = code.trim();
  if (trimmed.length < 50) {
    return { valid: false, reason: "Code is too short to be a valid site" };
  }
  if (trimmed.length > 5_000_000) {
    return { valid: false, reason: "Code exceeds 5MB size limit" };
  }
  // Must contain at least an HTML tag or a React root
  const hasHtml = /<html|<!doctype|<div id="root"/i.test(trimmed);
  if (!hasHtml) {
    return { valid: false, reason: "Code must contain valid HTML structure" };
  }
  return { valid: true };
}

/** Reserved slugs that cannot be used as site names */
const RESERVED_SLUGS = new Set([
  "api", "admin", "app", "www", "mail", "ftp", "staging", "preview",
  "builder", "login", "signup", "pricing", "blog", "docs", "help",
  "support", "status", "dashboard", "settings", "billing",
]);

/**
 * POST /api/hosting/deploy
 * Body: { name, email, code, siteId?, environment?, description? }
 *
 * Creates a site (if needed) and deploys the code.
 * Returns the live URL immediately.
 *
 * Flow: validate code -> resolve/create site -> inject badge -> store -> respond
 */
export async function POST(req: NextRequest) {
  const startMs = Date.now();

  try {
    const body = await req.json();
    const {
      name,
      email,
      code,
      siteId: existingSiteSlug,
      environment = "production",
      description,
    } = body as {
      name?: string;
      email?: string;
      code?: string;
      siteId?: string;
      environment?: string;
      description?: string;
    };

    // ---- Validation ----
    if (!code || typeof code !== "string" || !code.trim()) {
      return Response.json({ error: "code is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const codeCheck = validateCode(code);
    if (!codeCheck.valid) {
      return Response.json({ error: codeCheck.reason }, { status: 400 });
    }

    // ---- Resolve or create site ----
    let siteRow: Record<string, unknown> | undefined;

    // If an existing site slug was provided, look it up
    if (existingSiteSlug) {
      const [found] = await sql`
        SELECT id, slug, name, plan FROM sites
        WHERE slug = ${existingSiteSlug} AND email = ${email} AND status != 'deleted'
        LIMIT 1
      `;
      siteRow = found;
    }

    // If no existing site, create one
    if (!siteRow) {
      const siteName = (name || "My Site").trim().slice(0, 100);
      let slug = slugify(siteName);
      if (!slug || slug.length < 2) slug = "site";

      // Avoid reserved slugs
      if (RESERVED_SLUGS.has(slug)) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      }

      // Ensure unique slug — try up to 3 times with random suffix
      for (let attempt = 0; attempt < 3; attempt++) {
        const candidateSlug = attempt === 0 ? slug : `${slug}-${Math.random().toString(36).substring(2, 8)}`;
        const [dup] = await sql`SELECT id FROM sites WHERE slug = ${candidateSlug} LIMIT 1`;
        if (!dup) {
          slug = candidateSlug;
          break;
        }
        if (attempt === 2) {
          // Final fallback — timestamp-based
          slug = `${slug}-${Date.now().toString(36)}`;
        }
      }

      const [created] = await sql`
        INSERT INTO sites (name, slug, email, plan)
        VALUES (${siteName}, ${slug}, ${email}, 'free')
        RETURNING id, slug, name, plan
      `;
      siteRow = created;
    }

    const siteId = siteRow!.id as string;
    const slug = siteRow!.slug as string;

    // ---- Inject badge for free-tier sites ----
    const siteName = (siteRow as Record<string, unknown>).name as string || name || slug;
    const userPlan = ((siteRow as Record<string, unknown>).plan as string) || "free";
    const badgeHtml = getCreatorBadgeHTML(slug, userPlan);
    const finalCode = badgeHtml ? code.replace("</body>", badgeHtml + "</body>") : code;

    const size = new TextEncoder().encode(finalCode).length;

    const url =
      environment === "staging"
        ? `https://${slug}-staging.zoobicon.sh`
        : `https://${slug}.zoobicon.sh`;

    // ---- Create deployment record ----
    const commitMsg = description || "Deployed from builder";
    const [deployment] = await sql`
      INSERT INTO deployments (site_id, environment, status, url, size, code, commit_message)
      VALUES (${siteId}, ${environment}, 'live', ${url}, ${size}, ${finalCode}, ${commitMsg})
      RETURNING id, environment, status, url, size, created_at
    `;

    // Update site timestamp
    await sql`UPDATE sites SET updated_at = NOW() WHERE id = ${siteId}`;

    // ---- Fire-and-forget notifications ----
    notifySiteDeployed({ siteName, slug, email }).catch(() => {});
    submitDeployedSite(slug).catch(() => {});

    const deployTimeMs = Date.now() - startMs;

    return Response.json({
      deploymentId: deployment.id,
      siteId,
      siteSlug: slug,
      url,
      environment,
      status: "live",
      size,
      deployedAt: deployment.created_at,
      deployTimeMs,
      trackingHints: { event: "deploy", siteName, slug },
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Deploy error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
