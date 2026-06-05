/**
 * API bank — KILLER-MOVES-BUILDER.md #B21
 *
 * Proactive multi-provider sharding for AI requests. Where the
 * existing callLLMWithFailover only switches providers AFTER a rate-
 * limit hits, this module distributes requests across all healthy
 * providers BEFORE rate-limits trigger.
 *
 * Why: at 1M builds/day single-vendor on Anthropic, we'd burn through
 * commercial-tier rate limits in hours. Spreading across Anthropic +
 * OpenAI + Gemini proactively 3x's effective capacity without paying
 * for any new infrastructure — we already have all three API keys.
 *
 * Strategy:
 *   1. Each provider has a per-minute token budget (set per tier).
 *   2. Every request decrements the chosen provider's budget by the
 *      estimated token cost.
 *   3. Budgets refill every minute (sliding window).
 *   4. The picker chooses the provider with the most remaining
 *      headroom. If multiple are tied, prefer the one with the lowest
 *      recent failure rate.
 *   5. Provider failure (5xx, rate-limit, timeout) bumps its health
 *      score down for 60s — picker avoids it until it recovers.
 *
 * In-process state — no Redis dependency. State resets on cold-boot,
 * which is fine: rate-limit budgets are conservative anyway, and a
 * cold node simply starts evenly distributed.
 */

import type { LLMRequest, LLMResponse, LLMProvider } from "@/lib/llm-provider";
import { callLLM, getAvailableProviders, isTransientLLMError } from "@/lib/llm-provider";
import { getDeprioritisedProviders } from "@/lib/flywheel/self-healing";

// ───────────────────────────────────────────────────────────────────────
// Per-provider configuration
//
// Token budgets reflect Anthropic Tier 4 (~$5000/mo committed),
// OpenAI Tier 4, Gemini paid tier. Conservative — the real limits
// are higher but we want a safety margin so a traffic spike doesn't
// blow through and start 429ing.
// ───────────────────────────────────────────────────────────────────────

interface ProviderBudget {
  /** Tokens per minute allowed before we treat this provider as full. */
  tokensPerMinute: number;
  /** Requests per minute (some providers cap by request count too). */
  requestsPerMinute: number;
  /** Default model used when the picker selects this provider. */
  defaultModel: string;
}

const PROVIDER_BUDGETS: Record<LLMProvider, ProviderBudget> = {
  claude: {
    tokensPerMinute: 400_000, // Tier 4 input+output for Sonnet/Haiku combined
    requestsPerMinute: 4_000,
    defaultModel: "claude-haiku-4-5",
  },
  openai: {
    tokensPerMinute: 800_000, // Tier 4 gpt-4o
    requestsPerMinute: 10_000,
    defaultModel: "gpt-4o-mini",
  },
  gemini: {
    tokensPerMinute: 200_000,
    requestsPerMinute: 1_000,
    defaultModel: "gemini-2.5-flash",
  },
};

// ───────────────────────────────────────────────────────────────────────
// In-process state
// ───────────────────────────────────────────────────────────────────────

interface ProviderState {
  /** Tokens used in the current sliding minute. */
  tokensUsed: number;
  /** Requests issued in the current sliding minute. */
  requestsUsed: number;
  /** Window-start timestamp (ms). Resets when current ms > windowStart + 60000. */
  windowStartMs: number;
  /** Last time we saw a non-transient failure from this provider. */
  lastFailureMs: number;
  /** Count of failures in the last 60s. */
  recentFailures: number;
  /** When the next forced revisit should happen for a sidelined provider. */
  cooldownUntilMs: number;
}

const STATE: Record<LLMProvider, ProviderState> = {
  claude: { tokensUsed: 0, requestsUsed: 0, windowStartMs: 0, lastFailureMs: 0, recentFailures: 0, cooldownUntilMs: 0 },
  openai: { tokensUsed: 0, requestsUsed: 0, windowStartMs: 0, lastFailureMs: 0, recentFailures: 0, cooldownUntilMs: 0 },
  gemini: { tokensUsed: 0, requestsUsed: 0, windowStartMs: 0, lastFailureMs: 0, recentFailures: 0, cooldownUntilMs: 0 },
};

const WINDOW_MS = 60_000;
const COOLDOWN_AFTER_FAILURE_MS = 30_000;
const MAX_RECENT_FAILURES_BEFORE_SIDELINE = 3;

