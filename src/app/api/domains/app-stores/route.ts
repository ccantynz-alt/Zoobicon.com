import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/domains/app-stores?name=<appname>
 *
 * Checks whether an app with this name already exists on the Apple App
 * Store and Google Play Store.
 *
 * External services hit:
 *  - iTunes Search API (free, public, no auth):
 *      https://itunes.apple.com/search?term=<name>&entity=software&limit=5
 *  - Google Play search HTML scrape (no official API):
 *      https://play.google.com/store/search?q=<name>&c=apps
 *
 * Accuracy caveats:
 *  - iTunes is reliable — it's the real App Store index.
 *  - Google Play has no public search API. We scrape HTML and extract
 *    package IDs from href="/store/apps/details?id=...". Google
 *    periodically changes the HTML; if the scrape returns 0 results we
 *    return `available: true` with a note flagging potential scrape
 *    failure rather than silently claiming no conflicts.
 *  - "Conflict" = case-insensitive exact match OR close substring match
 *    against the searched name. The UI must treat these as "warning"
 *    not "blocker" — e.g. "Vocem" exists as a utility in the Play Store
 *    doesn't prevent shipping a fitness app called "Vocem".
 *
 * Response shape (strict):
 *   {
 *     name: "<sanitized>",
 *     ios: {
 *       available: boolean,
 *       conflicts: Array<{ name: string, developer: string, url: string, bundle_id: string|null }>
 *     },
 *     android: {
 *       available: boolean,
 *       conflicts: Array<{ name: string, developer: string, url: string, package: string|null }>,
 *       note?: string
 *     }
 *   }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const PROBE_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_MAX = 500;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

interface IosConflict {
  name: string;
  developer: string;
  url: string;
  bundle_id: string | null;
}

interface AndroidConflict {
  name: string;
  developer: string;
  url: string;
  package: string | null;
}

interface AppStoreResponse {
  name: string;
  ios: {
    available: boolean;
    conflicts: IosConflict[];
  };
  android: {
    available: boolean;
    conflicts: AndroidConflict[];
    note?: string;
  };
}

// ---------------------------------------------------------------------------
// LRU cache (module-level, bounded)
// ---------------------------------------------------------------------------

const CACHE = new Map<string, { result: AppStoreResponse; at: number }>();

function cacheGet(key: string): AppStoreResponse | null {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  CACHE.delete(key);
  CACHE.set(key, hit);
  return hit.result;
}

function cacheSet(key: string, result: AppStoreResponse) {
  if (CACHE.has(key)) CACHE.delete(key);
  CACHE.set(key, { result, at: Date.now() });
  while (CACHE.size > CACHE_MAX) {
    const oldest = CACHE.keys().next().value;
    if (!oldest) break;
    CACHE.delete(oldest);
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const nameParam = req.nextUrl.searchParams.get("name") || "";

    // Sanitize: trim, lowercase for the cache key + matching. Keep spaces
    // allowed because app names commonly include them (e.g. "my app").
    const sanitized = nameParam.trim().toLowerCase().slice(0, 80);

    if (!sanitized || sanitized.length < 2) {
      return NextResponse.json(
        { error: "name query parameter is required (minimum 2 characters)." },
        { status: 400 },
      );
    }

    const cached = cacheGet(sanitized);
    if (cached) {
      return NextResponse.json(cached);
    }

    const [ios, android] = await Promise.all([
      checkAppleStore(sanitized),
      checkPlayStore(sanitized),
    ]);

    const response: AppStoreResponse = {
      name: sanitized,
      ios,
      android,
    };

    cacheSet(sanitized, response);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[app-stores] Unexpected error:", message);
    return NextResponse.json(
      { error: `App store check failed: ${message}` },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// iOS — iTunes Search API
// ---------------------------------------------------------------------------

interface ITunesResult {
  trackName?: string;
  sellerName?: string;
  trackViewUrl?: string;
  bundleId?: string;
}

interface ITunesResponse {
  resultCount?: number;
  results?: ITunesResult[];
}

async function checkAppleStore(name: string): Promise<AppStoreResponse["ios"]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    name,
  )}&entity=software&limit=5&country=US`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(
        `[app-stores] iTunes Search API returned ${res.status} for name="${name}"`,
      );
      return { available: true, conflicts: [] };
    }

    const data = (await res.json()) as ITunesResponse;
    const results = Array.isArray(data.results) ? data.results : [];

    const conflicts: IosConflict[] = [];
    for (const r of results) {
      if (!r || typeof r.trackName !== "string") continue;
      if (!nameMatches(name, r.trackName)) continue;
      conflicts.push({
        name: r.trackName.trim().slice(0, 200),
        developer: typeof r.sellerName === "string" ? r.sellerName.trim().slice(0, 200) : "",
        url: typeof r.trackViewUrl === "string" ? r.trackViewUrl.slice(0, 500) : "",
        bundle_id:
          typeof r.bundleId === "string" && r.bundleId.trim().length > 0
            ? r.bundleId.trim().slice(0, 200)
            : null,
      });
    }

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  } catch (err) {
    console.error(
      `[app-stores] iTunes Search API failed for name="${name}":`,
      err instanceof Error ? err.message : err,
    );
    // Unknown upstream = be conservative and return available with no
    // conflicts. The API returning a transient error should not block
    // the UI from showing a result.
    return { available: true, conflicts: [] };
  }
}

// ---------------------------------------------------------------------------
// Android — Google Play HTML scrape
// ---------------------------------------------------------------------------

async function checkPlayStore(name: string): Promise<AppStoreResponse["android"]> {
  const url = `https://play.google.com/store/search?q=${encodeURIComponent(
    name,
  )}&c=apps&hl=en&gl=US`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(
        `[app-stores] Google Play scrape returned ${res.status} for name="${name}"`,
      );
      return {
        available: true,
        conflicts: [],
        note: `Google Play returned HTTP ${res.status}; could not verify Android conflicts.`,
      };
    }

    const html = await res.text();
    const conflicts = parsePlayStoreHtml(html, name).slice(0, 5);

    if (conflicts.length === 0) {
      // Distinguish "scrape worked, no matches" from "scrape broken" by
      // checking for a known signature of the search page. If the page
      // clearly didn't return results, flag it so the UI can show a
      // "coverage limited" caveat.
      const scrapeLooksHealthy =
        html.includes("/store/apps/details?id=") || html.includes("Play Store");

      return {
        available: true,
        conflicts: [],
        ...(scrapeLooksHealthy
          ? {}
          : {
              note: "Google Play HTML changed; Android coverage may be incomplete. Verify manually before launch.",
            }),
      };
    }

    return {
      available: false,
      conflicts,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[app-stores] Google Play scrape failed for name="${name}": ${message}`,
    );
    return {
      available: true,
      conflicts: [],
      note: `Google Play check unavailable (${message}).`,
    };
  }
}

