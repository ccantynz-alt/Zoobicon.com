/**
 * @zoobicon/agents — Storage Backends
 *
 * Two built-in implementations of the AgentStore interface:
 *
 * - **InMemoryAgentStore** — Zero dependencies, perfect for testing, prototypes,
 *   and agents that don't need persistence across restarts.
 *
 * - **PostgresAgentStore** — Production-grade persistence for Postgres (Neon,
 *   Supabase, or any Postgres). Accepts a SQL tagged-template function in the
 *   constructor so there's no hard dependency on any specific driver.
 *
 * @module @zoobicon/agents
 */

import type { AgentStore, AgentRun, AgentConfig, Task } from "./base";

// ---------------------------------------------------------------------------
// In-Memory Store
// ---------------------------------------------------------------------------

/**
 * In-memory implementation of AgentStore.
 *
 * All data is lost when the process exits. Great for:
 * - Unit tests
 * - CLI tools
 * - Agents that don't need history
 * - Quick prototyping
 *
 * @example
 * ```typescript
 * import { InMemoryAgentStore, createAgent } from "@zoobicon/agents";
 *
 * const store = new InMemoryAgentStore();
 * const agent = createAgent({ id: "test", name: "Test", store, ... });
 * ```
 */
export class InMemoryAgentStore implements AgentStore {
  private runs = new Map<string, AgentRun[]>();
  private tasks = new Map<string, Task[]>();
  private configs = new Map<string, AgentConfig>();

  async saveRun(run: AgentRun): Promise<void> {
    const agentRuns = this.runs.get(run.agentId) || [];
    const idx = agentRuns.findIndex((r) => r.id === run.id);
    if (idx >= 0) agentRuns[idx] = run;
    else agentRuns.push(run);
    this.runs.set(run.agentId, agentRuns);
  }

  async getLatestRun(agentId: string): Promise<AgentRun | null> {
    const agentRuns = this.runs.get(agentId) || [];
    return agentRuns.sort((a, b) => b.startedAt - a.startedAt)[0] || null;
  }

  async getRunHistory(agentId: string, limit = 20): Promise<AgentRun[]> {
    return (this.runs.get(agentId) || [])
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, limit);
  }

  async saveTask(task: Task): Promise<void> {
    const agentTasks = this.tasks.get(task.agentId) || [];
    const idx = agentTasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) agentTasks[idx] = task;
    else agentTasks.push(task);
    this.tasks.set(task.agentId, agentTasks);
  }

  async getPendingTasks(agentId: string, limit = 10): Promise<Task[]> {
    return (this.tasks.get(agentId) || [])
      .filter((t) => t.status === "pending")
      .slice(0, limit);
  }

  async saveConfig(config: AgentConfig): Promise<void> {
    this.configs.set(config.id, config);
  }

  async getConfig(agentId: string): Promise<AgentConfig | null> {
    return this.configs.get(agentId) || null;
  }

  async listAgents(): Promise<AgentConfig[]> {
    return Array.from(this.configs.values());
  }
}

// ---------------------------------------------------------------------------
// Postgres Store
// ---------------------------------------------------------------------------

/**
 * SQL query function type.
 *
 * Must accept a tagged template literal and return an array of row objects.
 * Compatible with `@neondatabase/serverless`, `postgres`, `@vercel/postgres`, etc.
 */
export type SqlFunction = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

/**
 * Production Postgres implementation of AgentStore.
 *
 * Auto-creates tables on first use (idempotent). Accepts any SQL tagged-template
 * function so you're not locked into a specific Postgres driver.
 *
 * @example
 * ```typescript
 * import { neon } from "@neondatabase/serverless";
 * import { PostgresAgentStore, createAgent } from "@zoobicon/agents";
 *
 * const sql = neon(process.env.DATABASE_URL!);
 * const store = new PostgresAgentStore(sql);
 *
 * const agent = createAgent({ id: "monitor", name: "Monitor", store, ... });
 * ```
 */
export class PostgresAgentStore implements AgentStore {
  private sql: SqlFunction;
  private tablesCreated = false;

  constructor(sql: SqlFunction) {
    this.sql = sql;
  }

