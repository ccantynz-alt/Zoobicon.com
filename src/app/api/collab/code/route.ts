/**
 * /api/collab/code — get + push the shared code state.
 *
 * GET  ?roomId=X&version=N → { html, version, updatedAt }
 *        Returns the current code if it's newer than the client's
 *        version. The client polls this so late-joiners and
 *        out-of-sync clients converge.
 * POST { roomId, html, expectedVersion } → { ok, version }
 *        Optimistic concurrency: only writes if expectedVersion
 *        matches what the server holds; otherwise returns
 *        { ok: false, serverVersion } and the client re-fetches.
 */

import { NextResponse } from "next/server";
import { ensureCollabTables, getCode, pushCode } from "@/lib/collab-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureCollabTables();
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const clientVersion = parseInt(searchParams.get("version") || "0", 10);
    if (!roomId) {
      return NextResponse.json(
        { error: "roomId required" },
        { status: 400 }
      );
    }
    const sync = await getCode(roomId);
    if (!sync) {
      return NextResponse.json({ html: null, version: 0 });
    }
    if (sync.version <= clientVersion) {
      // Client already has the latest — return 304-equivalent payload
      return NextResponse.json({ html: null, version: sync.version, noChange: true });
    }
    return NextResponse.json({
      html: sync.html,
      version: sync.version,
      updatedAt: sync.updatedAt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}

interface PostBody {
  roomId?: string;
  html?: string;
  expectedVersion?: number;
}

export async function POST(request: Request) {
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.roomId || typeof body.html !== "string" || typeof body.expectedVersion !== "number") {
    return NextResponse.json(
      { error: "roomId, html, expectedVersion required" },
      { status: 400 }
    );
  }
  try {
    await ensureCollabTables();
    const result = await pushCode({
      roomId: body.roomId,
      html: body.html,
      expectedVersion: body.expectedVersion,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
