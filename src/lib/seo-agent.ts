export interface SeoAuditRequest {
  url: string;
  options?: {
    checkPerformance?: boolean;
    checkAccessibility?: boolean;
    checkSchema?: boolean;
    checkLinks?: boolean;
  };
}

export interface SeoIssue {
  severity: "critical" | "warning" | "info";
  category: "meta" | "content" | "performance" | "accessibility" | "schema" | "links" | "mobile";
  message: string;
  fix: string;
  selector?: string;
}

export interface SeoScore {
  overall: number;
  meta: number;
  content: number;
  performance: number;
  accessibility: number;
  schema: number;
}

export interface SeoAuditResult {
  url: string;
  fetchedAt: number;
  title?: string;
  description?: string;
  h1Count: number;
  wordCount: number;
  hasStructuredData: boolean;
  hasOpenGraph: boolean;
  hasTwitterCard: boolean;
  hasViewport: boolean;
  hasFavicon: boolean;
  hasCanonical: boolean;
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  imageCount: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  scores: SeoScore;
  issues: SeoIssue[];
}

async function fetchWithTimeout(url: string, ms: number, method: "GET" | "HEAD" = "GET"): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      method,
      headers: { "User-Agent": "Zoobicon-SEO-Agent/1.0" },
      signal: ctrl.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

function countMatches(html: string, re: RegExp): number {
  const m = html.match(re);
  return m ? m.length : 0;
}

function extract(html: string, re: RegExp): string | undefined {
  const m = html.match(re);
  return m ? m[1] : undefined;
}

