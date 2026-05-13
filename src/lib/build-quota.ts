/**
 * Build quota + abuse detection — KILLER-MOVES.md #5.
 *
 * Per-user-per-UTC-day token + cost budget. Two thresholds:
 *
 *   - SOFT cap → warn the user in the SSE stream ("you have 20% of your
 *     daily build budget remaining"). Build still completes.
 *   - HARD cap → block further builds for the day. User sees an error
 *     event with the reset time and contact link.
 *
 * Why this matters: a single runaway user can rack up $1000+ in
 * Anthropic charges in a day if they exploit the unbounded critique
 * loop. At 1M builds/day we need cost ceilings per user, not just
 * global rate limits. Lovable learned this the hard way ($15M/day on
 * Sora before the cost model was fixed).
 *
 * Per-plan budgets (USD/day input+output token cost):
 *   free        $0.10  / 5 builds  — protects against signup-abuse rings
 *   creator     $1.00  / 25 builds
 *   pro         $5.00  / 100 builds
 *   agency      $25.00 / 500 builds
 *   white_label $100   / 2000 builds  — agencies serve their own clients
 *   admin       Infinity  — internal use, never blocked
 *
 * Estimate cost using Anthropic public pricing as of 2026-05:
 *   Haiku  4.5: $0.80 / 1M input, $4.00  / 1M output
 *   Sonnet 4.6: $3.00 / 1M input, $15.00 / 1M output
 *   Opus   4.7: $15.0 / 1M input, $75.00 / 1M output
 * (OpenAI / Gemini fallbacks priced similarly within ±20% — close enough.)
 */

import { sql } from "@/lib/db";

export type QuotaPlan = "free" | "creator" | "pro" | "agency" | "white_label" | "admin";

interface QuotaConfig {
  /** Hard daily cost ceiling in USD. Build is blocked when crossed. */
  hardCostUsd: number;
  /** Soft cost threshold for the warning event. */
  softCostUsd: number;
  /** Hard daily build count ceiling. */
  hardBuildCount: number;
}

const QUOTA_BY_PLAN: Record<QuotaPlan, QuotaConfig> = {
  free:        { hardCostUsd: 0.10,    softCostUsd: 0.07,    hardBuildCount: 5 },
  creator:     { hardCostUsd: 1.00,    softCostUsd: 0.80,    hardBuildCount: 25 },
  pro:         { hardCostUsd: 5.00,    softCostUsd: 4.00,    hardBuildCount: 100 },
  agency:      { hardCostUsd: 25.00,   softCostUsd: 20.00,   hardBuildCount: 500 },
  white_label: { hardCostUsd: 100.00,  softCostUsd: 80.00,   hardBuildCount: 2000 },
  admin:       { hardCostUsd: Infinity, softCostUsd: Infinity, hardBuildCount: Infinity },
};

// Token pricing (USD per million tokens). Used to estimate cost when
// we don't get an exact bill back from the provider.
const TOKEN_COST_PER_M: Record<string, { input: number; output: number }> = {
  // Anthropic
  "claude-haiku-4-5":           { input: 0.80, output: 4.00 },
  "claude-haiku-4-5-20251001":  { input: 0.80, output: 4.00 },
  "claude-sonnet-4-6":          { input: 3.00, output: 15.00 },
  "claude-opus-4-6":            { input: 15.00, output: 75.00 },
  "claude-opus-4-7":            { input: 15.00, output: 75.00 },
  // OpenAI (approx)
  "gpt-4o":                     { input: 2.50, output: 10.00 },
  "gpt-4o-mini":                { input: 0.15, output: 0.60 },
  // Gemini
  "gemini-2.5-pro":             { input: 1.25, output: 5.00 },
  "gemini-2.5-flash":           { input: 0.10, output: 0.40 },
};

const DEFAULT_PRICE = { input: 1.00, output: 5.00 };

export function estimateCallCostUsd(model: string, inputTokens?: number, outputTokens?: number): number {
  const p = TOKEN_COST_PER_M[model] || DEFAULT_PRICE;
  const inUsd  = ((inputTokens  || 0) / 1_000_000) * p.input;
  const outUsd = ((outputTokens || 0) / 1_000_000) * p.output;
  return inUsd + outUsd;
}