function rotateWindowIfNeeded(provider: LLMProvider): void {
  const now = Date.now();
  const s = STATE[provider];
  if (now - s.windowStartMs >= WINDOW_MS) {
    s.tokensUsed = 0;
    s.requestsUsed = 0;
    s.windowStartMs = now;
    // Failure counter decays with the window too, so a provider that
    // had a bad minute is given a fresh chance to recover.
    s.recentFailures = Math.max(0, s.recentFailures - 1);
  }
}

function headroom(provider: LLMProvider): number {
  rotateWindowIfNeeded(provider);
  const s = STATE[provider];
  const b = PROVIDER_BUDGETS[provider];
  const tokenHeadroom = 1 - s.tokensUsed / b.tokensPerMinute;
  const requestHeadroom = 1 - s.requestsUsed / b.requestsPerMinute;
  return Math.min(tokenHeadroom, requestHeadroom);
}

function isSidelined(provider: LLMProvider): boolean {
  const s = STATE[provider];
  if (Date.now() < s.cooldownUntilMs) return true;
  if (s.recentFailures >= MAX_RECENT_FAILURES_BEFORE_SIDELINE) return true;
  return false;
}

// ───────────────────────────────────────────────────────────────────────
// Picker
//
// Returns the provider that should handle the next request. If all
// providers are sidelined or over budget, returns the LEAST exhausted
// one anyway — better to attempt and fail than to refuse outright.
// ───────────────────────────────────────────────────────────────────────

export interface PickResult {
  provider: LLMProvider;
  model: string;
  /** True when the picker is forced to use a sidelined / over-budget
   *  provider. Caller may want to surface a warning to the user. */
  degraded: boolean;
  /** Snapshot of headroom-per-provider for telemetry. */
  headrooms: Record<LLMProvider, number>;
}

export function pickProvider(opts?: { preferredModel?: string }): PickResult {
  const available = getAvailableProviders();
  const headrooms: Record<LLMProvider, number> = {
    claude: headroom("claude"),
    openai: headroom("openai"),
    gemini: headroom("gemini"),
  };

  // Step 1: providers configured + not sidelined + with positive headroom.
  let candidates = available.filter((p) => !isSidelined(p) && headrooms[p] > 0.05);

  // Step 2: relax — providers configured + not sidelined (even at low headroom).
  if (candidates.length === 0) {
    candidates = available.filter((p) => !isSidelined(p));
  }

  // Step 3: full degraded — all sidelined. Pick least exhausted anyway.
  let degraded = false;
  if (candidates.length === 0) {
    candidates = available;
    degraded = true;
  }

  // If no providers are available at all, error.
  if (candidates.length === 0) {
    throw new Error(
      "No AI providers configured. Set at least one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_AI_API_KEY",
    );
  }

  // Pick the candidate with maximum headroom.
  candidates.sort((a, b) => headrooms[b] - headrooms[a]);
  const winner = candidates[0];

  // If a specific model was requested AND the winner is that model's
  // provider, honour the request. Otherwise use the provider's default.
  let model = PROVIDER_BUDGETS[winner].defaultModel;
  if (opts?.preferredModel) {
    const preferredProvider = guessProviderFromModel(opts.preferredModel);
    if (preferredProvider === winner) model = opts.preferredModel;
  }

  return { provider: winner, model, degraded, headrooms };
}

function guessProviderFromModel(model: string): LLMProvider | null {
  if (model.startsWith("claude")) return "claude";
  if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
  if (model.startsWith("gemini")) return "gemini";
  return null;
}

// ───────────────────────────────────────────────────────────────────────
// Public entry — `bankedCall`
//
// Wraps callLLM. Picks a provider, decrements budget pre-flight,
// adjusts post-flight based on actual token usage. On failure, marks
// the provider as failing and retries with the next-best provider.
// ───────────────────────────────────────────────────────────────────────

export interface BankedCallResult extends LLMResponse {
  /** Whether the call went to the originally-preferred provider or a fallback. */
  shardedAway: boolean;
  /** Provider that actually handled the request. */
  pickedProvider: LLMProvider;
  /** Snapshot of all providers' headroom at the time of the pick. */
  headrooms: Record<LLMProvider, number>;
}

