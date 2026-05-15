/**
 * Overnight prebuild factory — KILLER-MOVES-BUILDER.md #B23.
 *
 * At off-peak hours (03:30 UTC, after the consolidation cron), this
 * factory generates slot-fills for the most common (industry × theme
 * × prompt-pattern) combinations and seeds them into the slot_cache.
 * By morning, ~70% of inbound customer prompts hit a warm cache with
 * zero AI cost.
 *
 * What "most common" means:
 *   - Industry preferences from B27 consolidation memories (which
 *     industries are popular)
 *   - Top quality patterns (which prompt phrasings score well)
 *   - Component lineups the planner picks most often per industry
 *
 * The factory iterates these top combinations, runs the customiser
 * against each, validates output, persists to slot_cache with a
 * special prebuilt=true flag (so we can track factory cache hit rate
 * separately from organic ones on /admin/builds).
 *
 * Bounded cost: caps at 200 prebuilds per nightly run. At 200 ×
 * ~$0.005 Haiku = ~$1/day in prebuild spend. Saves ~10-30× that in
 * morning-traffic cache hits.
 */

import { sql } from "@/lib/db";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { validateEditJson } from "@/lib/llm-output-validator";
import { schemaToPrompt, assembleComponent } from "@/lib/slot-locked/assembler";
import { buildCacheKey, persistSlotCache } from "@/lib/slot-locked/cache";
import { getIndustryPreferences, getTopQualityPatterns } from "@/lib/flywheel/consolidate";
import type { ComponentSchema, SlotValueMap } from "@/lib/slot-locked/types";
import { HERO_SPOTLIGHT_SCHEMA, HERO_SPOTLIGHT_TEMPLATE } from "@/lib/slot-locked/templates/hero-spotlight";
import { NAVBAR_MINIMAL_SCHEMA, NAVBAR_MINIMAL_TEMPLATE } from "@/lib/slot-locked/templates/navbar-minimal";
import { FEATURES_BENTO_SCHEMA, FEATURES_BENTO_TEMPLATE } from "@/lib/slot-locked/templates/features-bento";
import { PRICING_TIERS_SCHEMA, PRICING_TIERS_TEMPLATE } from "@/lib/slot-locked/templates/pricing-tiers";
import { FOOTER_EDITORIAL_SCHEMA, FOOTER_EDITORIAL_TEMPLATE } from "@/lib/slot-locked/templates/footer-editorial";
import { HERO_RESTAURANT_WARM_SCHEMA, HERO_RESTAURANT_WARM_TEMPLATE } from "@/lib/slot-locked/templates/by-industry/hero-restaurant-warm";
import { HERO_PORTFOLIO_EDITORIAL_SCHEMA, HERO_PORTFOLIO_EDITORIAL_TEMPLATE } from "@/lib/slot-locked/templates/by-industry/hero-portfolio-editorial";

const FACTORY_REGISTRY: Record<string, { schema: ComponentSchema; template: string }> = {
  "hero-spotlight-slot":           { schema: HERO_SPOTLIGHT_SCHEMA,           template: HERO_SPOTLIGHT_TEMPLATE },
  "navbar-minimal-slot":           { schema: NAVBAR_MINIMAL_SCHEMA,           template: NAVBAR_MINIMAL_TEMPLATE },
  "features-bento-slot":           { schema: FEATURES_BENTO_SCHEMA,           template: FEATURES_BENTO_TEMPLATE },
  "pricing-tiers-slot":            { schema: PRICING_TIERS_SCHEMA,            template: PRICING_TIERS_TEMPLATE },
  "footer-editorial-slot":         { schema: FOOTER_EDITORIAL_SCHEMA,         template: FOOTER_EDITORIAL_TEMPLATE },
  "hero-restaurant-warm-slot":     { schema: HERO_RESTAURANT_WARM_SCHEMA,     template: HERO_RESTAURANT_WARM_TEMPLATE },
  "hero-portfolio-editorial-slot": { schema: HERO_PORTFOLIO_EDITORIAL_SCHEMA, template: HERO_PORTFOLIO_EDITORIAL_TEMPLATE },
};

interface PrebuildJob {
  componentId: string;
  industry: string;
  theme: string;
  prompt: string;
  reason: string;
}

