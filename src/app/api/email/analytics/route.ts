import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Email Analytics API
//
// Tracks sends, deliveries, opens, clicks, bounces, complaints.
// Powered by SES event notifications + our own tracking pixel.
// ---------------------------------------------------------------------------

interface EmailEvent {
  id: string;
  messageId: string;
  type: "send" | "delivery" | "open" | "click" | "bounce" | "complaint" | "reject";
  domain: string;
  recipient: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

// In-memory event store
const emailEvents: EmailEvent[] = [];

// ---------------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------------
async function getDb() {
  try {
    const { sql } = await import("@/lib/db");
    return sql;
  } catch {
    return null;
  }
}

async function dbGetStats(
  domain: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number> | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT type, COUNT(*)::int as count
      FROM email_events
      WHERE domain = ${domain}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}
      GROUP BY type
    `;
    const stats: Record<string, number> = {
      sent: 0, delivered: 0, opened: 0, clicked: 0,
      bounced: 0, complained: 0, rejected: 0,
    };
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      stats[r.type as string] = r.count as number;
    }
    return stats;
  } catch {
    return null;
  }
}

async function dbLogEvent(event: EmailEvent): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO email_events (
        id, message_id, type, domain, recipient, timestamp, metadata
      ) VALUES (
        ${event.id}, ${event.messageId}, ${event.type}, ${event.domain},
        ${event.recipient}, ${event.timestamp}, ${JSON.stringify(event.metadata || {})}
      )
    `;
    return true;
  } catch {
    return false;
  }
}

async function dbGetTimeline(
  domain: string,
  days: number
): Promise<Array<{ date: string; sent: number; delivered: number; opened: number }> | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) FILTER (WHERE type = 'send')::int as sent,
        COUNT(*) FILTER (WHERE type = 'delivery')::int as delivered,
        COUNT(*) FILTER (WHERE type = 'open')::int as opened
      FROM email_events
      WHERE domain = ${domain}
        AND timestamp >= NOW() - INTERVAL '1 day' * ${days}
      GROUP BY DATE(timestamp)
      ORDER BY date
    `;
    return rows.map((r: Record<string, unknown>) => ({
      date: String(r.date),
      sent: r.sent as number,
      delivered: r.delivered as number,
      opened: r.opened as number,
    }));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// GET /api/email/analytics?domain=...&period=...
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get("domain");
    const period = req.nextUrl.searchParams.get("period") || "7d";

    if (!domain) {
      return NextResponse.json(
        { error: "domain query parameter is required." },
        { status: 400 }
      );
    }

    // Parse period
    const daysMatch = period.match(/^(\d+)d$/);
    const days = daysMatch ? parseInt(daysMatch[1]) : 7;
    const startDate = new Date(Date.now() - days * 86400000).toISOString();
    const endDate = new Date().toISOString();

    // Try DB
    const dbStats = await dbGetStats(domain, startDate, endDate);
    const dbTimeline = await dbGetTimeline(domain, days);

    if (dbStats !== null) {
      const totalSent = dbStats.sent || 0;
      const delivered = dbStats.delivered || 0;

      return NextResponse.json({
        domain,
        period: `${days}d`,
        stats: dbStats,
        rates: {
          deliveryRate: totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(1) + "%" : "N/A",
          openRate: delivered > 0 ? (((dbStats.opened || 0) / delivered) * 100).toFixed(1) + "%" : "N/A",
          clickRate: delivered > 0 ? (((dbStats.clicked || 0) / delivered) * 100).toFixed(1) + "%" : "N/A",
          bounceRate: totalSent > 0 ? (((dbStats.bounced || 0) / totalSent) * 100).toFixed(1) + "%" : "N/A",
          complaintRate: totalSent > 0 ? (((dbStats.complained || 0) / totalSent) * 100).toFixed(4) + "%" : "N/A",
        },
        timeline: dbTimeline || [],
        source: "database",
      });
    }

    // In-memory fallback
    const domainEvents = emailEvents.filter(
      (e) => e.domain === domain && e.timestamp >= startDate
    );

    const stats = {
      sent: domainEvents.filter((e) => e.type === "send").length,
      delivered: domainEvents.filter((e) => e.type === "delivery").length,
      opened: domainEvents.filter((e) => e.type === "open").length,
      clicked: domainEvents.filter((e) => e.type === "click").length,
      bounced: domainEvents.filter((e) => e.type === "bounce").length,
      complained: domainEvents.filter((e) => e.type === "complaint").length,
      rejected: domainEvents.filter((e) => e.type === "reject").length,
    };

    const totalSent = stats.sent || 1; // avoid division by zero
    const delivered = stats.delivered || 0;

    return NextResponse.json({
      domain,
      period: `${days}d`,
      stats,
      rates: {
        deliveryRate: ((delivered / totalSent) * 100).toFixed(1) + "%",
        openRate: delivered > 0 ? ((stats.opened / delivered) * 100).toFixed(1) + "%" : "N/A",
        clickRate: delivered > 0 ? ((stats.clicked / delivered) * 100).toFixed(1) + "%" : "N/A",
        bounceRate: ((stats.bounced / totalSent) * 100).toFixed(1) + "%",
        complaintRate: ((stats.complained / totalSent) * 100).toFixed(4) + "%",
      },
      timeline: [],
      source: "memory",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/email/analytics — Log an event (webhook from SES/tracking pixel)
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, type, domain, recipient, metadata } = body as {
      messageId?: string;
      type?: EmailEvent["type"];
      domain?: string;
      recipient?: string;
      metadata?: Record<string, string>;
    };

    if (!messageId || !type || !domain) {
      return NextResponse.json(
        { error: "messageId, type, and domain are required." },
        { status: 400 }
      );
    }

    const validTypes = ["send", "delivery", "open", "click", "bounce", "complaint", "reject"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const event: EmailEvent = {
      id: crypto.randomUUID(),
      messageId,
      type,
      domain,
      recipient: recipient || "",
      timestamp: new Date().toISOString(),
      metadata,
    };

    const saved = await dbLogEvent(event);
    if (!saved) {
      emailEvents.push(event);
      // Keep in-memory store from growing unbounded
      if (emailEvents.length > 10000) {
        emailEvents.splice(0, emailEvents.length - 10000);
      }
    }

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
