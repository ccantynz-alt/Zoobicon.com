import { NextRequest } from "next/server";
import {
  configureSeoAgent,
  getAuditHistory,
  getRunIssues,
  getPendingFixes,
  ensureSeoAgentTables,
  runSeoAudit,
} from "@/lib/seo-agent";
import { sql } from "@/lib/db";

/**
 * POST /api/seo/agent — Configure or trigger the SEO agent for a site
 *
 * Body: {
 *   action: "configure" | "trigger" | "apply-fix",
 *   siteId: string,
 *   slug?: string,
 *   url?: string,
 *   ... config options
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSeoAgentTables();

    const body = await req.json();
    const { action, siteId } = body;

    if (!action || !siteId) {
      return Response.json({ error: "action and siteId required" }, { status: 400 });
    }

    switch (action) {
      case "configure": {
        const config = await configureSeoAgent({
          siteId,
          slug: body.slug || siteId,
          url: body.url || `https://${body.slug || siteId}.zoobicon.sh`,
          enabled: body.enabled,
          crawlIntervalHours: body.crawlIntervalHours,
          autoFix: body.autoFix,
          notifyEmail: body.notifyEmail,
          keywords: body.keywords,
          competitors: body.competitors,
        });

        return Response.json({ config });
      }

      case "trigger": {
        // Manually trigger an audit run
        const [config] = await sql`
          SELECT * FROM seo_agent_config WHERE site_id = ${siteId}
        `;

        if (!config) {
          return Response.json({ error: "SEO agent not configured for this site" }, { status: 404 });
        }

        const run = await runSeoAudit({
          id: config.id,
          siteId: config.site_id,
          slug: config.slug,
          url: config.url,
          enabled: config.enabled,
          crawlIntervalHours: config.crawl_interval_hours,
          autoFix: config.auto_fix,
          notifyEmail: config.notify_email,
          keywords: config.keywords || [],
          competitors: config.competitors || [],
          createdAt: config.created_at,
          lastRunAt: config.last_run_at,
        });

        return Response.json({ run });
      }

      case "apply-fix": {
        const { fixId } = body;
        if (!fixId) {
          return Response.json({ error: "fixId required" }, { status: 400 });
        }

        // Get the fix
        const [fix] = await sql`
          SELECT * FROM seo_agent_fixes WHERE id = ${fixId} AND site_id = ${siteId}
        `;

        if (!fix) {
          return Response.json({ error: "Fix not found" }, { status: 404 });
        }

        // Get the site's current code
        const codeRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/hosting/sites/${siteId}/code`
        );

        if (!codeRes.ok) {
          return Response.json({ error: "Failed to fetch site code" }, { status: 500 });
        }

        const { code: currentHtml } = await codeRes.json();

        // Apply the fix
        const updatedHtml = currentHtml.replace(fix.html_before, fix.html_after);

        if (updatedHtml === currentHtml) {
          return Response.json({ error: "Fix could not be applied — HTML has changed" }, { status: 409 });
        }

        // Save the updated code
        const updateRes = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/hosting/sites/${siteId}/code`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: updatedHtml,
              commitMessage: `SEO fix: ${fix.description}`,
            }),
          }
        );

        if (!updateRes.ok) {
          return Response.json({ error: "Failed to apply fix" }, { status: 500 });
        }

        // Mark fix as applied
        await sql`
          UPDATE seo_agent_fixes SET applied = true, applied_at = NOW() WHERE id = ${fixId}
        `;

        return Response.json({ applied: true, description: fix.description });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    console.error("[seo/agent] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "SEO agent error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seo/agent?siteId=xxx — Get agent status, history, and pending fixes
 */
export async function GET(req: NextRequest) {
  try {
    await ensureSeoAgentTables();

    const siteId = req.nextUrl.searchParams.get("siteId");
    const runId = req.nextUrl.searchParams.get("runId");

    if (runId) {
      // Get issues for a specific run
      const issues = await getRunIssues(runId);
      return Response.json({ issues });
    }

    if (!siteId) {
      return Response.json({ error: "siteId required" }, { status: 400 });
    }

    // Get config
    const [config] = await sql`
      SELECT * FROM seo_agent_config WHERE site_id = ${siteId}
    `;

    // Get history
    const history = await getAuditHistory(siteId);

    // Get pending fixes
    const fixes = await getPendingFixes(siteId);

    return Response.json({
      configured: !!config,
      config: config ? {
        enabled: config.enabled,
        crawlIntervalHours: config.crawl_interval_hours,
        autoFix: config.auto_fix,
        keywords: config.keywords || [],
        lastRunAt: config.last_run_at,
      } : null,
      history,
      pendingFixes: fixes,
      latestScore: history[0]?.score ?? null,
      scoreTrend: history.slice(0, 7).map((r: { completedAt: string | null; score: number }) => ({
        date: r.completedAt,
        score: r.score,
      })),
    });
  } catch (err) {
    console.error("[seo/agent] GET error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to fetch agent data" },
      { status: 500 }
    );
  }
}
