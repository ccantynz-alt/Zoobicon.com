/**
 * POST /api/qstash/init
 *
 * Initializes all QStash schedules. Call once after deploy or whenever
 * schedules need updating. Requires CRON_SECRET or admin auth.
 *
 * QStash provides: retry with backoff, DLQ, delivery logging, dashboard.
 * Vercel crons are kept as fallback (in vercel.json).
 */

import { NextRequest, NextResponse } from "next/server";
import { initAllSchedules, isQStashConfigured, CRON_SCHEDULES } from "@/lib/qstash";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth check
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== cronSecret && !req.headers.get("x-vercel-cron")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isQStashConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "QSTASH_TOKEN not set. Add it to Vercel environment variables.",
      schedules: CRON_SCHEDULES.map((s) => ({
        destination: s.destination,
        cron: s.cron,
        status: "skipped",
      })),
    }, { status: 503 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://zoobicon.com";

  const result = await initAllSchedules(baseUrl);

  return NextResponse.json({
    ok: result.failed === 0,
    ...result,
    schedules: CRON_SCHEDULES.map((s) => ({
      destination: s.destination,
      cron: s.cron,
      retries: s.retries,
    })),
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return POST(req);
}
