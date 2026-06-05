/**
 * /api/collab/presence — get + update presence for a collab room.
 *
 * GET  ?roomId=X&exclude=Y → { participants: [...] }
 * POST { participantId, cursorX?, cursorY?, cursorElement? } → { ok: true }
 *
 * Polled at PRESENCE_POLL_MS by useCollaboration. The lazy-GC drops
 * idle participants on every read so a leaver disappears within ~5
 * minutes even if their leaveRoom call never made it through.
 */

import { NextResponse } from "next/server";
import {
  ensureCollabTables,
  listPresence,
  updatePresence,
} from "@/lib/collab-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureCollabTables();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const exclude = searchParams.get("exclude") || undefined;
    if (!roomId) {
      return NextResponse.json(
        { error: "roomId required" },
        { status: 400 }
      );
    }
    const participants = await listPresence(roomId, exclude);
    return NextResponse.json({ participants });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

interface PostBody {
  participantId?: string;
  cursorX?: number | null;
  cursorY?: number | null;
  cursorElement?: string | null;
}

export async function POST(request: Request) {
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.participantId) {
    return NextResponse.json(
      { error: "participantId required" },
      { status: 400 }
    );
  }
  try {
    await ensureCollabTables();
    await updatePresence({
      participantId: body.participantId,
      cursorX: body.cursorX,
      cursorY: body.cursorY,
      cursorElement: body.cursorElement,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
