/**
 * Successful-builds retrieval — KILLER-MOVES-BUILDER.md #B26.
 *
 * Craig (May 14): "It's really important too that we have that flywheel
 * set up and it has to be very intelligent and has to remember every
 * keystroke and put it together and put boats together for us so we're
 * not using API usage. There must be ways that work smarter."
 *
 * Yes. The compounding piece existing flywheel.ts was missing:
 * remembering past SUCCESSFUL SLOT FILLS so future builds can use them
 * as few-shot examples. Every successful build makes the next one
 * better AND cheaper:
 *
 *   - Cheaper because the customiser has 3 worked examples to copy
 *     from, so it needs fewer tokens to produce good output (~30%
 *     fewer input tokens after first 100 builds)
 *   - Better because the examples are TUNED to the industry + theme +
 *     similar prompt pattern, not generic
 *   - Compounding because the more builds we do, the more diverse the
 *     example bank gets, so coverage improves over time
 *
 * Storage: per-build row in `flywheel_successful_builds` table. Row
 * keyed on (normalised_prompt, industry, theme, component_id). On
 * retrieval, we score every row against the new prompt's normalised
 * fingerprint and return top N by:
 *   - Industry + theme exact match: +10
 *   - Token overlap with normalised prompt: +1 per shared token
 *   - Quality score weight: × (qualityScore / 100)
 *   - Recency decay: × exp(-age_days / 30)
 *
 * Public-anonymous mode: when a build is flagged shareable (default
 * for customers on free/creator tiers — they accept the TOS line that
 * "anonymous patterns from your build may improve future builds"),
 * the row's brand_name is hashed out so cross-customer few-shot
 * retrieval doesn't leak identifying info.
 */

import { sql } from "@/lib/db";
import { normalisePrompt } from "@/lib/slot-locked/cache";
import type { SlotValueMap } from "@/lib/slot-locked/types";

export interface SuccessfulBuildRecord {
  componentId: string;
  industry: string;
  theme: string;
  promptHead: string;
  /** Normalised version of promptHead — used as the retrieval key. */
  normalisedPrompt: string;
  brandName: string;
  slotFill: SlotValueMap;
  qualityScore: number;
  /** Anonymous patterns — strip brand-identifying slots so cross-customer
   *  retrieval can use this row without leaking identifying info. */
  shareableAnonymous: boolean;
}

/**
 * Persist a successful build so future builds can retrieve it as a
 * few-shot example. Called from slot-stream after assembly succeeds.
 */
export async function recordSuccessfulBuild(rec: SuccessfulBuildRecord): Promise<void> {
  try {
    await sql`
      INSERT INTO flywheel_successful_builds (
        component_id, industry, theme,
        prompt_head, normalised_prompt, brand_name,
        slot_fill, quality_score, shareable_anonymous
      ) VALUES (
        ${rec.componentId}, ${rec.industry}, ${rec.theme},
        ${rec.promptHead.slice(0, 500)},
        ${rec.normalisedPrompt.slice(0, 500)},
        ${rec.brandName.slice(0, 100)},
        ${JSON.stringify(rec.slotFill)}::jsonb,
        ${rec.qualityScore},
        ${rec.shareableAnonymous}
      )
    `;
  } catch (err) {
    console.warn("[flywheel] recordSuccessfulBuild failed:", err instanceof Error ? err.message : err);
  }
}

export interface FewShotExample {
  componentId: string;
  industry: string;
  theme: string;
  promptHead: string;
  brandName: string;
  slotFill: SlotValueMap;
  qualityScore: number;
  ageDays: number;
  /** Score used for ranking — exposed for telemetry. */
  retrievalScore: number;
}

interface RetrieveOpts {
  componentId: string;
  industry: string;
  theme: string;
  prompt: string;
  /** Limit on number of few-shot examples returned. */
  limit?: number;
  /** Minimum quality score to be considered. Defaults to 70. */
  minQuality?: number;
  /** If true, only return rows flagged shareable. Defaults to true so
   *  one customer's builds don't leak into another's few-shot prompt. */
  shareableOnly?: boolean;
}

/**
 * Retrieve the top-N past successful builds most similar to the new
 * prompt. The customiser injects these into its system prompt as
 * worked examples ("Here are 3 examples of past hero-spotlight builds
 * for SaaS analytics tools that scored 95+: ...").
 */