const MAX_PREBUILDS_PER_RUN = 200;

// Curated seed prompts per industry — phrasings that tend to be common
// AND that produce diverse, useful cache entries. The factory expands
// from these seeds using consolidation memories.
const SEED_PROMPTS: Record<string, string[]> = {
  saas: [
    "modern SaaS landing page for analytics tool",
    "developer-focused API platform homepage",
    "B2B workflow automation product",
    "real-time collaboration tool for teams",
    "enterprise dashboard with KPI tiles",
  ],
  agency: [
    "creative agency portfolio site",
    "digital marketing agency homepage",
    "design studio with selected work",
    "branding agency for premium clients",
  ],
  restaurant: [
    "Italian restaurant in a small city",
    "neighbourhood bistro with seasonal menu",
    "fine dining tasting menu restaurant",
    "casual all-day cafe with brunch",
  ],
  portfolio: [
    "independent designer portfolio",
    "photographer portfolio with selected work",
    "freelance consultant landing page",
    "personal brand site for a developer",
  ],
  ecommerce: [
    "boutique online store for clothing",
    "single-product landing page",
    "marketplace homepage with categories",
  ],
  startup: [
    "pre-seed startup launch site",
    "seed-stage product announcement",
    "founder-led waitlist landing page",
  ],
  fitness: [
    "boutique gym membership site",
    "yoga studio with class schedule",
    "personal trainer booking page",
  ],
  wedding: [
    "wedding photography portfolio",
    "wedding venue + booking site",
    "wedding planner services site",
  ],
};

const ALL_THEMES = ["editorial", "light", "warm", "dark"] as const;

interface FactoryRunResult {
  jobsPlanned: number;
  jobsExecuted: number;
  cacheEntriesAdded: number;
  estimatedCostUsd: number;
  durationMs: number;
  byIndustry: Record<string, number>;
}

/**
 * Build the list of prebuild jobs. Prioritisation:
 *   1. Industry preferences from consolidation — heaviest industries first
 *   2. Cross every (industry × theme) bucket that makes sense (we skip
 *      industry/theme mismatches — restaurant doesn't get a dark theme)
 *   3. Within each bucket, run multiple seed prompts × multiple components
 *   4. Cap at MAX_PREBUILDS_PER_RUN
 */
async function planFactoryJobs(): Promise<PrebuildJob[]> {
  const jobs: PrebuildJob[] = [];

  // Industry × theme matrix — skip combos that don't make sense.
  const themeForIndustry: Record<string, (typeof ALL_THEMES)[number][]> = {
    saas: ["editorial", "light"],
    agency: ["editorial", "light"],
    restaurant: ["warm"],
    portfolio: ["editorial"],
    ecommerce: ["light", "editorial"],
    startup: ["editorial", "light"],
    fitness: ["light", "warm"],
    wedding: ["warm", "editorial"],
  };

  for (const industry of Object.keys(SEED_PROMPTS)) {
    const themes = themeForIndustry[industry] || ["editorial"];
    const seeds = SEED_PROMPTS[industry];

    // Pull industry-preference components — if consolidation has
    // observed which components this industry prefers, factor those
    // in. Otherwise default to the full 5-component lineup.
    const prefs = await getIndustryPreferences(industry).catch(() => []);
    const preferredComponents =
      prefs.length > 0
        ? prefs.filter((p) => p.sharePercent >= 30).map((p) => p.componentId)
        : Object.keys(FACTORY_REGISTRY);

    for (const theme of themes) {
      for (const seed of seeds) {
        for (const componentId of preferredComponents) {
          if (!FACTORY_REGISTRY[componentId]) continue;
          if (jobs.length >= MAX_PREBUILDS_PER_RUN) break;
          jobs.push({
            componentId,
            industry,
            theme,
            prompt: seed,
            reason: `seed: ${industry}/${theme}`,
          });
        }
      }
    }
  }

  // Also feed in any top-scoring prompt patterns from the flywheel so
  // we cache the AI's "what works" insights.
  const topPatterns = await getTopQualityPatterns(20).catch(() => []);
  for (const pattern of topPatterns) {
    if (jobs.length >= MAX_PREBUILDS_PER_RUN) break;
    // Heuristically use editorial/saas as defaults for the top
    // patterns; the consolidation memory doesn't carry industry
    // context with the pattern.
    jobs.push({
      componentId: "hero-spotlight-slot",
      industry: "saas",
      theme: "editorial",
      prompt: pattern.pattern,
      reason: `top-pattern (avg ${pattern.avgQuality}/100)`,
    });
  }

  return jobs.slice(0, MAX_PREBUILDS_PER_RUN);
}

