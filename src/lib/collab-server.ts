/**
 * Collab server primitives — Sprint 4 T7.
 *
 * Backs the client-side collaboration hook (src/hooks/useCollaboration.ts)
 * and CollaborationBar. Rooms persisted in Neon Postgres; presence +
 * code state updates via REST (no WebSocket on Vercel serverless —
 * the polling cadence baked into useCollaboration.ts is sub-3s which
 * is fine for cursor sync + code diff propagation).
 *
 * Schema (auto-created on first call):
 *
 *   collab_rooms
 *     id           UUID PK
 *     slug         TEXT  (the prompt/build slug; one room per build)
 *     invite_code  TEXT UNIQUE  (8-char human-readable code)
 *     created_at   TIMESTAMPTZ
 *     code_html    TEXT  (latest snapshot for late-joiners)
 *     code_version INTEGER
 *     last_updated TIMESTAMPTZ
 *
 *   collab_participants
 *     id              UUID PK
 *     room_id         UUID → collab_rooms.id
 *     email           TEXT
 *     name            TEXT
 *     color           TEXT  (hex; assigned at join time)
 *     cursor_x        INTEGER NULL
 *     cursor_y        INTEGER NULL
 *     cursor_element  TEXT NULL
 *     last_seen       TIMESTAMPTZ
 *     UNIQUE (room_id, email)
 *
 * Participants are considered "active" if last_seen is within 30s.
 * GC happens lazily on every presence read (deletes participants
 * older than 5 minutes).
 */

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

