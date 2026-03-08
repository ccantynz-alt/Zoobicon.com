import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// In-memory storage — would be backed by a database in production.
// ---------------------------------------------------------------------------
interface CdnConfig {
  siteId: string;
  cacheEverything: boolean;
  minify: { html: boolean; css: boolean; js: boolean };
  compression: "gzip" | "brotli" | "both" | "none";
  edgeCaching: boolean;
  smartRouting: boolean;
  imageOptimization: boolean;
  rocketLoader: boolean;
  updatedAt: string;
}

interface CachePurgeRecord {
  id: string;
  siteId: string;
  paths: string[] | "all";
  status: "completed" | "in_progress";
  purgedAt: string;
}

const cdnConfigs = new Map<string, CdnConfig>();
const cachePurges = new Map<string, CachePurgeRecord>();

// Internal storage — not exported to avoid Next.js route validation errors

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SITE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

function defaultConfig(siteId: string): CdnConfig {
  return {
    siteId,
    cacheEverything: false,
    minify: { html: false, css: false, js: false },
    compression: "both",
    edgeCaching: true,
    smartRouting: false,
    imageOptimization: false,
    rocketLoader: false,
    updatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// GET /api/hosting/cdn?siteId=...
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const siteId = req.nextUrl.searchParams.get("siteId");

    if (!siteId) {
      return NextResponse.json(
        { error: "siteId query parameter is required." },
        { status: 400 }
      );
    }

    const config = cdnConfigs.get(siteId) ?? defaultConfig(siteId);

    // Also return recent purge history
    const purges = Array.from(cachePurges.values())
      .filter((p) => p.siteId === siteId)
      .sort(
        (a, b) =>
          new Date(b.purgedAt).getTime() - new Date(a.purgedAt).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({ config, recentPurges: purges });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST /api/hosting/cdn — configure CDN or purge cache
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteId, action, settings, paths } = body as {
      siteId?: string;
      action?: string;
      settings?: Partial<Omit<CdnConfig, "siteId" | "updatedAt">>;
      paths?: string[];
    };

    // --- Validation -----------------------------------------------------------
    if (!siteId || !SITE_ID_RE.test(siteId)) {
      return NextResponse.json(
        { error: "A valid siteId is required (alphanumeric with hyphens)." },
        { status: 400 }
      );
    }

    // --- Cache purge flow -----------------------------------------------------
    if (action === "purge") {
      const purgeId = randomUUID();

      const purge: CachePurgeRecord = {
        id: purgeId,
        siteId,
        paths: paths && paths.length > 0 ? paths : "all",
        status: "completed",
        purgedAt: new Date().toISOString(),
      };

      cachePurges.set(purgeId, purge);

      return NextResponse.json(
        {
          message:
            purge.paths === "all"
              ? "Full cache purge completed."
              : `Purged ${(purge.paths as string[]).length} path(s).`,
          purge,
        },
        { status: 200 }
      );
    }

    // --- CDN configuration flow -----------------------------------------------
    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        {
          error:
            'Provide "settings" object to configure CDN, or set action to "purge" to clear cache.',
        },
        { status: 400 }
      );
    }

    const current = cdnConfigs.get(siteId) ?? defaultConfig(siteId);

    // Merge settings
    if (settings.cacheEverything !== undefined) {
      current.cacheEverything = Boolean(settings.cacheEverything);
    }
    if (settings.minify !== undefined) {
      if (typeof settings.minify !== "object" || settings.minify === null) {
        return NextResponse.json(
          { error: "minify must be an object with html, css, js booleans." },
          { status: 400 }
        );
      }
      current.minify = {
        html: Boolean(settings.minify.html ?? current.minify.html),
        css: Boolean(settings.minify.css ?? current.minify.css),
        js: Boolean(settings.minify.js ?? current.minify.js),
      };
    }
    if (settings.compression !== undefined) {
      const validCompressions = ["gzip", "brotli", "both", "none"] as const;
      if (
        !validCompressions.includes(
          settings.compression as (typeof validCompressions)[number]
        )
      ) {
        return NextResponse.json(
          {
            error: `compression must be one of: ${validCompressions.join(", ")}.`,
          },
          { status: 400 }
        );
      }
      current.compression = settings.compression as CdnConfig["compression"];
    }
    if (settings.edgeCaching !== undefined) {
      current.edgeCaching = Boolean(settings.edgeCaching);
    }
    if (settings.smartRouting !== undefined) {
      current.smartRouting = Boolean(settings.smartRouting);
    }
    if (settings.imageOptimization !== undefined) {
      current.imageOptimization = Boolean(settings.imageOptimization);
    }
    if (settings.rocketLoader !== undefined) {
      current.rocketLoader = Boolean(settings.rocketLoader);
    }

    current.updatedAt = new Date().toISOString();
    cdnConfigs.set(siteId, current);

    return NextResponse.json({ config: current });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
