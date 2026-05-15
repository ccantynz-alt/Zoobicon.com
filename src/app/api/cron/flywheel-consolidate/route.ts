/**
 * GET /api/cron/flywheel-consolidate — nightly consolidation job.
 *
 * KILLER-MOVES-BUILDER.md #B27. Rolls raw flywheel_events +
 * flywheel_successful_builds + builds telemetry into the higher-
 * level memories in flywheel_memories that the planner / customiser /
 * admin dashboard read.
 *
 * Scheduled via vercel.json cron entry "0 3 * * *" — 03:00 UTC daily,
 * a deliberately quiet hour where customer build volume is low so the
 * aggregation queries don't compete with hot-path traffic.
 *
 * Triggered only by Vercel's cron header. Manual hits require the
 * x-cron-secret header matching CRON_SECRET env var.
 */

import { NextRequest } from "next/server";
import { runConsolidation } from "@/lib/flywheel/consolidate";

// Node runtime (edge can't run the heavier aggregation SQL).
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes — gives the cron enough time

function isAuthorised(req: NextRequest): boolean {
  // Vercel cron requests include x-vercel-cron header.
  if (req.headers.get("x-vercel-cron")) return true;
  // Manual triggers need the secret.
  const provided = req.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  return !!expected && provided === expected;
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!isAuthorised(req)) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  const startedAt = Date.now();
  try {
    const result = await runConsolidation();
    return Response.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      generated: result.generated,
      byKind: result.byKind,
      errors: result.errors,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : "consolidation failed",
      },
      { status: 500 },
    );
  }
}
