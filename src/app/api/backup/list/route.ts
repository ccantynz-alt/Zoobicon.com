import { NextRequest, NextResponse } from "next/server";
import { listBackups } from "@/lib/backup-restore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const limitParam = searchParams.get("limit");
    if (!siteId) {
      return NextResponse.json(
        {
          error: "Missing siteId",
          message: "Provide ?siteId= in the query string to list backups.",
        },
        { status: 400 }
      );
    }
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 20)) : 20;
    const backups = await listBackups(siteId, limit);
    return NextResponse.json({ backups });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to list backups", message },
      { status: 500 }
    );
  }
}
