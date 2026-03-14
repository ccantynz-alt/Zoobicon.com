import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// Inbound Email Routing
//
// Handles incoming email via webhook (Cloudflare Email Routing or AWS SES
// SNS notifications). Routes to mailboxes, forwards, or stores.
// ---------------------------------------------------------------------------

interface InboundEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  headers: Record<string, string>;
  receivedAt: string;
  size: number;
  read: boolean;
  folder: "inbox" | "spam" | "trash";
}

interface ForwardingRule {
  id: string;
  domain: string;
  localPart: string; // "*" for catch-all
  forwardTo: string;
  active: boolean;
}

// In-memory stores
const inboundEmails = new Map<string, InboundEmail[]>();
const forwardingRules = new Map<string, ForwardingRule>();

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

async function dbStoreInbound(email: InboundEmail, mailboxAddress: string): Promise<boolean> {
  const sql = await getDb();
  if (!sql) return false;
  try {
    await sql`
      INSERT INTO email_inbound (
        id, mailbox_address, from_address, to_address, subject,
        text_body, html_body, headers, received_at, size, read, folder
      ) VALUES (
        ${email.id}, ${mailboxAddress}, ${email.from}, ${email.to},
        ${email.subject}, ${email.textBody}, ${email.htmlBody},
        ${JSON.stringify(email.headers)}, ${email.receivedAt},
        ${email.size}, ${email.read}, ${email.folder}
      )
    `;
    return true;
  } catch {
    return false;
  }
}

async function dbGetInbox(
  mailboxAddress: string,
  folder: string,
  limit: number,
  offset: number
): Promise<InboundEmail[] | null> {
  const sql = await getDb();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT * FROM email_inbound
      WHERE mailbox_address = ${mailboxAddress} AND folder = ${folder}
      ORDER BY received_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      from: r.from_address as string,
      to: r.to_address as string,
      subject: r.subject as string,
      textBody: r.text_body as string,
      htmlBody: r.html_body as string,
      headers: (r.headers as Record<string, string>) || {},
      receivedAt: (r.received_at as Date).toISOString(),
      size: r.size as number,
      read: r.read as boolean,
      folder: r.folder as InboundEmail["folder"],
    }));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/email/inbound — Webhook for incoming emails
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, subject, text, html, headers, source } = body as {
      from?: string;
      to?: string;
      subject?: string;
      text?: string;
      html?: string;
      headers?: Record<string, string>;
      source?: "cloudflare" | "ses" | "test";
    };

    if (!from || !to) {
      return NextResponse.json(
        { error: "from and to are required." },
        { status: 400 }
      );
    }

    const inbound: InboundEmail = {
      id: randomUUID(),
      from,
      to,
      subject: subject || "(no subject)",
      textBody: text || "",
      htmlBody: html || "",
      headers: headers || {},
      receivedAt: new Date().toISOString(),
      size: (text?.length || 0) + (html?.length || 0),
      read: false,
      folder: "inbox",
    };

    // Basic spam detection
    const spamIndicators = [
      from.includes("noreply@") && !subject,
      (subject || "").toLowerCase().includes("viagra"),
      (subject || "").toLowerCase().includes("nigerian prince"),
      (text || "").includes("click here to claim"),
    ].filter(Boolean).length;

    if (spamIndicators >= 2) {
      inbound.folder = "spam";
    }

    // Store the email
    const stored = await dbStoreInbound(inbound, to);
    if (!stored) {
      const existing = inboundEmails.get(to) || [];
      existing.push(inbound);
      inboundEmails.set(to, existing);
    }

    // Check forwarding rules
    const toLocalPart = to.split("@")[0];
    const toDomain = to.split("@")[1];

    // Look for matching forwarding rule
    for (const rule of forwardingRules.values()) {
      if (
        rule.active &&
        rule.domain === toDomain &&
        (rule.localPart === "*" || rule.localPart === toLocalPart)
      ) {
        // In production: forward via SES
        console.log(`[Inbound] Forwarding ${to} → ${rule.forwardTo}`);
      }
    }

    return NextResponse.json({
      success: true,
      emailId: inbound.id,
      folder: inbound.folder,
      source: source || "direct",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET /api/email/inbound?address=...&folder=...&limit=...&offset=...
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    const folder = req.nextUrl.searchParams.get("folder") || "inbox";
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    if (!address) {
      return NextResponse.json(
        { error: "address query parameter is required." },
        { status: 400 }
      );
    }

    const dbEmails = await dbGetInbox(address, folder, limit, offset);
    if (dbEmails !== null) {
      return NextResponse.json({
        emails: dbEmails,
        folder,
        count: dbEmails.length,
        source: "database",
      });
    }

    const emails = (inboundEmails.get(address) || [])
      .filter((e) => e.folder === folder)
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
      .slice(offset, offset + limit);

    return NextResponse.json({
      emails,
      folder,
      count: emails.length,
      source: "memory",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT /api/email/inbound — Update email (mark read, move folder)
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailId, address, read, folder } = body as {
      emailId?: string;
      address?: string;
      read?: boolean;
      folder?: "inbox" | "spam" | "trash";
    };

    if (!emailId || !address) {
      return NextResponse.json(
        { error: "emailId and address are required." },
        { status: 400 }
      );
    }

    // Try DB first
    const sql = await getDb();
    if (sql) {
      try {
        if (read !== undefined) {
          await sql`UPDATE email_inbound SET read = ${read} WHERE id = ${emailId}`;
        }
        if (folder) {
          await sql`UPDATE email_inbound SET folder = ${folder} WHERE id = ${emailId}`;
        }
        return NextResponse.json({ message: "Email updated.", emailId });
      } catch {
        // Fall through to in-memory
      }
    }

    // In-memory
    const emails = inboundEmails.get(address) || [];
    const email = emails.find((e) => e.id === emailId);
    if (!email) {
      return NextResponse.json({ error: "Email not found." }, { status: 404 });
    }

    if (read !== undefined) email.read = read;
    if (folder) email.folder = folder;

    return NextResponse.json({ message: "Email updated.", emailId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
