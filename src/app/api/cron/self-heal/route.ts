/**
 * GET /api/cron/self-heal — hourly self-healing pass.
 *
 * KILLER-MOVES-BUILDER.md #B29. Detects failure patterns in the
 * telemetry + flywheel events tables and writes corrective actions
 * to self_healing_actions. The planner + api-bank read these on
 * every build to skip quarantined components and deprioritise
 * unhealthy providers.
 *
 * Schedule: hourly. Quick-acting compared to B27's nightly
 * consolidation — we want bad components quarantined within ~30
 * minutes of starting to fail, not 24h.
 */

import { NextRequest } from "next/server";
import { runSelfHealing } from "@/lib/flywheel/self-healing";

export const runtime = "nodejs";
export const maxDuration = 120;

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
    const result = await runSelfHealing();
    return Response.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      actionCount: result.actions.length,
      byKind: result.byKind,
      actions: result.actions.map((a) => ({
        kind: a.kind,
        subject: a.subject,
        reason: a.reason,
        activeUntilIso: a.activeUntilIso,
      })),
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : "self-healing failed",
      },
      { status: 500 },
    );
  }
}
