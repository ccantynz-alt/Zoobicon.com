/**
 * Real-Time Collaborative Editing Engine
 *
 * Multiple users editing the same site simultaneously.
 * Like Google Docs for website building.
 *
 * Architecture:
 *   - Each project gets a "room" with a unique invite code
 *   - Participants join via invite link
 *   - Changes sync via Server-Sent Events (SSE) polling
 *   - Each participant has a colored cursor visible to others
 *   - Conflict resolution: last-write-wins with operational transform
 *
 * Database tables (already created in db.ts):
 *   - collab_rooms: room_id, slug, owner_email, invite_code
 *   - collab_participants: room_id, user_email, color, cursor position
 *   - collab_code_sync: room_id, html/code, version number
 */

import { sql } from "./db";

export interface CollabRoom {
  id: string;
  slug: string;
  ownerEmail: string;
  inviteCode: string;
  createdAt: Date;
}

export interface CollabParticipant {
  id: string;
  roomId: string;
  email: string;
  name: string;
  color: string;
  cursorX?: number;
  cursorY?: number;
  cursorElement?: string;
  isActive: boolean;
  lastHeartbeat: Date;
}

export interface CollabState {
  code: string;
  version: number;
  updatedBy: string;
  updatedAt: Date;
}

// Participant colors — assigned sequentially
const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

/**
 * Create a new collaboration room for a project.
 */
export async function createRoom(
  slug: string,
  ownerEmail: string
): Promise<CollabRoom> {
  const inviteCode = generateInviteCode();

  const [room] = await sql`
    INSERT INTO collab_rooms (slug, owner_email, invite_code)
    VALUES (${slug}, ${ownerEmail}, ${inviteCode})
    RETURNING id, slug, owner_email, invite_code, created_at
  `;

  return {
    id: room.id as string,
    slug: room.slug as string,
    ownerEmail: room.owner_email as string,
    inviteCode: room.invite_code as string,
    createdAt: room.created_at as Date,
  };
}

/**
 * Join an existing room via invite code.
 */
export async function joinRoom(
  inviteCode: string,
  email: string,
  name: string
): Promise<{ room: CollabRoom; participant: CollabParticipant }> {
  const [room] = await sql`
    SELECT id, slug, owner_email, invite_code, created_at
    FROM collab_rooms WHERE invite_code = ${inviteCode}
  `;

  if (!room) throw new Error("Invalid invite code");

  // Count existing participants to assign color
  const participants = await sql`
    SELECT COUNT(*) as count FROM collab_participants WHERE room_id = ${room.id}
  `;
  const colorIndex = (parseInt(participants[0]?.count as string) || 0) % COLORS.length;

  const [participant] = await sql`
    INSERT INTO collab_participants (room_id, user_email, user_name, color)
    VALUES (${room.id}, ${email}, ${name}, ${COLORS[colorIndex]})
    ON CONFLICT (room_id, user_email) DO UPDATE SET
      is_active = true, last_heartbeat = NOW(), user_name = ${name}
    RETURNING id, room_id, user_email, user_name, color, is_active
  `;

  return {
    room: {
      id: room.id as string,
      slug: room.slug as string,
      ownerEmail: room.owner_email as string,
      inviteCode: room.invite_code as string,
      createdAt: room.created_at as Date,
    },
    participant: {
      id: participant.id as string,
      roomId: participant.room_id as string,
      email: participant.user_email as string,
      name: participant.user_name as string,
      color: participant.color as string,
      isActive: true,
      lastHeartbeat: new Date(),
    },
  };
}

/**
 * Update cursor position for a participant.
 */
export async function updateCursor(
  participantId: string,
  cursorX: number,
  cursorY: number,
  cursorElement?: string
): Promise<void> {
  await sql`
    UPDATE collab_participants
    SET cursor_x = ${cursorX}, cursor_y = ${cursorY},
        cursor_element = ${cursorElement || null},
        last_heartbeat = NOW()
    WHERE id = ${participantId}
  `;
}

/**
 * Sync code changes to the room.
 * Uses optimistic concurrency — version number must match.
 */
export async function syncCode(
  roomId: string,
  code: string,
  expectedVersion: number,
  updatedBy: string
): Promise<{ version: number; conflict: boolean }> {
  // Try to update with version check
  const result = await sql`
    UPDATE collab_code_sync
    SET html = ${code}, version = version + 1, updated_by = ${updatedBy}, updated_at = NOW()
    WHERE room_id = ${roomId} AND version = ${expectedVersion}
    RETURNING version
  `;

  if (result.length === 0) {
    // Version conflict — someone else edited
    const [current] = await sql`
      SELECT version FROM collab_code_sync WHERE room_id = ${roomId}
    `;
    return { version: current?.version as number || 0, conflict: true };
  }

  return { version: result[0].version as number, conflict: false };
}

/**
 * Get current room state — all participants and latest code.
 */
export async function getRoomState(roomId: string): Promise<{
  participants: CollabParticipant[];
  code: CollabState;
}> {
  const participants = await sql`
    SELECT id, room_id, user_email, user_name, color, cursor_x, cursor_y,
           cursor_element, is_active, last_heartbeat
    FROM collab_participants
    WHERE room_id = ${roomId} AND is_active = true
      AND last_heartbeat > NOW() - INTERVAL '2 minutes'
  `;

  const [codeRow] = await sql`
    SELECT html, version, updated_by, updated_at
    FROM collab_code_sync WHERE room_id = ${roomId}
  `;

  return {
    participants: participants.map((p) => ({
      id: p.id as string,
      roomId: p.room_id as string,
      email: p.user_email as string,
      name: p.user_name as string,
      color: p.color as string,
      cursorX: p.cursor_x as number | undefined,
      cursorY: p.cursor_y as number | undefined,
      cursorElement: p.cursor_element as string | undefined,
      isActive: p.is_active as boolean,
      lastHeartbeat: p.last_heartbeat as Date,
    })),
    code: {
      code: (codeRow?.html as string) || "",
      version: (codeRow?.version as number) || 0,
      updatedBy: (codeRow?.updated_by as string) || "",
      updatedAt: (codeRow?.updated_at as Date) || new Date(),
    },
  };
}

/**
 * Heartbeat — mark participant as still active.
 */
export async function heartbeat(participantId: string): Promise<void> {
  await sql`
    UPDATE collab_participants
    SET last_heartbeat = NOW(), is_active = true
    WHERE id = ${participantId}
  `;
}

/**
 * Leave a room.
 */
export async function leaveRoom(participantId: string): Promise<void> {
  await sql`
    UPDATE collab_participants SET is_active = false WHERE id = ${participantId}
  `;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
