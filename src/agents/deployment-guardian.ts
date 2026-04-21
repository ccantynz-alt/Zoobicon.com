/**
 * Deployment Guardian Agent
 *
 * Ensures every deployment is successful and high quality:
 * - Monitors recent deployments for failures
 * - Validates deployed sites are actually serving (not 404/500)
 * - Checks if component library CSS is injected
 * - Validates deployed HTML has >100 chars of body text
 * - Auto-flags broken deployments for review
 * - Tracks deployment success rate trends
 *
 * Runs every 10 minutes.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeployCheckInput {
  type: "recent-failures" | "serving-check" | "quality-check" | "success-rate";
  name: string;
  data?: Record<string, unknown>;
}

interface DeployCheckOutput {
  name: string;
  status: "healthy" | "degraded" | "critical";
  deployments_checked: number;
  issues_found: number;
  details: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "deployment-guardian",
  name: "Deployment Guardian",
  description: "Validates every deployment is live, high quality, and serving correctly. Catches broken deploys before users notice.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.8,
  scheduleIntervalSec: 600, // 10 minutes
  maxConcurrency: 4,
  maxRetries: 1,
  retryBaseDelayMs: 3000,
  taskTimeoutMs: 45_000,
  settings: {
    maxDeploymentsPerCheck: 15,
    minBodyTextLength: 100,
    componentLibraryMarker: "ZOOBICON COMPONENT LIBRARY",
  },
  tags: ["deployment", "quality", "hosting", "monitoring"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class DeploymentGuardianAgent extends BaseAgent<DeployCheckInput, DeployCheckOutput> {
  protected async discoverTasks(): Promise<DeployCheckInput[]> {
    return [
      { type: "recent-failures", name: "Check Recent Deploy Failures" },
      { type: "serving-check", name: "Verify Sites Are Serving" },
      { type: "quality-check", name: "Quality Audit Recent Deploys" },
      { type: "success-rate", name: "Deployment Success Rate" },
    ];
  }

  protected async execute(
    input: DeployCheckInput,
    _context: TaskContext
  ): Promise<{ output: DeployCheckOutput; confidence: number; findings: AgentFinding[] }> {
    switch (input.type) {
      case "recent-failures":
        return this.checkRecentFailures(input);
      case "serving-check":
        return this.verifyServing(input);
      case "quality-check":
        return this.qualityAudit(input);
      case "success-rate":
        return this.checkSuccessRate(input);
      default:
        return {
          output: { name: input.name, status: "healthy", deployments_checked: 0, issues_found: 0, details: "Unknown check" },
          confidence: 0.5,
          findings: [],
        };
    }
  }

  // ── Check Recent Failures ──

  private async checkRecentFailures(
    input: DeployCheckInput
  ): Promise<{ output: DeployCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      const failures = await sql`
        SELECT d.id, d.site_id, d.status, d.created_at, d.commit_message,
               s.slug, s.name, s.email
        FROM deployments d
        JOIN sites s ON s.id = d.site_id
        WHERE d.status = 'failed'
          AND d.created_at > NOW() - INTERVAL '30 minutes'
        ORDER BY d.created_at DESC
      `;

      if (failures.length === 0) {
        return {
          output: { name: input.name, status: "healthy", deployments_checked: 0, issues_found: 0, details: "No recent failures" },
          confidence: 0.99,
          findings,
        };
      }

      findings.push({
        severity: failures.length >= 5 ? "critical" : "warning",
        category: "deployment:failures",
        title: `${failures.length} Failed Deployment(s) in Last 30 Minutes`,
        description: `${failures.length} deployment(s) failed recently. Sites: ${failures.map((f: any) => f.slug).join(", ")}. Users may be experiencing deploy errors.`,
        autoFixed: false,
        metadata: {
          failedCount: failures.length,
          sites: failures.map((f: any) => ({ slug: f.slug, email: f.email })),
        },
      });

      // Alert admin if failure rate is high
      if (failures.length >= 5) {
        try {
          const { notifyAdmin } = await import("@/lib/admin-notify");
          const siteList = failures.slice(0, 10).map((f: any) => `${f.slug} (${f.email})`).join("<br>");
          await notifyAdmin({
            subject: `[DEPLOY] ${failures.length} failed deployments in 30 minutes`,
            html: `<h2 style="color: #dc2626;">Deployment Failures Spike</h2>
            <p><strong>${failures.length}</strong> deployments failed in the last 30 minutes:</p>
            <p>${siteList}</p>
            <p>This may indicate a systemic issue with the hosting or database layer.</p>`,
          });
        } catch {
          // Alert failed
        }
      }

      return {
        output: { name: input.name, status: failures.length >= 5 ? "critical" : "degraded", deployments_checked: failures.length, issues_found: failures.length, details: `${failures.length} failures` },
        confidence: 0.95,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, status: "healthy", deployments_checked: 0, issues_found: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Verify Sites Are Serving ──

  private async verifyServing(
    input: DeployCheckInput
  ): Promise<{ output: DeployCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Get recently deployed sites
      const sites = await sql`
        SELECT DISTINCT ON (s.slug) s.slug, s.name, s.id as site_id
        FROM sites s
        JOIN deployments d ON d.site_id = s.id
        WHERE d.status = 'active'
          AND d.created_at > NOW() - INTERVAL '1 hour'
        ORDER BY s.slug, d.created_at DESC
        LIMIT ${CONFIG.settings.maxDeploymentsPerCheck as number}
      `;

      let issuesFound = 0;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

      for (const site of sites) {
        try {
          // Check if the site is actually serving via the hosting serve endpoint
          const res = await fetch(`${baseUrl}/api/hosting/serve/${site.slug}`, {
            method: "GET",
            signal: AbortSignal.timeout(10_000),
          });

          if (res.status === 404) {
            issuesFound++;
            findings.push({
              severity: "error",
              category: "deployment:not-serving",
              title: `${site.slug}: Not Found (404)`,
              description: `Site ${site.slug}.zoobicon.sh returns 404. The deployment may have failed silently or the site record is missing.`,
              autoFixed: false,
              metadata: { slug: site.slug, siteId: site.site_id },
            });
          } else if (res.status >= 500) {
            issuesFound++;
            findings.push({
              severity: "critical",
              category: "deployment:server-error",
              title: `${site.slug}: Server Error (${res.status})`,
              description: `Site ${site.slug}.zoobicon.sh returns HTTP ${res.status}. The hosting layer may be broken.`,
              autoFixed: false,
              metadata: { slug: site.slug, httpStatus: res.status },
            });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          issuesFound++;
          findings.push({
            severity: "error",
            category: "deployment:unreachable",
            title: `${site.slug}: Unreachable`,
            description: `Cannot reach ${site.slug}.zoobicon.sh. Error: ${errorMsg}`,
            autoFixed: false,
            metadata: { slug: site.slug, error: errorMsg },
          });
        }
      }

      const status = issuesFound === 0 ? "healthy" : (issuesFound > 3 ? "critical" : "degraded");

      return {
        output: { name: input.name, status, deployments_checked: sites.length, issues_found: issuesFound, details: `${issuesFound}/${sites.length} sites have issues` },
        confidence: sites.length > 0 ? 0.95 : 0.7,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, status: "healthy", deployments_checked: 0, issues_found: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Quality Audit Recent Deploys ──

  private async qualityAudit(
    input: DeployCheckInput
  ): Promise<{ output: DeployCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Get recent active deployments with their HTML
      const deploys = await sql`
        SELECT d.id, d.code, d.site_id, s.slug, s.name
        FROM deployments d
        JOIN sites s ON s.id = d.site_id
        WHERE d.status = 'active'
          AND d.created_at > NOW() - INTERVAL '1 hour'
        ORDER BY d.created_at DESC
        LIMIT ${CONFIG.settings.maxDeploymentsPerCheck as number}
      `;

      let issuesFound = 0;
      const marker = CONFIG.settings.componentLibraryMarker as string;
      const minBodyText = CONFIG.settings.minBodyTextLength as number;

      for (const deploy of deploys) {
        const html = (deploy.code as string) || "";

        // Check 1: Component library is injected
        if (!html.includes(marker)) {
          issuesFound++;
          findings.push({
            severity: "error",
            category: "deployment:missing-component-library",
            title: `${deploy.slug}: Missing Component Library CSS`,
            description: `Deployment for ${deploy.slug}.zoobicon.sh does not contain the component library CSS. Buttons, cards, and grids will be unstyled. This is a broken product.`,
            autoFixed: false,
            metadata: { slug: deploy.slug, deployId: deploy.id },
          });
        }

        // Check 2: Body text has sufficient content
        const bodyText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim();

        if (bodyText.length < minBodyText) {
          issuesFound++;
          findings.push({
            severity: "critical",
            category: "deployment:empty-body",
            title: `${deploy.slug}: Insufficient Body Content (${bodyText.length} chars)`,
            description: `Deployment for ${deploy.slug}.zoobicon.sh has only ${bodyText.length} visible characters (minimum: ${minBodyText}). The page may appear empty or broken.`,
            autoFixed: false,
            metadata: { slug: deploy.slug, bodyLength: bodyText.length },
          });
        }

        // Check 3: Has a proper HTML structure
        const hasDoctype = /<!DOCTYPE/i.test(html);
        const hasHtml = /<html/i.test(html);
        const hasHead = /<head/i.test(html);
        const hasBody = /<body/i.test(html);

        if (!hasDoctype || !hasHtml || !hasHead || !hasBody) {
          issuesFound++;
          const missing = [];
          if (!hasDoctype) missing.push("DOCTYPE");
          if (!hasHtml) missing.push("<html>");
          if (!hasHead) missing.push("<head>");
          if (!hasBody) missing.push("<body>");

          findings.push({
            severity: "warning",
            category: "deployment:invalid-structure",
            title: `${deploy.slug}: Incomplete HTML Structure`,
            description: `Missing: ${missing.join(", ")}. The page may not render correctly in all browsers.`,
            autoFixed: false,
            metadata: { slug: deploy.slug, missing },
          });
        }

        // Check 4: Has navigation and footer (minimum sections)
        const hasNav = /<nav/i.test(html) || /class=["'][^"']*nav/i.test(html);
        const hasFooter = /<footer/i.test(html);

        if (!hasNav || !hasFooter) {
          const missing = [];
          if (!hasNav) missing.push("navigation");
          if (!hasFooter) missing.push("footer");

          findings.push({
            severity: "info",
            category: "deployment:missing-sections",
            title: `${deploy.slug}: Missing ${missing.join(" and ")}`,
            description: `Site is missing ${missing.join(" and ")}. A complete site should have both.`,
            autoFixed: false,
            metadata: { slug: deploy.slug, missing },
          });
        }
      }

      const status = issuesFound === 0 ? "healthy" : (issuesFound > 5 ? "critical" : "degraded");

      return {
        output: { name: input.name, status, deployments_checked: deploys.length, issues_found: issuesFound, details: `${issuesFound} quality issues in ${deploys.length} deploys` },
        confidence: deploys.length > 0 ? 0.95 : 0.7,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, status: "healthy", deployments_checked: 0, issues_found: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Deployment Success Rate ──

  private async checkSuccessRate(
    input: DeployCheckInput
  ): Promise<{ output: DeployCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      const stats = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as successful,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
        FROM deployments
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `;

      const total = Number(stats[0]?.total || 0);
      const successful = Number(stats[0]?.successful || 0);
      const failed = Number(stats[0]?.failed || 0);
      const successRate = total > 0 ? ((successful / total) * 100) : 100;

      if (total > 0 && successRate < 90) {
        findings.push({
          severity: successRate < 70 ? "critical" : "warning",
          category: "deployment:success-rate",
          title: `Deploy Success Rate: ${successRate.toFixed(1)}% (24h)`,
          description: `${successful}/${total} deployments succeeded in the last 24 hours (${failed} failed). Target: >95%.`,
          autoFixed: false,
          metadata: { total, successful, failed, successRate },
        });
      }

      // Store success rate for trend tracking
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS deployment_metrics (
            id SERIAL PRIMARY KEY,
            total INT,
            successful INT,
            failed INT,
            success_rate NUMERIC(5,2),
            period_hours INT DEFAULT 24,
            recorded_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;

        await sql`
          INSERT INTO deployment_metrics (total, successful, failed, success_rate)
          VALUES (${total}, ${successful}, ${failed}, ${successRate})
        `;

        // Clean old metrics (keep 30 days)
        await sql`DELETE FROM deployment_metrics WHERE recorded_at < NOW() - INTERVAL '30 days'`;
      } catch {
        // Metrics storage failed
      }

      const status = successRate >= 95 ? "healthy" : (successRate >= 80 ? "degraded" : "critical");

      return {
        output: { name: input.name, status, deployments_checked: total, issues_found: failed, details: `${successRate.toFixed(1)}% success rate (${total} deploys)` },
        confidence: total > 0 ? 0.95 : 0.6,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, status: "healthy", deployments_checked: 0, issues_found: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new DeploymentGuardianAgent(CONFIG, store));

export { DeploymentGuardianAgent, CONFIG as DEPLOYMENT_GUARDIAN_CONFIG };
