/**
 * Example: Price Tracker Agent
 *
 * Monitors product pages for price changes by fetching pages and
 * extracting price data. Alerts when prices drop below a threshold.
 *
 * Usage:
 *   npx ts-node examples/price-tracker.ts
 */

import { createAgent, type AgentFinding } from "../src";

interface PriceTarget {
  name: string;
  url: string;
  /** CSS-like price pattern to search for (regex) */
  pricePattern: string;
  /** Alert when price drops below this (in cents) */
  alertBelowCents: number;
  /** Currency code */
  currency: string;
}

interface PriceResult {
  name: string;
  url: string;
  priceCents: number | null;
  priceFormatted: string | null;
  belowThreshold: boolean;
}

// Track last known prices for change detection
const lastPrices = new Map<string, number>();

const priceTracker = createAgent<PriceTarget, PriceResult>({
  id: "price-tracker",
  name: "Price Tracker",
  description: "Monitors product pages for price changes and threshold alerts",
  scheduleIntervalSec: 14400, // Every 4 hours
  maxConcurrency: 2,
  taskTimeoutMs: 20000,
  discover: async () => [
    {
      name: "Example Product",
      url: "https://example.com/product",
      pricePattern: "\\$([\\d,]+\\.\\d{2})",
      alertBelowCents: 5000, // Alert if below $50.00
      currency: "USD",
    },
  ],
  execute: async (input) => {
    const { name, url, pricePattern, alertBelowCents, currency } = input;
    const findings: AgentFinding[] = [];

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { "User-Agent": "ZoobiconPriceTracker/1.0" },
      });
      const html = await res.text();

      // Extract price using the configured pattern
      const regex = new RegExp(pricePattern);
      const match = html.match(regex);

      if (!match || !match[1]) {
        return {
          output: { name, url, priceCents: null, priceFormatted: null, belowThreshold: false },
          confidence: 0.3,
          findings: [{
            severity: "warning",
            category: "price",
            title: `Could not extract price for ${name}`,
            description: `No match for pattern "${pricePattern}" on ${url}`,
            autoFixed: false,
          }],
        };
      }

      const priceStr = match[1].replace(/,/g, "");
      const priceCents = Math.round(parseFloat(priceStr) * 100);
      const priceFormatted = `${currency} ${(priceCents / 100).toFixed(2)}`;
      const belowThreshold = priceCents < alertBelowCents;

      // Check for price change
      const prevPrice = lastPrices.get(name);
      lastPrices.set(name, priceCents);

      if (prevPrice !== undefined && prevPrice !== priceCents) {
        const direction = priceCents < prevPrice ? "dropped" : "increased";
        const diff = Math.abs(priceCents - prevPrice);
        findings.push({
          severity: direction === "dropped" ? "info" : "warning",
          category: "price",
          title: `${name} price ${direction} by ${currency} ${(diff / 100).toFixed(2)}`,
          description: `Was ${currency} ${(prevPrice / 100).toFixed(2)}, now ${priceFormatted}`,
          autoFixed: false,
          beforeValue: `${(prevPrice / 100).toFixed(2)}`,
          afterValue: `${(priceCents / 100).toFixed(2)}`,
        });
      }

      if (belowThreshold) {
        findings.push({
          severity: "info",
          category: "price",
          title: `${name} is below target price!`,
          description: `Current: ${priceFormatted}. Target: below ${currency} ${(alertBelowCents / 100).toFixed(2)}`,
          autoFixed: false,
        });
      }

      return {
        output: { name, url, priceCents, priceFormatted, belowThreshold },
        confidence: 1,
        findings,
      };
    } catch (err) {
      return {
        output: { name, url, priceCents: null, priceFormatted: null, belowThreshold: false },
        confidence: 0.5,
        findings: [{
          severity: "error",
          category: "price",
          title: `Failed to check price for ${name}`,
          description: err instanceof Error ? err.message : "Unknown error",
          autoFixed: false,
        }],
      };
    }
  },
});

priceTracker.run().then((result) => {
  console.log(`\nPrice check complete:`);
  console.log(`  ${result.tasksCompleted} products checked`);
  for (const f of result.findings) {
    console.log(`  [${f.severity.toUpperCase()}] ${f.title}`);
  }
});
