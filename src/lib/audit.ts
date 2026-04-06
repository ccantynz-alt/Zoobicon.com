import { sql } from "@/lib/db";

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "signup"
  | "password_change"
  | "password_reset"
  | "api_key_generated"
  | "api_key_revoked"
  | "site_created"
  | "site_updated"
  | "site_deleted"
  | "data_export"
  | "account_deleted"
  | "consent_updated"
  | "admin_access";

export interface AuditEntry {
  action: AuditAction;
  email: string;
  ip?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit log insert.
 * Never throws — audit failures must not break the main flow.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await sql`
      INSERT INTO audit_log (action, email, ip, metadata, created_at)
      VALUES (
        ${entry.action},
        ${entry.email},
        ${entry.ip || null},
        ${JSON.stringify(entry.metadata || {})}::jsonb,
        NOW()
      )
    `;
  } catch {
    // Silently fail — audit logging must never break the main flow
  }
}

/**
 * Ensure the audit_log table exists. Safe to call multiple times.
 */
export async function ensureAuditTable(): Promise<void> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action TEXT NOT NULL,
        email TEXT NOT NULL,
        ip TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_email ON audit_log(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at)`;
  } catch {
    // Table might already exist — safe to ignore
  }
}
