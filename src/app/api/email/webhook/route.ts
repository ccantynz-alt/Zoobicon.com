import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  verifyWebhookSignature,
  parseInboundEmail,
} from "@/lib/mailgun";

// ---------------------------------------------------------------------------
// POST /api/email/webhook — Mailgun inbound email webhook
// Mailgun POSTs form-encoded data when an email arrives.
// We store it in the DB and optionally trigger AI auto-reply.
// ---------------------------------------------------------------------------

// Helper: generate ticket number like TK-10001
async function nextTicketNumber(): Promise<string> {
  const rows = await sql`SELECT COUNT(*)::int AS c FROM support_tickets`;
  const count = (rows[0]?.c ?? 0) as number;
  return `TK-${10001 + count}`;
}

export async function POST(req: NextRequest) {
  try {
    // Mailgun sends form-encoded data
    const contentType = req.headers.get("content-type") || "";
    let formFields: Record<string, string> = {};

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        if (typeof value === "string") {
          formFields[key] = value;
        }
      });
    } else {
      // Fallback: JSON (for testing)
      formFields = await req.json();
    }

    // Verify Mailgun signature (skip in dev / when no key)
    const sigTimestamp = formFields["timestamp"] || "";
    const sigToken = formFields["token"] || "";
    const sigSignature = formFields["signature"] || "";

    if (process.env.MAILGUN_API_KEY && sigTimestamp && sigToken && sigSignature) {
      if (!verifyWebhookSignature(sigTimestamp, sigToken, sigSignature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    // Parse the inbound email
    const email = parseInboundEmail(formFields);
    const recipient = email.to.toLowerCase();

    // Route based on recipient address
    const isSupport = recipient.includes("support@");
    const isAdmin = recipient.includes("admin@");

    if (isSupport) {
      // ---- Support ticket flow ----
      // Check if this is a reply to an existing ticket (via In-Reply-To or References)
      let existingTicketId: string | null = null;

      if (email.inReplyTo) {
        const existing = await sql`
          SELECT t.id FROM support_tickets t
          JOIN email_outbound o ON o.ticket_id = t.id
          WHERE o.mailgun_id = ${email.inReplyTo}
          LIMIT 1
        `;
        if (existing.length > 0) {
          existingTicketId = existing[0].id as string;
        }
      }

      if (existingTicketId) {
        // Add message to existing ticket
        await sql`
          INSERT INTO support_messages (ticket_id, sender, body_text, body_html)
          VALUES (${existingTicketId}, 'customer', ${email.strippedText}, ${email.bodyHtml})
        `;
        await sql`
          UPDATE support_tickets
          SET status = 'open', updated_at = NOW()
          WHERE id = ${existingTicketId}
        `;
      } else {
        // Create new ticket
        const ticketNumber = await nextTicketNumber();
        const rows = await sql`
          INSERT INTO support_tickets (ticket_number, subject, from_email, from_name, mailgun_message_id)
          VALUES (${ticketNumber}, ${email.subject}, ${email.from}, ${email.fromName}, ${email.messageId})
          RETURNING id
        `;
        const ticketId = rows[0].id as string;

        // Store the initial message
        await sql`
          INSERT INTO support_messages (ticket_id, sender, body_text, body_html)
          VALUES (${ticketId}, 'customer', ${email.strippedText}, ${email.bodyHtml})
        `;

        // Trigger async AI draft (non-blocking)
        triggerAIDraft(ticketId, email.subject, email.strippedText, email.fromName).catch(
          (err) => console.error("[Webhook] AI draft failed:", err)
        );
      }
    }

    if (isAdmin || !isSupport) {
      // ---- General inbox — store in email_inbound ----
      await sql`
        INSERT INTO email_inbound (mailbox_address, from_address, to_address, subject, text_body, html_body)
        VALUES (${recipient}, ${email.from}, ${recipient}, ${email.subject}, ${email.bodyText}, ${email.bodyHtml})
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Email Webhook] Error:", err);
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Trigger AI auto-draft for a new support ticket
// ---------------------------------------------------------------------------
async function triggerAIDraft(
  ticketId: string,
  subject: string,
  body: string,
  customerName: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/email/ai-support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, subject, body, customerName }),
    });
    if (!res.ok) {
      console.error("[AI Draft] Failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[AI Draft] Error:", err);
  }
}
