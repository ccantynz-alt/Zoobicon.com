import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/analytics-engine";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const denied = requireAdmin(req);
    if (denied) return denied;
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const days = parseInt(searchParams.get("days") || "7", 10);
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }
    const stats = await getStats(siteId, isNaN(days) ? 7 : days);
    return NextResponse.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : "stats failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
