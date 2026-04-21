/**
 * Audit Middleware — wraps any async action with automatic audit logging.
 *
 * Usage:
 *   const result = await withAudit({
 *     action: "login",
 *     actor: user.email,
 *     resourceType: "auth",
 *   }, async () => {
 *     return await doLogin(email, password);
 *   });
 *
 * On success: logs action + result summary.
 * On failure: logs action + error message, then re-throws.
 * Audit logging itself never throws — failures are swallowed (Law: audit must not break main flow).
 */

import { logEvent, type LogEventInput } from "./audit-log";

export interface AuditOptions {
  /** The action name, e.g. "login", "stripe.checkout", "deploy.publish" */
  action: string;
  /** Who performed the action — typically an email address or "system" */
  actor: string;
  /** Resource type for categorization: "auth", "billing", "deploy", "admin" */
  resourceType: string;
  /** Optional resource identifier (site ID, subscription ID, etc.) */
  resourceId?: string;
  /** Owner ID — defaults to actor if not provided */
  ownerId?: string;
  /** IP address of the request */
  ip?: string;
  /** User-Agent header */
  userAgent?: string;
  /** Extra metadata merged into the audit event */
  metadata?: Record<string, unknown>;
}

/**
 * Wrap any async function with automatic audit logging.
 * Logs success on completion, logs failure on error and re-throws.
 */
export async function withAudit<T>(
  opts: AuditOptions,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  try {
    const result = await fn();
    // Fire-and-forget: audit logging must never slow down the main flow
    safeLog({
      ownerId: opts.ownerId || opts.actor,
      actorId: opts.actor,
      actorEmail: opts.actor,
      action: opts.action,
      resourceType: opts.resourceType,
      resourceId: opts.resourceId,
      ip: opts.ip,
      userAgent: opts.userAgent,
      metadata: {
        ...opts.metadata,
        result: "success",
        durationMs: Date.now() - started,
      },
    });
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    safeLog({
      ownerId: opts.ownerId || opts.actor,
      actorId: opts.actor,
      actorEmail: opts.actor,
      action: opts.action,
      resourceType: opts.resourceType,
      resourceId: opts.resourceId,
      ip: opts.ip,
      userAgent: opts.userAgent,
      metadata: {
        ...opts.metadata,
        result: "failure",
        error: message,
        durationMs: Date.now() - started,
      },
    });
    throw error;
  }
}

/**
 * Log an audit event without wrapping a function.
 * Useful for fire-and-forget logging in existing code.
 */
export function auditLog(opts: AuditOptions & { result: "success" | "failure"; detail?: string }): void {
  safeLog({
    ownerId: opts.ownerId || opts.actor,
    actorId: opts.actor,
    actorEmail: opts.actor,
    action: opts.action,
    resourceType: opts.resourceType,
    resourceId: opts.resourceId,
    ip: opts.ip,
    userAgent: opts.userAgent,
    metadata: {
      ...opts.metadata,
      result: opts.result,
      detail: opts.detail,
    },
  });
}

/** Fire-and-forget wrapper — audit logging must NEVER throw or block. */
function safeLog(input: LogEventInput): void {
  logEvent(input).catch((err) => {
    console.warn("[audit-middleware] Failed to write audit log:", err instanceof Error ? err.message : err);
  });
}
