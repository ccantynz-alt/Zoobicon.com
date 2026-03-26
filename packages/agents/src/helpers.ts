/**
 * @zoobicon/agents — Helper Utilities
 *
 * Convenience functions for creating agents without extending BaseAgent.
 *
 * @module @zoobicon/agents
 */

import { BaseAgent } from "./base";
import type { AgentConfig, AgentFinding, AgentStore, TaskContext } from "./base";
import { InMemoryAgentStore } from "./store";
import { registerAgent } from "./registry";

/** Function signature for the simplified execute handler. */
type SimpleExecuteFn<TInput, TOutput> = (
  input: TInput,
  context: TaskContext
) => Promise<{ output: TOutput; confidence?: number; findings?: AgentFinding[] }>;

/** Function signature for the simplified discover handler. */
type SimpleDiscoverFn<TInput> = () => Promise<TInput[]>;

/** Options for {@link createAgent}. */
export interface CreateAgentOptions<TInput = unknown, TOutput = unknown> {
  /** Unique agent identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this agent does */
  description?: string;
  /** Version string (default: "1.0.0") */
  version?: string;
  /** Schedule interval in seconds (0 = manual only) */
  scheduleIntervalSec?: number;
  /** Maximum concurrent tasks (default: 1) */
  maxConcurrency?: number;
  /** Maximum retries per task (default: 2) */
  maxRetries?: number;
  /** Task timeout in ms (default: 60000) */
  taskTimeoutMs?: number;
  /** Whether to auto-execute below confidence threshold (default: true) */
  autoExecute?: boolean;
  /** Confidence threshold for flagging review (default: 0.5) */
  confidenceThreshold?: number;
  /** Tags for categorization */
  tags?: string[];
  /** Agent-specific settings */
  settings?: Record<string, unknown>;
  /** Function that discovers tasks to run */
  discover: SimpleDiscoverFn<TInput>;
  /** Function that executes a single task */
  execute: SimpleExecuteFn<TInput, TOutput>;
  /** Custom persistence store (default: InMemoryAgentStore) */
  store?: AgentStore;
  /** Whether to auto-register with the global registry (default: true) */
  autoRegister?: boolean;
}

/**
 * Create an agent without extending BaseAgent.
 *
 * This is the fastest way to define a new agent. Just provide `discover`
 * and `execute` functions and you get a fully-featured agent with retry,
 * timeout, concurrency, scheduling, and persistence.
 *
 * @typeParam TInput  - Type of task input data
 * @typeParam TOutput - Type of task output data
 * @param opts - Agent options
 * @returns A fully configured BaseAgent instance
 *
 * @example
 * ```typescript
 * const monitor = createAgent({
 *   id: "uptime-monitor",
 *   name: "Uptime Monitor",
 *   scheduleIntervalSec: 300,
 *   discover: async () => [
 *     { url: "https://example.com" },
 *     { url: "https://api.example.com/health" },
 *   ],
 *   execute: async (input) => {
 *     const res = await fetch(input.url);
 *     return {
 *       output: { status: res.status, ok: res.ok },
 *       confidence: 1,
 *     };
 *   },
 * });
 *
 * // Run immediately
 * const result = await monitor.run();
 * console.log(`Checked ${result.tasksCompleted} endpoints`);
 * ```
 */
export function createAgent<TInput = unknown, TOutput = unknown>(
  opts: CreateAgentOptions<TInput, TOutput>
): BaseAgent<TInput, TOutput> {
  const config: AgentConfig = {
    id: opts.id,
    name: opts.name,
    description: opts.description || "",
    version: opts.version || "1.0.0",
    autoExecute: opts.autoExecute !== undefined ? opts.autoExecute : true,
    confidenceThreshold: opts.confidenceThreshold !== undefined ? opts.confidenceThreshold : 0.5,
    scheduleIntervalSec: opts.scheduleIntervalSec || 0,
    maxConcurrency: opts.maxConcurrency || 1,
    maxRetries: opts.maxRetries !== undefined ? opts.maxRetries : 2,
    retryBaseDelayMs: 1000,
    taskTimeoutMs: opts.taskTimeoutMs || 60000,
    settings: opts.settings || {},
    tags: opts.tags || [],
  };

  class SimpleAgent extends BaseAgent<TInput, TOutput> {
    protected async discoverTasks(): Promise<TInput[]> {
      return opts.discover();
    }
    protected async execute(input: TInput, context: TaskContext) {
      const result = await opts.execute(input, context);
      return {
        output: result.output,
        confidence: result.confidence ?? 1,
        findings: result.findings || [],
      };
    }
  }

  const store = opts.store || new InMemoryAgentStore();
  const agent = new SimpleAgent(config, store);

  if (opts.autoRegister !== false) {
    registerAgent(config, () => agent);
  }

  return agent;
}
