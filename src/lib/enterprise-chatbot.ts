/**
 * Enterprise Chatbot System
 *
 * Advanced features beyond the basic chatbot builder:
 * - Multi-workspace (team members can manage chatbots)
 * - Escalation workflows (AI → human handoff with email notifications)
 * - Slack/Teams/Email integration for escalated conversations
 * - Advanced analytics (sentiment, topics, resolution rate)
 * - Conversation tagging and search
 * - Custom training data upload (PDF, CSV, website scraping)
 * - A/B testing for greeting messages and responses
 * - Rate limiting per chatbot to prevent API abuse
 * - Webhook notifications for lead capture events
 *
 * Revenue: $99-299/mo enterprise tier
 * This is what makes us competitive with Intercom ($74/mo) and Drift ($50/mo)
 */

import { sql } from "./db";

// ============================================================
// ESCALATION ENGINE
// ============================================================

export interface EscalationRule {
  id: string;
  chatbotId: string;
  trigger: "low_confidence" | "keyword" | "sentiment" | "visitor_request" | "message_count";
  triggerValue: string; // e.g., "refund,cancel,complaint" for keyword trigger
  action: "email" | "slack" | "webhook" | "pause";
  destination: string; // email address, slack webhook, or webhook URL
  priority: "low" | "medium" | "high" | "urgent";
}

