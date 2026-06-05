/**
 * Revenue Monitor Agent
 *
 * Tracks revenue health and alerts on anomalies:
 * - Daily/weekly revenue summaries
 * - Alerts if revenue drops >20% vs previous period
 * - Tracks failed payments and expiring subscriptions
 * - Identifies free-tier users hitting limits (upgrade opportunities)
 *
 * Runs every 6 hours.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RevenueCheckInput {
  checkType: "daily-summary" | "drop-detection" | "failed-payments" | "upgrade-opportunities";
}

interface RevenueCheckOutput {
  metric: string;
  value: number;
  trend: "up" | "down" | "flat";
  alertTriggered: boolean;
  details: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "revenue-monitor",
  name: "Revenue Monitor",
  description: "Tracks revenue health, detects anomalies, identifies upgrade opportunities. Runs every 6 hours.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.7,
  scheduleIntervalSec: 21600, // 6 hours
  maxConcurrency: 4,
  maxRetries: 2,
  retryBaseDelayMs: 3000,
  taskTimeoutMs: 45_000, // 45s per check
  settings: {},
  tags: ["revenue", "monitoring", "business", "alerts"],
};

/** Alert if revenue drops more than this percentage vs previous period */
const REVENUE_DROP_THRESHOLD = 0.20;

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class RevenueMonitorAgent extends BaseAgent<RevenueCheckInput, RevenueCheckOutput> {
  protected async discoverTasks(): Promise<RevenueCheckInput[]> {
    return [
      { checkType: "daily-summary" },
      { checkType: "drop-detection" },
      { checkType: "failed-payments" },
      { checkType: "upgrade-opportunities" },
    ];
  }

  protected async execute(
    input: RevenueCheckInput,
    _context: TaskContext
  ): Promise<{ output: RevenueCheckOutput; confidence: number; findings: AgentFinding[] }> {
    switch (input.checkType) {
      case "daily-summary":
        return this.dailySummary();
      case "drop-detection":
        return this.dropDetection();
      case "failed-payments":
        return this.failedPayments();
      case "upgrade-opportunities":
        return this.upgradeOpportunities();
      default:
        return {
          output: { metric: "unknown", value: 0, trend: "flat", alertTriggered: false, details: "Unknown check" },
          confidence: 1,
          findings: [],
        };
    }
  }

  // ── Daily Revenue Summary ──

  private async dailySummary(): Promise<{
    output: RevenueCheckOutput; confidence: number; findings: AgentFinding[];
  }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Revenue today (from usage_tracking or stripe_events if available)
      const todayResult = await sql`
        SELECT
          COALESCE(SUM(amount), 0) as total_revenue,
          COUNT(*) as transaction_count
        FROM payments
        WHERE created_at >= CURRENT_DATE
          AND status = 'succeeded'
      `;

      const yesterdayResult = await sql`
        SELECT COALESCE(SUM(amount), 0) as total_revenue
        FROM payments
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
          AND created_at < CURRENT_DATE
          AND status = 'succeeded'
      `;

      const todayRevenue = Number(todayResult[0]?.total_revenue || 0);
      const yesterdayRevenue = Number(yesterdayResult[0]?.total_revenue || 0);
      const transactions = Number(todayResult[0]?.transaction_count || 0);
      const trend = todayRevenue > yesterdayRevenue ? "up" : todayRevenue < yesterdayRevenue ? "down" : "flat";

      findings.push({
        severity: "info",
        category: "revenue:summary",
        title: `Daily revenue: $${(todayRevenue / 100).toFixed(2)}`,
        description: `${transactions} transactions today. Yesterday: $${(yesterdayRevenue / 100).toFixed(2)}. Trend: ${trend}.`,
        autoFixed: false,
        metadata: { todayRevenue, yesterdayRevenue, transactions, trend },
      });

      return {
        output: {
          metric: "daily_revenue",
          value: todayRevenue,
          trend,
          alertTriggered: false,
          details: `Today: $${(todayRevenue / 100).toFixed(2)} (${transactions} txns). Yesterday: $${(yesterdayRevenue / 100).toFixed(2)}.`,
        },
        confidence: 0.95,
        findings,
      };
    } catch {
      // Try alternative: count active subscriptions as revenue proxy
      try {
        const { sql } = await import("@/lib/db");
        const subs = await sql`
          SELECT plan, COUNT(*) as count FROM users
          WHERE plan IS NOT NULL AND plan != 'free'
          GROUP BY plan
        `;

        const planPrices: Record<string, number> = { creator: 1900, pro: 4900, agency: 9900 };
        let estimatedMRR = 0;
        const breakdown: string[] = [];

        for (const row of subs) {
          const plan = row.plan as string;
          const count = Number(row.count);
          const price = planPrices[plan] || 0;
          estimatedMRR += price * count;
          breakdown.push(`${plan}: ${count} users`);
        }

        findings.push({
          severity: "info",
          category: "revenue:summary",
          title: `Estimated MRR: $${(estimatedMRR / 100).toFixed(2)}`,
          description: `Based on active subscriptions: ${breakdown.join(", ") || "No paid users yet"}`,
          autoFixed: false,
        });

        return {
          output: {
            metric: "estimated_mrr",
            value: estimatedMRR,
            trend: "flat",
            alertTriggered: false,
            details: `Estimated MRR: $${(estimatedMRR / 100).toFixed(2)}. ${breakdown.join(", ")}`,
          },
          confidence: 0.7,
          findings,
        };
      } catch {
        return {
          output: { metric: "daily_revenue", value: 0, trend: "flat", alertTriggered: false, details: "No revenue data available (payments table not found)" },
          confidence: 0.5,
          findings: [{ severity: "info", category: "revenue:summary", title: "No revenue data", description: "Payments table not found. Revenue monitoring will activate once payment data is available.", autoFixed: false }],
        };
      }
    }
  }

  // ── Revenue Drop Detection ──

  private async dropDetection(): Promise<{
    output: RevenueCheckOutput; confidence: number; findings: AgentFinding[];
  }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // This week vs last week
      const thisWeek = await sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
          AND status = 'succeeded'
      `;

      const lastWeek = await sql`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 week'
          AND created_at < DATE_TRUNC('week', CURRENT_DATE)
          AND status = 'succeeded'
      `;

      const thisWeekRev = Number(thisWeek[0]?.total || 0);
      const lastWeekRev = Number(lastWeek[0]?.total || 0);

      if (lastWeekRev > 0) {
        const changePercent = (thisWeekRev - lastWeekRev) / lastWeekRev;
        const dropped = changePercent < -REVENUE_DROP_THRESHOLD;

        if (dropped) {
          findings.push({
            severity: "critical",
            category: "revenue:drop",
            title: `Revenue dropped ${Math.abs(Math.round(changePercent * 100))}% week-over-week`,
            description: `This week: $${(thisWeekRev / 100).toFixed(2)} vs last week: $${(lastWeekRev / 100).toFixed(2)}. Threshold: ${REVENUE_DROP_THRESHOLD * 100}%.`,
            autoFixed: false,
            metadata: { thisWeekRev, lastWeekRev, changePercent },
          });

          await this.sendAlert(
            `Revenue Drop: ${Math.abs(Math.round(changePercent * 100))}% week-over-week`,
            `<h2>Revenue Drop Alert</h2>
            <p><strong>This week:</strong> $${(thisWeekRev / 100).toFixed(2)}</p>
            <p><strong>Last week:</strong> $${(lastWeekRev / 100).toFixed(2)}</p>
            <p><strong>Change:</strong> ${Math.round(changePercent * 100)}%</p>
            <p>Investigate potential causes: churn, failed payments, promotional period ending, or seasonal dip.</p>`
          );
        }

        return {
          output: {
            metric: "weekly_revenue_change",
            value: changePercent,
            trend: changePercent > 0 ? "up" : changePercent < 0 ? "down" : "flat",
            alertTriggered: dropped,
            details: `WoW change: ${Math.round(changePercent * 100)}%. This week: $${(thisWeekRev / 100).toFixed(2)}, Last week: $${(lastWeekRev / 100).toFixed(2)}.`,
          },
          confidence: 0.9,
          findings,
        };
      }
    } catch {
      // No payments table
    }

    return {
      output: { metric: "weekly_revenue_change", value: 0, trend: "flat", alertTriggered: false, details: "Insufficient data for drop detection" },
      confidence: 0.5,
      findings,
    };
  }

  // ── Failed Payments ──

  private async failedPayments(): Promise<{
    output: RevenueCheckOutput; confidence: number; findings: AgentFinding[];
  }> {
    const findings: AgentFinding[] = [];
    let failedCount = 0;

    try {
      const { sql } = await import("@/lib/db");

      const failed = await sql`
        SELECT user_email, amount, error_message, created_at
        FROM payments
        WHERE status = 'failed'
          AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 50
      `;

      failedCount = failed.length;

      if (failedCount > 0) {
        const totalLost = failed.reduce((sum: any, r: any) => sum + Number(r.amount || 0), 0);

        findings.push({
          severity: failedCount > 10 ? "critical" : "warning",
          category: "revenue:failed-payments",
          title: `${failedCount} failed payments in last 24h`,
          description: `Total potential revenue lost: $${(totalLost / 100).toFixed(2)}. Most common error: ${(failed[0]?.error_message as string) || "Unknown"}.`,
          autoFixed: false,
          metadata: { failedCount, totalLost, recentEmails: failed.slice(0, 5).map((r: any) => r.user_email) },
        });

        if (failedCount > 10) {
          await this.sendAlert(
            `${failedCount} Failed Payments in 24h — $${(totalLost / 100).toFixed(2)} at risk`,
            `<h2>Failed Payment Spike</h2>
            <p><strong>Failed payments:</strong> ${failedCount} in the last 24 hours</p>
            <p><strong>Revenue at risk:</strong> $${(totalLost / 100).toFixed(2)}</p>
            <p>Check Stripe dashboard for payment processor issues or expired cards.</p>`
          );
        }

        return {
          output: {
            metric: "failed_payments_24h",
            value: failedCount,
            trend: "down",
            alertTriggered: failedCount > 10,
            details: `${failedCount} failed payments. $${(totalLost / 100).toFixed(2)} at risk.`,
          },
          confidence: 0.9,
          findings,
        };
      }
    } catch {
      // No payments table
    }

    return {
      output: { metric: "failed_payments_24h", value: failedCount, trend: "flat", alertTriggered: false, details: "No failed payments detected" },
      confidence: 0.8,
      findings,
    };
  }

  // ── Upgrade Opportunities ──

  private async upgradeOpportunities(): Promise<{
    output: RevenueCheckOutput; confidence: number; findings: AgentFinding[];
  }> {
    const findings: AgentFinding[] = [];
    let opportunities = 0;

    try {
      const { sql } = await import("@/lib/db");

      // Free users who are very active (potential upgrade targets)
      const activeFreeTier = await sql`
        SELECT ut.user_email, COUNT(*) as gen_count,
               MAX(ut.created_at) as last_active
        FROM usage_tracking ut
        LEFT JOIN users u ON u.email = ut.user_email
        WHERE ut.created_at >= NOW() - INTERVAL '7 days'
          AND ut.action = 'generate'
          AND (u.plan IS NULL OR u.plan = 'free')
        GROUP BY ut.user_email
        HAVING COUNT(*) >= 5
        ORDER BY gen_count DESC
        LIMIT 50
      `;

      opportunities = activeFreeTier.length;

      if (opportunities > 0) {
        const topUsers = activeFreeTier.slice(0, 10).map(
          (r: any) => `${r.user_email} (${r.gen_count} builds)`
        );

        findings.push({
          severity: "info",
          category: "revenue:upgrade-opportunities",
          title: `${opportunities} free users likely to upgrade`,
          description: `Active free-tier users with 5+ builds this week: ${topUsers.join(", ")}`,
          autoFixed: false,
          metadata: { count: opportunities, topUsers: activeFreeTier.slice(0, 10).map((r: any) => ({ email: r.user_email, builds: r.gen_count })) },
        });

        // Send weekly digest if there are significant opportunities
        if (opportunities >= 10) {
          await this.sendAlert(
            `${opportunities} Upgrade Opportunities Identified`,
            `<h2>Upgrade Opportunity Report</h2>
            <p><strong>${opportunities}</strong> free-tier users with 5+ builds this week.</p>
            <p><strong>Top candidates:</strong></p>
            <ul>${topUsers.map((u: any) => `<li>${u}</li>`).join("")}</ul>
            <p>Consider sending targeted upgrade emails or offering trial upgrades to these users.</p>`
          );
        }
      }
    } catch {
      // DB unavailable
    }

    return {
      output: {
        metric: "upgrade_opportunities",
        value: opportunities,
        trend: "flat",
        alertTriggered: opportunities >= 10,
        details: `${opportunities} active free-tier users identified as upgrade candidates.`,
      },
      confidence: 0.85,
      findings,
    };
  }

  // ── Helpers ──

  private async sendAlert(subject: string, html: string): Promise<void> {
    try {
      const { notifyAdmin } = await import("@/lib/admin-notify");
      await notifyAdmin({ subject: `[Revenue Agent] ${subject}`, html });
    } catch {
      console.warn(`[RevenueMonitor] Could not send alert: ${subject}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new RevenueMonitorAgent(CONFIG, store));

export { RevenueMonitorAgent, CONFIG as REVENUE_MONITOR_CONFIG };
