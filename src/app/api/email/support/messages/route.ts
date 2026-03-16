import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// ---------------------------------------------------------------------------
// GET /api/email/support/messages?ticketId=xxx — get all messages for a ticket
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get("ticketId");

  if (!ticketId) {
    return NextResponse.json(
      { error: "ticketId is required" },
      { status: 400 }
    );
  }

  try {
    const messages = await sql`
      SELECT id, ticket_id, sender, body_text, body_html, attachments, created_at
      FROM support_messages
      WHERE ticket_id = ${ticketId}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[Messages API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
