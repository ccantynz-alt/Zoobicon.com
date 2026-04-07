import Anthropic from "@anthropic-ai/sdk";
import { sql } from "@/lib/db";

export type SupportChannel = "email" | "chat" | "sms" | "whatsapp";
export type SupportStatus = "open" | "pending" | "resolved" | "spam";
export type SupportRole = "customer" | "agent" | "ai";

export interface SupportThread {
  id: string;
  channel: SupportChannel;
  customer_id: string | null;
  customer_email: string | null;
  subject: string | null;
  status: SupportStatus;
  priority: number;
  ai_handled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  thread_id: string;
  role: SupportRole;
  body: string;
  created_at: string;
}

export interface CreateThreadInput {
  channel: SupportChannel;
  customerId?: string | null;
  customerEmail?: string | null;
  subject?: string | null;
  body: string;
  priority?: number;
}

export interface ThreadFilter {
  status?: SupportStatus;
  channel?: SupportChannel;
  aiHandled?: boolean;
  limit?: number;
}

export interface AITriageResult {
  intent: string;
  urgency: number;
  suggestedReply: string;
  confidence: number;
  autoHandled: boolean;
}

let tablesEnsured = false;

export async function ensureSupportTables(): Promise<void> {
  if (tablesEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS support_threads (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      customer_id TEXT,
      customer_email TEXT,
      subject TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      priority INTEGER NOT NULL DEFAULT 3,
      ai_handled BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_support_threads_status ON support_threads(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_support_messages_thread ON support_messages(thread_id)`;
  tablesEnsured = true;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createThread(input: CreateThreadInput): Promise<SupportThread> {
  await ensureSupportTables();
  const id = newId("thr");
  const rows = (await sql`
    INSERT INTO support_threads (id, channel, customer_id, customer_email, subject, status, priority, ai_handled)
    VALUES (${id}, ${input.channel}, ${input.customerId ?? null}, ${input.customerEmail ?? null}, ${input.subject ?? null}, 'open', ${input.priority ?? 3}, FALSE)
    RETURNING *
  `) as unknown as SupportThread[];
  await addMessage(id, "customer", input.body);
  return rows[0];
}

export async function addMessage(threadId: string, role: SupportRole, body: string): Promise<SupportMessage> {
  await ensureSupportTables();
  const id = newId("msg");
  const rows = (await sql`
    INSERT INTO support_messages (id, thread_id, role, body)
    VALUES (${id}, ${threadId}, ${role}, ${body})
    RETURNING *
  `) as unknown as SupportMessage[];
  await sql`UPDATE support_threads SET updated_at = NOW() WHERE id = ${threadId}`;
  return rows[0];
}

export async function listThreads(filter: ThreadFilter = {}): Promise<SupportThread[]> {
  await ensureSupportTables();
  const limit = filter.limit ?? 100;
  const status = filter.status ?? null;
  const channel = filter.channel ?? null;
  const aiHandled = filter.aiHandled ?? null;
  const rows = (await sql`
    SELECT * FROM support_threads
    WHERE (${status}::text IS NULL OR status = ${status})
      AND (${channel}::text IS NULL OR channel = ${channel})
      AND (${aiHandled}::boolean IS NULL OR ai_handled = ${aiHandled})
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `) as unknown as SupportThread[];
  return rows;
}

export async function getThread(id: string): Promise<{ thread: SupportThread | null; messages: SupportMessage[] }> {
  await ensureSupportTables();
  const threads = (await sql`SELECT * FROM support_threads WHERE id = ${id}`) as unknown as SupportThread[];
  if (!threads[0]) return { thread: null, messages: [] };
  const messages = (await sql`SELECT * FROM support_messages WHERE thread_id = ${id} ORDER BY created_at ASC`) as unknown as SupportMessage[];
  return { thread: threads[0], messages };
}

export async function markResolved(id: string): Promise<void> {
  await ensureSupportTables();
  await sql`UPDATE support_threads SET status = 'resolved', updated_at = NOW() WHERE id = ${id}`;
}

export async function assignAI(id: string): Promise<void> {
  await ensureSupportTables();
  await sql`UPDATE support_threads SET ai_handled = TRUE, updated_at = NOW() WHERE id = ${id}`;
}

export async function aiTriage(threadBody: string): Promise<AITriageResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set — cannot run AI triage");
  }
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system:
      "You are a customer support triage AI for Zoobicon. Classify the customer message and propose a reply. Return ONLY JSON: {\"intent\":string,\"urgency\":1-5,\"suggestedReply\":string,\"confidence\":0-1}. Never mention you are an AI. Reply must be concise, helpful, and on-brand.",
    messages: [{ role: "user", content: threadBody }],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("AI triage returned no text content");
  }
  const text = block.text.trim();
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`AI triage returned non-JSON: ${text.slice(0, 200)}`);
  }
  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
    intent: string;
    urgency: number;
    suggestedReply: string;
    confidence: number;
  };

  const result: AITriageResult = {
    intent: String(parsed.intent),
    urgency: Number(parsed.urgency),
    suggestedReply: String(parsed.suggestedReply),
    confidence: Number(parsed.confidence),
    autoHandled: Number(parsed.confidence) > 0.8,
  };
  return result;
}
