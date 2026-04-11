/**
 * Zoobicon Component Registry — Industry-Aware Image System
 *
 * Every base component in the registry hardcodes a set of Unsplash photo IDs
 * (mountains for a gallery, watches for ecommerce, dashboards for features,
 * etc.). When the builder generates a site, those photos ship regardless of
 * the user's prompt — which means a restaurant site gets tech dashboards and
 * a SaaS site gets mountain photos.
 *
 * This module fixes that. It exposes:
 *
 *   detectIndustry(prompt)     — regex-based industry classifier
 *   swapImagesForIndustry(...) — deterministic sliding-window replacement
 *                                 of every `images.unsplash.com/photo-<id>`
 *                                 URL in a code string with an ID drawn from
 *                                 the matching industry pool
 *
 * The swap is idempotent when the pool contains the already-used IDs, and
 * deterministic per (industry, component) pair so Sandpack renders stably
 * across hot reloads.
 *
 * Only photo IDs that are already proven to exist in this codebase are used
 * here — no made-up IDs. This keeps 404s at zero without requiring an
 * Unsplash API key.
 */

export type Industry =
  | "tech"
  | "saas"
  | "agency"
  | "creative"
  | "portfolio"
  | "ecommerce"
  | "food"
  | "wellness"
  | "editorial";

/**
 * Curated image pools — each entry is a bare Unsplash photo ID
 * (without the `photo-` prefix or query-string). The pool is cycled through
 * in order as a sliding window during substitution.
 *
 * All IDs below are drawn from the pool already wired into
 * heroes.ts / features.ts / testimonials.ts / sections.ts / extras.ts and
 * are therefore known-good.
 */
const POOLS: Record<Industry, string[]> = {
  // Tech / SaaS / startup — workspace + team + device moods
  tech: [
    "1517248135467-4c7edcad34c4", // monitor workspace glow
    "1460925895917-afdab827c52f", // laptop + code
    "1488590528505-98d2b5aba04b", // macro keyboard
    "1551288049-bebda4e38f71",    // business meeting
    "1558494949-ef010cbdcc31",    // analytics dashboard
    "1551434678-e076c223a692",    // modern workspace
    "1563986768609-322da13575f2", // strategy session
    "1522202176988-66273c2fd55f", // remote team
  ],
  saas: [
    "1460925895917-afdab827c52f",
    "1488590528505-98d2b5aba04b",
    "1517248135467-4c7edcad34c4",
    "1558494949-ef010cbdcc31",
    "1551434678-e076c223a692",
    "1563986768609-322da13575f2",
    "1522202176988-66273c2fd55f",
    "1573497019940-1c28c88b4f3e", // video conference
  ],

  // Agency / consulting — people + collaboration + portraits
  agency: [
    "1551288049-bebda4e38f71",
    "1522202176988-66273c2fd55f",
    "1573497019940-1c28c88b4f3e",
    "1560250097-0b93528c311a", // portrait
    "1580489944761-15a19d654956", // portrait
    "1522071820081-009f0129c71c", // studio portrait
    "1563986768609-322da13575f2",
    "1551434678-e076c223a692",
  ],

  // Creative / portfolio / photography — landscape + texture
  creative: [
    "1506905925346-21bda4d32df4", // mountain vista
    "1519681393784-d120267933ba", // starlit peaks
    "1470071459604-3b5ec3a7fe05", // forest path
    "1441974231531-c6227db76b6e", // sunlit canopy
    "1507525428034-b723cf961d3e", // ocean shore
    "1469474968028-56623f02e42e", // golden valley
    "1472214103451-9374bd1c798e", // neutral landscape
    "1465056836900-8f1e940f2114", // earth from above
  ],
  portfolio: [
    "1506905925346-21bda4d32df4",
    "1519681393784-d120267933ba",
    "1470071459604-3b5ec3a7fe05",
    "1441974231531-c6227db76b6e",
    "1507525428034-b723cf961d3e",
    "1469474968028-56623f02e42e",
    "1522071820081-009f0129c71c",
    "1580489944761-15a19d654956",
  ],

  // E-commerce / retail — products on paper / studio
  ecommerce: [
    "1523275335684-37898b6baf30", // minimal watch
    "1505740420928-5e560c06d30e", // headphones
    "1491553895911-0055eca6402d", // sneakers
    "1572635196237-14b3f281503f", // sunglasses
    "1551434678-e076c223a692",    // studio still life
    "1563986768609-322da13575f2",
    "1560250097-0b93528c311a",
    "1580489944761-15a19d654956",
  ],

  // Food / restaurant — no trusted food IDs in the current pool yet.
  // Use warm, hand/craft-adjacent imagery as a temporary bridge until the
  // registry gets proper food photography.
  food: [
    "1522071820081-009f0129c71c",
    "1551288049-bebda4e38f71",
    "1522202176988-66273c2fd55f",
    "1560250097-0b93528c311a",
    "1580489944761-15a19d654956",
    "1573497019940-1c28c88b4f3e",
    "1523275335684-37898b6baf30",
    "1551434678-e076c223a692",
  ],

  // Wellness / fitness / health — nature + stillness
  wellness: [
    "1507525428034-b723cf961d3e",
    "1469474968028-56623f02e42e",
    "1470071459604-3b5ec3a7fe05",
    "1441974231531-c6227db76b6e",
    "1506905925346-21bda4d32df4",
    "1519681393784-d120267933ba",
    "1465056836900-8f1e940f2114",
    "1472214103451-9374bd1c798e",
  ],

  // Editorial / default — the restrained mix, anchors every fallback
  editorial: [
    "1522071820081-009f0129c71c",
    "1560250097-0b93528c311a",
    "1580489944761-15a19d654956",
    "1506905925346-21bda4d32df4",
    "1469474968028-56623f02e42e",
    "1551288049-bebda4e38f71",
    "1573497019940-1c28c88b4f3e",
    "1517248135467-4c7edcad34c4",
  ],
};

