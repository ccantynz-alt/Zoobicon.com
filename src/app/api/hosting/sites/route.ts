import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory storage — would be backed by a database in production.
// ---------------------------------------------------------------------------
interface Site {
  siteId: string;
  name: string;
  email: string;
  url: string;
  plan: string;
  status: "active" | "suspended" | "deleted";
  createdAt: string;
  updatedAt: string;
  storage: { used: number; limit: number };
  bandwidth: { used: number; limit: number };
  settings: {
    redirects: Array<{ from: string; to: string; type: number }>;
    headers: Array<{ path: string; key: string; value: string }>;
    errorPages: Record<string, string>;
  };
}

const sites = new Map<string, Site>();

/** Expose store for sibling routes. */
// Internal storage — not exported

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PLAN_LIMITS: Record<string, { storage: number; bandwidth: number }> = {
  free: { storage: 500 * 1024 * 1024, bandwidth: 1 * 1024 * 1024 * 1024 },
  starter: {
    storage: 10 * 1024 * 1024 * 1024,
    bandwidth: 50 * 1024 * 1024 * 1024,
  },
  business: {
    storage: 50 * 1024 * 1024 * 1024,
    bandwidth: 200 * 1024 * 1024 * 1024,
  },
  enterprise: {
    storage: 500 * 1024 * 1024 * 1024,
    bandwidth: 1024 * 1024 * 1024 * 1024,
  },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// GET /api/hosting/sites?email=...
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "email query parameter is required." },
        { status: 400 }
      );
    }

    const userSites = Array.from(sites.values()).filter(
      (s) => s.email === email && s.status !== "deleted"
    );

    return NextResponse.json({ sites: userSites, count: userSites.length });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/hosting/sites — create a new site
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, plan = "free" } = body as {
      name?: string;
      email?: string;
      plan?: string;
    };

    // --- Validation -----------------------------------------------------------
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "name is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedPlan = plan.toLowerCase();
    if (!PLAN_LIMITS[normalizedPlan]) {
      return NextResponse.json(
        {
          error: `Invalid plan. Choose one of: ${Object.keys(PLAN_LIMITS).join(", ")}.`,
        },
        { status: 400 }
      );
    }

    let siteId = slugify(name);
    if (!siteId) {
      return NextResponse.json(
        { error: "name must contain at least one alphanumeric character." },
        { status: 400 }
      );
    }

    // Ensure uniqueness — append a short suffix if the slug already exists.
    if (sites.has(siteId)) {
      siteId = `${siteId}-${randomUUID().slice(0, 6)}`;
    }

    const limits = PLAN_LIMITS[normalizedPlan];
    const now = new Date().toISOString();

    const site: Site = {
      siteId,
      name: name.trim(),
      email,
      url: `https://${siteId}.zoobicon.sh`,
      plan: normalizedPlan,
      status: "active",
      createdAt: now,
      updatedAt: now,
      storage: { used: 0, limit: limits.storage },
      bandwidth: { used: 0, limit: limits.bandwidth },
      settings: {
        redirects: [],
        headers: [],
        errorPages: {},
      },
    };

    sites.set(siteId, site);

    return NextResponse.json(
      {
        siteId: site.siteId,
        name: site.name,
        url: site.url,
        plan: site.plan,
        status: site.status,
        createdAt: site.createdAt,
        storage: site.storage,
        bandwidth: site.bandwidth,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
