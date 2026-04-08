import { NextRequest, NextResponse } from "next/server";
import { createBackup } from "@/lib/backup-restore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      siteId?: string;
      ownerId?: string;
      label?: string;
    };
    const { siteId, ownerId, label } = body;
    if (!siteId || !ownerId) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          message: "siteId and ownerId are required to create a backup.",
        },
        { status: 400 }
      );
    }
    const backup = await createBackup(siteId, ownerId, label);
    return NextResponse.json({ backup });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Backup failed", message },
      { status: 500 }
    );
  }
}
