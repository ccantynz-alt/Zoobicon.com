import { NextRequest, NextResponse } from "next/server";
import { getCommandCenterSnapshot } from "@/lib/command-center";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const snapshot = await getCommandCenterSnapshot();
    return NextResponse.json(snapshot, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "snapshot_failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
