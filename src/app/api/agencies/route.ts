import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * POST /api/agencies
 * Body: { name, ownerEmail, plan? }
 * Creates a new agency and adds the owner as a member with role='owner'.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ownerEmail, plan } = body as {
      name?: string;
      ownerEmail?: string;
      plan?: string;
    };

    if (!name || !ownerEmail) {
      return Response.json(
        { error: "name and ownerEmail are required" },
        { status: 400 }
      );
    }

    let slug = slugify(name);

    // Ensure slug uniqueness
    const [existing] = await sql`SELECT id FROM agencies WHERE slug = ${slug}`;
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const [agency] = await sql`
      INSERT INTO agencies (name, slug, owner_email, plan)
      VALUES (${name}, ${slug}, ${ownerEmail}, ${plan || "starter"})
      RETURNING *
    `;

    // Add owner as a member
    await sql`
      INSERT INTO agency_members (agency_id, email, name, role, status, joined_at)
      VALUES (${agency.id}, ${ownerEmail}, ${name}, 'owner', 'active', NOW())
    `;

    return Response.json({ agency }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/agencies error:", err);
    return Response.json(
      { error: "Failed to create agency" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agencies?email=...
 * Lists all agencies where the user is a member.
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const agencies = await sql`
      SELECT a.*, am.role as user_role
      FROM agencies a
      JOIN agency_members am ON am.agency_id = a.id
      WHERE am.email = ${email} AND a.status != 'deleted'
      ORDER BY a.created_at DESC
    `;

    return Response.json({ agencies });
  } catch (err: unknown) {
    console.error("GET /api/agencies error:", err);
    return Response.json(
      { error: "Failed to list agencies" },
      { status: 500 }
    );
  }
}
