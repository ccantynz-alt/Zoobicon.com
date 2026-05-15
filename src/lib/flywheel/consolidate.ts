/**
 * Flywheel consolidation — KILLER-MOVES-BUILDER.md #B27.
 *
 * Craig (May 14): "We also need to think how can we be really
 * intelligent about that information we receive."
 *
 * Raw events in `flywheel_events` are too noisy to read directly. This
 * module rolls them into HIGHER-LEVEL MEMORIES that the planner +
 * customiser + admin dashboard can act on:
 *
 *   - Industry preferences: "SaaS analytics customers pick the bento
 *     features layout 73% of the time" — feed back into planner
 *   - Prompt patterns that score well: "Prompts starting with 'modern
 *     [X] for [Y]' tend to score 88+" — surface to copy critic
 *   - Failing prompt patterns: "Restaurant-themed prompts regenerated
 *     2.3× on average" — opportunity to ship better restaurant
 *     hero variants
 *   - Time-to-deploy trending: "Average dropped from 47s → 23s over
 *     last 90 days" — proof the flywheel works
 *   - Cost-per-successful-deploy: "$0.045 → $0.018 over 90 days" —
 *     same compounding evidence in dollars
 *
 * Storage: `flywheel_memories` table. One row per derived insight.
 * Refreshed nightly by /api/cron/flywheel-consolidate.
 *
 * Read-side: getPlannerMemories(industry) returns the consolidated
 * preferences the planner injects into its system prompt — turning
 * raw user behaviour into measurable platform improvement.
 */

import { sql } from "@/lib/db";

export type MemoryKind =
  | "industry-component-preference"
  | "prompt-pattern-high-quality"
  | "prompt-pattern-needs-help"
  | "session-funnel-stat"
  | "cost-trend";

export interface FlywheelMemory {
  kind: MemoryKind;
  /** What this memory is about — industry, prompt-pattern, etc.
   *  Multiple rows can share a subject (e.g., several preferences for
   *  the "saas" subject). */
  subject: string;
  content: Record<string, unknown>;
  /** Number of source events this memory was derived from — higher
   *  = more trustworthy. */
  sampleSize: number;
  /** ISO date this memory was consolidated. */
  consolidatedAt: string;
}

// ───────────────────────────────────────────────────────────────────────
// Consolidation passes — each returns 0..N memories
// ───────────────────────────────────────────────────────────────────────

/**
 * For each (industry, component) tuple, compute the fraction of
 * successful builds in this industry that used this component. Above-
 * 50% means "default for this industry."
 */
