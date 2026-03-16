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

  const form = new URLSearchParams();
  form.append("from", opts.from);

  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to];
  for (const r of recipients) {
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
  const apiKey = MAILGUN_API_KEY();
  if (!apiKey) return true; // Skip verification in dev

  const hmac = crypto.createHmac("sha256", apiKey);
  hmac.update(timestamp + token);
  const expected = hmac.digest("hex");
  return signature === expected;
}

// ---------------------------------------------------------------------------
// Parse inbound email from Mailgun webhook POST
// ---------------------------------------------------------------------------
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
  timestamp: number;
}

export function parseInboundEmail(
  formData: Record<string, string>
): ParsedInboundEmail {
  const fromRaw = formData["from"] || "";
  // Extract name and email from "Name <email@domain>" format
  const nameMatch = fromRaw.match(/^(.+?)\s*<(.+?)>$/);
  const fromName = nameMatch ? nameMatch[1].trim().replace(/^"|"$/g, "") : "";
  const fromEmail = nameMatch ? nameMatch[2] : fromRaw;

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
    attachmentCount: parseInt(formData["attachment-count"] || "0", 10),
    timestamp: parseInt(formData["timestamp"] || String(Math.floor(Date.now() / 1000)), 10),
  };
}
