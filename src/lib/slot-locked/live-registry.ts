/**
 * Hot-Swap Live Component Upgrades — KILLER-MOVES-BUILDER.md #B18,
 * INNOVATIONS.md §Innovation #4.
 *
 * Bolt and Lovable ship a site, then it freezes. Customer's deployed
 * code never improves unless they regenerate (which loses their edits).
 *
 * Zoobicon ships sites whose components are LIVE REFERENCES to our
 * registry. When we improve `hero-spotlight` v2 → v3 next week —
 * better animations, better mobile breakpoints, better accessibility —
 * every customer site using it auto-upgrades overnight. Slot values
 * (their content) are preserved; only the template renders better.
 *
 * Mechanism:
 *
 *   1. Customer site at `<slug>.zoobicon.sh` is a thin shell that
 *      hydrates with slot values fetched from /api/sites/<slug>/slots.
 *   2. Component templates are fetched from /api/components/<id>.tsx
 *      with a long-lived browser cache + short-lived CDN cache.
 *   3. We version templates internally. When a customer site renders,
 *      it asks for the LATEST stable version of each component. We
 *      bump the cache key when a new version ships → every site
 *      picks up the new template on next page-load.
 *   4. Per-customer opt-out: if the customer wants frozen versions,
 *      they pin a version on their site config. Otherwise = latest.
 *
 * Files in this commit:
 *   - this module: registry-version registry + version lookup helpers
 *   - /api/components/[id]/route.ts: serves template TSX with caching
 *   - DB column `pin_version` on sites table for per-customer pinning
 *     (added in a follow-up commit when sites table schema is touched)
 *
 * Marketing line worth saying out loud:
 *   "Your competitor's AI-built site is frozen in time. Yours improves
 *   every week without you touching it."
 */

import { HERO_SPOTLIGHT_SCHEMA, HERO_SPOTLIGHT_TEMPLATE } from "./templates/hero-spotlight";
import { NAVBAR_MINIMAL_SCHEMA, NAVBAR_MINIMAL_TEMPLATE } from "./templates/navbar-minimal";
import { FEATURES_BENTO_SCHEMA, FEATURES_BENTO_TEMPLATE } from "./templates/features-bento";
import { PRICING_TIERS_SCHEMA, PRICING_TIERS_TEMPLATE } from "./templates/pricing-tiers";
import { FOOTER_EDITORIAL_SCHEMA, FOOTER_EDITORIAL_TEMPLATE } from "./templates/footer-editorial";
import { HERO_RESTAURANT_WARM_SCHEMA, HERO_RESTAURANT_WARM_TEMPLATE } from "./templates/by-industry/hero-restaurant-warm";
import { HERO_PORTFOLIO_EDITORIAL_SCHEMA, HERO_PORTFOLIO_EDITORIAL_TEMPLATE } from "./templates/by-industry/hero-portfolio-editorial";

interface VersionedTemplate {
  /** The schema of the latest stable version. */
  schema: typeof HERO_SPOTLIGHT_SCHEMA;
  /** Template source TSX (mustache-style slot tokens). */
  template: string;
  /** Semantic version string. Bumped when the template ships changes
   *  that visibly differ from the previous render. Patch bumps for
   *  bug fixes; minor for additive improvements; major for slot-schema
   *  breaking changes (sites pinned to N-1 keep the old template). */
  version: string;
  /** When this version became the latest stable. */
  publishedAt: string;
  /** Short human-readable changelog entry. Surfaced to customers in
   *  the "Your site improved" notification. */
  changelog: string;
}

/**
 * The live template registry. Every entry has an immutable `version`
 * field — when we ship template changes, we bump the version and the
 * next time a customer site renders it picks up the new template.
 *
 * Pinning: if a customer pins their site to version "1.0.0" of
 * hero-spotlight (via the site config), they keep that template
 * even after we ship 1.1.0. Useful for white-label agencies who
 * want frozen renders for their clients.
 */
