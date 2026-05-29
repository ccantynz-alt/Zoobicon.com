/**
 * /api/intel/all/run — unified intel flywheel runner.
 *
 * Fires the HN pipeline and the Reddit pipeline back-to-back so one
 * cron call drives the full daily loop. Includes an optional ?email=1
 * to send the HN digest email after both complete (Reddit-only email
 * is intentionally not sent — admin gets one daily email with HN as
 * the lead source; Reddit lives in the dashboard).
 *
 * Each pipeline is wrapped in its own try/catch — a Reddit failure
 * doesn't stop HN from delivering, and vice versa.
 *
 * GET ?secret=$CRON_SECRET&email=1&harvest=10&extract=10
 */

import { NextResponse } from "next/server";
import {
  ensureHnTables,
  pollHN,
  harvestNextThreads as harvestHN,
  extractNextThreads as extractHN,
  buildDigest as buildHnDigest,
  sendDigestEmail,
} from "@/lib/hn-flywheel";
import {
  ensureRedditTables,
  pollReddit,
  harvestNextRedditThreads,
  extractNextRedditThreads,
  buildRedditDigest,
} from "@/lib/reddit-flywheel";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface StageResult {
  ok: boolean;
  poll?: unknown;
  harvest?: unknown;
  extract?: unknown;
  digest?: unknown;
  error?: string;
}

export async function GET(request: Request) {
  const started = Date.now();
  const { searchParams } = new URL(request.url);

  const secret = searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const harvestN = Math.min(Math.max(parseInt(searchParams.get("harvest") || "10", 10), 0), 50);
  const extractN = Math.min(Math.max(parseInt(searchParams.get("extract") || "10", 10), 0), 50);
  const doEmail = searchParams.get("email") === "1";
  const emailTo = searchParams.get("emailTo") || undefined;

  // ── HN pipeline ──
  let hn: StageResult = { ok: false };
  try {
    await ensureHnTables();
    const poll = await pollHN();
    const harvest = harvestN > 0 ? await harvestHN(harvestN) : { harvested: 0, failures: 0 };
    const extract = extractN > 0 ? await extractHN(extractN) : { processed: 0, extracted: 0 };
    const digest = await buildHnDigest();
    hn = {
      ok: true,
      poll,
      harvest,
      extract,
      digest: {
        threadCount: digest.threadCount,
        painkillerCount: digest.painkillerCount,
      },
    };
  } catch (err) {
    hn = { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
    console.error("[intel/all/run] HN pipeline failed:", err);
  }

  // ── Reddit pipeline ──
  let reddit: StageResult = { ok: false };
  try {
    await ensureRedditTables();
    const poll = await pollReddit();
    const harvest = harvestN > 0 ? await harvestNextRedditThreads(harvestN) : { harvested: 0, failures: 0 };
    const extract = extractN > 0 ? await extractNextRedditThreads(extractN) : { processed: 0, extracted: 0 };
    const digest = await buildRedditDigest();
    reddit = {
      ok: true,
      poll,
      harvest,
      extract,
      digest: {
        threadCount: digest.threadCount,
        painkillerCount: digest.painkillerCount,
      },
    };
  } catch (err) {
    reddit = { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
    console.error("[intel/all/run] Reddit pipeline failed:", err);
  }

  // ── Email (HN digest only — admin gets one email per morning) ──
  let email: unknown = null;
  if (doEmail && hn.ok) {
    try {
      email = await sendDigestEmail({ to: emailTo });
    } catch (err) {
      email = { ok: false, reason: err instanceof Error ? err.message : "Unknown error" };
    }
  }

  return NextResponse.json({
    success: hn.ok || reddit.ok,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - started,
    hn,
    reddit,
    email,
  });
}
