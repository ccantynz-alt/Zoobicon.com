import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { generateInviteCode, getParticipantColor } from "@/lib/collaboration";

/**
 * POST /api/collab — Create or join a collaboration room
 *
 * Body: { action: "create" | "join", slug?, inviteCode?, email, name }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, slug, inviteCode, email, name } = body;

    if (!email) {
      return Response.json({ error: "Email required" }, { status: 400 });
    }

    if (action === "create") {
      if (!slug) {
        return Response.json({ error: "Slug required to create room" }, { status: 400 });
      }

      // Check for existing active room for this slug
      const [existing] = await sql`
        SELECT id, invite_code FROM collab_rooms WHERE slug = ${slug} LIMIT 1
      `;

      if (existing) {
        // Room exists — join it instead
        const participant = await joinRoom(existing.id, email, name || "");
        return Response.json({
          room: { id: existing.id, slug, inviteCode: existing.invite_code },
          participant,
        });
      }

      // Create new room
      const code = generateInviteCode();
      const [room] = await sql`
        INSERT INTO collab_rooms (slug, owner_email, invite_code)
        VALUES (${slug}, ${email}, ${code})
        RETURNING id, slug, owner_email, invite_code, created_at
      `;

      const participant = await joinRoom(room.id, email, name || "");

      return Response.json({
        room: { id: room.id, slug: room.slug, inviteCode: room.invite_code },
        participant,
      });
    }

    if (action === "join") {
      if (!inviteCode) {
        return Response.json({ error: "Invite code required" }, { status: 400 });
      }

      const [room] = await sql`
        SELECT id, slug, invite_code FROM collab_rooms WHERE invite_code = ${inviteCode} LIMIT 1
      `;

      if (!room) {
        return Response.json({ error: "Invalid invite code" }, { status: 404 });
      }

      const participant = await joinRoom(room.id, email, name || "");

      return Response.json({
        room: { id: room.id, slug: room.slug, inviteCode: room.invite_code },
        participant,
      });
    }

    if (action === "leave") {
      const { roomId } = body;
      if (!roomId) {
        return Response.json({ error: "Room ID required" }, { status: 400 });
      }

      await sql`
        UPDATE collab_participants SET is_active = false
        WHERE room_id = ${roomId} AND user_email = ${email}
      `;

      return Response.json({ left: true });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Collab error:", err);
    return Response.json({ error: "Collaboration error" }, { status: 500 });
  }
}

/**
 * GET /api/collab?slug=xxx — Get room info for a slug
 */
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    const inviteCode = req.nextUrl.searchParams.get("invite");

    if (inviteCode) {
      const [room] = await sql`
        SELECT id, slug, owner_email, invite_code FROM collab_rooms WHERE invite_code = ${inviteCode} LIMIT 1
      `;
      if (!room) {
        return Response.json({ error: "Room not found" }, { status: 404 });
      }

      const participants = await getActiveParticipants(room.id);
      return Response.json({ room, participants });
    }

    if (slug) {
      const [room] = await sql`
        SELECT id, slug, owner_email, invite_code FROM collab_rooms WHERE slug = ${slug} LIMIT 1
      `;
      if (!room) {
        return Response.json({ room: null, participants: [] });
      }

      const participants = await getActiveParticipants(room.id);
      return Response.json({ room, participants });
    }

    return Response.json({ error: "Slug or invite code required" }, { status: 400 });
  } catch (err) {
    console.error("Collab GET error:", err);
    return Response.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}

// --- Helpers ---

async function joinRoom(roomId: string, email: string, name: string) {
  // Check if already a participant
  const [existing] = await sql`
    SELECT id, color FROM collab_participants
    WHERE room_id = ${roomId} AND user_email = ${email} LIMIT 1
  `;

  if (existing) {
    // Reactivate
    await sql`
      UPDATE collab_participants
      SET is_active = true, last_heartbeat = NOW(), user_name = ${name || ""}
      WHERE id = ${existing.id}
    `;
    return { id: existing.id, color: existing.color };
  }

  // Count existing participants for color assignment
  const [countResult] = await sql`
    SELECT COUNT(*)::int as count FROM collab_participants WHERE room_id = ${roomId}
  `;
  const color = getParticipantColor(countResult?.count || 0);

  const [participant] = await sql`
    INSERT INTO collab_participants (room_id, user_email, user_name, color)
    VALUES (${roomId}, ${email}, ${name}, ${color})
    RETURNING id, color
  `;

  return { id: participant.id, color: participant.color };
}

async function getActiveParticipants(roomId: string) {
  // Mark stale participants as inactive
  await sql`
    UPDATE collab_participants
    SET is_active = false
    WHERE room_id = ${roomId}
      AND is_active = true
      AND last_heartbeat < NOW() - INTERVAL '10 seconds'
  `;

  return sql`
    SELECT id, user_email, user_name, color, cursor_x, cursor_y, cursor_element, last_heartbeat, is_active
    FROM collab_participants
    WHERE room_id = ${roomId} AND is_active = true
    ORDER BY joined_at ASC
  `;
}
