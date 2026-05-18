/**
 * Audit middleware — STUBBED 2026-05-17.
 *
 * Rule 31 — audit logs delegated to Crontech platform-wide audit log.
 * This file is kept as a NO-OP stub so callers (Stripe webhook + the
 * auth routes still pending deletion in §1) continue to compile. Once
 * the auth routes are deleted, only Stripe webhook will still call
 * auditLog — which is fine; Stripe-related audit can flow through
 * Crontech once we wire its audit ingest endpoint.
 */

import type { NextRequest } from "next/server";

export type AuditAction =
  | "auth.login" | "auth.signup" | "auth.logout"
  | "auth.password.change" | "auth.password.reset.request"
  | "auth.password.reset.complete"
  | "stripe.checkout" | "stripe.subscription.created"
  | "stripe.subscription.updated" | "stripe.subscription.cancelled"
  | "domain.purchase" | "domain.transfer"
  | "admin.user.modify" | "admin.user.delete"
  | string;

interface AuditEntry {
  action: AuditAction;
  actorId?: string;
  actorEmail?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  req?: NextRequest;
}

export async function auditLog(_entry: AuditEntry): Promise<void> {
  // No-op. When Crontech audit ingest is wired, replace with
  // `await fetch("https://api.crontech.ai/api/v1/audit", { ... })`
  // — until then, audit events are dropped silently.
}

export async function getAuditFeed(_filter?: { actorId?: string; action?: AuditAction; limit?: number }): Promise<AuditEntry[]> {
  return [];
}
