/**
 * Slot-fill cache — KILLER-MOVES-BUILDER.md #B19,
 * INNOVATIONS.md §Innovation #6.
 *
 * At scale ~30% of customer prompts are semantically similar:
 *   - "modern SaaS landing page for analytics tool"
 *   - "modern SaaS landing page for analytics startup"
 *   - "modern SaaS landing for an analytics product"
 *
 * Free-form code generation cannot cache these — every output is a
 * unique React file. Slot-Locked Composition CAN — the JSON slot-fill
 * is hash-keyable on a normalised (prompt + theme + industry + brand)
 * tuple.
 *
 * Strategy:
 *   1. Normalise the prompt: lowercase, collapse whitespace, strip
 *      filler words, sort tokens to handle phrase reordering.
 *   2. Hash (normalised_prompt + theme + industry + component_id) →
 *      cache key.
 *   3. Cache slot-fill JSON in Neon for 7 days. Re-customise only the
 *      brand-specific slots (brandName, primaryColor, brand-specific
 *      copy) on cache hit.
 *
 * Math at 1M builds/day, ~50% cache hit rate, ~$0.06 cost-per-build:
 *   uncached: $60k/day
 *   cached:   $30k/day savings ≈ $11M/year cost advantage vs Bolt
 *
 * This module is the storage + lookup layer. The slot-stream endpoint
 * wires it in (lookup before LLM call; persist after).
 */

import { sql } from "@/lib/db";
import type { SlotValueMap } from "./types";

// Stop-words removed during normalisation. Order-independent matching
// requires we drop low-signal tokens so "for a SaaS tool" and "SaaS tool"
// hash to the same key.
const STOP_WORDS = new Set([
  "a", "an", "the", "for", "of", "in", "on", "to", "with", "and", "or",
  "is", "are", "be", "been", "being", "i", "we", "want", "need", "make",
  "me", "my", "mine", "us", "our", "ours", "your", "yours",
  "build", "create", "site", "website", "landing", "page", "pages",
  "modern", "simple", "clean", "professional", "beautiful", "stunning",
  "amazing", "great", "good", "nice", "please", "thanks", "thank", "you",
]);

const NORMALISE_RE = /[^\w\s]/g;

/**
 * Normalise a user prompt so semantically similar prompts produce the
 * same cache key. Tradeoffs:
 *   - keeps content words, drops stop-words → semantic-similar matches
 *   - sorts alphabetically → robust to phrase reordering
 *   - lowercase → robust to capitalisation
 *   - strips punctuation → robust to formatting variation
 */
export function normalisePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .replace(NORMALISE_RE, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
    .sort()
    .join(" ");
}

/**
 * Build the cache key for a (component, theme, industry, prompt) tuple.
 * Brand name is INCLUDED in the key — we want different brands to get
 * different slot-fills so we don't ship competitor copy. But the rest
 * of the slot-fill (structure, feature framing) can be reused across
 * brands in the same industry.
 *
 * Returns a SHA-256-ish hash via the same djb2 helper used elsewhere
 * (no crypto.subtle dependency so it works in Node + edge + tests).
 */
export function buildCacheKey(opts: {
  componentId: string;
  theme: string;
  industry: string;
  brandName: string;
  prompt: string;
}): string {
  const norm = normalisePrompt(opts.prompt);
  const payload = `${opts.componentId}|${opts.theme}|${opts.industry}|${opts.brandName.toLowerCase().trim()}|${norm}`;
  return djb2(payload);
}

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

// ───────────────────────────────────────────────────────────────────────
// Cache store — Neon-backed with TTL
// ───────────────────────────────────────────────────────────────────────

interface CacheRow {
  cache_key: string;
  component_id: string;
  slot_fill: SlotValueMap;
  hit_count: number;
  /** When the cached fill was last refreshed by an LLM call. */
  created_at: string;
}

const CACHE_TTL_DAYS = 7;

export interface SlotCacheLookup {
  hit: boolean;
  /** When hit=true, the cached slot-fill JSON. */
  slotFill?: SlotValueMap;
  /** Cache key used (returned regardless so caller can persist on miss). */
  cacheKey: string;
}

