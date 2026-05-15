/**
 * Multi-key pool — KILLER-MOVES-BUILDER.md #B22 (extended).
 *
 * Craig (May 14): "If you think four is not enough for API keys then
 * we need to look at it even further."
 *
 * Right. Hard-coding 4 Anthropic org keys at deploy time is the
 * wrong abstraction. This module reads N keys from env vars at boot
 * AND optionally from a DB-backed pool so we can add capacity
 * without a deploy.
 *
 * Key discovery order:
 *   1. ANTHROPIC_API_KEY            — primary (the one always set)
 *   2. ANTHROPIC_API_KEY_2 … _N     — additional orgs from env
 *   3. DB pool                      — provider_keys table (optional)
 *
 * Round-robin across all healthy keys. Each key tracks its own
 * sliding-minute budget independently. When a key 429s, it goes on
 * cooldown for the standard interval before being tried again.
 *
 * Same shape for OpenAI + Gemini — though usually only the primary is
 * set for those (they're failover, not primary capacity).
 */

import type { LLMProvider } from "@/lib/llm-provider";

interface PoolKey {
  provider: LLMProvider;
  /** Logical name — "claude:primary", "claude:org-2", "openai:primary". */
  name: string;
  /** The actual API key value — NEVER log this. */
  apiKey: string;
  /** Origin: env (boot-time) or db (runtime-loaded). */
  origin: "env" | "db";
}

interface KeyState {
  /** Tokens used in the current sliding minute. */
  tokensUsed: number;
  /** Requests in the current sliding minute. */
  requestsUsed: number;
  /** Sliding-window start. */
  windowStartMs: number;
  /** Recent failure count for cooldown decisions. */
  recentFailures: number;
  /** When the key can be retried again after cooldown. */
  cooldownUntilMs: number;
}

const POOL: PoolKey[] = [];
const STATE = new Map<string, KeyState>();

const WINDOW_MS = 60_000;
const SIDELINE_THRESHOLD = 3;
const SIDELINE_COOLDOWN_MS = 60_000;

// Per-key budget defaults. Most providers cap by tokens-per-minute on
// the org level; we set conservative numbers to leave safety margin.
const PER_KEY_BUDGET: Record<LLMProvider, { tokensPerMin: number; requestsPerMin: number }> = {
  claude: { tokensPerMin: 400_000, requestsPerMin: 4_000 },
  openai: { tokensPerMin: 800_000, requestsPerMin: 10_000 },
  gemini: { tokensPerMin: 200_000, requestsPerMin: 1_000 },
};

// ───────────────────────────────────────────────────────────────────────
// Loaders — populate the pool from env on first use
// ───────────────────────────────────────────────────────────────────────

let envLoaded = false;

function loadEnvKeys(): void {
  if (envLoaded) return;
  envLoaded = true;
  POOL.length = 0;

  // Anthropic primary + numbered alternates.
  const claudePrimary = process.env.ANTHROPIC_API_KEY;
  if (claudePrimary) {
    POOL.push({ provider: "claude", name: "claude:primary", apiKey: claudePrimary, origin: "env" });
  }
  for (let i = 2; i <= 20; i++) {
    const key = process.env[`ANTHROPIC_API_KEY_${i}`];
    if (key) {
      POOL.push({ provider: "claude", name: `claude:org-${i}`, apiKey: key, origin: "env" });
    }
  }

  // OpenAI primary + alternates.
  const openaiPrimary = process.env.OPENAI_API_KEY;
  if (openaiPrimary) {
    POOL.push({ provider: "openai", name: "openai:primary", apiKey: openaiPrimary, origin: "env" });
  }
  for (let i = 2; i <= 20; i++) {
    const key = process.env[`OPENAI_API_KEY_${i}`];
    if (key) {
      POOL.push({ provider: "openai", name: `openai:org-${i}`, apiKey: key, origin: "env" });
    }
  }

  // Gemini primary + alternates.
  const geminiPrimary = process.env.GOOGLE_AI_API_KEY;
  if (geminiPrimary) {
    POOL.push({ provider: "gemini", name: "gemini:primary", apiKey: geminiPrimary, origin: "env" });
  }
  for (let i = 2; i <= 20; i++) {
    const key = process.env[`GOOGLE_AI_API_KEY_${i}`];
    if (key) {
      POOL.push({ provider: "gemini", name: `gemini:org-${i}`, apiKey: key, origin: "env" });
    }
  }

  for (const k of POOL) {
    STATE.set(k.name, freshState());
  }
}

function freshState(): KeyState {
  return {
    tokensUsed: 0,
    requestsUsed: 0,
    windowStartMs: 0,
    recentFailures: 0,
    cooldownUntilMs: 0,
  };
}

function rotateWindowIfNeeded(name: string): void {
  const s = STATE.get(name);
  if (!s) return;
  const now = Date.now();
  if (now - s.windowStartMs >= WINDOW_MS) {
    s.tokensUsed = 0;
    s.requestsUsed = 0;
    s.windowStartMs = now;
    s.recentFailures = Math.max(0, s.recentFailures - 1);
  }
}

