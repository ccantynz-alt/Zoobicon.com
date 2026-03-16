import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendViaMailgun } from "@/lib/mailgun";

// ---------------------------------------------------------------------------
// Admin Email Inbox API
// GET  /api/email/inbox — list emails (with filtering)
// POST /api/email/inbox — compose and send a new email
// PUT  /api/email/inbox — mark read/unread, move to folder
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") || "inbox";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = (page - 1) * limit;

  try {
    let emails;
    let total;

    if (search) {
      const q = `%${search}%`;
      emails = await sql`
        SELECT id, mailbox_address, from_address, to_address, subject,
               text_body, html_body, received_at, read, folder
        FROM email_inbound
        WHERE folder = ${folder}
          AND (subject ILIKE ${q} OR from_address ILIKE ${q} OR text_body ILIKE ${q})
        ORDER BY received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      total = await sql`
        SELECT COUNT(*)::int AS c FROM email_inbound
        WHERE folder = ${folder}
          AND (subject ILIKE ${q} OR from_address ILIKE ${q} OR text_body ILIKE ${q})
      `;
    } else {
      emails = await sql`
        SELECT id, mailbox_address, from_address, to_address, subject,
               text_body, html_body, received_at, read, folder
        FROM email_inbound
        WHERE folder = ${folder}
        ORDER BY received_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      total = await sql`
        SELECT COUNT(*)::int AS c FROM email_inbound WHERE folder = ${folder}
      `;
    }

    // Unread count
    const unread = await sql`
      SELECT COUNT(*)::int AS c FROM email_inbound WHERE read = false AND folder = 'inbox'
    `;

    return NextResponse.json({
      emails,
      total: total[0]?.c ?? 0,
      unread: unread[0]?.c ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error("[Inbox API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, text, html, replyTo } = await req.json();

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: "to, subject, and text/html are required" },
        { status: 400 }
      );
    }

    const fromAddress = `admin@${process.env.MAILGUN_DOMAIN || "zoobicon.com"}`;
    const result = await sendViaMailgun({
      from: `Zoobicon <${fromAddress}>`,
      to,
      subject,
      text,
      html,
      replyTo,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Store in outbound
    await sql`
      INSERT INTO email_outbound (from_address, to_address, subject, body_text, body_html, mailgun_id)
      VALUES (${fromAddress}, ${to}, ${subject}, ${text || ""}, ${html || ""}, ${result.messageId || ""})
    `;

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err) {
    console.error("[Inbox Send] Error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, read, folder } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (read !== undefined) {
      await sql`UPDATE email_inbound SET read = ${read} WHERE id = ${id}`;
    }

    if (folder) {
      await sql`UPDATE email_inbound SET folder = ${folder} WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Inbox Update] Error:", err);
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}