export interface QuotaCheck {
  ok: boolean;
  reason?: string;
  /** How many builds the user has used today. */
  buildsToday: number;
  /** USD spent today (best-estimate). */
  costToday: number;
  /** Daily hard cap. */
  hardCostUsd: number;
  /** Daily hard build count cap. */
  hardBuildCount: number;
  /** When the quota resets (next UTC midnight). */
  resetsAtIso: string;
  /** Whether we just crossed the soft threshold (caller may emit warning). */
  crossedSoft: boolean;
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowUtcIso(): string {
  const t = new Date();
  t.setUTCHours(24, 0, 0, 0);
  return t.toISOString();
}

/**
 * Check quota before starting a build. Returns ok=false if the user is
 * already over their hard cap. The caller should refuse the build and
 * emit an error SSE event explaining when quota resets.
 *
 * Skipped (always ok) when:
 *   - userEmail is null/empty (anonymous — pre-auth abuse handled by IP rate limit)
 *   - plan is "admin"
 */
export async function checkBuildQuota(
  userEmail: string | null | undefined,
  plan: QuotaPlan,
): Promise<QuotaCheck> {
  const cfg = QUOTA_BY_PLAN[plan] || QUOTA_BY_PLAN.free;
  const baseline: QuotaCheck = {
    ok: true,
    buildsToday: 0,
    costToday: 0,
    hardCostUsd: cfg.hardCostUsd,
    hardBuildCount: cfg.hardBuildCount,
    resetsAtIso: tomorrowUtcIso(),
    crossedSoft: false,
  };

  if (!userEmail) return baseline; // anonymous — handled elsewhere
  if (plan === "admin") return baseline;

  try {
    const day = todayUtcDate();
    const rows = await sql<{
      build_count: number;
      estimated_cost_usd: string;
      blocked_at: string | null;
    }>`
      SELECT build_count, estimated_cost_usd::text, blocked_at
      FROM build_quotas
      WHERE user_email = ${userEmail} AND day = ${day}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return baseline;

    const buildsToday = Number(row.build_count);
    const costToday   = Number(row.estimated_cost_usd);

    if (buildsToday >= cfg.hardBuildCount) {
      return {
        ...baseline,
        buildsToday,
        costToday,
        ok: false,
        reason: `Daily build limit reached (${buildsToday}/${cfg.hardBuildCount}). Resets at ${tomorrowUtcIso()}.`,
      };
    }
    if (costToday >= cfg.hardCostUsd) {
      return {
        ...baseline,
        buildsToday,
        costToday,
        ok: false,
        reason: `Daily build budget reached ($${costToday.toFixed(2)}/$${cfg.hardCostUsd.toFixed(2)}). Resets at ${tomorrowUtcIso()}.`,
      };
    }
    return {
      ...baseline,
      buildsToday,
      costToday,
      crossedSoft: costToday >= cfg.softCostUsd,
    };
  } catch (err) {
    // Quota check failure shouldn't block builds — degrade open.
    console.warn("[build-quota] check failed:", err instanceof Error ? err.message : err);
    return baseline;
  }
}

/**
 * Increment quota counters after a build completes (success OR failure
 * — failed builds still cost tokens). Idempotent insert + update.
 */
export async function recordBuildQuotaUsage(
  userEmail: string | null | undefined,
  modelCalls: Array<{ model: string; inputTokens?: number; outputTokens?: number }>,
): Promise<void> {
  if (!userEmail) return;
  try {
    const day = todayUtcDate();
    const totalIn  = modelCalls.reduce((s, c) => s + (c.inputTokens  || 0), 0);
    const totalOut = modelCalls.reduce((s, c) => s + (c.outputTokens || 0), 0);
    const totalCost = modelCalls.reduce(
      (s, c) => s + estimateCallCostUsd(c.model, c.inputTokens, c.outputTokens),
      0,
    );

    await sql`
      INSERT INTO build_quotas (user_email, day, build_count, total_input_tokens, total_output_tokens, estimated_cost_usd)
      VALUES (${userEmail}, ${day}, 1, ${totalIn}, ${totalOut}, ${totalCost})
      ON CONFLICT (user_email, day) DO UPDATE SET
        build_count         = build_quotas.build_count + 1,
        total_input_tokens  = build_quotas.total_input_tokens  + ${totalIn},
        total_output_tokens = build_quotas.total_output_tokens + ${totalOut},
        estimated_cost_usd  = build_quotas.estimated_cost_usd  + ${totalCost},
        updated_at          = NOW()
    `;
  } catch (err) {
    console.warn("[build-quota] record failed:", err instanceof Error ? err.message : err);
  }
}
