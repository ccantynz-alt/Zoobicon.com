// In-memory collab room registry. Future Y.js layer plugs into this contract.
// No external deps — pure TS store so the front-end and API routes can build against
// a stable interface before we wire y-websocket.

export interface CollabParticipant {
  id: string;
  name: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: number;
}

export interface CollabRoom {
  id: string;
  ownerId: string;
  createdAt: number;
  participants: Map<string, CollabParticipant>;
  state: { files: Record<string, string>; version: number };
}

const PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#f43f5e",
];

const rooms = new Map<string, CollabRoom>();

function genId(): string {
  let out = "";
  while (out.length < 12) {
    out += Math.random().toString(36).slice(2);
  }
  return out.slice(0, 12);
}

export function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function createRoom(ownerId: string): CollabRoom {
  const room: CollabRoom = {
    id: genId(),
    ownerId,
    createdAt: Date.now(),
    participants: new Map(),
    state: { files: {}, version: 0 },
  };
  rooms.set(room.id, room);
  return room;
}

export function getRoom(id: string): CollabRoom | undefined {
  return rooms.get(id);
}

export function deleteRoom(id: string): boolean {
  return rooms.delete(id);
}

export function joinRoom(
  roomId: string,
  participant: Omit<CollabParticipant, "lastSeen">,
): CollabRoom | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.participants.set(participant.id, { ...participant, lastSeen: Date.now() });
  return room;
}

export function leaveRoom(roomId: string, participantId: string): void {
  const room = rooms.get(roomId);
  if (!room) return;
  room.participants.delete(participantId);
}

export function updatePresence(
  roomId: string,
  participantId: string,
  cursor?: { x: number; y: number },
): void {
  const room = rooms.get(roomId);
  if (!room) return;
  const p = room.participants.get(participantId);
  if (!p) return;
  p.lastSeen = Date.now();
  if (cursor) p.cursor = cursor;
}

export function pruneStale(maxAgeMs: number = 30000): void {
  const now = Date.now();
  for (const room of rooms.values()) {
    for (const [pid, p] of room.participants) {
      if (now - p.lastSeen > maxAgeMs) room.participants.delete(pid);
    }
  }
}

export function listActiveRooms(): Array<{
  id: string;
  ownerId: string;
  participantCount: number;
  createdAt: number;
}> {
  return Array.from(rooms.values()).map((r) => ({
    id: r.id,
    ownerId: r.ownerId,
    participantCount: r.participants.size,
    createdAt: r.createdAt,
  }));
}

export function serializeParticipants(room: CollabRoom): CollabParticipant[] {
  return Array.from(room.participants.values());
}