export const LIVE_REGISTRY: Record<string, VersionedTemplate> = {
  "hero-spotlight-slot": {
    schema: HERO_SPOTLIGHT_SCHEMA,
    template: HERO_SPOTLIGHT_TEMPLATE,
    version: "1.0.0",
    publishedAt: "2026-05-13",
    changelog: "Initial slot-locked release.",
  },
  "navbar-minimal-slot": {
    schema: NAVBAR_MINIMAL_SCHEMA,
    template: NAVBAR_MINIMAL_TEMPLATE,
    version: "1.0.0",
    publishedAt: "2026-05-13",
    changelog: "Initial slot-locked release.",
  },
  "features-bento-slot": {
    schema: FEATURES_BENTO_SCHEMA,
    template: FEATURES_BENTO_TEMPLATE,
    version: "1.0.0",
    publishedAt: "2026-05-13",
    changelog: "Initial slot-locked release.",
  },
  "pricing-tiers-slot": {
    schema: PRICING_TIERS_SCHEMA,
    template: PRICING_TIERS_TEMPLATE,
    version: "1.0.0",
    publishedAt: "2026-05-13",
    changelog: "Initial slot-locked release.",
  },
  "footer-editorial-slot": {
    schema: FOOTER_EDITORIAL_SCHEMA,
    template: FOOTER_EDITORIAL_TEMPLATE,
    version: "1.0.0",
    publishedAt: "2026-05-13",
    changelog: "Initial slot-locked release.",
  },
  "hero-restaurant-warm-slot": {
    schema: HERO_RESTAURANT_WARM_SCHEMA,
    template: HERO_RESTAURANT_WARM_TEMPLATE,
    version: "1.0.0",
    publishedAt: "2026-05-13",
    changelog: "Initial slot-locked release.",
  },
  "hero-portfolio-editorial-slot": {
    schema: HERO_PORTFOLIO_EDITORIAL_SCHEMA,
    template: HERO_PORTFOLIO_EDITORIAL_TEMPLATE,
    version: "1.0.0",
    publishedAt: "2026-05-13",
    changelog: "Initial slot-locked release.",
  },
};

export interface ComponentVersionInfo {
  id: string;
  version: string;
  publishedAt: string;
  changelog: string;
}

export function getLatestVersion(componentId: string): ComponentVersionInfo | null {
  const entry = LIVE_REGISTRY[componentId];
  if (!entry) return null;
  return {
    id: componentId,
    version: entry.version,
    publishedAt: entry.publishedAt,
    changelog: entry.changelog,
  };
}

/**
 * Resolve a customer's pinned version to a concrete template. If the
 * pin is null/undefined OR points at a version we no longer have
 * (very rare — we only delete majors after a 12-month grace period),
 * return the latest. Customers always get a working site.
 */
export function resolveTemplate(
  componentId: string,
  pinnedVersion?: string | null,
): VersionedTemplate | null {
  const entry = LIVE_REGISTRY[componentId];
  if (!entry) return null;
  // Today we only ship one version of each template. Pinning is a
  // forward-looking design — when v1.1.0 ships, this function reads
  // a versions table to return the pinned one. For now: always latest.
  if (pinnedVersion && pinnedVersion !== entry.version) {
    console.info(
      `[live-registry] customer pinned ${componentId}@${pinnedVersion}, ` +
        `serving latest ${entry.version} (older versions not yet kept in storage)`,
    );
  }
  return entry;
}

/**
 * Returns a digest that changes whenever ANY template in the registry
 * ships a new version. Used as the CDN cache-busting key — when this
 * digest changes, browser caches invalidate and customer sites
 * hot-swap to the new templates on next page-load.
 */
export function getRegistryDigest(): string {
  const parts = Object.entries(LIVE_REGISTRY).map(([id, t]) => `${id}@${t.version}`);
  parts.sort();
  let h = 5381;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
