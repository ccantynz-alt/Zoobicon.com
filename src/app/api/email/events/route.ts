import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/mailgun";

// ---------------------------------------------------------------------------
// POST /api/email/events — Mailgun event webhook
//
// Receives delivery events (delivered, opened, clicked, bounced, complained,
// failed, unsubscribed) from Mailgun and stores them in the email_events table.
//
// Configure in Mailgun Dashboard → Sending → Webhooks:
//   URL: https://zoobicon.com/api/email/events
//   Events: All (or select specific ones)
//
// GET /api/email/events — List recent events with filtering
// ---------------------------------------------------------------------------

interface MailgunEventData {
  id: string;
  event: string;
  timestamp: number;
  recipient: string;
  message?: {
    headers?: {
      "message-id"?: string;
      subject?: string;
      from?: string;
      to?: string;
    };
  };
  "delivery-status"?: {
    code?: number;
    message?: string;
    description?: string;
    "attempt-no"?: number;
  };
  severity?: string; // for bounces: "permanent" | "temporary"
  reason?: string;
  url?: string; // for click events
  "client-info"?: {
    "client-os"?: string;
    "device-type"?: string;
    "client-name"?: string;
    "user-agent"?: string;
  };
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
  };
  tags?: string[];
  campaigns?: Array<{ id: string; name: string }>;
}

// Map Mailgun event names to our internal types
function normalizeEventType(
  event: string
): string {
  const map: Record<string, string> = {
    delivered: "delivery",
    opened: "open",
    clicked: "click",
    bounced: "bounce",
    complained: "complaint",
    failed: "bounce",
    rejected: "reject",
    unsubscribed: "unsubscribe",
    accepted: "send",
    stored: "send",
  };
  return map[event] || event;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let payload: Record<string, unknown>;

    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await req.formData();
      const fields: Record<string, string> = {};
      formData.forEach((value, key) => {
        if (typeof value === "string") fields[key] = value;
      });
      payload = fields;
    } else {
      payload = await req.json();
    }

    // Verify webhook signature
    const signature = payload["signature"] as
      | { timestamp?: string; token?: string; signature?: string }
      | undefined;
    if (signature && typeof signature === "object") {
      const valid = verifyWebhookSignature(
        String(signature.timestamp || ""),
        String(signature.token || ""),
        String(signature.signature || "")
      );
      if (!valid) {
        console.warn("[Email Events] Webhook signature verification failed — processing anyway");
      }
    }

    // Parse event-data (Mailgun sends nested JSON)
    let eventData: MailgunEventData;

    if (payload["event-data"]) {
      eventData =
        typeof payload["event-data"] === "string"
          ? JSON.parse(payload["event-data"] as string)
          : (payload["event-data"] as MailgunEventData);
    } else if (payload["event"]) {
      // Legacy format or direct POST
      eventData = payload as unknown as MailgunEventData;
    } else {
      return NextResponse.json({ ok: true, note: "No event data found" });
    }

    const eventType = normalizeEventType(eventData.event || "unknown");
    const messageId =
      eventData.message?.headers?.["message-id"] || eventData.id || "";
    const recipient = eventData.recipient || "";
    const domain = process.env.MAILGUN_DOMAIN || "zoobicon.com";

    // Build metadata
    const metadata: Record<string, unknown> = {};
    if (eventData.severity) metadata.severity = eventData.severity;
    if (eventData.reason) metadata.reason = eventData.reason;
    if (eventData.url) metadata.url = eventData.url;
    if (eventData["delivery-status"]) {
      metadata.deliveryStatus = eventData["delivery-status"];
    }
    if (eventData["client-info"]) metadata.clientInfo = eventData["client-info"];
    if (eventData.geolocation) metadata.geolocation = eventData.geolocation;
    if (eventData.tags) metadata.tags = eventData.tags;

    // Store in email_events table
    try {
      await sql`
        INSERT INTO email_events (message_id, type, domain, recipient, timestamp, metadata)
        VALUES (
          ${messageId},
          ${eventType},
          ${domain},
          ${recipient},
          ${eventData.timestamp ? new Date(eventData.timestamp * 1000).toISOString() : new Date().toISOString()},
          ${JSON.stringify(metadata)}
        )
      `;
    } catch (dbErr) {
      console.error("[Email Events] DB insert failed:", dbErr);
      // Don't fail the webhook — Mailgun will retry otherwise
    }

    // Handle specific event types
    if (eventType === "bounce" && eventData.severity === "permanent") {
      // Store permanent bounces for suppression
      try {
        await sql`
          INSERT INTO email_suppressions (email, reason, type, created_at)
          VALUES (${recipient}, ${eventData.reason || "hard bounce"}, 'bounce', NOW())
          ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()
        `;
      } catch {
        // Suppression table may not exist yet — that's OK
      }
    }

    if (eventType === "complaint") {
      // Spam complaint — must suppress immediately (CAN-SPAM)
      try {
        await sql`
          INSERT INTO email_suppressions (email, reason, type, created_at)
          VALUES (${recipient}, 'spam complaint', 'complaint', NOW())
          ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason, type = 'complaint', created_at = NOW()
        `;
      } catch {
        // Suppression table may not exist yet
      }
    }

    if (eventType === "unsubscribe") {
      try {
        await sql`
          INSERT INTO email_suppressions (email, reason, type, created_at)
          VALUES (${recipient}, 'unsubscribed', 'unsubscribe', NOW())
          ON CONFLICT (email) DO UPDATE SET reason = EXCLUDED.reason, type = 'unsubscribe', created_at = NOW()
        `;
      } catch {
        // Suppression table may not exist yet
      }
    }

    console.log(
      `[Email Events] ${eventType} for ${recipient} (msg: ${messageId.substring(0, 30)})`
    );

    return NextResponse.json({ ok: true, event: eventType });
  } catch (err) {
    console.error("[Email Events] Error:", err);
    // Return 200 so Mailgun doesn't retry
    return NextResponse.json({ ok: false, error: "Processing failed" }, { status: 200 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/email/events — Query stored events
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const recipient = searchParams.get("recipient");
  const days = parseInt(searchParams.get("days") || "7", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  try {
    let events;

    if (type && recipient) {
      events = await sql`
        SELECT * FROM email_events
        WHERE type = ${type}
          AND recipient = ${recipient}
          AND timestamp >= NOW() - INTERVAL '1 day' * ${days}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
    } else if (type) {
      events = await sql`
        SELECT * FROM email_events
        WHERE type = ${type}
          AND timestamp >= NOW() - INTERVAL '1 day' * ${days}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
    } else if (recipient) {
      events = await sql`
        SELECT * FROM email_events
        WHERE recipient = ${recipient}
          AND timestamp >= NOW() - INTERVAL '1 day' * ${days}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
    } else {
      events = await sql`
        SELECT * FROM email_events
        WHERE timestamp >= NOW() - INTERVAL '1 day' * ${days}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
    }

    // Summary counts
    const summary = await sql`
      SELECT type, COUNT(*)::int as count
      FROM email_events
      WHERE timestamp >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY type
      ORDER BY count DESC
    `;

    return NextResponse.json({
      events,
      summary: Object.fromEntries(
        summary.map((r: Record<string, unknown>) => [r.type, r.count])
      ),
      period: `${days}d`,
      total: events.length,
    });
  } catch (err) {
    console.error("[Email Events] GET Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
