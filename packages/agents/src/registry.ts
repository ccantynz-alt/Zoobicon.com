/**
 * @zoobicon/agents — Agent Registry & Scheduler
 *
 * Central registry for all agents. Handles:
 * - Agent registration and discovery
 * - Scheduled execution (check which agents are due and run them)
 * - Agent lifecycle management
 * - Health monitoring
 *
 * @module @zoobicon/agents
 */

import { BaseAgent } from "./base";
import type { AgentConfig, AgentRun, AgentStore } from "./base";
import { InMemoryAgentStore } from "./store";

// ---------------------------------------------------------------------------
// Registry internals
// ---------------------------------------------------------------------------

interface RegisteredAgent {
  config: AgentConfig;
  factory: (store: AgentStore) => BaseAgent;
  instance?: BaseAgent;
}

const agents = new Map<string, RegisteredAgent>();
let defaultStore: AgentStore | null = null;

/**
 * Set the default store used by the registry when no store is
 * explicitly provided. If never called, an InMemoryAgentStore is used.
 *
 * @param store - The AgentStore implementation to use as default
 */
export function setDefaultStore(store: AgentStore): void {
  defaultStore = store;
}

function getStore(): AgentStore {
  if (!defaultStore) {
    defaultStore = new InMemoryAgentStore();
  }
  return defaultStore;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register an agent type with its configuration and factory function.
 *
 * The factory is called lazily on first use. Call this at module
 * initialization time for each agent you want the scheduler to know about.
 *
 * @param config  - Agent configuration
 * @param factory - Function that creates an agent instance given a store
 *
 * @example
 * ```typescript
 * registerAgent(
 *   { id: "my-agent", name: "My Agent", ... },
 *   (store) => new MyAgent(config, store)
 * );
 * ```
 */
export function registerAgent(
  config: AgentConfig,
  factory: (store: AgentStore) => BaseAgent
): void {
  agents.set(config.id, { config, factory });
}

/**
 * Get or create an agent instance by ID.
 *
 * Instances are lazily created using the registered factory and cached
 * for subsequent calls.
 *
 * @param agentId - The agent's unique identifier
 * @returns The agent instance, or null if not registered
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
 * List all registered agents with their current status and last run info.
 *
 * @returns Array of agent summaries
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
 *
 * Saves the agent config to the store on first run, then executes
 * a full discover + execute cycle.
 *
 * @param agentId - The agent's unique identifier
 * @returns The run result, or null if the agent is not registered
 */
export async function runAgent(agentId: string): Promise<AgentRun | null> {
  const agent = getAgent(agentId);
  if (!agent) return null;

  const store = getStore();
  await store.saveConfig(agent.config);

  return agent.run();
}

/**
 * Run all scheduled agents that are due for execution.
 *
 * For each registered agent with a `scheduleIntervalSec > 0`, checks
 * whether enough time has passed since the last run. If so, runs the agent.
 *
 * Call this from a cron endpoint (e.g., every 60 seconds) to drive
 * the scheduling system.
 *
 * @returns Summary of which agents ran, were skipped, or errored
 *
 * @example
 * ```typescript
 * // In a cron handler:
 * const result = await runScheduledAgents();
 * console.log(`Ran: ${result.ran.join(", ")}`);
 * ```
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
 * Get run history for a specific agent.
 *
 * @param agentId - The agent's unique identifier
 * @param limit   - Maximum number of runs to return (default: 20)
 * @returns Array of past runs, newest first
 */
export async function getAgentHistory(
  agentId: string,
  limit = 20
): Promise<AgentRun[]> {
  const store = getStore();
  return store.getRunHistory(agentId, limit);
}

/**
 * Get health status of all registered agents.
 *
 * Returns aggregate counts and per-agent status with next scheduled run time.
 *
 * @returns Health summary
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
