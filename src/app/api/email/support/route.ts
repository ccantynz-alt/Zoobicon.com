import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendViaMailgun } from "@/lib/mailgun";

// ---------------------------------------------------------------------------
// Support Tickets API
// GET  /api/email/support — list tickets with filters
// POST /api/email/support — send reply to ticket
// PUT  /api/email/support — update ticket status/priority/assignee
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const priority = searchParams.get("priority");
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  try {
    // Build query conditions
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (status !== "all") {
      conditions.push(`t.status = $${paramIdx++}`);
      params.push(status);
    }
    if (priority) {
      conditions.push(`t.priority = $${paramIdx++}`);
      params.push(priority);
    }
    if (search) {
      conditions.push(`(t.subject ILIKE $${paramIdx} OR t.from_email ILIKE $${paramIdx} OR t.from_name ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    // Use simpler tagged template queries
    let tickets;
    if (status !== "all" && !priority && !search) {
      tickets = await sql`
        SELECT t.*,
          (SELECT COUNT(*)::int FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
        FROM support_tickets t
        WHERE t.status = ${status}
        ORDER BY
          CASE t.priority
            WHEN 'urgent' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          t.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (search) {
      const q = `%${search}%`;
      tickets = await sql`
        SELECT t.*,
          (SELECT COUNT(*)::int FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
        FROM support_tickets t
        WHERE (t.subject ILIKE ${q} OR t.from_email ILIKE ${q} OR t.from_name ILIKE ${q})
        ORDER BY t.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      tickets = await sql`
        SELECT t.*,
          (SELECT COUNT(*)::int FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
        FROM support_tickets t
        ORDER BY
          CASE t.priority
            WHEN 'urgent' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          t.updated_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    // Stats
    const stats = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'open')::int AS open,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (WHERE ai_auto_replied = true)::int AS ai_handled
      FROM support_tickets
    `;

    return NextResponse.json({
      tickets,
      stats: stats[0] || { total: 0, open: 0, pending: 0, resolved: 0, ai_handled: 0 },
      page,
      limit,
    });
  } catch (err) {
    console.error("[Support API] GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ticketId, reply, sendToCustomer } = await req.json();

    if (!ticketId || !reply) {
      return NextResponse.json(
        { error: "ticketId and reply are required" },
        { status: 400 }
      );
    }

    // Get ticket details
    const tickets = await sql`
      SELECT * FROM support_tickets WHERE id = ${ticketId}
    `;
    if (tickets.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    const ticket = tickets[0];

    // Store the reply message
    await sql`
      INSERT INTO support_messages (ticket_id, sender, body_text)
      VALUES (${ticketId}, 'agent', ${reply})
    `;

    // Send via Mailgun if requested
    if (sendToCustomer !== false) {
      const fromAddress = `support@${process.env.MAILGUN_DOMAIN || "zoobicon.com"}`;
      const escapeHtml = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const safeReply = escapeHtml(reply);
      const result = await sendViaMailgun({
        from: `Zoobicon Support <${fromAddress}>`,
        to: ticket.from_email as string,
        subject: `Re: ${ticket.subject}`,
        text: reply,
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${safeReply.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #6b7280; font-size: 13px;">Zoobicon Support &bull; <a href="https://zoobicon.com/support" style="color: #6366f1;">Help Center</a></p>
</div>`,
        inReplyTo: ticket.mailgun_message_id as string,
        tags: ["support", "agent-reply"],
      });

      if (result.success) {
        await sql`
          INSERT INTO email_outbound (from_address, to_address, subject, body_text, mailgun_id, ticket_id)
          VALUES (${fromAddress}, ${ticket.from_email}, ${"Re: " + ticket.subject}, ${reply}, ${result.messageId || ""}, ${ticketId})
        `;
      }
    }

    // Update ticket status
    await sql`
      UPDATE support_tickets SET status = 'pending', updated_at = NOW()
      WHERE id = ${ticketId}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Support API] POST Error:", err);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { ticketId, status, priority, assignee } = await req.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required" },
        { status: 400 }
      );
    }

    if (status) {
      await sql`UPDATE support_tickets SET status = ${status}, updated_at = NOW() WHERE id = ${ticketId}`;
    }
    if (priority) {
      await sql`UPDATE support_tickets SET priority = ${priority}, updated_at = NOW() WHERE id = ${ticketId}`;
    }
    if (assignee !== undefined) {
      await sql`UPDATE support_tickets SET assignee = ${assignee}, updated_at = NOW() WHERE id = ${ticketId}`;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Support API] PUT Error:", err);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
