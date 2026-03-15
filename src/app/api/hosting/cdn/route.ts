import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory storage — would be backed by a database in production.
// ---------------------------------------------------------------------------
interface CachingRule {
  path: string;
  ttl: number;
  cacheControl: string;
}

interface CdnConfig {
  domain: string;
  status: "active" | "configuring" | "disabled";
  edgeLocations: number;
  cacheHitRate: number;
  cachingRules: CachingRule[];
  minify: boolean;
  compression: boolean;
  imageOptimization: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CachePurgeRecord {
  id: string;
  domain: string;
  paths: string[] | "all";
  status: "completed" | "in_progress";
  purgedAt: string;
}

const cdnConfigs = new Map<string, CdnConfig>();
const cachePurges: CachePurgeRecord[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function isValidDomain(d: string): boolean {
  return DOMAIN_RE.test(d) || SLUG_RE.test(d);
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  // Normalize to 0-1
  return ((hash >>> 0) % 1000) / 1000;
}

function defaultConfig(domain: string): CdnConfig {
  // Generate a deterministic but realistic cache hit rate between 85-99%
  const rand = seededRandom(domain);
  const cacheHitRate = Math.round((85 + rand * 14) * 100) / 100;

  return {
    domain,
    status: "active",
    edgeLocations: 275,
    cacheHitRate,
    cachingRules: [
      { path: "/*.html", ttl: 3600, cacheControl: "public, max-age=3600" },
      { path: "/*.css", ttl: 86400, cacheControl: "public, max-age=86400, immutable" },
      { path: "/*.js", ttl: 86400, cacheControl: "public, max-age=86400, immutable" },
      { path: "/images/*", ttl: 604800, cacheControl: "public, max-age=604800" },
      { path: "/fonts/*", ttl: 2592000, cacheControl: "public, max-age=2592000, immutable" },
    ],
    minify: true,
    compression: true,
    imageOptimization: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getPurgeHistory(domain: string): CachePurgeRecord[] {
  return cachePurges
    .filter((p) => p.domain === domain)
    .sort(
      (a, b) =>
        new Date(b.purgedAt).getTime() - new Date(a.purgedAt).getTime()
    )
    .slice(0, 20);
}

// ---------------------------------------------------------------------------
// GET /api/hosting/cdn?domain=...
// Returns CDN configuration for a domain including caching rules, edge
// locations, purge history, and cache hit rate.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get("domain");

    if (!domain) {
      return NextResponse.json(
        { error: "domain query parameter is required." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();

    if (!isValidDomain(normalizedDomain)) {
      return NextResponse.json(
        { error: "Invalid domain format." },
        { status: 400 }
      );
    }

    const config = cdnConfigs.get(normalizedDomain) ?? defaultConfig(normalizedDomain);
    const purgeHistory = getPurgeHistory(normalizedDomain);
    const lastPurge = purgeHistory.length > 0 ? purgeHistory[0].purgedAt : null;

    return NextResponse.json({
      domain: config.domain,
      status: config.status,
      edgeLocations: config.edgeLocations,
      cacheHitRate: config.cacheHitRate,
      config: {
        cachingRules: config.cachingRules,
        minify: config.minify,
        compression: config.compression,
        imageOptimization: config.imageOptimization,
      },
      lastPurge,
      purgeHistory,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/hosting/cdn — Configure CDN settings for a domain.
// Body: { domain, cachingRules?: [{path, ttl, cacheControl}],
//         minify?: boolean, compression?: boolean,
//         imageOptimization?: boolean }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      domain,
      cachingRules,
      minify,
      compression,
      imageOptimization,
    } = body as {
      domain?: string;
      cachingRules?: CachingRule[];
      minify?: boolean;
      compression?: boolean;
      imageOptimization?: boolean;
    };

    // --- Validation ---
    if (!domain) {
      return NextResponse.json(
        { error: "domain is required." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();

    if (!isValidDomain(normalizedDomain)) {
      return NextResponse.json(
        { error: "Invalid domain format." },
        { status: 400 }
      );
    }

    // Validate caching rules if provided
    if (cachingRules !== undefined) {
      if (!Array.isArray(cachingRules)) {
        return NextResponse.json(
          { error: "cachingRules must be an array." },
          { status: 400 }
        );
      }

      for (const rule of cachingRules) {
        if (!rule.path || typeof rule.path !== "string") {
          return NextResponse.json(
            { error: "Each caching rule must have a valid path string." },
            { status: 400 }
          );
        }
        if (typeof rule.ttl !== "number" || rule.ttl < 0 || rule.ttl > 31536000) {
          return NextResponse.json(
            { error: `Invalid TTL for path "${rule.path}". Must be between 0 and 31536000 seconds.` },
            { status: 400 }
          );
        }
        if (!rule.cacheControl || typeof rule.cacheControl !== "string") {
          return NextResponse.json(
            { error: `Each caching rule must have a cacheControl string.` },
            { status: 400 }
          );
        }
      }
    }

    // --- Merge config ---
    const current = cdnConfigs.get(normalizedDomain) ?? defaultConfig(normalizedDomain);

    if (cachingRules !== undefined) {
      current.cachingRules = cachingRules;
    }
    if (minify !== undefined) {
      current.minify = Boolean(minify);
    }
    if (compression !== undefined) {
      current.compression = Boolean(compression);
    }
    if (imageOptimization !== undefined) {
      current.imageOptimization = Boolean(imageOptimization);
    }

    current.status = "active";
    current.updatedAt = new Date().toISOString();
    cdnConfigs.set(normalizedDomain, current);

    const purgeHistory = getPurgeHistory(normalizedDomain);
    const lastPurge = purgeHistory.length > 0 ? purgeHistory[0].purgedAt : null;

    return NextResponse.json({
      domain: current.domain,
      status: current.status,
      edgeLocations: current.edgeLocations,
      cacheHitRate: current.cacheHitRate,
      config: {
        cachingRules: current.cachingRules,
        minify: current.minify,
        compression: current.compression,
        imageOptimization: current.imageOptimization,
      },
      lastPurge,
      updatedAt: current.updatedAt,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/hosting/cdn?domain=...&path=...
// Purge cache for specific path or entire domain (omit path for full purge).
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const domain = req.nextUrl.searchParams.get("domain");
    const path = req.nextUrl.searchParams.get("path");

    if (!domain) {
      return NextResponse.json(
        { error: "domain query parameter is required." },
        { status: 400 }
      );
    }

    const normalizedDomain = domain.toLowerCase();

    if (!isValidDomain(normalizedDomain)) {
      return NextResponse.json(
        { error: "Invalid domain format." },
        { status: 400 }
      );
    }

    const purgeId = randomUUID();
    const purge: CachePurgeRecord = {
      id: purgeId,
      domain: normalizedDomain,
      paths: path ? [path] : "all",
      status: "completed",
      purgedAt: new Date().toISOString(),
    };

    cachePurges.push(purge);

    // Update cache hit rate slightly after purge (simulates warming)
    const config = cdnConfigs.get(normalizedDomain);
    if (config) {
      // After purge, cache hit rate temporarily drops
      config.cacheHitRate = Math.max(
        85,
        Math.round((config.cacheHitRate - 2 + Math.random() * 3) * 100) / 100
      );
      config.updatedAt = new Date().toISOString();
      cdnConfigs.set(normalizedDomain, config);
    }

    return NextResponse.json({
      message: path
        ? `Cache purged for path "${path}" on ${normalizedDomain}.`
        : `Full cache purge completed for ${normalizedDomain}.`,
      purge,
      domain: normalizedDomain,
      status: "completed",
      edgeLocations: config?.edgeLocations ?? 275,
      cacheHitRate: config?.cacheHitRate ?? 92,
      lastPurge: purge.purgedAt,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