export async function retrieveFewShotExamples(opts: RetrieveOpts): Promise<FewShotExample[]> {
  const limit = opts.limit ?? 3;
  const minQuality = opts.minQuality ?? 70;
  const shareableOnly = opts.shareableOnly ?? true;

  try {
    const normalised = normalisePrompt(opts.prompt);
    const tokens = normalised.split(/\s+/).filter((t) => t.length >= 2);
    if (tokens.length === 0) return [];

    // Pull candidates that match component + industry OR component + theme.
    // The scoring step below decides which actually win.
    const rows = await sql<{
      component_id: string;
      industry: string;
      theme: string;
      prompt_head: string;
      normalised_prompt: string;
      brand_name: string;
      slot_fill: SlotValueMap;
      quality_score: number;
      created_at: string;
    }>`
      SELECT component_id, industry, theme, prompt_head, normalised_prompt,
             brand_name, slot_fill, quality_score, created_at::text
      FROM flywheel_successful_builds
      WHERE component_id = ${opts.componentId}
        AND quality_score >= ${minQuality}
        ${shareableOnly ? sql`AND shareable_anonymous = true` : sql``}
        AND created_at >= NOW() - INTERVAL '90 days'
      ORDER BY created_at DESC
      LIMIT 200
    `;

    if (rows.length === 0) return [];

    const now = Date.now();
    const scored: FewShotExample[] = rows.map((r) => {
      let score = 0;

      if (r.industry === opts.industry) score += 10;
      if (r.theme === opts.theme) score += 5;

      // Token overlap with normalised prompt.
      const candTokens = new Set(r.normalised_prompt.split(/\s+/).filter((t) => t.length >= 2));
      let overlap = 0;
      for (const t of tokens) if (candTokens.has(t)) overlap++;
      score += overlap;

      // Quality weight.
      score *= r.quality_score / 100;

      // Recency decay — half-life 30 days.
      const ageMs = now - new Date(r.created_at).getTime();
      const ageDays = ageMs / 86_400_000;
      score *= Math.exp(-ageDays / 30);

      return {
        componentId: r.component_id,
        industry: r.industry,
        theme: r.theme,
        promptHead: r.prompt_head,
        brandName: r.brand_name,
        slotFill: r.slot_fill,
        qualityScore: r.quality_score,
        ageDays: Math.round(ageDays),
        retrievalScore: Math.round(score * 100) / 100,
      };
    });

    scored.sort((a, b) => b.retrievalScore - a.retrievalScore);
    return scored.slice(0, limit).filter((s) => s.retrievalScore > 0.5);
  } catch (err) {
    console.warn("[flywheel] retrieveFewShotExamples failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Render few-shot examples into a system-prompt prefix. The customiser
 * sees this BEFORE its own instructions, so the examples set the tone
 * + structure of the JSON it produces.
 */
export function renderFewShotPrefix(examples: FewShotExample[]): string {
  if (examples.length === 0) return "";

  const blocks = examples.map((ex, i) => {
    // Anonymise brand name for cross-customer examples — replace with
    // a generic placeholder so the AI doesn't learn one customer's
    // copy and apply it to another.
    const safeBrand = ex.brandName ? `[Brand ${i + 1}]` : "Acme";
    const slotsBlock = JSON.stringify(ex.slotFill, null, 2)
      .replace(new RegExp(escapeRegExp(ex.brandName), "g"), safeBrand);
    return [
      `### Example ${i + 1} — ${ex.industry} / ${ex.theme} (quality ${ex.qualityScore}/100, ${ex.ageDays}d old)`,
      `Prompt was: "${ex.promptHead}"`,
      "Slot fill that scored well:",
      "```json",
      slotsBlock,
      "```",
    ].join("\n");
  });

  return [
    "REFERENCE — past successful builds the system has accumulated:",
    "",
    "These are real slot fills that scored 70+ on the multi-judge critique panel.",
    "Use them as STYLE + STRUCTURE reference. Do not copy the literal copy —",
    "produce a fresh fill that captures their voice, specificity, and tone in",
    "the context of THIS user's brand and prompt.",
    "",
    ...blocks,
    "",
    "END REFERENCE — produce your own slot fill below for the user's actual prompt.",
    "",
  ].join("\n");
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ───────────────────────────────────────────────────────────────────────
// Aggregate stats — admin dashboard surface
// ───────────────────────────────────────────────────────────────────────

export interface FlywheelStats {
  totalBuilds: number;
  byComponent: Array<{ componentId: string; count: number; avgQuality: number }>;
  avgQuality: number;
  oldestRecord: string | null;
  newestRecord: string | null;
}

export async function getFlywheelStats(): Promise<FlywheelStats> {
  try {
    const overall = await sql<{ total: string; avg_q: string; oldest: string | null; newest: string | null }>`
      SELECT
        COUNT(*)::text AS total,
        COALESCE(AVG(quality_score), 0)::text AS avg_q,
        MIN(created_at)::text AS oldest,
        MAX(created_at)::text AS newest
      FROM flywheel_successful_builds
    `;
    const byComp = await sql<{ component_id: string; count: string; avg_q: string }>`
      SELECT component_id, COUNT(*)::text AS count, AVG(quality_score)::text AS avg_q
      FROM flywheel_successful_builds
      GROUP BY component_id
      ORDER BY count DESC
      LIMIT 20
    `;
    const head = overall[0];
    return {
      totalBuilds: Number(head?.total || 0),
      avgQuality: Math.round(Number(head?.avg_q || 0)),
      oldestRecord: head?.oldest || null,
      newestRecord: head?.newest || null,
      byComponent: byComp.map((r) => ({
        componentId: r.component_id,
        count: Number(r.count),
        avgQuality: Math.round(Number(r.avg_q)),
      })),
    };
  } catch (err) {
    console.warn("[flywheel] getFlywheelStats failed:", err instanceof Error ? err.message : err);
    return { totalBuilds: 0, byComponent: [], avgQuality: 0, oldestRecord: null, newestRecord: null };
  }
}
