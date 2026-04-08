import { NextRequest, NextResponse } from "next/server";
import {
  getRoom,
  joinRoom,
  leaveRoom,
  updatePresence,
  pruneStale,
  serializeParticipants,
} from "@/lib/collab/yjs-room";

export const maxDuration = 10;

interface PresenceBody {
  roomId?: string;
  participantId?: string;
  name?: string;
  color?: string;
  cursor?: { x: number; y: number };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PresenceBody;
    const { roomId, participantId, name, color, cursor } = body;
    if (!roomId || !participantId || !name || !color) {
      return NextResponse.json(
        { ok: false, error: "roomId, participantId, name, color required" },
        { status: 400 },
      );
    }
    pruneStale(30000);
    const room = getRoom(roomId);
    if (!room) {
      return NextResponse.json({ ok: false, error: "Room not found" }, { status: 404 });
    }
    if (!room.participants.has(participantId)) {
      joinRoom(roomId, { id: participantId, name, color, cursor });
    } else {
      updatePresence(roomId, participantId, cursor);
    }
    return NextResponse.json({
      ok: true,
      participants: serializeParticipants(room),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as { roomId?: string; participantId?: string };
    if (!body.roomId || !body.participantId) {
      return NextResponse.json(
        { ok: false, error: "roomId and participantId required" },
        { status: 400 },
      );
    }
    leaveRoom(body.roomId, body.participantId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 },
    );
  }
}