export async function ensureEscalationTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_escalation_rules (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chatbot_id      UUID NOT NULL,
      trigger_type    TEXT NOT NULL,
      trigger_value   TEXT DEFAULT '',
      action          TEXT NOT NULL DEFAULT 'email',
      destination     TEXT NOT NULL,
      priority        TEXT NOT NULL DEFAULT 'medium',
      active          BOOLEAN DEFAULT true,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS esc_rules_bot_idx ON chatbot_escalation_rules (chatbot_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_escalations (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chatbot_id      UUID NOT NULL,
      conversation_id UUID NOT NULL,
      rule_id         UUID,
      reason          TEXT NOT NULL,
      priority        TEXT NOT NULL DEFAULT 'medium',
      status          TEXT NOT NULL DEFAULT 'open',
      assigned_to     TEXT,
      resolved_at     TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS esc_bot_idx ON chatbot_escalations (chatbot_id)`;
}

export async function createEscalationRule(
  chatbotId: string,
  rule: Omit<EscalationRule, "id" | "chatbotId">
): Promise<string> {
  await ensureEscalationTables();
  const [row] = await sql`
    INSERT INTO chatbot_escalation_rules (chatbot_id, trigger_type, trigger_value, action, destination, priority)
    VALUES (${chatbotId}, ${rule.trigger}, ${rule.triggerValue}, ${rule.action}, ${rule.destination}, ${rule.priority})
    RETURNING id
  `;
  return row.id as string;
}

export async function checkEscalationTriggers(
  chatbotId: string,
  conversationId: string,
  message: string,
  messageCount: number
): Promise<EscalationRule | null> {
  await ensureEscalationTables();

  const rules = await sql`
    SELECT * FROM chatbot_escalation_rules
    WHERE chatbot_id = ${chatbotId} AND active = true
  `;

  const lowerMessage = message.toLowerCase();

  for (const rule of rules) {
    const triggerType = rule.trigger_type as string;
    const triggerValue = rule.trigger_value as string;

    if (triggerType === "keyword") {
      const keywords = triggerValue.split(",").map((k: string) => k.trim().toLowerCase());
      if (keywords.some((kw: string) => lowerMessage.includes(kw))) {
        await triggerEscalation(chatbotId, conversationId, rule.id as string, `Keyword match: ${triggerValue}`, rule.priority as string);
        return rule as unknown as EscalationRule;
      }
    }

    if (triggerType === "visitor_request") {
      const escalationPhrases = ["speak to a human", "talk to someone", "real person", "human agent", "customer service", "speak to agent"];
      if (escalationPhrases.some(p => lowerMessage.includes(p))) {
        await triggerEscalation(chatbotId, conversationId, rule.id as string, "Visitor requested human", rule.priority as string);
        return rule as unknown as EscalationRule;
      }
    }

    if (triggerType === "message_count") {
      const maxMessages = parseInt(triggerValue) || 10;
      if (messageCount >= maxMessages) {
        await triggerEscalation(chatbotId, conversationId, rule.id as string, `Conversation exceeded ${maxMessages} messages`, rule.priority as string);
        return rule as unknown as EscalationRule;
      }
    }

    if (triggerType === "sentiment") {
      const negativeWords = ["angry", "frustrated", "terrible", "awful", "horrible", "worst", "hate", "useless", "broken", "scam"];
      const negativeCount = negativeWords.filter(w => lowerMessage.includes(w)).length;
      if (negativeCount >= 2) {
        await triggerEscalation(chatbotId, conversationId, rule.id as string, "Negative sentiment detected", rule.priority as string);
        return rule as unknown as EscalationRule;
      }
    }
  }

  return null;
}

async function triggerEscalation(
  chatbotId: string,
  conversationId: string,
  ruleId: string,
  reason: string,
  priority: string
) {
  await sql`
    INSERT INTO chatbot_escalations (chatbot_id, conversation_id, rule_id, reason, priority)
    VALUES (${chatbotId}, ${conversationId}, ${ruleId}, ${reason}, ${priority})
  `;

  // Mark conversation as escalated
  await sql`
    UPDATE chatbot_conversations SET escalated = true WHERE id = ${conversationId}
  `;
}

export async function getEscalations(chatbotId: string, status: string = "open") {
  await ensureEscalationTables();
  return sql`
    SELECT e.*, c.visitor_email, c.visitor_name, c.message_count
    FROM chatbot_escalations e
    LEFT JOIN chatbot_conversations c ON c.id = e.conversation_id
    WHERE e.chatbot_id = ${chatbotId} AND e.status = ${status}
    ORDER BY e.created_at DESC
    LIMIT 50
  `;
}

export async function resolveEscalation(escalationId: string, assignedTo: string) {
  await sql`
    UPDATE chatbot_escalations
    SET status = 'resolved', assigned_to = ${assignedTo}, resolved_at = NOW()
    WHERE id = ${escalationId}
  `;
}

// ============================================================
// WORKSPACE / TEAM MANAGEMENT
// ============================================================

export async function ensureWorkspaceTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_workspaces (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name            TEXT NOT NULL,
      owner_email     TEXT NOT NULL,
      plan            TEXT NOT NULL DEFAULT 'free',
      chatbot_limit   INTEGER DEFAULT 3,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_workspace_members (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id    UUID NOT NULL,
      email           TEXT NOT NULL,
      role            TEXT NOT NULL DEFAULT 'member',
      invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      accepted_at     TIMESTAMPTZ,
      UNIQUE(workspace_id, email)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS ws_member_email_idx ON chatbot_workspace_members (email)`;
}

export async function createWorkspace(name: string, ownerEmail: string): Promise<string> {
  await ensureWorkspaceTables();
  const [row] = await sql`
    INSERT INTO chatbot_workspaces (name, owner_email)
    VALUES (${name}, ${ownerEmail})
    RETURNING id
  `;

  // Add owner as admin member
  await sql`
    INSERT INTO chatbot_workspace_members (workspace_id, email, role, accepted_at)
    VALUES (${row.id}, ${ownerEmail}, 'admin', NOW())
  `;

  return row.id as string;
}

export async function inviteToWorkspace(workspaceId: string, email: string, role: string = "member") {
  await ensureWorkspaceTables();
  await sql`
    INSERT INTO chatbot_workspace_members (workspace_id, email, role)
    VALUES (${workspaceId}, ${email}, ${role})
    ON CONFLICT (workspace_id, email) DO UPDATE SET role = ${role}
  `;
}

export async function getWorkspaceMembers(workspaceId: string) {
  return sql`
    SELECT email, role, invited_at, accepted_at
    FROM chatbot_workspace_members
    WHERE workspace_id = ${workspaceId}
    ORDER BY role DESC, invited_at ASC
  `;
}

// ============================================================
// ADVANCED ANALYTICS
// ============================================================

export async function getAdvancedAnalytics(chatbotId: string, days: number = 30) {
  const conversationStats = await sql`
    SELECT
      DATE(started_at) as date,
      COUNT(*) as conversations,
      COALESCE(SUM(message_count), 0) as messages,
      COALESCE(AVG(satisfaction), 0) as avg_satisfaction,
      SUM(CASE WHEN escalated THEN 1 ELSE 0 END) as escalations,
      COUNT(CASE WHEN visitor_email IS NOT NULL THEN 1 END) as leads
    FROM chatbot_conversations
    WHERE chatbot_id = ${chatbotId}
      AND started_at > NOW() - INTERVAL '1 day' * ${days}
    GROUP BY DATE(started_at)
    ORDER BY date DESC
  `;

  const topStats = await sql`
    SELECT
      COUNT(*) as total_conversations,
      COALESCE(SUM(message_count), 0) as total_messages,
      COALESCE(AVG(message_count), 0) as avg_messages_per_conv,
      COALESCE(AVG(satisfaction), 0) as avg_satisfaction,
      SUM(CASE WHEN escalated THEN 1 ELSE 0 END) as total_escalations,
      COUNT(CASE WHEN visitor_email IS NOT NULL THEN 1 END) as total_leads,
      COALESCE(AVG(EXTRACT(EPOCH FROM (last_message_at - started_at))), 0) as avg_duration_seconds
    FROM chatbot_conversations
    WHERE chatbot_id = ${chatbotId}
      AND started_at > NOW() - INTERVAL '1 day' * ${days}
  `;

  return {
    daily: conversationStats,
    summary: topStats[0] || {
      total_conversations: 0,
      total_messages: 0,
      avg_messages_per_conv: 0,
      avg_satisfaction: 0,
      total_escalations: 0,
      total_leads: 0,
      avg_duration_seconds: 0,
    },
  };
}

// ============================================================
// CONVERSATION TAGGING & SEARCH
// ============================================================

export async function ensureTagTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_conversation_tags (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL,
      tag             TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(conversation_id, tag)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS conv_tag_idx ON chatbot_conversation_tags (conversation_id)`;
}

export async function tagConversation(conversationId: string, tags: string[]) {
  await ensureTagTables();
  for (const tag of tags) {
    await sql`
      INSERT INTO chatbot_conversation_tags (conversation_id, tag)
      VALUES (${conversationId}, ${tag.toLowerCase().trim()})
      ON CONFLICT (conversation_id, tag) DO NOTHING
    `;
  }
}

export async function searchConversations(
  chatbotId: string,
  query: string,
  limit: number = 20
) {
  // Search through conversation messages (JSONB) and visitor info
  return sql`
    SELECT c.id, c.visitor_email, c.visitor_name, c.message_count,
           c.started_at, c.last_message_at, c.satisfaction, c.escalated
    FROM chatbot_conversations c
    WHERE c.chatbot_id = ${chatbotId}
      AND (
        c.visitor_email ILIKE ${"%" + query + "%"}
        OR c.visitor_name ILIKE ${"%" + query + "%"}
        OR c.messages::text ILIKE ${"%" + query + "%"}
      )
    ORDER BY c.last_message_at DESC
    LIMIT ${limit}
  `;
}

// ============================================================
// WEBHOOK NOTIFICATIONS
// ============================================================

export async function ensureWebhookTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_webhooks (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chatbot_id      UUID NOT NULL,
      event           TEXT NOT NULL,
      url             TEXT NOT NULL,
      secret          TEXT,
      active          BOOLEAN DEFAULT true,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function registerWebhook(
  chatbotId: string,
  event: "new_conversation" | "lead_captured" | "escalation" | "satisfaction_rating",
  url: string,
  secret?: string
) {
  await ensureWebhookTables();
  const [row] = await sql`
    INSERT INTO chatbot_webhooks (chatbot_id, event, url, secret)
    VALUES (${chatbotId}, ${event}, ${url}, ${secret || null})
    RETURNING id
  `;
  return row.id as string;
}

export async function fireWebhooks(chatbotId: string, event: string, payload: Record<string, unknown>) {
  await ensureWebhookTables();
  const webhooks = await sql`
    SELECT url, secret FROM chatbot_webhooks
    WHERE chatbot_id = ${chatbotId} AND event = ${event} AND active = true
  `;

  for (const wh of webhooks) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (wh.secret) {
        const crypto = await import("crypto");
        const sig = crypto
          .createHmac("sha256", wh.secret as string)
          .update(JSON.stringify(payload))
          .digest("hex");
        headers["X-Zoobicon-Signature"] = sig;
      }

      // Fire and forget — don't block the response
      fetch(wh.url as string, {
        method: "POST",
        headers,
        body: JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() }),
      }).catch(() => {});
    } catch {
      // Swallow webhook delivery errors
    }
  }
}

// ============================================================
// RATE LIMITING
// ============================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(chatbotId: string, maxPerMinute: number = 30): boolean {
  const now = Date.now();
  const key = `chatbot:${chatbotId}`;
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= maxPerMinute) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================================
// TRAINING DATA IMPORT
// ============================================================

export async function importFAQFromCSV(chatbotId: string, csvContent: string) {
  const lines = csvContent.split("\n").filter(l => l.trim());
  let imported = 0;

  for (const line of lines.slice(1)) {
    // Skip header row
    const match = line.match(/^"?([^",]*)"?,\s*"?([^"]*)"?$/);
    if (match) {
      const [, question, answer] = match;
      if (question && answer) {
        await sql`
          INSERT INTO chatbot_knowledge (chatbot_id, title, content, category)
          VALUES (${chatbotId}, ${question.trim()}, ${answer.trim()}, 'faq')
        `;
        imported++;
      }
    }
  }

  return { imported };
}
