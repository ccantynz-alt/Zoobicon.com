import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/**
 * GET /api/collab/code?roomId=xxx&version=N
 * Returns latest code if version > client's version, otherwise 304-equivalent
 */
export async function GET(req: NextRequest) {
  try {
    const roomId = req.nextUrl.searchParams.get("roomId");
    const clientVersion = parseInt(req.nextUrl.searchParams.get("version") || "0");

    if (!roomId) {
      return Response.json({ error: "Room ID required" }, { status: 400 });
    }

    const [sync] = await sql`
      SELECT html, version, updated_by, updated_at
      FROM collab_code_sync
      WHERE room_id = ${roomId}
      LIMIT 1
    `;

    if (!sync) {
      return Response.json({ html: "", version: 0, updated_by: "", hasUpdate: false });
    }

    // Only send code if version is newer
    if (sync.version <= clientVersion) {
      return Response.json({ hasUpdate: false, version: sync.version });
    }

    return Response.json({
      html: sync.html,
      version: sync.version,
      updated_by: sync.updated_by,
      updated_at: sync.updated_at,
      hasUpdate: true,
    });
  } catch (err) {
    console.error("Code sync GET error:", err);
    return Response.json({ error: "Failed to fetch code" }, { status: 500 });
  }
}

/**
 * POST /api/collab/code — Push code update
 *
 * Body: { roomId, html, email, expectedVersion? }
 * Uses optimistic concurrency: if expectedVersion doesn't match, returns conflict
 */
export async function POST(req: NextRequest) {
  try {
    const { roomId, html, email, expectedVersion } = await req.json();

    if (!roomId || typeof html !== "string") {
      return Response.json({ error: "Room ID and HTML required" }, { status: 400 });
    }

    // Check if code sync record exists
    const [existing] = await sql`
      SELECT version FROM collab_code_sync WHERE room_id = ${roomId} LIMIT 1
    `;

    if (!existing) {
      // Create initial record
      await sql`
        INSERT INTO collab_code_sync (room_id, html, version, updated_by)
        VALUES (${roomId}, ${html}, 1, ${email || ""})
      `;
      return Response.json({ version: 1, conflict: false });
    }

    // Optimistic concurrency check
    if (expectedVersion !== undefined && expectedVersion !== existing.version) {
      return Response.json({
        conflict: true,
        serverVersion: existing.version,
        message: "Code was updated by another collaborator",
      }, { status: 409 });
    }

    const newVersion = existing.version + 1;
    await sql`
      UPDATE collab_code_sync
      SET html = ${html}, version = ${newVersion}, updated_by = ${email || ""}, updated_at = NOW()
      WHERE room_id = ${roomId}
    `;

    return Response.json({ version: newVersion, conflict: false });
  } catch (err) {
    console.error("Code sync POST error:", err);
    return Response.json({ error: "Failed to sync code" }, { status: 500 });
  }
}
