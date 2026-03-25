/**
 * Content Quality Auditor Agent
 *
 * Audits recently generated and deployed sites for quality:
 * - Checks for broken images, missing sections, empty pages
 * - Validates component library injection
 * - Checks accessibility (missing alt tags, contrast hints)
 * - Scores each site and flags low-quality ones
 * - Sends weekly quality report to admin
 *
 * Runs every 4 hours.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QualityAuditInput {
  siteId: string;
  slug: string;
  deploymentId?: string;
}

interface QualityAuditOutput {
  overallScore: number;
  componentLibraryInjected: boolean;
  imageCount: number;
  sectionCount: number;
  bodyTextLength: number;
  accessibilityIssues: number;
  issueCount: number;
}

// ---------------------------------------------------------------------------
// Quality Thresholds
// ---------------------------------------------------------------------------

const THRESHOLDS = {
  /** Minimum body text characters */
  MIN_BODY_TEXT: 200,
  /** Minimum number of images */
  MIN_IMAGES: 4,
  /** Minimum number of sections */
  MIN_SECTIONS: 5,
  /** Score below which a site is flagged */
  FLAG_THRESHOLD: 50,
  /** Required sections for a quality site */
  REQUIRED_SECTIONS: ["nav", "hero", "features", "footer"],
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "quality-auditor",
  name: "Content Quality Auditor",
  description: "Audits deployed sites for quality: images, sections, component library, accessibility. Runs every 4 hours.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.7,
  scheduleIntervalSec: 14400, // 4 hours
  maxConcurrency: 5,
  maxRetries: 2,
  retryBaseDelayMs: 2000,
  taskTimeoutMs: 45_000, // 45s per site
  settings: {},
  tags: ["quality", "monitoring", "accessibility", "content"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class QualityAuditorAgent extends BaseAgent<QualityAuditInput, QualityAuditOutput> {
  protected async discoverTasks(): Promise<QualityAuditInput[]> {
    try {
      const { sql } = await import("@/lib/db");

      // Get recently deployed sites (last 4 hours) that haven't been audited
      const sites = await sql`
        SELECT s.id as site_id, s.slug, d.id as deployment_id
        FROM sites s
        INNER JOIN deployments d ON d.site_id = s.id
        WHERE d.status = 'active'
          AND d.created_at > NOW() - INTERVAL '4 hours'
        ORDER BY d.created_at DESC
        LIMIT 30
      `;

      if (sites.length > 0) {
        return sites.map((s: Record<string, unknown>) => ({
          siteId: s.site_id as string,
          slug: s.slug as string,
          deploymentId: s.deployment_id as string,
        }));
      }

      // If no recent deployments, audit a sample of active sites
      const sample = await sql`
        SELECT s.id as site_id, s.slug
        FROM sites s
        WHERE s.status = 'active'
        ORDER BY RANDOM()
        LIMIT 10
      `;

      return sample.map((s: Record<string, unknown>) => ({
        siteId: s.site_id as string,
        slug: s.slug as string,
      }));
    } catch {
      return [];
    }
  }

  protected async execute(
    input: QualityAuditInput,
    _context: TaskContext
  ): Promise<{ output: QualityAuditOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    // Fetch the site HTML
    let html: string | null = null;

    try {
      const { sql } = await import("@/lib/db");
      const query = input.deploymentId
        ? sql`SELECT code FROM deployments WHERE id = ${input.deploymentId}`
        : sql`SELECT code FROM deployments WHERE site_id = ${input.siteId} AND status = 'active' ORDER BY created_at DESC LIMIT 1`;

      const rows = await query;
      html = (rows[0]?.code as string) || null;
    } catch {
      // Try fetching via URL
    }

    if (!html) {
      try {
        const url = `https://${input.slug}.zoobicon.sh`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (res.ok) html = await res.text();
      } catch {
        // Site unreachable
      }
    }

    if (!html) {
      return {
        output: {
          overallScore: 0, componentLibraryInjected: false, imageCount: 0,
          sectionCount: 0, bodyTextLength: 0, accessibilityIssues: 0, issueCount: 1,
        },
        confidence: 0.5,
        findings: [{
          severity: "error", category: "quality:availability",
          title: `Site ${input.slug} has no HTML`, description: "Could not retrieve site code from database or URL.",
          autoFixed: false,
        }],
      };
    }

    let score = 100;
    const htmlLower = html.toLowerCase();

    // ── 1. Component Library Check ──
    const hasComponentLibrary = html.includes("ZOOBICON COMPONENT LIBRARY") || html.includes("zoobicon-component-library");

    if (!hasComponentLibrary) {
      score -= 25;
      findings.push({
        severity: "error",
        category: "quality:component-library",
        title: `Missing component library on ${input.slug}`,
        description: "The Zoobicon Component Library CSS is not injected. Buttons, cards, grids, and animations will be broken.",
        autoFixed: false,
      });
    }

    // ── 2. Image Count ──
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const imageCount = imgTags.length;

    if (imageCount < THRESHOLDS.MIN_IMAGES) {
      score -= 15;
      findings.push({
        severity: "warning",
        category: "quality:images",
        title: `Only ${imageCount} images (minimum: ${THRESHOLDS.MIN_IMAGES})`,
        description: `Site ${input.slug} has too few images. Quality sites need hero, feature, about, and testimonial images.`,
        autoFixed: false,
      });
    }

    // Check for broken image sources
    const brokenImgPatterns = imgTags.filter(
      (t) => t.includes('src=""') || t.includes("src='") && t.includes("src=''")
    );
    if (brokenImgPatterns.length > 0) {
      score -= 10;
      findings.push({
        severity: "error",
        category: "quality:images",
        title: `${brokenImgPatterns.length} images with empty src`,
        description: "Empty image sources cause broken image icons.",
        autoFixed: false,
      });
    }

    // ── 3. Section Count ──
    const sectionMatches = htmlLower.match(/<section/gi) || [];
    const sectionCount = sectionMatches.length;

    if (sectionCount < THRESHOLDS.MIN_SECTIONS) {
      score -= 15;
      findings.push({
        severity: "warning",
        category: "quality:structure",
        title: `Only ${sectionCount} sections (minimum: ${THRESHOLDS.MIN_SECTIONS})`,
        description: "Quality sites need nav, hero, features, about, testimonials, stats, FAQ, CTA, and footer.",
        autoFixed: false,
      });
    }

    // Check required sections
    for (const section of THRESHOLDS.REQUIRED_SECTIONS) {
      const patterns: Record<string, RegExp> = {
        nav: /<nav/i,
        hero: /hero|class=".*hero/i,
        features: /features|class=".*feature/i,
        footer: /<footer/i,
      };
      if (patterns[section] && !patterns[section].test(html)) {
        score -= 5;
        findings.push({
          severity: "warning",
          category: "quality:structure",
          title: `Missing ${section} section`,
          description: `No ${section} element detected in the HTML.`,
          autoFixed: false,
        });
      }
    }

    // ── 4. Body Text Length ──
    const textContent = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const bodyTextLength = textContent.length;

    if (bodyTextLength < THRESHOLDS.MIN_BODY_TEXT) {
      score -= 20;
      findings.push({
        severity: "error",
        category: "quality:content",
        title: `Very thin content: ${bodyTextLength} characters`,
        description: `Site ${input.slug} has almost no visible text. Minimum is ${THRESHOLDS.MIN_BODY_TEXT} characters.`,
        autoFixed: false,
      });
    }

    // Check for banned generic phrases
    const bannedPhrases = [
      "your business, elevated online",
      "trusted by businesses worldwide",
      "welcome to [",
      "our team of experts",
      "cutting-edge technology",
      "take your business to the next level",
    ];
    for (const phrase of bannedPhrases) {
      if (textContent.toLowerCase().includes(phrase)) {
        score -= 5;
        findings.push({
          severity: "warning",
          category: "quality:copy",
          title: `Generic copy detected: "${phrase}"`,
          description: "This banned phrase makes the site feel templated rather than custom.",
          autoFixed: false,
        });
        break; // Only penalize once for generic copy
      }
    }

    // ── 5. Accessibility Checks ──
    let accessibilityIssues = 0;

    // Missing alt tags
    const imgsWithoutAlt = imgTags.filter((t) => !t.includes("alt="));
    if (imgsWithoutAlt.length > 0) {
      accessibilityIssues += imgsWithoutAlt.length;
      score -= Math.min(imgsWithoutAlt.length * 2, 10);
      findings.push({
        severity: "warning",
        category: "quality:accessibility",
        title: `${imgsWithoutAlt.length} images missing alt text`,
        description: "Screen readers cannot describe these images to visually impaired users.",
        autoFixed: false,
      });
    }

    // Missing lang attribute
    if (!htmlLower.includes('lang="') && !htmlLower.includes("lang='")) {
      accessibilityIssues++;
      score -= 3;
      findings.push({
        severity: "info",
        category: "quality:accessibility",
        title: "Missing lang attribute on <html>",
        description: "The lang attribute helps screen readers pronounce text correctly.",
        autoFixed: false,
      });
    }

    // Missing viewport meta
    if (!htmlLower.includes("viewport")) {
      accessibilityIssues++;
      score -= 10;
      findings.push({
        severity: "error",
        category: "quality:accessibility",
        title: "Missing viewport meta tag",
        description: "Without a viewport tag, the site will not render correctly on mobile devices.",
        autoFixed: false,
      });
    }

    // ── 6. Color/Dark mode check ──
    if (!html.includes(":root") && !html.includes("--color-")) {
      score -= 5;
      findings.push({
        severity: "info",
        category: "quality:design",
        title: "No CSS custom properties defined",
        description: "Quality sites should use :root custom properties for consistent theming.",
        autoFixed: false,
      });
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // Flag low-quality sites
    if (score < THRESHOLDS.FLAG_THRESHOLD) {
      findings.push({
        severity: "critical",
        category: "quality:overall",
        title: `Low quality score: ${score}/100 for ${input.slug}`,
        description: `This site scored below the ${THRESHOLDS.FLAG_THRESHOLD} threshold. ${findings.length} issues found. Needs attention.`,
        autoFixed: false,
      });

      await this.sendAlert(
        `Low Quality Site: ${input.slug} scored ${score}/100`,
        `<h2>Quality Audit Alert</h2>
        <p><strong>Site:</strong> ${input.slug}.zoobicon.sh</p>
        <p><strong>Score:</strong> ${score}/100</p>
        <p><strong>Issues found:</strong> ${findings.length}</p>
        <h3>Top Issues:</h3>
        <ul>${findings.slice(0, 5).map(f => `<li><strong>${f.severity}:</strong> ${f.title}</li>`).join("")}</ul>`
      );
    }

    return {
      output: {
        overallScore: score,
        componentLibraryInjected: hasComponentLibrary,
        imageCount,
        sectionCount,
        bodyTextLength,
        accessibilityIssues,
        issueCount: findings.length,
      },
      confidence: 0.9,
      findings,
    };
  }

  // ── Helpers ──

  private async sendAlert(subject: string, html: string): Promise<void> {
    try {
      const { notifyAdmin } = await import("@/lib/admin-notify");
      await notifyAdmin({ subject: `[Quality Agent] ${subject}`, html });
    } catch {
      console.warn(`[QualityAuditor] Could not send alert: ${subject}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new QualityAuditorAgent(CONFIG, store));

export { QualityAuditorAgent, CONFIG as QUALITY_AUDITOR_CONFIG };
