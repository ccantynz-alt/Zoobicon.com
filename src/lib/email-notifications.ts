/**
 * Email Notification Bridge
 *
 * Server-side in-memory event emitter that bridges Mailgun webhook events
 * to SSE (Server-Sent Events) connections held by admin browsers.
 *
 * Flow: Mailgun webhook → emitEmailNotification() → SSE stream → browser sound + toast
 *
 * NOTE: In-memory means notifications are per-process. On Vercel serverless,
 * each invocation is isolated, so we also write to DB for persistence.
 * The SSE polling fallback (every 5s) catches anything missed.
 */

export interface EmailNotificationEvent {
  id: string;
  type: "admin_email" | "support_ticket" | "support_reply";
  from: string;
  fromName: string;
  subject: string;
  preview: string;
  ticketNumber?: string;
  timestamp: number;
}

type Listener = (event: EmailNotificationEvent) => void;

// In-memory listener registry (SSE connections register here)
const listeners = new Set<Listener>();

// Recent events buffer (for SSE reconnection — last 50 events, 5 min TTL)
const recentEvents: EmailNotificationEvent[] = [];
const MAX_RECENT = 50;
const EVENT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function pruneRecent() {
  const cutoff = Date.now() - EVENT_TTL_MS;
  while (recentEvents.length > 0 && recentEvents[0].timestamp < cutoff) {
    recentEvents.shift();
  }
  while (recentEvents.length > MAX_RECENT) {
    recentEvents.shift();
  }
}

/**
 * Emit a new email notification to all connected SSE clients.
 * Called from webhook route when an email arrives.
 */
export function emitEmailNotification(event: EmailNotificationEvent): void {
  pruneRecent();
  recentEvents.push(event);

  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Remove broken listeners
      listeners.delete(listener);
    }
  }
}

/**
 * Register an SSE listener. Returns an unsubscribe function.
 */
export function subscribeToEmailNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get recent events since a given timestamp (for SSE reconnection / polling fallback).
 */
export function getRecentEmailNotifications(sinceTimestamp?: number): EmailNotificationEvent[] {
  pruneRecent();
  if (!sinceTimestamp) return [...recentEvents];
  return recentEvents.filter((e) => e.timestamp > sinceTimestamp);
}
