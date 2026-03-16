// ---------------------------------------------------------------------------
// Real-Time Collaboration — Room & Presence Management
//
// Uses database-backed rooms with poll-based presence (serverless-compatible).
// Presence heartbeat: every 3s. Stale after 10s. Cleanup on poll.
// ---------------------------------------------------------------------------

export interface CollabRoom {
  id: string;
  slug: string;           // Site slug or project ID
  owner_email: string;
  created_at: string;
  invite_code: string;    // Short code for sharing
}

export interface CollabParticipant {
  id: string;
  room_id: string;
  user_email: string;
  user_name: string;
  color: string;          // Assigned cursor color
  cursor_x: number | null;
  cursor_y: number | null;
  cursor_element: string | null;  // CSS selector of hovered element
  last_heartbeat: string;
  is_active: boolean;
}

export interface CollabCodeSync {
  room_id: string;
  html: string;
  version: number;
  updated_by: string;
  updated_at: string;
}

// Participant cursor colors — assigned in join order
const CURSOR_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
];

export function getParticipantColor(index: number): string {
  return CURSOR_COLORS[index % CURSOR_COLORS.length];
}

// Generate a short invite code (6 chars, alphanumeric)
export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Presence is stale after this many seconds
export const PRESENCE_STALE_SECONDS = 10;
// Heartbeat interval (client-side, polling mode)
export const HEARTBEAT_INTERVAL_MS = 3000;
// Presence poll interval (client-side, polling mode)
export const PRESENCE_POLL_MS = 2000;
// WebSocket heartbeat interval (less frequent — WS has built-in keep-alive)
export const WS_HEARTBEAT_INTERVAL_MS = 15000;
// WebSocket reconnect max attempts before falling back to polling
export const WS_MAX_RECONNECT_ATTEMPTS = 5;
