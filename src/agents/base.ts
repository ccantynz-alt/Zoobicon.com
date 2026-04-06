/**
 * Zoobicon Agent Framework — Base Agent
 *
 * Unified base class for all autonomous agents. Provides:
 * - Lifecycle management (init → run → cleanup)
 * - Task queue with retry + exponential backoff
 * - State persistence to database
 * - Confidence-gated auto-execution
 * - LLM provider abstraction (Claude/GPT/Gemini)
 * - Heartbeat monitoring
 * - Event emission for observability
 * - Plugin-ready architecture for marketplace
 *
 * This module is self-contained and extractable. All database access
 * goes through the AgentStore interface, which can be swapped for
 * any persistence backend.
 *
 * @module @zoobicon/agents
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentStatus = "idle" | "running" | "paused" | "error" | "completed";
export type TaskStatus = "pending" | "running" | "completed" | "failed" | "retrying";
export type Severity = "info" | "warning" | "error" | "critical";

export interface AgentConfig {
  /** Unique agent type identifier (e.g., "seo-optimizer", "support-responder") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this agent does */
  description: string;
  /** Version string */
  version: string;
  /** Whether the agent can auto-execute without human approval */
  autoExecute: boolean;
  /** Minimum confidence score (0-1) required for auto-execution */
  confidenceThreshold: number;
  /** Schedule interval in seconds (0 = manual only) */
  scheduleIntervalSec: number;
  /** Maximum concurrent tasks */
  maxConcurrency: number;
  /** Maximum retries per task */
  maxRetries: number;
  /** Base retry delay in ms (doubles on each retry) */
  retryBaseDelayMs: number;
  /** Maximum execution time per task in ms */
  taskTimeoutMs: number;
  /** LLM model to use (null = use default routing) */
  model?: string;
  /** Agent-specific configuration */
  settings: Record<string, unknown>;
  /** Tags for marketplace categorization */
  tags: string[];
}

export interface Task<TInput = unknown, TOutput = unknown> {
  id: string;
  agentId: string;
  status: TaskStatus;
  input: TInput;
  output?: TOutput;
  error?: string;
  confidence?: number;
  retryCount: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface AgentRun {
  id: string;
  agentId: string;
  status: AgentStatus;
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
  startedAt: number;
  completedAt?: number;
  duration?: number;
  findings: AgentFinding[];
  metadata?: Record<string, unknown>;
}

export interface AgentFinding {
  severity: Severity;
  category: string;
  title: string;
  description: string;
  autoFixed: boolean;
  beforeValue?: string;
  afterValue?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentEvent {
  agentId: string;
  type: "started" | "completed" | "failed" | "task_completed" | "task_failed" | "finding" | "heartbeat";
  timestamp: number;
  data?: unknown;
}

// ---------------------------------------------------------------------------
// Agent Store Interface (pluggable persistence)
// ---------------------------------------------------------------------------

export interface AgentStore {
  /** Save/update an agent run */
  saveRun(run: AgentRun): Promise<void>;
  /** Get the latest run for an agent */
  getLatestRun(agentId: string): Promise<AgentRun | null>;
  /** Get run history for an agent */
  getRunHistory(agentId: string, limit?: number): Promise<AgentRun[]>;
  /** Save a task */
  saveTask(task: Task): Promise<void>;
  /** Get pending tasks for an agent */
  getPendingTasks(agentId: string, limit?: number): Promise<Task[]>;
  /** Save agent config */
  saveConfig(config: AgentConfig): Promise<void>;
  /** Get agent config */
  getConfig(agentId: string): Promise<AgentConfig | null>;
  /** List all registered agents */
  listAgents(): Promise<AgentConfig[]>;
}

// ---------------------------------------------------------------------------
// Event Bus (in-memory, can be replaced with Redis PubSub, etc.)
// ---------------------------------------------------------------------------

type EventListener = (event: AgentEvent) => void;
const globalListeners = new Set<EventListener>();

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

export abstract class BaseAgent<TInput = unknown, TOutput = unknown> {
  readonly config: AgentConfig;
  protected store: AgentStore;
  private _status: AgentStatus = "idle";
  private _currentRun: AgentRun | null = null;

  constructor(config: AgentConfig, store: AgentStore) {
    this.config = config;
    this.store = store;
  }

  get status(): AgentStatus {
    return this._status;
  }

  get currentRun(): AgentRun | null {
    return this._currentRun;
  }

  // ── Abstract methods (implement per agent) ──

  /** Process a single task. Return output + confidence score. */
  protected abstract execute(
    input: TInput,
    context: TaskContext
  ): Promise<{ output: TOutput; confidence: number; findings?: AgentFinding[] }>;

  /** Optional: Initialize agent resources (DB tables, connections, etc.) */
  protected async initialize(): Promise<void> {}

  /** Optional: Cleanup agent resources */
  protected async cleanup(): Promise<void> {}

  /** Optional: Determine what tasks need to be run (for scheduled agents) */
  protected async discoverTasks(): Promise<TInput[]> {
    return [];
  }

  // ── Public API ──

  /**
   * Run a single task immediately.
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
   * Run a full agent cycle: discover tasks → execute all → report.
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

      // Retry logic
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
// Task Context (passed to execute())
// ---------------------------------------------------------------------------

export interface TaskContext {
  taskId: string;
  agentId: string;
  retryCount: number;
  model?: string;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Task timed out after ${ms}ms`)), ms)
    ),
  ]);
}
