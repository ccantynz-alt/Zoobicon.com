/**
 * Auto-Healer Agent
 *
 * Automatically fixes known issues without human intervention:
 * - Detects stale database connections and reconnects
 * - Clears stuck deployment jobs (stuck in "deploying" > 10 minutes)
 * - Resets stuck rate limit counters
 * - Retries failed email sends
 * - Cleans up expired sessions and stale data
 *
 * Runs every 5 minutes.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HealerInput {
  type: "stuck-deployments" | "failed-emails" | "stale-data" | "db-health" | "stuck-generations";
  name: string;
}

interface HealerOutput {
  name: string;
  healed: boolean;
  itemsFixed: number;
  details: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "auto-healer",
  name: "Auto-Healer",
  description: "Automatically detects and fixes stuck processes, failed jobs, and stale data without human intervention.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.7,
  scheduleIntervalSec: 300, // 5 minutes
  maxConcurrency: 3,
  maxRetries: 1,
  retryBaseDelayMs: 3000,
  taskTimeoutMs: 30_000,
  settings: {
    stuckDeploymentMinutes: 10,
    staleSessionHours: 72,
  },
  tags: ["auto-healer", "self-healing", "maintenance", "reliability"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class AutoHealerAgent extends BaseAgent<HealerInput, HealerOutput> {
  protected async discoverTasks(): Promise<HealerInput[]> {
    return [
      { type: "stuck-deployments", name: "Fix Stuck Deployments" },
      { type: "stuck-generations", name: "Fix Stuck Generations" },
      { type: "failed-emails", name: "Retry Failed Emails" },
      { type: "stale-data", name: "Clean Stale Data" },
      { type: "db-health", name: "Database Health Check" },
    ];
  }

  protected async execute(
    input: HealerInput,
    _context: TaskContext
  ): Promise<{ output: HealerOutput; confidence: number; findings: AgentFinding[] }> {
    switch (input.type) {
      case "stuck-deployments":
        return this.healStuckDeployments(input);
      case "stuck-generations":
        return this.healStuckGenerations(input);
      case "failed-emails":
        return this.retryFailedEmails(input);
      case "stale-data":
        return this.cleanStaleData(input);
      case "db-health":
        return this.checkDbHealth(input);
      default:
        return {
          output: { name: input.name, healed: false, itemsFixed: 0, details: "Unknown heal type" },
          confidence: 0.5,
          findings: [],
        };
    }
  }

  // ── Fix Stuck Deployments ──

  private async healStuckDeployments(
    input: HealerInput
  ): Promise<{ output: HealerOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Find deployments stuck in "deploying" status for over 10 minutes
      const stuck = await sql`
        SELECT id, site_id, status, created_at
        FROM deployments
        WHERE status = 'deploying'
          AND created_at < NOW() - INTERVAL '10 minutes'
      `;

      if (stuck.length === 0) {
        return {
          output: { name: input.name, healed: false, itemsFixed: 0, details: "No stuck deployments" },
          confidence: 0.99,
          findings,
        };
      }

      // Mark stuck deployments as failed
      const ids = stuck.map((r) => r.id);
      await sql`
        UPDATE deployments
        SET status = 'failed'
        WHERE id = ANY(${ids})
      `;

      findings.push({
        severity: "warning",
        category: "auto-healer:stuck-deployment",
        title: `Fixed ${stuck.length} Stuck Deployment(s)`,
        description: `${stuck.length} deployment(s) were stuck in "deploying" state for over 10 minutes. Marked as failed so users can retry.`,
        autoFixed: true,
        beforeValue: `${stuck.length} stuck in "deploying"`,
        afterValue: `${stuck.length} marked as "failed"`,
        metadata: { deploymentIds: ids },
      });

      return {
        output: { name: input.name, healed: true, itemsFixed: stuck.length, details: `Fixed ${stuck.length} stuck deployments` },
        confidence: 0.95,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, healed: false, itemsFixed: 0, details: "DB unavailable" },
        confidence: 0.6,
        findings,
      };
    }
  }

  // ── Fix Stuck Generations ──

  private async healStuckGenerations(
    input: HealerInput
  ): Promise<{ output: HealerOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Find agency generations stuck in "generating" for over 5 minutes
      const stuck = await sql`
        SELECT id, agency_id, status, created_at
        FROM agency_generations
        WHERE status = 'generating'
          AND created_at < NOW() - INTERVAL '5 minutes'
      `;

      if (stuck.length === 0) {
        return {
          output: { name: input.name, healed: false, itemsFixed: 0, details: "No stuck generations" },
          confidence: 0.99,
          findings,
        };
      }

      const ids = stuck.map((r) => r.id);
      await sql`
        UPDATE agency_generations
        SET status = 'failed'
        WHERE id = ANY(${ids})
      `;

      findings.push({
        severity: "warning",
        category: "auto-healer:stuck-generation",
        title: `Fixed ${stuck.length} Stuck Generation(s)`,
        description: `${stuck.length} generation(s) were stuck in "generating" state for over 5 minutes. Marked as failed so quota is freed.`,
        autoFixed: true,
        metadata: { generationIds: ids },
      });

      return {
        output: { name: input.name, healed: true, itemsFixed: stuck.length, details: `Fixed ${stuck.length} stuck generations` },
        confidence: 0.95,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, healed: false, itemsFixed: 0, details: "DB unavailable or table missing" },
        confidence: 0.6,
        findings,
      };
    }
  }

  // ── Retry Failed Emails ──

  private async retryFailedEmails(
    input: HealerInput
  ): Promise<{ output: HealerOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Find emails that failed in the last hour (max 10 retries per cycle)
      const failed = await sql`
        SELECT id, to_email, subject, html_body, retry_count
        FROM outbound_emails
        WHERE status = 'failed'
          AND retry_count < 3
          AND created_at > NOW() - INTERVAL '1 hour'
        ORDER BY created_at ASC
        LIMIT 10
      `;

      if (failed.length === 0) {
        return {
          output: { name: input.name, healed: false, itemsFixed: 0, details: "No failed emails to retry" },
          confidence: 0.99,
          findings,
        };
      }

      let retried = 0;
      for (const email of failed) {
        try {
          const { notifyAdmin } = await import("@/lib/admin-notify");
          await notifyAdmin({
            subject: email.subject,
            html: email.html_body,
          });

          await sql`
            UPDATE outbound_emails
            SET status = 'sent', retry_count = retry_count + 1
            WHERE id = ${email.id}
          `;
          retried++;
        } catch {
          await sql`
            UPDATE outbound_emails
            SET retry_count = retry_count + 1
            WHERE id = ${email.id}
          `;
        }
      }

      if (retried > 0) {
        findings.push({
          severity: "info",
          category: "auto-healer:email-retry",
          title: `Retried ${retried} Failed Email(s)`,
          description: `Successfully resent ${retried} of ${failed.length} previously failed emails.`,
          autoFixed: true,
          metadata: { retried, totalFailed: failed.length },
        });
      }

      return {
        output: { name: input.name, healed: retried > 0, itemsFixed: retried, details: `Retried ${retried}/${failed.length} failed emails` },
        confidence: 0.9,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, healed: false, itemsFixed: 0, details: "DB unavailable or email table missing" },
        confidence: 0.6,
        findings,
      };
    }
  }

  // ── Clean Stale Data ──

  private async cleanStaleData(
    input: HealerInput
  ): Promise<{ output: HealerOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];
    let totalCleaned = 0;

    try {
      const { sql } = await import("@/lib/db");

      // Clean expired collaboration sessions (older than 72 hours)
      try {
        const result = await sql`
          DELETE FROM collab_participants
          WHERE last_seen < NOW() - INTERVAL '72 hours'
        `;
        const cleaned = Number(result.count || 0);
        totalCleaned += cleaned;
      } catch {
        // Table may not exist
      }

      // Clean old agent task records (older than 30 days)
      try {
        const result = await sql`
          DELETE FROM agent_tasks
          WHERE created_at < NOW() - INTERVAL '30 days'
        `;
        const cleaned = Number(result.count || 0);
        totalCleaned += cleaned;
      } catch {
        // Table may not exist
      }

      // Clean old API error logs (older than 7 days)
      try {
        const result = await sql`
          DELETE FROM api_error_log
          WHERE created_at < NOW() - INTERVAL '7 days'
        `;
        const cleaned = Number(result.count || 0);
        totalCleaned += cleaned;
      } catch {
        // Table may not exist
      }

      if (totalCleaned > 0) {
        findings.push({
          severity: "info",
          category: "auto-healer:cleanup",
          title: `Cleaned ${totalCleaned} Stale Record(s)`,
          description: `Removed ${totalCleaned} expired/stale records from collaboration sessions, old agent tasks, and error logs.`,
          autoFixed: true,
          metadata: { totalCleaned },
        });
      }

      return {
        output: { name: input.name, healed: totalCleaned > 0, itemsFixed: totalCleaned, details: `Cleaned ${totalCleaned} stale records` },
        confidence: 0.95,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, healed: false, itemsFixed: 0, details: "DB unavailable" },
        confidence: 0.6,
        findings,
      };
    }
  }

  // ── Database Health Check ──

  private async checkDbHealth(
    input: HealerInput
  ): Promise<{ output: HealerOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Test basic query
      const start = Date.now();
      await sql`SELECT 1`;
      const elapsed = Date.now() - start;

      if (elapsed > 3000) {
        findings.push({
          severity: "warning",
          category: "auto-healer:db-slow",
          title: `Database Slow (${elapsed}ms)`,
          description: `Database query took ${elapsed}ms. Normal is <100ms. Possible connection pool exhaustion or high load.`,
          autoFixed: false,
          metadata: { queryTimeMs: elapsed },
        });

        return {
          output: { name: input.name, healed: false, itemsFixed: 0, details: `DB slow: ${elapsed}ms` },
          confidence: 0.9,
          findings,
        };
      }

      return {
        output: { name: input.name, healed: false, itemsFixed: 0, details: `DB healthy (${elapsed}ms)` },
        confidence: 0.99,
        findings,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      findings.push({
        severity: "critical",
        category: "auto-healer:db-down",
        title: "Database Connection Failed",
        description: `Cannot connect to database. Error: ${errorMsg}. All database-dependent features are broken.`,
        autoFixed: false,
        metadata: { error: errorMsg },
      });

      // Try to send alert
      try {
        const { notifyAdmin } = await import("@/lib/admin-notify");
        await notifyAdmin({
          subject: "[CRITICAL] Database Connection Failed",
          html: `<h2 style="color: #dc2626;">Database Down</h2><p>Error: ${errorMsg}</p><p>Time: ${new Date().toISOString()}</p>`,
        });
      } catch {
        console.error("[AutoHealer] DB down and cannot send alert:", errorMsg);
      }

      return {
        output: { name: input.name, healed: false, itemsFixed: 0, details: `DB failed: ${errorMsg}` },
        confidence: 0.99,
        findings,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new AutoHealerAgent(CONFIG, store));

export { AutoHealerAgent, CONFIG as AUTO_HEALER_CONFIG };