/**
 * Parse up to 5 app results from Google Play search HTML.
 *
 * Approach: find all href="/store/apps/details?id=<package>" links,
 * dedupe by package, then walk the nearest surrounding HTML to
 * extract an app name (typically in an inner <span> or aria-label).
 * Google changes markup regularly — we keep the pattern liberal.
 */
function parsePlayStoreHtml(
  html: string,
  searchName: string,
): AndroidConflict[] {
  const out: AndroidConflict[] = [];
  const seen = new Set<string>();

  const linkRe = /href="\/store\/apps\/details\?id=([A-Za-z0-9_.]+)[^"]*"/g;
  let match: RegExpExecArray | null;

  while ((match = linkRe.exec(html)) !== null) {
    const pkg = match[1];
    if (!pkg || seen.has(pkg)) continue;
    seen.add(pkg);

    // Grab the nearest ~800 chars of surrounding HTML to mine for app
    // name + developer. Google's current markup keeps both within ~400
    // chars of the details link.
    const windowStart = Math.max(0, match.index - 400);
    const windowEnd = Math.min(html.length, match.index + 400);
    const surrounding = html.slice(windowStart, windowEnd);

    const appName = extractAppName(surrounding) || "";
    const developer = extractDeveloper(surrounding) || "";

    if (!appName) continue;
    if (!nameMatches(searchName, appName)) continue;

    out.push({
      name: appName.slice(0, 200),
      developer: developer.slice(0, 200),
      url: `https://play.google.com/store/apps/details?id=${pkg}`,
      package: pkg.slice(0, 200),
    });

    if (out.length >= 5) break;
  }

  return out;
}

/**
 * Best-effort app-name extraction from a Play Store HTML window.
 * Tries aria-label first (most stable), then the common title span.
 */
function extractAppName(window: string): string | null {
  // Pattern 1: aria-label on the outer link
  const aria = /aria-label="([^"]{2,120})"/i.exec(window);
  if (aria && aria[1]) {
    const v = aria[1].trim();
    if (v.length >= 2) return v;
  }
  // Pattern 2: title-like span (seen in recent Play Store markup)
  const span = /<span[^>]*>([A-Za-z0-9][^<]{1,120})<\/span>/i.exec(window);
  if (span && span[1]) {
    const v = span[1].trim();
    if (v.length >= 2) return v;
  }
  return null;
}

function extractDeveloper(window: string): string | null {
  // Developer links look like href="/store/apps/dev?id=..." in recent markup
  const devLink = /\/store\/apps\/dev[^"]*"[^>]*>([^<]{2,120})</i.exec(window);
  if (devLink && devLink[1]) {
    const v = devLink[1].trim();
    if (v.length >= 2) return v;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Name match heuristic
// ---------------------------------------------------------------------------

/**
 * Returns true if `candidate` is a plausible conflict for `searchName`.
 *
 * Rules:
 *   - Exact (case-insensitive) match → conflict.
 *   - Candidate word-starts-with the search name → conflict (e.g.
 *     search "vocem" matches "Vocem Pro", "Vocem: Notes").
 *   - Search name is a standalone word inside the candidate → conflict
 *     (e.g. "notes" matches "Vocem Notes").
 *   - Otherwise not a conflict.
 *
 * We deliberately do NOT do fuzzy/edit-distance matching — the App
 * Store already sorts hits by relevance and we cap at top 5. Over-
 * matching turns the UI into noise.
 */
function nameMatches(searchName: string, candidate: string): boolean {
  const a = searchName.toLowerCase().trim();
  const b = candidate.toLowerCase().trim();
  if (!a || !b) return false;
  if (a === b) return true;

  // Word-boundary substring match
  const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
  return re.test(b);
}
