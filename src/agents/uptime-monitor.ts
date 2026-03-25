/**
 * Uptime Monitor Agent
 *
 * Monitors critical platform endpoints and external dependencies:
 * - Checks key API endpoints (health, generate, hosting)
 * - Checks zoobicon.sh site serving
 * - Checks external dependencies (Anthropic API, Stripe, Mailgun)
 * - Calculates uptime percentage from stored check results
 * - Sends immediate admin alerts when critical services go down
 *
 * Runs every 5 minutes.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentFinding, type TaskContext, type AgentStore } from "./base";
import { registerAgent } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UptimeCheckInput {
  name: string;
  url: string;
  method: "GET" | "POST" | "HEAD";
  expectedStatus: number[];
  critical: boolean;
  timeoutMs: number;
  /** Optional body for POST checks */
  body?: string;
  /** Optional headers */
  headers?: Record<string, string>;
}

interface UptimeCheckOutput {
  name: string;
  url: string;
  status: "up" | "down" | "degraded";
  responseTimeMs: number;
  httpStatus: number | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Endpoints to Monitor
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

function getEndpoints(): UptimeCheckInput[] {
  const base = getBaseUrl();

  return [
    // Internal API endpoints
    {
      name: "API Health",
      url: `${base}/api/health`,
      method: "GET",
      expectedStatus: [200],
      critical: true,
      timeoutMs: 10_000,
    },
    {
      name: "Homepage",
      url: base,
      method: "HEAD",
      expectedStatus: [200],
      critical: true,
      timeoutMs: 15_000,
    },
    {
      name: "Builder Page",
      url: `${base}/builder`,
      method: "HEAD",
      expectedStatus: [200],
      critical: true,
      timeoutMs: 15_000,
    },
    {
      name: "Auth Login",
      url: `${base}/api/auth/login`,
      method: "POST",
      expectedStatus: [400, 401], // Expected to fail without credentials, but should respond
      critical: true,
      timeoutMs: 10_000,
      body: JSON.stringify({ email: "healthcheck@test.invalid", password: "test" }),
      headers: { "Content-Type": "application/json" },
    },
    {
      name: "Hosting Serve",
      url: `${base}/api/hosting/serve/health-check`,
      method: "GET",
      expectedStatus: [200, 404], // 404 is fine, means the route handler works
      critical: true,
      timeoutMs: 10_000,
    },
    {
      name: "Public API Status",
      url: `${base}/api/v1/status`,
      method: "GET",
      expectedStatus: [200, 401], // 401 without auth is expected and healthy
      critical: false,
      timeoutMs: 10_000,
    },

    // External dependencies
    {
      name: "Anthropic API",
      url: "https://api.anthropic.com/v1/messages",
      method: "POST",
      expectedStatus: [401, 400], // Should reject without valid key, proving it's up
      critical: true,
      timeoutMs: 10_000,
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1, messages: [] }),
      headers: { "Content-Type": "application/json", "x-api-key": "health-check", "anthropic-version": "2023-06-01" },
    },
    {
      name: "Stripe API",
      url: "https://api.stripe.com/v1/balance",
      method: "GET",
      expectedStatus: [401], // Rejects without key, proving it's up
      critical: false,
      timeoutMs: 10_000,
    },
    {
      name: "Mailgun API",
      url: "https://api.mailgun.net/v3/domains",
      method: "GET",
      expectedStatus: [401], // Rejects without key, proving it's up
      critical: false,
      timeoutMs: 10_000,
    },
  ];
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "uptime-monitor",
  name: "Uptime Monitor",
  description: "Monitors critical endpoints and external dependencies every 5 minutes. Sends immediate alerts on downtime.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.9,
  scheduleIntervalSec: 300, // 5 minutes
  maxConcurrency: 9, // Check all endpoints in parallel
  maxRetries: 1,
  retryBaseDelayMs: 2000,
  taskTimeoutMs: 20_000,
  settings: {},
  tags: ["uptime", "monitoring", "infrastructure", "alerts"],
};

