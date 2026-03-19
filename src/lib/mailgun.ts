// ---------------------------------------------------------------------------
// Mailgun integration for Zoobicon
// Handles sending emails and verifying inbound webhooks
// ---------------------------------------------------------------------------

import crypto from "crypto";

const MAILGUN_API_KEY = () => process.env.MAILGUN_API_KEY || "";
const MAILGUN_DOMAIN = () => process.env.MAILGUN_DOMAIN || "zoobicon.com";
const MAILGUN_API_BASE = "https://api.mailgun.net/v3";

// ---------------------------------------------------------------------------
// Send email via Mailgun HTTP API
// ---------------------------------------------------------------------------
export interface MailgunSendOptions {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  inReplyTo?: string; // Message-ID for threading
  references?: string; // References header for threading
  tags?: string[];
  tracking?: boolean; // Enable open+click tracking (default: true)
  trackingClicks?: boolean | "htmlonly"; // Click tracking mode
  trackingOpens?: boolean; // Open tracking (pixel injection)
  unsubscribeUrl?: string; // List-Unsubscribe URL for CAN-SPAM
  requireTls?: boolean; // Require TLS for delivery
}

export interface MailgunSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendViaMailgun(
  opts: MailgunSendOptions
): Promise<MailgunSendResult> {
  const apiKey = MAILGUN_API_KEY();
  const domain = MAILGUN_DOMAIN();

  if (!apiKey) {
    console.log("[Mailgun] No API key configured — logging email to console");
    console.log("[Mailgun] To:", opts.to, "Subject:", opts.subject);
    return { success: true, messageId: `local-${Date.now()}` };
  }

  // Check suppression list — don't send to bounced/complained addresses
  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
  const validRecipients: string[] = [];
  for (const r of recipients) {
    const suppressed = await isEmailSuppressed(r);
    if (suppressed) {
      console.warn(`[Mailgun] Skipping suppressed address: ${r}`);
    } else {
      validRecipients.push(r);
    }
  }

  if (validRecipients.length === 0) {
    return {
      success: false,
      error: "All recipients are on the suppression list",
    };
  }

  const form = new URLSearchParams();
  form.append("from", opts.from);

  for (const r of validRecipients) {
    form.append("to", r);
  }

  form.append("subject", opts.subject);
  if (opts.text) form.append("text", opts.text);
  if (opts.html) form.append("html", opts.html);
  if (opts.replyTo) form.append("h:Reply-To", opts.replyTo);
  if (opts.inReplyTo) form.append("h:In-Reply-To", opts.inReplyTo);
  if (opts.references) form.append("h:References", opts.references);
  if (opts.tags) {
    for (const tag of opts.tags) {
      form.append("o:tag", tag);
    }
  }

  // Tracking options
  if (opts.tracking !== undefined) {
    form.append("o:tracking", opts.tracking ? "yes" : "no");
  }
  if (opts.trackingClicks !== undefined) {
    form.append(
      "o:tracking-clicks",
      opts.trackingClicks === true
        ? "yes"
        : opts.trackingClicks === false
          ? "no"
          : opts.trackingClicks
    );
  }
  if (opts.trackingOpens !== undefined) {
    form.append("o:tracking-opens", opts.trackingOpens ? "yes" : "no");
  }

  // CAN-SPAM / GDPR compliance: List-Unsubscribe header
  if (opts.unsubscribeUrl) {
    form.append("h:List-Unsubscribe", `<${opts.unsubscribeUrl}>`);
    form.append("h:List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
  }

  // TLS enforcement
  if (opts.requireTls) {
    form.append("o:require-tls", "true");
  }

  try {
    const res = await fetch(`${MAILGUN_API_BASE}/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      },
      body: form,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Mailgun] Send failed:", res.status, err);
      return { success: false, error: `Mailgun error ${res.status}: ${err}` };
    }

    const data = await res.json();
    return { success: true, messageId: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mailgun send failed";
    console.error("[Mailgun] Send error:", message);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Verify Mailgun webhook signature
// ---------------------------------------------------------------------------
export function verifyWebhookSignature(
  timestamp: string,
  token: string,
  signature: string
): boolean {
  // Mailgun uses a separate webhook signing key (not the API key).
  // Find it in Mailgun dashboard → Settings → API Security → Webhook signing key.
  // Falls back to API key for backwards compatibility.
  const signingKey =
    process.env.MAILGUN_WEBHOOK_SIGNING_KEY || MAILGUN_API_KEY();
  if (!signingKey) return true; // Skip verification in dev

  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(timestamp + token);
  const expected = hmac.digest("hex");
  return signature === expected;
}

// ---------------------------------------------------------------------------
// Parse inbound email from Mailgun webhook POST
// ---------------------------------------------------------------------------
export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  url?: string; // Mailgun stores attachments temporarily
}

export interface ParsedInboundEmail {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  strippedText: string; // Body without quoted reply
  messageId: string;
  inReplyTo: string;
  references: string;
  attachmentCount: number;
  attachments: EmailAttachment[];
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Suppression list helpers — check before sending to avoid bounces/complaints
// ---------------------------------------------------------------------------
export async function isEmailSuppressed(email: string): Promise<boolean> {
  try {
    const { sql } = await import("@/lib/db");
    const rows = await sql`
      SELECT type FROM email_suppressions WHERE email = ${email.toLowerCase()} LIMIT 1
    `;
    return rows.length > 0;
  } catch {
    return false; // Table may not exist — don't block sending
  }
}

export async function getSuppressionList(
  type?: "bounce" | "complaint" | "unsubscribe",
  limit = 100
): Promise<Array<{ email: string; reason: string; type: string; created_at: string }>> {
  try {
    const { sql } = await import("@/lib/db");
    if (type) {
      const rows = await sql`
        SELECT * FROM email_suppressions
        WHERE type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return rows as Array<{ email: string; reason: string; type: string; created_at: string }>;
    }
    const rows = await sql`
      SELECT * FROM email_suppressions
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows as Array<{ email: string; reason: string; type: string; created_at: string }>;
  } catch {
    return [];
  }
}

export async function removeFromSuppressionList(email: string): Promise<boolean> {
  try {
    const { sql } = await import("@/lib/db");
    await sql`DELETE FROM email_suppressions WHERE email = ${email.toLowerCase()}`;
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Parse inbound email from Mailgun webhook POST
// ---------------------------------------------------------------------------
export function parseInboundEmail(
  formData: Record<string, string>
): ParsedInboundEmail {
  const fromRaw = formData["from"] || "";
  // Extract name and email from "Name <email@domain>" format
  const nameMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
  const fromName = nameMatch ? nameMatch[1].trim().replace(/^"|"$/g, "") : "";
  const fromEmail = nameMatch ? nameMatch[2] : fromRaw;

  // Parse attachment metadata from Mailgun's JSON content-id-map or attachment fields
  const attachmentCount = parseInt(formData["attachment-count"] || "0", 10);
  const attachments: EmailAttachment[] = [];

  // Mailgun sends attachment info as JSON in "content-id-map" or individual attachment-N fields
  try {
    const contentIdMap = formData["content-id-map"];
    if (contentIdMap) {
      const map = JSON.parse(contentIdMap);
      for (const [, attachment] of Object.entries(map)) {
        const att = attachment as { filename?: string; "content-type"?: string; size?: number; url?: string };
        attachments.push({
          filename: att.filename || "unknown",
          contentType: att["content-type"] || "application/octet-stream",
          size: att.size || 0,
          url: att.url,
        });
      }
    }
  } catch {
    // Attachment parsing failed — store count only
  }

  // Also try individual attachment-N metadata
  for (let i = 1; i <= attachmentCount; i++) {
    const attJson = formData[`attachment-${i}`];
    if (attJson && !attachments.some((a) => a.filename === attJson)) {
      try {
        const att = JSON.parse(attJson);
        attachments.push({
          filename: att.filename || att.name || `attachment-${i}`,
          contentType: att["content-type"] || att.type || "application/octet-stream",
          size: att.size || 0,
          url: att.url,
        });
      } catch {
        // Individual attachment field wasn't JSON — it might be the file itself
      }
    }
  }

  return {
    from: fromEmail,
    fromName: fromName || fromEmail.split("@")[0],
    to: formData["recipient"] || formData["To"] || "",
    subject: formData["subject"] || "(No Subject)",
    bodyText: formData["body-plain"] || "",
    bodyHtml: formData["body-html"] || "",
    strippedText: formData["stripped-text"] || formData["body-plain"] || "",
    messageId: formData["Message-Id"] || "",
    inReplyTo: formData["In-Reply-To"] || "",
    references: formData["References"] || "",
    attachmentCount,
    attachments,
    timestamp: parseInt(formData["timestamp"] || String(Math.floor(Date.now() / 1000)), 10),
  };
}
