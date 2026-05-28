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

const CRONTECH_PAT = process.env.CRONTECH_PAT || "";
const CRONTECH_API_BASE = process.env.CRONTECH_API_BASE || "https://api.crontech.ai";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || "admin@zoobicon.com";

async function deliveryStub(opts: NotifyOptions): Promise<NotifyResult> {
  // When Crontech BLK-030 is available, route via their Mailgun-shape endpoint.
  if (CRONTECH_PAT) {
    try {
      const res = await fetch(`${CRONTECH_API_BASE}/api/v1/email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CRONTECH_PAT}`,
          "Content-Type": "application/json",
          "X-Crontech-Source": "zoobicon-admin-notify",
        },
        body: JSON.stringify({
          to: ADMIN_EMAIL,
          subject: opts.subject,
          html: opts.html,
          text: opts.text || opts.subject,
          tags: [opts.category || "general"],
          priority: opts.priority || "normal",
        }),
        signal: AbortSignal.timeout(8_000),
      });
      if (res.ok) {
        const d = (await res.json()) as { messageId?: string };
        return { ok: true, messageId: d.messageId };
      }
      const err = await res.text().catch(() => "");
      console.warn(`[admin-notify] Crontech BLK-030 ${res.status}: ${err.slice(0, 120)}`);
    } catch (e) {
      console.warn("[admin-notify] Crontech BLK-030 unreachable:", e instanceof Error ? e.message : e);
    }
  }

  console.log(
    `[admin-notify:stubbed] subject="${opts.subject.slice(0, 80)}" ` +
    `category=${opts.category || "general"} priority=${opts.priority || "normal"} ` +
    `(CRONTECH_PAT unset — set it to enable live delivery)`,
  );
  return { ok: false, reason: "CRONTECH_PAT not set — email not delivered" };
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
