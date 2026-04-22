/**
 * Flywheel Memory Layer
 *
 * A persistent memory system that accumulates context about users across
 * sessions, turning every interaction into compounding intelligence. The
 * flywheel stores conversations, build history, user preferences, and
 * brand context so the AI gets smarter with every use — "user prefers dark
 * themes," "brand color is #E8D4B0," "runs a dental clinic." This context
 * is injected into system prompts to make every generation more relevant.
 *
 * Storage: Neon Postgres when DATABASE_URL is available, seamless
 * localStorage fallback when it is not.
 */

export interface Conversation {
  id: string;
  title: string;
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }>;
  model: string;
  createdAt: number;
  updatedAt: number;
}

export interface MemoryEntry {
  id: string;
  type: "preference" | "brand" | "instruction" | "context";
  content: string;
  createdAt: number;
}

export interface BuildRecord {
  id: string;
  prompt: string;
  siteName: string;
  model: string;
  durationMs: number;
  createdAt: number;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ---------------------------------------------------------------------------
// Database backend
// ---------------------------------------------------------------------------

let tablesInitialized = false;

async function ensureTables(): Promise<void> {
  if (tablesInitialized) return;

  const { sql } = await import("@/lib/db");

  await sql`
    CREATE TABLE IF NOT EXISTS flywheel_settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS flywheel_conversations (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL DEFAULT '',
      messages    JSONB NOT NULL DEFAULT '[]',
      model       TEXT NOT NULL DEFAULT '',
      created_at  BIGINT NOT NULL,
      updated_at  BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS flywheel_conversations_updated_idx ON flywheel_conversations (updated_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS flywheel_builds (
      id           TEXT PRIMARY KEY,
      prompt       TEXT NOT NULL DEFAULT '',
      site_name    TEXT NOT NULL DEFAULT '',
      model        TEXT NOT NULL DEFAULT '',
      duration_ms  INTEGER NOT NULL DEFAULT 0,
      created_at   BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS flywheel_builds_created_idx ON flywheel_builds (created_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS flywheel_memories (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL,
      content     TEXT NOT NULL,
      created_at  BIGINT NOT NULL
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS flywheel_memories_type_idx ON flywheel_memories (type)`;

  tablesInitialized = true;
}

async function dbAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await ensureTables();
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

// TODO: In production, API key values should be encrypted at rest (e.g. with
// AES-256-GCM using a key from env). For now they are stored as plaintext.

export async function saveSetting(key: string, value: string): Promise<void> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    await sql`
      INSERT INTO flywheel_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
    return;
  }

  if (typeof window === "undefined") return;
  const store: Record<string, string> = JSON.parse(localStorage.getItem("zbk_settings") || "{}");
  store[key] = value;
  localStorage.setItem("zbk_settings", JSON.stringify(store));
}

export async function getSetting(key: string): Promise<string | null> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    const rows = await sql`SELECT value FROM flywheel_settings WHERE key = ${key}`;
    return rows.length > 0 ? (rows[0].value as string) : null;
  }

  if (typeof window === "undefined") return null;
  const store: Record<string, string> = JSON.parse(localStorage.getItem("zbk_settings") || "{}");
  return store[key] ?? null;
}

export async function deleteSetting(key: string): Promise<void> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    await sql`DELETE FROM flywheel_settings WHERE key = ${key}`;
    return;
  }

  if (typeof window === "undefined") return;
  const store: Record<string, string> = JSON.parse(localStorage.getItem("zbk_settings") || "{}");
  delete store[key];
  localStorage.setItem("zbk_settings", JSON.stringify(store));
}

export async function getAllSettings(): Promise<Record<string, string>> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    const rows = await sql`SELECT key, value FROM flywheel_settings ORDER BY key`;
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key as string] = row.value as string;
    }
    return result;
  }

  if (typeof window === "undefined") return {};
  return JSON.parse(localStorage.getItem("zbk_settings") || "{}");
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function saveConversation(conversation: Conversation): Promise<void> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    await sql`
      INSERT INTO flywheel_conversations (id, title, messages, model, created_at, updated_at)
      VALUES (
        ${conversation.id},
        ${conversation.title},
        ${JSON.stringify(conversation.messages)},
        ${conversation.model},
        ${conversation.createdAt},
        ${conversation.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        model = EXCLUDED.model,
        updated_at = EXCLUDED.updated_at
    `;
    return;
  }

  if (typeof window === "undefined") return;
  const all: Conversation[] = JSON.parse(localStorage.getItem("zbk_conversations") || "[]");
  const idx = all.findIndex((c) => c.id === conversation.id);
  if (idx >= 0) {
    all[idx] = conversation;
  } else {
    all.unshift(conversation);
  }
  localStorage.setItem("zbk_conversations", JSON.stringify(all));
}

export async function getConversations(): Promise<Conversation[]> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    const rows = await sql`
      SELECT id, title, messages, model, created_at, updated_at
      FROM flywheel_conversations
      ORDER BY updated_at DESC
    `;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      messages: typeof r.messages === "string" ? JSON.parse(r.messages) : r.messages,
      model: r.model as string,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    }));
  }

  if (typeof window === "undefined") return [];
  const all: Conversation[] = JSON.parse(localStorage.getItem("zbk_conversations") || "[]");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getConversation(id: string): Promise<Conversation | null> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    const rows = await sql`
      SELECT id, title, messages, model, created_at, updated_at
      FROM flywheel_conversations
      WHERE id = ${id}
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id as string,
      title: r.title as string,
      messages: typeof r.messages === "string" ? JSON.parse(r.messages) : r.messages,
      model: r.model as string,
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
    };
  }