export async function bankedCall(req: LLMRequest): Promise<BankedCallResult> {
  // Estimate tokens (heuristic — 1 token ~ 4 chars).
  const estTokensIn = Math.ceil((req.userMessage.length + req.system.length) / 4);
  const estTokensOut = req.maxTokens || 2000;
  const estTokensTotal = estTokensIn + estTokensOut;

  // B29 self-healing — read the deprioritised set once per call. If
  // any providers are quarantined by the hourly self-heal cron, the
  // picker treats them as already sidelined.
  const deprioritised = await getDeprioritisedProviders().catch(() => new Set<string>());

  const preferredProvider = guessProviderFromModel(req.model);
  const triedProviders = new Set<LLMProvider>();
  let attempt = 0;
  let lastError: unknown;

  while (attempt < 3) {
    const pick = pickProvider({ preferredModel: req.model });
    // Self-healing kicks in: if the picker chose a deprioritised
    // provider, force-skip it and try the next attempt (which will
    // pick a different one because we sideline it locally).
    if (deprioritised.has(pick.provider) && !triedProviders.has(pick.provider)) {
      STATE[pick.provider].cooldownUntilMs = Date.now() + 60_000;
      triedProviders.add(pick.provider);
      attempt++;
      continue;
    }
    if (triedProviders.has(pick.provider)) {
      // Picker keeps recommending the same exhausted provider — bail.
      break;
    }
    triedProviders.add(pick.provider);

    // Pre-flight: reserve budget.
    rotateWindowIfNeeded(pick.provider);
    STATE[pick.provider].tokensUsed += estTokensTotal;
    STATE[pick.provider].requestsUsed += 1;

    try {
      const result = await callLLM({
        ...req,
        model: pick.model,
      });

      // Post-flight: replace estimate with actual usage.
      rotateWindowIfNeeded(pick.provider);
      const actualTokens = (result.inputTokens || 0) + (result.outputTokens || 0);
      STATE[pick.provider].tokensUsed = Math.max(
        0,
        STATE[pick.provider].tokensUsed - estTokensTotal + actualTokens,
      );

      // Success — slowly recover health.
      STATE[pick.provider].recentFailures = Math.max(0, STATE[pick.provider].recentFailures - 1);

      return {
        ...result,
        shardedAway: pick.provider !== preferredProvider,
        pickedProvider: pick.provider,
        headrooms: pick.headrooms,
      };
    } catch (err) {
      lastError = err;
      STATE[pick.provider].lastFailureMs = Date.now();
      STATE[pick.provider].recentFailures += 1;
      if (STATE[pick.provider].recentFailures >= MAX_RECENT_FAILURES_BEFORE_SIDELINE) {
        STATE[pick.provider].cooldownUntilMs = Date.now() + COOLDOWN_AFTER_FAILURE_MS;
      }
      // If error is fatal (auth, bad request), don't try the next provider.
      if (!isTransientLLMError(err)) throw err;
      attempt++;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("API bank exhausted: all providers failed or sidelined.");
}

// ───────────────────────────────────────────────────────────────────────
// Telemetry hooks — admin dashboard reads these
// ───────────────────────────────────────────────────────────────────────

export function getApiBankStatus(): {
  providers: Record<
    LLMProvider,
    {
      configured: boolean;
      headroom: number;
      tokensUsed: number;
      tokensPerMinute: number;
      requestsUsed: number;
      requestsPerMinute: number;
      recentFailures: number;
      sidelined: boolean;
    }
  >;
} {
  const available = new Set(getAvailableProviders());
  const result = {} as Record<LLMProvider, ReturnType<typeof providerSnapshot>>;
  for (const p of ["claude", "openai", "gemini"] as LLMProvider[]) {
    result[p] = providerSnapshot(p, available.has(p));
  }
  return { providers: result };
}

function providerSnapshot(provider: LLMProvider, configured: boolean) {
  rotateWindowIfNeeded(provider);
  const s = STATE[provider];
  const b = PROVIDER_BUDGETS[provider];
  return {
    configured,
    headroom: headroom(provider),
    tokensUsed: s.tokensUsed,
    tokensPerMinute: b.tokensPerMinute,
    requestsUsed: s.requestsUsed,
    requestsPerMinute: b.requestsPerMinute,
    recentFailures: s.recentFailures,
    sidelined: isSidelined(provider),
  };
}

/**
 * Resets the in-process state. Used by tests + admin "drain" action
 * when a provider's been manually rate-limited and we want to force
 * a clean reset.
 */
export function resetApiBank(): void {
  for (const p of ["claude", "openai", "gemini"] as LLMProvider[]) {
    STATE[p] = {
      tokensUsed: 0,
      requestsUsed: 0,
      windowStartMs: 0,
      lastFailureMs: 0,
      recentFailures: 0,
      cooldownUntilMs: 0,
    };
  }
}
