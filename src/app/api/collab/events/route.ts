import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/**
 * GET /api/collab/events — Server-Sent Events stream for real-time collaboration
 *
 * Replaces 3 separate polling loops (heartbeat, presence, code) with a single
 * SSE connection. Server polls DB at 500ms intervals and pushes deltas.
 *
 * Query params:
 *   roomId: string — the collaboration room ID
 *   participantId: string — the current user's participant ID
 *
 * Event types sent:
 *   presence: { participants: [...] } — when participant list changes
 *   code: { html, version, updated_by } — when code is updated by another user
 *   heartbeat: {} — keep-alive every 15s
 */

export const maxDuration = 300; // 5 minutes max on Vercel Pro

const SSE_POLL_INTERVAL_MS = 500;
const HEARTBEAT_INTERVAL_MS = 15_000;
const STALE_THRESHOLD_S = 10;

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  const participantId = req.nextUrl.searchParams.get("participantId");

  if (!roomId || !participantId) {
    return new Response(
      JSON.stringify({ error: "roomId and participantId are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastParticipantHash = "";
      let lastCodeVersion = 0;
      let lastHeartbeat = Date.now();
      let closed = false;

      // Initial state fetch
      try {
        const [codeSync] = await sql`
          SELECT version FROM collab_code_sync WHERE room_id = ${roomId} LIMIT 1
        `;
        if (codeSync) {
          lastCodeVersion = codeSync.version;
        }
      } catch { /* continue with version 0 */ }

      // Send initial connected event
      controller.enqueue(encoder.encode(sseEvent("connected", { roomId, participantId })));

      const poll = async () => {
        if (closed) return;

        try {
          // 1. Update heartbeat for this participant
          await sql`
            UPDATE collab_participants
            SET last_heartbeat = NOW(), is_active = true
            WHERE id = ${participantId}
          `.catch(() => {});

          // 2. Mark stale participants inactive
          await sql`
            UPDATE collab_participants
            SET is_active = false
            WHERE room_id = ${roomId}
              AND is_active = true
              AND last_heartbeat < NOW() - INTERVAL '10 seconds'
          `.catch(() => {});

          // 3. Check for presence changes
          const participants = await sql`
            SELECT id, user_email, user_name, color, cursor_x, cursor_y, cursor_element, is_active
            FROM collab_participants
            WHERE room_id = ${roomId} AND is_active = true AND id != ${participantId}
            ORDER BY joined_at ASC
          `;

          // Simple hash to detect changes: stringify participant IDs + cursor positions
          const hash = participants
            .map((p: Record<string, unknown>) => `${p.id}:${p.cursor_x}:${p.cursor_y}:${p.is_active}`)
            .join("|");

          if (hash !== lastParticipantHash) {
            lastParticipantHash = hash;
            controller.enqueue(
              encoder.encode(
                sseEvent("presence", {
                  participants: participants.map((p: Record<string, unknown>) => ({
                    id: p.id,
                    user_email: p.user_email,
                    user_name: p.user_name,
                    color: p.color,
                    cursor_x: p.cursor_x,
                    cursor_y: p.cursor_y,
                    cursor_element: p.cursor_element,
                    is_active: p.is_active,
                  })),
                })
              )
            );
          }

          // 4. Check for code updates
          const [codeSync] = await sql`
            SELECT html, version, updated_by, updated_at
            FROM collab_code_sync
            WHERE room_id = ${roomId} AND version > ${lastCodeVersion}
            LIMIT 1
          `;

          if (codeSync && codeSync.updated_by !== participantId) {
            lastCodeVersion = codeSync.version;
            controller.enqueue(
              encoder.encode(
                sseEvent("code", {
                  html: codeSync.html,
                  version: codeSync.version,
                  updated_by: codeSync.updated_by,
                  updated_at: codeSync.updated_at,
                })
              )
            );
          } else if (codeSync) {
            // We pushed this update ourselves — just track the version
            lastCodeVersion = codeSync.version;
          }

          // 5. Send heartbeat keepalive periodically
          if (Date.now() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
            lastHeartbeat = Date.now();
            controller.enqueue(encoder.encode(sseEvent("heartbeat", {})));
          }
        } catch (err) {
          // DB error — send error event but don't close stream
          controller.enqueue(
            encoder.encode(sseEvent("error", { message: "Database poll failed" }))
          );
        }

        // Schedule next poll
        if (!closed) {
          setTimeout(poll, SSE_POLL_INTERVAL_MS);
        }
      };

      // Start polling loop
      poll();

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering
    },
  });
}
