import { NextRequest, NextResponse } from "next/server";
import { getRecentActivity, type ActivityEvent } from "@/lib/activity";

/* ---------- GET: recent platform activity ---------- */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 50);

  try {
    const events: ActivityEvent[] = await getRecentActivity(limit);

    return NextResponse.json(events, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=5",
      },
    });
  } catch (err) {
    console.error("[api/activity] Error fetching activity:", err);
    // Return empty array — the client component falls back to demo data
    return NextResponse.json([], { status: 200 });
  }
}
