/**
 * Support Responder Agent
 *
 * Autonomous agent that drafts and optionally auto-sends support replies.
 * Wraps the existing AI support logic into the new agent framework.
 *
 * Checks for unanswered tickets every 5 minutes. If confidence ≥ 0.85
 * and the ticket is not billing/urgent, auto-sends the reply.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SupportTicketInput {
  ticketId: string;
  ticketNumber: string;
  subject: string;
  body: string;
  fromEmail: string;
  fromName: string;
  priority: string;
  tags: string[];
}

interface SupportResponseOutput {
  draft: string;
  confidence: number;
  category: string;
  autoSent: boolean;
  suggestedPriority: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "support-responder",
  name: "Support Auto-Responder",
  description: "Drafts AI responses to support tickets. Auto-sends when confidence is high and ticket is non-sensitive.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.85,
  scheduleIntervalSec: 300, // 5 minutes
  maxConcurrency: 3,
  maxRetries: 1,
  retryBaseDelayMs: 3000,
  taskTimeoutMs: 30_000, // 30s per ticket
  model: "claude-sonnet-4-6",
  settings: {
    autoSendEnabled: true,
    excludeCategories: ["billing", "account_deletion"],
    excludePriorities: ["urgent"],
  },
  tags: ["support", "email", "auto-reply", "customer-service"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class SupportResponderAgent extends BaseAgent<SupportTicketInput, SupportResponseOutput> {
  protected async discoverTasks(): Promise<SupportTicketInput[]> {
    try {
      const { sql } = await import("@/lib/db");

      // Find open tickets without an agent draft
      const tickets = await sql`
        SELECT t.id, t.ticket_number, t.subject, t.from_email, t.from_name,
               t.priority, t.tags,
               m.body_text
        FROM support_tickets t
        JOIN support_messages m ON m.ticket_id = t.id AND m.sender = 'customer'
        WHERE t.status = 'open'
          AND t.ai_draft IS NULL
          AND t.created_at > NOW() - INTERVAL '7 days'
        ORDER BY
          CASE t.priority
            WHEN 'urgent' THEN 0
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          t.created_at ASC
        LIMIT 10
      `;

      return tickets.map((t: Record<string, unknown>) => ({
        ticketId: t.id as string,
        ticketNumber: t.ticket_number as string,
        subject: t.subject as string,
        body: t.body_text as string,
        fromEmail: t.from_email as string,
        fromName: (t.from_name as string) || (t.from_email as string).split("@")[0],
        priority: (t.priority as string) || "medium",
        tags: (t.tags as string[]) || [],
      }));
    } catch {
      return [];
    }
  }

  protected async execute(
    input: SupportTicketInput,
    _context: TaskContext
  ): Promise<{ output: SupportResponseOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    // Classify the ticket
    const category = classifyTicket(input.subject, input.body);
    const suggestedPriority = assessPriority(input.subject, input.body);

    // Generate AI draft
    let draft = "";
    let confidence = 0;

    try {
      const response = await generateDraft(input, category);
      draft = response.draft;
      confidence = response.confidence;
    } catch (err) {
      findings.push({
        severity: "error",
        category: "support",
        title: "Draft generation failed",
        description: err instanceof Error ? err.message : "Unknown error",
        autoFixed: false,
      });

      return {
        output: { draft: "", confidence: 0, category, autoSent: false, suggestedPriority },
        confidence: 0,
        findings,
      };
    }

    // Determine if we should auto-send
    const excludeCategories = (this.config.settings.excludeCategories as string[]) || [];
    const excludePriorities = (this.config.settings.excludePriorities as string[]) || [];
    const autoSendEnabled = this.config.settings.autoSendEnabled as boolean;

    const canAutoSend =
      autoSendEnabled &&
      confidence >= this.config.confidenceThreshold &&
      !excludeCategories.includes(category) &&
      !excludePriorities.includes(input.priority) &&
      !excludePriorities.includes(suggestedPriority);

    let autoSent = false;

    // Save draft to ticket
    try {
      const { sql } = await import("@/lib/db");
      await sql`
        UPDATE support_tickets
        SET ai_draft = ${draft},
            ai_confidence = ${confidence},
            ai_category = ${category},
            updated_at = NOW()
        WHERE id = ${input.ticketId}
      `;

      // Auto-send if conditions met
      if (canAutoSend) {
        try {
          const { sendViaMailgun } = await import("@/lib/mailgun");
          const result = await sendViaMailgun({
            from: `Zoobicon Support <support@${process.env.MAILGUN_DOMAIN || "zoobicon.com"}>`,
            to: input.fromEmail,
            subject: `Re: ${input.subject}`,
            text: draft,
          });

          if (result.success) {
            autoSent = true;
            await sql`
              UPDATE support_tickets
              SET status = 'resolved', ai_auto_sent = true, updated_at = NOW()
              WHERE id = ${input.ticketId}
            `;
            await sql`
              INSERT INTO support_messages (ticket_id, sender, body_text)
              VALUES (${input.ticketId}, 'agent', ${draft})
            `;

            findings.push({
              severity: "info",
              category: "support",
              title: `Auto-replied to ${input.ticketNumber}`,
              description: `Confidence: ${(confidence * 100).toFixed(0)}% — Category: ${category}`,
              autoFixed: true,
            });
          }
        } catch {
          // Auto-send failed — draft is still saved for manual review
        }
      }
    } catch {
      // DB save failed — return draft anyway
    }

    if (!autoSent && confidence < this.config.confidenceThreshold) {
      findings.push({
        severity: "info",
        category: "support",
        title: `Draft needs review: ${input.ticketNumber}`,
        description: `Confidence ${(confidence * 100).toFixed(0)}% below threshold. Category: ${category}`,
        autoFixed: false,
        metadata: { ticketId: input.ticketId },
      });
    }

    return {
      output: { draft, confidence, category, autoSent, suggestedPriority },
      confidence,
      findings,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyTicket(subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();

  if (text.match(/billing|payment|charge|refund|invoice|subscription|cancel.*plan/)) return "billing";
  if (text.match(/bug|error|broken|crash|not working|500|404|fails/)) return "technical";
  if (text.match(/feature|request|suggest|would be nice|can you add/)) return "feature_request";
  if (text.match(/delete.*account|remove.*data|gdpr|privacy/)) return "account_deletion";
  if (text.match(/how (do|can|to)|help.*with|tutorial|guide|documentation/)) return "how_to";
  if (text.match(/great|love|awesome|thank|feedback|impressed/)) return "feedback";
  if (text.match(/enterprise|custom|white.*label|agency|bulk/)) return "sales";
  return "general";
}

function assessPriority(subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();

  if (text.match(/urgent|asap|emergency|down|outage|critical|immediately/)) return "urgent";
  if (text.match(/important|soon|deadline|blocking|can't.*work/)) return "high";
  if (text.match(/when.*available|would.*like|nice.*to.*have/)) return "low";
  return "medium";
}

async function generateDraft(
  input: SupportTicketInput,
  category: string
): Promise<{ draft: string; confidence: number }> {
  try {
    const { callLLM } = await import("@/lib/llm-provider");

    const systemPrompt = `You are Zoe, Zoobicon's AI support agent. Write a helpful, professional response.
Category: ${category}. Customer name: ${input.fromName}.
Be specific, reference their issue, provide actionable steps.
Keep it under 200 words. Sign off as "Zoe — Zoobicon Support".`;

    const result = await callLLM({
      model: "claude-haiku-4-5-20251001",
      system: systemPrompt,
      userMessage: `Subject: ${input.subject}\n\n${input.body}`,
      maxTokens: 512,
    });

    // Simple confidence heuristic
    const responseLength = (result.text || "").length;
    let confidence = 0.7;
    if (responseLength > 50) confidence += 0.1;
    if (category === "how_to" || category === "feedback" || category === "general") confidence += 0.1;
    if (category === "billing" || category === "account_deletion") confidence -= 0.2;
    confidence = Math.min(1, Math.max(0, confidence));

    return { draft: result.text || "", confidence };
  } catch {
    // Fallback — generate a simple acknowledgement
    return {
      draft: `Hi ${input.fromName},\n\nThank you for reaching out. We've received your message about "${input.subject}" and a team member will review it shortly.\n\nBest,\nZoe — Zoobicon Support`,
      confidence: 0.5,
    };
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new SupportResponderAgent(CONFIG, store));

export { SupportResponderAgent, CONFIG as SUPPORT_RESPONDER_CONFIG };
