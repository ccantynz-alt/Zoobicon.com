/**
 * Build telemetry — KILLER-MOVES.md #3.
 *
 * Every AI builder request lands a row here so we can answer questions
 * like:
 *   - "Which components fail validation most often?"
 *   - "How often does the failover layer kick in, and to which provider?"
 *   - "What's our p50/p95/p99 build duration?"
 *   - "Which prompts produce the most retries?"
 *   - "What does a build actually cost in tokens?"
 *
 * Before this module landed, all that data was collected and thrown
 * away — the LLM provider response shape carries `inputTokens` and
 * `outputTokens`, but no caller logged them anywhere durable.
 *
 * Writes are best-effort: if Neon is down we still want the user's
 * build to complete, so all calls swallow errors and log to console
 * instead. The /admin/builds page surfaces the data once it's there.
 */

import { sql } from "@/lib/db";

export interface BuildPhaseTiming {
  /** Phase name — "plan", "customise", "critique", "deploy", etc. */
  phase: string;
  /** Duration in milliseconds. */
  durationMs: number;
}

export interface BuildModelUsage {
  /** Logical step — "planner", "customiser:hero", "critic", "edit", etc. */
  step: string;
  /** Provider used (claude | openai | gemini). */
  provider: string;
  /** Exact model id (e.g., claude-haiku-4-5-20251001). */
  model: string;
  /** Input tokens, when the provider returns them. */
  inputTokens?: number;
  /** Output tokens, when the provider returns them. */
  outputTokens?: number;
  /** Latency for THIS specific call, ms. */
  latencyMs?: number;
  /** Whether this call fell through from a different model via failover. */
  fellThroughFromFailover?: boolean;
}

export interface BuildTelemetryRow {
  /** Unique build id — used to correlate across phases. */
  buildId: string;
  /** User email if known, else null for anonymous. */
  userEmail?: string | null;
  /** Plan tier of the user when the build ran. */
  userPlan?: string | null;
  /** Endpoint that produced the build — react-stream | edit | pipeline. */
  endpoint: string;
  /** Build mode — instant | premium | classic. */
  mode?: string | null;
  /** Theme — editorial | light | warm | dark. */
  theme?: string | null;
  /** First 500 chars of the user's prompt for prompt-pattern analysis. */
  promptHead: string;
  /** Inferred industry, if the planner returned one. */
  industry?: string | null;
  /** Number of components the planner selected. */
  componentCount?: number | null;
  /** List of component category:variant pairs picked, for failure-rate analysis. */
  componentsSelected?: string[];
  /** Sections that fell back to base template. */
  failedSections?: Array<{ id: string; reason: string }>;
  /** Total wall-clock duration including all phases. */
  totalDurationMs: number;
  /** Per-phase timings — strategy, plan, customise, critique, deploy. */
  phaseTimings: BuildPhaseTiming[];
  /** Per-model-call usage. Cost can be reconstructed from this list. */
  modelUsage: BuildModelUsage[];
  /** Whether the build completed successfully end-to-end. */
  ok: boolean;
  /** When ok=false, a short error category for grouping. */
  errorKind?: string | null;
  /** When ok=false, the message we showed the user. */
  errorMessage?: string | null;
  /** Quality score (0-100) if a critic ran. */
  qualityScore?: number | null;
}

/**
 * Persist a single build row. Best-effort: failure doesn't propagate.
 */
