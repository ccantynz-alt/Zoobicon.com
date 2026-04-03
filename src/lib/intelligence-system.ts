/**
 * Zoobicon Intelligence System — Always-On, 24/7
 *
 * Runs via Vercel Cron Jobs — no Claude session needed.
 * These endpoints execute on a schedule, automatically.
 *
 * CRAWLERS (what they do):
 *   1. Competitor Monitor (every 12h) — checks competitor sites for new features
 *   2. Technology Scout (every 48h) — checks for new AI models, frameworks, tools
 *   3. Customer SEO Monitor (daily) — tracks customer site rankings
 *   4. Zoobicon Health Monitor (every 15min) — uptime, performance, errors
 *   5. Market Intelligence (weekly) — pricing changes, new competitors, trends
 *
 * All results stored in database. Alerts sent via email when action needed.
 *
 * VERCEL CRON SETUP (add to vercel.json):
 * See vercel.json for cron configuration.
 * Competitors: every 12h, Technology: every 2d, SEO: daily,
 * Health: every 15min, Warmup: every 5min
 */

import { sql } from "./db";

// ═══════════════════════════════════════════════════════
// COMPETITOR MONITOR — runs every 12 hours
// ═══════════════════════════════════════════════════════

export const COMPETITORS = [
  { name: "Lovable", url: "https://lovable.dev", category: "builder" },
  { name: "Bolt.new", url: "https://bolt.new", category: "builder" },
  { name: "v0", url: "https://v0.dev", category: "builder" },
  { name: "Emergent", url: "https://www.emergent.sh", category: "builder" },
  { name: "HeyGen", url: "https://www.heygen.com", category: "video" },
  { name: "Synthesia", url: "https://www.synthesia.io", category: "video" },
  { name: "D-ID", url: "https://www.d-id.com", category: "video" },
  { name: "Captions", url: "https://www.captions.ai", category: "video" },
  { name: "InVideo", url: "https://invideo.io", category: "video" },
  { name: "CapCut", url: "https://www.capcut.com", category: "video" },
  { name: "Runway", url: "https://runwayml.com", category: "video" },
  { name: "GoDaddy", url: "https://www.godaddy.com", category: "domains" },
  { name: "Namecheap", url: "https://www.namecheap.com", category: "domains" },
  { name: "Cursor", url: "https://www.cursor.com", category: "code" },
  { name: "Windsurf", url: "https://codeium.com/windsurf", category: "code" },
];

export interface CompetitorChange {
  competitor: string;
  changeType: "feature" | "pricing" | "design" | "content";
  description: string;
  severity: "high" | "medium" | "low";
  detectedAt: Date;
  url: string;
}

/**
 * Crawl a competitor's website and detect changes.
 */
export async function crawlCompetitor(
  name: string,
  url: string
): Promise<CompetitorChange[]> {
  const changes: CompetitorChange[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)",
        Accept: "text/html",
      },
    });

    if (!res.ok) return changes;

    const html = await res.text();

    // Extract key content for comparison
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1] || "";

    // Extract pricing info
    const pricingMatches = html.match(/\$\d+(?:\.\d{2})?(?:\/mo|\/month|\/year|\/yr)?/gi) || [];

    // Extract feature keywords
    const featureKeywords = [
      "new", "launch", "beta", "introducing", "announcing",
      "update", "upgrade", "feature", "integration", "AI",
      "real-time", "collaboration", "deploy", "database",
    ];

    const headings = [...html.matchAll(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi)]
      .map(m => m[1].trim().toLowerCase());

    const newFeatures = headings.filter(h =>
      featureKeywords.some(kw => h.includes(kw.toLowerCase()))
    );

    // Compare with last crawl
    await ensureIntelTables();

    const [lastCrawl] = await sql`
      SELECT content_hash, pricing_data, feature_keywords
      FROM intel_crawl_history
      WHERE competitor = ${name}
      ORDER BY crawled_at DESC LIMIT 1
    `;

    const currentHash = simpleHash(title + headings.join("|") + pricingMatches.join("|"));

    if (lastCrawl) {
      const lastHash = lastCrawl.content_hash as string;
      if (currentHash !== lastHash) {
        // Something changed — figure out what
        const lastPricing = (lastCrawl.pricing_data as string) || "";
        const currentPricing = pricingMatches.join(",");

        if (currentPricing !== lastPricing) {
          changes.push({
            competitor: name,
            changeType: "pricing",
            description: `Pricing change detected: ${currentPricing}`,
            severity: "high",
            detectedAt: new Date(),
            url,
          });
        }

        if (newFeatures.length > 0) {
          changes.push({
            competitor: name,
            changeType: "feature",
            description: `New features detected: ${newFeatures.slice(0, 5).join(", ")}`,
            severity: "high",
            detectedAt: new Date(),
            url,
          });
        }

        if (changes.length === 0) {
          changes.push({
            competitor: name,
            changeType: "content",
            description: "Website content updated",
            severity: "low",
            detectedAt: new Date(),
            url,
          });
        }
      }
    }

    // Save current crawl
    await sql`
      INSERT INTO intel_crawl_history (competitor, url, content_hash, pricing_data, feature_keywords, title)
      VALUES (${name}, ${url}, ${currentHash}, ${pricingMatches.join(",")}, ${JSON.stringify(newFeatures)}, ${title})
    `;

  } catch (err) {
    console.error(`[intel] Failed to crawl ${name}:`, err);
  }

  return changes;
}

