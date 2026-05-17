/**
 * Zoobicon Agent Framework
 *
 * Self-contained autonomous agent infrastructure. Extractable to
 * its own package/product.
 *
 * Usage:
 *   import { runAgent, listAgents, runScheduledAgents } from "@/agents";
 *
 * Built-in agents (17 total):
 *
 *   Wave 1 — Foundation:
 *   - site-monitor: Daily site quality audits (SEO, performance, content)
 *   - support-responder: AI support ticket drafting + auto-reply
 *   - intel-monitor: Competitive intelligence monitoring
 *   - email-campaign: Email campaign management
 *   - daily-todo-sender: Sends Craig's daily to-do list email every morning
 *   - abuse-detector: Detects spam signups, rate evasion, content policy violations (every 10 min)
 *   - revenue-monitor: Revenue tracking, drop detection, upgrade opportunities (every 6 hours)
 *   - quality-auditor: Deployed site quality audits with scoring (every 4 hours)
 *   - uptime-monitor: Endpoint health + external dependency monitoring (every 5 min)
 *
 *   Wave 2 — Green Ecosystem (zero-error autonomous platform):
 *   - error-prevention: Catches API errors before they impact users (every 2 min)
 *   - auto-healer: Auto-fixes stuck deployments, failed emails, stale data (every 5 min)
 *   - performance-guardian: Monitors generation speed, API latency, DB performance (every 15 min)
 *   - onboarding-watchdog: Tracks new user activation, sends reminders, detects drop-off (every 1 hour)
 *   - billing-guardian: Prevents churn — failed payments, expiring subs, quota alerts (every 2 hours)
 *   - security-sentinel: Brute force detection, XSS scanning, signup spam blocking (every 5 min)
 *   - seo-auto-fix: Audits and auto-fixes SEO on deployed sites (every 6 hours)
 *   - deployment-guardian: Validates deployments serve correctly with quality HTML (every 10 min)
 *   - market-crawler: Product feature & pricing crawler for competitors (every 12 hours)
 *
 * Creating custom agents:
 *   1. Extend BaseAgent<TInput, TOutput>
 *   2. Implement execute() method
 *   3. Call registerAgent(config, factory)
 *   4. Agent appears in registry and can be scheduled
 *
 * @module @zoobicon/agents
 */

// Core framework
export { BaseAgent, onAgentEvent } from "./base";
export type {
  AgentConfig,
  AgentStatus,
  AgentRun,
  AgentFinding,
  AgentEvent,
  AgentStore,
  Task,
  TaskContext,
  TaskStatus,
  Severity,
} from "./base";

// Storage backends
export { DatabaseAgentStore, InMemoryAgentStore } from "./store";

// Registry & scheduler
export {
  registerAgent,
  getAgent,
  listAgents,
  runAgent,
  runScheduledAgents,
  getAgentHistory,
  getAgentHealth,
} from "./registry";

// Built-in agents (import triggers registration)
// Rule 31 — Infrastructure-monitoring agents (site-monitor, uptime-monitor,
// performance-guardian, deployment-guardian, auto-healer, security-sentinel,
// abuse-detector, billing-guardian, revenue-monitor, onboarding-watchdog,
// error-prevention) are owned by Crontech RUM + AI Gateway. They no longer
// register here. The agent files remain on disk for the migration window
// in case Crontech needs the implementation as reference.
import "./support-responder";          // builder-side support reply
import "./intel-monitor";              // competitive intelligence
import "./email-campaign";             // queued via Crontech BLK-030
import "./daily-todo-sender";          // Craig's todo digest
import "./quality-auditor";            // builder output quality
import "./seo-auto-fix";               // generated-site SEO
import "./market-crawler";             // competitor scanning
