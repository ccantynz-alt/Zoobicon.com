import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/analytics-engine";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const isAdmin = req.headers.get("x-admin") === "true" || !!req.headers.get("x-admin");
    if (!isAdmin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
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
