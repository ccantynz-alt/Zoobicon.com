/**
 * Example: Scheduled Reporter Agent
 *
 * Gathers metrics from multiple sources on a daily schedule and
 * produces a summary report. Demonstrates multi-source aggregation,
 * scheduling, and the findings system for reporting.
 *
 * Usage:
 *   npx ts-node examples/scheduled-reporter.ts
 */

import { createAgent, onAgentEvent, type AgentFinding } from "../src";

interface MetricSource {
  name: string;
  fetchMetric: () => Promise<{ value: number; unit: string }>;
}

interface MetricResult {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
}

// Simulated historical data for trend detection
const history = new Map<string, number[]>();

function getTrend(name: string, currentValue: number): "up" | "down" | "stable" {
  const past = history.get(name) || [];
  past.push(currentValue);
  if (past.length > 30) past.shift(); // Keep 30 data points
  history.set(name, past);

  if (past.length < 2) return "stable";
  const prev = past[past.length - 2];
  const diff = ((currentValue - prev) / prev) * 100;
  if (diff > 5) return "up";
  if (diff < -5) return "down";
  return "stable";
}

const scheduledReporter = createAgent<MetricSource, MetricResult>({
  id: "daily-reporter",
  name: "Daily Metrics Reporter",
  description: "Gathers metrics from multiple sources and produces a daily summary",
  scheduleIntervalSec: 86400, // Every 24 hours
  maxConcurrency: 5,
  taskTimeoutMs: 30000,
  discover: async () => [
    {
      name: "Active Users",
      fetchMetric: async () => ({
        value: 1000 + Math.floor(Math.random() * 200),
        unit: "users",
      }),
    },
    {
      name: "Page Views",
      fetchMetric: async () => ({
        value: 50000 + Math.floor(Math.random() * 10000),
        unit: "views",
      }),
    },
    {
      name: "API Response Time",
      fetchMetric: async () => ({
        value: 120 + Math.floor(Math.random() * 80),
        unit: "ms",
      }),
    },
    {
      name: "Error Rate",
      fetchMetric: async () => ({
        value: parseFloat((Math.random() * 2).toFixed(2)),
        unit: "%",
      }),
    },
    {
      name: "Revenue",
      fetchMetric: async () => ({
        value: 2500 + Math.floor(Math.random() * 500),
        unit: "USD",
      }),
    },
  ],
  execute: async (input) => {
    const { name, fetchMetric } = input;
    const findings: AgentFinding[] = [];

    const metric = await fetchMetric();
    const trend = getTrend(name, metric.value);

    // Generate findings for notable changes
    if (trend === "down" && name === "Revenue") {
      findings.push({
        severity: "warning",
        category: "business",
        title: `${name} is trending down`,
        description: `Current: ${metric.value} ${metric.unit}. Revenue decline detected.`,
        autoFixed: false,
      });
    }
    if (name === "Error Rate" && metric.value > 1.5) {
      findings.push({
        severity: "error",
        category: "reliability",
        title: `High error rate: ${metric.value}%`,
        description: `Error rate exceeds 1.5% threshold. Current: ${metric.value}%.`,
        autoFixed: false,
      });
    }
    if (name === "API Response Time" && metric.value > 180) {
      findings.push({
        severity: "warning",
        category: "performance",
        title: `Slow API response: ${metric.value}ms`,
        description: `API response time exceeds 180ms threshold.`,
        autoFixed: false,
      });
    }

    return {
      output: { name, value: metric.value, unit: metric.unit, trend },
      confidence: 1,
      findings,
    };
  },
});

function buildReport(result: { duration: number; findings: AgentFinding[] }): string {
  const lines: string[] = [];
  lines.push(`\n===== DAILY METRICS REPORT =====`);
  lines.push(`Date: ${new Date().toISOString().split("T")[0]}`);
  lines.push(`Duration: ${result.duration}ms\n`);

  if (result.findings.length === 0) {
    lines.push("All metrics within normal ranges.");
  } else {
    lines.push(`${result.findings.length} item(s) need attention:\n`);
    for (const f of result.findings) {
      const icon = f.severity === "error" ? "!!" : f.severity === "warning" ? "!" : "-";
      lines.push(`  [${icon}] ${f.title}`);
      lines.push(`      ${f.description}`);
    }
  }

  lines.push(`\n================================`);
  return lines.join("\n");
}

// Listen for events
const unsub = onAgentEvent((event) => {
  if (event.type === "started") {
    process.stdout.write(`[${new Date().toISOString()}] Report generation started...\n`);
  }
  if (event.type === "completed") {
    process.stdout.write(`[${new Date().toISOString()}] Report generation completed.\n`);
  }
});

scheduledReporter.run().then((result) => {
  process.stdout.write(buildReport(result) + "\n");
  unsub(); // Cleanup event listener
});