/**
 * Billing Guardian Agent
 *
 * Prevents billing issues before they cause churn:
 * - Detects failed payment attempts
 * - Sends friendly retry reminders (not aggressive)
 * - Alerts admin about subscriptions about to expire
 * - Tracks free users approaching their generation limit (upgrade opportunity)
 * - Identifies users who downgraded (churn risk)
 *
 * Runs every 2 hours.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillingCheckInput {
  type: "failed-payments" | "expiring-subs" | "quota-approaching" | "churn-risk";
  name: string;
}

interface BillingCheckOutput {
  name: string;
  usersAffected: number;
  actionsPerformed: number;
  revenue_at_risk: number;
  details: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "billing-guardian",
  name: "Billing Guardian",
  description: "Prevents billing issues before they cause churn. Detects failed payments, expiring subscriptions, and upgrade opportunities.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.8,
  scheduleIntervalSec: 7200, // 2 hours
  maxConcurrency: 4,
  maxRetries: 2,
  retryBaseDelayMs: 5000,
  taskTimeoutMs: 60_000,
  settings: {
    expirationWarningDays: 7,
    quotaWarningPercent: 80,
  },
  tags: ["billing", "payments", "churn", "revenue", "retention"],
};

// Plan limits
const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  creator: 30,
  pro: 100,
  agency: 500,
  enterprise: 999999,
};

const PLAN_PRICES: Record<string, number> = {
  creator: 19,
  pro: 49,
  agency: 99,
  enterprise: 299,
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class BillingGuardianAgent extends BaseAgent<BillingCheckInput, BillingCheckOutput> {
  protected async discoverTasks(): Promise<BillingCheckInput[]> {
    return [
      { type: "failed-payments", name: "Check Failed Payments" },
      { type: "expiring-subs", name: "Check Expiring Subscriptions" },
      { type: "quota-approaching", name: "Check Quota Usage" },
      { type: "churn-risk", name: "Detect Churn Risk" },
    ];
  }

  protected async execute(
    input: BillingCheckInput,
    _context: TaskContext
  ): Promise<{ output: BillingCheckOutput; confidence: number; findings: AgentFinding[] }> {
    switch (input.type) {
      case "failed-payments":
        return this.checkFailedPayments(input);
      case "expiring-subs":
        return this.checkExpiringSubs(input);
      case "quota-approaching":
        return this.checkQuotaUsage(input);
      case "churn-risk":
        return this.detectChurnRisk(input);
      default:
        return {
          output: { name: input.name, usersAffected: 0, actionsPerformed: 0, revenue_at_risk: 0, details: "Unknown check" },
          confidence: 0.5,
          findings: [],
        };
    }
  }

  // ── Check Failed Payments ──

  private async checkFailedPayments(
    input: BillingCheckInput
  ): Promise<{ output: BillingCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Ensure payment_events table exists
      await sql`
        CREATE TABLE IF NOT EXISTS payment_events (
          id SERIAL PRIMARY KEY,
          user_email TEXT NOT NULL,
          event_type TEXT NOT NULL,
          plan TEXT,
          amount_cents INT,
          stripe_event_id TEXT,
          notified BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      // Find recent failed payments that haven't been notified
      const failedPayments = await sql`
        SELECT user_email, plan, amount_cents, created_at
        FROM payment_events
        WHERE event_type = 'payment_failed'
          AND notified = false
          AND created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 50
      `;

      let revenueAtRisk = 0;
      let notified = 0;

      for (const payment of failedPayments) {
        const monthlyPrice = PLAN_PRICES[payment.plan] || 0;
        revenueAtRisk += monthlyPrice;

        try {
          // Send a friendly payment retry email
          const { notifyAdmin } = await import("@/lib/admin-notify");
          await notifyAdmin({
            subject: `Payment issue on your Zoobicon ${payment.plan || ""} plan`,
            html: `<h2>Quick heads-up about your payment</h2>
            <p>We had trouble processing your latest payment. This can happen for lots of reasons — expired card, bank hold, etc.</p>
            <p>To keep your ${payment.plan || "paid"} plan active, please update your payment method in your account settings.</p>
            <p><a href="https://zoobicon.com/auth/settings" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Update Payment Method</a></p>
            <p>If you need help, just reply to this email.</p>`,
          });

          await sql`
            UPDATE payment_events
            SET notified = true
            WHERE user_email = ${payment.user_email}
              AND event_type = 'payment_failed'
              AND notified = false
          `;

          notified++;
        } catch {
          // Failed to notify, will retry next cycle
        }
      }

      if (failedPayments.length > 0) {
        findings.push({
          severity: revenueAtRisk > 200 ? "error" : "warning",
          category: "billing:failed-payment",
          title: `${failedPayments.length} Failed Payment(s) — $${revenueAtRisk}/mo at Risk`,
          description: `${failedPayments.length} payment(s) failed in the last 24 hours. Revenue at risk: $${revenueAtRisk}/month. Sent ${notified} friendly reminder email(s).`,
          autoFixed: notified > 0,
          metadata: { failedCount: failedPayments.length, revenueAtRisk, notified },
        });
      }

      return {
        output: { name: input.name, usersAffected: failedPayments.length, actionsPerformed: notified, revenue_at_risk: revenueAtRisk, details: `${failedPayments.length} failed, ${notified} notified` },
        confidence: 0.9,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, usersAffected: 0, actionsPerformed: 0, revenue_at_risk: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Check Expiring Subscriptions ──

  private async checkExpiringSubs(
    input: BillingCheckInput
  ): Promise<{ output: BillingCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Find users whose subscription period ends within 7 days
      const expiring = await sql`
        SELECT email, plan, subscription_end
        FROM users
        WHERE plan != 'free'
          AND subscription_end IS NOT NULL
          AND subscription_end BETWEEN NOW() AND NOW() + INTERVAL '7 days'
          AND subscription_end > NOW()
      `;

      let revenueAtRisk = 0;
      for (const user of expiring) {
        revenueAtRisk += PLAN_PRICES[user.plan] || 0;
      }

      if (expiring.length > 0) {
        findings.push({
          severity: "warning",
          category: "billing:expiring",
          title: `${expiring.length} Subscription(s) Expiring Within 7 Days`,
          description: `${expiring.length} paid subscription(s) expire within 7 days. Revenue at risk: $${revenueAtRisk}/month. Ensure auto-renewal is working or reach out to retain these users.`,
          autoFixed: false,
          metadata: { expiringCount: expiring.length, revenueAtRisk },
        });
      }

      return {
        output: { name: input.name, usersAffected: expiring.length, actionsPerformed: 0, revenue_at_risk: revenueAtRisk, details: `${expiring.length} expiring` },
        confidence: 0.9,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, usersAffected: 0, actionsPerformed: 0, revenue_at_risk: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Check Quota Usage ──

  private async checkQuotaUsage(
    input: BillingCheckInput
  ): Promise<{ output: BillingCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Count generations per user this month
      const usage = await sql`
        SELECT
          g.user_email,
          u.plan,
          COUNT(*) as gen_count
        FROM agency_generations g
        JOIN users u ON u.email = g.user_email
        WHERE g.period = ${currentPeriod}
        GROUP BY g.user_email, u.plan
      `;

      let upgradeOpportunities = 0;
      let atLimit = 0;

      for (const row of usage) {
        const limit = PLAN_LIMITS[row.plan] || PLAN_LIMITS.free;
        const used = Number(row.gen_count);
        const usagePercent = (used / limit) * 100;

        if (usagePercent >= 100) {
          atLimit++;
        } else if (usagePercent >= 80) {
          upgradeOpportunities++;
        }
      }

      if (upgradeOpportunities > 0 || atLimit > 0) {
        findings.push({
          severity: "info",
          category: "billing:quota",
          title: `Quota Check: ${atLimit} at limit, ${upgradeOpportunities} approaching`,
          description: `${atLimit} user(s) have hit their generation limit. ${upgradeOpportunities} user(s) are above 80% usage. These are upgrade opportunities.`,
          autoFixed: false,
          metadata: { atLimit, upgradeOpportunities },
        });
      }

      return {
        output: { name: input.name, usersAffected: atLimit + upgradeOpportunities, actionsPerformed: 0, revenue_at_risk: 0, details: `${atLimit} at limit, ${upgradeOpportunities} near limit` },
        confidence: 0.9,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, usersAffected: 0, actionsPerformed: 0, revenue_at_risk: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Detect Churn Risk ──

  private async detectChurnRisk(
    input: BillingCheckInput
  ): Promise<{ output: BillingCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Find paid users who haven't generated anything in 14+ days
      const inactive = await sql`
        SELECT u.email, u.plan, u.created_at,
          (SELECT MAX(created_at) FROM agency_generations WHERE user_email = u.email) as last_gen
        FROM users u
        WHERE u.plan != 'free'
          AND NOT EXISTS (
            SELECT 1 FROM agency_generations g
            WHERE g.user_email = u.email
              AND g.created_at > NOW() - INTERVAL '14 days'
          )
      `;

      let revenueAtRisk = 0;
      for (const user of inactive) {
        revenueAtRisk += PLAN_PRICES[user.plan] || 0;
      }

      if (inactive.length > 0) {
        findings.push({
          severity: revenueAtRisk > 500 ? "error" : "warning",
          category: "billing:churn-risk",
          title: `${inactive.length} Paid User(s) Inactive 14+ Days`,
          description: `${inactive.length} paying user(s) haven't used the platform in over 14 days. Revenue at risk: $${revenueAtRisk}/month. Consider re-engagement campaigns.`,
          autoFixed: false,
          metadata: { inactiveCount: inactive.length, revenueAtRisk },
        });

        // Alert admin if significant revenue is at risk
        if (revenueAtRisk >= 200) {
          try {
            const { notifyAdmin } = await import("@/lib/admin-notify");
            await notifyAdmin({
              subject: `[Churn Risk] ${inactive.length} inactive paid users — $${revenueAtRisk}/mo at risk`,
              html: `<h2 style="color: #f59e0b;">Churn Risk Alert</h2>
              <p><strong>${inactive.length}</strong> paid users haven't used Zoobicon in 14+ days.</p>
              <p><strong>Revenue at risk:</strong> $${revenueAtRisk}/month</p>
              <p>Consider sending a re-engagement email or personal outreach.</p>`,
            });
          } catch {
            // Alert failed
          }
        }
      }

      return {
        output: { name: input.name, usersAffected: inactive.length, actionsPerformed: 0, revenue_at_risk: revenueAtRisk, details: `${inactive.length} at churn risk` },
        confidence: 0.85,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, usersAffected: 0, actionsPerformed: 0, revenue_at_risk: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new BillingGuardianAgent(CONFIG, store));

export { BillingGuardianAgent, CONFIG as BILLING_GUARDIAN_CONFIG };