export async function ensureCollabTables(): Promise<void> {
  const sql = getDb();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS collab_rooms (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug          TEXT NOT NULL,
      invite_code   TEXT NOT NULL UNIQUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      code_html     TEXT,
      code_version  INTEGER NOT NULL DEFAULT 0,
      last_updated  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS collab_participants (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id        UUID NOT NULL REFERENCES collab_rooms(id) ON DELETE CASCADE,
      email          TEXT NOT NULL,
      name           TEXT NOT NULL,
      color          TEXT NOT NULL,
      cursor_x       INTEGER,
      cursor_y       INTEGER,
      cursor_element TEXT,
      last_seen      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (room_id, email)
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS collab_participants_room_idx
      ON collab_participants (room_id, last_seen)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS collab_rooms_invite_idx
      ON collab_rooms (invite_code)
  `;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const PARTICIPANT_COLORS = [
  "#b8923f", // gold
  "#dc2626", // red
  "#059669", // emerald
  "#7c3aed", // violet
  "#0ea5e9", // sky
  "#db2777", // pink
  "#ea580c", // orange
  "#0891b2", // cyan
];

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PARTICIPANT_COLORS[hash % PARTICIPANT_COLORS.length];
}

function generateInviteCode(): string {
  // 8-char URL-safe base32-ish — easy to read aloud.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 8; i++) {
    code += alphabet[buf[i] % alphabet.length];
  }
  return code;
}

// ─────────────────────────────────────────────────────────────────────
// Public surface — matches the hook's expected response shapes.
// ─────────────────────────────────────────────────────────────────────

export interface CollabRoomRow {
  id: string;
  slug: string;
  invite_code: string;
  code_html: string | null;
  code_version: number;
}

export interface CollabParticipantRow {
  id: string;
  user_email: string;
  user_name: string;
  color: string;
  cursor_x: number | null;
  cursor_y: number | null;
  cursor_element: string | null;
  is_active: boolean;
}

export async function createRoom(input: {
  slug: string;
  email: string;
  name: string;
}): Promise<{ room: CollabRoomRow; participantId: string; color: string }> {
  const sql = getDb();
  if (!sql) throw new Error("DATABASE_URL not set");

  let inviteCode = generateInviteCode();
  // 4 retries on the (extremely rare) UNIQUE collision.
  for (let attempt = 0; attempt < 4; attempt++) {
    const existing = (await sql`
      SELECT id FROM collab_rooms WHERE invite_code = ${inviteCode} LIMIT 1
    `) as Array<{ id: string }>;
    if (existing.length === 0) break;
    inviteCode = generateInviteCode();
  }

  const rooms = (await sql`
    INSERT INTO collab_rooms (slug, invite_code)
    VALUES (${input.slug}, ${inviteCode})
    RETURNING id, slug, invite_code, code_html, code_version
  `) as CollabRoomRow[];
  const room = rooms[0];

  const participantId = randomUUID();
  const color = pickColor(input.email);
  await sql`
    INSERT INTO collab_participants (id, room_id, email, name, color)
    VALUES (${participantId}, ${room.id}, ${input.email}, ${input.name}, ${color})
    ON CONFLICT (room_id, email) DO UPDATE
      SET name = EXCLUDED.name, last_seen = NOW()
  `;

  return { room, participantId, color };
}

export async function joinRoom(input: {
  inviteCode: string;
  email: string;
  name: string;
}): Promise<{ room: CollabRoomRow; participantId: string; color: string } | null> {
  const sql = getDb();
  if (!sql) throw new Error("DATABASE_URL not set");

  const rooms = (await sql`
    SELECT id, slug, invite_code, code_html, code_version
    FROM collab_rooms
    WHERE invite_code = ${input.inviteCode}
    LIMIT 1
  `) as CollabRoomRow[];
  if (rooms.length === 0) return null;
  const room = rooms[0];

  const color = pickColor(input.email);
  const participantId = randomUUID();
  await sql`
    INSERT INTO collab_participants (id, room_id, email, name, color)
    VALUES (${participantId}, ${room.id}, ${input.email}, ${input.name}, ${color})
    ON CONFLICT (room_id, email) DO UPDATE
      SET name = EXCLUDED.name, last_seen = NOW()
  `;
  return { room, participantId, color };
}

export async function leaveRoom(roomId: string, email: string): Promise<void> {
  const sql = getDb();
  if (!sql) return;
  await sql`
    DELETE FROM collab_participants
    WHERE room_id = ${roomId} AND email = ${email}
  `;
}

export async function listPresence(
  roomId: string,
  excludeParticipantId?: string
): Promise<CollabParticipantRow[]> {
  const sql = getDb();
  if (!sql) return [];

  // Lazy GC — drop participants idle for more than 5 minutes.
  await sql`
    DELETE FROM collab_participants
    WHERE room_id = ${roomId}
      AND last_seen < NOW() - INTERVAL '5 minutes'
  `;

  const rows = (await sql`
    SELECT
      id,
      email AS user_email,
      name AS user_name,
      color,
      cursor_x,
      cursor_y,
      cursor_element,
      (last_seen > NOW() - INTERVAL '30 seconds') AS is_active
    FROM collab_participants
    WHERE room_id = ${roomId}
      AND id != ${excludeParticipantId || ""}
  `) as CollabParticipantRow[];
  return rows;
}

export async function updatePresence(input: {
  participantId: string;
  cursorX?: number | null;
  cursorY?: number | null;
  cursorElement?: string | null;
}): Promise<void> {
  const sql = getDb();
  if (!sql) return;
  await sql`
    UPDATE collab_participants
    SET cursor_x = ${input.cursorX ?? null},
        cursor_y = ${input.cursorY ?? null},
        cursor_element = ${input.cursorElement ?? null},
        last_seen = NOW()
    WHERE id = ${input.participantId}
  `;
}

export interface CodeSyncResult {
  html: string | null;
  version: number;
  updatedAt: string;
}

export async function getCode(roomId: string): Promise<CodeSyncResult | null> {
  const sql = getDb();
  if (!sql) return null;
  const rows = (await sql`
    SELECT code_html AS html, code_version AS version, last_updated AS updated_at
    FROM collab_rooms WHERE id = ${roomId} LIMIT 1
  `) as Array<{ html: string | null; version: number; updated_at: string }>;
  if (rows.length === 0) return null;
  return {
    html: rows[0].html,
    version: rows[0].version,
    updatedAt: rows[0].updated_at,
  };
}

export async function pushCode(input: {
  roomId: string;
  html: string;
  expectedVersion: number;
}): Promise<{ ok: true; version: number } | { ok: false; serverVersion: number }> {
  const sql = getDb();
  if (!sql) return { ok: false, serverVersion: 0 };

  // Optimistic concurrency — only update if the client's expected
  // version matches what the server holds.
  const updated = (await sql`
    UPDATE collab_rooms
    SET code_html = ${input.html},
        code_version = code_version + 1,
        last_updated = NOW()
    WHERE id = ${input.roomId}
      AND code_version = ${input.expectedVersion}
    RETURNING code_version
  `) as Array<{ code_version: number }>;

  if (updated.length === 0) {
    const current = (await sql`
      SELECT code_version FROM collab_rooms WHERE id = ${input.roomId}
    `) as Array<{ code_version: number }>;
    return { ok: false, serverVersion: current[0]?.code_version ?? 0 };
  }
  return { ok: true, version: updated[0].code_version };
}