export async function auditSite(req: SeoAuditRequest): Promise<SeoAuditResult> {
  const url = req.url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  let html = "";
  try {
    const res = await fetchWithTimeout(url, 15000);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    html = await res.text();
  } catch (e) {
    throw new Error(`Failed to fetch ${url}: ${(e as Error).message}`);
  }

  const origin = parsed.origin;

  const title = extract(html, /<title[^>]*>([^<]+)<\/title>/i);
  const description = extract(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const h1Count = countMatches(html, /<h1[\s>]/gi);
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const wordCount = textOnly.split(/\s+/).filter(Boolean).length;

  const hasStructuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const hasOpenGraph = /<meta\s+property=["']og:/i.test(html);
  const hasTwitterCard = /<meta\s+name=["']twitter:/i.test(html);
  const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
  const hasFavicon = /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);

  const imgTags = html.match(/<img\s[^>]*>/gi) || [];
  const imageCount = imgTags.length;
  const imagesWithoutAlt = imgTags.filter((t) => !/\salt=/i.test(t)).length;

  const aTags = html.match(/<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi) || [];
  let internalLinks = 0;
  let externalLinks = 0;
  for (const tag of aTags) {
    const href = extract(tag, /href=["']([^"']+)["']/i) || "";
    if (href.startsWith("/") || href.startsWith(origin) || href.startsWith("#")) internalLinks++;
    else if (/^https?:\/\//i.test(href)) externalLinks++;
    else internalLinks++;
  }

  let hasRobotsTxt = false;
  let hasSitemap = false;
  try {
    const r = await fetchWithTimeout(`${origin}/robots.txt`, 5000, "HEAD");
    hasRobotsTxt = r.ok;
  } catch {}
  try {
    const r = await fetchWithTimeout(`${origin}/sitemap.xml`, 5000, "HEAD");
    hasSitemap = r.ok;
  } catch {}

  const issues: SeoIssue[] = [];

  if (!title || title.length < 30) {
    issues.push({ severity: "critical", category: "meta", message: "Title tag missing or too short", fix: "Add a 50-60 char title tag" });
  }
  if (!description || description.length < 50) {
    issues.push({ severity: "warning", category: "meta", message: "Meta description missing or too short", fix: "Add a 140-160 char meta description" });
  }
  if (h1Count !== 1) {
    issues.push({ severity: "warning", category: "content", message: `Page has ${h1Count} H1 tags (expected 1)`, fix: "Use exactly one H1 per page" });
  }
  if (wordCount < 300) {
    issues.push({ severity: "warning", category: "content", message: `Thin content (${wordCount} words)`, fix: "Aim for 300+ words of meaningful content" });
  }
  if (!hasStructuredData) {
    issues.push({ severity: "warning", category: "schema", message: "No JSON-LD structured data", fix: "Add JSON-LD schema for rich snippets" });
  }
  if (!hasOpenGraph) {
    issues.push({ severity: "warning", category: "meta", message: "Open Graph tags missing", fix: "Add Open Graph meta tags for social sharing" });
  }
  if (!hasTwitterCard) {
    issues.push({ severity: "info", category: "meta", message: "Twitter Card tags missing", fix: "Add twitter:card meta tags" });
  }
  if (!hasViewport) {
    issues.push({ severity: "critical", category: "mobile", message: "Mobile viewport meta tag missing", fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">' });
  }
  if (!hasFavicon) {
    issues.push({ severity: "info", category: "meta", message: "Favicon missing", fix: 'Add a <link rel="icon"> tag' });
  }
  if (imagesWithoutAlt > 0) {
    issues.push({ severity: "warning", category: "accessibility", message: `${imagesWithoutAlt} images missing alt text`, fix: "Add descriptive alt attributes to all images" });
  }
  if (!hasCanonical) {
    issues.push({ severity: "info", category: "meta", message: "Canonical tag missing", fix: 'Add <link rel="canonical"> to prevent duplicate content' });
  }
  if (!hasSitemap) {
    issues.push({ severity: "warning", category: "meta", message: "sitemap.xml not found", fix: "Generate and serve /sitemap.xml" });
  }
  if (!hasRobotsTxt) {
    issues.push({ severity: "info", category: "meta", message: "robots.txt not found", fix: "Add /robots.txt to control crawling" });
  }

  const scoreFor = (cats: SeoIssue["category"][]): number => {
    let s = 100;
    for (const issue of issues) {
      if (!cats.includes(issue.category)) continue;
      if (issue.severity === "critical") s -= 30;
      else if (issue.severity === "warning") s -= 10;
      else s -= 2;
    }
    return Math.max(0, s);
  };

  const meta = scoreFor(["meta"]);
  const content = scoreFor(["content"]);
  const performance = scoreFor(["performance"]);
  const accessibility = scoreFor(["accessibility"]);
  const schema = scoreFor(["schema"]);
  const mobileScore = scoreFor(["mobile"]);
  const overall = Math.round((meta + content + performance + accessibility + schema + mobileScore) / 6);

  const scores: SeoScore = { overall, meta, content, performance, accessibility, schema };

  return {
    url,
    fetchedAt: Date.now(),
    title,
    description,
    h1Count,
    wordCount,
    hasStructuredData,
    hasOpenGraph,
    hasTwitterCard,
    hasViewport,
    hasFavicon,
    hasCanonical,
    hasSitemap,
    hasRobotsTxt,
    imageCount,
    imagesWithoutAlt,
    internalLinks,
    externalLinks,
    scores,
    issues,
  };
}
// ---------------------------------------------------------------------------
// Autonomous SEO Agent
//
// Background job system that monitors and optimizes deployed sites:
//   - Scheduled crawls (configurable interval)
//   - SEO score tracking over time
//   - Automatic fix generation
//   - Rank tracking (via search API proxy)
//   - Issue alerting
//
// Architecture:
//   - Jobs stored in DB (seo_agent_jobs table)
//   - Cron endpoint at /api/seo/agent/cron (call via Vercel Cron, Railway Cron, etc.)
//   - Per-site configuration
//   - Results stored as time-series for trend analysis
//
// Tables (auto-created if missing):
//   seo_agent_config  — per-site agent configuration
//   seo_agent_runs    — audit run history with scores
//   seo_agent_issues  — individual issues found per run
//   seo_agent_fixes   — auto-generated fixes
// ---------------------------------------------------------------------------

import { sql } from "./db";

// --- Types ---

export interface SeoAgentConfig {
  id: string;
  siteId: string;
  slug: string;
  url: string;
  enabled: boolean;
  crawlIntervalHours: number;   // How often to crawl (default: 24)
  autoFix: boolean;             // Auto-apply low-risk fixes
  notifyEmail: string | null;
  keywords: string[];           // Target keywords to track
  competitors: string[];        // Competitor URLs to compare
  createdAt: string;
  lastRunAt: string | null;
}

export interface SeoAgentRun {
  id: string;
  configId: string;
  siteId: string;
  score: number;
  previousScore: number | null;
  issueCount: number;
  fixedCount: number;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
}

export interface SeoAgentIssue {
  id: string;
  runId: string;
  category: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  element: string | null;      // CSS selector or element reference
  currentValue: string | null;
  suggestedValue: string | null;
  autoFixable: boolean;
}

export interface SeoFix {
  id: string;
  issueId: string;
  runId: string;
  siteId: string;
  fixType: "meta" | "heading" | "image" | "link" | "schema" | "performance" | "content";
  description: string;
  htmlBefore: string;
  htmlAfter: string;
  applied: boolean;
  appliedAt: string | null;
}

// --- Database Schema ---

export async function ensureSeoAgentTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS seo_agent_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      url TEXT NOT NULL,
      enabled BOOLEAN DEFAULT true,
      crawl_interval_hours INT DEFAULT 24,
      auto_fix BOOLEAN DEFAULT false,
      notify_email TEXT,
      keywords TEXT[] DEFAULT '{}',
      competitors TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_run_at TIMESTAMPTZ,
      UNIQUE(site_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS seo_agent_runs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      config_id UUID REFERENCES seo_agent_config(id),
      site_id TEXT NOT NULL,
      score INT DEFAULT 0,
      previous_score INT,
      issue_count INT DEFAULT 0,
      fixed_count INT DEFAULT 0,
      status TEXT DEFAULT 'running',
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      duration_ms INT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS seo_agent_issues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id UUID REFERENCES seo_agent_runs(id),
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      element TEXT,
      current_value TEXT,
      suggested_value TEXT,
      auto_fixable BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS seo_agent_fixes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      issue_id UUID REFERENCES seo_agent_issues(id),
      run_id UUID REFERENCES seo_agent_runs(id),
      site_id TEXT NOT NULL,
      fix_type TEXT NOT NULL,
      description TEXT NOT NULL,
      html_before TEXT,
      html_after TEXT,
      applied BOOLEAN DEFAULT false,
      applied_at TIMESTAMPTZ
    )
  `;
}

// --- Agent Operations ---

/**
 * Get all sites due for an SEO audit.
 */
export async function getSitesDueForAudit(): Promise<SeoAgentConfig[]> {
  const rows = await sql`
    SELECT *
    FROM seo_agent_config
    WHERE enabled = true
      AND (
        last_run_at IS NULL
        OR last_run_at < NOW() - (crawl_interval_hours || ' hours')::INTERVAL
      )
    ORDER BY last_run_at ASC NULLS FIRST
    LIMIT 10
  `;

  return rows.map(rowToConfig);
}

/**
 * Run an SEO audit for a single site.
 */
export async function runSeoAudit(config: SeoAgentConfig): Promise<SeoAgentRun> {
  // Get the previous score
  const [prevRun] = await sql`
    SELECT score FROM seo_agent_runs
    WHERE config_id = ${config.id} AND status = 'completed'
    ORDER BY completed_at DESC
    LIMIT 1
  `;

  // Create run record
  const [run] = await sql`
    INSERT INTO seo_agent_runs (config_id, site_id, previous_score, status)
    VALUES (${config.id}, ${config.siteId}, ${prevRun?.score ?? null}, 'running')
    RETURNING *
  `;

  const startTime = Date.now();

  try {
    // Fetch the site's HTML
    const siteRes = await fetch(config.url, {
      headers: { "User-Agent": "ZoobiconSEOAgent/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!siteRes.ok) {
      throw new Error(`Failed to fetch site: ${siteRes.status}`);
    }

    const html = await siteRes.text();

    // Run the SEO analysis via our own API
    const analysisRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/seo/analyze`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, url: config.url }),
      }
    );

    if (!analysisRes.ok) {
      throw new Error("SEO analysis failed");
    }

    const analysis = await analysisRes.json();
    const score = analysis.score || 0;
    const issues = extractIssues(analysis, run.id);

    // Store issues
    for (const issue of issues) {
      await sql`
        INSERT INTO seo_agent_issues (run_id, category, severity, title, description, element, current_value, suggested_value, auto_fixable)
        VALUES (${issue.runId}, ${issue.category}, ${issue.severity}, ${issue.title}, ${issue.description}, ${issue.element}, ${issue.currentValue}, ${issue.suggestedValue}, ${issue.autoFixable})
      `;
    }

    // Generate auto-fixes for fixable issues
    let fixedCount = 0;
    if (config.autoFix) {
      const fixableIssues = issues.filter((i) => i.autoFixable);
      for (const issue of fixableIssues) {
        const fix = generateFix(issue, html);
        if (fix) {
          await sql`
            INSERT INTO seo_agent_fixes (issue_id, run_id, site_id, fix_type, description, html_before, html_after, applied)
            VALUES (${issue.id}, ${run.id}, ${config.siteId}, ${fix.fixType}, ${fix.description}, ${fix.htmlBefore}, ${fix.htmlAfter}, false)
          `;
          fixedCount++;
        }
      }
    }

    const durationMs = Date.now() - startTime;

    // Update run record
    await sql`
      UPDATE seo_agent_runs
      SET score = ${score}, issue_count = ${issues.length}, fixed_count = ${fixedCount},
          status = 'completed', completed_at = NOW(), duration_ms = ${durationMs}
      WHERE id = ${run.id}
    `;

    // Update last run timestamp
    await sql`
      UPDATE seo_agent_config SET last_run_at = NOW() WHERE id = ${config.id}
    `;

    return {
      id: run.id,
      configId: config.id,
      siteId: config.siteId,
      score,
      previousScore: prevRun?.score ?? null,
      issueCount: issues.length,
      fixedCount,
      status: "completed",
      startedAt: run.started_at,
      completedAt: new Date().toISOString(),
      durationMs,
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;

    await sql`
      UPDATE seo_agent_runs
      SET status = 'failed', completed_at = NOW(), duration_ms = ${durationMs}
      WHERE id = ${run.id}
    `;

    return {
      id: run.id,
      configId: config.id,
      siteId: config.siteId,
      score: 0,
      previousScore: prevRun?.score ?? null,
      issueCount: 0,
      fixedCount: 0,
      status: "failed",
      startedAt: run.started_at,
      completedAt: new Date().toISOString(),
      durationMs,
    };
  }
}

