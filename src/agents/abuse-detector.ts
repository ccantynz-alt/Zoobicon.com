/**
 * Abuse Detector Agent
 *
 * Autonomous agent that detects and blocks platform abuse patterns:
 * - Excessive signups from same IP (bot/spam accounts)
 * - Free-tier users evading rate limits via multiple accounts
 * - Content policy violations in generation prompts
 * - Excessive API calls from a single IP
 *
 * Runs every 10 minutes. Auto-suspends accounts that exceed thresholds
 * and sends admin alerts for review.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AbuseCheckInput {
  checkType: "signup-spam" | "rate-evasion" | "content-policy" | "api-abuse";
}

interface AbuseCheckOutput {
  flaggedAccounts: number;
  suspendedAccounts: number;
  alertsSent: number;
  details: string;
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/** Max signups from the same IP within 1 hour before auto-suspend */
const SIGNUP_IP_THRESHOLD = 5;
/** Max generations from the same email within 1 hour (free tier) */
const FREE_GEN_THRESHOLD = 20;
/** Max API calls from same IP within 10 minutes */
const API_CALL_THRESHOLD = 200;
/** Harmful content keywords (generation prompts) */
const CONTENT_POLICY_KEYWORDS = [
  "how to hack", "exploit vulnerability", "steal credit card",
  "make a bomb", "synthesize drugs", "child", "illegal",
  "phishing page", "fake login", "scam website",
];

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "abuse-detector",
  name: "Abuse Detector",
  description: "Detects and blocks platform abuse: spam signups, rate limit evasion, content policy violations, API abuse. Runs every 10 minutes.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.8,
  scheduleIntervalSec: 600, // 10 minutes
  maxConcurrency: 4,
  maxRetries: 1,
  retryBaseDelayMs: 2000,
  taskTimeoutMs: 30_000, // 30s per check
  settings: {},
  tags: ["security", "abuse", "monitoring", "automated"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class AbuseDetectorAgent extends BaseAgent<AbuseCheckInput, AbuseCheckOutput> {
  protected async discoverTasks(): Promise<AbuseCheckInput[]> {
    // Run all four check types every cycle
    return [
      { checkType: "signup-spam" },
      { checkType: "rate-evasion" },
      { checkType: "content-policy" },
      { checkType: "api-abuse" },
    ];
  }

  protected async execute(
    input: AbuseCheckInput,
    _context: TaskContext
  ): Promise<{ output: AbuseCheckOutput; confidence: number; findings: AgentFinding[] }> {
    switch (input.checkType) {
      case "signup-spam":
        return this.checkSignupSpam();
      case "rate-evasion":
        return this.checkRateEvasion();
      case "content-policy":
        return this.checkContentPolicy();
      case "api-abuse":
        return this.checkApiAbuse();
      default:
        return {
          output: { flaggedAccounts: 0, suspendedAccounts: 0, alertsSent: 0, details: "Unknown check type" },
          confidence: 1,
          findings: [],
        };
    }
  }

  // ── Check: Signup Spam ──

  private async checkSignupSpam(): Promise<{
    output: AbuseCheckOutput; confidence: number; findings: AgentFinding[];
  }> {
    const findings: AgentFinding[] = [];
    let flagged = 0;
    let suspended = 0;
    let alerts = 0;

    try {
      const { sql } = await import("@/lib/db");

      // Find IPs with too many signups in the last hour
      const suspiciousIPs = await sql`
        SELECT ip_address, COUNT(*) as signup_count,
               array_agg(email) as emails
        FROM users
        WHERE created_at > NOW() - INTERVAL '1 hour'
          AND ip_address IS NOT NULL
        GROUP BY ip_address
        HAVING COUNT(*) >= ${SIGNUP_IP_THRESHOLD}
        ORDER BY signup_count DESC
        LIMIT 20
      `;

      for (const row of suspiciousIPs) {
        flagged += row.signup_count as number;
        const ip = row.ip_address as string;
        const count = row.signup_count as number;
        const emails = row.emails as string[];

        findings.push({
          severity: "critical",
          category: "abuse:signup-spam",
          title: `Spam signup burst from IP ${ip}`,
          description: `${count} accounts created from ${ip} in the last hour. Emails: ${emails.slice(0, 5).join(", ")}${emails.length > 5 ? "..." : ""}`,
          autoFixed: true,
          metadata: { ip, count, emails },
        });

        // Auto-suspend accounts from this IP (keep the first one)
        try {
          const result = await sql`
            UPDATE users SET status = 'suspended',
              suspended_reason = 'Automated: spam signup detected from IP ' || ${ip}
            WHERE ip_address = ${ip}
              AND created_at > NOW() - INTERVAL '1 hour'
              AND id NOT IN (
                SELECT id FROM users WHERE ip_address = ${ip} ORDER BY created_at ASC LIMIT 1
              )
              AND (status IS NULL OR status != 'suspended')
          `;
          suspended += result.count || 0;
        } catch {
          // Table might not have status/suspended_reason columns yet
        }

        // Send admin alert
        await this.sendAlert(
          `Spam Signup Alert: ${count} accounts from ${ip}`,
          `<h2>Spam Signup Detected</h2>
          <p><strong>IP:</strong> ${ip}</p>
          <p><strong>Signups in last hour:</strong> ${count}</p>
          <p><strong>Emails:</strong></p>
          <ul>${emails.map(e => `<li>${e}</li>`).join("")}</ul>
          <p><strong>Action taken:</strong> ${suspended > 0 ? `${suspended} accounts auto-suspended` : "Flagged for review"}</p>`
        );
        alerts++;
      }
    } catch {
      // DB unavailable or table missing — not an error, just nothing to check
    }

    return {
      output: { flaggedAccounts: flagged, suspendedAccounts: suspended, alertsSent: alerts, details: `Checked signup patterns. ${flagged} flagged, ${suspended} suspended.` },
      confidence: 0.95,
      findings,
    };
  }

  // ── Check: Rate Evasion ──

  private async checkRateEvasion(): Promise<{
    output: AbuseCheckOutput; confidence: number; findings: AgentFinding[];
  }> {
    const findings: AgentFinding[] = [];
    let flagged = 0;
    let alerts = 0;

    try {
      const { sql } = await import("@/lib/db");

      // Find free-tier users with excessive generations in the last hour
      const heavyUsers = await sql`
        SELECT ut.user_email, COUNT(*) as gen_count, u.plan
        FROM usage_tracking ut
        LEFT JOIN users u ON u.email = ut.user_email
        WHERE ut.created_at > NOW() - INTERVAL '1 hour'
          AND ut.action = 'generate'
          AND (u.plan IS NULL OR u.plan = 'free')
        GROUP BY ut.user_email, u.plan
        HAVING COUNT(*) >= ${FREE_GEN_THRESHOLD}
        ORDER BY gen_count DESC
        LIMIT 20
      `;

      for (const row of heavyUsers) {
        flagged++;
        const email = row.user_email as string;
        const count = row.gen_count as number;

        findings.push({
          severity: "warning",
          category: "abuse:rate-evasion",
          title: `Free-tier user exceeded generation limit`,
          description: `${email} generated ${count} sites in the last hour (threshold: ${FREE_GEN_THRESHOLD}). Possible rate limit evasion.`,
          autoFixed: false,
          metadata: { email, count },
        });

        if (count > FREE_GEN_THRESHOLD * 2) {
          await this.sendAlert(
            `Rate Evasion Alert: ${email} — ${count} generations/hour`,
            `<h2>Excessive Free-Tier Usage</h2>
            <p><strong>User:</strong> ${email}</p>
            <p><strong>Generations in last hour:</strong> ${count}</p>
            <p><strong>Threshold:</strong> ${FREE_GEN_THRESHOLD}</p>
            <p>This user may be evading rate limits. Consider suspending or contacting them.</p>`
          );
          alerts++;
        }
      }
    } catch {
      // DB unavailable or tables missing
    }

    return {
      output: { flaggedAccounts: flagged, suspendedAccounts: 0, alertsSent: alerts, details: `Checked rate evasion. ${flagged} free-tier users above threshold.` },
      confidence: 0.9,
      findings,
    };
  }

  // ── Check: Content Policy ──

  private async checkContentPolicy(): Promise<{
    output: AbuseCheckOutput; confidence: number; findings: AgentFinding[];
  }> {
    const findings: AgentFinding[] = [];
    let flagged = 0;
    let alerts = 0;

    try {
      const { sql } = await import("@/lib/db");

      // Check recent generation prompts for policy violations
      const recentPrompts = await sql`
        SELECT id, user_email, prompt, created_at
        FROM usage_tracking
        WHERE created_at > NOW() - INTERVAL '10 minutes'
          AND action = 'generate'
          AND prompt IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 100
      `;

      for (const row of recentPrompts) {
        const prompt = ((row.prompt as string) || "").toLowerCase();
        const violations = CONTENT_POLICY_KEYWORDS.filter(kw => prompt.includes(kw));

        if (violations.length > 0) {
          flagged++;
          const email = row.user_email as string;

          findings.push({
            severity: "critical",
            category: "abuse:content-policy",
            title: `Content policy violation by ${email}`,
            description: `Prompt contained prohibited keywords: ${violations.join(", ")}`,
            autoFixed: false,
            metadata: { email, promptId: row.id, violations },
          });

          await this.sendAlert(
            `Content Policy Violation: ${email}`,
            `<h2>Content Policy Violation Detected</h2>
            <p><strong>User:</strong> ${email}</p>
            <p><strong>Keywords found:</strong> ${violations.join(", ")}</p>
            <p><strong>Time:</strong> ${new Date(row.created_at as string).toISOString()}</p>
            <p>Review this user's account and recent activity.</p>`
          );
          alerts++;
        }
      }
    } catch {
      // DB unavailable or tables missing
    }

    return {
      output: { flaggedAccounts: flagged, suspendedAccounts: 0, alertsSent: alerts, details: `Scanned ${flagged > 0 ? "found" : "no"} content policy violations.` },
      confidence: 0.85,
      findings,
    };
  }

  // ── Check: API Abuse ──

  private async checkApiAbuse(): Promise<{
    output: AbuseCheckOutput; confidence: number; findings: AgentFinding[];
  }> {
    const findings: AgentFinding[] = [];
    let flagged = 0;
    let alerts = 0;

    try {
      const { sql } = await import("@/lib/db");

      // Check for IPs with excessive API calls in last 10 minutes
      const heavyIPs = await sql`
        SELECT ip_address, COUNT(*) as call_count,
               array_agg(DISTINCT endpoint) as endpoints
        FROM api_requests
        WHERE created_at > NOW() - INTERVAL '10 minutes'
          AND ip_address IS NOT NULL
        GROUP BY ip_address
        HAVING COUNT(*) >= ${API_CALL_THRESHOLD}
        ORDER BY call_count DESC
        LIMIT 10
      `;

      for (const row of heavyIPs) {
        flagged++;
        const ip = row.ip_address as string;
        const count = row.call_count as number;
        const endpoints = row.endpoints as string[];

        findings.push({
          severity: "warning",
          category: "abuse:api-abuse",
          title: `High API volume from IP ${ip}`,
          description: `${count} API calls in 10 minutes (threshold: ${API_CALL_THRESHOLD}). Endpoints: ${endpoints.slice(0, 5).join(", ")}`,
          autoFixed: false,
          metadata: { ip, count, endpoints },
        });

        if (count > API_CALL_THRESHOLD * 3) {
          await this.sendAlert(
            `API Abuse Alert: ${count} calls from ${ip} in 10 minutes`,
            `<h2>API Abuse Detected</h2>
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>Calls in 10 minutes:</strong> ${count}</p>
            <p><strong>Endpoints hit:</strong> ${endpoints.join(", ")}</p>
            <p>Consider adding this IP to the block list.</p>`
          );
          alerts++;
        }
      }
    } catch {
      // DB unavailable or tables missing — not an error
    }

    return {
      output: { flaggedAccounts: flagged, suspendedAccounts: 0, alertsSent: alerts, details: `Checked API abuse patterns. ${flagged} IPs flagged.` },
      confidence: 0.9,
      findings,
    };
  }

  // ── Helpers ──

  private async sendAlert(subject: string, html: string): Promise<void> {
    try {
      const { notifyAdmin } = await import("@/lib/admin-notify");
      await notifyAdmin({ subject: `[Abuse Agent] ${subject}`, html });
    } catch {
      console.warn(`[AbuseDetector] Could not send alert: ${subject}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new AbuseDetectorAgent(CONFIG, store));

export { AbuseDetectorAgent, CONFIG as ABUSE_DETECTOR_CONFIG };
