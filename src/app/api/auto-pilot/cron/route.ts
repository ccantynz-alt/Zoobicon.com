/**
 * Auto-Pilot Cron — Background agent that continuously improves user sites
 *
 * Runs on schedule to audit SEO, performance, and content freshness.
 * Generates weekly reports and surfaces recommendations.
 */

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

interface AuditFinding {
  category: "seo" | "performance" | "content" | "accessibility";
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  autoFixed: boolean;
  beforeValue?: string;
  afterValue?: string;
}

function auditSEO(html: string): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // Check meta title
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (!titleMatch || !titleMatch[1]?.trim()) {
    findings.push({
      category: "seo",
      severity: "critical",
      title: "Missing page title",
      description: "Add a descriptive <title> tag for better search engine visibility.",
      autoFixed: false,
    });
  } else if (titleMatch[1].length > 60) {
    findings.push({
      category: "seo",
      severity: "warning",
      title: "Title too long",
      description: `Title is ${titleMatch[1].length} chars. Keep it under 60 for optimal display in search results.`,
      autoFixed: false,
    });
  }

  // Check meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  if (!descMatch || !descMatch[1]?.trim()) {
    findings.push({
      category: "seo",
      severity: "critical",
      title: "Missing meta description",
      description: "Add a meta description (150-160 chars) to improve click-through rates from search results.",
      autoFixed: false,
    });
  }

  // Check heading hierarchy
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count === 0) {
    findings.push({
      category: "seo",
      severity: "warning",
      title: "Missing H1 heading",
      description: "Every page should have exactly one H1 heading for proper document structure.",
      autoFixed: false,
    });
  } else if (h1Count > 1) {
    findings.push({
      category: "seo",
      severity: "warning",
      title: `Multiple H1 headings (${h1Count})`,
      description: "Use only one H1 per page. Convert extras to H2 or H3.",
      autoFixed: false,
    });
  }

  // Check for alt text on images
  const images = html.match(/<img[^>]*>/gi) || [];
  const missingAlt = images.filter((img) => !/alt=["'][^"']+["']/i.test(img));
  if (missingAlt.length > 0) {
    findings.push({
      category: "seo",
      severity: "warning",
      title: `${missingAlt.length} image(s) missing alt text`,
      description: "Add descriptive alt attributes to all images for accessibility and SEO.",
      autoFixed: false,
    });
  }

  // Check for Open Graph tags
  if (!/<meta\s+property=["']og:/i.test(html)) {
    findings.push({
      category: "seo",
      severity: "info",
      title: "Missing Open Graph tags",
      description: "Add og:title, og:description, and og:image for better social media sharing.",
      autoFixed: false,
    });
  }

  // Check for JSON-LD structured data
  if (!/"@context":\s*"https?:\/\/schema\.org"/i.test(html)) {
    findings.push({
      category: "seo",
      severity: "info",
      title: "No structured data (JSON-LD)",
      description: "Add Schema.org markup for rich search results (star ratings, FAQs, breadcrumbs).",
      autoFixed: false,
    });
  }

  return findings;
}

function auditPerformance(html: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const sizeKB = Math.round(html.length / 1024);

  if (sizeKB > 500) {
    findings.push({
      category: "performance",
      severity: "critical",
      title: `Large HTML file (${sizeKB}KB)`,
      description: "Consider splitting into multiple pages or lazy-loading below-fold content.",
      autoFixed: false,
    });
  } else if (sizeKB > 200) {
    findings.push({
      category: "performance",
      severity: "warning",
      title: `HTML file size: ${sizeKB}KB`,
      description: "File is getting large. Consider optimizing inline styles and scripts.",
      autoFixed: false,
    });
  }

  // Count inline scripts
  const scriptCount = (html.match(/<script[\s>]/gi) || []).length;
  if (scriptCount > 5) {
    findings.push({
      category: "performance",
      severity: "warning",
      title: `${scriptCount} inline scripts`,
      description: "Multiple scripts can slow page load. Consider combining or deferring non-critical scripts.",
      autoFixed: false,
    });
  }

  // Check for large images (non-lazy)
  const nonLazyImages = (html.match(/<img(?![^>]*loading=["']lazy["'])[^>]*>/gi) || []).length;
  if (nonLazyImages > 3) {
    findings.push({
      category: "performance",
      severity: "info",
      title: `${nonLazyImages} images without lazy loading`,
      description: "Add loading=\"lazy\" to below-fold images to improve initial page load speed.",
      autoFixed: false,
    });
  }

  return findings;
}

function computeSEOScore(findings: AuditFinding[]): number {
  let score = 100;
  for (const f of findings) {
    if (f.category !== "seo") continue;
    if (f.severity === "critical") score -= 20;
    else if (f.severity === "warning") score -= 10;
    else score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

export async function GET() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ message: "Auto-pilot: no database configured", runs: 0 });
  }

  try {
    // Get all sites with active auto-pilot (or all sites if no config table)
    let sites: { id: string; slug: string; name: string; email: string }[] = [];
    try {
      const rows = await db`SELECT id, slug, name, email FROM sites WHERE status = 'active' LIMIT 50`;
      sites = rows as typeof sites;
    } catch {
      return NextResponse.json({ message: "No sites table or no active sites", runs: 0 });
    }

    if (sites.length === 0) {
      return NextResponse.json({ message: "No active sites to audit", runs: 0 });
    }

    const results: { siteId: string; slug: string; seoScore: number; findings: number }[] = [];

    for (const site of sites) {
      try {
        // Fetch latest deployment code
        const deployments = await db`
          SELECT code FROM deployments
          WHERE site_id = ${site.id} AND status = 'active'
          ORDER BY created_at DESC LIMIT 1
        `;
        if (!deployments.length || !deployments[0].code) continue;

        const html = deployments[0].code as string;

        // Run audits
        const seoFindings = auditSEO(html);
        const perfFindings = auditPerformance(html);
        const allFindings = [...seoFindings, ...perfFindings];
        const seoScore = computeSEOScore(seoFindings);

        results.push({
          siteId: site.id,
          slug: site.slug as string,
          seoScore,
          findings: allFindings.length,
        });

        // Store run in auto_pilot_runs if table exists
        try {
          await db`
            INSERT INTO auto_pilot_runs (site_id, user_email, type, findings, score, run_at)
            VALUES (${site.id}, ${site.email}, 'seo_audit', ${JSON.stringify(allFindings)}::jsonb, ${seoScore}, NOW())
          `;
        } catch {
          // Table might not exist yet — that's okay
        }
      } catch {
        // Skip individual site errors
      }
    }

    return NextResponse.json({
      message: `Auto-pilot completed: ${results.length} sites audited`,
      runs: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Auto-pilot failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
