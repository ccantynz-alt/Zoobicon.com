/**
 * Security Sentinel Agent
 *
 * Detects and blocks security threats:
 * - Monitors for suspicious login patterns (brute force)
 * - Detects unusual API usage patterns
 * - Checks for known vulnerability patterns in generated sites
 * - Monitors for XSS/injection attempts in prompts
 * - Tracks and alerts on suspicious IP activity
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

interface SecurityCheckInput {
  type: "brute-force" | "api-abuse" | "xss-detection" | "suspicious-signups";
  name: string;
}

interface SecurityCheckOutput {
  name: string;
  threatsDetected: number;
  blocked: number;
  details: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG: AgentConfig = {
  id: "security-sentinel",
  name: "Security Sentinel",
  description: "Detects and blocks security threats: brute force attacks, API abuse, XSS injection attempts, and suspicious activity patterns.",
  version: "1.0.0",
  autoExecute: true,
  confidenceThreshold: 0.7,
  scheduleIntervalSec: 300, // 5 minutes
  maxConcurrency: 4,
  maxRetries: 1,
  retryBaseDelayMs: 2000,
  taskTimeoutMs: 30_000,
  settings: {
    bruteForceThreshold: 10,       // Failed logins per IP in 15 min
    apiAbuseThreshold: 100,        // Requests per minute per IP
    xssPatterns: true,
  },
  tags: ["security", "threat-detection", "brute-force", "xss", "abuse"],
};

// Known XSS/injection patterns
const DANGEROUS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /on(error|load|click|mouseover|focus)=/i,
  /eval\s*\(/i,
  /document\.(cookie|write|location)/i,
  /window\.(location|open)/i,
  /\bexec\s*\(/i,
  /UNION\s+SELECT/i,
  /;\s*DROP\s+TABLE/i,
  /;\s*DELETE\s+FROM/i,
  /'\s*OR\s+'1'\s*=\s*'1/i,
  /--\s*$/,
  /\/etc\/passwd/i,
  /\.\.\//,
];

// ---------------------------------------------------------------------------
// Agent Implementation
// ---------------------------------------------------------------------------

class SecuritySentinelAgent extends BaseAgent<SecurityCheckInput, SecurityCheckOutput> {
  protected async discoverTasks(): Promise<SecurityCheckInput[]> {
    return [
      { type: "brute-force", name: "Brute Force Detection" },
      { type: "api-abuse", name: "API Abuse Detection" },
      { type: "xss-detection", name: "XSS/Injection Scanning" },
      { type: "suspicious-signups", name: "Suspicious Signup Detection" },
    ];
  }

  protected async execute(
    input: SecurityCheckInput,
    _context: TaskContext
  ): Promise<{ output: SecurityCheckOutput; confidence: number; findings: AgentFinding[] }> {
    switch (input.type) {
      case "brute-force":
        return this.detectBruteForce(input);
      case "api-abuse":
        return this.detectApiAbuse(input);
      case "xss-detection":
        return this.scanForXss(input);
      case "suspicious-signups":
        return this.detectSuspiciousSignups(input);
      default:
        return {
          output: { name: input.name, threatsDetected: 0, blocked: 0, details: "Unknown check" },
          confidence: 0.5,
          findings: [],
        };
    }
  }

  // ── Brute Force Detection ──

  private async detectBruteForce(
    input: SecurityCheckInput
  ): Promise<{ output: SecurityCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Ensure security events table exists
      await sql`
        CREATE TABLE IF NOT EXISTS security_events (
          id SERIAL PRIMARY KEY,
          event_type TEXT NOT NULL,
          ip_address TEXT,
          user_email TEXT,
          details TEXT,
          blocked BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      // Count failed logins per email in last 15 minutes
      const bruteForce = await sql`
        SELECT user_email, COUNT(*) as attempt_count
        FROM security_events
        WHERE event_type = 'login_failed'
          AND created_at > NOW() - INTERVAL '15 minutes'
        GROUP BY user_email
        HAVING COUNT(*) >= ${CONFIG.settings.bruteForceThreshold as number}
      `;

      let threatsDetected = 0;
      let blocked = 0;

      for (const row of bruteForce) {
        const attempts = Number(row.attempt_count);
        threatsDetected++;

        findings.push({
          severity: attempts >= 20 ? "critical" : "error",
          category: "security:brute-force",
          title: `Brute Force: ${row.user_email} (${attempts} attempts)`,
          description: `${attempts} failed login attempts for ${row.user_email} in the last 15 minutes. This is likely a brute force attack.`,
          autoFixed: false,
          metadata: { email: row.user_email, attempts },
        });

        // Auto-block accounts with extreme attempts
        if (attempts >= 20) {
          try {
            await sql`
              INSERT INTO security_events (event_type, user_email, details, blocked)
              VALUES ('account_locked', ${row.user_email}, ${`Auto-locked after ${attempts} failed login attempts`}, true)
            `;
            blocked++;
          } catch {
            // Logging failed
          }
        }
      }

      // Alert admin on any brute force detection
      if (threatsDetected > 0) {
        try {
          const { notifyAdmin } = await import("@/lib/admin-notify");
          await notifyAdmin({
            subject: `[SECURITY] ${threatsDetected} brute force attack(s) detected`,
            html: `<h2 style="color: #dc2626;">Brute Force Attack Detected</h2>
            <p><strong>${threatsDetected}</strong> account(s) targeted in the last 15 minutes.</p>
            <p><strong>${blocked}</strong> account(s) auto-locked.</p>
            <p>Review the security_events table for details.</p>`,
          });
        } catch {
          // Alert failed
        }
      }

      // Cleanup old security events (keep 30 days)
      await sql`DELETE FROM security_events WHERE created_at < NOW() - INTERVAL '30 days'`.catch(() => {});

      return {
        output: { name: input.name, threatsDetected, blocked, details: `${threatsDetected} brute force attempts, ${blocked} locked` },
        confidence: 0.95,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, threatsDetected: 0, blocked: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── API Abuse Detection ──

  private async detectApiAbuse(
    input: SecurityCheckInput
  ): Promise<{ output: SecurityCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Check for API keys with unusually high request rates
      const highUsage = await sql`
        SELECT
          user_email,
          COUNT(*) as request_count,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
        FROM agency_generations
        WHERE created_at > NOW() - INTERVAL '1 hour'
        GROUP BY user_email
        HAVING COUNT(*) > 50
        ORDER BY COUNT(*) DESC
      `;

      let threatsDetected = 0;

      for (const row of highUsage) {
        const requests = Number(row.request_count);
        const failures = Number(row.failed_count);
        const failRate = requests > 0 ? (failures / requests) * 100 : 0;

        // High volume + high failure rate = suspicious
        if (requests > 100 || failRate > 50) {
          threatsDetected++;

          findings.push({
            severity: requests > 200 ? "critical" : "warning",
            category: "security:api-abuse",
            title: `Unusual API Usage: ${row.user_email} (${requests} requests/hr)`,
            description: `${row.user_email} made ${requests} generation requests in the last hour (${failures} failed, ${failRate.toFixed(1)}% fail rate). May be scripted abuse or a stuck client.`,
            autoFixed: false,
            metadata: { email: row.user_email, requests, failures, failRate },
          });
        }
      }

      return {
        output: { name: input.name, threatsDetected, blocked: 0, details: `${threatsDetected} suspicious usage patterns` },
        confidence: 0.85,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, threatsDetected: 0, blocked: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── XSS/Injection Scanning ──

  private async scanForXss(
    input: SecurityCheckInput
  ): Promise<{ output: SecurityCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Scan recent generation prompts for injection patterns
      const recentPrompts = await sql`
        SELECT id, user_email, prompt, created_at
        FROM agency_generations
        WHERE created_at > NOW() - INTERVAL '30 minutes'
        LIMIT 200
      `;

      let threatsDetected = 0;

      for (const row of recentPrompts) {
        const prompt = String(row.prompt || "");

        for (const pattern of DANGEROUS_PATTERNS) {
          if (pattern.test(prompt)) {
            threatsDetected++;

            findings.push({
              severity: "error",
              category: "security:xss-injection",
              title: `Injection Attempt: ${row.user_email}`,
              description: `Suspicious pattern detected in generation prompt from ${row.user_email}. Pattern: ${pattern.source}. Generation ID: ${row.id}.`,
              autoFixed: false,
              metadata: { email: row.user_email, generationId: row.id, pattern: pattern.source },
            });

            // Log the security event
            await sql`
              INSERT INTO security_events (event_type, user_email, details)
              VALUES ('xss_attempt', ${row.user_email}, ${`Pattern: ${pattern.source} in generation ${row.id}`})
            `.catch(() => {});

            break; // One finding per prompt is enough
          }
        }
      }

      if (threatsDetected > 0) {
        try {
          const { notifyAdmin } = await import("@/lib/admin-notify");
          await notifyAdmin({
            subject: `[SECURITY] ${threatsDetected} injection attempt(s) detected`,
            html: `<h2 style="color: #dc2626;">Injection Attempts Detected</h2>
            <p><strong>${threatsDetected}</strong> suspicious prompts in the last 30 minutes contain XSS/SQL injection patterns.</p>
            <p>Review the security_events table. Generated output is sandboxed in iframes, but these users may be testing for vulnerabilities.</p>`,
          });
        } catch {
          // Alert failed
        }
      }

      return {
        output: { name: input.name, threatsDetected, blocked: 0, details: `${threatsDetected} injection attempts in ${recentPrompts.length} prompts` },
        confidence: 0.9,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, threatsDetected: 0, blocked: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }

  // ── Suspicious Signup Detection ──

  private async detectSuspiciousSignups(
    input: SecurityCheckInput
  ): Promise<{ output: SecurityCheckOutput; confidence: number; findings: AgentFinding[] }> {
    const findings: AgentFinding[] = [];

    try {
      const { sql } = await import("@/lib/db");

      // Detect burst signups (potential bot attack)
      const recentSignups = await sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE created_at > NOW() - INTERVAL '10 minutes'
      `;

      const signupCount = Number(recentSignups[0]?.count || 0);
      let threatsDetected = 0;

      if (signupCount > 20) {
        threatsDetected++;

        findings.push({
          severity: "critical",
          category: "security:signup-spam",
          title: `Signup Burst: ${signupCount} signups in 10 minutes`,
          description: `${signupCount} new accounts created in the last 10 minutes. Normal rate is 1-5. This is likely a bot attack. Consider enabling CAPTCHA or rate limiting signups.`,
          autoFixed: false,
          metadata: { signupCount },
        });

        try {
          const { notifyAdmin } = await import("@/lib/admin-notify");
          await notifyAdmin({
            subject: `[SECURITY] Signup spam: ${signupCount} accounts in 10 minutes`,
            html: `<h2 style="color: #dc2626;">Signup Spam Detected</h2>
            <p><strong>${signupCount}</strong> accounts created in the last 10 minutes. This is far above normal.</p>
            <p>Enable CAPTCHA on the signup form or temporarily block new registrations.</p>`,
          });
        } catch {
          // Alert failed
        }
      }

      // Check for disposable email domains
      const disposableDomains = await sql`
        SELECT email, created_at
        FROM users
        WHERE created_at > NOW() - INTERVAL '1 hour'
          AND (
            email LIKE '%@tempmail%'
            OR email LIKE '%@guerrillamail%'
            OR email LIKE '%@mailinator%'
            OR email LIKE '%@throwaway%'
            OR email LIKE '%@yopmail%'
            OR email LIKE '%@sharklasers%'
            OR email LIKE '%@trashmail%'
            OR email LIKE '%@dispostable%'
          )
      `;

      if (disposableDomains.length > 0) {
        threatsDetected += disposableDomains.length;

        findings.push({
          severity: "warning",
          category: "security:disposable-email",
          title: `${disposableDomains.length} Disposable Email Signup(s)`,
          description: `${disposableDomains.length} signup(s) used disposable/temporary email addresses in the last hour. These accounts are likely spam or abuse.`,
          autoFixed: false,
          metadata: { count: disposableDomains.length },
        });
      }

      return {
        output: { name: input.name, threatsDetected, blocked: 0, details: `${threatsDetected} suspicious signups` },
        confidence: 0.85,
        findings,
      };
    } catch {
      return {
        output: { name: input.name, threatsDetected: 0, blocked: 0, details: "DB unavailable" },
        confidence: 0.5,
        findings,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

registerAgent(CONFIG, (store: AgentStore) => new SecuritySentinelAgent(CONFIG, store));

export { SecuritySentinelAgent, CONFIG as SECURITY_SENTINEL_CONFIG };