  private async ensureTables(): Promise<void> {
    if (this.tablesCreated) return;

    await this.sql`
      CREATE TABLE IF NOT EXISTS agent_configs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        version TEXT DEFAULT '1.0.0',
        auto_execute BOOLEAN DEFAULT false,
        confidence_threshold REAL DEFAULT 0.85,
        schedule_interval_sec INT DEFAULT 0,
        max_concurrency INT DEFAULT 1,
        max_retries INT DEFAULT 3,
        retry_base_delay_ms INT DEFAULT 1000,
        task_timeout_ms INT DEFAULT 300000,
        model TEXT,
        settings JSONB DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await this.sql`
      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'running',
        tasks_total INT DEFAULT 0,
        tasks_completed INT DEFAULT 0,
        tasks_failed INT DEFAULT 0,
        started_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ,
        duration INT,
        findings JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await this.sql`
      CREATE TABLE IF NOT EXISTS agent_tasks (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        input JSONB,
        output JSONB,
        error TEXT,
        confidence REAL,
        retry_count INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        metadata JSONB DEFAULT '{}'
      )
    `;

    await this.sql`CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_id ON agent_runs(agent_id, started_at DESC)`;
    await this.sql`CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON agent_tasks(agent_id, status)`;

    this.tablesCreated = true;
  }

  async saveRun(run: AgentRun): Promise<void> {
    await this.ensureTables();
    await this.sql`
      INSERT INTO agent_runs (id, agent_id, status, tasks_total, tasks_completed, tasks_failed,
        started_at, completed_at, duration, findings, metadata)
      VALUES (
        ${run.id}, ${run.agentId}, ${run.status}, ${run.tasksTotal},
        ${run.tasksCompleted}, ${run.tasksFailed},
        ${new Date(run.startedAt).toISOString()},
        ${run.completedAt ? new Date(run.completedAt).toISOString() : null},
        ${run.duration || null},
        ${JSON.stringify(run.findings)},
        ${JSON.stringify(run.metadata || {})}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_failed = EXCLUDED.tasks_failed,
        completed_at = EXCLUDED.completed_at,
        duration = EXCLUDED.duration,
        findings = EXCLUDED.findings,
        metadata = EXCLUDED.metadata
    `;
  }

  async getLatestRun(agentId: string): Promise<AgentRun | null> {
    await this.ensureTables();
    const rows = await this.sql`
      SELECT * FROM agent_runs WHERE agent_id = ${agentId}
      ORDER BY started_at DESC LIMIT 1
    `;
    if (rows.length === 0) return null;
    return rowToRun(rows[0]);
  }

  async getRunHistory(agentId: string, limit = 20): Promise<AgentRun[]> {
    await this.ensureTables();
    const rows = await this.sql`
      SELECT * FROM agent_runs WHERE agent_id = ${agentId}
      ORDER BY started_at DESC LIMIT ${limit}
    `;
    return rows.map(rowToRun);
  }

  async saveTask(task: Task): Promise<void> {
    await this.ensureTables();
    await this.sql`
      INSERT INTO agent_tasks (id, agent_id, status, input, output, error, confidence,
        retry_count, created_at, started_at, completed_at, metadata)
      VALUES (
        ${task.id}, ${task.agentId}, ${task.status},
        ${JSON.stringify(task.input)}, ${task.output ? JSON.stringify(task.output) : null},
        ${task.error || null}, ${task.confidence || null},
        ${task.retryCount},
        ${new Date(task.createdAt).toISOString()},
        ${task.startedAt ? new Date(task.startedAt).toISOString() : null},
        ${task.completedAt ? new Date(task.completedAt).toISOString() : null},
        ${JSON.stringify(task.metadata || {})}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        output = EXCLUDED.output,
        error = EXCLUDED.error,
        confidence = EXCLUDED.confidence,
        retry_count = EXCLUDED.retry_count,
        started_at = EXCLUDED.started_at,
        completed_at = EXCLUDED.completed_at,
        metadata = EXCLUDED.metadata
    `;
  }