/**
 * Simple keyword-weighted classifier. Runs once per build and returns the
 * best-matching industry — or "editorial" as the neutral default.
 */
export function detectIndustry(prompt: string): Industry {
  const p = prompt.toLowerCase();

  const scores: Record<Industry, number> = {
    tech: 0,
    saas: 0,
    agency: 0,
    creative: 0,
    portfolio: 0,
    ecommerce: 0,
    food: 0,
    wellness: 0,
    editorial: 0,
  };

  const hits = (industry: Industry, words: string[], weight = 1) => {
    for (const w of words) if (p.includes(w)) scores[industry] += weight;
  };

  hits("saas", ["saas", "platform", "dashboard", "b2b", "subscription", "analytics"], 2);
  hits("saas", ["software", "tool", "product", "startup"], 1);

  hits("tech", ["ai", "ml", "developer", "devtool", "api", "cli", "infrastructure", "cyber", "security"], 2);
  hits("tech", ["tech", "code", "engineer"], 1);

  hits("agency", ["agency", "consulting", "marketing", "branding", "firm", "studio"], 2);

  hits("portfolio", ["portfolio", "photographer", "illustrator", "designer"], 2);
  hits("creative", ["creative", "art", "gallery", "exhibition"], 2);

  hits("ecommerce", ["shop", "store", "ecommerce", "retail", "fashion", "boutique", "product", "sell", "buy"], 2);

  hits("food", ["restaurant", "cafe", "bakery", "bistro", "dining", "menu", "chef", "kitchen", "cuisine", "food"], 2);

  hits("wellness", ["wellness", "yoga", "meditation", "fitness", "gym", "health", "therapy", "retreat"], 2);

  // Pick the winner
  let best: Industry = "editorial";
  let bestScore = 0;
  for (const key of Object.keys(scores) as Industry[]) {
    if (scores[key] > bestScore) {
      bestScore = scores[key];
      best = key;
    }
  }
  return best;
}

/**
 * Replace every `images.unsplash.com/photo-<id>` URL in a code string with
 * an ID drawn from the given industry's pool. Cycles deterministically.
 *
 * Leaves query-string (w, h, fit, q, etc.) intact, so the existing crop
 * hints and sizing survive.
 */
export function swapImagesForIndustry(code: string, industry: Industry): string {
  const pool = POOLS[industry] ?? POOLS.editorial;
  if (!pool || pool.length === 0) return code;

  let i = 0;
  return code.replace(
    /images\.unsplash\.com\/photo-[a-z0-9-]{11,}/g,
    () => {
      const id = pool[i % pool.length];
      i += 1;
      return `images.unsplash.com/photo-${id}`;
    }
  );
}

/** Exposed for testing + tooling */
export const INDUSTRY_POOLS = POOLS;
