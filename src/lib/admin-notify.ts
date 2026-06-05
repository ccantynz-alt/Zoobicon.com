/**
 * Admin Notification Service — Rule 31 (2026-05-17).
 *
 * Routes through Crontech's own email service (services/email-send,
 * BLK-030) via src/lib/email-send.ts. Set EMAIL_SEND_TOKEN in Vercel
 * to enable live delivery; falls back to console log when unset.
 *
 * Recipient: ADMIN_NOTIFY_EMAIL env var (defaults to admin@zoobicon.com).
 */

import { sendEmail } from "@/lib/email-send";

const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "admin@zoobicon.com";

interface NotifyOptions {
  subject: string;
  html: string;
  text?: string;
  category?: string;
  priority?: "low" | "normal" | "high" | "critical";
}

interface NotifyResult {
  ok: boolean;
  reason?: string;
  messageId?: string;
}

async function deliver(opts: NotifyOptions): Promise<NotifyResult> {
  const result = await sendEmail({
    to: ADMIN_EMAIL,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    messageId: opts.category
      ? `admin-notify-${opts.category}-${Date.now()}`
      : undefined,
  });
  if (result.ok) return { ok: true, messageId: result.id };
  return { ok: false, reason: result.error };
}

export async function notifyAdmin(opts: NotifyOptions): Promise<NotifyResult> {
  return deliver(opts);
}

export async function notifyAgentFailure(
  agentName: string,
  error: string,
  context?: Record<string, unknown>,
): Promise<NotifyResult> {
  return deliver({
    subject: `Agent failed: ${agentName}`,
    html: `<p>Agent <strong>${agentName}</strong> failed: ${error}</p><pre>${JSON.stringify(context, null, 2)}</pre>`,
    category: "agent-failure",
    priority: "high",
  });
}

export async function notifySecurityEvent(
  event: string,
  details: Record<string, unknown>,
): Promise<NotifyResult> {
  return deliver({
    subject: `Security event: ${event}`,
    html: `<p>${event}</p><pre>${JSON.stringify(details, null, 2)}</pre>`,
    category: "security",
    priority: "critical",
  });
}

export async function notifyDailySummary(summary: string): Promise<NotifyResult> {
  return deliver({
    subject: "Zoobicon daily summary",
    html: summary,
    category: "daily-summary",
    priority: "low",
  });
}

export async function notifyDeployFailure(
  buildId: string,
  reason: string,
): Promise<NotifyResult> {
  return deliver({
    subject: `Deploy failed: ${buildId}`,
    html: `<p>Build ${buildId} failed to deploy: ${reason}</p>`,
    category: "deploy-failure",
    priority: "high",
  });
}
