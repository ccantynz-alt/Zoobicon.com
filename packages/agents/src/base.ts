/**
 * @zoobicon/agents — Base Agent
 *
 * Core abstract class for building autonomous agents. Provides:
 * - Lifecycle management (init -> run -> cleanup)
 * - Task queue with retry + exponential backoff
 * - State persistence via pluggable AgentStore
 * - Confidence-gated auto-execution
 * - Heartbeat monitoring
 * - Event emission for observability
 *
 * Zero external dependencies. Works in Node.js 18+, Deno, Bun, and edge runtimes.
 *
 * @module @zoobicon/agents
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Current lifecycle status of an agent. */
export type AgentStatus = "idle" | "running" | "paused" | "error" | "completed";

/** Current status of an individual task. */
export type TaskStatus = "pending" | "running" | "completed" | "failed" | "retrying";

/** Severity level for agent findings. */
export type Severity = "info" | "warning" | "error" | "critical";

/**
 * Configuration for an agent instance.
 *
 * Controls scheduling, concurrency, retry behavior, and model routing.
 */
export interface AgentConfig {
  /** Unique agent type identifier (e.g., "seo-optimizer", "uptime-monitor") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this agent does */
  description: string;
  /** Semantic version string */
  version: string;
  /** Whether the agent can auto-execute without human approval */
  autoExecute: boolean;
  /** Minimum confidence score (0-1) required for auto-execution */
  confidenceThreshold: number;
  /** Schedule interval in seconds (0 = manual only) */
  scheduleIntervalSec: number;
  /** Maximum concurrent tasks per run */
  maxConcurrency: number;
  /** Maximum retries per task before marking as failed */
  maxRetries: number;
  /** Base retry delay in ms (doubles on each retry via exponential backoff) */
  retryBaseDelayMs: number;
  /** Maximum execution time per task in ms */
  taskTimeoutMs: number;
  /** Optional LLM model identifier for AI-powered agents */
  model?: string;
  /** Agent-specific key-value settings */
  settings: Record<string, unknown>;
  /** Tags for categorization and discovery */
  tags: string[];
}

/**
 * A single unit of work processed by an agent.
 *
 * @typeParam TInput  - Type of the task input data
 * @typeParam TOutput - Type of the task output data
 */
export interface Task<TInput = unknown, TOutput = unknown> {
  /** Unique task identifier */
  id: string;
  /** Agent that owns this task */
  agentId: string;
  /** Current task status */
  status: TaskStatus;
  /** Input data for the task */
  input: TInput;
  /** Output data (set after successful execution) */
  output?: TOutput;
  /** Error message (set on failure) */
  error?: string;
  /** Confidence score from the agent (0-1) */
  confidence?: number;
  /** Number of retry attempts so far */
  retryCount: number;
  /** Unix timestamp (ms) when the task was created */
  createdAt: number;
  /** Unix timestamp (ms) when execution started */
  startedAt?: number;
  /** Unix timestamp (ms) when execution finished */
  completedAt?: number;
  /** Arbitrary metadata attached to this task */
  metadata?: Record<string, unknown>;
}

/**
 * Record of a single agent run (discover + execute cycle).
 */