async function consolidateIndustryPreferences(): Promise<FlywheelMemory[]> {
  try {
    const rows = await sql<{
      industry: string;
      component_id: string;
      uses: string;
      industry_total: string;
    }>`
      WITH industry_totals AS (
        SELECT industry, COUNT(*)::text AS total
        FROM flywheel_successful_builds
        WHERE quality_score >= 70
          AND created_at >= NOW() - INTERVAL '60 days'
        GROUP BY industry
      )
      SELECT b.industry, b.component_id,
             COUNT(*)::text AS uses,
             (SELECT total FROM industry_totals t WHERE t.industry = b.industry) AS industry_total
      FROM flywheel_successful_builds b
      WHERE quality_score >= 70
        AND created_at >= NOW() - INTERVAL '60 days'
      GROUP BY b.industry, b.component_id
      HAVING COUNT(*) >= 5
      ORDER BY b.industry, uses DESC
    `;

    const result: FlywheelMemory[] = [];
    const now = new Date().toISOString();
    for (const r of rows) {
      const uses = Number(r.uses);
      const total = Number(r.industry_total);
      if (total === 0) continue;
      const share = uses / total;
      if (share < 0.3) continue; // not informative below 30%
      result.push({
        kind: "industry-component-preference",
        subject: r.industry,
        content: {
          componentId: r.component_id,
          uses,
          industryTotal: total,
          sharePercent: Math.round(share * 100),
        },
        sampleSize: uses,
        consolidatedAt: now,
      });
    }
    return result;
  } catch (err) {
    console.warn("[flywheel/consolidate] industry preferences failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Find prompt phrasings that correlate with high quality scores.
 * Uses simple n-gram extraction on normalised prompts. Returns top
 * patterns where the average quality >= 85.
 */
async function consolidateHighQualityPatterns(): Promise<FlywheelMemory[]> {
  try {
    const rows = await sql<{
      normalised_prompt: string;
      quality_score: number;
    }>`
      SELECT normalised_prompt, quality_score
      FROM flywheel_successful_builds
      WHERE quality_score >= 70
        AND created_at >= NOW() - INTERVAL '60 days'
      LIMIT 5000
    `;

    // Extract bigrams + trigrams. For each n-gram, track the quality
    // distribution. High-quality patterns: avg >= 85 with sample >= 10.
    const gramStats = new Map<string, { count: number; totalQuality: number }>();
    for (const r of rows) {
      const tokens = r.normalised_prompt.split(/\s+/).filter((t) => t.length >= 3);
      const grams = new Set<string>();
      for (let i = 0; i < tokens.length - 1; i++) {
        grams.add(`${tokens[i]} ${tokens[i + 1]}`);
        if (i < tokens.length - 2) {
          grams.add(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
        }
      }
      for (const g of grams) {
        const cur = gramStats.get(g) || { count: 0, totalQuality: 0 };
        cur.count += 1;
        cur.totalQuality += r.quality_score;
        gramStats.set(g, cur);
      }
    }

    const result: FlywheelMemory[] = [];
    const now = new Date().toISOString();
    for (const [pattern, stat] of gramStats.entries()) {
      if (stat.count < 10) continue;
      const avgQ = stat.totalQuality / stat.count;
      if (avgQ < 85) continue;
      result.push({
        kind: "prompt-pattern-high-quality",
        subject: pattern,
        content: { count: stat.count, avgQuality: Math.round(avgQ) },
        sampleSize: stat.count,
        consolidatedAt: now,
      });
    }
    result.sort((a, b) => (b.content.avgQuality as number) - (a.content.avgQuality as number));
    return result.slice(0, 50); // top 50 patterns only
  } catch (err) {
    console.warn("[flywheel/consolidate] quality patterns failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Funnel stats — how often does a session that submits a prompt end
 * up deploying? Trending these tells us if the platform is getting
 * stickier over time.
 */
async function consolidateSessionFunnel(): Promise<FlywheelMemory[]> {
  try {
    const rows = await sql<{
      submit_sessions: string;
      regen_sessions: string;
      deploy_sessions: string;
      avg_builds: string;
    }>`
      WITH per_session AS (
        SELECT session_id,
               BOOL_OR(type = 'prompt_submit') AS submitted,
               BOOL_OR(type = 'regenerate') AS regenerated,
               BOOL_OR(type = 'deploy') AS deployed,
               COUNT(*) FILTER (WHERE type = 'prompt_submit') AS build_count
        FROM flywheel_events
        WHERE session_id IS NOT NULL
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY session_id
      )
      SELECT
        COUNT(*) FILTER (WHERE submitted)::text  AS submit_sessions,
        COUNT(*) FILTER (WHERE regenerated)::text AS regen_sessions,
        COUNT(*) FILTER (WHERE deployed)::text    AS deploy_sessions,
        COALESCE(AVG(build_count) FILTER (WHERE submitted), 0)::text AS avg_builds
      FROM per_session
    `;
    if (rows.length === 0) return [];
    const r = rows[0];
    const submit = Number(r.submit_sessions);
    if (submit === 0) return [];
    return [
      {
        kind: "session-funnel-stat",
        subject: "rolling-30-day",
        content: {
          submitSessions: submit,
          regenerateSessions: Number(r.regen_sessions),
          deploySessions: Number(r.deploy_sessions),
          submitToDeployRate: Math.round((Number(r.deploy_sessions) / submit) * 100),
          regenerateRate: Math.round((Number(r.regen_sessions) / submit) * 100),
          avgBuildsPerSession: Math.round(Number(r.avg_builds) * 10) / 10,
        },
        sampleSize: submit,
        consolidatedAt: new Date().toISOString(),
      },
    ];
  } catch (err) {
    console.warn("[flywheel/consolidate] funnel stats failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Cost trend — average cost per successful build over rolling windows.
 * The hypothesis: as the flywheel matures + cache hit rate rises, this
 * number TRENDS DOWN. Plot it on /admin/builds and you can see the
 * compounding moat in dollars.
 */
async function consolidateCostTrend(): Promise<FlywheelMemory[]> {
  try {
    const rows = await sql<{
      window_start: string;
      avg_duration_ms: string;
      build_count: string;
    }>`
      SELECT
        DATE_TRUNC('day', created_at)::text AS window_start,
        AVG(total_duration_ms)::text AS avg_duration_ms,
        COUNT(*)::text AS build_count
      FROM builds
      WHERE ok = true
        AND created_at >= NOW() - INTERVAL '60 days'
      GROUP BY window_start
      ORDER BY window_start ASC
    `;
    return [
      {
        kind: "cost-trend",
        subject: "daily-rolling-60",
        content: {
          series: rows.map((r) => ({
            day: r.window_start,
            avgDurationMs: Math.round(Number(r.avg_duration_ms)),
            buildCount: Number(r.build_count),
          })),
        },
        sampleSize: rows.reduce((s, r) => s + Number(r.build_count), 0),
        consolidatedAt: new Date().toISOString(),
      },
    ];
  } catch (err) {
    console.warn("[flywheel/consolidate] cost trend failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────
// Top-level consolidation entry — runs all passes + persists memories
// ───────────────────────────────────────────────────────────────────────

export interface ConsolidationResult {
  generated: number;
  byKind: Record<MemoryKind, number>;
  errors: string[];
}

export async function runConsolidation(): Promise<ConsolidationResult> {
  const [industry, patterns, funnel, cost] = await Promise.all([
    consolidateIndustryPreferences(),
    consolidateHighQualityPatterns(),
    consolidateSessionFunnel(),
    consolidateCostTrend(),
  ]);

  const all = [...industry, ...patterns, ...funnel, ...cost];
  const errors: string[] = [];

  // Wipe yesterday's memories of these kinds (they're snapshots, not
  // accumulating). Then insert fresh ones.
  try {
    await sql`
      DELETE FROM flywheel_memories
      WHERE kind = ANY(${["industry-component-preference", "prompt-pattern-high-quality", "session-funnel-stat", "cost-trend"]})
    `;
  } catch (err) {
    errors.push(`wipe: ${err instanceof Error ? err.message : err}`);
  }

  for (const memory of all) {
    try {
      await sql`
        INSERT INTO flywheel_memories (kind, subject, content, sample_size, consolidated_at)
        VALUES (${memory.kind}, ${memory.subject}, ${JSON.stringify(memory.content)}::jsonb, ${memory.sampleSize}, ${memory.consolidatedAt})
      `;
    } catch (err) {
      errors.push(`insert ${memory.kind}/${memory.subject}: ${err instanceof Error ? err.message : err}`);
    }
  }

  const byKind = {
    "industry-component-preference": industry.length,
    "prompt-pattern-high-quality": patterns.length,
    "prompt-pattern-needs-help": 0,
    "session-funnel-stat": funnel.length,
    "cost-trend": cost.length,
  } as Record<MemoryKind, number>;

  return { generated: all.length, byKind, errors };
}

// ───────────────────────────────────────────────────────────────────────
// Read side — what the planner / customiser / dashboard consume
// ───────────────────────────────────────────────────────────────────────

/**
 * Top component preferences for a given industry — feeds into the
 * planner's component-pick step. If 70% of restaurant builds use
 * hero-restaurant-warm, the planner can default to it.
 */
export async function getIndustryPreferences(industry: string): Promise<
  Array<{ componentId: string; sharePercent: number; uses: number }>
> {
  try {
    const rows = await sql<{ content: Record<string, unknown> }>`
      SELECT content
      FROM flywheel_memories
      WHERE kind = 'industry-component-preference'
        AND subject = ${industry}
      ORDER BY (content->>'sharePercent')::int DESC
      LIMIT 20
    `;
    return rows.map((r) => ({
      componentId: String(r.content.componentId),
      sharePercent: Number(r.content.sharePercent),
      uses: Number(r.content.uses),
    }));
  } catch (err) {
    console.warn("[flywheel/consolidate] getIndustryPreferences failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function getLatestSessionFunnel(): Promise<{
  submitSessions: number;
  deploySessions: number;
  submitToDeployRate: number;
  regenerateRate: number;
  avgBuildsPerSession: number;
} | null> {
  try {
    const rows = await sql<{ content: Record<string, unknown> }>`
      SELECT content FROM flywheel_memories
      WHERE kind = 'session-funnel-stat' AND subject = 'rolling-30-day'
      ORDER BY consolidated_at DESC LIMIT 1
    `;
    if (rows.length === 0) return null;
    const c = rows[0].content;
    return {
      submitSessions: Number(c.submitSessions),
      deploySessions: Number(c.deploySessions),
      submitToDeployRate: Number(c.submitToDeployRate),
      regenerateRate: Number(c.regenerateRate),
      avgBuildsPerSession: Number(c.avgBuildsPerSession),
    };
  } catch {
    return null;
  }
}

export async function getCostTrendSeries(): Promise<Array<{ day: string; avgDurationMs: number; buildCount: number }>> {
  try {
    const rows = await sql<{ content: Record<string, unknown> }>`
      SELECT content FROM flywheel_memories
      WHERE kind = 'cost-trend' AND subject = 'daily-rolling-60'
      ORDER BY consolidated_at DESC LIMIT 1
    `;
    if (rows.length === 0) return [];
    const series = rows[0].content.series as Array<{ day: string; avgDurationMs: number; buildCount: number }>;
    return Array.isArray(series) ? series : [];
  } catch {
    return [];
  }
}

export async function getTopQualityPatterns(limit = 20): Promise<
  Array<{ pattern: string; avgQuality: number; count: number }>
> {
  try {
    const rows = await sql<{ subject: string; content: Record<string, unknown>; sample_size: number }>`
      SELECT subject, content, sample_size
      FROM flywheel_memories
      WHERE kind = 'prompt-pattern-high-quality'
      ORDER BY (content->>'avgQuality')::int DESC
      LIMIT ${limit}
    `;
    return rows.map((r) => ({
      pattern: r.subject,
      avgQuality: Number(r.content.avgQuality),
      count: Number(r.content.count),
    }));
  } catch {
    return [];
  }
}
