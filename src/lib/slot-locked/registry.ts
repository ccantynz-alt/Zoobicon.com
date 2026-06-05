/**
 * Shared slot-locked registry — single source of truth for the
 * deterministic component templates (schema + template + example).
 *
 * Previously this map lived inline inside /api/generate/slot-stream. V2's
 * server-side renderer needs the same set, so it's extracted here and both
 * import it. Adding a template in ONE place now lights it up everywhere.
 */

import type { ComponentSchema, SlotValueMap } from "./types";

import { HERO_SPOTLIGHT_SCHEMA, HERO_SPOTLIGHT_TEMPLATE, HERO_SPOTLIGHT_EXAMPLE } from "./templates/hero-spotlight";
import { NAVBAR_MINIMAL_SCHEMA, NAVBAR_MINIMAL_TEMPLATE, NAVBAR_MINIMAL_EXAMPLE } from "./templates/navbar-minimal";
import { FEATURES_BENTO_SCHEMA, FEATURES_BENTO_TEMPLATE, FEATURES_BENTO_EXAMPLE } from "./templates/features-bento";
import { PRICING_TIERS_SCHEMA, PRICING_TIERS_TEMPLATE, PRICING_TIERS_EXAMPLE } from "./templates/pricing-tiers";
import { FOOTER_EDITORIAL_SCHEMA, FOOTER_EDITORIAL_TEMPLATE, FOOTER_EDITORIAL_EXAMPLE } from "./templates/footer-editorial";
import { STATS_STRIP_SCHEMA, STATS_STRIP_TEMPLATE, STATS_STRIP_EXAMPLE } from "./templates/stats-strip";
import { TESTIMONIALS_QUOTES_SCHEMA, TESTIMONIALS_QUOTES_TEMPLATE, TESTIMONIALS_QUOTES_EXAMPLE } from "./templates/testimonials-quotes";
import { CTA_BANNER_SCHEMA, CTA_BANNER_TEMPLATE, CTA_BANNER_EXAMPLE } from "./templates/cta-banner";
import { FAQ_ACCORDION_SCHEMA, FAQ_ACCORDION_TEMPLATE, FAQ_ACCORDION_EXAMPLE } from "./templates/faq-accordion";
import { HERO_RESTAURANT_WARM_SCHEMA, HERO_RESTAURANT_WARM_TEMPLATE, HERO_RESTAURANT_WARM_EXAMPLE } from "./templates/by-industry/hero-restaurant-warm";
import { HERO_PORTFOLIO_EDITORIAL_SCHEMA, HERO_PORTFOLIO_EDITORIAL_TEMPLATE, HERO_PORTFOLIO_EDITORIAL_EXAMPLE } from "./templates/by-industry/hero-portfolio-editorial";

export interface SlotRegistryEntry {
  schema: ComponentSchema;
  template: string;
  example: SlotValueMap;
}

export const SLOT_REGISTRY: Record<string, SlotRegistryEntry> = {
  "navbar-minimal-slot": { schema: NAVBAR_MINIMAL_SCHEMA, template: NAVBAR_MINIMAL_TEMPLATE, example: NAVBAR_MINIMAL_EXAMPLE },
  "hero-spotlight-slot": { schema: HERO_SPOTLIGHT_SCHEMA, template: HERO_SPOTLIGHT_TEMPLATE, example: HERO_SPOTLIGHT_EXAMPLE },
  "features-bento-slot": { schema: FEATURES_BENTO_SCHEMA, template: FEATURES_BENTO_TEMPLATE, example: FEATURES_BENTO_EXAMPLE },
  "stats-strip-slot": { schema: STATS_STRIP_SCHEMA, template: STATS_STRIP_TEMPLATE, example: STATS_STRIP_EXAMPLE },
  "testimonials-quotes-slot": { schema: TESTIMONIALS_QUOTES_SCHEMA, template: TESTIMONIALS_QUOTES_TEMPLATE, example: TESTIMONIALS_QUOTES_EXAMPLE },
  "pricing-tiers-slot": { schema: PRICING_TIERS_SCHEMA, template: PRICING_TIERS_TEMPLATE, example: PRICING_TIERS_EXAMPLE },
  "faq-accordion-slot": { schema: FAQ_ACCORDION_SCHEMA, template: FAQ_ACCORDION_TEMPLATE, example: FAQ_ACCORDION_EXAMPLE },
  "cta-banner-slot": { schema: CTA_BANNER_SCHEMA, template: CTA_BANNER_TEMPLATE, example: CTA_BANNER_EXAMPLE },
  "footer-editorial-slot": { schema: FOOTER_EDITORIAL_SCHEMA, template: FOOTER_EDITORIAL_TEMPLATE, example: FOOTER_EDITORIAL_EXAMPLE },
  // Industry hero variants — planner picks these on industry+theme match.
  "hero-restaurant-warm-slot": { schema: HERO_RESTAURANT_WARM_SCHEMA, template: HERO_RESTAURANT_WARM_TEMPLATE, example: HERO_RESTAURANT_WARM_EXAMPLE },
  "hero-portfolio-editorial-slot": { schema: HERO_PORTFOLIO_EDITORIAL_SCHEMA, template: HERO_PORTFOLIO_EDITORIAL_TEMPLATE, example: HERO_PORTFOLIO_EDITORIAL_EXAMPLE },
};

export function getSlotEntry(id: string): SlotRegistryEntry | undefined {
  return SLOT_REGISTRY[id];
}