export async function lookupSlotCache(opts: {
  componentId: string;
  theme: string;
  industry: string;
  brandName: string;
  prompt: string;
}): Promise<SlotCacheLookup> {
  const cacheKey = buildCacheKey(opts);
  try {
    const ttlCutoff = new Date(Date.now() - CACHE_TTL_DAYS * 86_400_000).toISOString();
    const rows = await sql<CacheRow>`
      SELECT cache_key, component_id, slot_fill, hit_count, created_at::text
      FROM slot_cache
      WHERE cache_key = ${cacheKey}
        AND component_id = ${opts.componentId}
        AND created_at >= ${ttlCutoff}
      LIMIT 1
    `;
    if (rows.length === 0) return { hit: false, cacheKey };

    // Increment hit_count atomically — best-effort, doesn't block the
    // response.
    sql`
      UPDATE slot_cache
      SET hit_count = hit_count + 1, last_hit_at = NOW()
      WHERE cache_key = ${cacheKey} AND component_id = ${opts.componentId}
    `.catch((e: unknown) => {
      console.warn("[slot-cache] hit_count increment failed:", e instanceof Error ? e.message : e);
    });

    return { hit: true, slotFill: rows[0].slot_fill, cacheKey };
  } catch (err) {
    console.warn("[slot-cache] lookup failed (treating as miss):", err instanceof Error ? err.message : err);
    return { hit: false, cacheKey };
  }
}

export async function persistSlotCache(opts: {
  cacheKey: string;
  componentId: string;
  slotFill: SlotValueMap;
}): Promise<void> {
  try {
    await sql`
      INSERT INTO slot_cache (cache_key, component_id, slot_fill, hit_count, created_at, last_hit_at)
      VALUES (${opts.cacheKey}, ${opts.componentId}, ${JSON.stringify(opts.slotFill)}::jsonb, 0, NOW(), NOW())
      ON CONFLICT (cache_key, component_id) DO UPDATE SET
        slot_fill  = EXCLUDED.slot_fill,
        created_at = NOW(),
        last_hit_at = NOW()
    `;
  } catch (err) {
    console.warn("[slot-cache] persist failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}

/**
 * Brand-specific slot remap. On a cache hit, we have a generic
 * slot-fill that was generated for a different brand. Patch the
 * brand-specific slots (brandName / brandMonogram / copyright lines)
 * so the cached fill works for THIS customer.
 *
 * Returns a copy of the slot-fill with the patches applied.
 */
export function remapBrandSlots(
  slotFill: SlotValueMap,
  brand: { brandName?: string; brandMonogram?: string; copyrightYear?: number },
): SlotValueMap {
  const out: SlotValueMap = { ...slotFill };
  if (brand.brandName && typeof out.brandName === "string") {
    out.brandName = brand.brandName;
  }
  if (brand.brandMonogram && typeof out.brandMonogram === "string") {
    out.brandMonogram = brand.brandMonogram;
  } else if (brand.brandName && typeof out.brandMonogram === "string") {
    out.brandMonogram = brand.brandName.charAt(0).toUpperCase();
  }
  if (brand.copyrightYear && typeof out.copyrightLine === "string") {
    out.copyrightLine = (out.copyrightLine as string).replace(
      /\b(19|20)\d{2}\b/,
      String(brand.copyrightYear),
    );
  }
  return out;
}

/**
 * SQL DDL — appended to initSchema in db.ts.
 */
export const SLOT_CACHE_TABLE_DDL = `
CREATE TABLE IF NOT EXISTS slot_cache (
  cache_key    TEXT NOT NULL,
  component_id TEXT NOT NULL,
  slot_fill    JSONB NOT NULL,
  hit_count    INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_hit_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cache_key, component_id)
);
CREATE INDEX IF NOT EXISTS slot_cache_component_idx ON slot_cache (component_id);
CREATE INDEX IF NOT EXISTS slot_cache_last_hit_idx ON slot_cache (last_hit_at DESC);
`;
