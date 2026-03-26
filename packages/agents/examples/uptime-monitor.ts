/**
 * Example: Uptime Monitor Agent
 *
 * Monitors a list of URLs and reports when any are down or slow.
 * Run on a 5-minute schedule to catch outages quickly.
 *
 * Usage:
 *   npx ts-node examples/uptime-monitor.ts
 */

import { createAgent } from "../src";

interface CheckTarget {
  name: string;
  url: string;
  expectedStatus: number[];
  maxResponseTimeMs?: number;
}

interface CheckResult {
  name: string;
  url: string;
  status: number | null;
  responseTimeMs: number;
  isUp: boolean;
  isSlow: boolean;
}

const uptimeMonitor = createAgent<CheckTarget, CheckResult>({
  id: "uptime-monitor",
  name: "Uptime Monitor",
  description: "Monitors URLs and alerts when they go down or respond slowly",
  scheduleIntervalSec: 300, // Every 5 minutes
  maxConcurrency: 5,
  discover: async () => [
    { name: "Homepage", url: "https://example.com", expectedStatus: [200] },
    { name: "API Health", url: "https://api.example.com/health", expectedStatus: [200] },
    { name: "Docs", url: "https://docs.example.com", expectedStatus: [200, 301, 302] },
  ],
  execute: async (input) => {
    const { name, url, expectedStatus, maxResponseTimeMs = 5000 } = input;
    const start = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const elapsed = Date.now() - start;
      const isUp = expectedStatus.includes(res.status);
      const isSlow = elapsed > maxResponseTimeMs;

      const findings = [];
      if (!isUp) {
        findings.push({
          severity: "critical" as const,
          category: "uptime",
          title: `${name} is DOWN (HTTP ${res.status})`,
          description: `${url} returned HTTP ${res.status}. Expected one of: ${expectedStatus.join(", ")}. Response time: ${elapsed}ms.`,
          autoFixed: false,
        });
      }
      if (isSlow) {
        findings.push({
          severity: "warning" as const,
          category: "performance",
          title: `${name} is SLOW (${elapsed}ms)`,
          description: `${url} responded in ${elapsed}ms, exceeding the ${maxResponseTimeMs}ms threshold.`,
          autoFixed: false,
        });
      }

      return {
        output: { name, url, status: res.status, responseTimeMs: elapsed, isUp, isSlow },
        confidence: 1,
        findings,
      };
    } catch (err) {
      return {
        output: { name, url, status: null, responseTimeMs: Date.now() - start, isUp: false, isSlow: false },
        confidence: 1,
        findings: [{
          severity: "critical" as const,
          category: "uptime",
          title: `${name} is UNREACHABLE`,
          description: `${url} failed to respond: ${err instanceof Error ? err.message : "unknown error"}`,
          autoFixed: false,
        }],
      };
    }
  },
});

// Run it
uptimeMonitor.run().then((result) => {
  console.log(`\nUptime check complete:`);
  console.log(`  ${result.tasksCompleted} passed, ${result.tasksFailed} failed`);
  console.log(`  ${result.findings.length} issues found`);
  for (const f of result.findings) {
    console.log(`  [${f.severity.toUpperCase()}] ${f.title}`);
  }
});
