/**
 * Competitive Intelligence Engine with Database Persistence
 *
 * Scheduled crawling of competitor sites, change detection,
 * market trend scanning from Hacker News, and feature matrix tracking.
 */

import { neon } from "@neondatabase/serverless";
import {
  COMPETITORS,
  crawlAllCompetitors,
  type CompetitorTarget,
  type CrawlResult,
} from "@/lib/intel-crawler";

function getDb() {
  if (!process.env.DATABASE_URL) return null;
  return neon(process.env.DATABASE_URL);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntelAlert {
  id: string;
  competitor: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  details: string;
  url: string | null;
  acknowledged: boolean;
  created_at: string;
}

export interface MarketTrend {
  id: string;
  source: string;
  title: string;
  url: string;
  relevance_score: number;
  summary: string;
  tags: string[];
  created_at: string;
}

export interface CompetitiveMatrixEntry {
  competitor: string;
  category: "direct" | "adjacent" | "emerging";
  features: Record<string, boolean | string>;
}

// ---------------------------------------------------------------------------
// Table initialization
// ---------------------------------------------------------------------------

export async function ensureIntelTables(): Promise<void> {
  const sql = getDb();
  if (!sql) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS competitor_crawl_runs (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at  TIMESTAMPTZ,
        status        VARCHAR(20) NOT NULL DEFAULT 'running',
        total_urls    INTEGER NOT NULL DEFAULT 0,
        success_count INTEGER NOT NULL DEFAULT 0,
        error_count   INTEGER NOT NULL DEFAULT 0,
        blocked_count INTEGER NOT NULL DEFAULT 0,
        summary       JSONB DEFAULT '{}'
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS competitor_snapshots (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        crawl_run_id    UUID REFERENCES competitor_crawl_runs(id) ON DELETE CASCADE,
        competitor      TEXT NOT NULL,
        url             TEXT NOT NULL,
        status          VARCHAR(20) NOT NULL,
        title           TEXT,
        description     TEXT,
        pricing         TEXT,
        features        JSONB DEFAULT '[]',
        tech_stack      JSONB DEFAULT '[]',
        key_changes     JSONB DEFAULT '[]',
        raw_text_length INTEGER,
        error_message   TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS competitor_snapshots_competitor_idx ON competitor_snapshots (competitor)`;
    await sql`CREATE INDEX IF NOT EXISTS competitor_snapshots_url_idx ON competitor_snapshots (url)`;
    await sql`CREATE INDEX IF NOT EXISTS competitor_snapshots_created_idx ON competitor_snapshots (created_at)`;

    await sql`
      CREATE TABLE IF NOT EXISTS competitor_alerts (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        competitor    TEXT NOT NULL,
        alert_type    VARCHAR(50) NOT NULL,
        severity      VARCHAR(20) NOT NULL DEFAULT 'info',
        title         TEXT NOT NULL,
        details       TEXT NOT NULL DEFAULT '',
        url           TEXT,
        acknowledged  BOOLEAN NOT NULL DEFAULT false,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS competitor_alerts_competitor_idx ON competitor_alerts (competitor)`;
    await sql`CREATE INDEX IF NOT EXISTS competitor_alerts_severity_idx ON competitor_alerts (severity)`;
    await sql`CREATE INDEX IF NOT EXISTS competitor_alerts_created_idx ON competitor_alerts (created_at)`;

    await sql`
      CREATE TABLE IF NOT EXISTS market_trends (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source          VARCHAR(50) NOT NULL,
        source_id       TEXT,
        title           TEXT NOT NULL,
        url             TEXT NOT NULL,
        relevance_score REAL NOT NULL DEFAULT 0,
        summary         TEXT NOT NULL DEFAULT '',
        tags            JSONB DEFAULT '[]',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(source, source_id)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS market_trends_source_idx ON market_trends (source)`;
    await sql`CREATE INDEX IF NOT EXISTS market_trends_created_idx ON market_trends (created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS market_trends_relevance_idx ON market_trends (relevance_score)`;
  } catch (err) {
    console.error("[market-intel] Failed to ensure tables:", err);
  }
}

// ---------------------------------------------------------------------------
// Scheduled crawl
// ---------------------------------------------------------------------------

export async function runScheduledCrawl(): Promise<{
  crawlRunId: string | null;
  snapshots: number;
  alerts: number;
}> {
  const sql = getDb();
  if (!sql) {
    // No database — run crawl but don't persist
    await crawlAllCompetitors();
    return { crawlRunId: null, snapshots: 0, alerts: 0 };
  }

  let crawlRunId: string | null = null;

  try {
    // Create crawl run record
    const totalUrls = COMPETITORS.reduce((sum, c) => sum + c.urls.length, 0);
    const runRows = await sql`
      INSERT INTO competitor_crawl_runs (total_urls, status)
      VALUES (${totalUrls}, 'running')
      RETURNING id
    `;
    crawlRunId = runRows[0]?.id || null;

    // Run the actual crawl
    const report = await crawlAllCompetitors();

    let snapshotCount = 0;
    let alertCount = 0;

    // Store each result as a snapshot
    for (const result of report.competitors) {
      try {
        await sql`
          INSERT INTO competitor_snapshots (
            crawl_run_id, competitor, url, status, title, description,
            pricing, features, tech_stack, key_changes,
            raw_text_length, error_message
          ) VALUES (
            ${crawlRunId},
            ${result.competitor},
            ${result.url},
            ${result.status},
            ${result.title || null},
            ${result.description || null},
            ${result.pricing || null},
            ${JSON.stringify(result.features || [])},
            ${JSON.stringify(result.techStack || [])},
            ${JSON.stringify(result.keyChanges || [])},
            ${result.rawTextLength || null},
            ${result.errorMessage || null}
          )
        `;
        snapshotCount++;
      } catch (snapErr) {
        console.error("[market-intel] Failed to store snapshot:", snapErr);
      }

      // Detect changes vs previous snapshot
      if (result.status === "success") {
        try {
          const prevSnapshots = await sql`
            SELECT pricing, features, key_changes, title
            FROM competitor_snapshots
            WHERE competitor = ${result.competitor}
              AND url = ${result.url}
              AND crawl_run_id != ${crawlRunId}
            ORDER BY created_at DESC
            LIMIT 1
          `;

          if (prevSnapshots.length > 0) {
            const prev = prevSnapshots[0];
            const prevPricing = prev.pricing || "";
            const newPricing = result.pricing || "";

            // Pricing change alert
            if (prevPricing && newPricing && prevPricing !== newPricing) {
              await sql`
                INSERT INTO competitor_alerts (competitor, alert_type, severity, title, details, url)
                VALUES (
                  ${result.competitor},
                  'pricing_change',
                  'critical',
                  ${`${result.competitor} pricing changed`},
                  ${`Previous: ${prevPricing}\nCurrent: ${newPricing}`},
                  ${result.url}
                )
              `;
              alertCount++;
            }

            // Title change alert (possible rebrand or new messaging)
            const prevTitle = prev.title || "";
            const newTitle = result.title || "";
            if (prevTitle && newTitle && prevTitle !== newTitle) {
              await sql`
                INSERT INTO competitor_alerts (competitor, alert_type, severity, title, details, url)
                VALUES (
                  ${result.competitor},
                  'messaging_change',
                  'info',
                  ${`${result.competitor} changed page title`},
                  ${`Previous: ${prevTitle}\nCurrent: ${newTitle}`},
                  ${result.url}
                )
              `;
              alertCount++;
            }

            // Feature additions
            const prevFeatures: string[] = Array.isArray(prev.features)
              ? prev.features
              : JSON.parse(prev.features || "[]");
            const newFeatures = result.features || [];
            const addedFeatures = newFeatures.filter(
              (f) => !prevFeatures.some((pf) => pf.toLowerCase() === f.toLowerCase())
            );

            if (addedFeatures.length > 0) {
              await sql`
                INSERT INTO competitor_alerts (competitor, alert_type, severity, title, details, url)
                VALUES (
                  ${result.competitor},
                  'new_features',
                  'warning',
                  ${`${result.competitor} added ${addedFeatures.length} new feature(s)`},
                  ${`New features detected:\n${addedFeatures.map((f) => `- ${f}`).join("\n")}`},
                  ${result.url}
                )
              `;
              alertCount++;
            }
          }

          // Key changes always generate alerts
          if (result.keyChanges && result.keyChanges.length > 0) {
            for (const change of result.keyChanges) {
              await sql`
                INSERT INTO competitor_alerts (competitor, alert_type, severity, title, details, url)
                VALUES (
                  ${result.competitor},
                  'key_change',
                  'warning',
                  ${`${result.competitor}: ${change.slice(0, 100)}`},
                  ${change},
                  ${result.url}
                )
              `;
              alertCount++;
            }
          }
        } catch (diffErr) {
          console.error("[market-intel] Failed to diff snapshots:", diffErr);
        }
      }
    }

    // Update crawl run as completed
    const successCount = report.competitors.filter((r) => r.status === "success").length;
    const errorCount = report.competitors.filter((r) => r.status === "error").length;
    const blockedCount = report.competitors.filter((r) => r.status === "blocked").length;

    await sql`
      UPDATE competitor_crawl_runs
      SET status = 'completed',
          completed_at = NOW(),
          success_count = ${successCount},
          error_count = ${errorCount},
          blocked_count = ${blockedCount},
          summary = ${JSON.stringify({
            insights: report.insights,
            alerts: report.alerts,
            totalAlerts: alertCount,
          })}
      WHERE id = ${crawlRunId}
    `;

    return { crawlRunId, snapshots: snapshotCount, alerts: alertCount };
  } catch (err) {
    console.error("[market-intel] Crawl run failed:", err);

    // Mark run as failed if we have an ID
    if (crawlRunId) {
      try {
        await sql`
          UPDATE competitor_crawl_runs
          SET status = 'failed', completed_at = NOW()
          WHERE id = ${crawlRunId}
        `;
      } catch {
        // Best effort
      }
    }

    return { crawlRunId, snapshots: 0, alerts: 0 };
  }
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export async function getAlerts(options?: {
  limit?: number;
  severity?: string;
  competitor?: string;
  acknowledged?: boolean;
}): Promise<IntelAlert[]> {
  const sql = getDb();
  if (!sql) return [];

  const limit = options?.limit ?? 50;

  try {
    // Build query based on filters
    if (options?.severity && options?.competitor) {
      const rows = await sql`
        SELECT id, competitor, alert_type, severity, title, details, url, acknowledged, created_at
        FROM competitor_alerts
        WHERE severity = ${options.severity}
          AND competitor = ${options.competitor}
          AND (${options?.acknowledged === undefined} OR acknowledged = ${options?.acknowledged ?? false})
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return rows as unknown as IntelAlert[];
    }

    if (options?.severity) {
      const rows = await sql`
        SELECT id, competitor, alert_type, severity, title, details, url, acknowledged, created_at
        FROM competitor_alerts
        WHERE severity = ${options.severity}
          AND (${options?.acknowledged === undefined} OR acknowledged = ${options?.acknowledged ?? false})
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return rows as unknown as IntelAlert[];
    }

    if (options?.competitor) {
      const rows = await sql`
        SELECT id, competitor, alert_type, severity, title, details, url, acknowledged, created_at
        FROM competitor_alerts
        WHERE competitor = ${options.competitor}
          AND (${options?.acknowledged === undefined} OR acknowledged = ${options?.acknowledged ?? false})
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return rows as unknown as IntelAlert[];
    }

    // No filters — return all unacknowledged by default
    if (options?.acknowledged !== undefined) {
      const rows = await sql`
        SELECT id, competitor, alert_type, severity, title, details, url, acknowledged, created_at
        FROM competitor_alerts
        WHERE acknowledged = ${options.acknowledged}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return rows as unknown as IntelAlert[];
    }

    const rows = await sql`
      SELECT id, competitor, alert_type, severity, title, details, url, acknowledged, created_at
      FROM competitor_alerts
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows as unknown as IntelAlert[];
  } catch (err) {
    console.error("[market-intel] Failed to fetch alerts:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Acknowledge alert
// ---------------------------------------------------------------------------

export async function acknowledgeAlert(id: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    const rows = await sql`
      UPDATE competitor_alerts
      SET acknowledged = true
      WHERE id = ${id}
      RETURNING id
    `;
    return rows.length > 0;
  } catch (err) {
    console.error("[market-intel] Failed to acknowledge alert:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Market trends
// ---------------------------------------------------------------------------

export async function getMarketTrends(days: number = 7): Promise<MarketTrend[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, source, title, url, relevance_score, summary, tags, created_at
      FROM market_trends
      WHERE created_at >= NOW() - MAKE_INTERVAL(days => ${days})
      ORDER BY relevance_score DESC, created_at DESC
      LIMIT 100
    `;
    return rows as unknown as MarketTrend[];
  } catch (err) {
    console.error("[market-intel] Failed to fetch market trends:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Scan market sources (Hacker News)
// ---------------------------------------------------------------------------

const RELEVANCE_KEYWORDS = [
  "ai website builder",
  "ai web builder",
  "website generator",
  "ai coding",
  "ai development",
  "no-code",
  "low-code",
  "lovable",
  "bolt.new",
  "v0.dev",
  "cursor",
  "replit",
  "vercel",
  "webcontainer",
  "ai agent",
  "code generation",
  "website builder",
  "web development ai",
  "ai saas",
  "ai startup",
  "framer",
  "emergent",
];

function computeRelevanceScore(title: string, points: number): number {
  const lowerTitle = title.toLowerCase();
  let score = 0;

  // Keyword matches
  for (const keyword of RELEVANCE_KEYWORDS) {
    if (lowerTitle.includes(keyword)) {
      score += 20;
    }
  }

  // Direct competitor mentions get highest score
  for (const comp of COMPETITORS) {
    if (lowerTitle.includes(comp.name.toLowerCase())) {
      score += 30;
    }
  }

  // Points-based boost (log scale)
  if (points > 0) {
    score += Math.min(Math.log2(points) * 5, 30);
  }

  return Math.min(score, 100);
}

function extractTags(title: string): string[] {
  const lowerTitle = title.toLowerCase();
  const tags: string[] = [];

  if (lowerTitle.includes("pricing") || lowerTitle.includes("price")) tags.push("pricing");
  if (lowerTitle.includes("launch") || lowerTitle.includes("release") || lowerTitle.includes("announce")) tags.push("launch");
  if (lowerTitle.includes("funding") || lowerTitle.includes("raise") || lowerTitle.includes("valuation")) tags.push("funding");
  if (lowerTitle.includes("open source") || lowerTitle.includes("open-source")) tags.push("open-source");
  if (lowerTitle.includes("ai") || lowerTitle.includes("artificial intelligence") || lowerTitle.includes("llm")) tags.push("ai");
  if (lowerTitle.includes("website") || lowerTitle.includes("web")) tags.push("web");

  for (const comp of COMPETITORS) {
    if (lowerTitle.includes(comp.name.toLowerCase())) {
      tags.push(`competitor:${comp.name.toLowerCase()}`);
    }
  }

  return tags;
}

interface HNHit {
  objectID: string;
  title: string;
  url: string | null;
  points: number | null;
  num_comments: number | null;
  created_at: string;
}

export async function scanMarketSources(): Promise<{
  scanned: number;
  stored: number;
}> {
  const sql = getDb();
  let scanned = 0;
  let stored = 0;

  // Hacker News search queries
  const queries = [
    "AI+website+builder",
    "AI+code+generation",
    "no-code+AI",
    "v0+vercel",
    "lovable+AI",
    "bolt.new",
    "cursor+AI",
  ];

  for (const query of queries) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(
        `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&hitsPerPage=20`,
        {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        }
      );
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = await res.json();
      const hits: HNHit[] = data.hits || [];
      scanned += hits.length;

      for (const hit of hits) {
        const relevance = computeRelevanceScore(hit.title, hit.points || 0);

        // Only store items with minimum relevance
        if (relevance < 10) continue;

        const tags = extractTags(hit.title);
        const storyUrl = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
        const summary = `${hit.title} (${hit.points || 0} points, ${hit.num_comments || 0} comments on HN)`;

        if (!sql) continue;

        try {
          await sql`
            INSERT INTO market_trends (source, source_id, title, url, relevance_score, summary, tags)
            VALUES (
              'hackernews',
              ${hit.objectID},
              ${hit.title},
              ${storyUrl},
              ${relevance},
              ${summary},
              ${JSON.stringify(tags)}
            )
            ON CONFLICT (source, source_id) DO UPDATE
            SET relevance_score = EXCLUDED.relevance_score,
                tags = EXCLUDED.tags
          `;
          stored++;
        } catch (insertErr) {
          // Duplicate or DB error — skip
          const errMsg = insertErr instanceof Error ? insertErr.message : "";
          if (!errMsg.includes("duplicate")) {
            console.error("[market-intel] Failed to store trend:", insertErr);
          }
        }
      }
    } catch (fetchErr) {
      console.error(`[market-intel] Failed to scan HN for query "${query}":`, fetchErr);
    }
  }

  return { scanned, stored };
}

// ---------------------------------------------------------------------------
// Competitive matrix
// ---------------------------------------------------------------------------

export function getCompetitiveMatrix(): CompetitiveMatrixEntry[] {
  const matrix: CompetitiveMatrixEntry[] = [
    {
      competitor: "Zoobicon",
      category: "direct",
      features: {
        "Single-page generation": true,
        "Multi-page sites": true,
        "Full-stack apps": true,
        "E-commerce generation": true,
        "Visual editor": true,
        "Multi-LLM support": true,
        "White-label / agency": true,
        "43 specialized generators": true,
        "100+ templates": true,
        "Hosting (zoobicon.sh)": true,
        "In-browser runtime": false,
        "Real-time collaboration": "Poll-based",
        "WordPress export": true,
        "API access": true,
        "Custom domains": true,
        "Video creator": "Partial",
        "Email support system": true,
        "Marketplace": true,
        "Starting price": "$19/mo",
      },
    },
    {
      competitor: "Lovable",
      category: "direct",
      features: {
        "Single-page generation": true,
        "Multi-page sites": true,
        "Full-stack apps": true,
        "E-commerce generation": false,
        "Visual editor": true,
        "Multi-LLM support": false,
        "White-label / agency": false,
        "43 specialized generators": false,
        "100+ templates": false,
        "Hosting (zoobicon.sh)": "Supabase hosting",
        "In-browser runtime": false,
        "Real-time collaboration": true,
        "WordPress export": false,
        "API access": false,
        "Custom domains": true,
        "Video creator": false,
        "Email support system": false,
        "Marketplace": false,
        "Starting price": "$20/mo",
      },
    },
    {
      competitor: "v0",
      category: "direct",
      features: {
        "Single-page generation": true,
        "Multi-page sites": false,
        "Full-stack apps": false,
        "E-commerce generation": false,
        "Visual editor": true,
        "Multi-LLM support": false,
        "White-label / agency": false,
        "43 specialized generators": false,
        "100+ templates": true,
        "Hosting (zoobicon.sh)": "Vercel",
        "In-browser runtime": "Sandbox",
        "Real-time collaboration": false,
        "WordPress export": false,
        "API access": false,
        "Custom domains": "Via Vercel",
        "Video creator": false,
        "Email support system": false,
        "Marketplace": false,
        "Starting price": "$20/mo",
      },
    },
    {
      competitor: "Bolt",
      category: "direct",
      features: {
        "Single-page generation": true,
        "Multi-page sites": true,
        "Full-stack apps": true,
        "E-commerce generation": false,
        "Visual editor": false,
        "Multi-LLM support": true,
        "White-label / agency": false,
        "43 specialized generators": false,
        "100+ templates": false,
        "Hosting (zoobicon.sh)": "Netlify",
        "In-browser runtime": "WebContainers",
        "Real-time collaboration": false,
        "WordPress export": false,
        "API access": false,
        "Custom domains": false,
        "Video creator": false,
        "Email support system": false,
        "Marketplace": false,
        "Starting price": "$20/mo",
      },
    },
    {
      competitor: "Emergent",
      category: "direct",
      features: {
        "Single-page generation": true,
        "Multi-page sites": true,
        "Full-stack apps": true,
        "E-commerce generation": false,
        "Visual editor": false,
        "Multi-LLM support": true,
        "White-label / agency": false,
        "43 specialized generators": false,
        "100+ templates": false,
        "Hosting (zoobicon.sh)": "Built-in",
        "In-browser runtime": true,
        "Real-time collaboration": false,
        "WordPress export": false,
        "API access": "MCP",
        "Custom domains": false,
        "Video creator": false,
        "Email support system": false,
        "Marketplace": false,
        "Starting price": "$25/mo",
      },
    },
    {
      competitor: "Cursor",
      category: "adjacent",
      features: {
        "Single-page generation": "Code editor",
        "Multi-page sites": "Code editor",
        "Full-stack apps": "Code editor",
        "E-commerce generation": false,
        "Visual editor": false,
        "Multi-LLM support": true,
        "White-label / agency": false,
        "43 specialized generators": false,
        "100+ templates": false,
        "Hosting (zoobicon.sh)": false,
        "In-browser runtime": "Desktop app",
        "Real-time collaboration": false,
        "WordPress export": false,
        "API access": false,
        "Custom domains": false,
        "Video creator": false,
        "Email support system": false,
        "Marketplace": false,
        "Starting price": "$20/mo",
      },
    },
    {
      competitor: "Replit",
      category: "adjacent",
      features: {
        "Single-page generation": true,
        "Multi-page sites": true,
        "Full-stack apps": true,
        "E-commerce generation": false,
        "Visual editor": false,
        "Multi-LLM support": false,
        "White-label / agency": false,
        "43 specialized generators": false,
        "100+ templates": true,
        "Hosting (zoobicon.sh)": "Replit hosting",
        "In-browser runtime": true,
        "Real-time collaboration": true,
        "WordPress export": false,
        "API access": false,
        "Custom domains": true,
        "Video creator": false,
        "Email support system": false,
        "Marketplace": false,
        "Starting price": "$25/mo",
      },
    },
    {
      competitor: "Framer",
      category: "adjacent",
      features: {
        "Single-page generation": "Design tool",
        "Multi-page sites": true,
        "Full-stack apps": false,
        "E-commerce generation": "Basic",
        "Visual editor": true,
        "Multi-LLM support": false,
        "White-label / agency": false,
        "43 specialized generators": false,
        "100+ templates": true,
        "Hosting (zoobicon.sh)": "Framer hosting",
        "In-browser runtime": false,
        "Real-time collaboration": true,
        "WordPress export": false,
        "API access": false,
        "Custom domains": true,
        "Video creator": false,
        "Email support system": false,
        "Marketplace": "Components",
        "Starting price": "$15/mo",
      },
    },
  ];

  return matrix;
}
