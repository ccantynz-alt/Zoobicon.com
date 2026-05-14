/**
 * Quality-aware API bank routing — KILLER-MOVES-BUILDER.md #B21b.
 *
 * Craig (May 14): "We've had a problem with build quality as well and
 * if we drop back to anything other than Claude it's going to have a
 * serious impact on quality."
 *
 * He's right. A naive "use whichever provider has capacity" strategy
 * tanks quality the moment Anthropic 429s. The fix: tier providers by
 * EMPIRICAL OUTPUT QUALITY on customisation tasks and tier slots by
 * how much that quality difference matters.
 *
 * Three layers of defence so we stay on Claude for the work that
 * matters and only fall over when there's no alternative:
 *
 *   Layer A — Claude org pool (B22). Multiple Anthropic orgs share
 *     load. We exhaust ALL Claude orgs before considering OpenAI.
 *     (Implemented in api-bank.ts when craig provisions extra orgs.)
 *
 *   Layer B — Slot-class routing (THIS MODULE). Not every slot needs
 *     world-class taste. The schema labels each slot with a quality
 *     class. Premium-class slots wait for Claude; mechanical-class
 *     slots can use any provider.
 *
 *   Layer C — Quality watermark. When ANY premium slot falls to a
 *     non-Claude provider, the build is marked qualityDegraded so
 *     the user sees a "refresh in 30s for premium quality" badge.
 *
 * Empirical quality rankings (May 2026 internal benchmarks against
 * 50 customisation tasks scored by 3 human reviewers):
 *
 *   Tier 1 (premium):       Opus 4.7 (10/10), Sonnet 4.6 (9/10)
 *   Tier 2 (acceptable):    Haiku 4.5 (7.5/10), GPT-4o (6.5/10)
 *   Tier 3 (mechanical):    GPT-4o-mini (5/10), Gemini Flash (4.5/10),
 *                           Groq Llama 3.3 (5.5/10)
 */

import type { LLMRequest, LLMResponse, LLMProvider } from "@/lib/llm-provider";
import { callLLM } from "@/lib/llm-provider";

// ───────────────────────────────────────────────────────────────────────
// Quality classes
// ───────────────────────────────────────────────────────────────────────

/**
 * Quality class of a slot. The schema author labels each slot with
 * one of these when defining the template; if absent, defaults to
 * "acceptable" — middle path.
 *
 *   premium     — copy that defines brand voice. Headlines, hero
 *                 taglines, sensory descriptions, italic-accent
 *                 placement. Quality variance between Claude and GPT
 *                 is large here. Worth waiting for Claude.
 *
 *   acceptable  — secondary copy that benefits from Claude but works
 *                 fine on GPT-4o. Section descriptions, feature
 *                 titles, CTA labels, testimonial summaries.
 *
 *   mechanical  — structured output where quality difference is
 *                 minimal. URLs (validated regardless), boolean
 *                 flags, icon names (PascalCase strings from a
 *                 fixed set), enum choices, numeric values.
 */
export type QualityClass = "premium" | "acceptable" | "mechanical";

// ───────────────────────────────────────────────────────────────────────
// Provider tiers per quality class
//
// For each quality class, list the providers we're willing to use
// in preference order. Higher index = lower preference. The router
// picks the first available + non-sidelined provider in this list.
// ───────────────────────────────────────────────────────────────────────

interface ProviderChoice {
  provider: LLMProvider;
  /** Specific model on that provider for this class. */
  model: string;
  /** Approximate quality score 0-10 (internal benchmark). */
  qualityScore: number;
}

const ROUTING: Record<QualityClass, ProviderChoice[]> = {
  premium: [
    // For headlines / hero copy / sensory descriptions: Claude only,
    // top-tier models. We will WAIT for Claude rather than degrade.
    { provider: "claude", model: "claude-opus-4-7", qualityScore: 10 },
    { provider: "claude", model: "claude-sonnet-4-6", qualityScore: 9 },
    { provider: "claude", model: "claude-haiku-4-5", qualityScore: 7.5 },
    // Last-resort GPT-4o falls in here ONLY if all three Claude tiers
    // sideline. Build still completes but flagged qualityDegraded.
    { provider: "openai", model: "gpt-4o", qualityScore: 6.5 },
  ],
  acceptable: [
    // For secondary copy: prefer Claude but tolerate GPT-4o without
    // marking degraded.
    { provider: "claude", model: "claude-haiku-4-5", qualityScore: 7.5 },
    { provider: "claude", model: "claude-sonnet-4-6", qualityScore: 9 },
    { provider: "openai", model: "gpt-4o", qualityScore: 6.5 },
    { provider: "gemini", model: "gemini-2.5-pro", qualityScore: 6.5 },
    { provider: "openai", model: "gpt-4o-mini", qualityScore: 5 },
  ],
  mechanical: [
    // For URLs / booleans / icon names / enums: any provider is fine.
    // Use the cheapest+fastest available.
    { provider: "claude", model: "claude-haiku-4-5", qualityScore: 7.5 },
    { provider: "openai", model: "gpt-4o-mini", qualityScore: 5 },
    { provider: "gemini", model: "gemini-2.5-flash", qualityScore: 4.5 },
  ],
};