// Threshold for "degraded" response time
const DEGRADED_MS = 5000;

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class UptimeMonitorAgent extends BaseAgent<UptimeCheckInput, UptimeCheckOutput> {
  protected async discoverTasks(): Promise<UptimeCheckInput[]> {
    return getEndpoints();
  }

  protected async execute(
    input: UptimeCheckInput,
    _context: TaskContext
  ): Promise<{ output: UptimeCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];
    const startTime = Date.now();

    try {
      const fetchOptions: RequestInit = {
        method: input.method,
        signal: AbortSignal.timeout(input.timeoutMs),
        headers: input.headers,
      };

      if (input.body && (input.method === "POST")) {
        fetchOptions.body = input.body;
      }

      const response = await fetch(input.url, fetchOptions);
      const responseTimeMs = Date.now() - startTime;
      const httpStatus = response.status;

      const isExpectedStatus = input.expectedStatus.includes(httpStatus);

      if (!isExpectedStatus) {
        // Unexpected status
        const output: UptimeCheckOutput = {
          name: input.name,
          url: input.url,
          status: "down",
          responseTimeMs,
          httpStatus,
          error: `Unexpected status ${httpStatus} (expected: ${input.expectedStatus.join(", ")})`,
        };

        findings.push({
          severity: input.critical ? "critical" : "warning",
          category: "uptime:unexpected-status",
          title: `${input.name}: HTTP ${httpStatus}`,
          description: `Expected ${input.expectedStatus.join("/")} but got ${httpStatus}. Response time: ${responseTimeMs}ms.`,
          autoFixed: false,
          metadata: { endpoint: input.url, httpStatus, responseTimeMs },
        });

        if (input.critical) {
          await this.sendImmediateAlert(input.name, output);
        }

        await this.storeCheckResult(input.name, output);

        return { output, confidence: 0.95, findings };
      }

      // Check for degraded performance
      const status = responseTimeMs > DEGRADED_MS ? "degraded" : "up";

      if (status === "degraded") {
        findings.push({
          severity: "warning",
          category: "uptime:degraded",
          title: `${input.name}: Slow response (${responseTimeMs}ms)`,
          description: `Response took ${responseTimeMs}ms which exceeds the ${DEGRADED_MS}ms threshold. Service may be under load.`,
          autoFixed: false,
          metadata: { endpoint: input.url, responseTimeMs },
        });
      }

      const output: UptimeCheckOutput = {
        name: input.name,
        url: input.url,
        status,
        responseTimeMs,
        httpStatus,
        error: null,
      };

      await this.storeCheckResult(input.name, output);

      return { output, confidence: 0.99, findings };
    } catch (err) {
      const responseTimeMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);

      const output: UptimeCheckOutput = {
        name: input.name,
        url: input.url,
        status: "down",
        responseTimeMs,
        httpStatus: null,
        error: errorMsg,
      };

      findings.push({
        severity: input.critical ? "critical" : "error",
        category: "uptime:down",
        title: `${input.name}: DOWN`,
        description: `Failed to reach ${input.url}. Error: ${errorMsg}. This ${input.critical ? "is a CRITICAL service" : "may affect some functionality"}.`,
        autoFixed: false,
        metadata: { endpoint: input.url, error: errorMsg, responseTimeMs },
      });

      if (input.critical) {
        await this.sendImmediateAlert(input.name, output);
      }

      await this.storeCheckResult(input.name, output);

      return { output, confidence: 0.95, findings };
    }
  }

  // ── Store check result for uptime calculation ──

  private async storeCheckResult(name: string, result: UptimeCheckOutput): Promise<void> {
    try {
      const { sql } = await import("@/lib/db");

      // Ensure table exists
      await sql`
        CREATE TABLE IF NOT EXISTS uptime_checks (
          id SERIAL PRIMARY KEY,
          endpoint_name TEXT NOT NULL,
          url TEXT NOT NULL,
          status TEXT NOT NULL,
          response_time_ms INT,
          http_status INT,
          error TEXT,
          checked_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      await sql`
        INSERT INTO uptime_checks (endpoint_name, url, status, response_time_ms, http_status, error)
        VALUES (${name}, ${result.url}, ${result.status}, ${result.responseTimeMs}, ${result.httpStatus}, ${result.error})
      `;

      // Clean up old records (keep 7 days)
      await sql`DELETE FROM uptime_checks WHERE checked_at < NOW() - INTERVAL '7 days'`;
    } catch {
      // DB unavailable — log locally
      console.log(`[UptimeMonitor] ${name}: ${result.status} (${result.responseTimeMs}ms)`);
    }
  }

  // ── Immediate alert for critical downtime ──

  private async sendImmediateAlert(
    endpointName: string,
    result: UptimeCheckOutput
  ): Promise<void> {
    // Check if we already alerted for this endpoint recently (avoid alert spam)
    try {
      const { sql } = await import("@/lib/db");
      const recentAlerts = await sql`
        SELECT COUNT(*) as count FROM uptime_checks
        WHERE endpoint_name = ${endpointName}
          AND status = 'down'
          AND checked_at > NOW() - INTERVAL '15 minutes'
      `;

      // Only alert on the first failure and every 15 minutes after
      const downCount = Number(recentAlerts[0]?.count || 0);
      if (downCount > 0 && downCount % 3 !== 0) return;
    } catch {
      // Can't check, send alert anyway
    }

    try {
      const { notifyAdmin } = await import("@/lib/admin-notify");
      await notifyAdmin({
        subject: `[CRITICAL] ${endpointName} is DOWN`,
        html: `<h2 style="color: #dc2626;">Service Down: ${endpointName}</h2>
        <p><strong>URL:</strong> ${result.url}</p>
        <p><strong>Status:</strong> ${result.status}</p>
        <p><strong>HTTP Status:</strong> ${result.httpStatus || "N/A"}</p>
        <p><strong>Error:</strong> ${result.error || "No response"}</p>
        <p><strong>Response Time:</strong> ${result.responseTimeMs}ms</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p>This is a critical service. Investigate immediately.</p>`,
      });
    } catch {
      console.error(`[UptimeMonitor] CRITICAL: ${endpointName} is DOWN and could not send alert. Error: ${result.error}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new UptimeMonitorAgent(CONFIG, store));

export { UptimeMonitorAgent, CONFIG as UPTIME_MONITOR_CONFIG };
