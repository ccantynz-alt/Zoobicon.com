import { NextRequest, NextResponse } from "next/server";
import { getRecentEmailNotifications } from "@/lib/email-notifications";

// ---------------------------------------------------------------------------
// GET /api/notifications/email?since=<timestamp>
//
// Polling fallback for email notifications. Returns any email events
// since the given timestamp. Admin pages poll this every 5s.
//
// On Vercel serverless, SSE connections get killed after ~25s, so this
// polling endpoint is the reliable path for real-time email alerts.
// ---------------------------------------------------------------------------

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sinceParam = req.nextUrl.searchParams.get("since");
  const since = sinceParam ? parseInt(sinceParam, 10) : Date.now() - 60_000;

  const events = getRecentEmailNotifications(since);

  return NextResponse.json({
    events,
    count: events.length,
    timestamp: Date.now(),
  });
}
