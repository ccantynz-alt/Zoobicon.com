// ---------------------------------------------------------------------------
// WebSocket Collaboration Server
//
// Manages real-time collaboration rooms via WebSocket connections.
// Provides <50ms latency for cursor positions and code sync vs the
// previous 2-3s poll-based approach.
//
// Protocol:
//   Client → Server:
//     { type: "join", roomId, email, name, participantId }
//     { type: "cursor", cursorX, cursorY, cursorElement }
//     { type: "code", html, expectedVersion }
//     { type: "heartbeat" }
//     { type: "leave" }
//
//   Server → Client:
//     { type: "joined", participantId, color, participants }
//     { type: "participant_joined", participant }
//     { type: "participant_left", participantId, email }
//     { type: "cursor_update", participantId, email, name, color, cursorX, cursorY, cursorElement }
//     { type: "code_update", html, version, updatedBy }
//     { type: "code_conflict", serverVersion }
//     { type: "error", message }
//
// Deployment:
//   This module works with any WebSocket-capable server (Railway, Fly.io,
//   AWS ECS, custom Node server). On Vercel serverless, the client
//   automatically falls back to the poll-based approach.
// ---------------------------------------------------------------------------

import { getParticipantColor } from "./collaboration";

export interface WSParticipant {
  id: string;
  email: string;
  name: string;
  color: string;
  cursorX: number | null;
  cursorY: number | null;
  cursorElement: string | null;
  ws: WebSocket;
  lastHeartbeat: number;
}

export interface WSRoom {
  id: string;
  participants: Map<string, WSParticipant>; // keyed by participantId
  code: string;
  codeVersion: number;
  codeUpdatedBy: string;
}

// In-memory room state (process-level singleton)
const rooms = new Map<string, WSRoom>();

// Stale connection timeout (30s without heartbeat)
const STALE_TIMEOUT_MS = 30_000;

// Cleanup interval (every 15s)
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of rooms) {
      for (const [pid, p] of room.participants) {
        if (now - p.lastHeartbeat > STALE_TIMEOUT_MS) {
          removeParticipant(roomId, pid);
        }
      }
      // Remove empty rooms
      if (room.participants.size === 0) {
        rooms.delete(roomId);
      }
    }
    // Stop cleanup if no rooms
    if (rooms.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  }, 15_000);
}

function broadcast(room: WSRoom, message: Record<string, unknown>, excludeId?: string) {
  const data = JSON.stringify(message);
  for (const [pid, p] of room.participants) {
    if (pid === excludeId) continue;
    try {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(data);
      }
    } catch {
      // Connection dead, will be cleaned up
    }
  }
}

function removeParticipant(roomId: string, participantId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const participant = room.participants.get(participantId);
  if (!participant) return;

  room.participants.delete(participantId);

  // Notify others
  broadcast(room, {
    type: "participant_left",
    participantId,
    email: participant.email,
  });

  // Try to close the WebSocket
  try {
    participant.ws.close(1000, "Left room");
  } catch {
    // Already closed
  }
}

function getParticipantList(room: WSRoom, excludeId?: string) {
  const list: Array<{
    id: string;
    email: string;
    name: string;
    color: string;
    cursorX: number | null;
    cursorY: number | null;
    cursorElement: string | null;
  }> = [];

  for (const [pid, p] of room.participants) {
    if (pid === excludeId) continue;
    list.push({
      id: p.id,
      email: p.email,
      name: p.name,
      color: p.color,
      cursorX: p.cursorX,
      cursorY: p.cursorY,
      cursorElement: p.cursorElement,
    });
  }
  return list;
}

/**
 * Handle a new WebSocket connection for collaboration.
 * Call this from your WebSocket server's connection handler.
 */
