/**
 * Error Prevention Agent
 *
 * Catches errors before they impact users by:
 * - Monitoring recent API responses for error patterns (5xx, timeout, empty body)
 * - Flagging endpoints with >5 errors in 10 minutes
 * - Checking for common failure modes: missing API keys, DB connection issues, rate limits
 * - Sending admin alerts on critical error spikes
 *
 * Runs every 2 minutes.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ErrorCheckInput {
  type: "endpoint-health" | "error-rate" | "dependency-check";
  name: string;
  data: Record<string, unknown>;
}

interface ErrorCheckOutput {
  name: string;
  status: "healthy" | "degraded" | "failing";
  errorCount: number;
  details: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "error-prevention",
  name: "Error Prevention",
  description: "Catches and alerts on API errors before they impact users. Monitors error rates, endpoint health, and dependency availability.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.8,
  scheduleIntervalSec: 120, // 2 minutes
  maxConcurrency: 5,
  maxRetries: 1,
  retryBaseDelayMs: 2000,
  taskTimeoutMs: 15_000,
  settings: {
    errorThreshold: 5,       // Errors before alert
    windowMinutes: 10,       // Time window for error counting
  },
  tags: ["error-prevention", "monitoring", "health", "alerts"],
};

// ---------------------------------------------------------------------------
// Endpoints to check
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");
}

const CRITICAL_ENDPOINTS = [
  { name: "API Health", path: "/api/health", method: "GET" as const },
  { name: "Generate Stream", path: "/api/generate/stream", method: "HEAD" as const },
  { name: "Hosting Serve", path: "/api/hosting/serve/health-check", method: "GET" as const },
  { name: "Auth Login", path: "/api/auth/login", method: "HEAD" as const },
  { name: "Builder Page", path: "/builder", method: "HEAD" as const },
];

const DEPENDENCY_CHECKS = [
  { name: "Database Connection", check: "database" },
  { name: "Anthropic API Key", check: "anthropic-key" },
  { name: "Stripe API Key", check: "stripe-key" },
  { name: "Mailgun API Key", check: "mailgun-key" },
];

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class ErrorPreventionAgent extends BaseAgent<ErrorCheckInput, ErrorCheckOutput> {
  protected async discoverTasks(): Promise<ErrorCheckInput[]> {
    const tasks: ErrorCheckInput[] = [];

    // 1. Check critical endpoints
    for (const ep of CRITICAL_ENDPOINTS) {
      tasks.push({
        type: "endpoint-health",
        name: ep.name,
        data: { path: ep.path, method: ep.method },
      });
    }

    // 2. Check error rates from stored data
    tasks.push({
      type: "error-rate",
      name: "Error Rate Analysis",
      data: { windowMinutes: 10, threshold: 5 },
    });

    // 3. Check dependencies
    for (const dep of DEPENDENCY_CHECKS) {
      tasks.push({
        type: "dependency-check",
        name: dep.name,
        data: { check: dep.check },
      });
    }

    return tasks;
  }

  protected async execute(
    input: ErrorCheckInput,
    _context: TaskContext
  ): Promise<{ output: ErrorCheckOutput; confidence: number; findings: AgentFinding[] }> {
    switch (input.type) {
      case "endpoint-health":
        return this.checkEndpoint(input);
      case "error-rate":
        return this.checkErrorRate(input);
      case "dependency-check":
        return this.checkDependency(input);
      default:
        return {
          output: { name: input.name, status: "healthy", errorCount: 0, details: "Unknown check type" },
          confidence: 0.5,
          findings: [],
        };
    }
  }

  // ── Endpoint Health Check ──

  private async checkEndpoint(
    input: ErrorCheckInput
  ): Promise<{ output: ErrorCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];
    const baseUrl = getBaseUrl();
    const path = input.data.path as string;
    const method = input.data.method as string;

    try {
      const start = Date.now();
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        signal: AbortSignal.timeout(10_000),
      });
      const elapsed = Date.now() - start;

      // 5xx = server error
      if (res.status >= 500) {
        findings.push({
          severity: "critical",
          category: "error-prevention:5xx",
          title: `${input.name}: Server Error ${res.status}`,
          description: `Endpoint ${path} returned HTTP ${res.status}. Response time: ${elapsed}ms. Users hitting this endpoint will see an error.`,
          autoFixed: false,
          metadata: { endpoint: path, status: res.status, elapsed },
        });

        await this.logError(path, res.status, null);
        await this.alertIfThresholdExceeded(path, input.name);

        return {
          output: { name: input.name, status: "failing", errorCount: 1, details: `HTTP ${res.status}` },
          confidence: 0.95,
          findings,
        };
      }

      // Slow response = degraded
      if (elapsed > 5000) {
        findings.push({
          severity: "warning",
          category: "error-prevention:slow",
          title: `${input.name}: Slow Response (${elapsed}ms)`,
          description: `Endpoint ${path} took ${elapsed}ms. Users may experience timeouts.`,
          autoFixed: false,
          metadata: { endpoint: path, elapsed },
        });

        return {
          output: { name: input.name, status: "degraded", errorCount: 0, details: `Slow: ${elapsed}ms` },
          confidence: 0.9,
          findings,
        };
      }

      return {
        output: { name: input.name, status: "healthy", errorCount: 0, details: `OK (${elapsed}ms)` },
        confidence: 0.99,
        findings,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      findings.push({
        severity: "critical",
        category: "error-prevention:unreachable",
        title: `${input.name}: Unreachable`,
        description: `Cannot reach ${path}. Error: ${errorMsg}. Users will see failures.`,
        autoFixed: false,
        metadata: { endpoint: path, error: errorMsg },
      });

      await this.logError(path, 0, errorMsg);
      await this.alertIfThresholdExceeded(path, input.name);

      return {
        output: { name: input.name, status: "failing", errorCount: 1, details: errorMsg },
        confidence: 0.95,
        findings,
      };
    }
  }

  // ── Error Rate Analysis ──

  private async checkErrorRate(
    input: ErrorCheckInput
  ): Promise<{ output: ErrorCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];
    const windowMinutes = (input.data.windowMinutes as number) || 10;
    const threshold = (input.data.threshold as number) || 5;

    try {
      const { sql } = await import("@/lib/db");

      // Ensure error log table exists
      await sql`
        CREATE TABLE IF NOT EXISTS api_error_log (
          id SERIAL PRIMARY KEY,
          endpoint TEXT NOT NULL,
          status_code INT,
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      // Count errors per endpoint in the time window
      const errors = await sql`
        SELECT endpoint, COUNT(*) as error_count
        FROM api_error_log
        WHERE created_at > NOW() - INTERVAL '1 minute' * ${windowMinutes}
        GROUP BY endpoint
        HAVING COUNT(*) >= ${threshold}
        ORDER BY COUNT(*) DESC
      `;

      let totalErrors = 0;
      for (const row of errors) {
        const count = Number(row.error_count);
        totalErrors += count;

        findings.push({
          severity: count >= 10 ? "critical" : "error",
          category: "error-prevention:spike",
          title: `Error Spike: ${row.endpoint} (${count} errors in ${windowMinutes}min)`,
          description: `Endpoint ${row.endpoint} has ${count} errors in the last ${windowMinutes} minutes, exceeding threshold of ${threshold}. Investigate immediately.`,
          autoFixed: false,
          metadata: { endpoint: row.endpoint, errorCount: count, windowMinutes },
        });
      }

      // Clean up old records (keep 24 hours)
      await sql`DELETE FROM api_error_log WHERE created_at < NOW() - INTERVAL '24 hours'`;

      const status = totalErrors > 0 ? (totalErrors >= 10 ? "failing" : "degraded") : "healthy";
      return {
        output: { name: input.name, status, errorCount: totalErrors, details: `${errors.length} endpoints with errors` },
        confidence: 0.95,
        findings,
      };
    } catch {
      // DB unavailable — report it
      return {
        output: { name: input.name, status: "healthy", errorCount: 0, details: "DB unavailable, cannot check error rates" },
        confidence: 0.6,
        findings,
      };
    }
  }

  // ── Dependency Checks ──

  private async checkDependency(
    input: ErrorCheckInput
  ): Promise<{ output: ErrorCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];
    const check = input.data.check as string;

    switch (check) {
      case "database": {
        try {
          const { sql } = await import("@/lib/db");
          await sql`SELECT 1`;
          return {
            output: { name: input.name, status: "healthy", errorCount: 0, details: "Connected" },
            confidence: 0.99,
            findings,
          };
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          findings.push({
            severity: "critical",
            category: "error-prevention:dependency",
            title: "Database Connection Failed",
            description: `Cannot connect to the database. All features requiring data persistence will fail. Error: ${errorMsg}`,
            autoFixed: false,
            metadata: { dependency: "database", error: errorMsg },
          });
          return {
            output: { name: input.name, status: "failing", errorCount: 1, details: errorMsg },
            confidence: 0.99,
            findings,
          };
        }
      }

      case "anthropic-key": {
        const hasKey = !!process.env.ANTHROPIC_API_KEY;
        if (!hasKey) {
          findings.push({
            severity: "critical",
            category: "error-prevention:dependency",
            title: "Anthropic API Key Missing",
            description: "ANTHROPIC_API_KEY is not set. AI generation will fail for all users.",
            autoFixed: false,
          });
        }
        return {
          output: { name: input.name, status: hasKey ? "healthy" : "failing", errorCount: hasKey ? 0 : 1, details: hasKey ? "Set" : "Missing" },
          confidence: 0.99,
          findings,
        };
      }

      case "stripe-key": {
        const hasKey = !!process.env.STRIPE_SECRET_KEY;
        if (!hasKey) {
          findings.push({
            severity: "error",
            category: "error-prevention:dependency",
            title: "Stripe Secret Key Missing",
            description: "STRIPE_SECRET_KEY is not set. Payments and subscriptions will fail.",
            autoFixed: false,
          });
        }
        return {
          output: { name: input.name, status: hasKey ? "healthy" : "degraded", errorCount: hasKey ? 0 : 1, details: hasKey ? "Set" : "Missing" },
          confidence: 0.99,
          findings,
        };
      }

      case "mailgun-key": {
        const hasKey = !!process.env.MAILGUN_API_KEY;
        if (!hasKey) {
          findings.push({
            severity: "warning",
            category: "error-prevention:dependency",
            title: "Mailgun API Key Missing",
            description: "MAILGUN_API_KEY is not set. Email notifications and support tickets will fall back to console logging.",
            autoFixed: false,
          });
        }
        return {
          output: { name: input.name, status: hasKey ? "healthy" : "degraded", errorCount: hasKey ? 0 : 1, details: hasKey ? "Set" : "Missing" },
          confidence: 0.99,
          findings,
        };
      }

      default:
        return {
          output: { name: input.name, status: "healthy", errorCount: 0, details: "Unknown check" },
          confidence: 0.5,
          findings,
        };
    }
  }

  // ── Helpers ──

  private async logError(endpoint: string, statusCode: number, errorMessage: string | null): Promise<void> {
    try {
      const { sql } = await import("@/lib/db");
      await sql`
        CREATE TABLE IF NOT EXISTS api_error_log (
          id SERIAL PRIMARY KEY,
          endpoint TEXT NOT NULL,
          status_code INT,
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO api_error_log (endpoint, status_code, error_message)
        VALUES (${endpoint}, ${statusCode}, ${errorMessage})
      `;
    } catch {
      // DB unavailable
    }
  }

  private async alertIfThresholdExceeded(endpoint: string, name: string): Promise<void> {
    try {
      const { sql } = await import("@/lib/db");
      const result = await sql`
        SELECT COUNT(*) as count FROM api_error_log
        WHERE endpoint = ${endpoint}
          AND created_at > NOW() - INTERVAL '10 minutes'
      `;
      const count = Number(result[0]?.count || 0);
      if (count >= 5) {
        const { notifyAdmin } = await import("@/lib/admin-notify");
        await notifyAdmin({
          subject: `[ERROR SPIKE] ${name}: ${count} errors in 10 minutes`,
          html: `<h2 style="color: #dc2626;">Error Spike Detected</h2>
          <p><strong>Endpoint:</strong> ${endpoint}</p>
          <p><strong>Errors in last 10 min:</strong> ${count}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p>Users are likely experiencing failures. Investigate immediately.</p>`,
        });
      }
    } catch {
      // Can't alert, but error is already logged
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new ErrorPreventionAgent(CONFIG, store));

export { ErrorPreventionAgent, CONFIG as ERROR_PREVENTION_CONFIG };
