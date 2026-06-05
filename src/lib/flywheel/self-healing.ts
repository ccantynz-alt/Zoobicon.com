/**
 * Self-healing pipeline — KILLER-MOVES-BUILDER.md #B29.
 *
 * Craig (May 14, driving): "Eventually self hosting self repair once
 * we get enough people using it."
 *
 * First step toward self-repair: detect repeated failure patterns from
 * the telemetry + flywheel events tables and ACT on them automatically:
 *
 *   - Component X is failing validation > 15% in the last 24h → mark
 *     it as quarantined. Planner skips it until a human / next cron
 *     run clears the quarantine.
 *
 *   - Provider Y is failing > 25% in the last hour → drop its priority
 *     in the API bank picker for the next hour.
 *
 *   - Industry Z is regenerating > 4× per session → log a high-priority
 *     "improve this industry's defaults" alert for the next session
 *     to pick up.
 *
 * This module exposes pure functions that compute the verdicts. The
 * cron at /api/cron/self-heal calls them and persists actions to the
 * `self_healing_actions` table.
 */

import { sql } from "@/lib/db";

export type ActionKind =
  | "component-quarantine"
  | "provider-deprioritise"
  | "industry-needs-improvement";

export interface HealingAction {
  kind: ActionKind;
  /** What's being acted on — component id, provider name, industry. */
  subject: string;
  /** Why we took this action (numeric evidence + threshold). */
  reason: string;
  /** When the action should expire and be re-evaluated. */
  activeUntilIso: string;
  /** Sample size — number of observations that triggered the action. */
  sampleSize: number;
}

const QUARANTINE_THRESHOLD_PERCENT = 15;
const QUARANTINE_MIN_OBSERVATIONS = 20;
const QUARANTINE_TTL_HOURS = 12;

const PROVIDER_DEPRIORITISE_THRESHOLD_PERCENT = 25;
const PROVIDER_DEPRIORITISE_MIN_OBSERVATIONS = 30;
const PROVIDER_DEPRIORITISE_TTL_HOURS = 1;

const INDUSTRY_REGENERATE_THRESHOLD = 4.0;
const INDUSTRY_MIN_SESSIONS = 10;
const INDUSTRY_TTL_HOURS = 24;

// ───────────────────────────────────────────────────────────────────────
// Detection passes
// ───────────────────────────────────────────────────────────────────────

/**
 * Component quarantine — components that fail validation OR fall back
 * to base template > 15% of the time in the last 24h get quarantined.
 * The planner skips quarantined components and the registry sweep job
 * downgrades them for human review.
 */
