/**
 * Live Chat Backend (Intercom alternative)
 *
 * Long-poll based chat system. Visitors send messages, an AI auto-reply
 * is generated in the background via Claude Haiku, and clients poll
 * /api/livechat/poll for new messages.
 */

import { sql } from "@/lib/db";
import { callLLM } from "@/lib/llm-provider";

export type ChatSender = "visitor" | "agent" | "ai";
export type ChatStatus = "open" | "closed";

export interface LiveChatConversation {
  id: number;
  site_id: string;
  visitor_id: string;
  visitor_email: string | null;
  status: ChatStatus;
  created_at: string;
  last_message_at: string;
}

export interface LiveChatMessage {
  id: number;
  conversation_id: number;
  sender: ChatSender;
  body: string;
  created_at: string;
}

let tablesEnsured = false;

export async function ensureLiveChatTables(): Promise<void> {
  if (tablesEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS livechat_conversations (
      id SERIAL PRIMARY KEY,
      site_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      visitor_email TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS livechat_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES livechat_conversations(id) ON DELETE CASCADE,
      sender TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_livechat_messages_conv ON livechat_messages(conversation_id, id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_livechat_conversations_site ON livechat_conversations(site_id)`;
  tablesEnsured = true;
}

function rowToConversation(row: Record<string, unknown>): LiveChatConversation {
  return {
    id: Number(row.id),
    site_id: String(row.site_id),
    visitor_id: String(row.visitor_id),
    visitor_email: row.visitor_email == null ? null : String(row.visitor_email),
    status: (row.status === "closed" ? "closed" : "open") as ChatStatus,
    created_at: String(row.created_at),
    last_message_at: String(row.last_message_at),
  };
}

function rowToMessage(row: Record<string, unknown>): LiveChatMessage {
  const sender = row.sender === "agent" || row.sender === "ai" ? row.sender : "visitor";
  return {
    id: Number(row.id),
    conversation_id: Number(row.conversation_id),
    sender: sender as ChatSender,
    body: String(row.body),
    created_at: String(row.created_at),
  };
}

export async function startConversation(
  siteId: string,
  visitorId: string,
  visitorEmail?: string
): Promise<LiveChatConversation> {
  await ensureLiveChatTables();
  const rows = (await sql`
    INSERT INTO livechat_conversations (site_id, visitor_id, visitor_email)
    VALUES (${siteId}, ${visitorId}, ${visitorEmail ?? null})
    RETURNING *
  `) as Record<string, unknown>[];
  return rowToConversation(rows[0]);
}

async function generateAIReply(conversationId: number): Promise<void> {
  try {
    const msgRows = (await sql`
      SELECT sender, body FROM livechat_messages
      WHERE conversation_id = ${conversationId}
      ORDER BY id ASC
      LIMIT 30
    `) as Record<string, unknown>[];

    const transcript = msgRows
      .map((m) => `${String(m.sender).toUpperCase()}: ${String(m.body)}`)
      .join("\n");

    const res = await callLLM({
      model: "claude-haiku-4-5-20251001",
      system:
        "You are a friendly, concise live chat support assistant for Zoobicon, an AI-powered website builder and domain platform. Answer the visitor's question in 1-3 short sentences. If you cannot answer, offer to connect them with a human. Never mention that you are an AI model or which company built you.",
      userMessage: `Conversation so far:\n${transcript}\n\nWrite the next reply as the assistant.`,
      maxTokens: 400,
    });

    const reply = res.text.trim();
    if (!reply) return;

    await sql`
      INSERT INTO livechat_messages (conversation_id, sender, body)
      VALUES (${conversationId}, 'ai', ${reply})
    `;
    await sql`
      UPDATE livechat_conversations
      SET last_message_at = NOW()
      WHERE id = ${conversationId}
    `;
  } catch (err) {
    console.warn("[live-chat] AI reply failed:", err);
  }
}

export async function sendMessage(
  conversationId: number,
  sender: ChatSender,
  body: string
): Promise<{ message: LiveChatMessage; autoReplyTriggered: boolean }> {
  await ensureLiveChatTables();
  const rows = (await sql`
    INSERT INTO livechat_messages (conversation_id, sender, body)
    VALUES (${conversationId}, ${sender}, ${body})
    RETURNING *
  `) as Record<string, unknown>[];
  await sql`
    UPDATE livechat_conversations
    SET last_message_at = NOW()
    WHERE id = ${conversationId}
  `;

  const message = rowToMessage(rows[0]);

  let autoReplyTriggered = false;
  if (sender === "visitor") {
    autoReplyTriggered = true;
    // Fire-and-forget; do not await.
    void generateAIReply(conversationId);
  }

  return { message, autoReplyTriggered };
}

export async function pollMessages(
  conversationId: number,
  sinceId = 0,
  waitMs = 20000
): Promise<LiveChatMessage[]> {
  await ensureLiveChatTables();
  const start = Date.now();
  const intervalMs = 1000;

  while (true) {
    const rows = (await sql`
      SELECT * FROM livechat_messages
      WHERE conversation_id = ${conversationId} AND id > ${sinceId}
      ORDER BY id ASC
      LIMIT 100
    `) as Record<string, unknown>[];

    if (rows.length > 0) {
      return rows.map(rowToMessage);
    }
    if (Date.now() - start >= waitMs) {
      return [];
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

export async function getConversation(
  id: number
): Promise<{ conversation: LiveChatConversation; messages: LiveChatMessage[] } | null> {
  await ensureLiveChatTables();
  const convRows = (await sql`
    SELECT * FROM livechat_conversations WHERE id = ${id} LIMIT 1
  `) as Record<string, unknown>[];
  if (convRows.length === 0) return null;
  const msgRows = (await sql`
    SELECT * FROM livechat_messages
    WHERE conversation_id = ${id}
    ORDER BY id ASC
  `) as Record<string, unknown>[];
  return {
    conversation: rowToConversation(convRows[0]),
    messages: msgRows.map(rowToMessage),
  };
}
