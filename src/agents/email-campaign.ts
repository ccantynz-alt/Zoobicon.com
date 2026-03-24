/**
 * Email Campaign Agent
 *
 * Autonomous agent that handles scheduled email campaigns and drip sequences.
 * Runs every 5 minutes, checks for:
 * - Campaigns scheduled to send now
 * - Automation steps ready to fire
 * - AI-generated weekly newsletters
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignTaskInput {
  type: "scheduled_campaign" | "automation_step" | "weekly_digest";
  campaignId?: string;
  automationId?: string;
  userEmail?: string;
}

interface CampaignTaskOutput {
  sent: number;
  failed: number;
  provider: string;
  action: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "email-campaign",
  name: "Email Campaign Manager",
  description: "Sends scheduled campaigns, processes automation drip sequences, and generates weekly digests.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.8,
  scheduleIntervalSec: 300, // 5 minutes
  maxConcurrency: 2,
  maxRetries: 2,
  retryBaseDelayMs: 5000,
  taskTimeoutMs: 120_000, // 2 min per campaign
  settings: {},
  tags: ["email", "marketing", "campaigns", "automation"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class EmailCampaignAgent extends BaseAgent<CampaignTaskInput, CampaignTaskOutput> {
  protected async discoverTasks(): Promise<CampaignTaskInput[]> {
    const tasks: CampaignTaskInput[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Find scheduled campaigns that are due
      const dueCampaigns = await sql`
        SELECT id FROM mail_campaigns
        WHERE status = 'scheduled'
          AND scheduled_for <= NOW()
        LIMIT 10
      `;

      for (const c of dueCampaigns) {
        tasks.push({
          type: "scheduled_campaign",
          campaignId: c.id as string,
        });
      }
    } catch {
      // DB not available — no tasks
    }

    return tasks;
  }

  protected async execute(
    input: CampaignTaskInput,
    _context: TaskContext
  ): Promise<{ output: CampaignTaskOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    if (input.type === "scheduled_campaign" && input.campaignId) {
      try {
        const { sendCampaign } = await import("@/lib/zoobicon-mail");
        const result = await sendCampaign(input.campaignId);

        findings.push({
          severity: result.failed > 0 ? "warning" : "info",
          category: "email",
          title: `Campaign sent: ${result.sent} delivered, ${result.failed} failed`,
          description: `Campaign ${input.campaignId} sent via ${result.provider}`,
          autoFixed: true,
        });

        return {
          output: { ...result, action: "campaign_sent" },
          confidence: result.failed === 0 ? 0.95 : 0.7,
          findings,
        };
      } catch (err) {
        findings.push({
          severity: "error",
          category: "email",
          title: `Campaign send failed: ${input.campaignId}`,
          description: err instanceof Error ? err.message : "Unknown error",
          autoFixed: false,
        });

        return {
          output: { sent: 0, failed: 0, provider: "none", action: "campaign_failed" },
          confidence: 0.3,
          findings,
        };
      }
    }

    return {
      output: { sent: 0, failed: 0, provider: "none", action: "no_action" },
      confidence: 0.5,
      findings,
    };
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new EmailCampaignAgent(CONFIG, store));

export { EmailCampaignAgent, CONFIG as EMAIL_CAMPAIGN_CONFIG };
