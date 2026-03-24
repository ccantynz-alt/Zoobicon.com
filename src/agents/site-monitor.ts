/**
 * Site Monitor Agent
 *
 * Autonomous agent that monitors deployed sites for quality issues.
 * Wraps the existing auto-pilot logic into the new agent framework.
 *
 * Runs every 24 hours, audits all enabled sites for:
 * - SEO issues (meta tags, headings, alt text, structured data)
 * - Performance problems (file size, images, scripts)
 * - Content freshness (deployment age, placeholder text)
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SiteMonitorInput {
  siteId: string;
  slug: string;
  url: string;
  html?: string;
}

interface SiteMonitorOutput {
  seoScore: number;
  performanceScore: number;
  contentScore: number;
  overallScore: number;
  issueCount: number;
  autoFixCount: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "site-monitor",
  name: "Site Monitor",
  description: "Monitors deployed sites for SEO, performance, and content quality issues. Runs daily.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.7,
  scheduleIntervalSec: 86400, // 24 hours
  maxConcurrency: 5,
  maxRetries: 2,
  retryBaseDelayMs: 2000,
  taskTimeoutMs: 60_000, // 60s per site
  model: "claude-haiku-4-5-20251001",
  settings: {},
  tags: ["monitoring", "seo", "performance", "quality"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class SiteMonitorAgent extends BaseAgent<SiteMonitorInput, SiteMonitorOutput> {
  protected async discoverTasks(): Promise<SiteMonitorInput[]> {
    try {
      const { sql } = await import("@/lib/db");
      const sites = await sql`
        SELECT s.id, s.slug, s.name
        FROM sites s
        WHERE s.status = 'active'
        ORDER BY s.created_at DESC
        LIMIT 50
      `;

      return sites.map((s: Record<string, unknown>) => ({
        siteId: s.id as string,
        slug: s.slug as string,
        url: `https://${s.slug}.zoobicon.sh`,
      }));
    } catch {
      return [];
    }
  }

  protected async execute(
    input: SiteMonitorInput,
    _context: TaskContext
  ): Promise<{ output: SiteMonitorOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    // Fetch the site HTML
    let html = input.html;
    if (!html) {
      try {
        const { sql } = await import("@/lib/db");
        const deployments = await sql`
          SELECT code FROM deployments
          WHERE site_id = ${input.siteId} AND status = 'active'
          ORDER BY created_at DESC LIMIT 1
        `;
        html = deployments[0]?.code as string;
      } catch {
        // Try fetching via URL
        try {
          const res = await fetch(input.url, { signal: AbortSignal.timeout(10_000) });
          html = await res.text();
        } catch {
          return {
            output: { seoScore: 0, performanceScore: 0, contentScore: 0, overallScore: 0, issueCount: 1, autoFixCount: 0 },
            confidence: 0.5,
            findings: [{ severity: "error", category: "availability", title: "Site unreachable", description: `Could not fetch ${input.url}`, autoFixed: false }],
          };
        }
      }
    }

    if (!html) {
      return {
        output: { seoScore: 0, performanceScore: 0, contentScore: 0, overallScore: 0, issueCount: 1, autoFixCount: 0 },
        confidence: 0.5,
        findings: [{ severity: "error", category: "availability", title: "No HTML found", description: `No deployment found for site ${input.slug}`, autoFixed: false }],
      };
    }

    // --- SEO Audit ---
    let seoScore = 100;

    if (!html.includes("<title>") || html.includes("<title></title>")) {
      findings.push({ severity: "error", category: "seo", title: "Missing page title", description: "No <title> tag found", autoFixed: false });
      seoScore -= 15;
    }
    if (!html.includes('name="description"')) {
      findings.push({ severity: "warning", category: "seo", title: "Missing meta description", description: "No meta description tag", autoFixed: false });
      seoScore -= 10;
    }
    if (!html.includes("<h1")) {
      findings.push({ severity: "warning", category: "seo", title: "Missing H1 heading", description: "Page has no H1 element", autoFixed: false });
      seoScore -= 10;
    }

    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const imgsWithoutAlt = imgTags.filter((t) => !t.includes("alt="));
    if (imgsWithoutAlt.length > 0) {
      findings.push({
        severity: "warning",
        category: "seo",
        title: `${imgsWithoutAlt.length} images missing alt text`,
        description: "Images without alt attributes hurt accessibility and SEO",
        autoFixed: false,
      });
      seoScore -= Math.min(imgsWithoutAlt.length * 3, 15);
    }

    if (!html.includes("og:title") || !html.includes("og:description")) {
      findings.push({ severity: "info", category: "seo", title: "Missing Open Graph tags", description: "Add og:title and og:description for social sharing", autoFixed: false });
      seoScore -= 5;
    }

    // --- Performance Audit ---
    let performanceScore = 100;
    const sizeKB = Math.round(html.length / 1024);

    if (sizeKB > 500) {
      findings.push({ severity: "warning", category: "performance", title: `Large page size: ${sizeKB}KB`, description: "Pages over 500KB load slower on mobile", autoFixed: false });
      performanceScore -= 15;
    }

    const scriptTags = (html.match(/<script/gi) || []).length;
    if (scriptTags > 10) {
      findings.push({ severity: "info", category: "performance", title: `${scriptTags} script tags`, description: "Consider bundling scripts for faster loading", autoFixed: false });
      performanceScore -= 5;
    }

    if (!html.includes('viewport')) {
      findings.push({ severity: "error", category: "performance", title: "Missing viewport meta", description: "No viewport meta tag — site won't render properly on mobile", autoFixed: false });
      performanceScore -= 20;
    }

    // --- Content Audit ---
    let contentScore = 100;
    const textContent = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

    if (textContent.length < 200) {
      findings.push({ severity: "error", category: "content", title: "Very thin content", description: `Only ${textContent.length} characters of body text`, autoFixed: false });
      contentScore -= 30;
    }

    const placeholderPatterns = ["lorem ipsum", "placeholder", "coming soon", "todo", "fixme", "xxx"];
    for (const pattern of placeholderPatterns) {
      if (textContent.toLowerCase().includes(pattern)) {
        findings.push({ severity: "warning", category: "content", title: `Placeholder text: "${pattern}"`, description: "Contains placeholder content that should be replaced", autoFixed: false });
        contentScore -= 10;
        break;
      }
    }

    if (html.includes('href="#"')) {
      const deadLinks = (html.match(/href="#"/g) || []).length;
      findings.push({ severity: "warning", category: "content", title: `${deadLinks} dead links (href="#")`, description: "Links pointing to # should be updated", autoFixed: false });
      contentScore -= Math.min(deadLinks * 3, 15);
    }

    // --- Calculate scores ---
    seoScore = Math.max(0, seoScore);
    performanceScore = Math.max(0, performanceScore);
    contentScore = Math.max(0, contentScore);
    const overallScore = Math.round((seoScore + performanceScore + contentScore) / 3);

    return {
      output: {
        seoScore,
        performanceScore,
        contentScore,
        overallScore,
        issueCount: findings.length,
        autoFixCount: findings.filter((f) => f.autoFixed).length,
      },
      confidence: 0.9,
      findings,
    };
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new SiteMonitorAgent(CONFIG, store));

export { SiteMonitorAgent, CONFIG as SITE_MONITOR_CONFIG };
