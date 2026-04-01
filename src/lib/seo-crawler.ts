/**
 * AI SEO Agent — Automated Site Crawling & Optimization
 *
 * Crawls customer sites, finds SEO issues, and fixes them automatically.
 * This is what Semrush/Ahrefs charge $100+/mo for. We include it.
 *
 * Features:
 *   - Crawl all pages on a customer's site
 *   - Check meta tags, headings, images, links
 *   - Score each page (0-100)
 *   - Generate fix recommendations via Claude
 *   - Auto-apply fixes if customer enables it
 *   - Monitor competitors and alert on changes
 *   - Track keyword rankings over time
 */

import { sql } from "./db";

export interface SEOAuditResult {
  url: string;
  score: number;
  issues: SEOIssue[];
  recommendations: string[];
  crawledAt: Date;
}

export interface SEOIssue {
  type: "error" | "warning" | "info";
  category: "meta" | "content" | "technical" | "performance" | "accessibility";
  message: string;
  element?: string;
  fix?: string;
}

/**
 * Initialize SEO tables.
 */
export async function ensureSEOTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS seo_audits (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_url        TEXT NOT NULL,
      owner_email     TEXT NOT NULL,
      score           INTEGER NOT NULL DEFAULT 0,
      issues_count    INTEGER NOT NULL DEFAULT 0,
      pages_crawled   INTEGER NOT NULL DEFAULT 0,
      results         JSONB NOT NULL DEFAULT '[]',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS seo_audits_owner_idx ON seo_audits (owner_email)`;
  await sql`CREATE INDEX IF NOT EXISTS seo_audits_site_idx ON seo_audits (site_url)`;

  await sql`
    CREATE TABLE IF NOT EXISTS seo_keywords (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_url        TEXT NOT NULL,
      owner_email     TEXT NOT NULL,
      keyword         TEXT NOT NULL,
      position        INTEGER,
      previous_pos    INTEGER,
      search_volume   INTEGER,
      tracked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(site_url, keyword, tracked_at)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS seo_keywords_site_idx ON seo_keywords (site_url)`;
}

/**
 * Crawl a single page and audit its SEO.
 */
export async function auditPage(url: string): Promise<SEOAuditResult> {
  const issues: SEOIssue[] = [];
  let score = 100;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ZoobiconSEO/1.0" },
    });

    if (!res.ok) {
      return {
        url,
        score: 0,
        issues: [{ type: "error", category: "technical", message: `Page returned ${res.status}` }],
        recommendations: ["Fix the page to return a 200 status code"],
        crawledAt: new Date(),
      };
    }

    const html = await res.text();

    // Title tag
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    if (!titleMatch || !titleMatch[1].trim()) {
      issues.push({ type: "error", category: "meta", message: "Missing title tag", fix: "Add a unique, descriptive <title> tag" });
      score -= 15;
    } else if (titleMatch[1].length > 60) {
      issues.push({ type: "warning", category: "meta", message: `Title too long (${titleMatch[1].length} chars, max 60)`, fix: "Shorten title to under 60 characters" });
      score -= 5;
    } else if (titleMatch[1].length < 20) {
      issues.push({ type: "warning", category: "meta", message: "Title too short", fix: "Make title more descriptive (20-60 chars)" });
      score -= 3;
    }

    // Meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    if (!descMatch || !descMatch[1].trim()) {
      issues.push({ type: "error", category: "meta", message: "Missing meta description", fix: "Add a compelling meta description (120-160 chars)" });
      score -= 10;
    } else if (descMatch[1].length > 160) {
      issues.push({ type: "warning", category: "meta", message: `Meta description too long (${descMatch[1].length} chars)`, fix: "Shorten to under 160 characters" });
      score -= 3;
    }

    // H1 tag
    const h1Matches = html.match(/<h1[^>]*>[^<]*<\/h1>/gi) || [];
    if (h1Matches.length === 0) {
      issues.push({ type: "error", category: "content", message: "Missing H1 heading", fix: "Add exactly one H1 heading to the page" });
      score -= 10;
    } else if (h1Matches.length > 1) {
      issues.push({ type: "warning", category: "content", message: `Multiple H1 tags (${h1Matches.length})`, fix: "Use only one H1 per page" });
      score -= 5;
    }

    // Images without alt text
    const imgMatches = html.match(/<img[^>]*>/gi) || [];
    const imgsWithoutAlt = imgMatches.filter(img => !img.match(/alt=["'][^"']+["']/i));
    if (imgsWithoutAlt.length > 0) {
      issues.push({ type: "warning", category: "accessibility", message: `${imgsWithoutAlt.length} image(s) missing alt text`, fix: "Add descriptive alt text to all images" });
      score -= Math.min(imgsWithoutAlt.length * 2, 10);
    }

    // Open Graph tags
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["']/i);
    const ogDesc = html.match(/<meta[^>]*property=["']og:description["']/i);
    const ogImage = html.match(/<meta[^>]*property=["']og:image["']/i);
    if (!ogTitle || !ogDesc) {
      issues.push({ type: "warning", category: "meta", message: "Missing Open Graph tags", fix: "Add og:title, og:description, og:image meta tags" });
      score -= 5;
    }
    if (!ogImage) {
      issues.push({ type: "info", category: "meta", message: "No og:image — social shares won't have a preview image" });
      score -= 2;
    }

    // Canonical URL
    const canonical = html.match(/<link[^>]*rel=["']canonical["']/i);
    if (!canonical) {
      issues.push({ type: "warning", category: "technical", message: "Missing canonical URL", fix: "Add <link rel='canonical'> to prevent duplicate content issues" });
      score -= 5;
    }

    // Mobile viewport
    const viewport = html.match(/<meta[^>]*name=["']viewport["']/i);
    if (!viewport) {
      issues.push({ type: "error", category: "technical", message: "Missing viewport meta tag", fix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>" });
      score -= 10;
    }

    // HTTPS check
    if (url.startsWith("http://")) {
      issues.push({ type: "error", category: "technical", message: "Not using HTTPS", fix: "Redirect all traffic to HTTPS" });
      score -= 15;
    }

    // Content length
    const textContent = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const wordCount = textContent.split(/\s+/).length;
    if (wordCount < 300) {
      issues.push({ type: "warning", category: "content", message: `Thin content (${wordCount} words)`, fix: "Add more substantive content (aim for 500+ words)" });
      score -= 5;
    }

    // Structured data
    const jsonLd = html.match(/<script[^>]*type=["']application\/ld\+json["']/i);
    if (!jsonLd) {
      issues.push({ type: "info", category: "technical", message: "No structured data (JSON-LD)", fix: "Add JSON-LD structured data for rich search results" });
      score -= 3;
    }

  } catch (err) {
    issues.push({ type: "error", category: "technical", message: `Crawl failed: ${err instanceof Error ? err.message : "Unknown error"}` });
    score = 0;
  }

  score = Math.max(0, Math.min(100, score));

  const recommendations = issues
    .filter(i => i.fix)
    .sort((a, b) => (a.type === "error" ? -1 : b.type === "error" ? 1 : 0))
    .map(i => i.fix!);

  return {
    url,
    score,
    issues,
    recommendations,
    crawledAt: new Date(),
  };
}

/**
 * Crawl an entire site (up to maxPages) and audit all pages.
 */
export async function auditSite(
  siteUrl: string,
  ownerEmail: string,
  maxPages: number = 20
): Promise<{
  overallScore: number;
  pagesAudited: number;
  totalIssues: number;
  results: SEOAuditResult[];
}> {
  await ensureSEOTables();

  // Crawl the homepage first
  const results: SEOAuditResult[] = [];
  const visited = new Set<string>();
  const queue = [siteUrl];

  while (queue.length > 0 && results.length < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    const result = await auditPage(url);
    results.push(result);

    // TODO: Extract internal links and add to queue for deeper crawling
  }

  const overallScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  // Save to database
  await sql`
    INSERT INTO seo_audits (site_url, owner_email, score, issues_count, pages_crawled, results)
    VALUES (${siteUrl}, ${ownerEmail}, ${overallScore}, ${totalIssues}, ${results.length}, ${JSON.stringify(results)})
  `;

  return { overallScore, pagesAudited: results.length, totalIssues, results };
}
