/**
 * POST /api/collab — create / join / leave a collaboration room.
 *
 * Sprint 4 T7. Backs src/hooks/useCollaboration.ts.
 *
 * Action shapes:
 *   { action: "create", slug, email, name } → { room, participant }
 *   { action: "join",   inviteCode, email, name } → { room, participant } | null
 *   { action: "leave",  roomId, email } → { ok: true }
 */

import { NextResponse } from "next/server";
import {
  ensureCollabTables,
  createRoom,
  joinRoom,
  leaveRoom,
} from "@/lib/collab-server";

export const dynamic = "force-dynamic";

interface Body {
  action?: "create" | "join" | "leave";
  slug?: string;
  inviteCode?: string;
  roomId?: string;
  email?: string;
  name?: string;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  try {
    await ensureCollabTables();

    if (body.action === "create") {
      if (!body.slug || !body.email || !body.name) {
        return NextResponse.json(
          { error: "slug, email, name required for create" },
          { status: 400 }
        );
      }
      const { room, participantId, color } = await createRoom({
        slug: body.slug,
        email: body.email,
        name: body.name,
      });
      return NextResponse.json({
        room: { id: room.id, slug: room.slug, inviteCode: room.invite_code },
        participant: { id: participantId, color },
      });
    }

    if (body.action === "join") {
      if (!body.inviteCode || !body.email || !body.name) {
        return NextResponse.json(
          { error: "inviteCode, email, name required for join" },
          { status: 400 }
        );
      }
      const result = await joinRoom({
        inviteCode: body.inviteCode,
        email: body.email,
        name: body.name,
      });
      if (!result) {
        return NextResponse.json(
          { error: "No room found for that invite code" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        room: {
          id: result.room.id,
          slug: result.room.slug,
          inviteCode: result.room.invite_code,
        },
        participant: { id: result.participantId, color: result.color },
      });
    }

    if (body.action === "leave") {
      if (!body.roomId || !body.email) {
        return NextResponse.json(
          { error: "roomId and email required for leave" },
          { status: 400 }
        );
      }
      await leaveRoom(body.roomId, body.email);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: `Unknown action: ${body.action}` },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
