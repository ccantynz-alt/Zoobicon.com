import { NextRequest } from "next/server";
import { sql } from "@/lib/db";


/**
 * POST /api/collab/presence — Heartbeat + cursor position update
 *
 * Body: { participantId, cursorX?, cursorY?, cursorElement? }
 */
export async function POST(req: NextRequest) {
  try {
    const { participantId, cursorX, cursorY, cursorElement } = await req.json();

    if (!participantId) {
      return Response.json({ error: "Participant ID required" }, { status: 400 });
    }

    await sql`
      UPDATE collab_participants
      SET
        last_heartbeat = NOW(),
        is_active = true,
        cursor_x = ${cursorX ?? null},
        cursor_y = ${cursorY ?? null},
        cursor_element = ${cursorElement ?? null}
      WHERE id = ${participantId}
    `;

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Presence update error:", err);
    return Response.json({ error: "Failed to update presence" }, { status: 500 });
  }
}

/**
 * GET /api/collab/presence?roomId=xxx&exclude=participantId
 * Returns all active participants with their cursor positions
 */
export async function GET(req: NextRequest) {
  try {
    const roomId = req.nextUrl.searchParams.get("roomId");
    const exclude = req.nextUrl.searchParams.get("exclude");

    if (!roomId) {
      return Response.json({ error: "Room ID required" }, { status: 400 });
    }

    // Mark stale participants
    await sql`
      UPDATE collab_participants
      SET is_active = false
      WHERE room_id = ${roomId}
        AND is_active = true
        AND last_heartbeat < NOW() - INTERVAL '10 seconds'
    `;

    const participants = exclude
      ? await sql`
          SELECT id, user_email, user_name, color, cursor_x, cursor_y, cursor_element, is_active
          FROM collab_participants
          WHERE room_id = ${roomId} AND is_active = true AND id != ${exclude}
          ORDER BY joined_at ASC
        `
      : await sql`
          SELECT id, user_email, user_name, color, cursor_x, cursor_y, cursor_element, is_active
          FROM collab_participants
          WHERE room_id = ${roomId} AND is_active = true
          ORDER BY joined_at ASC
        `;

    return Response.json({ participants });
  } catch (err) {
    console.error("Presence fetch error:", err);
    return Response.json({ error: "Failed to fetch presence" }, { status: 500 });
  }
}