/**
 * Run the full competitor monitoring sweep.
 */
export async function runCompetitorSweep(): Promise<{
  crawled: number;
  changes: CompetitorChange[];
}> {
  const allChanges: CompetitorChange[] = [];

  for (const comp of COMPETITORS) {
    const changes = await crawlCompetitor(comp.name, comp.url);
    allChanges.push(...changes);
  }

  // Store changes
  for (const change of allChanges) {
    await sql`
      INSERT INTO intel_alerts (competitor, change_type, description, severity, url)
      VALUES (${change.competitor}, ${change.changeType}, ${change.description}, ${change.severity}, ${change.url})
    `;
  }

  // Send email alert if high-severity changes detected
  const highSeverity = allChanges.filter(c => c.severity === "high");
  if (highSeverity.length > 0) {
    await sendIntelAlert(highSeverity);
  }

  return { crawled: COMPETITORS.length, changes: allChanges };
}

// ═══════════════════════════════════════════════════════
// TECHNOLOGY SCOUT — runs every 48 hours
// ═══════════════════════════════════════════════════════

export const TECH_SOURCES = [
  { name: "Replicate Models", url: "https://replicate.com/explore", type: "models" },
  { name: "Next.js Releases", url: "https://github.com/vercel/next.js/releases", type: "framework" },
  { name: "React Releases", url: "https://github.com/facebook/react/releases", type: "framework" },
  { name: "Anthropic Blog", url: "https://www.anthropic.com/news", type: "ai" },
  { name: "OpenAI Blog", url: "https://openai.com/blog", type: "ai" },
  { name: "Supabase Blog", url: "https://supabase.com/blog", type: "infrastructure" },
  { name: "Vercel Blog", url: "https://vercel.com/blog", type: "infrastructure" },
];

/**
 * Check technology sources for new releases and updates.
 */
export async function runTechScout(): Promise<{
  checked: number;
  newFindings: Array<{ source: string; finding: string }>;
}> {
  const findings: Array<{ source: string; finding: string }> = [];

  for (const source of TECH_SOURCES) {
    try {
      const res = await fetch(source.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" },
      });

      if (!res.ok) continue;

      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

      // Check for new content since last check
      const currentHash = simpleHash(html.slice(0, 5000));

      const [lastCheck] = await sql`
        SELECT content_hash FROM intel_tech_checks
        WHERE source = ${source.name} ORDER BY checked_at DESC LIMIT 1
      `;

      if (lastCheck && lastCheck.content_hash !== currentHash) {
        findings.push({
          source: source.name,
          finding: `New content detected on ${source.name}: ${titleMatch?.[1] || source.url}`,
        });
      }

      await sql`
        INSERT INTO intel_tech_checks (source, url, content_hash, title)
        VALUES (${source.name}, ${source.url}, ${currentHash}, ${titleMatch?.[1] || ""})
      `;
    } catch {
      // Skip failed sources
    }
  }

  return { checked: TECH_SOURCES.length, newFindings: findings };
}

// ═══════════════════════════════════════════════════════
// ZOOBICON HEALTH MONITOR — runs every 15 minutes
// ═══════════════════════════════════════════════════════

const HEALTH_ENDPOINTS = [
  { name: "Homepage", url: "https://zoobicon.com", expectedStatus: 200 },
  { name: "Builder", url: "https://zoobicon.com/builder", expectedStatus: 200 },
  { name: "Video Creator", url: "https://zoobicon.com/video-creator", expectedStatus: 200 },
  { name: "Domains", url: "https://zoobicon.com/domains", expectedStatus: 200 },
  { name: "API Health", url: "https://zoobicon.com/api/health", expectedStatus: 200 },
  { name: "Domain Search API", url: "https://zoobicon.com/api/domains/search?q=test&tlds=com", expectedStatus: 200 },
];

