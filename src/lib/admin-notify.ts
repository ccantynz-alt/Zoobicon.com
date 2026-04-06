/**
 * Admin Notification Service
 *
 * Sends email notifications to the admin (ADMIN_NOTIFICATION_EMAIL or ADMIN_EMAIL)
 * via Mailgun. Falls back to console logging if MAILGUN_API_KEY is not set.
 */

import { sendViaMailgun } from "@/lib/mailgun";

function getAdminEmail(): string {
  return (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "admin@zoobicon.com"
  );
}

function getFromAddress(): string {
  const domain = process.env.MAILGUN_DOMAIN || "zoobicon.com";
  return `Zoobicon <noreply@${domain}>`;
}

interface NotifyOptions {
  subject: string;
  html: string;
  /** Plain text fallback */
  text?: string;
}

/**
 * Send a notification email to the admin.
 * Returns true if sent successfully, false otherwise.
 */
export async function notifyAdmin(opts: NotifyOptions): Promise<boolean> {
  const adminEmail = getAdminEmail();
  const apiKey = process.env.MAILGUN_API_KEY;

  if (!apiKey) {
    console.log(`[Admin Notify] No MAILGUN_API_KEY — logging instead:`);
    console.log(`  To: ${adminEmail}`);
    console.log(`  Subject: ${opts.subject}`);
    console.log(`  Body: ${opts.text || "(HTML only)"}`);
    return false;
  }

  try {
    const result = await sendViaMailgun({
      from: getFromAddress(),
      to: adminEmail,
      subject: opts.subject,
      html: opts.html,
      ...(opts.text ? { text: opts.text } : {}),
      tags: ["admin-notification"],
      tracking: true,
      trackingOpens: true,
    });

    if (!result.success) {
      console.error(`[Admin Notify] Mailgun error:`, result.error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Admin Notify] Failed to send:", err);
    return false;
  }
}

// ── Styled email wrapper ──────────────────────────────────────

function wrap(title: string, body: string): string {
  return `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#09090f;color:#fff;border-radius:16px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
    <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#1d4ed8);display:flex;align-items:center;justify-content:center">
      <span style="color:#fff;font-size:18px;font-weight:900">Z</span>
    </div>
    <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px">Zoobicon</span>
  </div>
  <h1 style="font-size:22px;font-weight:800;margin:0 0 16px">${title}</h1>
  ${body}
  <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0 12px"/>
  <p style="color:rgba(255,255,255,0.25);font-size:11px;margin:0;line-height:1.5">
    This is an automated notification from your Zoobicon platform.
  </p>
</div>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="color:rgba(255,255,255,0.5);padding:6px 12px 6px 0;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;word-break:break-all">${value}</td></tr>`;
}

function table(rows: string): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.5">${rows}</table>`;
}

// ── Pre-built notification types ──────────────────────────────

/** Notify admin when someone submits a contact form */
export async function notifyContactForm(data: {
  name?: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  company?: string;
  source?: string;
}): Promise<boolean> {
  const rows = [
    row("From", data.name || "Anonymous"),
    row("Email", data.email),
    ...(data.company ? [row("Company", data.company)] : []),
    ...(data.phone ? [row("Phone", data.phone)] : []),
    ...(data.subject ? [row("Subject", data.subject)] : []),
    ...(data.source ? [row("Source", data.source)] : []),
    row("Message", `<div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;margin-top:4px">${escapeHtml(data.message)}</div>`),
  ];

  const subject = data.source
    ? `[Zoobicon] ${data.source}: ${data.name || data.email}`
    : `[Zoobicon] Contact form: ${data.name || data.email}`;

  return notifyAdmin({
    subject,
    html: wrap("New Contact Form Submission", table(rows.join(""))),
    text: `New contact form from ${data.name || "Anonymous"} (${data.email}): ${data.message}`,
  });
}

/** Notify admin when a new user signs up */
export async function notifyNewSignup(data: {
  email: string;
  name?: string;
}): Promise<boolean> {
  const rows = [
    row("Email", data.email),
    ...(data.name ? [row("Name", data.name)] : []),
    row("Time", new Date().toUTCString()),
  ];

  return notifyAdmin({
    subject: `[Zoobicon] New signup: ${data.email}`,
    html: wrap("New User Signup", table(rows.join(""))),
    text: `New user signed up: ${data.email}${data.name ? ` (${data.name})` : ""}`,
  });
}