async function detectComponentQuarantine(): Promise<HealingAction[]> {
  try {
    const rows = await sql<{
      component_id: string;
      observations: string;
      failures: string;
    }>`
      WITH per_component AS (
        SELECT
          (section->>'id') AS component_id,
          COUNT(*) FILTER (WHERE TRUE)::text AS observations,
          0::text AS failures_placeholder
        FROM builds, jsonb_array_elements(failed_sections) AS section
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY (section->>'id')
      ),
      per_component_total AS (
        SELECT
          c.component_id,
          c.observations::int AS failures,
          (
            SELECT COUNT(*)
            FROM builds b
            WHERE b.created_at >= NOW() - INTERVAL '24 hours'
              AND b.components_selected @> ('["' || c.component_id || '"]')::jsonb
          ) AS total_uses
        FROM per_component c
      )
      SELECT
        component_id,
        total_uses::text AS observations,
        failures::text AS failures
      FROM per_component_total
      WHERE total_uses >= ${QUARANTINE_MIN_OBSERVATIONS}
    `;
    const actions: HealingAction[] = [];
    const until = new Date(Date.now() + QUARANTINE_TTL_HOURS * 3600_000).toISOString();
    for (const r of rows) {
      const observations = Number(r.observations);
      const failures = Number(r.failures);
      if (observations === 0) continue;
      const failurePercent = (failures / observations) * 100;
      if (failurePercent < QUARANTINE_THRESHOLD_PERCENT) continue;
      actions.push({
        kind: "component-quarantine",
        subject: r.component_id,
        reason: `Failure rate ${failurePercent.toFixed(1)}% over last 24h (${failures}/${observations})`,
        activeUntilIso: until,
        sampleSize: observations,
      });
    }
    return actions;
  } catch (err) {
    console.warn("[self-healing] component-quarantine detection failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Provider deprioritise — when a provider's failure rate is > 25% in
 * the last hour, drop its priority in the API bank picker for the
 * next hour. Healthy providers handle traffic while the bad one
 * recovers.
 */
async function detectProviderDeprioritise(): Promise<HealingAction[]> {
  try {
    const rows = await sql<{
      provider: string;
      ok_count: string;
      fail_count: string;
    }>`
      WITH per_provider AS (
        SELECT
          (model_call->>'provider') AS provider,
          COUNT(*)::text AS total
        FROM builds, jsonb_array_elements(model_usage) AS model_call
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        GROUP BY (model_call->>'provider')
      ),
      per_provider_ok AS (
        SELECT
          (model_call->>'provider') AS provider,
          COUNT(*)::text AS ok_count
        FROM builds, jsonb_array_elements(model_usage) AS model_call
        WHERE created_at >= NOW() - INTERVAL '1 hour'
          AND ok = true
        GROUP BY (model_call->>'provider')
      )
      SELECT
        p.provider,
        COALESCE(o.ok_count, '0') AS ok_count,
        (p.total::int - COALESCE(o.ok_count, '0')::int)::text AS fail_count
      FROM per_provider p
      LEFT JOIN per_provider_ok o ON p.provider = o.provider
    `;
    const actions: HealingAction[] = [];
    const until = new Date(Date.now() + PROVIDER_DEPRIORITISE_TTL_HOURS * 3600_000).toISOString();
    for (const r of rows) {
      if (!r.provider) continue;
      const ok = Number(r.ok_count);
      const fail = Number(r.fail_count);
      const total = ok + fail;
      if (total < PROVIDER_DEPRIORITISE_MIN_OBSERVATIONS) continue;
      const failurePercent = (fail / total) * 100;
      if (failurePercent < PROVIDER_DEPRIORITISE_THRESHOLD_PERCENT) continue;
      actions.push({
        kind: "provider-deprioritise",
        subject: r.provider,
        reason: `Failure rate ${failurePercent.toFixed(1)}% over last hour (${fail}/${total})`,
        activeUntilIso: until,
        sampleSize: total,
      });
    }
    return actions;
  } catch (err) {
    console.warn("[self-healing] provider-deprioritise detection failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Industry needs-improvement — when sessions in industry X average
 * > 4 regenerations per session, the AI is consistently producing
 * output that doesn't match user intent. Log a high-priority alert.
 */
async function detectIndustryNeedsImprovement(): Promise<HealingAction[]> {
  try {
    const rows = await sql<{
      industry: string;
      sessions: string;
      regenerations: string;
    }>`
      WITH session_regens AS (
        SELECT
          e.session_id,
          (
            SELECT b.industry FROM builds b
            WHERE b.build_id = ANY(
              SELECT DISTINCT build_id FROM flywheel_events ev
              WHERE ev.session_id = e.session_id
            )
            LIMIT 1
          ) AS industry,
          COUNT(*) FILTER (WHERE e.type = 'regenerate') AS regen_count
        FROM flywheel_events e
        WHERE e.session_id IS NOT NULL
          AND e.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY e.session_id
      )
      SELECT
        industry,
        COUNT(*)::text AS sessions,
        SUM(regen_count)::text AS regenerations
      FROM session_regens
      WHERE industry IS NOT NULL
      GROUP BY industry
    `;
    const actions: HealingAction[] = [];
    const until = new Date(Date.now() + INDUSTRY_TTL_HOURS * 3600_000).toISOString();
    for (const r of rows) {
      const sessions = Number(r.sessions);
      const regens = Number(r.regenerations);
      if (sessions < INDUSTRY_MIN_SESSIONS) continue;
      const avgRegens = regens / sessions;
      if (avgRegens < INDUSTRY_REGENERATE_THRESHOLD) continue;
      actions.push({
        kind: "industry-needs-improvement",
        subject: r.industry,
        reason: `Avg ${avgRegens.toFixed(1)} regenerations per session over last 7 days (${sessions} sessions)`,
        activeUntilIso: until,
        sampleSize: sessions,
      });
    }
    return actions;
  } catch (err) {
    console.warn("[self-healing] industry-needs-improvement detection failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ───────────────────────────────────────────────────────────────────────
// Top-level run + persist
// ───────────────────────────────────────────────────────────────────────

export interface SelfHealingResult {
  actions: HealingAction[];
  byKind: Record<ActionKind, number>;
}

export async function runSelfHealing(): Promise<SelfHealingResult> {
  const [components, providers, industries] = await Promise.all([
    detectComponentQuarantine(),
    detectProviderDeprioritise(),
    detectIndustryNeedsImprovement(),
  ]);
  const actions = [...components, ...providers, ...industries];

  for (const a of actions) {
    try {
      await sql`
        INSERT INTO self_healing_actions (kind, subject, reason, active_until, sample_size)
        VALUES (${a.kind}, ${a.subject}, ${a.reason}, ${a.activeUntilIso}, ${a.sampleSize})
        ON CONFLICT (kind, subject) DO UPDATE SET
          reason       = EXCLUDED.reason,
          active_until = EXCLUDED.active_until,
          sample_size  = EXCLUDED.sample_size,
          updated_at   = NOW()
      `;
    } catch (err) {
      console.warn("[self-healing] persist failed:", err instanceof Error ? err.message : err);
    }
  }

  // Expire old actions whose TTL has elapsed.
  try {
    await sql`DELETE FROM self_healing_actions WHERE active_until < NOW()`;
  } catch (err) {
    console.warn("[self-healing] expire failed:", err instanceof Error ? err.message : err);
  }

  return {
    actions,
    byKind: {
      "component-quarantine": components.length,
      "provider-deprioritise": providers.length,
      "industry-needs-improvement": industries.length,
    },
  };
}

// ───────────────────────────────────────────────────────────────────────
// Read side — what the planner / api-bank consume
// ───────────────────────────────────────────────────────────────────────

/**
 * Component ids currently under quarantine. The planner filters these
 * out of its candidate list and the slot-stream skips them.
 */
export async function getQuarantinedComponents(): Promise<Set<string>> {
  try {
    const rows = await sql<{ subject: string }>`
      SELECT subject FROM self_healing_actions
      WHERE kind = 'component-quarantine'
        AND active_until > NOW()
    `;
    return new Set(rows.map((r) => r.subject));
  } catch {
    return new Set();
  }
}

/**
 * Providers currently being de-prioritised. The api-bank picker reads
 * this list and drops their priority during scoring.
 */
export async function getDeprioritisedProviders(): Promise<Set<string>> {
  try {
    const rows = await sql<{ subject: string }>`
      SELECT subject FROM self_healing_actions
      WHERE kind = 'provider-deprioritise'
        AND active_until > NOW()
    `;
    return new Set(rows.map((r) => r.subject));
  } catch {
    return new Set();
  }
}

/**
 * Industries flagged as needing improvement. Reported on
 * /admin/builds with the action reason so Craig can decide whether
 * to ship new variants for them.
 */
export async function getNeedsImprovementIndustries(): Promise<
  Array<{ industry: string; reason: string; sampleSize: number }>
> {
  try {
    const rows = await sql<{ subject: string; reason: string; sample_size: number }>`
      SELECT subject, reason, sample_size FROM self_healing_actions
      WHERE kind = 'industry-needs-improvement'
        AND active_until > NOW()
      ORDER BY sample_size DESC
    `;
    return rows.map((r) => ({
      industry: r.subject,
      reason: r.reason,
      sampleSize: Number(r.sample_size),
    }));
  } catch {
    return [];
  }
}
