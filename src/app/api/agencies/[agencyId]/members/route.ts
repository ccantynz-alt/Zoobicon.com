import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { checkMemberLimit } from "@/lib/agency-limits";

type RouteContext = { params: Promise<{ agencyId: string }> };

/**
 * POST /api/agencies/[agencyId]/members
 * Invite a member: { email, name?, role }
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const body = await req.json();
    const { email, name, role } = body as {
      email?: string;
      name?: string;
      role?: string;
    };

    if (!email) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    const validRoles = ["owner", "admin", "designer", "viewer"];
    const memberRole = validRoles.includes(role || "") ? role : "designer";

    // Check agency exists and get plan
    const [agency] = await sql`
      SELECT id, plan FROM agencies WHERE id = ${agencyId} AND status != 'deleted'
    `;
    if (!agency) {
      return Response.json({ error: "Agency not found" }, { status: 404 });
    }

    // Enforce member limit
    const [memberCount] = await sql`
      SELECT COUNT(*)::int as count FROM agency_members
      WHERE agency_id = ${agencyId} AND status != 'removed'
    `;
    const limitCheck = checkMemberLimit(agency.plan as string || "starter", memberCount?.count || 0);
    if (!limitCheck.allowed) {
      return Response.json({ error: limitCheck.reason }, { status: 403 });
    }

    // Check if already a member
    const [existing] = await sql`
      SELECT id FROM agency_members
      WHERE agency_id = ${agencyId} AND email = ${email}
    `;
    if (existing) {
      return Response.json(
        { error: "Member already exists" },
        { status: 409 }
      );
    }

    const [member] = await sql`
      INSERT INTO agency_members (agency_id, email, name, role, status)
      VALUES (${agencyId}, ${email}, ${name || null}, ${memberRole}, 'invited')
      RETURNING *
    `;

    return Response.json({ member }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/agencies/[agencyId]/members error:", err);
    return Response.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agencies/[agencyId]/members
 * List all members of this agency.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;

    const members = await sql`
      SELECT * FROM agency_members
      WHERE agency_id = ${agencyId}
      ORDER BY invited_at ASC
    `;

    return Response.json({ members });
  } catch (err: unknown) {
    console.error("GET /api/agencies/[agencyId]/members error:", err);
    return Response.json(
      { error: "Failed to list members" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/agencies/[agencyId]/members
 * Remove member: { email }
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { agencyId } = await context.params;
    const body = await req.json();
    const { email } = body as { email?: string };

    if (!email) {
      return Response.json({ error: "email is required" }, { status: 400 });
    }

    // Prevent removing the owner
    const [member] = await sql`
      SELECT role FROM agency_members
      WHERE agency_id = ${agencyId} AND email = ${email}
    `;
    if (!member) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.role === "owner") {
      return Response.json(
        { error: "Cannot remove the agency owner" },
        { status: 403 }
      );
    }

    await sql`
      DELETE FROM agency_members
      WHERE agency_id = ${agencyId} AND email = ${email}
    `;

    return Response.json({ success: true });
  } catch (err: unknown) {
    console.error("DELETE /api/agencies/[agencyId]/members error:", err);
    return Response.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