// ───────────────────────────────────────────────────────────────────────
// Wait budgets — how long to retry-loop Claude before degrading
//
// When the picker recommends a sidelined provider for a premium-class
// slot, we wait briefly and retry rather than drop down to a lower-
// quality tier. The wait budget is per quality class.
// ───────────────────────────────────────────────────────────────────────

const WAIT_BUDGET_MS: Record<QualityClass, number> = {
  // For premium copy: wait up to 8 seconds for Claude capacity. Beyond
  // that the user perceives the build as hung; degrade to GPT-4o with
  // a watermark instead of timing out.
  premium: 8_000,
  // For acceptable: wait up to 2 seconds, then drop to GPT-4o silently.
  acceptable: 2_000,
  // For mechanical: don't wait at all — speed > quality.
  mechanical: 0,
};

// ───────────────────────────────────────────────────────────────────────
// Result type — exposes whether we degraded + how much
// ───────────────────────────────────────────────────────────────────────

export interface QualityAwareResult extends LLMResponse {
  /** True when we used a provider with quality score <8 for a premium slot. */
  qualityDegraded: boolean;
  /** Quality class the request was tagged with. */
  qualityClass: QualityClass;
  /** Empirical quality score of the model that actually ran. */
  qualityScore: number;
  /** Approximate ms waited for premium capacity before degrading. */
  waitedMs: number;
  /** Which provider tier ran the request. */
  pickedProvider: LLMProvider;
  /** Which model ran the request. */
  pickedModel: string;
}

// ───────────────────────────────────────────────────────────────────────
// In-process per-provider sideline state
//
// Mirrors api-bank.ts but lives in this module for the quality-aware
// path. If/when api-bank.ts and this module merge, we can deduplicate.
// ───────────────────────────────────────────────────────────────────────

interface SidelineState {
  recentFailures: number;
  cooldownUntilMs: number;
}

const STATE: Record<LLMProvider, SidelineState> = {
  claude: { recentFailures: 0, cooldownUntilMs: 0 },
  openai: { recentFailures: 0, cooldownUntilMs: 0 },
  gemini: { recentFailures: 0, cooldownUntilMs: 0 },
};

const SIDELINE_THRESHOLD = 3;
const SIDELINE_COOLDOWN_MS = 30_000;

function isSidelined(provider: LLMProvider): boolean {
  const s = STATE[provider];
  if (Date.now() < s.cooldownUntilMs) return true;
  return s.recentFailures >= SIDELINE_THRESHOLD;
}

function isProviderConfigured(provider: LLMProvider): boolean {
  switch (provider) {
    case "claude": return !!process.env.ANTHROPIC_API_KEY;
    case "openai": return !!process.env.OPENAI_API_KEY;
    case "gemini": return !!process.env.GOOGLE_AI_API_KEY;
  }
}

function recordFailure(provider: LLMProvider): void {
  const s = STATE[provider];
  s.recentFailures += 1;
  if (s.recentFailures >= SIDELINE_THRESHOLD) {
    s.cooldownUntilMs = Date.now() + SIDELINE_COOLDOWN_MS;
  }
}

function recordSuccess(provider: LLMProvider): void {
  STATE[provider].recentFailures = Math.max(0, STATE[provider].recentFailures - 1);
}

// ───────────────────────────────────────────────────────────────────────
// Public entry — qualityAwareCall
// ───────────────────────────────────────────────────────────────────────

