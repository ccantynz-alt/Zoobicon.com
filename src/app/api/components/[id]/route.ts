/**
 * GET /api/components/[id] — serves the latest stable slot-locked
 * template TSX for hot-swap upgrades.
 *
 * KILLER-MOVES-BUILDER.md #B18, INNOVATIONS.md §Innovation #4.
 *
 * Customer sites deployed at *.zoobicon.sh fetch their component
 * templates from this endpoint at render time. When we ship an
 * improved hero-spotlight v2 next week, every customer site that
 * uses it picks up the new template automatically on the next page
 * load — without the customer touching anything.
 *
 * Caching strategy:
 *   - CDN cache: 5 minutes (short — so version bumps propagate fast)
 *   - Browser cache: 1 hour with `stale-while-revalidate` 5 minutes
 *   - ETag = registry digest. When ANY template version bumps, the
 *     digest changes → browser revalidates → picks up the new TSX.
 *
 * The endpoint returns either the raw template TSX (`?format=tsx`) or
 * a metadata JSON (`?format=meta`, default) describing the latest
 * version + changelog. The customer site fetches both: meta for
 * version-check, TSX for hydration.
 */

import { NextRequest } from "next/server";
import { resolveTemplate, getLatestVersion, getRegistryDigest } from "@/lib/slot-locked/live-registry";

export const runtime = "edge"; // fast lookup, CDN-friendly

export async function GET(
  req: NextRequest,
  ctx: { params: { id: string } },
): Promise<Response> {
  const id = ctx.params.id;
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "meta";
  const pinned = url.searchParams.get("v") || undefined;

  const entry = resolveTemplate(id, pinned);
  if (!entry) {
    return Response.json(
      { error: `Component "${id}" not found in slot-locked registry.` },
      { status: 404 },
    );
  }

  const digest = getRegistryDigest();
  const ifNoneMatch = req.headers.get("if-none-match");
  const etag = `"${digest}-${id}-${entry.version}"`;
  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        etag,
        "cache-control": "public, max-age=3600, stale-while-revalidate=300, s-maxage=300",
      },
    });
  }

  if (format === "tsx") {
    return new Response(entry.template, {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        etag,
        "cache-control": "public, max-age=3600, stale-while-revalidate=300, s-maxage=300",
        "x-component-id": id,
        "x-component-version": entry.version,
      },
    });
  }

  // Default: meta JSON
  const meta = getLatestVersion(id);
  return Response.json(
    {
      ...meta,
      slots: entry.schema.slots.map((s) => s.name),
      registryDigest: digest,
    },
    {
      status: 200,
      headers: {
        etag,
        "cache-control": "public, max-age=3600, stale-while-revalidate=300, s-maxage=300",
      },
    },
  );
}
