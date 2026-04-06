/**
 * Market Intelligence Crawler Agent
 *
 * Goes beyond the basic intel-monitor: tracks product features, engineering
 * capabilities, pricing tiers, and market positioning across three categories
 * of competitors.
 *
 * Monitors:
 * - AI Website Builders: v0, Bolt.new, Lovable, Emergent, Replit
 * - AI Video Generators: BigMotion, Synthesia, HeyGen, Runway, Pika
 * - AI Code Generators: Cursor, Windsurf, GitHub Copilot
 * - Market Trends: Product Hunt, Hacker News, TechCrunch
 *
 * Runs every 12 hours. Stores snapshots in `market_intel` table
 * and detects changes (pricing, features, positioning) between crawls.
 *
 * @module @zoobicon/agents
 */

import {
  BaseAgent,
  type AgentConfig,
  type AgentFinding,
  type TaskContext,
  type AgentStore,
} from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompetitorTarget {
  name: string;
  url: string;
  category: "website-builder" | "video-generator" | "code-tool" | "market-trend" | "connectivity" | "cloud-infra";
}

interface CrawlOutput {
  competitor: string;
  url: string;
  category: string;
  title: string;
  description: string;
  pricing: string;
  features: string[];
  changesDetected: number;
}

// ---------------------------------------------------------------------------
// Competitors to monitor
// ---------------------------------------------------------------------------

const COMPETITORS: CompetitorTarget[] = [
  // AI Website Builders
  { name: "Lovable", url: "https://lovable.dev", category: "website-builder" },
  { name: "Bolt.new", url: "https://bolt.new", category: "website-builder" },
  { name: "v0", url: "https://v0.dev", category: "website-builder" },
  { name: "Emergent", url: "https://www.emergent.sh", category: "website-builder" },
  { name: "Replit", url: "https://replit.com", category: "website-builder" },
  // AI Video Generators
  { name: "BigMotion", url: "https://www.bigmotion.ai", category: "video-generator" },
  { name: "Synthesia", url: "https://www.synthesia.io", category: "video-generator" },
  { name: "HeyGen", url: "https://www.heygen.com", category: "video-generator" },
  { name: "Runway", url: "https://runwayml.com", category: "video-generator" },
  { name: "Pika", url: "https://pika.art", category: "video-generator" },
  // AI Code Tools
  { name: "Cursor", url: "https://cursor.sh", category: "code-tool" },
  { name: "Windsurf", url: "https://codeium.com/windsurf", category: "code-tool" },
  // Connectivity — eSIM, Starlink, MVNO
  { name: "Starlink Direct-to-Cell", url: "https://www.starlink.com/business/direct-to-cell", category: "connectivity" },
  { name: "Starlink News", url: "https://www.starlink.com/updates", category: "connectivity" },
  { name: "Celitech", url: "https://www.celitech.com", category: "connectivity" },
  { name: "Airalo", url: "https://www.airalo.com", category: "connectivity" },
  { name: "Holafly", url: "https://www.holafly.com", category: "connectivity" },
  { name: "One NZ (eSIM)", url: "https://one.nz/esim", category: "connectivity" },
  { name: "Spark NZ (eSIM)", url: "https://www.spark.co.nz/esim", category: "connectivity" },
  { name: "Telstra (eSIM)", url: "https://www.telstra.com.au/esim", category: "connectivity" },
  // Cloud Infrastructure — Storage, VPN, Hosting competitors
  { name: "Backblaze B2", url: "https://www.backblaze.com/cloud-storage", category: "cloud-infra" },
  { name: "Hetzner", url: "https://www.hetzner.com/cloud", category: "cloud-infra" },
  { name: "Mullvad VPN", url: "https://mullvad.net", category: "cloud-infra" },
  { name: "Deepgram", url: "https://deepgram.com", category: "connectivity" },
];