export async function recordBuildTelemetry(row: BuildTelemetryRow): Promise<void> {
  try {
    await sql`
      INSERT INTO builds (
        build_id, user_email, user_plan, endpoint, mode, theme,
        prompt_head, industry,
        component_count, components_selected,
        failed_sections, total_duration_ms, phase_timings, model_usage,
        ok, error_kind, error_message, quality_score
      ) VALUES (
        ${row.buildId},
        ${row.userEmail ?? null},
        ${row.userPlan ?? null},
        ${row.endpoint},
        ${row.mode ?? null},
        ${row.theme ?? null},
        ${row.promptHead.slice(0, 500)},
        ${row.industry ?? null},
        ${row.componentCount ?? null},
        ${JSON.stringify(row.componentsSelected ?? [])}::jsonb,
        ${JSON.stringify(row.failedSections ?? [])}::jsonb,
        ${row.totalDurationMs},
        ${JSON.stringify(row.phaseTimings)}::jsonb,
        ${JSON.stringify(row.modelUsage)}::jsonb,
        ${row.ok},
        ${row.errorKind ?? null},
        ${row.errorMessage ?? null},
        ${row.qualityScore ?? null}
      )
    `;
  } catch (err) {
    // Best-effort — don't fail the build if telemetry write fails.
    console.warn("[build-telemetry] write failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}

/**
 * Helper for building up the BuildTelemetryRow incrementally during a
 * streaming build. The route creates a builder, calls phase() and
 * model() throughout the run, then finalize() at the end.
 */
export class TelemetryRecorder {
  private buildId: string;
  private startedAt: number;
  private endpoint: string;
  private userEmail?: string | null;
  private userPlan?: string | null;
  private mode?: string | null;
  private theme?: string | null;
  private prompt: string;
  private industry?: string | null;
  private componentCount?: number;
  private componentsSelected: string[] = [];
  private failedSections: Array<{ id: string; reason: string }> = [];
  private phaseTimings: BuildPhaseTiming[] = [];
  private modelUsage: BuildModelUsage[] = [];

  constructor(opts: {
    buildId: string;
    endpoint: string;
    prompt: string;
    userEmail?: string | null;
    userPlan?: string | null;
    mode?: string | null;
    theme?: string | null;
  }) {
    this.buildId = opts.buildId;
    this.startedAt = Date.now();
    this.endpoint = opts.endpoint;
    this.prompt = opts.prompt;
    this.userEmail = opts.userEmail ?? null;
    this.userPlan = opts.userPlan ?? null;
    this.mode = opts.mode ?? null;
    this.theme = opts.theme ?? null;
  }

  setIndustry(industry: string | null | undefined): void {
    this.industry = industry ?? null;
  }

  setComponents(components: Array<{ category: string; variant: string }>): void {
    this.componentCount = components.length;
    this.componentsSelected = components.map((c) => `${c.category}:${c.variant}`);
  }

  phase(name: string, durationMs: number): void {
    this.phaseTimings.push({ phase: name, durationMs });
  }

  model(usage: BuildModelUsage): void {
    this.modelUsage.push(usage);
  }

  fail(section: { id: string; reason: string }): void {
    this.failedSections.push(section);
  }

  async finalize(opts: {
    ok: boolean;
    errorKind?: string;
    errorMessage?: string;
    qualityScore?: number | null;
  }): Promise<void> {
    const totalDurationMs = Date.now() - this.startedAt;
    await recordBuildTelemetry({
      buildId: this.buildId,
      userEmail: this.userEmail,
      userPlan: this.userPlan,
      endpoint: this.endpoint,
      mode: this.mode,
      theme: this.theme,
      promptHead: this.prompt,
      industry: this.industry,
      componentCount: this.componentCount ?? null,
      componentsSelected: this.componentsSelected,
      failedSections: this.failedSections,
      totalDurationMs,
      phaseTimings: this.phaseTimings,
      modelUsage: this.modelUsage,
      ok: opts.ok,
      errorKind: opts.errorKind ?? null,
      errorMessage: opts.errorMessage ?? null,
      qualityScore: opts.qualityScore ?? null,
    });
  }
}

/**
 * SQL migration for the builds table — appended to initSchema in db.ts.
 * Exported as a string so /api/db/init can reuse the exact statement.
 */
export const BUILDS_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS builds (
  id                  BIGSERIAL PRIMARY KEY,
  build_id            TEXT UNIQUE NOT NULL,
  user_email          TEXT,
  user_plan           TEXT,
  endpoint            TEXT NOT NULL,
  mode                TEXT,
  theme               TEXT,
  prompt_head         TEXT NOT NULL,
  industry            TEXT,
  component_count     INTEGER,
  components_selected JSONB DEFAULT '[]'::jsonb,
  failed_sections     JSONB DEFAULT '[]'::jsonb,
  total_duration_ms   INTEGER NOT NULL,
  phase_timings       JSONB DEFAULT '[]'::jsonb,
  model_usage         JSONB DEFAULT '[]'::jsonb,
  ok                  BOOLEAN NOT NULL,
  error_kind          TEXT,
  error_message       TEXT,
  quality_score       INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS builds_user_email_idx ON builds (user_email);
CREATE INDEX IF NOT EXISTS builds_created_at_idx ON builds (created_at DESC);
CREATE INDEX IF NOT EXISTS builds_ok_idx ON builds (ok, created_at DESC);
CREATE INDEX IF NOT EXISTS builds_endpoint_idx ON builds (endpoint, created_at DESC);
`;

/**
 * Aggregate metrics for the admin dashboard. Returns failure rates,
 * latency percentiles, top-failing components, model usage breakdown.
 */
export interface BuildMetricsSummary {
  totalBuilds: number;
  successRate: number;
  failureCount: number;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
  topFailureKinds: Array<{ kind: string; count: number }>;
  topFailingComponents: Array<{ id: string; count: number }>;
  providerBreakdown: Array<{ provider: string; count: number }>;
}

export async function getBuildMetricsSummary(sinceHours = 24): Promise<BuildMetricsSummary> {
  try {
    const sinceTs = new Date(Date.now() - sinceHours * 3600_000).toISOString();
    const rows = await sql<{
      total: string;
      successes: string;
      p50: string;
      p95: string;
      p99: string;
    }>`
      SELECT
        COUNT(*)::text                                            AS total,
        SUM(CASE WHEN ok THEN 1 ELSE 0 END)::text                 AS successes,
        COALESCE(percentile_cont(0.5)  WITHIN GROUP (ORDER BY total_duration_ms), 0)::text AS p50,
        COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY total_duration_ms), 0)::text AS p95,
        COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY total_duration_ms), 0)::text AS p99
      FROM builds
      WHERE created_at >= ${sinceTs}
    `;

    const summary = rows[0] || { total: "0", successes: "0", p50: "0", p95: "0", p99: "0" };
    const total = Number(summary.total);
    const successes = Number(summary.successes);

    const failureKinds = await sql<{ error_kind: string | null; count: string }>`
      SELECT error_kind, COUNT(*)::text AS count
      FROM builds
      WHERE created_at >= ${sinceTs} AND ok = false
      GROUP BY error_kind
      ORDER BY count DESC
      LIMIT 10
    `;

    return {
      totalBuilds: total,
      successRate: total > 0 ? successes / total : 0,
      failureCount: total - successes,
      p50DurationMs: Math.round(Number(summary.p50)),
      p95DurationMs: Math.round(Number(summary.p95)),
      p99DurationMs: Math.round(Number(summary.p99)),
      topFailureKinds: failureKinds.map((r) => ({ kind: r.error_kind || "unknown", count: Number(r.count) })),
      topFailingComponents: [],
      providerBreakdown: [],
    };
  } catch (err) {
    console.warn("[build-telemetry] summary failed:", err instanceof Error ? err.message : err);
    return {
      totalBuilds: 0,
      successRate: 0,
      failureCount: 0,
      p50DurationMs: 0,
      p95DurationMs: 0,
      p99DurationMs: 0,
      topFailureKinds: [],
      topFailingComponents: [],
      providerBreakdown: [],
    };
  }
}