export interface HealthCheckResult {
  endpoint: string;
  status: "up" | "down" | "slow";
  statusCode: number;
  responseTimeMs: number;
  checkedAt: Date;
}

/**
 * Run health checks on all critical endpoints.
 */
export async function runHealthCheck(): Promise<{
  overall: "healthy" | "degraded" | "down";
  results: HealthCheckResult[];
}> {
  const results: HealthCheckResult[] = [];

  for (const endpoint of HEALTH_ENDPOINTS) {
    const start = Date.now();
    try {
      const res = await fetch(endpoint.url, {
        headers: { "User-Agent": "ZoobiconHealthCheck/1.0" },
      });

      const responseTime = Date.now() - start;

      results.push({
        endpoint: endpoint.name,
        status: res.status === endpoint.expectedStatus
          ? (responseTime > 5000 ? "slow" : "up")
          : "down",
        statusCode: res.status,
        responseTimeMs: responseTime,
        checkedAt: new Date(),
      });
    } catch {
      results.push({
        endpoint: endpoint.name,
        status: "down",
        statusCode: 0,
        responseTimeMs: Date.now() - start,
        checkedAt: new Date(),
      });
    }
  }

  // Store results
  for (const result of results) {
    await sql`
      INSERT INTO intel_health_checks (endpoint, status, status_code, response_time_ms)
      VALUES (${result.endpoint}, ${result.status}, ${result.statusCode}, ${result.responseTimeMs})
    `.catch(() => {});
  }

  const downCount = results.filter(r => r.status === "down").length;
  const overall = downCount === 0 ? "healthy" : downCount < results.length / 2 ? "degraded" : "down";

  // Alert if anything is down
  if (downCount > 0) {
    const downEndpoints = results.filter(r => r.status === "down").map(r => r.endpoint);
    console.error(`[health] DOWN: ${downEndpoints.join(", ")}`);
    // TODO: Send email/SMS alert
  }

  return { overall, results };
}

// ═══════════════════════════════════════════════════════
// DATABASE TABLES
// ═══════════════════════════════════════════════════════

async function ensureIntelTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS intel_crawl_history (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      competitor      TEXT NOT NULL,
      url             TEXT NOT NULL,
      content_hash    TEXT NOT NULL,
      pricing_data    TEXT,
      feature_keywords JSONB DEFAULT '[]',
      title           TEXT,
      crawled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS intel_alerts (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      competitor      TEXT NOT NULL,
      change_type     TEXT NOT NULL,
      description     TEXT NOT NULL,
      severity        TEXT NOT NULL DEFAULT 'medium',
      url             TEXT,
      acknowledged    BOOLEAN DEFAULT false,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS intel_tech_checks (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source          TEXT NOT NULL,
      url             TEXT NOT NULL,
      content_hash    TEXT NOT NULL,
      title           TEXT,
      checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.catch(() => {});

  await sql`
    CREATE TABLE IF NOT EXISTS intel_health_checks (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      endpoint        TEXT NOT NULL,
      status          TEXT NOT NULL,
      status_code     INTEGER,
      response_time_ms INTEGER,
      checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.catch(() => {});
}

// ═══════════════════════════════════════════════════════
// ALERTS
// ═══════════════════════════════════════════════════════

async function sendIntelAlert(changes: CompetitorChange[]) {
  // Send via Mailgun if configured
  const mailgunKey = process.env.MAILGUN_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@zoobicon.com";

  if (!mailgunKey) {
    console.log("[intel] Alert (no email configured):", changes.map(c => `${c.competitor}: ${c.description}`).join("; "));
    return;
  }

  const subject = `[Zoobicon Intel] ${changes.length} competitor change(s) detected`;
  const body = changes.map(c =>
    `<b>${c.competitor}</b> (${c.severity}): ${c.description}<br>URL: ${c.url}`
  ).join("<br><br>");

  try {
    const domain = process.env.MAILGUN_DOMAIN || "zoobicon.com";
    const formData = new URLSearchParams();
    formData.append("from", `Zoobicon Intel <intel@${domain}>`);
    formData.append("to", adminEmail);
    formData.append("subject", subject);
    formData.append("html", `<h2>Competitor Intelligence Alert</h2>${body}<br><br><small>Zoobicon Market Intelligence System</small>`);

    await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${mailgunKey}`).toString("base64")}` },
      body: formData,
    });
  } catch {
    console.error("[intel] Failed to send alert email");
  }
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}