export interface AgentRun {
  /** Unique run identifier */
  id: string;
  /** Agent that performed this run */
  agentId: string;
  /** Run outcome status */
  status: AgentStatus;
  /** Total tasks discovered */
  tasksTotal: number;
  /** Tasks that completed successfully */
  tasksCompleted: number;
  /** Tasks that failed after all retries */
  tasksFailed: number;
  /** Unix timestamp (ms) when the run started */
  startedAt: number;
  /** Unix timestamp (ms) when the run finished */
  completedAt?: number;
  /** Total duration in ms */
  duration?: number;
  /** Findings collected during the run */
  findings: AgentFinding[];
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A finding is an observation or action taken during task execution.
 * Used for auditing, reporting, and dashboards.
 */
export interface AgentFinding {
  /** Severity level */
  severity: Severity;
  /** Category for grouping (e.g., "uptime", "seo", "security") */
  category: string;
  /** Short summary */
  title: string;
  /** Detailed description */
  description: string;
  /** Whether the agent automatically resolved this */
  autoFixed: boolean;
  /** Value before the fix (if applicable) */
  beforeValue?: string;
  /** Value after the fix (if applicable) */
  afterValue?: string;
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Events emitted by agents for observability.
 * Subscribe via {@link onAgentEvent}.
 */
export interface AgentEvent {
  /** Agent that emitted the event */
  agentId: string;
  /** Event type */
  type: "started" | "completed" | "failed" | "task_completed" | "task_failed" | "finding" | "heartbeat";
  /** Unix timestamp (ms) */
  timestamp: number;
  /** Event-specific payload */
  data?: unknown;
}

/**
 * Context passed to the agent's execute method for each task.
 */
export interface TaskContext {
  /** Current task ID */
  taskId: string;
  /** Agent ID */
  agentId: string;
  /** Current retry attempt (0-based) */
  retryCount: number;
  /** LLM model identifier (if configured) */
  model?: string;
}

// ---------------------------------------------------------------------------
// Agent Store Interface (pluggable persistence)
// ---------------------------------------------------------------------------

/**
 * Persistence backend for agent state.
 *
 * Implement this interface to store agent runs, tasks, and configs
 * in any database. Built-in implementations:
 * - {@link InMemoryAgentStore} — for testing and lightweight use
 * - {@link PostgresAgentStore} — for production Postgres (Neon, Supabase, etc.)
 */
export interface AgentStore {
  /** Save or update an agent run record */
  saveRun(run: AgentRun): Promise<void>;
  /** Get the most recent run for an agent */
  getLatestRun(agentId: string): Promise<AgentRun | null>;
  /** Get run history for an agent, newest first */
  getRunHistory(agentId: string, limit?: number): Promise<AgentRun[]>;
  /** Save or update a task record */
  saveTask(task: Task): Promise<void>;
  /** Get pending tasks for an agent */
  getPendingTasks(agentId: string, limit?: number): Promise<Task[]>;
  /** Save or update agent configuration */
  saveConfig(config: AgentConfig): Promise<void>;
  /** Get agent configuration by ID */
  getConfig(agentId: string): Promise<AgentConfig | null>;
  /** List all registered agent configurations */
  listAgents(): Promise<AgentConfig[]>;
}

// ---------------------------------------------------------------------------
// Event Bus (in-memory, replaceable with Redis PubSub, NATS, etc.)
// ---------------------------------------------------------------------------

type EventListener = (event: AgentEvent) => void;
const globalListeners = new Set<EventListener>();

/**
 * Subscribe to agent events globally.
 *
 * @param listener - Callback invoked for every agent event
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsub = onAgentEvent((event) => {
 *   if (event.type === "failed") {
 *     console.error(`Agent ${event.agentId} failed!`, event.data);
 *   }
 * });
 *
 * // Later: stop listening
 * unsub();
 * ```
 */
export function onAgentEvent(listener: EventListener): () => void {
  globalListeners.add(listener);
  return () => globalListeners.delete(listener);
}

function emitEvent(event: AgentEvent): void {
  for (const listener of globalListeners) {
    try {
      listener(event);
    } catch {
      // Don't let listener errors break the agent
    }
  }
}

// ---------------------------------------------------------------------------
// Base Agent Class
// ---------------------------------------------------------------------------

/**
 * Abstract base class for all agents.
 *
 * Extend this class and implement {@link execute} (required) and
 * optionally {@link discoverTasks}, {@link initialize}, and {@link cleanup}.
 *
 * For simple agents that don't need a class, use {@link createAgent} instead.
 *
 * @typeParam TInput  - Type of task input data
 * @typeParam TOutput - Type of task output data
 *
 * @example
 * ```typescript
 * class MyAgent extends BaseAgent<{ url: string }, { status: number }> {
 *   protected async discoverTasks() {
 *     return [{ url: "https://example.com" }];
 *   }
 *
 *   protected async execute(input: { url: string }, context: TaskContext) {
 *     const res = await fetch(input.url);
 *     return { output: { status: res.status }, confidence: 1, findings: [] };
 *   }
 * }
 * ```
 */
export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  /** Agent configuration (read-only after construction) */
  readonly config: AgentConfig;
  /** Persistence store for runs, tasks, and config */
  protected store: AgentStore;
  private _status: AgentStatus = "idle";
  private _currentRun: AgentRun | null = null;

  constructor(config: AgentConfig, store: AgentStore) {
    this.config = config;
    this.store = store;
  }

  /** Current lifecycle status of this agent instance */
  get status(): AgentStatus {
    return this._status;
  }

  /** The in-progress run, or null if idle */
  get currentRun(): AgentRun | null {
    return this._currentRun;
  }

  // ── Abstract methods (implement per agent) ──

  /**
   * Process a single task. Must return output, a confidence score (0-1),
   * and optionally an array of findings.
   */
  protected abstract execute(
    input: TInput,
    context: TaskContext
  ): Promise<{ output: TOutput; confidence: number; findings?: AgentFinding[] }>;

  /** Optional: Initialize agent resources (DB tables, connections, etc.) */
  protected async initialize(): Promise<void> {}

  /** Optional: Cleanup agent resources after a run */
  protected async cleanup(): Promise<void> {}

  /** Optional: Discover tasks that need to be run (for scheduled agents) */
  protected async discoverTasks(): Promise<TInput[]> {
    return [];
  }

  // ── Public API ──

  /**
   * Run a single task immediately with the given input.
   *
   * @param input    - Task input data
   * @param metadata - Optional metadata to attach to the task
   * @returns The completed (or failed) task record
   */
  async runTask(input: TInput, metadata?: Record<string, unknown>): Promise<Task<TInput, TOutput>> {
    const task: Task<TInput, TOutput> = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      agentId: this.config.id,
      status: "pending",
      input,
      retryCount: 0,
      createdAt: Date.now(),
      metadata,
    };

    return this._executeTask(task);
  }