  if (typeof window === "undefined") return null;
  const all: Conversation[] = JSON.parse(localStorage.getItem("zbk_conversations") || "[]");
  return all.find((c) => c.id === id) ?? null;
}

export async function deleteConversation(id: string): Promise<void> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    await sql`DELETE FROM flywheel_conversations WHERE id = ${id}`;
    return;
  }

  if (typeof window === "undefined") return;
  const all: Conversation[] = JSON.parse(localStorage.getItem("zbk_conversations") || "[]");
  const filtered = all.filter((c) => c.id !== id);
  localStorage.setItem("zbk_conversations", JSON.stringify(filtered));
}

// ---------------------------------------------------------------------------
// Memory Entries
// ---------------------------------------------------------------------------

export async function addMemory(
  type: MemoryEntry["type"],
  content: string
): Promise<MemoryEntry> {
  const entry: MemoryEntry = {
    id: generateId(),
    type,
    content,
    createdAt: Date.now(),
  };

  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    await sql`
      INSERT INTO flywheel_memories (id, type, content, created_at)
      VALUES (${entry.id}, ${entry.type}, ${entry.content}, ${entry.createdAt})
    `;
    return entry;
  }

  if (typeof window !== "undefined") {
    const all: MemoryEntry[] = JSON.parse(localStorage.getItem("zbk_memories") || "[]");
    all.unshift(entry);
    localStorage.setItem("zbk_memories", JSON.stringify(all));
  }

  return entry;
}

export async function getMemories(type?: MemoryEntry["type"]): Promise<MemoryEntry[]> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    const rows = type
      ? await sql`SELECT id, type, content, created_at FROM flywheel_memories WHERE type = ${type} ORDER BY created_at DESC`
      : await sql`SELECT id, type, content, created_at FROM flywheel_memories ORDER BY created_at DESC`;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      type: r.type as MemoryEntry["type"],
      content: r.content as string,
      createdAt: Number(r.created_at),
    }));
  }

  if (typeof window === "undefined") return [];
  const all: MemoryEntry[] = JSON.parse(localStorage.getItem("zbk_memories") || "[]");
  const filtered = type ? all.filter((m) => m.type === type) : all;
  return filtered.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteMemory(id: string): Promise<void> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    await sql`DELETE FROM flywheel_memories WHERE id = ${id}`;
    return;
  }

  if (typeof window === "undefined") return;
  const all: MemoryEntry[] = JSON.parse(localStorage.getItem("zbk_memories") || "[]");
  const filtered = all.filter((m) => m.id !== id);
  localStorage.setItem("zbk_memories", JSON.stringify(filtered));
}

// ---------------------------------------------------------------------------
// Build History
// ---------------------------------------------------------------------------

export async function saveBuild(record: BuildRecord): Promise<void> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    await sql`
      INSERT INTO flywheel_builds (id, prompt, site_name, model, duration_ms, created_at)
      VALUES (
        ${record.id},
        ${record.prompt},
        ${record.siteName},
        ${record.model},
        ${record.durationMs},
        ${record.createdAt}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    return;
  }

  if (typeof window === "undefined") return;
  const all: BuildRecord[] = JSON.parse(localStorage.getItem("zbk_builds") || "[]");
  all.unshift(record);
  if (all.length > 500) all.length = 500;
  localStorage.setItem("zbk_builds", JSON.stringify(all));
}

export async function getBuilds(limit = 50): Promise<BuildRecord[]> {
  if (await dbAvailable()) {
    const { sql } = await import("@/lib/db");
    const rows = await sql`
      SELECT id, prompt, site_name, model, duration_ms, created_at
      FROM flywheel_builds
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      prompt: r.prompt as string,
      siteName: r.site_name as string,
      model: r.model as string,
      durationMs: Number(r.duration_ms),
      createdAt: Number(r.created_at),
    }));
  }

  if (typeof window === "undefined") return [];
  const all: BuildRecord[] = JSON.parse(localStorage.getItem("zbk_builds") || "[]");
  return all.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}
