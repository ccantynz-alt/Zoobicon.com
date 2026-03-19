import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import {
  verifyWebhookSignature,
  parseInboundEmail,
} from "@/lib/mailgun";

// ---------------------------------------------------------------------------
// GET /api/email/webhook — Diagnostic endpoint (check if webhook is reachable)
// POST /api/email/webhook — Mailgun inbound email webhook
// ---------------------------------------------------------------------------

// Store last webhook attempt for debugging
let lastWebhookAttempt: {
  time: string;
  contentType: string;
  fields: string[];
  recipient: string;
  result: string;
  error?: string;
} | null = null;

// GET — diagnostic: is the webhook reachable? what was the last attempt?
export async function GET() {
  let dbStatus = "unknown";
  let inboundCount = 0;
  let ticketCount = 0;

  try {
    const inbound = await sql`SELECT COUNT(*)::int AS c FROM email_inbound`;
    inboundCount = inbound[0]?.c ?? 0;
    const tickets = await sql`SELECT COUNT(*)::int AS c FROM support_tickets`;
    ticketCount = tickets[0]?.c ?? 0;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = `error: ${err instanceof Error ? err.message : "unknown"}`;
  }

  return NextResponse.json({
    status: "Webhook endpoint is reachable",
    database: dbStatus,
    counts: { inbound_emails: inboundCount, support_tickets: ticketCount },
    env: {
      MAILGUN_API_KEY: process.env.MAILGUN_API_KEY ? "set" : "NOT SET",
      MAILGUN_WEBHOOK_SIGNING_KEY: process.env.MAILGUN_WEBHOOK_SIGNING_KEY ? "set" : "NOT SET",
      MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN || "NOT SET (defaults to zoobicon.com)",
      DATABASE_URL: process.env.DATABASE_URL ? "set" : "NOT SET",
    },
    last_webhook_attempt: lastWebhookAttempt || "No webhook attempts received yet",
  });
}

// Helper: generate ticket number like TK-10001
async function nextTicketNumber(): Promise<string> {
  const rows = await sql`SELECT COUNT(*)::int AS c FROM support_tickets`;
  const count = (rows[0]?.c ?? 0) as number;
  return `TK-${10001 + count}`;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  // Initialize debug info
  lastWebhookAttempt = {
    time: new Date().toISOString(),
    contentType,
    fields: [],
    recipient: "",
    result: "processing",
  };

  try {
    // Parse form data or JSON
    let formFields: Record<string, string> = {};

    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        if (typeof value === "string") {
          formFields[key] = value;
        }
      });
    } else {
      // JSON fallback (for testing or "Store and notify" events)
      try {
        formFields = await req.json();
      } catch {
        lastWebhookAttempt.result = "error";
        lastWebhookAttempt.error = "Could not parse request body";
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
      }
    }

    lastWebhookAttempt.fields = Object.keys(formFields);

    // If this is a Mailgun "Store and notify" event (JSON with event-data),
    // acknowledge it but don't process — we only need the Forward action data.
    if (formFields["event-data"] || formFields["signature"]) {
      // This is a Mailgun event webhook, not an inbound email forward
      const eventData = formFields["event-data"];
      if (typeof eventData === "string" || typeof eventData === "object") {
        lastWebhookAttempt.result = "acknowledged_event";
        return NextResponse.json({ ok: true, note: "Event acknowledged" });
      }
    }

    // Verify Mailgun signature — be lenient: log warning but don't reject
    // during initial setup. This prevents losing emails due to key mismatch.
    const sigTimestamp = formFields["timestamp"] || "";
    const sigToken = formFields["token"] || "";
    const sigSignature = formFields["signature"] || "";

    if (sigTimestamp && sigToken && sigSignature) {
      const valid = verifyWebhookSignature(sigTimestamp, sigToken, sigSignature);
      if (!valid) {
        console.warn(
          "[Webhook] Signature verification FAILED — processing anyway.",
          "Check MAILGUN_WEBHOOK_SIGNING_KEY. timestamp:", sigTimestamp
        );
        // Don't reject — log and continue. Admin can check /api/email/webhook (GET).
      }
    }

    // Parse the inbound email
    const email = parseInboundEmail(formFields);
    const recipient = email.to.toLowerCase();

    lastWebhookAttempt.recipient = recipient;

    // If no recipient detected, try common Mailgun field names
    const effectiveRecipient =
      recipient ||
      (formFields["recipient"] || "").toLowerCase() ||
      (formFields["To"] || "").toLowerCase();

    if (!effectiveRecipient) {
      lastWebhookAttempt.result = "error";
      lastWebhookAttempt.error = "No recipient found in webhook data";
      console.error("[Webhook] No recipient found. Fields:", Object.keys(formFields));
      // Still return 200 so Mailgun doesn't retry
      return NextResponse.json({ ok: true, warning: "No recipient found" });
    }

    // Route based on recipient address
    const isSupport = effectiveRecipient.includes("support@");
    const isAdmin = effectiveRecipient.includes("admin@");

    if (isSupport) {
      // ---- Support ticket flow ----
      let existingTicketId: string | null = null;

      if (email.inReplyTo) {
        try {
          const existing = await sql`
            SELECT t.id FROM support_tickets t
            JOIN email_outbound o ON o.ticket_id = t.id
            WHERE o.mailgun_id = ${email.inReplyTo}
            LIMIT 1
          `;
          if (existing.length > 0) {
            existingTicketId = existing[0].id as string;
          }
        } catch { /* table might not have outbound entries yet */ }
      }

      if (existingTicketId) {
        await sql`
          INSERT INTO support_messages (ticket_id, sender, body_text, body_html, attachments)
          VALUES (${existingTicketId}, 'customer', ${email.strippedText}, ${email.bodyHtml}, ${JSON.stringify(email.attachments)})
        `;
        await sql`
          UPDATE support_tickets
          SET status = 'open', updated_at = NOW()
          WHERE id = ${existingTicketId}
        `;
      } else {
        const ticketNumber = await nextTicketNumber();
        const rows = await sql`
          INSERT INTO support_tickets (ticket_number, subject, from_email, from_name, mailgun_message_id)
          VALUES (${ticketNumber}, ${email.subject}, ${email.from}, ${email.fromName}, ${email.messageId})
          RETURNING id
        `;
        const ticketId = rows[0].id as string;

        await sql`
          INSERT INTO support_messages (ticket_id, sender, body_text, body_html, attachments)
          VALUES (${ticketId}, 'customer', ${email.strippedText}, ${email.bodyHtml}, ${JSON.stringify(email.attachments)})
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
        VALUES (${effectiveRecipient}, ${email.from}, ${effectiveRecipient}, ${email.subject}, ${email.bodyText}, ${email.bodyHtml})
      `;
    }

    lastWebhookAttempt.result = `success — stored as ${isSupport ? "support ticket" : "inbox email"}`;
    console.log(`[Webhook] Email from ${email.from} to ${effectiveRecipient} — ${isSupport ? "support ticket" : "inbox"}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    console.error("[Email Webhook] Error:", message, err);
    lastWebhookAttempt.result = "error";
    lastWebhookAttempt.error = message;
    // Return 200 even on error so Mailgun doesn't keep retrying failed webhooks
    // The error is logged and visible via GET /api/email/webhook
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
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