export function handleWSConnection(ws: WebSocket) {
  let currentRoomId: string | null = null;
  let currentParticipantId: string | null = null;

  ws.addEventListener("message", (event) => {
    try {
      const msg = JSON.parse(typeof event.data === "string" ? event.data : "{}");

      switch (msg.type) {
        case "join": {
          const { roomId, email, name, participantId } = msg;
          if (!roomId || !email) {
            ws.send(JSON.stringify({ type: "error", message: "roomId and email required" }));
            return;
          }

          // Get or create room
          if (!rooms.has(roomId)) {
            rooms.set(roomId, {
              id: roomId,
              participants: new Map(),
              code: "",
              codeVersion: 0,
              codeUpdatedBy: "",
            });
          }

          const room = rooms.get(roomId)!;
          const pid = participantId || `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const color = getParticipantColor(room.participants.size);

          const participant: WSParticipant = {
            id: pid,
            email,
            name: name || "",
            color,
            cursorX: null,
            cursorY: null,
            cursorElement: null,
            ws,
            lastHeartbeat: Date.now(),
          };

          room.participants.set(pid, participant);
          currentRoomId = roomId;
          currentParticipantId = pid;

          ensureCleanup();

          // Send join confirmation with current participants
          ws.send(JSON.stringify({
            type: "joined",
            participantId: pid,
            color,
            participants: getParticipantList(room, pid),
            code: room.code,
            codeVersion: room.codeVersion,
          }));

          // Notify others
          broadcast(room, {
            type: "participant_joined",
            participant: {
              id: pid,
              email,
              name: name || "",
              color,
              cursorX: null,
              cursorY: null,
              cursorElement: null,
            },
          }, pid);
          break;
        }

        case "cursor": {
          if (!currentRoomId || !currentParticipantId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const p = room.participants.get(currentParticipantId);
          if (!p) return;

          p.cursorX = msg.cursorX ?? null;
          p.cursorY = msg.cursorY ?? null;
          p.cursorElement = msg.cursorElement ?? null;
          p.lastHeartbeat = Date.now();

          // Broadcast cursor to others
          broadcast(room, {
            type: "cursor_update",
            participantId: currentParticipantId,
            email: p.email,
            name: p.name,
            color: p.color,
            cursorX: p.cursorX,
            cursorY: p.cursorY,
            cursorElement: p.cursorElement,
          }, currentParticipantId);
          break;
        }

        case "code": {
          if (!currentRoomId || !currentParticipantId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;

          const p = room.participants.get(currentParticipantId);
          if (!p) return;
          p.lastHeartbeat = Date.now();

          // Optimistic concurrency
          if (msg.expectedVersion !== undefined && msg.expectedVersion !== room.codeVersion) {
            ws.send(JSON.stringify({
              type: "code_conflict",
              serverVersion: room.codeVersion,
            }));
            return;
          }

          room.codeVersion += 1;
          room.code = msg.html;
          room.codeUpdatedBy = p.email;

          // Confirm to sender
          ws.send(JSON.stringify({
            type: "code_ack",
            version: room.codeVersion,
          }));

          // Broadcast to others
          broadcast(room, {
            type: "code_update",
            html: msg.html,
            version: room.codeVersion,
            updatedBy: p.email,
          }, currentParticipantId);
          break;
        }

        case "heartbeat": {
          if (!currentRoomId || !currentParticipantId) return;
          const room = rooms.get(currentRoomId);
          if (!room) return;
          const p = room.participants.get(currentParticipantId);
          if (p) p.lastHeartbeat = Date.now();
          break;
        }

        case "leave": {
          if (currentRoomId && currentParticipantId) {
            removeParticipant(currentRoomId, currentParticipantId);
          }
          currentRoomId = null;
          currentParticipantId = null;
          break;
        }
      }
    } catch (err) {
      console.error("WS message error:", err);
    }
  });

  ws.addEventListener("close", () => {
    if (currentRoomId && currentParticipantId) {
      removeParticipant(currentRoomId, currentParticipantId);
    }
  });

  ws.addEventListener("error", () => {
    if (currentRoomId && currentParticipantId) {
      removeParticipant(currentRoomId, currentParticipantId);
    }
  });
}

/**
 * Get the in-memory rooms map (for debugging/monitoring).
 */
export function getActiveRooms() {
  const result: Array<{ id: string; participantCount: number; codeVersion: number }> = [];
  for (const [id, room] of rooms) {
    result.push({
      id,
      participantCount: room.participants.size,
      codeVersion: room.codeVersion,
    });
  }
  return result;
}
