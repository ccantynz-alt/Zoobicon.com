/**
 * Zoobicon Agent Framework
 *
 * Self-contained autonomous agent infrastructure. Extractable to
 * its own package/product.
 *
 * Usage:
 *   import { runAgent, listAgents, runScheduledAgents } from "@/agents";
 *
 * Built-in agents:
 *   - site-monitor: Daily site quality audits (SEO, performance, content)
 *   - support-responder: AI support ticket drafting + auto-reply
 *   - intel-monitor: Competitive intelligence monitoring
 *   - daily-todo-sender: Sends Craig's daily to-do list email every morning
 *   - abuse-detector: Detects spam signups, rate evasion, content policy violations (every 10 min)
 *   - revenue-monitor: Revenue tracking, drop detection, upgrade opportunities (every 6 hours)
 *   - quality-auditor: Deployed site quality audits with scoring (every 4 hours)
 *   - uptime-monitor: Endpoint health + external dependency monitoring (every 5 min)
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