// Feature keywords to detect per category
const FEATURE_KEYWORDS: Record<string, string[]> = {
  "website-builder": [
    "figma import", "github sync", "supabase", "real-time collaboration",
    "multi-page", "full-stack", "e-commerce", "custom domain",
    "seo", "analytics", "a/b testing", "white-label", "agency",
    "template", "component library", "visual editor", "code export",
    "webcontainer", "sandbox", "preview", "deployment",
    "react", "next.js", "vue", "svelte", "tailwind",
    "mcp", "model context protocol", "ai agent",
    "stripe", "payments", "auth", "database",
  ],
  "video-generator": [
    "auto-post", "tiktok", "youtube shorts", "instagram reels",
    "multi-language", "avatar", "lip sync", "voice clone",
    "series", "batch", "schedule", "faceless", "ugc",
    "text-to-video", "image-to-video", "video translation",
    "4k", "hd", "watermark-free", "api access",
    "brand kit", "collaboration", "template",
    "ai avatar", "custom avatar", "screen recording",
  ],
  "code-tool": [
    "agent", "multi-file", "terminal", "debugging",
    "autocomplete", "chat", "context", "mcp",
    "code review", "refactoring", "multi-cursor",
    "copilot", "inline completion", "codebase indexing",
    "web search", "image understanding", "voice",
    "background agent", "parallel agents",
  ],
  "market-trend": [],
  "connectivity": [
    "direct-to-cell", "direct to cell", "d2c", "satellite", "starlink",
    "esim", "eSIM", "mvno", "mvne", "wholesale", "reseller api",
    "5g", "lte", "roaming", "travel data", "global coverage",
    "qr activation", "deep link install", "sm-dp+", "gsma",
    "pacific islands", "oceania", "new zealand", "australia",
    "one nz", "spark", "telstra", "optus", "2degrees",
    "airalo partner", "celitech api", "carrier api",
    "iot sim", "m2m", "connected device",
    "starlink api", "starlink reseller", "starlink wholesale",
    "starlink data", "starlink mobile", "starlink phone",
  ],
  "cloud-infra": [
    "s3 compatible", "object storage", "minio", "ceph",
    "wireguard", "vpn api", "vpn reseller",
    "speech to text", "transcription api", "whisper", "nova-2",
    "self-hosted", "open source", "hetzner",
    "edge computing", "serverless", "cdn",
    "price drop", "free tier", "new region",
  ],
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "market-crawler",
  name: "Market Intelligence Crawler",
  description:
    "Crawls competitor products daily for new features, pricing changes, and market positioning shifts. Covers AI website builders, video generators, and code tools.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.6,
  scheduleIntervalSec: 43200, // 12 hours
  maxConcurrency: 4,
  maxRetries: 1,
  retryBaseDelayMs: 5000,
  taskTimeoutMs: 20_000,
  model: undefined, // No LLM needed — pure crawl + keyword extraction
  settings: { competitorCount: COMPETITORS.length },
  tags: ["intelligence", "competitive", "crawl", "market", "features", "pricing"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class MarketCrawlerAgent extends BaseAgent<CompetitorTarget, CrawlOutput> {
  protected async initialize(): Promise<void> {
    await this.ensureTable();
  }

  protected async discoverTasks(): Promise<CompetitorTarget[]> {
    return COMPETITORS;
  }

  protected async execute(
    input: CompetitorTarget,
    _context: TaskContext
  ): Promise<{
    output: CrawlOutput;
    confidence: number;
    findings: AgentFinding[];
  }> {
    const findings: AgentFinding[] = [];
    const { name, url, category } = input;

    let title = "";
    let description = "";
    let pricing = "";
    let features: string[] = [];
    let changesDetected = 0;

    try {
      // Fetch the competitor's page
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ZoobiconMarketIntel/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!res.ok) {
        findings.push({
          severity: "warning",
          category: "market-intel",
          title: `${name} returned HTTP ${res.status}`,
          description: `${url} responded with status ${res.status}`,
          autoFixed: false,
        });
        return {
          output: { competitor: name, url, category, title, description, pricing, features, changesDetected },
          confidence: 0.2,
          findings,
        };
      }

      const html = await res.text();

      // Extract key signals
      title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || "";
      description =
        html.match(/name="description"[^>]*content="([^"]*)"/i)?.[1]?.trim() ||
        html.match(/content="([^"]*)"[^>]*name="description"/i)?.[1]?.trim() ||
        "";
      pricing = this.extractPricing(html);
      features = this.extractFeatures(html, category);

      // Compare with last snapshot
      try {
        const { sql } = await import("@/lib/db");

        const prev = await sql`
          SELECT title, description, pricing, features
          FROM market_intel
          WHERE competitor_name = ${name}
          ORDER BY crawled_at DESC
          LIMIT 1
        `;

        if (prev.length > 0) {
          const prevRow = prev[0];
          const prevTitle = (prevRow.title as string) || "";
          const prevDesc = (prevRow.description as string) || "";
          const prevPricing = (prevRow.pricing as string) || "";
          const prevFeatures = (prevRow.features as string[]) || [];

          // Title change = possible rebrand or major feature launch
          if (prevTitle && title && prevTitle !== title) {
            changesDetected++;
            findings.push({
              severity: "info",
              category: "market-intel",
              title: `${name} changed their page title`,
              description: `"${prevTitle}" -> "${title}"`,
              autoFixed: false,
              beforeValue: prevTitle,
              afterValue: title,
            });
          }

          // Description change = messaging/positioning shift
          if (prevDesc && description && prevDesc !== description) {
            changesDetected++;
            findings.push({
              severity: "info",
              category: "market-intel",
              title: `${name} updated their meta description`,
              description: `New: "${description.slice(0, 120)}..."`,
              autoFixed: false,
              beforeValue: prevDesc,
              afterValue: description,
            });
          }

          // Pricing change = CRITICAL intel
          if (prevPricing && pricing && prevPricing !== pricing) {
            changesDetected++;
            findings.push({
              severity: "critical",
              category: "market-intel",
              title: `${name} PRICING CHANGE`,
              description: `Was: ${prevPricing} | Now: ${pricing}`,
              autoFixed: false,
              beforeValue: prevPricing,
              afterValue: pricing,
            });
          }

          // New features detected
          const newFeatures = features.filter((f) => !prevFeatures.includes(f));
          const removedFeatures = prevFeatures.filter(
            (f: string) => !features.includes(f)
          );

          if (newFeatures.length > 0) {
            changesDetected++;
            findings.push({
              severity: "warning",
              category: "market-intel",
              title: `${name} — NEW features detected`,
              description: `New: ${newFeatures.join(", ")}`,
              autoFixed: false,
              afterValue: newFeatures.join(", "),
            });
          }
          if (removedFeatures.length > 0) {
            changesDetected++;
            findings.push({
              severity: "info",
              category: "market-intel",
              title: `${name} — features REMOVED or hidden`,
              description: `Removed: ${removedFeatures.join(", ")}`,
              autoFixed: false,
              beforeValue: removedFeatures.join(", "),
            });
          }
        }

        // Save new snapshot
        await sql`
          INSERT INTO market_intel (
            competitor_name, url, category, title, description, pricing, features
          ) VALUES (
            ${name}, ${url}, ${category}, ${title}, ${description}, ${pricing}, ${features}
          )
        `;
      } catch {
        // DB unavailable — still return what we crawled
      }
    } catch (err) {
      findings.push({
        severity: "info",
        category: "market-intel",
        title: `${name} unreachable`,
        description: `Failed to crawl ${url}: ${err instanceof Error ? err.message : "network error"}`,
        autoFixed: false,
      });
    }

    return {
      output: {
        competitor: name,
        url,
        category,
        title,
        description,
        pricing,
        features,
        changesDetected,
      },
      confidence: title ? 0.9 : 0.3,
      findings,
    };
  }

  /**
   * Extract pricing signals from HTML (dollar amounts with /mo, /year, etc.)
   */
  private extractPricing(html: string): string {
    const priceMatches = html.match(
      /\$\d[\d,]*(?:\.\d{2})?(?:\s*\/\s*(?:mo(?:nth)?|year|yr|user|seat))?/gi
    );
    if (!priceMatches) return "";
    // Deduplicate and take first 8
    const unique = [...new Set(priceMatches)];
    return unique.slice(0, 8).join(", ");
  }

  /**
   * Detect feature keywords in HTML based on competitor category
   */
  private extractFeatures(
    html: string,
    category: string
  ): string[] {
    const lowerHtml = html.toLowerCase();
    const keywords = FEATURE_KEYWORDS[category] || FEATURE_KEYWORDS["website-builder"];
    const found: string[] = [];
    for (const kw of keywords) {
      if (lowerHtml.includes(kw)) {
        found.push(kw);
      }
    }
    return found;
  }

  /**
   * Create the market_intel table if it doesn't exist yet.
   */
  private async ensureTable(): Promise<void> {
    try {
      const { sql } = await import("@/lib/db");
      await sql`
        CREATE TABLE IF NOT EXISTS market_intel (
          id            SERIAL PRIMARY KEY,
          competitor_name TEXT NOT NULL,
          url           TEXT NOT NULL,
          category      TEXT NOT NULL,
          title         TEXT,
          description   TEXT,
          pricing       TEXT,
          features      TEXT[] DEFAULT '{}',
          crawled_at    TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_market_intel_competitor ON market_intel (competitor_name, crawled_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_market_intel_category ON market_intel (category)`;
    } catch {
      // Table may already exist or DB unavailable
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new MarketCrawlerAgent(CONFIG, store));

export { MarketCrawlerAgent, CONFIG as MARKET_CRAWLER_CONFIG, COMPETITORS };