  async getPendingTasks(agentId: string, limit = 10): Promise<Task[]> {
    await this.ensureTables();
    const rows = await this.sql`
      SELECT * FROM agent_tasks
      WHERE agent_id = ${agentId} AND status = 'pending'
      ORDER BY created_at ASC LIMIT ${limit}
    `;
    return rows.map(rowToTask);
  }

  async saveConfig(config: AgentConfig): Promise<void> {
    await this.ensureTables();
    await this.sql`
      INSERT INTO agent_configs (id, name, description, version, auto_execute,
        confidence_threshold, schedule_interval_sec, max_concurrency, max_retries,
        retry_base_delay_ms, task_timeout_ms, model, settings, tags, updated_at)
      VALUES (
        ${config.id}, ${config.name}, ${config.description}, ${config.version},
        ${config.autoExecute}, ${config.confidenceThreshold},
        ${config.scheduleIntervalSec}, ${config.maxConcurrency},
        ${config.maxRetries}, ${config.retryBaseDelayMs},
        ${config.taskTimeoutMs}, ${config.model || null},
        ${JSON.stringify(config.settings)}, ${config.tags}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        version = EXCLUDED.version,
        auto_execute = EXCLUDED.auto_execute,
        confidence_threshold = EXCLUDED.confidence_threshold,
        schedule_interval_sec = EXCLUDED.schedule_interval_sec,
        max_concurrency = EXCLUDED.max_concurrency,
        max_retries = EXCLUDED.max_retries,
        retry_base_delay_ms = EXCLUDED.retry_base_delay_ms,
        task_timeout_ms = EXCLUDED.task_timeout_ms,
        model = EXCLUDED.model,
        settings = EXCLUDED.settings,
        tags = EXCLUDED.tags,
        updated_at = NOW()
    `;
  }

  async getConfig(agentId: string): Promise<AgentConfig | null> {
    await this.ensureTables();
    const rows = await this.sql`SELECT * FROM agent_configs WHERE id = ${agentId}`;
    if (rows.length === 0) return null;
    return rowToConfig(rows[0]);
  }

  async listAgents(): Promise<AgentConfig[]> {
    await this.ensureTables();
    const rows = await this.sql`SELECT * FROM agent_configs WHERE enabled = true ORDER BY name`;
    return rows.map(rowToConfig);
  }
}

// ---------------------------------------------------------------------------
// Row mappers
// ---------------------------------------------------------------------------

function rowToRun(row: Record<string, unknown>): AgentRun {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    status: row.status as AgentRun["status"],
    tasksTotal: row.tasks_total as number,
    tasksCompleted: row.tasks_completed as number,
    tasksFailed: row.tasks_failed as number,
    startedAt: new Date(row.started_at as string).getTime(),
    completedAt: row.completed_at ? new Date(row.completed_at as string).getTime() : undefined,
    duration: (row.duration as number) || undefined,
    findings: (row.findings as AgentRun["findings"]) || [],
    metadata: (row.metadata as Record<string, unknown>) || undefined,
  };
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    agentId: row.agent_id as string,
    status: row.status as Task["status"],
    input: row.input,
    output: row.output || undefined,
    error: (row.error as string) || undefined,
    confidence: (row.confidence as number) || undefined,
    retryCount: row.retry_count as number,
    createdAt: new Date(row.created_at as string).getTime(),
    startedAt: row.started_at ? new Date(row.started_at as string).getTime() : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at as string).getTime() : undefined,
    metadata: (row.metadata as Record<string, unknown>) || undefined,
  };
}

function rowToConfig(row: Record<string, unknown>): AgentConfig {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    version: (row.version as string) || "1.0.0",
    autoExecute: row.auto_execute as boolean,
    confidenceThreshold: row.confidence_threshold as number,
    scheduleIntervalSec: row.schedule_interval_sec as number,
    maxConcurrency: row.max_concurrency as number,
    maxRetries: row.max_retries as number,
    retryBaseDelayMs: row.retry_base_delay_ms as number,
    taskTimeoutMs: row.task_timeout_ms as number,
    model: (row.model as string) || undefined,
    settings: (row.settings as Record<string, unknown>) || {},
    tags: (row.tags as string[]) || [],
  };
}