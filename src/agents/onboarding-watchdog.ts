/**
 * Onboarding Watchdog Agent
 *
 * Ensures new users have a great first experience:
 * - Tracks users who signed up but haven't built their first site
 * - Sends reminder emails after 24h, 48h, 72h
 * - Tracks users who started building but hit errors
 * - Alerts admin about users stuck in onboarding
 * - Identifies common drop-off points
 *
 * Runs every 1 hour.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingCheckInput {
  type: "inactive-signups" | "stuck-builders" | "drop-off-analysis";
  name: string;
}

interface OnboardingCheckOutput {
  name: string;
  usersFound: number;
  actionsPerformed: number;
  details: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "onboarding-watchdog",
  name: "Onboarding Watchdog",
  description: "Monitors new user onboarding, sends reminder emails, and alerts on users stuck in the signup-to-first-build funnel.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.8,
  scheduleIntervalSec: 3600, // 1 hour
  maxConcurrency: 3,
  maxRetries: 2,
  retryBaseDelayMs: 5000,
  taskTimeoutMs: 60_000,
  settings: {
    reminderHours: [24, 48, 72],
    maxReminders: 3,
  },
  tags: ["onboarding", "retention", "engagement", "email"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class OnboardingWatchdogAgent extends BaseAgent<OnboardingCheckInput, OnboardingCheckOutput> {
  protected async discoverTasks(): Promise<OnboardingCheckInput[]> {
    return [
      { type: "inactive-signups", name: "Check Inactive New Signups" },
      { type: "stuck-builders", name: "Check Stuck Builders" },
      { type: "drop-off-analysis", name: "Drop-Off Analysis" },
    ];
  }

  protected async execute(
    input: OnboardingCheckInput,
    _context: TaskContext
  ): Promise<{ output: OnboardingCheckOutput; confidence: number; findings: AgentFinding[] }> {
    switch (input.type) {
      case "inactive-signups":
        return this.checkInactiveSignups(input);
      case "stuck-builders":
        return this.checkStuckBuilders(input);
      case "drop-off-analysis":
        return this.analyzeDropOff(input);
      default:
        return {
          output: { name: input.name, usersFound: 0, actionsPerformed: 0, details: "Unknown check" },
          confidence: 0.5,
          findings: [],
        };
    }
  }

  // ── Check Inactive Signups ──

  private async checkInactiveSignups(
    input: OnboardingCheckInput
  ): Promise<{ output: OnboardingCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Ensure onboarding tracking table exists
      await sql`
        CREATE TABLE IF NOT EXISTS onboarding_reminders (
          id SERIAL PRIMARY KEY,
          user_email TEXT NOT NULL,
          reminder_number INT NOT NULL DEFAULT 1,
          sent_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_email, reminder_number)
        )
      `;

      // Find users who signed up but have no deployments
      // Check each reminder tier: 24h, 48h, 72h
      const reminderHours = [24, 48, 72];
      let totalActions = 0;
      let totalFound = 0;

      for (let i = 0; i < reminderHours.length; i++) {
        const hours = reminderHours[i];
        const reminderNum = i + 1;

        // Users who signed up X+ hours ago, have no sites, and haven't received this reminder
        const inactiveUsers = await sql`
          SELECT u.email, u.name, u.created_at
          FROM users u
          WHERE u.created_at < NOW() - INTERVAL '1 hour' * ${hours}
            AND u.created_at > NOW() - INTERVAL '1 hour' * ${hours + 24}
            AND NOT EXISTS (
              SELECT 1 FROM sites s WHERE s.email = u.email
            )
            AND NOT EXISTS (
              SELECT 1 FROM onboarding_reminders r
              WHERE r.user_email = u.email AND r.reminder_number = ${reminderNum}
            )
          LIMIT 50
        `;

        totalFound += inactiveUsers.length;

        for (const user of inactiveUsers) {
          try {
            await this.sendOnboardingReminder(user.email, user.name, reminderNum);

            await sql`
              INSERT INTO onboarding_reminders (user_email, reminder_number)
              VALUES (${user.email}, ${reminderNum})
              ON CONFLICT (user_email, reminder_number) DO NOTHING
            `;

            totalActions++;
          } catch {
            // Failed to send, will retry next cycle
          }
        }
      }

      if (totalFound > 0) {
        findings.push({
          severity: "info",
          category: "onboarding:inactive",
          title: `${totalFound} Inactive New User(s) Found`,
          description: `Found ${totalFound} users who signed up but haven't built their first site. Sent ${totalActions} reminder email(s) across the 24h/48h/72h tiers.`,
          autoFixed: true,
          metadata: { totalFound, totalActions },
        });
      }

      return {
        output: { name: input.name, usersFound: totalFound, actionsPerformed: totalActions, details: `${totalActions} reminders sent` },
        confidence: 0.9,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, usersFound: 0, actionsPerformed: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Check Stuck Builders ──

  private async checkStuckBuilders(
    input: OnboardingCheckInput
  ): Promise<{ output: OnboardingCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Find users who started a generation but it failed (in the last 24 hours)
      const stuckUsers = await sql`
        SELECT
          g.user_email,
          COUNT(*) as failed_count,
          MAX(g.created_at) as last_attempt
        FROM agency_generations g
        WHERE g.status = 'failed'
          AND g.created_at > NOW() - INTERVAL '24 hours'
          AND NOT EXISTS (
            SELECT 1 FROM agency_generations g2
            WHERE g2.user_email = g.user_email
              AND g2.status = 'completed'
          )
        GROUP BY g.user_email
        HAVING COUNT(*) >= 2
      `;

      if (stuckUsers.length > 0) {
        findings.push({
          severity: "warning",
          category: "onboarding:stuck",
          title: `${stuckUsers.length} User(s) Stuck on First Build`,
          description: `${stuckUsers.length} user(s) have tried to build but keep failing. They have never had a successful generation. These users are at high risk of churning.`,
          autoFixed: false,
          metadata: { users: stuckUsers.map((u) => ({ email: u.user_email, failures: Number(u.failed_count) })) },
        });

        // Alert admin about stuck users
        try {
          const { notifyAdmin } = await import("@/lib/admin-notify");
          const userList = stuckUsers
            .map((u) => `${u.user_email} (${u.failed_count} failures)`)
            .join("<br>");

          await notifyAdmin({
            subject: `[Onboarding] ${stuckUsers.length} user(s) stuck on first build`,
            html: `<h2>Users Struggling to Build</h2>
            <p>These users tried to build their first site but keep hitting errors:</p>
            <p>${userList}</p>
            <p>Consider reaching out with support or checking if there's a systemic generation issue.</p>`,
          });
        } catch {
          // Alert failed, finding is still recorded
        }
      }

      return {
        output: { name: input.name, usersFound: stuckUsers.length, actionsPerformed: stuckUsers.length > 0 ? 1 : 0, details: `${stuckUsers.length} stuck users found` },
        confidence: 0.9,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, usersFound: 0, actionsPerformed: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Drop-Off Analysis ──

  private async analyzeDropOff(
    input: OnboardingCheckInput
  ): Promise<{ output: OnboardingCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Calculate conversion funnel metrics
      const signups = await sql`
        SELECT COUNT(*) as count FROM users
        WHERE created_at > NOW() - INTERVAL '7 days'
      `;

      const builders = await sql`
        SELECT COUNT(DISTINCT user_email) as count FROM agency_generations
        WHERE created_at > NOW() - INTERVAL '7 days'
      `;

      const deployers = await sql`
        SELECT COUNT(DISTINCT email) as count FROM sites
        WHERE created_at > NOW() - INTERVAL '7 days'
      `;

      const signupCount = Number(signups[0]?.count || 0);
      const buildCount = Number(builders[0]?.count || 0);
      const deployCount = Number(deployers[0]?.count || 0);

      if (signupCount > 0) {
        const signupToBuild = signupCount > 0 ? ((buildCount / signupCount) * 100).toFixed(1) : "0";
        const buildToDeploy = buildCount > 0 ? ((deployCount / buildCount) * 100).toFixed(1) : "0";

        findings.push({
          severity: "info",
          category: "onboarding:funnel",
          title: "7-Day Onboarding Funnel",
          description: `Signup→Build: ${signupToBuild}% (${signupCount}→${buildCount}). Build→Deploy: ${buildToDeploy}% (${buildCount}→${deployCount}). Target: >50% signup-to-build, >70% build-to-deploy.`,
          autoFixed: false,
          metadata: { signupCount, buildCount, deployCount, signupToBuild, buildToDeploy },
        });

        // Alert if conversion is critically low
        const buildRate = (buildCount / signupCount) * 100;
        if (buildRate < 20 && signupCount >= 10) {
          findings.push({
            severity: "error",
            category: "onboarding:low-conversion",
            title: `Low Signup→Build Rate: ${buildRate.toFixed(1)}%`,
            description: `Only ${buildRate.toFixed(1)}% of users who signed up in the last 7 days have tried to build. This indicates a serious onboarding problem.`,
            autoFixed: false,
          });
        }
      }

      return {
        output: { name: input.name, usersFound: signupCount, actionsPerformed: 0, details: `Funnel: ${signupCount}→${buildCount}→${deployCount}` },
        confidence: signupCount > 0 ? 0.9 : 0.5,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, usersFound: 0, actionsPerformed: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Send Onboarding Reminder Email ──

  private async sendOnboardingReminder(email: string, name: string | null, reminderNumber: number): Promise<void> {
    const { notifyAdmin } = await import("@/lib/admin-notify");
    const firstName = name ? name.split(" ")[0] : "there";

    const subjects: Record<number, string> = {
      1: `${firstName}, your first website is waiting`,
      2: `Building a website takes 90 seconds — seriously`,
      3: `Last chance: Your free AI website builder access`,
    };

    const bodies: Record<number, string> = {
      1: `<h2>Hey ${firstName}!</h2>
        <p>You signed up for Zoobicon but haven't built your first site yet.</p>
        <p>Here's the thing — it literally takes <strong>90 seconds</strong>. Just describe what you want, and our AI builds it.</p>
        <p><a href="https://zoobicon.com/builder" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Build My First Site</a></p>
        <p>— The Zoobicon Team</p>`,
      2: `<h2>Still thinking about it?</h2>
        <p>${firstName}, thousands of people have already built websites with Zoobicon this week.</p>
        <p>Try it with one of these prompts:</p>
        <ul>
          <li>"A modern portfolio for a freelance designer"</li>
          <li>"A landing page for my coffee shop"</li>
          <li>"A SaaS product page for my startup"</li>
        </ul>
        <p><a href="https://zoobicon.com/builder" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Try It Now</a></p>`,
      3: `<h2>Don't miss out, ${firstName}</h2>
        <p>This is our last reminder — we don't want to be annoying!</p>
        <p>But we genuinely think you'll be impressed. Our AI builds complete, professional websites from a single sentence.</p>
        <p><strong>No coding. No templates. Just describe and deploy.</strong></p>
        <p><a href="https://zoobicon.com/builder" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Build Something Amazing</a></p>
        <p>If you have any questions, just reply to this email.</p>`,
    };

    await notifyAdmin({
      subject: subjects[reminderNumber] || `Your Zoobicon account is ready`,
      html: bodies[reminderNumber] || bodies[1],
    });
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new OnboardingWatchdogAgent(CONFIG, store));

export { OnboardingWatchdogAgent, CONFIG as ONBOARDING_WATCHDOG_CONFIG };
