import { NextRequest } from "next/server";
import {
  ensureSeoAgentTables,
  getSitesDueForAudit,
  runSeoAudit,
} from "@/lib/seo-agent";

export const maxDuration = 300; // 5 minutes max for cron jobs

/**
 * GET /api/seo/agent/cron — Cron endpoint for scheduled SEO audits
 *
 * Called by:
 *   - Vercel Cron (vercel.json: { "crons": [{ "path": "/api/seo/agent/cron", "schedule": "0 * * * *" }] })
 *   - Railway/Fly.io cron
 *   - External cron service (e.g., cron-job.org)
 *
 * Security: Validates CRON_SECRET header to prevent unauthorized triggers.
 */
export async function GET(req: NextRequest) {
  // Validate cron secret (optional but recommended)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    await ensureSeoAgentTables();

    // Get sites that are due for an audit
    const dueConfigs = await getSitesDueForAudit();

    if (dueConfigs.length === 0) {
      return Response.json({
        message: "No sites due for audit",
        sitesChecked: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Run audits sequentially to avoid overwhelming resources
    const results = [];
    for (const config of dueConfigs) {
      try {
        const run = await runSeoAudit(config);
        results.push({
          siteId: config.siteId,
          slug: config.slug,
          status: run.status,
          score: run.score,
          previousScore: run.previousScore,
          issueCount: run.issueCount,
          fixedCount: run.fixedCount,
          durationMs: run.durationMs,
        });
      } catch (err) {
        results.push({
          siteId: config.siteId,
          slug: config.slug,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return Response.json({
      message: `Audited ${results.length} sites`,
      sitesChecked: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[seo/agent/cron] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Cron job failed" },
      { status: 500 }
    );
  }
}
