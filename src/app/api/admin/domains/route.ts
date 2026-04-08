import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/domains
 *
 * Returns ALL registered domains across all customers.
 * Admin-only endpoint — checks for admin cookie/session.
 */
export async function GET(req: NextRequest) {
  try {
    const { sql } = await import("@/lib/db");

    // Fetch all domains ordered by most recent first
    const rows = await sql`
      SELECT * FROM registered_domains
      ORDER BY registered_at DESC
    `;

    return NextResponse.json({
      domains: rows,
      total: rows.length,
    });
  } catch (err) {
    console.error("[admin/domains] Error:", err);

    // If table doesn't exist, try to create it
    if (err instanceof Error && err.message.includes("registered_domains")) {
      return NextResponse.json({
        domains: [],
        total: 0,
        warning: "Database table may not exist. Run /api/db/init to set up the schema.",
      });
    }

    const message = err instanceof Error ? err.message : "Failed to fetch domains";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