/**
 * Get audit history for a site.
 */
export async function getAuditHistory(siteId: string, limit = 30): Promise<SeoAgentRun[]> {
  const rows = await sql`
    SELECT * FROM seo_agent_runs
    WHERE site_id = ${siteId} AND status = 'completed'
    ORDER BY completed_at DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    id: r.id,
    configId: r.config_id,
    siteId: r.site_id,
    score: r.score,
    previousScore: r.previous_score,
    issueCount: r.issue_count,
    fixedCount: r.fixed_count,
    status: r.status,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    durationMs: r.duration_ms,
  }));
}

/**
 * Get issues for a specific run.
 */
export async function getRunIssues(runId: string): Promise<SeoAgentIssue[]> {
  const rows = await sql`
    SELECT * FROM seo_agent_issues
    WHERE run_id = ${runId}
    ORDER BY severity ASC, category ASC
  `;

  return rows.map((r) => ({
    id: r.id,
    runId: r.run_id,
    category: r.category,
    severity: r.severity,
    title: r.title,
    description: r.description,
    element: r.element,
    currentValue: r.current_value,
    suggestedValue: r.suggested_value,
    autoFixable: r.auto_fixable,
  }));
}

/**
 * Get pending fixes for a site.
 */
export async function getPendingFixes(siteId: string): Promise<SeoFix[]> {
  const rows = await sql`
    SELECT * FROM seo_agent_fixes
    WHERE site_id = ${siteId} AND applied = false
    ORDER BY created_at DESC
  `;

  return rows.map((r) => ({
    id: r.id,
    issueId: r.issue_id,
    runId: r.run_id,
    siteId: r.site_id,
    fixType: r.fix_type,
    description: r.description,
    htmlBefore: r.html_before,
    htmlAfter: r.html_after,
    applied: r.applied,
    appliedAt: r.applied_at,
  }));
}

/**
 * Enable/configure the SEO agent for a site.
 */
export async function configureSeoAgent(params: {
  siteId: string;
  slug: string;
  url: string;
  enabled?: boolean;
  crawlIntervalHours?: number;
  autoFix?: boolean;
  notifyEmail?: string;
  keywords?: string[];
  competitors?: string[];
}): Promise<SeoAgentConfig> {
  const [existing] = await sql`
    SELECT id FROM seo_agent_config WHERE site_id = ${params.siteId}
  `;

  if (existing) {
    const [row] = await sql`
      UPDATE seo_agent_config
      SET
        enabled = COALESCE(${params.enabled ?? null}, enabled),
        crawl_interval_hours = COALESCE(${params.crawlIntervalHours ?? null}, crawl_interval_hours),
        auto_fix = COALESCE(${params.autoFix ?? null}, auto_fix),
        notify_email = COALESCE(${params.notifyEmail ?? null}, notify_email),
        keywords = COALESCE(${params.keywords ?? null}, keywords),
        competitors = COALESCE(${params.competitors ?? null}, competitors)
      WHERE site_id = ${params.siteId}
      RETURNING *
    `;
    return rowToConfig(row);
  }

  const [row] = await sql`
    INSERT INTO seo_agent_config (site_id, slug, url, enabled, crawl_interval_hours, auto_fix, notify_email, keywords, competitors)
    VALUES (
      ${params.siteId},
      ${params.slug},
      ${params.url},
      ${params.enabled ?? true},
      ${params.crawlIntervalHours ?? 24},
      ${params.autoFix ?? false},
      ${params.notifyEmail ?? null},
      ${params.keywords ?? []},
      ${params.competitors ?? []}
    )
    RETURNING *
  `;

  return rowToConfig(row);
}

// --- Helpers ---

function rowToConfig(row: Record<string, unknown>): SeoAgentConfig {
  return {
    id: row.id as string,
    siteId: row.site_id as string,
    slug: row.slug as string,
    url: row.url as string,
    enabled: row.enabled as boolean,
    crawlIntervalHours: row.crawl_interval_hours as number,
    autoFix: row.auto_fix as boolean,
    notifyEmail: row.notify_email as string | null,
    keywords: (row.keywords || []) as string[],
    competitors: (row.competitors || []) as string[],
    createdAt: row.created_at as string,
    lastRunAt: row.last_run_at as string | null,
  };
}

interface AnalysisIssue {
  runId: string;
  id: string;
  category: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  element: string | null;
  currentValue: string | null;
  suggestedValue: string | null;
  autoFixable: boolean;
}

function extractIssues(analysis: Record<string, unknown>, runId: string): AnalysisIssue[] {
  const issues: AnalysisIssue[] = [];

  const categories = analysis.categories as Array<{
    name: string;
    checks: Array<{
      name: string;
      passed: boolean;
      message: string;
      impact: string;
    }>;
  }> | undefined;

  if (!categories) return issues;

  for (const cat of categories) {
    for (const check of cat.checks) {
      if (!check.passed) {
        const severity = check.impact === "high" ? "critical"
          : check.impact === "medium" ? "warning"
          : "info";

        const autoFixable = isAutoFixable(cat.name, check.name);

        issues.push({
          id: `issue_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          runId,
          category: cat.name,
          severity: severity as "critical" | "warning" | "info",
          title: check.name,
          description: check.message,
          element: null,
          currentValue: null,
          suggestedValue: null,
          autoFixable,
        });
      }
    }
  }

  return issues;
}

