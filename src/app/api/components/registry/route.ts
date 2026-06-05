/**
 * GET /api/components/registry — full inventory of slot-locked
 * components + their current versions.
 *
 * Customer sites call this once on cold-load to discover what's
 * available and compare against their pinned versions. The response
 * is small (~1KB), cached for 5 minutes at the CDN edge, and serves
 * as the source-of-truth for "did anything upgrade since last load?".
 *
 * Used by:
 *   - Customer site hydration shells (decide which TSX bundles to fetch)
 *   - /admin/builds dashboard (show which versions are live)
 *   - The "your site improved" weekly digest (diff against last week's digest)
 */

import { LIVE_REGISTRY, getRegistryDigest } from "@/lib/slot-locked/live-registry";

export const runtime = "edge";

export async function GET(): Promise<Response> {
  const components = Object.entries(LIVE_REGISTRY).map(([id, entry]) => ({
    id,
    version: entry.version,
    publishedAt: entry.publishedAt,
    changelog: entry.changelog,
    category: entry.schema.category,
    variant: entry.schema.variant,
    name: entry.schema.name,
    description: entry.schema.description,
    industries: entry.schema.industries || [],
    themes: entry.schema.themes || [],
    slotCount: entry.schema.slots.length,
  }));

  return Response.json(
    {
      digest: getRegistryDigest(),
      generatedAt: new Date().toISOString(),
      count: components.length,
      components,
    },
    {
      status: 200,
      headers: {
        "cache-control": "public, max-age=300, stale-while-revalidate=60, s-maxage=300",
      },
    },
  );
}
