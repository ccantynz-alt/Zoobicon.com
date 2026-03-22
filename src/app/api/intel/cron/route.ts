import { NextResponse } from "next/server";
import {
  ensureIntelTables,
  runScheduledCrawl,
  scanMarketSources,
} from "@/lib/market-intel";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startTime = Date.now();

  // Optional: verify cron secret to prevent unauthorized triggers
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ensure tables exist before any operations
    await ensureIntelTables();

    // Run competitor crawl
    const crawlResult = await runScheduledCrawl();

    // Scan market sources (Hacker News)
    const trendResult = await scanMarketSources();

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      crawl: {
        runId: crawlResult.crawlRunId,
        snapshots: crawlResult.snapshots,
        alerts: crawlResult.alerts,
      },
      trends: {
        scanned: trendResult.scanned,
        stored: trendResult.stored,
      },
    });
  } catch (err) {
    console.error("[intel/cron] Failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
