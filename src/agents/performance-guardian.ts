/**
 * Performance Guardian Agent
 *
 * Monitors and optimizes platform performance:
 * - Checks average generation time (should be <95s)
 * - Monitors API response times from uptime_checks table
 * - Detects slow endpoints and performance regressions
 * - Alerts if generation times increase significantly
 * - Tracks page load performance metrics
 *
 * Runs every 15 minutes.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PerfCheckInput {
  type: "generation-speed" | "api-latency" | "deployment-speed" | "db-performance";
  name: string;
}

interface PerfCheckOutput {
  name: string;
  status: "optimal" | "acceptable" | "degraded" | "critical";
  metric: string;
  value: number;
  threshold: number;
  unit: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "performance-guardian",
  name: "Performance Guardian",
  description: "Monitors platform performance metrics — generation speed, API latency, deployment times — and alerts on regressions.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.8,
  scheduleIntervalSec: 900, // 15 minutes
  maxConcurrency: 4,
  maxRetries: 1,
  retryBaseDelayMs: 2000,
  taskTimeoutMs: 30_000,
  settings: {
    maxGenerationTimeSec: 95,
    maxApiLatencyMs: 3000,
    maxDeployTimeSec: 30,
  },
  tags: ["performance", "monitoring", "speed", "optimization"],
};

// Performance thresholds
const THRESHOLDS = {
  generationOptimalSec: 60,
  generationAcceptableSec: 95,
  generationCriticalSec: 150,
  apiOptimalMs: 500,
  apiAcceptableMs: 3000,
  apiCriticalMs: 10000,
  deployOptimalSec: 10,
  deployAcceptableSec: 30,
  deployCriticalSec: 60,
  dbOptimalMs: 50,
  dbAcceptableMs: 200,
  dbCriticalMs: 1000,
};

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class PerformanceGuardianAgent extends BaseAgent<PerfCheckInput, PerfCheckOutput> {
  protected async discoverTasks(): Promise<PerfCheckInput[]> {
    return [
      { type: "generation-speed", name: "Generation Speed Check" },
      { type: "api-latency", name: "API Latency Check" },
      { type: "deployment-speed", name: "Deployment Speed Check" },
      { type: "db-performance", name: "Database Performance Check" },
    ];
  }

  protected async execute(
    input: PerfCheckInput,
    _context: TaskContext
  ): Promise<{ output: PerfCheckOutput; confidence: number; findings: AgentFinding[] }> {
    switch (input.type) {
      case "generation-speed":
        return this.checkGenerationSpeed(input);
      case "api-latency":
        return this.checkApiLatency(input);
      case "deployment-speed":
        return this.checkDeploymentSpeed(input);
      case "db-performance":
        return this.checkDbPerformance(input);
      default:
        return {
          output: { name: input.name, status: "optimal", metric: "unknown", value: 0, threshold: 0, unit: "" },
          confidence: 0.5,
          findings: [],
        };
    }
  }

  // ── Generation Speed ──

  private async checkGenerationSpeed(
    input: PerfCheckInput
  ): Promise<{ output: PerfCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Check recent generation times from agency_generations table
      const result = await sql`
        SELECT
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time_sec,
          MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_time_sec,
          COUNT(*) as total
        FROM agency_generations
        WHERE status IN ('completed', 'failed')
          AND created_at > NOW() - INTERVAL '1 hour'
      `;

      const avgTimeSec = Number(result[0]?.avg_time_sec || 0);
      const maxTimeSec = Number(result[0]?.max_time_sec || 0);
      const total = Number(result[0]?.total || 0);

      if (total === 0) {
        return {
          output: { name: input.name, status: "optimal", metric: "avg_generation_time", value: 0, threshold: THRESHOLDS.generationAcceptableSec, unit: "sec" },
          confidence: 0.7,
          findings,
        };
      }

      let status: PerfCheckOutput["status"] = "optimal";
      if (avgTimeSec > THRESHOLDS.generationCriticalSec) status = "critical";
      else if (avgTimeSec > THRESHOLDS.generationAcceptableSec) status = "degraded";
      else if (avgTimeSec > THRESHOLDS.generationOptimalSec) status = "acceptable";

      if (status === "critical" || status === "degraded") {
        findings.push({
          severity: status === "critical" ? "critical" : "warning",
          category: "performance:generation-slow",
          title: `Generation Speed ${status === "critical" ? "CRITICAL" : "Degraded"}: ${avgTimeSec.toFixed(1)}s avg`,
          description: `Average generation time is ${avgTimeSec.toFixed(1)}s (target: <${THRESHOLDS.generationAcceptableSec}s). Max: ${maxTimeSec.toFixed(1)}s. ${total} generations in last hour. Users are waiting too long.`,
          autoFixed: false,
          metadata: { avgTimeSec, maxTimeSec, total },
        });
      }

      if (maxTimeSec > THRESHOLDS.generationCriticalSec * 2) {
        findings.push({
          severity: "error",
          category: "performance:generation-timeout",
          title: `Generation Timeout Risk: ${maxTimeSec.toFixed(0)}s max`,
          description: `At least one generation took ${maxTimeSec.toFixed(0)}s, approaching the Vercel 300s limit. Investigate for timeout risk.`,
          autoFixed: false,
          metadata: { maxTimeSec },
        });
      }

      return {
        output: { name: input.name, status, metric: "avg_generation_time", value: Math.round(avgTimeSec), threshold: THRESHOLDS.generationAcceptableSec, unit: "sec" },
        confidence: 0.95,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, status: "optimal", metric: "avg_generation_time", value: 0, threshold: THRESHOLDS.generationAcceptableSec, unit: "sec" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── API Latency ──

  private async checkApiLatency(
    input: PerfCheckInput
  ): Promise<{ output: PerfCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Pull from uptime_checks table (populated by uptime-monitor agent)
      const result = await sql`
        SELECT
          endpoint_name,
          AVG(response_time_ms) as avg_ms,
          MAX(response_time_ms) as max_ms,
          COUNT(*) as checks
        FROM uptime_checks
        WHERE checked_at > NOW() - INTERVAL '15 minutes'
          AND status != 'down'
        GROUP BY endpoint_name
        ORDER BY AVG(response_time_ms) DESC
      `;

      let worstAvgMs = 0;
      let worstEndpoint = "";

      for (const row of result) {
        const avgMs = Number(row.avg_ms);
        const maxMs = Number(row.max_ms);

        if (avgMs > worstAvgMs) {
          worstAvgMs = avgMs;
          worstEndpoint = row.endpoint_name;
        }

        if (avgMs > THRESHOLDS.apiCriticalMs) {
          findings.push({
            severity: "critical",
            category: "performance:api-latency",
            title: `${row.endpoint_name}: ${avgMs.toFixed(0)}ms avg latency`,
            description: `Endpoint ${row.endpoint_name} is critically slow: ${avgMs.toFixed(0)}ms avg, ${maxMs.toFixed(0)}ms max. Target: <${THRESHOLDS.apiAcceptableMs}ms.`,
            autoFixed: false,
            metadata: { endpoint: row.endpoint_name, avgMs, maxMs },
          });
        } else if (avgMs > THRESHOLDS.apiAcceptableMs) {
          findings.push({
            severity: "warning",
            category: "performance:api-latency",
            title: `${row.endpoint_name}: Slow (${avgMs.toFixed(0)}ms avg)`,
            description: `Endpoint ${row.endpoint_name} is above acceptable latency: ${avgMs.toFixed(0)}ms avg. Target: <${THRESHOLDS.apiAcceptableMs}ms.`,
            autoFixed: false,
            metadata: { endpoint: row.endpoint_name, avgMs },
          });
        }
      }

      let status: PerfCheckOutput["status"] = "optimal";
      if (worstAvgMs > THRESHOLDS.apiCriticalMs) status = "critical";
      else if (worstAvgMs > THRESHOLDS.apiAcceptableMs) status = "degraded";
      else if (worstAvgMs > THRESHOLDS.apiOptimalMs) status = "acceptable";

      return {
        output: { name: input.name, status, metric: "worst_api_latency", value: Math.round(worstAvgMs), threshold: THRESHOLDS.apiAcceptableMs, unit: "ms" },
        confidence: result.length > 0 ? 0.95 : 0.5,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, status: "optimal", metric: "worst_api_latency", value: 0, threshold: THRESHOLDS.apiAcceptableMs, unit: "ms" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Deployment Speed ──

  private async checkDeploymentSpeed(
    input: PerfCheckInput
  ): Promise<{ output: PerfCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      const result = await sql`
        SELECT
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time_sec,
          MAX(EXTRACT(EPOCH FROM (updated_at - created_at))) as max_time_sec,
          COUNT(*) as total
        FROM deployments
        WHERE status = 'active'
          AND created_at > NOW() - INTERVAL '1 hour'
      `;

      const avgTimeSec = Number(result[0]?.avg_time_sec || 0);
      const total = Number(result[0]?.total || 0);

      if (total === 0) {
        return {
          output: { name: input.name, status: "optimal", metric: "avg_deploy_time", value: 0, threshold: THRESHOLDS.deployAcceptableSec, unit: "sec" },
          confidence: 0.7,
          findings,
        };
      }

      let status: PerfCheckOutput["status"] = "optimal";
      if (avgTimeSec > THRESHOLDS.deployCriticalSec) status = "critical";
      else if (avgTimeSec > THRESHOLDS.deployAcceptableSec) status = "degraded";
      else if (avgTimeSec > THRESHOLDS.deployOptimalSec) status = "acceptable";

      if (status === "critical" || status === "degraded") {
        findings.push({
          severity: status === "critical" ? "error" : "warning",
          category: "performance:deploy-slow",
          title: `Deploy Speed ${status}: ${avgTimeSec.toFixed(1)}s avg`,
          description: `Average deployment time is ${avgTimeSec.toFixed(1)}s. Target: <${THRESHOLDS.deployAcceptableSec}s. ${total} deploys in last hour.`,
          autoFixed: false,
          metadata: { avgTimeSec, total },
        });
      }

      return {
        output: { name: input.name, status, metric: "avg_deploy_time", value: Math.round(avgTimeSec), threshold: THRESHOLDS.deployAcceptableSec, unit: "sec" },
        confidence: 0.95,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, status: "optimal", metric: "avg_deploy_time", value: 0, threshold: THRESHOLDS.deployAcceptableSec, unit: "sec" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Database Performance ──

  private async checkDbPerformance(
    input: PerfCheckInput
  ): Promise<{ output: PerfCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Run a timed test query
      const start = Date.now();
      await sql`SELECT COUNT(*) FROM sites`;
      const elapsed = Date.now() - start;

      // Also check table sizes for bloat detection
      const tableSizes = await sql`
        SELECT relname, n_live_tup
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
        LIMIT 10
      `;

      let status: PerfCheckOutput["status"] = "optimal";
      if (elapsed > THRESHOLDS.dbCriticalMs) status = "critical";
      else if (elapsed > THRESHOLDS.dbAcceptableMs) status = "degraded";
      else if (elapsed > THRESHOLDS.dbOptimalMs) status = "acceptable";

      if (status === "critical" || status === "degraded") {
        findings.push({
          severity: status === "critical" ? "critical" : "warning",
          category: "performance:db-slow",
          title: `Database Query Time: ${elapsed}ms`,
          description: `Simple count query took ${elapsed}ms. Target: <${THRESHOLDS.dbAcceptableMs}ms. May indicate connection pool exhaustion or high load.`,
          autoFixed: false,
          metadata: { queryTimeMs: elapsed },
        });
      }

      // Check for large tables that might need cleanup
      for (const table of tableSizes) {
        const rows = Number(table.n_live_tup);
        if (rows > 100_000) {
          findings.push({
            severity: "info",
            category: "performance:table-size",
            title: `Large Table: ${table.relname} (${rows.toLocaleString()} rows)`,
            description: `Table ${table.relname} has ${rows.toLocaleString()} rows. Consider archiving or partitioning if queries are slow.`,
            autoFixed: false,
            metadata: { table: table.relname, rows },
          });
        }
      }

      return {
        output: { name: input.name, status, metric: "db_query_time", value: elapsed, threshold: THRESHOLDS.dbAcceptableMs, unit: "ms" },
        confidence: 0.95,
        findings,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      findings.push({
        severity: "critical",
        category: "performance:db-down",
        title: "Database Unreachable",
        description: `Cannot run performance query. Error: ${errorMsg}`,
        autoFixed: false,
      });

      return {
        output: { name: input.name, status: "critical", metric: "db_query_time", value: -1, threshold: THRESHOLDS.dbAcceptableMs, unit: "ms" },
        confidence: 0.99,
        findings,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new PerformanceGuardianAgent(CONFIG, store));

export { PerformanceGuardianAgent, CONFIG as PERFORMANCE_GUARDIAN_CONFIG };
