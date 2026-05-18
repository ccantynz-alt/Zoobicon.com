/**
 * GET /api/cron/prebuild-factory — nightly cache seeding job.
 *
 * KILLER-MOVES-BUILDER.md #B23. Runs at 03:30 UTC daily (30 min after
 * the B27 consolidation cron, so consolidation memories are fresh).
 *
 * Generates slot-fills for the most common (industry × theme × prompt)
 * combinations and seeds slot_cache. Morning traffic hits cache.
 */

import { NextRequest } from "next/server";
import { runPrebuildFactory } from "@/lib/flywheel/prebuild-factory";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorised(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
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
    const result = await runPrebuildFactory();
    return Response.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      ...result,
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : "prebuild factory failed",
      },
      { status: 500 },
    );
  }
}