function isAutoFixable(category: string, checkName: string): boolean {
  const fixable = [
    "Meta Description",
    "Title Tag",
    "Alt Text",
    "Open Graph Tags",
    "Canonical URL",
    "Heading Hierarchy",
    "Viewport Meta",
    "Language Attribute",
    "JSON-LD Schema",
  ];

  return fixable.some((f) =>
    checkName.toLowerCase().includes(f.toLowerCase()) ||
    f.toLowerCase().includes(checkName.toLowerCase())
  );
}

function generateFix(
  issue: AnalysisIssue,
  html: string
): { fixType: string; description: string; htmlBefore: string; htmlAfter: string } | null {
  const title = issue.title.toLowerCase();

  // Meta description fix
  if (title.includes("meta description")) {
    const hasDesc = /<meta\s+name=["']description["']/i.test(html);
    if (!hasDesc) {
      return {
        fixType: "meta",
        description: "Add missing meta description tag",
        htmlBefore: "<head>",
        htmlAfter: '<head>\n  <meta name="description" content="Professional website built with Zoobicon. Discover our products, services, and solutions." />',
      };
    }
  }

  // Viewport meta fix
  if (title.includes("viewport")) {
    const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
    if (!hasViewport) {
      return {
        fixType: "meta",
        description: "Add missing viewport meta tag for mobile responsiveness",
        htmlBefore: "<head>",
        htmlAfter: '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1" />',
      };
    }
  }

  // Language attribute fix
  if (title.includes("language") || title.includes("lang")) {
    if (/<html(?![^>]*lang=)/i.test(html)) {
      return {
        fixType: "meta",
        description: "Add lang attribute to html element",
        htmlBefore: "<html",
        htmlAfter: '<html lang="en"',
      };
    }
  }

  // Open Graph fix
  if (title.includes("open graph") || title.includes("og:")) {
    const hasOg = /<meta\s+property=["']og:/i.test(html);
    if (!hasOg) {
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
      const pageTitle = titleMatch?.[1] || "Website";
      return {
        fixType: "meta",
        description: "Add Open Graph meta tags for social sharing",
        htmlBefore: "</head>",
        htmlAfter: `  <meta property="og:type" content="website" />\n  <meta property="og:title" content="${pageTitle}" />\n  <meta property="og:description" content="Professional website built with Zoobicon." />\n</head>`,
      };
    }
  }

  // Canonical URL fix
  if (title.includes("canonical")) {
    const hasCanonical = /<link\s+rel=["']canonical["']/i.test(html);
    if (!hasCanonical) {
      return {
        fixType: "link",
        description: "Add canonical URL to prevent duplicate content",
        htmlBefore: "</head>",
        htmlAfter: '  <link rel="canonical" href="/" />\n</head>',
      };
    }
  }

  return null;
}
