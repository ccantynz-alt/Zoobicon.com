import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// GET /api/hosting/sites?email=...
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return Response.json({ error: "email query parameter is required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT id, name, slug, email, plan, status, settings, created_at, updated_at
      FROM sites WHERE email = ${email} AND status != 'deleted'
      ORDER BY updated_at DESC
    `;

    const sites = rows.map((s: Record<string, unknown>) => ({
      ...s,
      url: `https://${s.slug}.zoobicon.sh`,
    }));

    return Response.json({ sites, count: sites.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// POST /api/hosting/sites — create a new site
export async function POST(req: NextRequest) {
  try {
    const { name, email, plan = "free" } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string") {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    let slug = slugify(name);
    if (!slug) {
      return Response.json({ error: "name must contain at least one alphanumeric character" }, { status: 400 });
    }

    // Check slug uniqueness, append random suffix if taken
    const [existing] = await sql`SELECT id FROM sites WHERE slug = ${slug} LIMIT 1`;
    if (existing) {
      const suffix = Math.random().toString(36).substring(2, 8);
      slug = `${slug}-${suffix}`;
    }

    const [site] = await sql`
      INSERT INTO sites (name, slug, email, plan)
      VALUES (${name.trim()}, ${slug}, ${email}, ${plan})
      RETURNING id, name, slug, email, plan, status, created_at, updated_at
    `;

    return Response.json({
      ...site,
      url: `https://${site.slug}.zoobicon.sh`,
    }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
