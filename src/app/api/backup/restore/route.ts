import { NextRequest, NextResponse } from "next/server";
import { restoreBackup } from "@/lib/backup-restore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      backupId?: string;
      ownerId?: string;
    };
    const { backupId, ownerId } = body;
    if (!backupId || !ownerId) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "backupId and ownerId are required to restore a backup.",
        },
        { status: 400 }
      );
    }
    const result = await restoreBackup(backupId, ownerId);
    return NextResponse.json({ ok: true, restoredFiles: result.restoredFiles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Restore failed", message },
      { status: 500 }
    );
  }
}
