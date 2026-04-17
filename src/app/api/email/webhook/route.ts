import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { parseInboundEmail } from "@/lib/mailgun";
import { notifyNewTicket } from "@/lib/admin-notify";
import { emitEmailNotification } from "@/lib/email-notifications";

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

/**
 * Verify a Mailgun inbound webhook payload.
 * Mailgun wraps fields under `signature.*` in Routes, and flattens them as
 * top-level `timestamp`/`token`/`signature` in some webhook shapes — we
 * accept either.
 *
 * Uses constant-time comparison. 5-minute replay window.
 *
 * @returns null if valid, or a short reason string if rejected.
 */
function verifyMailgunSignature(fields: Record<string, unknown>): string | null {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    console.error(
      "[email-webhook] MAILGUN_WEBHOOK_SIGNING_KEY is NOT SET — rejecting ALL " +
        "inbound webhooks. Set it from Mailgun dashboard → Settings → API " +
        "Security → Webhook signing key to accept legitimate emails."
    );
    return "signing key not configured";
  }

  // Mailgun Routes send { signature: { timestamp, token, signature } }.
  // Flat webhooks send top-level timestamp/token/signature.
  let timestamp = "";
  let token = "";
  let signature = "";

  const sigObj = fields["signature"];
  if (sigObj && typeof sigObj === "object") {
    const s = sigObj as Record<string, unknown>;
    timestamp = typeof s.timestamp === "string" ? s.timestamp : String(s.timestamp ?? "");
    token = typeof s.token === "string" ? s.token : String(s.token ?? "");
    signature = typeof s.signature === "string" ? s.signature : String(s.signature ?? "");
  }

  if (!timestamp) timestamp = String(fields["timestamp"] ?? "");
  if (!token) token = String(fields["token"] ?? "");
  if (!signature || typeof sigObj === "string") {
    // If `signature` was a string at the top level, use it directly.
    signature = typeof sigObj === "string" ? sigObj : String(fields["signature"] ?? "");
  }

  if (!timestamp || !token || !signature) {
    return "missing timestamp/token/signature";
  }

  // Replay guard: reject anything more than 5 minutes old or from the future.
  const tsNum = parseInt(timestamp, 10);
  if (!Number.isFinite(tsNum)) {
    return "invalid timestamp";
  }
  if (Math.abs(Date.now() / 1000 - tsNum) >= 300) {
    return "timestamp outside 5-minute replay window";
  }

  // HMAC-SHA256(timestamp + token) keyed with the Mailgun webhook signing key.
  const expected = crypto
    .createHmac("sha256", signingKey)
    .update(timestamp + token)
    .digest("hex");

  // Constant-time comparison. timingSafeEqual throws on length mismatch.
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== providedBuf.length) {
    return "signature length mismatch";
  }
  if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) {
    return "signature mismatch";
  }

  return null;
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

    // STRICT signature verification. Every inbound Mailgun webhook MUST be
    // signed with our webhook signing key, must be within 5 minutes, and must
    // pass HMAC-SHA256(timestamp + token). Unsigned requests are rejected —
    // this closes the audit-log / auto-reply poisoning vector.
    const sigReason = verifyMailgunSignature(
      formFields as unknown as Record<string, unknown>
    );
    if (sigReason !== null) {
      console.error(
        `[email-webhook] REJECTED unsigned/invalid inbound webhook: ${sigReason}`
      );
      lastWebhookAttempt.result = "rejected_invalid_signature";
      lastWebhookAttempt.error = sigReason;
      return NextResponse.json(
        { error: "invalid signature", detail: sigReason },
        { status: 401 }
      );
    }

    // "Store and notify" event webhooks are signed too — acknowledge them
    // without doing ticket work (we only act on inbound Forward payloads).
    if (formFields["event-data"]) {
      lastWebhookAttempt.result = "acknowledged_event";
      return NextResponse.json({ ok: true, note: "Event acknowledged" });
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

        // Push real-time notification to admin browsers
        emitEmailNotification({
          id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: "support_reply",
          from: email.from,
          fromName: email.fromName || email.from.split("@")[0],
          subject: email.subject,
          preview: (email.strippedText || email.bodyText || "").slice(0, 150),
          timestamp: Date.now(),
        });
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

        // Push real-time notification to admin browsers
        emitEmailNotification({
          id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: "support_ticket",
          from: email.from,
          fromName: email.fromName || email.from.split("@")[0],
          subject: email.subject,
          preview: (email.strippedText || email.bodyText || "").slice(0, 150),
          ticketNumber,
          timestamp: Date.now(),
        });

        // Notify owner about new ticket (non-blocking)
        notifyNewTicket({
          ticketNumber,
          subject: email.subject,
          from: email.from,
          fromName: email.fromName,
          preview: email.strippedText || email.bodyText || "",
        }).catch((err) => console.error("[Webhook] Owner notification failed:", err));

        // Trigger async AI draft (non-blocking)
        triggerAIDraft(ticketId, ticketNumber, email.subject, email.strippedText, email.fromName, email.from).catch(
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

      // Push real-time notification to admin browsers
      emitEmailNotification({
        id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: "admin_email",
        from: email.from,
        fromName: email.fromName || email.from.split("@")[0],
        subject: email.subject,
        preview: (email.bodyText || email.strippedText || "").slice(0, 150),
        timestamp: Date.now(),
      });
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
  ticketNumber: string,
  subject: string,
  body: string,
  customerName: string,
  customerEmail: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/email/ai-support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId,
        ticketNumber,
        subject,
        body,
        customerName,
        customerEmail,
      }),
    });
    if (!res.ok) {
      console.error("[AI Draft] Failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[AI Draft] Error:", err);
  }
}