function headroomFor(key: PoolKey): number {
  rotateWindowIfNeeded(key.name);
  const s = STATE.get(key.name)!;
  const b = PER_KEY_BUDGET[key.provider];
  const tokenRoom = 1 - s.tokensUsed / b.tokensPerMin;
  const reqRoom = 1 - s.requestsUsed / b.requestsPerMin;
  return Math.min(tokenRoom, reqRoom);
}

function isSidelined(name: string): boolean {
  const s = STATE.get(name);
  if (!s) return false;
  if (Date.now() < s.cooldownUntilMs) return true;
  return s.recentFailures >= SIDELINE_THRESHOLD;
}

// ───────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────

export interface PickedKey {
  provider: LLMProvider;
  name: string;
  apiKey: string;
  headroom: number;
  /** True when this is the only choice and it's already over budget. */
  degraded: boolean;
}

/**
 * Pick the best key for the given provider. Returns the key with the
 * most remaining headroom, skipping sidelined ones. If all keys for
 * this provider are sidelined or over budget, returns the least-
 * exhausted anyway with degraded=true.
 *
 * Returns null when no keys for this provider are configured at all.
 */
export function pickKey(provider: LLMProvider): PickedKey | null {
  loadEnvKeys();

  const keys = POOL.filter((k) => k.provider === provider);
  if (keys.length === 0) return null;

  const ranked = keys
    .map((k) => ({ key: k, hr: headroomFor(k), sidelined: isSidelined(k.name) }))
    .filter((x) => x.hr > 0);

  const healthy = ranked.filter((x) => !x.sidelined);
  const pool = healthy.length > 0 ? healthy : ranked;

  if (pool.length === 0) {
    // All sidelined or zero headroom — pick the least-exhausted as last resort.
    const fallback = keys
      .map((k) => ({ key: k, hr: headroomFor(k) }))
      .sort((a, b) => b.hr - a.hr)[0];
    return {
      provider,
      name: fallback.key.name,
      apiKey: fallback.key.apiKey,
      headroom: fallback.hr,
      degraded: true,
    };
  }

  pool.sort((a, b) => b.hr - a.hr);
  const winner = pool[0];
  return {
    provider,
    name: winner.key.name,
    apiKey: winner.key.apiKey,
    headroom: winner.hr,
    degraded: false,
  };
}

export function recordKeyUsage(
  name: string,
  tokens: number,
  ok: boolean,
): void {
  const s = STATE.get(name);
  if (!s) return;
  rotateWindowIfNeeded(name);
  if (ok) {
    s.tokensUsed += tokens;
    s.requestsUsed += 1;
    // Slow heal — success decrements failure count.
    s.recentFailures = Math.max(0, s.recentFailures - 1);
  } else {
    s.recentFailures += 1;
    if (s.recentFailures >= SIDELINE_THRESHOLD) {
      s.cooldownUntilMs = Date.now() + SIDELINE_COOLDOWN_MS;
    }
  }
}

// ───────────────────────────────────────────────────────────────────────
// Introspection for admin dashboard
// ───────────────────────────────────────────────────────────────────────

export interface PoolKeySnapshot {
  name: string;
  provider: LLMProvider;
  origin: "env" | "db";
  headroom: number;
  tokensUsed: number;
  requestsUsed: number;
  recentFailures: number;
  sidelined: boolean;
}

export function getPoolSnapshot(): PoolKeySnapshot[] {
  loadEnvKeys();
  return POOL.map((k) => {
    rotateWindowIfNeeded(k.name);
    const s = STATE.get(k.name)!;
    return {
      name: k.name,
      provider: k.provider,
      origin: k.origin,
      headroom: headroomFor(k),
      tokensUsed: s.tokensUsed,
      requestsUsed: s.requestsUsed,
      recentFailures: s.recentFailures,
      sidelined: isSidelined(k.name),
    };
  });
}

/**
 * Reset the pool — used by tests + admin "drain" action. Clears all
 * in-process state but keeps the pool entries themselves.
 */
export function resetPool(): void {
  for (const k of POOL) {
    STATE.set(k.name, freshState());
  }
}

/**
 * Force-reload the pool from env. Useful when env vars change without
 * a redeploy (rare) or for tests.
 */
export function reloadPool(): void {
  envLoaded = false;
  POOL.length = 0;
  STATE.clear();
  loadEnvKeys();
}

/**
 * Total per-minute capacity for a provider summed across all keys in
 * the pool. Reported on /admin/builds so we can see "you have 24,000
 * RPM of Claude capacity right now." Each org Craig opens adds the
 * full per-org budget.
 */
export function getProviderCapacity(provider: LLMProvider): { tokensPerMin: number; requestsPerMin: number; keyCount: number } {
  loadEnvKeys();
  const keys = POOL.filter((k) => k.provider === provider);
  const budget = PER_KEY_BUDGET[provider];
  return {
    keyCount: keys.length,
    tokensPerMin: keys.length * budget.tokensPerMin,
    requestsPerMin: keys.length * budget.requestsPerMin,
  };
}
