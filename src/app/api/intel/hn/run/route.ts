/**
 * /api/intel/hn/run — full HN flywheel pipeline in one call.
 *
 * Sequence: ensureTables → poll → harvest → extract → digest.
 *
 * Crontech (or any external scheduler) hits this with
 * `?secret=$CRON_SECRET` to fire the daily digest. Safe to call
 * multiple times — every stage is idempotent.
 *
 * Query params:
 *   secret      Required if CRON_SECRET env is set
 *   poll        "0" to skip poll stage (default 1)
 *   harvest     integer — max threads to harvest this run (default 10)
 *   extract     integer — max threads to extract this run (default 10)
 *   digest      "0" to skip digest write (default 1)
 */

import { NextResponse } from "next/server";
import {
  ensureHnTables,
  pollHN,
  harvestNextThreads,
  extractNextThreads,
  buildDigest,
  sendDigestEmail,
} from "@/lib/hn-flywheel";

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
  const doEmail = searchParams.get("email") === "1";
  const emailTo = searchParams.get("emailTo") || undefined;

  try {
    await ensureHnTables();

    const poll = doPoll ? await pollHN() : { scanned: 0, inserted: 0 };
    const harvest = harvestN > 0 ? await harvestNextThreads(harvestN) : { harvested: 0, failures: 0 };
    const extract = extractN > 0 ? await extractNextThreads(extractN) : { processed: 0, extracted: 0 };
    const digest = doDigest ? await buildDigest() : null;
    const email = doEmail && doDigest ? await sendDigestEmail({ to: emailTo }) : null;

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
      email,
    });
  } catch (err) {
    console.error("[intel/hn/run] failed:", err);
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
