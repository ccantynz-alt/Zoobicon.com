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

// ---------------------------------------------------------------------------
// Intelligence Accumulation — Auto-extract learnable facts from interactions
// ---------------------------------------------------------------------------

interface ExtractionPattern {
  /** RegExp to test against the combined text (case-insensitive). */
  regex: RegExp;
  /** Memory type to assign. */
  type: MemoryEntry["type"];
  /** Function that turns RegExp match groups into a normalized fact string. */
  normalize: (match: RegExpExecArray) => string;
}

/**
 * Extraction rules — ordered list of patterns that pull learnable facts out of
 * free-form user messages. Each rule produces a short, normalized memory string
 * (e.g. "Brand color: blue") so downstream prompt injection stays compact.
 *
 * Only the *user* message is scanned — the assistant response is intentionally
 * ignored to avoid feeding our own outputs back in as "user preferences."
 */
const EXTRACTION_PATTERNS: ExtractionPattern[] = [
  // ── Brand facts ─────────────────────────────────────────────────────────
  {
    regex: /(?:my|our)\s+(?:brand|company|business)\s+(?:name\s+is|is\s+called|is)\s+["']?([A-Za-z0-9][\w\s&.'-]{0,60})["']?/i,
    type: "brand",
    normalize: (m) => `Company name: ${m[1].trim()}`,
  },
  {
    regex: /(?:my|our)\s+(?:brand|primary|main|accent)?\s*colou?r\s+(?:is|should be|=)\s+["']?(#?[A-Za-z0-9]+(?:\s?[A-Za-z]*)?)["']?/i,
    type: "brand",
    normalize: (m) => `Brand color: ${m[1].trim()}`,
  },
  {
    regex: /(?:we|I)\s+use\s+(?:the\s+)?(?:font|typeface)\s+["']?([A-Za-z][\w\s-]{0,40})["']?/i,
    type: "brand",
    normalize: (m) => `Font: ${m[1].trim()}`,
  },
  {
    regex: /(?:my|our)\s+(?:brand\s+)?(?:font|typeface)\s+is\s+["']?([A-Za-z][\w\s-]{0,40})["']?/i,
    type: "brand",
    normalize: (m) => `Font: ${m[1].trim()}`,
  },
  {
    regex: /(?:my|our)\s+(?:logo|brand\s+logo)\s+(?:is|looks like|shows|features)\s+(.{3,80})/i,
    type: "brand",
    normalize: (m) => `Logo: ${m[1].trim().replace(/[.!]+$/, "")}`,
  },
  {
    regex: /(?:my|our)\s+(?:tagline|slogan|motto)\s+is\s+["'](.{3,100})["']/i,
    type: "brand",
    normalize: (m) => `Tagline: ${m[1].trim()}`,
  },

  // ── Style / design preferences ──────────────────────────────────────────
  {
    regex: /I\s+(?:prefer|like|want|love)\s+(?:a\s+)?(?:the\s+)?(dark\s*(?:mode|theme)?|light\s*(?:mode|theme)?|minimalist?|modern|professional|playful|corporate|elegant|bold|clean|luxury|vintage|retro)\s/i,
    type: "preference",
    normalize: (m) => `Style: ${m[1].trim().toLowerCase()}`,
  },
  {
    regex: /(?:my|our)\s+(?:website|site|design|style)\s+(?:should|needs?\s+to|must)\s+(?:be|have|look|feel)\s+(.{3,80})/i,
    type: "preference",
    normalize: (m) => `Design preference: ${m[1].trim().replace(/[.!]+$/, "")}`,
  },
  {
    regex: /(?:prefer|want|like)\s+(?:a\s+)?(serif|sans-serif|monospace)\s/i,
    type: "preference",
    normalize: (m) => `Typography preference: ${m[1].trim().toLowerCase()}`,
  },
  {
    regex: /(?:prefer|want|like)\s+(?:a\s+)?(single[- ]page|multi[- ]page|one[- ]page|landing\s+page)\s/i,
    type: "preference",
    normalize: (m) => `Layout preference: ${m[1].trim().toLowerCase()}`,
  },

  // ── Industry / business context ─────────────────────────────────────────
  {
    regex: /I\s+(?:run|own|manage|operate|have)\s+(?:a|an|the)\s+([A-Za-z][\w\s&'-]{2,60}?)(?:\s+(?:business|company|shop|store|clinic|firm|agency|studio|practice|restaurant|cafe|salon))/i,
    type: "context",
    normalize: (m) => {
      const industry = m[0].replace(/^I\s+(?:run|own|manage|operate|have)\s+(?:a|an|the)\s+/i, "").trim().replace(/[.!]+$/, "");
      return `Business: ${industry}`;
    },
  },
  {
    regex: /(?:we(?:'re| are)|I(?:'m| am))\s+(?:a|an)\s+(SaaS|e-?commerce|fintech|health\s*tech|ed-?tech|real\s+estate|marketing|consulting|freelanc(?:e|ing)|design|dental|medical|legal|accounting|fitness|photography|construction|retail|wholesale|nonprofit)(?:\s+(?:startup|company|business|agency|firm|platform))?/i,
    type: "context",
    normalize: (m) => `Industry: ${m[1].trim().toLowerCase()}`,
  },

  // ── Location context ────────────────────────────────────────────────────
  {
    regex: /(?:we(?:'re| are)|I(?:'m| am)|we're|I'm)\s+(?:based|located|headquartered)\s+in\s+([A-Za-z][\w\s,'-]{2,60})/i,
    type: "context",
    normalize: (m) => `Location: ${m[1].trim().replace(/[.!]+$/, "")}`,
  },
  {
    regex: /(?:my|our)\s+(?:business|company|office|shop|store)\s+is\s+in\s+([A-Za-z][\w\s,'-]{2,60})/i,
    type: "context",
    normalize: (m) => `Location: ${m[1].trim().replace(/[.!]+$/, "")}`,
  },

  // ── Target audience context ─────────────────────────────────────────────
  {
    regex: /(?:my|our)\s+(?:target\s+)?(?:audience|customers?|clients?|users?)\s+(?:are|is)\s+(.{3,80})/i,
    type: "context",
    normalize: (m) => `Audience: ${m[1].trim().replace(/[.!]+$/, "")}`,
  },
];

/**
 * Check whether a candidate fact is already stored (simple case-insensitive
 * substring match). Returns true if a duplicate exists.
 */
function isDuplicate(candidate: string, existing: MemoryEntry[]): boolean {
  const lower = candidate.toLowerCase();
  return existing.some((m) => {
    const existingLower = m.content.toLowerCase();
    // Exact match
    if (existingLower === lower) return true;
    // The new fact is a substring of an existing memory or vice-versa
    if (existingLower.includes(lower) || lower.includes(existingLower)) return true;
    // Same prefix key (e.g. both start with "Brand color:")
    const colonIdx = lower.indexOf(":");
    if (colonIdx > 0) {
      const prefix = lower.slice(0, colonIdx + 1);
      if (existingLower.startsWith(prefix)) return true;
    }
    return false;
  });
}

/**
 * Analyze a user message for learnable facts and store unique ones as
 * MemoryEntry records. Designed to be called on every interaction — it uses
 * fast regex matching (no AI call) and deduplicates against existing memories.
 *
 * @param userMessage   The raw user message from the current interaction.
 * @param _assistantResponse  The assistant response (reserved for future use;
 *                            currently unused to avoid self-referential loops).
 * @returns Promise that resolves once all extracted memories have been stored.
 */
export async function extractAndStoreMemories(
  userMessage: string,
  _assistantResponse: string
): Promise<void> {
  if (!userMessage || userMessage.trim().length < 8) return;

  // Fetch existing memories once to check for duplicates
  const existing = await getMemories();

  const candidates: Array<{ type: MemoryEntry["type"]; content: string }> = [];

  for (const pattern of EXTRACTION_PATTERNS) {
    const match = pattern.regex.exec(userMessage);
    if (!match) continue;

    let fact: string;
    try {
      fact = pattern.normalize(match);
    } catch {
      continue;
    }

    // Sanity-check: skip empty or extremely long facts
    if (!fact || fact.length < 5 || fact.length > 200) continue;

    // Deduplicate against existing memories AND against other candidates from
    // this same extraction pass
    const allExisting = [
      ...existing,
      ...candidates.map((c) => ({ id: "", type: c.type, content: c.content, createdAt: 0 })),
    ];

    if (isDuplicate(fact, allExisting)) continue;

    candidates.push({ type: pattern.type, content: fact });

    // Hard cap: max 3 new memories per interaction
    if (candidates.length >= 3) break;
  }

  // Store all candidates
  for (const c of candidates) {
    await addMemory(c.type, c.content);
  }
}

/**
 * Build a concise context string from all stored memories, suitable for
 * injection into AI system prompts. Groups facts by type and caps total
 * length at 500 characters.
 *
 * @returns A formatted context block, or empty string if no memories exist.
 *
 * Example output:
 *   "Brand: Company name: Acme Corp; Brand color: #E8D4B0.
 *    Preferences: Style: dark mode; Typography preference: sans-serif.
 *    Context: Industry: saas; Location: Auckland, NZ."
 */
export async function getFlywheelContext(): Promise<string> {
  const memories = await getMemories();
  if (memories.length === 0) return "";

  const MAX_LENGTH = 500;

  const groups: Record<string, string[]> = {
    brand: [],
    preference: [],
    instruction: [],
    context: [],
  };

  for (const m of memories) {
    if (groups[m.type]) {
      groups[m.type].push(m.content);
    }
  }

  // Human-readable labels for each group
  const labels: Record<string, string> = {
    brand: "Brand",
    preference: "Preferences",
    instruction: "Instructions",
    context: "Context",
  };

  const sections: string[] = [];
  for (const key of ["brand", "preference", "instruction", "context"]) {
    const items = groups[key];
    if (items.length === 0) continue;
    sections.push(`${labels[key]}: ${items.join("; ")}.`);
  }

  let result = sections.join(" ");

  // Truncate at word boundary if over limit
  if (result.length > MAX_LENGTH) {
    const truncated = result.slice(0, MAX_LENGTH);
    const lastSpace = truncated.lastIndexOf(" ");
    result = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "...";
  }

  return result;
}