  /**
   * Run a full agent cycle: discover tasks, execute all, persist results.
   *
   * This is the primary entry point for scheduled and manual agent runs.
   *
   * @returns The completed run record with all findings
   */
  async run(): Promise<AgentRun> {
    this._status = "running";
    const run: AgentRun = {
      id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      agentId: this.config.id,
      status: "running",
      tasksTotal: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      startedAt: Date.now(),
      findings: [],
    };
    this._currentRun = run;

    emitEvent({ agentId: this.config.id, type: "started", timestamp: Date.now() });

    try {
      await this.initialize();

      // Discover tasks
      const taskInputs = await this.discoverTasks();
      run.tasksTotal = taskInputs.length;

      // Execute tasks (respecting concurrency limit)
      const results: Task<TInput, TOutput>[] = [];

      if (this.config.maxConcurrency <= 1) {
        // Sequential execution
        for (const input of taskInputs) {
          const task = await this.runTask(input);
          results.push(task);
          if (task.status === "completed") {
            run.tasksCompleted++;
          } else {
            run.tasksFailed++;
          }
        }
      } else {
        // Concurrent execution with limit
        const chunks = chunkArray(taskInputs, this.config.maxConcurrency);
        for (const chunk of chunks) {
          const batch = await Promise.allSettled(
            chunk.map((input) => this.runTask(input))
          );
          for (const result of batch) {
            if (result.status === "fulfilled") {
              results.push(result.value);
              if (result.value.status === "completed") {
                run.tasksCompleted++;
              } else {
                run.tasksFailed++;
              }
            } else {
              run.tasksFailed++;
            }
          }
        }
      }

      // Collect findings from all tasks
      for (const task of results) {
        if (task.metadata?.findings) {
          run.findings.push(...(task.metadata.findings as AgentFinding[]));
        }
      }

      run.status = run.tasksFailed > 0 ? "error" : "completed";
      run.completedAt = Date.now();
      run.duration = run.completedAt - run.startedAt;

      await this.store.saveRun(run);
      await this.cleanup();

      this._status = run.status === "error" ? "error" : "idle";

      emitEvent({
        agentId: this.config.id,
        type: run.status === "error" ? "failed" : "completed",
        timestamp: Date.now(),
        data: { tasksCompleted: run.tasksCompleted, tasksFailed: run.tasksFailed, duration: run.duration },
      });

      return run;
    } catch (err) {
      run.status = "error";
      run.completedAt = Date.now();
      run.duration = run.completedAt - run.startedAt;
      run.metadata = { ...run.metadata, error: err instanceof Error ? err.message : String(err) };

      await this.store.saveRun(run).catch(() => {});
      await this.cleanup().catch(() => {});

      this._status = "error";

      emitEvent({
        agentId: this.config.id,
        type: "failed",
        timestamp: Date.now(),
        data: { error: err instanceof Error ? err.message : String(err) },
      });

      return run;
    } finally {
      this._currentRun = null;
    }
  }

  // ── Private ──

  private async _executeTask(task: Task<TInput, TOutput>): Promise<Task<TInput, TOutput>> {
    task.status = "running";
    task.startedAt = Date.now();

    const context: TaskContext = {
      taskId: task.id,
      agentId: this.config.id,
      retryCount: task.retryCount,
      model: this.config.model,
    };

    try {
      // Timeout wrapper
      const result = await withTimeout(
        this.execute(task.input, context),
        this.config.taskTimeoutMs
      );

      task.output = result.output;
      task.confidence = result.confidence;
      task.status = "completed";
      task.completedAt = Date.now();

      if (result.findings) {
        task.metadata = { ...task.metadata, findings: result.findings };
      }

      // Check confidence threshold for auto-execution
      if (this.config.autoExecute && result.confidence < this.config.confidenceThreshold) {
        task.metadata = {
          ...task.metadata,
          needsReview: true,
          reviewReason: `Confidence ${result.confidence.toFixed(2)} below threshold ${this.config.confidenceThreshold}`,
        };
      }

      await this.store.saveTask(task);

      emitEvent({
        agentId: this.config.id,
        type: "task_completed",
        timestamp: Date.now(),
        data: { taskId: task.id, confidence: result.confidence },
      });

      return task;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Retry logic with exponential backoff
      if (task.retryCount < this.config.maxRetries) {
        task.retryCount++;
        task.status = "retrying";
        task.error = errorMsg;

        const delay = this.config.retryBaseDelayMs * Math.pow(2, task.retryCount - 1);
        await sleep(delay);

        return this._executeTask(task);
      }

      // Final failure
      task.status = "failed";
      task.error = errorMsg;
      task.completedAt = Date.now();

      await this.store.saveTask(task).catch(() => {});

      emitEvent({
        agentId: this.config.id,
        type: "task_failed",
        timestamp: Date.now(),
        data: { taskId: task.id, error: errorMsg, retries: task.retryCount },
      });

      return task;
    }
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** @internal */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** @internal */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** @internal */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Task timed out after ${ms}ms`)), ms)
    ),
  ]);
}
