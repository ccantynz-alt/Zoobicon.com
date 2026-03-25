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
import "./site-monitor";
import "./support-responder";
import "./intel-monitor";
import "./email-campaign";
import "./daily-todo-sender";
import "./abuse-detector";
import "./revenue-monitor";
import "./quality-auditor";
import "./uptime-monitor";

// Wave 2 agents — Green Ecosystem (zero-error autonomous platform)
import "./error-prevention";
import "./auto-healer";
import "./performance-guardian";
import "./onboarding-watchdog";
import "./billing-guardian";
import "./security-sentinel";
import "./seo-auto-fix";
import "./deployment-guardian";
