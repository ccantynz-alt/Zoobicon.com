/**
 * Competitive Intelligence Agent
 *
 * Autonomous agent that monitors competitors for changes.
 * Wraps the existing intel-crawler.ts into the agent framework.
 *
 * Runs every 12 hours, crawls competitor websites, detects changes,
 * and generates alerts with AI-powered analysis.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntelTarget {
  name: string;
  urls: string[];
  category: "direct" | "adjacent";
}

interface IntelOutput {
  crawledUrls: number;
  changesDetected: number;
  alerts: Array<{
    competitor: string;
    type: string;
    summary: string;
    severity: string;
  }>;
}

// ---------------------------------------------------------------------------
// Competitors to monitor
// ---------------------------------------------------------------------------

const COMPETITORS: IntelTarget[] = [
  { name: "Lovable", urls: ["https://lovable.dev", "https://lovable.dev/pricing"], category: "direct" },
  { name: "Bolt.new", urls: ["https://bolt.new", "https://bolt.new/pricing"], category: "direct" },
  { name: "v0", urls: ["https://v0.dev", "https://v0.dev/pricing"], category: "direct" },
  { name: "Emergent", urls: ["https://emergent.sh"], category: "direct" },
  { name: "Cursor", urls: ["https://cursor.sh", "https://cursor.sh/pricing"], category: "adjacent" },
  { name: "Replit", urls: ["https://replit.com", "https://replit.com/pricing"], category: "adjacent" },
];

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "intel-monitor",
  name: "Competitive Intelligence",
  description: "Monitors competitor websites for pricing changes, new features, and strategic shifts. Runs every 12 hours.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.7,
  scheduleIntervalSec: 43200, // 12 hours
  maxConcurrency: 3,
  maxRetries: 2,
  retryBaseDelayMs: 5000,
  taskTimeoutMs: 30_000,
  model: "claude-haiku-4-5-20251001",
  settings: { competitors: COMPETITORS },
  tags: ["intelligence", "competitive", "monitoring", "strategy"],
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class IntelMonitorAgent extends BaseAgent<IntelTarget, IntelOutput> {
  protected async discoverTasks(): Promise<IntelTarget[]> {
    return COMPETITORS;
  }

  protected async execute(
    input: IntelTarget,
    _context: TaskContext
  ): Promise<{ output: IntelOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];
    const alerts: IntelOutput["alerts"] = [];
    let crawledUrls = 0;

    for (const url of input.urls) {
      try {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(10_000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; ZoobiconBot/1.0)" },
        });

        if (!res.ok) {
          findings.push({
            severity: "warning",
            category: "intel",
            title: `${input.name}: ${url} returned ${res.status}`,
            description: `HTTP ${res.status} — site may be down or blocking crawlers`,
            autoFixed: false,
          });
          continue;
        }

        const html = await res.text();
        crawledUrls++;

        // Extract key signals
        const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "";
        const description = html.match(/name="description"[^>]*content="([^"]+)"/i)?.[1] || "";

        // Detect pricing changes (look for dollar amounts)
        const priceMatches = html.match(/\$\d+[\d,]*(?:\.\d{2})?(?:\s*\/\s*mo(?:nth)?)?/gi) || [];
        const prices = [...new Set(priceMatches)].slice(0, 10);

        // Store snapshot for comparison
        try {
          const { sql } = await import("@/lib/db");

          // Get previous snapshot
          const prev = await sql`
            SELECT title, description, prices
            FROM competitor_snapshots
            WHERE competitor_name = ${input.name} AND url = ${url}
            ORDER BY crawled_at DESC LIMIT 1
          `;

          // Compare with previous
          if (prev.length > 0) {
            const prevPrices = (prev[0].prices as string[]) || [];
            const prevTitle = prev[0].title as string;

            // Price change detection
            const newPrices = prices.filter((p) => !prevPrices.includes(p));
            const removedPrices = prevPrices.filter((p: string) => !prices.includes(p));

            if (newPrices.length > 0 || removedPrices.length > 0) {
              const alert = {
                competitor: input.name,
                type: "price_change",
                summary: `Pricing changed: ${removedPrices.length > 0 ? `removed ${removedPrices.join(", ")}` : ""} ${newPrices.length > 0 ? `added ${newPrices.join(", ")}` : ""}`.trim(),
                severity: "high",
              };
              alerts.push(alert);
              findings.push({
                severity: "warning",
                category: "intel",
                title: `${input.name} pricing change detected`,
                description: alert.summary,
                autoFixed: false,
              });
            }

            // Title change detection (possible rebrand or feature launch)
            if (prevTitle && title && prevTitle !== title) {
              alerts.push({
                competitor: input.name,
                type: "messaging_change",
                summary: `Title changed: "${prevTitle}" → "${title}"`,
                severity: "medium",
              });
            }
          }

          // Save snapshot
          await sql`
            INSERT INTO competitor_snapshots (competitor_name, url, title, description, prices, html_size, crawled_at)
            VALUES (${input.name}, ${url}, ${title}, ${description}, ${prices}, ${html.length}, NOW())
          `;
        } catch {
          // DB not available — still return crawl results
        }
      } catch (err) {
        findings.push({
          severity: "info",
          category: "intel",
          title: `${input.name}: Failed to crawl ${url}`,
          description: err instanceof Error ? err.message : "Network error",
          autoFixed: false,
        });
      }
    }

    // Push alerts to notification system
    if (alerts.length > 0) {
      try {
        const { notifyCompetitorAlert } = await import("@/lib/notifications");
        for (const alert of alerts) {
          notifyCompetitorAlert(alert.competitor, alert.type, alert.summary);
        }
      } catch {
        // Notification system not available
      }
    }

    return {
      output: {
        crawledUrls,
        changesDetected: alerts.length,
        alerts,
      },
      confidence: crawledUrls > 0 ? 0.9 : 0.3,
      findings,
    };
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new IntelMonitorAgent(CONFIG, store));

export { IntelMonitorAgent, CONFIG as INTEL_MONITOR_CONFIG };
