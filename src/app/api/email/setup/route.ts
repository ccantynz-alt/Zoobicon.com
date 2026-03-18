import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendViaMailgun } from "@/lib/mailgun";

// ---------------------------------------------------------------------------
// GET /api/email/setup — Verify Mailgun config + ensure DB tables exist
// POST /api/email/setup — Create all email DB tables
// ---------------------------------------------------------------------------

const EMAIL_TABLES_SQL = `
-- Inbound emails (admin inbox)
CREATE TABLE IF NOT EXISTS email_inbound (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_address TEXT NOT NULL DEFAULT 'admin@zoobicon.com',
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '(No Subject)',
  text_body TEXT DEFAULT '',
  html_body TEXT DEFAULT '',
  headers JSONB DEFAULT '{}',
  received_at TIMESTAMPTZ DEFAULT NOW(),
  size INT DEFAULT 0,
  read BOOLEAN DEFAULT false,
  folder TEXT DEFAULT 'inbox'
);

CREATE INDEX IF NOT EXISTS idx_email_inbound_mailbox ON email_inbound(mailbox_address);
CREATE INDEX IF NOT EXISTS idx_email_inbound_received ON email_inbound(received_at);

-- Outbound emails (sent)
CREATE TABLE IF NOT EXISTS email_outbound (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_text TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  status TEXT DEFAULT 'sent',
  mailgun_id TEXT DEFAULT '',
  ticket_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_outbound_ticket ON email_outbound(ticket_id);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assignee TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  ai_confidence DECIMAL DEFAULT 0,
  ai_auto_replied BOOLEAN DEFAULT false,
  mailgun_message_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(from_email);

-- Support ticket messages (conversation thread)
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender TEXT NOT NULL DEFAULT 'customer',
  body_text TEXT DEFAULT '',
  body_html TEXT DEFAULT '',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);

-- Knowledge base for AI support
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email events (delivery tracking)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT DEFAULT '',
  type TEXT NOT NULL,
  domain TEXT DEFAULT '',
  recipient TEXT DEFAULT '',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_email_events_domain ON email_events(domain);
CREATE INDEX IF NOT EXISTS idx_email_events_ts ON email_events(timestamp);
`;

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // 1. Check MAILGUN_API_KEY
  const apiKey = process.env.MAILGUN_API_KEY;
  checks.mailgun_api_key = apiKey
    ? { ok: true, detail: `Set (${apiKey.substring(0, 8)}...)` }
    : { ok: false, detail: "MAILGUN_API_KEY not set in environment" };

  // 2. Check MAILGUN_DOMAIN
  const domain = process.env.MAILGUN_DOMAIN;
  checks.mailgun_domain = domain
    ? { ok: true, detail: domain }
    : { ok: false, detail: "MAILGUN_DOMAIN not set (defaults to zoobicon.com)" };

  // 3. Check MAILGUN_WEBHOOK_SIGNING_KEY
  const webhookKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  checks.webhook_signing_key = webhookKey
    ? { ok: true, detail: "Set" }
    : { ok: false, detail: "MAILGUN_WEBHOOK_SIGNING_KEY not set — webhook verification will fall back to API key" };

  // 4. Check ADMIN_EMAIL
  const adminEmail = process.env.ADMIN_EMAIL;
  checks.admin_email = adminEmail
    ? { ok: true, detail: adminEmail }
    : { ok: false, detail: "ADMIN_EMAIL not set (defaults to admin@zoobicon.com)" };

  // 5. Verify Mailgun API connectivity
  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.mailgun.net/v3/${domain || "zoobicon.com"}/stats/total?event=delivered&duration=1m`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
          },
        }
      );
      checks.mailgun_api = res.ok
        ? { ok: true, detail: "Mailgun API responding" }
        : { ok: false, detail: `Mailgun API returned ${res.status}: ${await res.text()}` };
    } catch (err) {
      checks.mailgun_api = {
        ok: false,
        detail: `Cannot reach Mailgun API: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  } else {
    checks.mailgun_api = { ok: false, detail: "Skipped — no API key" };
  }

  // 6. Check database tables
  try {
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('email_inbound', 'email_outbound', 'support_tickets', 'support_messages', 'knowledge_base', 'email_events')
      ORDER BY table_name
    `;
    const found = tables.map((t: Record<string, unknown>) => t.table_name as string);
    const required = ["email_inbound", "email_outbound", "support_tickets", "support_messages"];
    const missing = required.filter((t) => !found.includes(t));

    checks.database = missing.length === 0
      ? { ok: true, detail: `All tables exist: ${found.join(", ")}` }
      : { ok: false, detail: `Missing tables: ${missing.join(", ")}. POST to /api/email/setup to create them.` };
  } catch (err) {
    checks.database = {
      ok: false,
      detail: `Database error: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json({
    status: allOk ? "ready" : "needs_setup",
    checks,
    webhook_url: "https://zoobicon.com/api/email/webhook",
    instructions: allOk
      ? "Email system is fully configured and ready."
      : "Fix the failing checks above. POST to /api/email/setup to create missing database tables.",
  });
}

export async function POST() {
  try {
    // Run all table creation statements
    await sql.unsafe(EMAIL_TABLES_SQL);

    // Verify tables were created
    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('email_inbound', 'email_outbound', 'support_tickets', 'support_messages', 'knowledge_base', 'email_events')
      ORDER BY table_name
    `;
    const found = tables.map((t: Record<string, unknown>) => t.table_name as string);

    return NextResponse.json({
      success: true,
      tables_created: found,
      message: `Created ${found.length} email tables. Run GET /api/email/setup to verify full configuration.`,
    });
  } catch (err) {
    console.error("[Email Setup] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create tables" },
      { status: 500 }
    );
  }
}