/**
 * Execute one prebuild job. Returns true if the result was cached
 * successfully.
 */
async function executeJob(job: PrebuildJob): Promise<boolean> {
  const entry = FACTORY_REGISTRY[job.componentId];
  if (!entry) return false;

  // Check if this exact (componentId × prompt × industry × theme)
  // combo is already in cache — skip if so. The prebuild is for
  // gaps, not duplicates.
  const cacheKey = buildCacheKey({
    componentId: job.componentId,
    theme: job.theme,
    industry: job.industry,
    brandName: "", // factory uses no specific brand
    prompt: job.prompt,
  });

  try {
    const existing = await sql<{ cache_key: string }>`
      SELECT cache_key FROM slot_cache
      WHERE cache_key = ${cacheKey} AND component_id = ${job.componentId}
        AND created_at >= NOW() - INTERVAL '7 days'
      LIMIT 1
    `;
    if (existing.length > 0) return false; // already cached
  } catch {
    // continue — if the check failed, the persist will fail too and
    // we'll just skip this job naturally
  }

  // Run the customiser for this job. Same prompt shape as slot-stream
  // but without the user-facing brand brief — brand is anonymous so
  // the cached output is reusable.
  const brandBrief = `Anonymous ${job.industry} brand. Prompt pattern: ${job.prompt}`;
  const aiPrompt = schemaToPrompt(entry.schema, brandBrief);

  let slotFill: SlotValueMap;
  try {
    const fb = await callLLMWithFailover({
      model: "claude-haiku-4-5",
      system:
        "You are filling in the slots of a hand-written React component template. " +
        "Output ONLY a valid JSON object matching the schema. No prose, no markdown fences, no explanation. " +
        "This is a PREBUILD — output should be high-quality enough to serve as a few-shot reference for future similar prompts.",
      userMessage: aiPrompt,
      maxTokens: 2000,
    });

    const validation = validateEditJson(fb.text);
    if (!validation.ok || !validation.data) return false;

    const startIdx = fb.text.indexOf("{");
    const endIdx = fb.text.lastIndexOf("}");
    if (startIdx === -1 || endIdx === -1) return false;
    slotFill = JSON.parse(fb.text.slice(startIdx, endIdx + 1)) as SlotValueMap;
  } catch {
    return false;
  }

  // Verify the slot-fill actually assembles into valid code — if it
  // doesn't, don't cache garbage.
  try {
    const assembly = assembleComponent({
      template: entry.template,
      schema: entry.schema,
      slots: slotFill,
    });
    if (!assembly.ok) return false;
  } catch {
    return false;
  }

  // Persist to slot_cache. The next live customer request that
  // produces the same cache key hits this instantly.
  await persistSlotCache({
    cacheKey,
    componentId: job.componentId,
    slotFill,
  });

  return true;
}

export async function runPrebuildFactory(): Promise<FactoryRunResult> {
  const startedAt = Date.now();
  const jobs = await planFactoryJobs();
  let executed = 0;
  let added = 0;
  const byIndustry: Record<string, number> = {};

  // Run sequentially — we're in a cron job, not a hot path. Sequential
  // keeps us under per-key rate limits naturally.
  for (const job of jobs) {
    executed++;
    try {
      const ok = await executeJob(job);
      if (ok) {
        added++;
        byIndustry[job.industry] = (byIndustry[job.industry] || 0) + 1;
      }
    } catch (err) {
      console.warn("[prebuild-factory] job failed:", err instanceof Error ? err.message : err);
    }
  }

  // Cost estimate — Haiku at ~1500 input / 800 output per call.
  const perJobCostUsd = 0.005; // rough average
  const estimatedCostUsd = executed * perJobCostUsd;

  return {
    jobsPlanned: jobs.length,
    jobsExecuted: executed,
    cacheEntriesAdded: added,
    estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
    durationMs: Date.now() - startedAt,
    byIndustry,
  };
}
