/**
 * Industry-aware component planner — KILLER-MOVES-BUILDER.md #B7.
 *
 * Maps a (category, industry, theme) tuple to the best-matching
 * slot-locked component id. Replaces the generic registry pick with
 * an industry-tuned variant when one exists.
 *
 * The planner reads three signals:
 *   1. category: navbar | hero | features | pricing | footer
 *   2. industry (from /api/generate/predict or the legacy planner)
 *   3. theme (editorial / light / warm / dark)
 *
 * For each category we return the SLOT REGISTRY id whose
 * `industries` + `themes` arrays best match. Falls back to the
 * generic variant when no industry-specific one exists.
 *
 * Example:
 *   pickComponentForIndustry({ category: "hero", industry: "restaurant", theme: "warm" })
 *     → "hero-restaurant-warm-slot"
 *
 *   pickComponentForIndustry({ category: "hero", industry: "saas", theme: "editorial" })
 *     → "hero-spotlight-slot"  (no SaaS-specific yet, returns generic)
 *
 *   pickComponentForIndustry({ category: "hero", industry: "portfolio", theme: "editorial" })
 *     → "hero-portfolio-editorial-slot"
 */

import type { ComponentSchema } from "./types";
import { HERO_SPOTLIGHT_SCHEMA } from "./templates/hero-spotlight";
import { NAVBAR_MINIMAL_SCHEMA } from "./templates/navbar-minimal";
import { FEATURES_BENTO_SCHEMA } from "./templates/features-bento";
import { PRICING_TIERS_SCHEMA } from "./templates/pricing-tiers";
import { FOOTER_EDITORIAL_SCHEMA } from "./templates/footer-editorial";
import { HERO_RESTAURANT_WARM_SCHEMA } from "./templates/by-industry/hero-restaurant-warm";
import { HERO_PORTFOLIO_EDITORIAL_SCHEMA } from "./templates/by-industry/hero-portfolio-editorial";

interface PlannerSchema extends ComponentSchema {
  /** How well this schema matches a given context — computed at pick time. */
  matchScore?: number;
}

// All schemas registered with the planner. As more industry variants
// land, append them here.
const ALL_SCHEMAS: PlannerSchema[] = [
  HERO_SPOTLIGHT_SCHEMA,
  HERO_RESTAURANT_WARM_SCHEMA,
  HERO_PORTFOLIO_EDITORIAL_SCHEMA,
  NAVBAR_MINIMAL_SCHEMA,
  FEATURES_BENTO_SCHEMA,
  PRICING_TIERS_SCHEMA,
  FOOTER_EDITORIAL_SCHEMA,
];

export interface PickContext {
  category: string;
  industry?: string;
  theme?: string;
}

/**
 * Pick the best slot-locked component id for the given context.
 * Returns null when no schema in the registry matches the category at
 * all (caller falls back to react-stream / generic component).
 */
export function pickComponentForIndustry(ctx: PickContext): string | null {
  const candidates = ALL_SCHEMAS.filter((s) => s.category === ctx.category);
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].id;

  // Score each candidate. Higher = better.
  const scored = candidates.map((s) => {
    let score = 0;

    // Theme match is worth a lot — wrong theme produces a visually
    // wrong site even if industry overlaps. e.g. picking the WARM
    // restaurant hero on an EDITORIAL theme would be jarring.
    if (s.themes && ctx.theme) {
      if (s.themes.includes(ctx.theme as "editorial" | "light" | "warm" | "dark")) {
        score += 10;
      } else {
        // Penalty for theme mismatch — better to fall back to a generic
        // variant with neutral theme than a wrong-theme specialist.
        score -= 5;
      }
    } else if (!s.themes || s.themes.length === 0) {
      // No theme constraint = universal. Small bonus.
      score += 1;
    }

    // Industry match is also valuable but slightly less than theme.
    if (s.industries && ctx.industry) {
      if (s.industries.includes(ctx.industry)) {
        score += 8;
      }
    } else if (!s.industries || s.industries.length === 0) {
      // No industry constraint = universal. Small bonus.
      score += 1;
    }

    // Tiebreaker: prefer narrower (more-specific) variants over
    // universal ones when scores are otherwise equal.
    const specificity =
      (s.industries?.length || 0) + (s.themes?.length || 0);
    if (specificity > 0) score += 0.5;

    return { id: s.id, score, name: s.name };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].id;
}

/**
 * Plan a complete page of slot-locked components for the given
 * context. Returns an ordered list of component ids (navbar first,
 * footer last). The slot-stream endpoint accepts this as
 * `componentIds`.
 */
export function planPageForIndustry(ctx: {
  industry?: string;
  theme?: string;
  /** Whether to include a pricing section. Defaults to true for SaaS,
   *  agency, education, ecommerce; false for portfolio, personal-brand,
   *  restaurant, wedding (those usually use a dedicated booking flow). */
  includePricing?: boolean;
}): string[] {
  const PRICING_INDUSTRIES = new Set([
    "saas", "agency", "startup", "education", "ecommerce", "fitness", "hospitality",
  ]);

  const includePricing =
    ctx.includePricing ?? (ctx.industry ? PRICING_INDUSTRIES.has(ctx.industry) : true);

  const order = [
    pickComponentForIndustry({ category: "navbar", industry: ctx.industry, theme: ctx.theme }),
    pickComponentForIndustry({ category: "hero", industry: ctx.industry, theme: ctx.theme }),
    pickComponentForIndustry({ category: "features", industry: ctx.industry, theme: ctx.theme }),
    includePricing ? pickComponentForIndustry({ category: "pricing", industry: ctx.industry, theme: ctx.theme }) : null,
    pickComponentForIndustry({ category: "footer", industry: ctx.industry, theme: ctx.theme }),
  ];

  return order.filter((id): id is string => id !== null);
}

/**
 * Introspection helper — used by tests + the admin /admin/builds
 * page to show which variants exist per category.
 */
export function listSlotLockedSchemas(): PlannerSchema[] {
  return ALL_SCHEMAS.slice();
}
