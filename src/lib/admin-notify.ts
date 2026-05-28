/**
 * Admin Notification Service — STUBBED 2026-05-17.
 *
 * Rule 31 — email delegated to Crontech BLK-030. Caller should route
 * admin notifications through the Crontech email endpoint at
 * https://api.crontech.ai/api/v1/email (Mailgun-shape compatible) once
 * the integration is wired.
 *
 * This module previously sent rich HTML notifications via Mailgun for
 * agent failures, daily summaries, security alerts, etc. All callers
 * are preserved with their original signatures so the codebase compiles;
 * the underlying delivery is now a no-op that logs to console.
 */

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

async function deliveryStub(opts: NotifyOptions): Promise<NotifyResult> {
  console.log(
    `[admin-notify:stubbed] subject="${opts.subject.slice(0, 80)}" ` +
    `category=${opts.category || "general"} priority=${opts.priority || "normal"} ` +
    `(Crontech built-in mail not yet wired — set CRONTECH_PAT + confirm email endpoint)`,
  );
  return { ok: false, reason: "Crontech mail endpoint not yet confirmed" };
}

export async function notifyAdmin(opts: NotifyOptions): Promise<NotifyResult> {
  return deliveryStub(opts);
}

export async function notifyAgentFailure(
  agentName: string,
  error: string,
  context?: Record<string, unknown>,
): Promise<NotifyResult> {
  return deliveryStub({
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
  return deliveryStub({
    subject: `Security event: ${event}`,
    html: `<p>${event}</p><pre>${JSON.stringify(details, null, 2)}</pre>`,
    category: "security",
    priority: "critical",
  });
}

export async function notifyDailySummary(summary: string): Promise<NotifyResult> {
  return deliveryStub({
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
  return deliveryStub({
    subject: `Deploy failed: ${buildId}`,
    html: `<p>Build ${buildId} failed to deploy: ${reason}</p>`,
    category: "deploy-failure",
    priority: "high",
  });
}
