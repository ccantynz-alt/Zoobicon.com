import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory stores — imported lazily from sibling route modules.
// In a real app these would be database queries.
// ---------------------------------------------------------------------------
// NOTE: Next.js bundles each route independently, so module-level Maps are NOT
// shared across routes at runtime.  The imports below are for type-reference
// only; in production you would query a real database.  For local testing with
// a single-process dev server the re-imports *may* share state.
// ---------------------------------------------------------------------------

import type { Site } from "../route";
import type { Deployment } from "../../deploy/route";

// We maintain our own reference Maps so the route is self-contained.
// In production, replace with DB calls.
const sites = new Map<string, Site>();
const deployments = new Map<string, Deployment>();
const domains = new Map<
  string,
  { domain: string; siteId: string; status: string; sslStatus: string }
>();

// ---------------------------------------------------------------------------
// GET /api/hosting/sites/[siteId]
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const site = sites.get(siteId);

    if (!site || site.status === "deleted") {
      return NextResponse.json({ error: "Site not found." }, { status: 404 });
    }

    // Gather related data
    const siteDeployments = Array.from(deployments.values())
      .filter((d) => d.siteId === siteId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    const siteDomains = Array.from(domains.values()).filter(
      (d) => d.siteId === siteId
    );

    // Simple analytics snapshot (mock)
    const analytics = {
      visitors24h: Math.floor(Math.random() * 5000),
      pageViews24h: Math.floor(Math.random() * 15000),
      bandwidthUsed24h: Math.floor(Math.random() * 500 * 1024 * 1024),
      uptime: 99.95 + Math.random() * 0.05,
    };

    return NextResponse.json({
      site,
      deployments: siteDeployments,
      domains: siteDomains,
      analytics,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/hosting/sites/[siteId] — update site settings
// ---------------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const site = sites.get(siteId);

    if (!site || site.status === "deleted") {
      return NextResponse.json({ error: "Site not found." }, { status: 404 });
    }

    const body = await req.json();
    const { name, plan, settings } = body as {
      name?: string;
      plan?: string;
      settings?: {
        redirects?: Array<{ from: string; to: string; type: number }>;
        headers?: Array<{ path: string; key: string; value: string }>;
        errorPages?: Record<string, string>;
      };
    };

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "name must be a non-empty string." },
          { status: 400 }
        );
      }
      site.name = name.trim();
    }

    const VALID_PLANS = ["free", "starter", "business", "enterprise"];
    if (plan !== undefined) {
      const normalizedPlan = plan.toLowerCase();
      if (!VALID_PLANS.includes(normalizedPlan)) {
        return NextResponse.json(
          {
            error: `Invalid plan. Choose one of: ${VALID_PLANS.join(", ")}.`,
          },
          { status: 400 }
        );
      }
      site.plan = normalizedPlan;
    }

    if (settings !== undefined) {
      if (settings.redirects !== undefined) {
        if (!Array.isArray(settings.redirects)) {
          return NextResponse.json(
            { error: "settings.redirects must be an array." },
            { status: 400 }
          );
        }
        site.settings.redirects = settings.redirects;
      }
      if (settings.headers !== undefined) {
        if (!Array.isArray(settings.headers)) {
          return NextResponse.json(
            { error: "settings.headers must be an array." },
            { status: 400 }
          );
        }
        site.settings.headers = settings.headers;
      }
      if (settings.errorPages !== undefined) {
        if (
          typeof settings.errorPages !== "object" ||
          settings.errorPages === null
        ) {
          return NextResponse.json(
            { error: "settings.errorPages must be an object." },
            { status: 400 }
          );
        }
        site.settings.errorPages = settings.errorPages;
      }
    }

    site.updatedAt = new Date().toISOString();
    sites.set(siteId, site);

    return NextResponse.json({ site });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/hosting/sites/[siteId]
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const site = sites.get(siteId);

    if (!site || site.status === "deleted") {
      return NextResponse.json({ error: "Site not found." }, { status: 404 });
    }

    // Soft-delete the site
    site.status = "deleted";
    site.updatedAt = new Date().toISOString();
    sites.set(siteId, site);

    // Remove associated deployments
    const removed: string[] = [];
    for (const [id, dep] of deployments) {
      if (dep.siteId === siteId) {
        deployments.delete(id);
        removed.push(id);
      }
    }

    // Remove associated domains
    for (const [key, rec] of domains) {
      if (rec.siteId === siteId) {
        domains.delete(key);
      }
    }

    return NextResponse.json({
      message: `Site "${siteId}" and ${removed.length} deployment(s) have been deleted.`,
      siteId,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
