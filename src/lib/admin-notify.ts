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
  return "Zoobicon <noreply@zoobicon.com>";
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

  const result = await sendViaMailgun({
    from: getFromAddress(),
    to: adminEmail,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    tags: ["admin-notification"],
  });

  return result.success;
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
