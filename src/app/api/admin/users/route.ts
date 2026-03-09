import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Admin User Management API
 *
 * GET  /api/admin/users          → list all users
 * POST /api/admin/users          → create user
 * PUT  /api/admin/users?id=UUID  → update user
 * DELETE /api/admin/users?id=UUID → delete user
 */

export async function GET() {
  try {
    const users = await sql`
      SELECT id, email, name, role, plan, subscription_status,
             stripe_customer_id, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;

    // Get project counts per user
    let projectCounts: Record<string, number> = {};
    try {
      const counts = await sql`
        SELECT user_email, COUNT(*)::int as count
        FROM projects
        GROUP BY user_email
      `;
      projectCounts = Object.fromEntries(
        counts.map((c: { user_email: string; count: number }) => [c.user_email, c.count])
      );
    } catch { /* projects table may not exist */ }

    const enriched = users.map((u: Record<string, unknown>) => ({
      ...u,
      projectCount: projectCounts[u.email as string] || 0,
    }));

    return NextResponse.json({ users: enriched, total: users.length });
  } catch (err) {
    console.error("Admin users error:", err);
    // Return empty list if DB not available
    return NextResponse.json({ users: [], total: 0, dbError: true });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    const body = await req.json();
    const { role, plan, name } = body;

    const updates: string[] = [];
    if (role) updates.push(`role = '${role}'`);
    if (plan) updates.push(`plan = '${plan}'`);
    if (name !== undefined) updates.push(`name = '${name}'`);

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await sql`
      UPDATE users
      SET role = COALESCE(${role || null}, role),
          plan = COALESCE(${plan || null}, plan),
          name = COALESCE(${name || null}, name),
          updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin update user error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    await sql`DELETE FROM users WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Admin delete user error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
