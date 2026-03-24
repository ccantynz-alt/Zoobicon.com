/**
 * Agent Registry & Scheduler
 *
 * Central registry for all agents. Handles:
 * - Agent registration and discovery
 * - Scheduled execution via cron endpoint
 * - Agent lifecycle management
 * - Health monitoring
 *
 * @module @zoobicon/agents
 */

import { BaseAgent, type AgentConfig, type AgentRun, type AgentStore } from "./base";
import { DatabaseAgentStore } from "./store";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

interface RegisteredAgent {
  config: AgentConfig;
  factory: (store: AgentStore) => BaseAgent;
  instance?: BaseAgent;
}

const agents = new Map<string, RegisteredAgent>();
let defaultStore: AgentStore | null = null;

function getStore(): AgentStore {
  if (!defaultStore) {
    defaultStore = new DatabaseAgentStore();
  }
  return defaultStore;
}

/**
 * Register an agent type. Call this at module initialization.
 */
export function registerAgent(
  config: AgentConfig,
  factory: (store: AgentStore) => BaseAgent
): void {
  agents.set(config.id, { config, factory });
}

/**
 * Get or create an agent instance.
 */
export function getAgent(agentId: string): BaseAgent | null {
  const entry = agents.get(agentId);
  if (!entry) return null;

  if (!entry.instance) {
    entry.instance = entry.factory(getStore());
  }
  return entry.instance;
}

/**
 * List all registered agents with their current status.
 */
export async function listAgents(): Promise<
  Array<{
    config: AgentConfig;
    status: string;
    lastRun: AgentRun | null;
  }>
> {
  const store = getStore();
  const result = [];

  for (const [, entry] of agents) {
    const lastRun = await store.getLatestRun(entry.config.id);
    result.push({
      config: entry.config,
      status: entry.instance?.status || "idle",
      lastRun,
    });
  }

  return result;
}

/**
 * Run a specific agent by ID.
 */
export async function runAgent(agentId: string): Promise<AgentRun | null> {
  const agent = getAgent(agentId);
  if (!agent) return null;

  // Save config to DB on first run
  const store = getStore();
  await store.saveConfig(agent.config);

  return agent.run();
}

/**
 * Run all scheduled agents that are due.
 * Called by /api/agents/cron endpoint.
 */
export async function runScheduledAgents(): Promise<{
  ran: string[];
  skipped: string[];
  errors: Array<{ agentId: string; error: string }>;
}> {
  const store = getStore();
  const ran: string[] = [];
  const skipped: string[] = [];
  const errors: Array<{ agentId: string; error: string }> = [];

  for (const [agentId, entry] of agents) {
    const { config } = entry;

    // Skip agents with no schedule
    if (config.scheduleIntervalSec <= 0) {
      skipped.push(agentId);
      continue;
    }

    // Check if agent is due
    const lastRun = await store.getLatestRun(agentId);
    if (lastRun) {
      const elapsed = (Date.now() - lastRun.startedAt) / 1000;
      if (elapsed < config.scheduleIntervalSec) {
        skipped.push(agentId);
        continue;
      }
    }

    // Run the agent
    try {
      const agent = getAgent(agentId);
      if (!agent) {
        skipped.push(agentId);
        continue;
      }

      // Skip if already running
      if (agent.status === "running") {
        skipped.push(agentId);
        continue;
      }

      await store.saveConfig(config);
      await agent.run();
      ran.push(agentId);
    } catch (err) {
      errors.push({
        agentId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { ran, skipped, errors };
}

/**
 * Get agent run history.
 */
export async function getAgentHistory(
  agentId: string,
  limit = 20
): Promise<AgentRun[]> {
  const store = getStore();
  return store.getRunHistory(agentId, limit);
}

/**
 * Get health status of all agents.
 */
export async function getAgentHealth(): Promise<{
  totalAgents: number;
  running: number;
  idle: number;
  errored: number;
  agents: Array<{
    id: string;
    name: string;
    status: string;
    lastRunAt: number | null;
    lastRunStatus: string | null;
    nextRunAt: number | null;
  }>;
}> {
  const store = getStore();
  let running = 0;
  let idle = 0;
  let errored = 0;
  const agentStatuses = [];

  for (const [, entry] of agents) {
    const status = entry.instance?.status || "idle";
    if (status === "running") running++;
    else if (status === "error") errored++;
    else idle++;

    const lastRun = await store.getLatestRun(entry.config.id);

    let nextRunAt: number | null = null;
    if (entry.config.scheduleIntervalSec > 0 && lastRun) {
      nextRunAt = lastRun.startedAt + entry.config.scheduleIntervalSec * 1000;
    }

    agentStatuses.push({
      id: entry.config.id,
      name: entry.config.name,
      status,
      lastRunAt: lastRun?.startedAt || null,
      lastRunStatus: lastRun?.status || null,
      nextRunAt,
    });
  }

  return {
    totalAgents: agents.size,
    running,
    idle,
    errored,
    agents: agentStatuses,
  };
}