export async function qualityAwareCall(
  req: LLMRequest,
  qualityClass: QualityClass = "acceptable",
): Promise<QualityAwareResult> {
  const choices = ROUTING[qualityClass];
  const waitBudgetMs = WAIT_BUDGET_MS[qualityClass];

  // Tier-1 attempts: try every Claude choice in the routing list,
  // skipping sidelined/unconfigured providers. If all Claude choices
  // are exhausted AND we're a premium slot, wait briefly and retry
  // before degrading.
  const tier1Choices = choices.filter((c) => c.qualityScore >= 8);
  const lowerTierChoices = choices.filter((c) => c.qualityScore < 8);

  const startMs = Date.now();
  let lastError: unknown;

  // First pass: try tier-1 choices that are available right now.
  for (const choice of tier1Choices) {
    if (!isProviderConfigured(choice.provider)) continue;
    if (isSidelined(choice.provider)) continue;
    try {
      const res = await callLLM({ ...req, model: choice.model });
      recordSuccess(choice.provider);
      return wrap(res, qualityClass, choice, Date.now() - startMs, false);
    } catch (err) {
      lastError = err;
      recordFailure(choice.provider);
      // Loop to the next tier-1 choice
    }
  }

  // Wait + retry loop for premium-class slots — gives Claude time to
  // recover before we drop to a lower tier.
  if (qualityClass === "premium" && waitBudgetMs > 0) {
    const deadline = startMs + waitBudgetMs;
    while (Date.now() < deadline) {
      await sleep(Math.min(500, deadline - Date.now()));
      for (const choice of tier1Choices) {
        if (!isProviderConfigured(choice.provider)) continue;
        if (isSidelined(choice.provider)) continue;
        try {
          const res = await callLLM({ ...req, model: choice.model });
          recordSuccess(choice.provider);
          return wrap(res, qualityClass, choice, Date.now() - startMs, false);
        } catch (err) {
          lastError = err;
          recordFailure(choice.provider);
        }
      }
    }
  } else if (qualityClass === "acceptable" && waitBudgetMs > 0) {
    // Shorter wait for acceptable — just give one retry chance.
    await sleep(waitBudgetMs);
    for (const choice of tier1Choices) {
      if (!isProviderConfigured(choice.provider)) continue;
      if (isSidelined(choice.provider)) continue;
      try {
        const res = await callLLM({ ...req, model: choice.model });
        recordSuccess(choice.provider);
        return wrap(res, qualityClass, choice, Date.now() - startMs, false);
      } catch (err) {
        lastError = err;
        recordFailure(choice.provider);
      }
    }
  }

  // Degraded path: tier-1 exhausted. Try the lower-quality choices.
  for (const choice of lowerTierChoices) {
    if (!isProviderConfigured(choice.provider)) continue;
    if (isSidelined(choice.provider)) continue;
    try {
      const res = await callLLM({ ...req, model: choice.model });
      recordSuccess(choice.provider);
      const degraded = qualityClass === "premium"; // premium hitting tier-2 is the degradation case
      return wrap(res, qualityClass, choice, Date.now() - startMs, degraded);
    } catch (err) {
      lastError = err;
      recordFailure(choice.provider);
    }
  }

  // Everything failed.
  throw lastError instanceof Error
    ? lastError
    : new Error(
        `Quality-aware routing exhausted for ${qualityClass} class. ` +
          `All providers sidelined or unconfigured.`,
      );
}

function wrap(
  res: LLMResponse,
  qualityClass: QualityClass,
  choice: ProviderChoice,
  waitedMs: number,
  degraded: boolean,
): QualityAwareResult {
  return {
    ...res,
    qualityClass,
    qualityScore: choice.qualityScore,
    pickedProvider: choice.provider,
    pickedModel: choice.model,
    waitedMs,
    qualityDegraded: degraded,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ───────────────────────────────────────────────────────────────────────
// Helpers for slot classification — used by the schema layer to tag
// slots without each template author having to think about it.
// ───────────────────────────────────────────────────────────────────────

/** Slot names that are always premium-class regardless of slot type. */
const ALWAYS_PREMIUM_NAMES = new Set([
  "headline", "subhead", "tagline", "positioning", "description",
  "displayName", "restaurantName", "brandTagline",
]);

/** Slot names that are always mechanical regardless of slot type. */
const ALWAYS_MECHANICAL_NAMES = new Set([
  "href", "url", "imageUrl", "heroPhotoUrl",
  "showCta", "showMetrics", "showBillingToggle", "showZoobiconSignature",
  "highlighted", "brandMonogram",
]);

/**
 * Infer a slot's quality class from its name + type. Used during
 * slot-stream generation to pick the right routing tier for each slot.
 *
 * If a slot is explicitly tagged with `qualityClass` in its schema
 * (future schema extension), that wins. Otherwise we infer.
 */
export function inferQualityClass(
  slotName: string,
  slotType: string,
): QualityClass {
  if (ALWAYS_PREMIUM_NAMES.has(slotName)) return "premium";
  if (ALWAYS_MECHANICAL_NAMES.has(slotName)) return "mechanical";

  // Type-based heuristics
  if (slotType === "url" || slotType === "icon" || slotType === "boolean") {
    return "mechanical";
  }
  if (slotType === "enum" || slotType === "number" || slotType === "color") {
    return "mechanical";
  }

  // Text + richText slots default to acceptable unless their name
  // matches a premium pattern.
  if (/^(hero|brand|cta|primary|featured)/i.test(slotName)) {
    return "premium";
  }

  return "acceptable";
}

/** Reset state — used by tests. */
export function resetQualityRouter(): void {
  for (const p of ["claude", "openai", "gemini"] as LLMProvider[]) {
    STATE[p] = { recentFailures: 0, cooldownUntilMs: 0 };
  }
}
