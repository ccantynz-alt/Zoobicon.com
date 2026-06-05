/**
 * Example: RSS Watcher Agent
 *
 * Monitors RSS feeds and detects new entries since the last check.
 * Useful for tracking competitor blogs, news sources, or changelog feeds.
 *
 * Usage:
 *   npx ts-node examples/rss-watcher.ts
 */

import { createAgent } from "../src";

interface FeedConfig {
  name: string;
  url: string;
}

interface FeedResult {
  name: string;
  url: string;
  newEntries: number;
  titles: string[];
}

// Simple in-memory tracker for last-seen entries
const seenEntries = new Set<string>();

const rssWatcher = createAgent<FeedConfig, FeedResult>({
  id: "rss-watcher",
  name: "RSS Watcher",
  description: "Monitors RSS feeds for new entries",
  scheduleIntervalSec: 3600, // Every hour
  maxConcurrency: 3,
  discover: async () => [
    { name: "Hacker News", url: "https://hnrss.org/newest?points=100" },
    { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  ],
  execute: async (input) => {
    const { name, url } = input;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const text = await res.text();

      // Simple XML title extraction (no dependency needed)
      const titleMatches = text.match(/<title[^>]*>(.*?)<\/title>/gi) || [];
      const titles = titleMatches
        .map((m) => m.replace(/<\/?title[^>]*>/gi, "").trim())
        .filter(Boolean)
        .slice(1); // Skip feed-level title

      const newTitles = titles.filter((t) => {
        const key = `${name}:${t}`;
        if (seenEntries.has(key)) return false;
        seenEntries.add(key);
        return true;
      });

      return {
        output: { name, url, newEntries: newTitles.length, titles: newTitles },
        confidence: 1,
        findings: newTitles.length > 0
          ? [{
              severity: "info" as const,
              category: "content",
              title: `${newTitles.length} new entries from ${name}`,
              description: newTitles.slice(0, 5).join("\n"),
              autoFixed: false,
            }]
          : [],
      };
    } catch (err) {
      return {
        output: { name, url, newEntries: 0, titles: [] },
        confidence: 0.5,
        findings: [{
          severity: "warning" as const,
          category: "feed",
          title: `Failed to fetch ${name}`,
          description: err instanceof Error ? err.message : "Unknown error",
          autoFixed: false,
        }],
      };
    }
  },
});

rssWatcher.run().then((result) => {
  const lines: string[] = [
    `\nRSS check complete:`,
    `  ${result.tasksCompleted} feeds checked`,
  ];
  for (const f of result.findings) {
    lines.push(`  [${f.severity.toUpperCase()}] ${f.title}`);
    if (f.description) lines.push(`    ${f.description.split("\n")[0]}`);
  }
  process.stdout.write(lines.join("\n") + "\n");
});