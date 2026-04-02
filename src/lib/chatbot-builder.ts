/**
 * AI Chatbot Builder (#34)
 *
 * Customers create AI chatbots for THEIR websites.
 * Not just a widget — a full builder where they:
 *   1. Describe their business
 *   2. Upload FAQ/knowledge base docs
 *   3. Customize appearance (colors, avatar, greeting)
 *   4. Get an embed code to paste on their site
 *   5. View conversation analytics
 *
 * Revenue: $29-49/mo per chatbot
 * Cost: ~$0.01-0.05/conversation (Claude API)
 * Margin: 90%+
 *
 * This is like building our own Intercom/Drift but AI-first.
 */

import { sql } from "./db";
import { generateWidgetCode, generateSystemPrompt, type ChatbotConfig } from "./chatbot-widget";

export interface Chatbot {
  id: string;
  ownerEmail: string;
  name: string;
  config: ChatbotConfig;
  embedCode: string;
  conversationCount: number;
  active: boolean;
  createdAt: Date;
}

/**
 * Initialize chatbot tables.
 */
export async function ensureChatbotTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS chatbots (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_email     TEXT NOT NULL,
      name            TEXT NOT NULL,
      config          JSONB NOT NULL,
      active          BOOLEAN DEFAULT true,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS chatbots_owner_idx ON chatbots (owner_email)`;

  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_conversations (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chatbot_id      UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
      visitor_email   TEXT,
      visitor_name    TEXT,
      messages        JSONB NOT NULL DEFAULT '[]',
      message_count   INTEGER DEFAULT 0,
      started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      satisfaction    INTEGER,
      escalated       BOOLEAN DEFAULT false
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS chatbot_conv_bot_idx ON chatbot_conversations (chatbot_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS chatbot_knowledge (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      chatbot_id      UUID NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
      title           TEXT NOT NULL,
      content         TEXT NOT NULL,
      category        TEXT DEFAULT 'general',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS chatbot_know_bot_idx ON chatbot_knowledge (chatbot_id)`;
}

/**
 * Create a new chatbot.
 */
export async function createChatbot(
  ownerEmail: string,
  config: ChatbotConfig
): Promise<Chatbot> {
  await ensureChatbotTables();

  const [row] = await sql`
    INSERT INTO chatbots (owner_email, name, config)
    VALUES (${ownerEmail}, ${config.businessName}, ${JSON.stringify(config)})
    RETURNING id, created_at
  `;

  const chatbotId = row.id as string;
  const apiEndpoint = `https://zoobicon.com/api/chatbot/${chatbotId}/message`;
  const embedCode = generateWidgetCode(config, apiEndpoint);

  return {
    id: chatbotId,
    ownerEmail,
    name: config.businessName,
    config,
    embedCode,
    conversationCount: 0,
    active: true,
    createdAt: row.created_at as Date,
  };
}

/**
 * Handle an incoming chatbot message.
 * Called by the widget when a visitor sends a message.
 */
export async function handleChatbotMessage(
  chatbotId: string,
  conversationId: string | null,
  message: string,
  visitorEmail?: string
): Promise<{
  reply: string;
  conversationId: string;
}> {
  await ensureChatbotTables();

  // Get chatbot config
  const [bot] = await sql`SELECT config FROM chatbots WHERE id = ${chatbotId} AND active = true`;
  if (!bot) throw new Error("Chatbot not found");

  const config = bot.config as ChatbotConfig;

  // Get or create conversation
  let convId = conversationId;
  let previousMessages: Array<{ role: string; content: string }> = [];

  if (convId) {
    const [conv] = await sql`SELECT messages FROM chatbot_conversations WHERE id = ${convId}`;
    if (conv) {
      previousMessages = (conv.messages as Array<{ role: string; content: string }>) || [];
    }
  }

  if (!convId) {
    const [newConv] = await sql`
      INSERT INTO chatbot_conversations (chatbot_id, visitor_email)
      VALUES (${chatbotId}, ${visitorEmail || null})
      RETURNING id
    `;
    convId = newConv.id as string;
  }

  // Get knowledge base for context
  const knowledge = await sql`
    SELECT content FROM chatbot_knowledge WHERE chatbot_id = ${chatbotId} LIMIT 10
  `;
  const knowledgeText = knowledge.map(k => k.content).join("\n\n");

  // Build config with knowledge base
  const fullConfig: ChatbotConfig = {
    ...config,
    knowledgeBase: knowledgeText || config.knowledgeBase,
  };

  // Generate reply using Claude
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { reply: "I'm having trouble connecting. Please try again.", conversationId: convId };

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const systemPrompt = generateSystemPrompt(fullConfig);
  const messages = [
    ...previousMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages,
  });

  const reply = response.content.find(b => b.type === "text")?.text || "I'm sorry, I couldn't process that. Please try again.";

  // Update conversation
  const updatedMessages = [...previousMessages, { role: "user", content: message }, { role: "assistant", content: reply }];
  await sql`
    UPDATE chatbot_conversations
    SET messages = ${JSON.stringify(updatedMessages)},
        message_count = ${updatedMessages.length},
        last_message_at = NOW()
    WHERE id = ${convId}
  `;

  return { reply, conversationId: convId };
}

/**
 * Get chatbot analytics.
 */
export async function getChatbotAnalytics(chatbotId: string): Promise<{
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConv: number;
  escalationRate: number;
}> {
  const [stats] = await sql`
    SELECT
      COUNT(*) as total_conversations,
      COALESCE(SUM(message_count), 0) as total_messages,
      COALESCE(AVG(message_count), 0) as avg_messages,
      COALESCE(AVG(CASE WHEN escalated THEN 1 ELSE 0 END), 0) as escalation_rate
    FROM chatbot_conversations WHERE chatbot_id = ${chatbotId}
  `;

  return {
    totalConversations: parseInt(stats?.total_conversations as string) || 0,
    totalMessages: parseInt(stats?.total_messages as string) || 0,
    avgMessagesPerConv: parseFloat(stats?.avg_messages as string) || 0,
    escalationRate: parseFloat(stats?.escalation_rate as string) || 0,
  };
}

/**
 * Add knowledge to a chatbot (FAQ entries, docs, etc.)
 */
export async function addKnowledge(
  chatbotId: string,
  title: string,
  content: string,
  category: string = "general"
): Promise<void> {
  await ensureChatbotTables();
  await sql`
    INSERT INTO chatbot_knowledge (chatbot_id, title, content, category)
    VALUES (${chatbotId}, ${title}, ${content}, ${category})
  `;
}

/**
 * Get all chatbots for a user.
 */
export async function getUserChatbots(ownerEmail: string): Promise<Chatbot[]> {
  await ensureChatbotTables();
  const rows = await sql`
    SELECT c.*, (SELECT COUNT(*) FROM chatbot_conversations WHERE chatbot_id = c.id) as conv_count
    FROM chatbots c WHERE c.owner_email = ${ownerEmail} ORDER BY c.created_at DESC
  `;

  return rows.map(r => ({
    id: r.id as string,
    ownerEmail: r.owner_email as string,
    name: r.name as string,
    config: r.config as ChatbotConfig,
    embedCode: generateWidgetCode(
      r.config as ChatbotConfig,
      `https://zoobicon.com/api/chatbot/${r.id}/message`
    ),
    conversationCount: parseInt(r.conv_count as string) || 0,
    active: r.active as boolean,
    createdAt: r.created_at as Date,
  }));
}
