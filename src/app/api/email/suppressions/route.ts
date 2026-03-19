import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// ---------------------------------------------------------------------------
// Suppression List Management
// GET    /api/email/suppressions — List suppressed emails
// DELETE /api/email/suppressions?email=... — Remove from suppression list
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // bounce, complaint, unsubscribe
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);

  try {
    let suppressions;
    if (type) {
      suppressions = await sql`
        SELECT * FROM email_suppressions
        WHERE type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    } else {
      suppressions = await sql`
        SELECT * FROM email_suppressions
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    const counts = await sql`
      SELECT type, COUNT(*)::int as count
      FROM email_suppressions
      GROUP BY type
    `;

    return NextResponse.json({
      suppressions,
      counts: Object.fromEntries(
        counts.map((r: Record<string, unknown>) => [r.type, r.count])
      ),
      total: suppressions.length,
    });
  } catch (err) {
    console.error("[Suppressions] GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch suppression list" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "email query parameter is required" },
      { status: 400 }
    );
  }

  try {
    await sql`DELETE FROM email_suppressions WHERE email = ${email.toLowerCase()}`;
    return NextResponse.json({ success: true, email });
  } catch (err) {
    console.error("[Suppressions] DELETE Error:", err);
    return NextResponse.json(
      { error: "Failed to remove from suppression list" },
      { status: 500 }
    );
  }
}