/** Notify admin when a site is deployed */
export async function notifySiteDeployed(data: {
  siteName: string;
  slug: string;
  email?: string;
}): Promise<boolean> {
  const url = `https://${data.slug}.zoobicon.sh`;
  const rows = [
    row("Site", data.siteName),
    row("URL", `<a href="${url}" style="color:#2563eb">${url}</a>`),
    ...(data.email ? [row("User", data.email)] : []),
    row("Time", new Date().toUTCString()),
  ];

  return notifyAdmin({
    subject: `[Zoobicon] Site deployed: ${data.siteName}`,
    html: wrap("New Site Deployed", table(rows.join(""))),
    text: `Site deployed: ${data.siteName} at ${url}`,
  });
}

/** Notify admin of a waitlist signup */
export async function notifyWaitlist(data: {
  email: string;
  product: string;
}): Promise<boolean> {
  const rows = [
    row("Email", data.email),
    row("Product", data.product),
    row("Time", new Date().toUTCString()),
  ];

  return notifyAdmin({
    subject: `[Zoobicon] Waitlist: ${data.product} — ${data.email}`,
    html: wrap("New Waitlist Signup", table(rows.join(""))),
    text: `Waitlist signup for ${data.product}: ${data.email}`,
  });
}

/** Notify admin when a new support ticket arrives */
export async function notifyNewTicket(data: {
  ticketNumber: string;
  subject: string;
  from: string;
  fromName?: string;
  preview: string;
}): Promise<boolean> {
  const trimmedPreview =
    data.preview.length > 300
      ? data.preview.slice(0, 300) + "…"
      : data.preview;

  const rows = [
    row("Ticket", `<strong>${data.ticketNumber}</strong>`),
    row("From", data.fromName ? `${escapeHtml(data.fromName)} (${escapeHtml(data.from)})` : escapeHtml(data.from)),
    row("Subject", escapeHtml(data.subject)),
    row(
      "Preview",
      `<div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;margin-top:4px">${escapeHtml(trimmedPreview)}</div>`
    ),
  ];

  return notifyAdmin({
    subject: `[Support] ${data.ticketNumber}: ${data.subject}`,
    html: wrap("New Support Ticket", table(rows.join(""))),
    text: `New support ticket ${data.ticketNumber} from ${data.fromName || data.from}: ${data.subject}\n\n${trimmedPreview}`,
  });
}

/** Notify admin when a ticket is escalated (AI can't resolve or urgent) */
export async function notifyTicketEscalation(data: {
  ticketNumber: string;
  ticketId: string;
  subject: string;
  from: string;
  fromName?: string;
  reason: string;
  priority: string;
  category: string;
  confidence: number;
  aiDraft?: string;
}): Promise<boolean> {
  const priorityColors: Record<string, string> = {
    urgent: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
  };
  const color = priorityColors[data.priority] || "#eab308";

  const rows = [
    row("Ticket", `<strong>${data.ticketNumber}</strong>`),
    row("From", data.fromName ? `${escapeHtml(data.fromName)} (${escapeHtml(data.from)})` : escapeHtml(data.from)),
    row("Subject", escapeHtml(data.subject)),
    row(
      "Priority",
      `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:700;text-transform:uppercase">${data.priority}</span>`
    ),
    row("Category", data.category),
    row("AI Confidence", `${Math.round(data.confidence * 100)}%`),
    row(
      "Escalation Reason",
      `<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);padding:10px;border-radius:8px;color:#fca5a5;margin-top:4px">${escapeHtml(data.reason)}</div>`
    ),
  ];

  if (data.aiDraft) {
    const trimmedDraft =
      data.aiDraft.length > 400
        ? data.aiDraft.slice(0, 400) + "…"
        : data.aiDraft;
    rows.push(
      row(
        "AI Draft",
        `<div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:8px;margin-top:4px;font-style:italic">${escapeHtml(trimmedDraft)}</div>`
      )
    );
  }

  const dashboardUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";

  rows.push(
    row(
      "Action",
      `<a href="${dashboardUrl}/email-support" style="display:inline-block;background:#2563eb;color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:4px">Review in Dashboard →</a>`
    )
  );

  return notifyAdmin({
    subject: `🚨 [ESCALATION] ${data.ticketNumber}: ${data.subject} (${data.priority})`,
    html: wrap("⚠️ Ticket Escalated — Human Attention Required", table(rows.join(""))),
    text: `ESCALATED: ${data.ticketNumber} — ${data.subject}\nFrom: ${data.fromName || data.from}\nPriority: ${data.priority}\nReason: ${data.reason}\nConfidence: ${Math.round(data.confidence * 100)}%\n\nReview at: ${dashboardUrl}/email-support`,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
