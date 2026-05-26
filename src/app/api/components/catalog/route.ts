/**
 * GET /api/components/catalog
 *
 * Returns the full Full-Site Mode component registry grouped by
 * category, with just enough metadata for the plan-revision panel to
 * render a variant picker. Lightweight — no code, just IDs + names +
 * descriptions + tags. Cached at the edge for 5 minutes since the
 * registry only changes on a code deploy.
 *
 * Different from /api/components/registry which serves the
 * slot-locked schema metadata for the alternate generation path.
 * Both endpoints can coexist; this one is consumed only by
 * SitePlanPanel today.
 */

import { REGISTRY } from "@/lib/component-registry/store";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 300;

export async function GET(): Promise<Response> {
  // Group registry rows by category for cheap client-side lookup.
  const byCategory: Record<string, Array<{
    id: string;
    name: string;
    variant: string;
    description: string;
    tags: string[];
  }>> = {};
  for (const c of REGISTRY) {
    const list = byCategory[c.category] || (byCategory[c.category] = []);
    list.push({
      id: c.id,
      name: c.name,
      variant: c.variant,
      description: c.description,
      tags: c.tags,
    });
  }
  // Stable ordering — the panel renders dropdowns in this order.
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort((a, b) => a.variant.localeCompare(b.variant));
  }

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      total: REGISTRY.length,
      categories: Object.keys(byCategory).sort(),
      byCategory,
    },
    {
      headers: {
        "cache-control": "public, max-age=300, stale-while-revalidate=60",
      },
    },
  );
}
