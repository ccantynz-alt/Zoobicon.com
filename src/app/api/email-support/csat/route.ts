import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// POST /api/email-support/csat — store customer satisfaction rating
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ticketId, rating, comment, submittedAt } = body;

    if (!ticketId || !rating) {
      return NextResponse.json({ error: "ticketId and rating are required" }, { status: 400 });
    }

    // Try to store in database
    try {
      await sql`
        INSERT INTO csat_ratings (ticket_id, rating, comment, submitted_at)
        VALUES (${ticketId}, ${rating}, ${comment || null}, ${submittedAt || new Date().toISOString()})
        ON CONFLICT (ticket_id) DO UPDATE SET rating = ${rating}, comment = ${comment || null}
      `;
    } catch {
      // DB not available — that's fine, client already saved to localStorage
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
