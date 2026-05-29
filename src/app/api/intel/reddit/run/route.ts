/**
 * /api/intel/reddit/run — full Reddit flywheel pipeline in one call.
 * Mirrors /api/intel/hn/run.
 */

import { NextResponse } from "next/server";
import {
  ensureRedditTables,
  pollReddit,
  harvestNextRedditThreads,
  extractNextRedditThreads,
  buildRedditDigest,
} from "@/lib/reddit-flywheel";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const started = Date.now();
  const { searchParams } = new URL(request.url);

  const secret = searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const doPoll = searchParams.get("poll") !== "0";
  const harvestN = Math.min(Math.max(parseInt(searchParams.get("harvest") || "10", 10), 0), 50);
  const extractN = Math.min(Math.max(parseInt(searchParams.get("extract") || "10", 10), 0), 50);
  const doDigest = searchParams.get("digest") !== "0";

  try {
    await ensureRedditTables();

    const poll = doPoll ? await pollReddit() : { scanned: 0, inserted: 0 };
    const harvest = harvestN > 0 ? await harvestNextRedditThreads(harvestN) : { harvested: 0, failures: 0 };
    const extract = extractN > 0 ? await extractNextRedditThreads(extractN) : { processed: 0, extracted: 0 };
    const digest = doDigest ? await buildRedditDigest() : null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - started,
      poll,
      harvest,
      extract,
      digest: digest
        ? {
            threadCount: digest.threadCount,
            painkillerCount: digest.painkillerCount,
            summaryPreview: digest.summary.slice(0, 400),
          }
        : null,
    });
  } catch (err) {
    console.error("[intel/reddit/run] failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        durationMs: Date.now() - started,
      },
      { status: 500 }
    );
  }
}
