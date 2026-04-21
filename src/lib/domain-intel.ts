/**
 * Shared domain-intelligence utilities.
 *
 * Consumed by:
 *   - src/app/api/domains/history/route.ts      (Wayback history)
 *   - src/app/api/domains/valuation/route.ts    (AI-driven resale valuation)
 *   - src/app/api/domains/drops/route.ts        (expiring-domain surfacing)
 *
 * Everything here is pure / stateless except the LruCache class, which each
 * route instantiates for its own TTL strategy.
 *
 * Keeping this in one file (rather than scattering helpers across routes)
 * means the drops endpoint can value 20 stub domains without HTTP self-
 * calling /valuation and inheriting its Anthropic latency.
 */

// ---------------------------------------------------------------------------
// LruCache — bounded, time-expiring key/value store
// ---------------------------------------------------------------------------

export interface LruEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Minimal LRU cache with per-entry TTL.
 *
 * - Maintains insertion/access order via Map iteration order (which is
 *   insertion order in spec, and we delete+reset on hit to simulate LRU).
 * - Stale entries are evicted lazily on read.
 * - When size exceeds `max`, the oldest entry is dropped.
 *
 * Not goroutine-safe — Node is single-threaded, so we don't care.
 */
export class LruCache<T> {
  private store = new Map<string, LruEntry<T>>();
  constructor(
    private readonly max: number,
    private readonly ttlMs: number,
  ) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency: delete + re-insert to push to the end of the map.
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }

  set(key: string, value: T): void {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    if (this.store.size > this.max) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

// ---------------------------------------------------------------------------
// Valuation heuristic
// ---------------------------------------------------------------------------

/**
 * Dictionary seed kept in sync with src/app/api/domains/search/route.ts.
 *
 * This is NOT a full English dictionary — it's a ~60-word seed of common
 * high-value English stems. When a domain's SLD matches one of these
 * exactly, we apply a brandability bonus. The real /valuation endpoint
 * enriches this with Claude's knowledge of comparable sales.
 */
export const DICTIONARY_SEEDS = new Set([
  "love", "care", "work", "flow", "rise", "edge", "peak", "core", "hub",
  "labs", "life", "time", "wave", "spark", "light", "dream", "cloud",
  "pixel", "atlas", "orbit", "nova", "echo", "path", "shift", "forge",
  "zen", "ember", "sage", "frost", "north", "south", "loop", "prism",
  "vector", "quantum", "stellar", "cosmic", "signal", "pulse", "lumen",
  "pace", "kinetic", "vault", "anchor", "helix", "vertex", "crown",
  "summit", "nimbus", "flux", "mint", "bolt", "zap", "fuse", "max",
  "apex", "nexus", "pilot", "forge", "craft", "guild", "echo", "verse",
]);

export interface HeuristicResult {
  low: number;
  high: number;
  midpoint: number;
  factors: string[];
}

/**
 * Split "example.com" → { sld: "example", tld: "com" }.
 * If the input has no dot, treat the whole thing as the SLD.
 */
export function splitDomain(domain: string): { sld: string; tld: string } {
  const clean = domain.toLowerCase().trim();
  const idx = clean.lastIndexOf(".");
  if (idx === -1) return { sld: clean, tld: "" };
  return { sld: clean.slice(0, idx), tld: clean.slice(idx + 1) };
}

const TLD_BASE: Record<string, number> = {
  com: 500,
  ai: 800,
  io: 400,
  app: 250,
  sh: 200,
  co: 200,
  net: 150,
  org: 150,
  dev: 200,
  me: 120,
  xyz: 80,
  us: 100,
};

/**
 * Pure valuation heuristic. Never calls the network. Returns a low/high band
 * plus a list of human-readable factors ("7 chars — short", "hyphen penalty",
 * "dictionary stem 'max'").
 *
 * The output is fed to Claude in /valuation so the model has a sane anchor
 * before adjusting for brandability, keyword demand, and comparable sales.
 *
 * Tiers:
 *   1. TLD base
 *   2. Length multiplier
 *   3. Penalties (hyphen, digits, consonant clusters)
 *   4. Bonuses (dictionary, vowel-bookended, one-syllable)
 *
 * The low/high band is ±40% around the computed midpoint — a deliberately
 * wide default because our heuristic alone is not authoritative.
 */
export function valueHeuristic(domain: string): HeuristicResult {
  const { sld, tld } = splitDomain(domain);
  const factors: string[] = [];

  // 1. TLD base
  const base = TLD_BASE[tld] ?? 100;
  factors.push(`.${tld || "unknown"} base $${base}`);

  // 2. Length multiplier
  const len = sld.length;
  let lengthMul = 1;
  if (len <= 3) lengthMul = 10;
  else if (len === 4) lengthMul = 5;
  else if (len === 5) lengthMul = 3;
  else if (len <= 7) lengthMul = 1.5;
  else if (len <= 10) lengthMul = 1;
  else lengthMul = 0.7;

  if (len <= 3) factors.push(`${len} chars — ultra-short`);
  else if (len <= 5) factors.push(`${len} chars — short`);
  else if (len <= 7) factors.push(`${len} chars — compact`);
  else if (len >= 11) factors.push(`${len} chars — long (penalty)`);

  // 3. Penalties
  let penaltyMul = 1;
  if (sld.includes("-")) {
    penaltyMul *= 0.6;
    factors.push("hyphen (penalty)");
  }
  if (/\d/.test(sld)) {
    // Only penalise if two or more digits — a single letter+digit mix
    // (e.g. "3m") can still be brandable.
    const digitCount = (sld.match(/\d/g) || []).length;
    if (digitCount >= 2) {
      penaltyMul *= 0.5;
      factors.push(`${digitCount} digits (penalty)`);
    } else {
      factors.push("contains digit");
    }
  }
  if (/[bcdfghjklmnpqrstvwxyz]{3,}/.test(sld)) {
    penaltyMul *= 0.8;
    factors.push("consonant cluster (penalty)");
  }

  // 4. Bonuses
  let bonusMul = 1;
  if (DICTIONARY_SEEDS.has(sld)) {
    bonusMul *= 1.5;
    factors.push(`dictionary stem '${sld}'`);
  } else {
    // Check if it CONTAINS a dictionary stem (e.g. "maxvault" contains "max")
    for (const seed of DICTIONARY_SEEDS) {
      if (seed.length >= 4 && sld.includes(seed)) {
        bonusMul *= 1.2;
        factors.push(`contains stem '${seed}'`);
        break;
      }
    }
  }
  if (/^[aeiou]/.test(sld) && /[aeiou]$/.test(sld) && sld.length >= 4) {
    bonusMul *= 1.2;
    factors.push("vowel-bookended");
  }
  // One-syllable heuristic: a single contiguous vowel run
  const vowelRuns = sld.replace(/[^aeiouy]+/g, " ").trim().split(/\s+/).filter(Boolean).length;
  if (vowelRuns === 1 && sld.length >= 4 && sld.length <= 7) {
    bonusMul *= 1.3;
    factors.push("one-syllable");
  }
  if (tld === "com") factors.push(".com premium");

  const midpoint = Math.max(25, Math.round(base * lengthMul * penaltyMul * bonusMul));
  const low = Math.max(15, Math.round(midpoint * 0.6));
  const high = Math.round(midpoint * 1.4);

  return { low, high, midpoint, factors };
}

// ---------------------------------------------------------------------------
// JSON extraction — depth-aware bracket matching
// ---------------------------------------------------------------------------

/**
 * Extract the first parseable JSON object from arbitrary LLM output.
 *
 * Handles:
 *   - Pure JSON `{...}`
 *   - JSON wrapped in ```json ... ``` fences
 *   - JSON preceded/followed by prose ("Here's the result: { ... }. Hope that helps!")
 *
 * Returns `null` if nothing parseable is found — callers MUST handle null
 * explicitly (no silent fallbacks).
 */
export function extractJsonObject<T = unknown>(text: string): T | null {
  if (!text || typeof text !== "string") return null;
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as T;
  } catch {
    // fall through to bracket walk
  }

  // Walk for the largest balanced {...} block
  const candidates: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== "{") continue;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = i; j < cleaned.length; j++) {
      const ch = cleaned[j];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          candidates.push({ start: i, end: j });
          break;
        }
      }
    }
  }

  candidates.sort((a, b) => b.end - b.start - (a.end - a.start));
  for (const c of candidates) {
    try {
      const parsed = JSON.parse(cleaned.slice(c.start, c.end + 1));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as T;
    } catch {
      // try next
    }
  }

  return null;
}

/**
 * Extract the first parseable JSON array from arbitrary LLM output.
 * Mirrors extractJsonObject for array payloads.
 */
export function extractJsonArray<T = unknown>(text: string): T[] | null {
  if (!text || typeof text !== "string") return null;
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    // fall through
  }

  const candidates: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] !== "[") continue;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let j = i; j < cleaned.length; j++) {
      const ch = cleaned[j];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "[") depth++;
      else if (ch === "]") {
        depth--;
        if (depth === 0) { candidates.push({ start: i, end: j }); break; }
      }
    }
  }

  candidates.sort((a, b) => b.end - b.start - (a.end - a.start));
  for (const c of candidates) {
    try {
      const parsed = JSON.parse(cleaned.slice(c.start, c.end + 1));
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // try next
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Domain validation
// ---------------------------------------------------------------------------

/**
 * Validate a domain is well-formed enough to look up. Rejects obvious
 * junk (spaces, protocols, paths) before we spend time calling Wayback /
 * Claude / etc.
 */
export function sanitizeDomain(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const clean = input
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, "");
  // Must have a dot and only [a-z0-9.-]
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(clean)) {
    return null;
  }
  if (clean.length > 253) return null;
  return clean;
}
