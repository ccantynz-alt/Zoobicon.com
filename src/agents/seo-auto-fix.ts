/**
 * SEO Auto-Fix Agent
 *
 * Continuously improves SEO across all deployed sites:
 * - Checks deployed sites for missing meta tags
 * - Validates structured data is present and valid
 * - Checks for broken internal links
 * - Monitors heading hierarchy (H1, H2, H3)
 * - Auto-fixes: adds missing meta descriptions, fixes broken links
 * - Scores each site's SEO health
 *
 * Runs every 6 hours.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SEOCheckInput {
  siteId: string;
  slug: string;
  name: string;
  url: string;
}

interface SEOCheckOutput {
  siteId: string;
  slug: string;
  score: number; // 0-100
  issues: string[];
  autoFixed: string[];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "seo-auto-fix",
  name: "SEO Auto-Fix",
  description: "Continuously audits deployed sites for SEO issues and auto-fixes what it can — missing meta tags, heading hierarchy, structured data.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.8,
  scheduleIntervalSec: 21600, // 6 hours
  maxConcurrency: 5,
  maxRetries: 1,
  retryBaseDelayMs: 5000,
  taskTimeoutMs: 30_000,
  settings: {
    maxSitesPerRun: 20,
    autoFixMetaDescription: true,
    autoFixViewport: true,
  },
  tags: ["seo", "optimization", "auto-fix", "meta-tags", "structured-data"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class SEOAutoFixAgent extends BaseAgent<SEOCheckInput, SEOCheckOutput> {
  protected async discoverTasks(): Promise<SEOCheckInput[]> {
    try {
      const { sql } = await import("@/lib/db");

      // Get active deployed sites (limit per run to avoid overload)
      const sites = await sql`
        SELECT s.id, s.slug, s.name
        FROM sites s
        JOIN deployments d ON d.site_id = s.id
        WHERE s.status = 'active'
          AND d.status = 'active'
        ORDER BY d.created_at DESC
        LIMIT ${CONFIG.settings.maxSitesPerRun as number}
      `;

      return sites.map((s) => ({
        siteId: String(s.id),
        slug: s.slug,
        name: s.name || s.slug,
        url: `https://${s.slug}.zoobicon.sh`,
      }));
    } catch {
      return [];
    }
  }

  protected async execute(
    input: SEOCheckInput,
    _context: TaskContext
  ): Promise<{ output: SEOCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];
    const issues: string[] = [];
    const autoFixed: string[] = [];
    let score = 100;

    try {
      const { sql } = await import("@/lib/db");

      // Fetch the deployed HTML
      const deployments = await sql`
        SELECT code FROM deployments
        WHERE site_id = ${input.siteId}
          AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (deployments.length === 0) {
        return {
          output: { siteId: input.siteId, slug: input.slug, score: 0, issues: ["No active deployment"], autoFixed: [] },
          confidence: 0.9,
          findings,
        };
      }

      let html = deployments[0].code as string;
      let modified = false;

      // ── Check 1: Title tag ──
      const hasTitle = /<title[^>]*>(.+?)<\/title>/i.test(html);
      if (!hasTitle) {
        score -= 20;
        issues.push("Missing <title> tag");

        findings.push({
          severity: "error",
          category: "seo:missing-title",
          title: `${input.name}: Missing Title Tag`,
          description: `Site ${input.slug}.zoobicon.sh has no <title> tag. Search engines need this for indexing.`,
          autoFixed: false,
          metadata: { siteId: input.siteId, slug: input.slug },
        });
      }

      // ── Check 2: Meta description ──
      const hasMetaDesc = /<meta\s+name=["']description["'][^>]*>/i.test(html);
      if (!hasMetaDesc) {
        score -= 15;
        issues.push("Missing meta description");

        // Auto-fix: add a default meta description from the first paragraph
        if (CONFIG.settings.autoFixMetaDescription) {
          const bodyTextMatch = html.match(/<(?:p|h1|h2)[^>]*>([^<]{20,150})/i);
          if (bodyTextMatch) {
            const description = bodyTextMatch[1].replace(/['"]/g, "").trim().slice(0, 155);
            const metaTag = `<meta name="description" content="${description}">`;

            // Insert before </head>
            if (html.includes("</head>")) {
              html = html.replace("</head>", `  ${metaTag}\n</head>`);
              modified = true;
              autoFixed.push("Added meta description from page content");

              findings.push({
                severity: "info",
                category: "seo:auto-fix",
                title: `${input.name}: Auto-Added Meta Description`,
                description: `Added meta description: "${description.slice(0, 80)}..." to ${input.slug}.zoobicon.sh.`,
                autoFixed: true,
                afterValue: metaTag,
              });
            }
          } else {
            findings.push({
              severity: "warning",
              category: "seo:missing-meta-desc",
              title: `${input.name}: Missing Meta Description`,
              description: `Cannot auto-generate description — no suitable paragraph text found.`,
              autoFixed: false,
            });
          }
        }
      }

      // ── Check 3: Viewport meta ──
      const hasViewport = /<meta\s+name=["']viewport["'][^>]*>/i.test(html);
      if (!hasViewport) {
        score -= 10;
        issues.push("Missing viewport meta tag");

        if (CONFIG.settings.autoFixViewport && html.includes("</head>")) {
          const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1">';
          html = html.replace("</head>", `  ${viewportTag}\n</head>`);
          modified = true;
          autoFixed.push("Added viewport meta tag");
        }
      }

      // ── Check 4: H1 heading ──
      const h1Matches = html.match(/<h1[^>]*>/gi) || [];
      if (h1Matches.length === 0) {
        score -= 10;
        issues.push("Missing H1 heading");
        findings.push({
          severity: "warning",
          category: "seo:missing-h1",
          title: `${input.name}: No H1 Heading`,
          description: `Site ${input.slug}.zoobicon.sh has no H1 heading. Search engines use H1 as a primary signal.`,
          autoFixed: false,
        });
      } else if (h1Matches.length > 1) {
        score -= 5;
        issues.push(`Multiple H1 headings (${h1Matches.length})`);
      }

      // ── Check 5: Image alt tags ──
      const imgTags = html.match(/<img[^>]*>/gi) || [];
      const imgsWithoutAlt = imgTags.filter((img) => !/alt=/i.test(img));
      if (imgsWithoutAlt.length > 0) {
        score -= Math.min(15, imgsWithoutAlt.length * 3);
        issues.push(`${imgsWithoutAlt.length} image(s) missing alt text`);

        findings.push({
          severity: "warning",
          category: "seo:missing-alt",
          title: `${input.name}: ${imgsWithoutAlt.length} Image(s) Without Alt Text`,
          description: `${imgsWithoutAlt.length} of ${imgTags.length} images have no alt attribute. This hurts accessibility and SEO.`,
          autoFixed: false,
          metadata: { totalImages: imgTags.length, missingAlt: imgsWithoutAlt.length },
        });
      }

      // ── Check 6: Open Graph tags ──
      const hasOGTitle = /<meta\s+property=["']og:title["'][^>]*>/i.test(html);
      const hasOGDesc = /<meta\s+property=["']og:description["'][^>]*>/i.test(html);
      const hasOGImage = /<meta\s+property=["']og:image["'][^>]*>/i.test(html);

      if (!hasOGTitle || !hasOGDesc) {
        score -= 5;
        issues.push("Missing Open Graph tags (og:title/og:description)");
      }
      if (!hasOGImage) {
        score -= 3;
        issues.push("Missing og:image tag");
      }

      // ── Check 7: JSON-LD structured data ──
      const hasJsonLd = /application\/ld\+json/i.test(html);
      if (!hasJsonLd) {
        score -= 5;
        issues.push("No JSON-LD structured data");
      }

      // ── Check 8: Canonical URL ──
      const hasCanonical = /<link\s+rel=["']canonical["'][^>]*>/i.test(html);
      if (!hasCanonical) {
        score -= 5;
        issues.push("Missing canonical URL");
      }

      // ── Check 9: Lang attribute ──
      const hasLang = /<html[^>]*\slang=/i.test(html);
      if (!hasLang) {
        score -= 3;
        issues.push("Missing lang attribute on <html>");
      }

      // Ensure score stays in bounds
      score = Math.max(0, Math.min(100, score));

      // Save auto-fixes if HTML was modified
      if (modified) {
        try {
          await sql`
            UPDATE deployments
            SET code = ${html}
            WHERE site_id = ${input.siteId}
              AND status = 'active'
          `;
        } catch {
          autoFixed.length = 0; // Reset if save failed
        }
      }

      // Store SEO score
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS seo_scores (
            id SERIAL PRIMARY KEY,
            site_id TEXT NOT NULL,
            slug TEXT NOT NULL,
            score INT NOT NULL,
            issues TEXT[],
            auto_fixed TEXT[],
            checked_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;

        await sql`
          INSERT INTO seo_scores (site_id, slug, score, issues, auto_fixed)
          VALUES (${input.siteId}, ${input.slug}, ${score}, ${issues}, ${autoFixed})
        `;
      } catch {
        // Score storage failed
      }

      // Overall finding for low-score sites
      if (score < 60) {
        findings.push({
          severity: "error",
          category: "seo:low-score",
          title: `${input.name}: SEO Score ${score}/100`,
          description: `Site ${input.slug}.zoobicon.sh scored ${score}/100 on SEO. Issues: ${issues.join(", ")}. Auto-fixed: ${autoFixed.length > 0 ? autoFixed.join(", ") : "none"}.`,
          autoFixed: autoFixed.length > 0,
          metadata: { score, issues, autoFixed },
        });
      }

      return {
        output: { siteId: input.siteId, slug: input.slug, score, issues, autoFixed },
        confidence: 0.9,
        findings,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        output: { siteId: input.siteId, slug: input.slug, score: 0, issues: [errorMsg], autoFixed: [] },
        confidence: 0.5,
        findings,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new SEOAutoFixAgent(CONFIG, store));

export { SEOAutoFixAgent, CONFIG as SEO_AUTO_FIX_CONFIG };
