import { NextRequest, NextResponse } from "next/server";
import {
  createRoom,
  getRoom,
  deleteRoom,
  serializeParticipants,
} from "@/lib/collab/yjs-room";

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { ownerId?: string };
    if (!body.ownerId || typeof body.ownerId !== "string") {
      return NextResponse.json(
        { ok: false, error: "ownerId is required" },
        { status: 400 },
      );
    }
    const room = createRoom(body.ownerId);
    return NextResponse.json({
      ok: true,
      roomId: room.id,
      joinUrl: `/builder?room=${room.id}`,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 },
    );
  }
}

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json(
      { ok: false, error: "roomId query param required" },
      { status: 400 },
    );
  }
  const room = getRoom(roomId);
  if (!room) {
    return NextResponse.json({ ok: false, error: "Room not found" }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    room: {
      id: room.id,
      ownerId: room.ownerId,
      createdAt: room.createdAt,
      participantCount: room.participants.size,
      participants: serializeParticipants(room),
      version: room.state.version,
    },
  });
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as { roomId?: string; ownerId?: string };
    if (!body.roomId || !body.ownerId) {
      return NextResponse.json(
        { ok: false, error: "roomId and ownerId required" },
        { status: 400 },
      );
    }
    const room = getRoom(body.roomId);
    if (!room) {
      return NextResponse.json({ ok: false, error: "Room not found" }, { status: 404 });
    }
    if (room.ownerId !== body.ownerId) {
      return NextResponse.json(
        { ok: false, error: "Only the room owner can delete" },
        { status: 403 },
      );
    }
    deleteRoom(body.roomId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid request" },
      { status: 400 },
    );
  }
}
