import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/domains/handles?name=<handle>
 *
 * Checks whether the requested handle is available on X (Twitter),
 * Instagram, GitHub, TikTok, and YouTube by probing each platform's
 * public profile URL. No API keys required.
 *
 * Accuracy caveats:
 *  - X and Instagram aggressively rate-limit bot traffic. On 429 or
 *    consent-wall responses we return `available: null` (unknown).
 *  - GitHub is the most reliable — clean 404 vs 200 HTML profile.
 *  - TikTok / YouTube return 200 HTML for some non-profile routes; we
 *    treat only explicit 404 as available and 200 as taken.
 *  - We NEVER claim a handle is available based on a probe error.
 *    Unknown is unknown. The UI must show these differently.
 *
 * Response shape (strict):
 *   {
 *     name: "<sanitized-handle>",
 *     results: {
 *       x:         { available: boolean|null, url: string, checked_at: string },
 *       instagram: { available: boolean|null, url: string, checked_at: string },
 *       github:    { available: boolean|null, url: string, checked_at: string },
 *       tiktok:    { available: boolean|null, url: string, checked_at: string },
 *       youtube:   { available: boolean|null, url: string, checked_at: string }
 *     }
 *   }
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const PROBE_TIMEOUT_MS = 4000;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_MAX = 500;

// Bot-ish User-Agent tends to get blocked. Use a realistic Chrome UA.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

type Platform = "x" | "instagram" | "github" | "tiktok" | "youtube";

interface ProbeResult {
  available: boolean | null;
  url: string;
  checked_at: string;
}

type HandleResults = Record<Platform, ProbeResult>;

interface HandleResponse {
  name: string;
  results: HandleResults;
}

// ---------------------------------------------------------------------------
// LRU cache (module-level, bounded)
// ---------------------------------------------------------------------------

const CACHE = new Map<string, { result: HandleResponse; at: number }>();

function cacheGet(key: string): HandleResponse | null {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  // LRU refresh
  CACHE.delete(key);
  CACHE.set(key, hit);
  return hit.result;
}

function cacheSet(key: string, result: HandleResponse) {
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

    // Sanitize: lowercase, strip non-[a-z0-9_]. Handles are case-insensitive
    // on every platform we check, and none allow spaces or dots in the
    // profile slug — GitHub allows hyphens but for a cross-platform check
    // we take the strict intersection.
    const sanitized = nameParam
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 30);

    if (!sanitized) {
      return NextResponse.json(
        {
          error:
            "name query parameter is required. Use only letters, numbers, and underscores.",
        },
        { status: 400 },
      );
    }

    const cached = cacheGet(sanitized);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Run all five probes in parallel. Each probe is self-contained with
    // its own timeout and never throws — any failure is reflected as
    // `available: null`.
    const [xRes, igRes, ghRes, ttRes, ytRes] = await Promise.all([
      probeX(sanitized),
      probeInstagram(sanitized),
      probeGitHub(sanitized),
      probeTikTok(sanitized),
      probeYouTube(sanitized),
    ]);

    const response: HandleResponse = {
      name: sanitized,
      results: {
        x: xRes,
        instagram: igRes,
        github: ghRes,
        tiktok: ttRes,
        youtube: ytRes,
      },
    };

    cacheSet(sanitized, response);
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[handles] Unexpected error:", message);
    return NextResponse.json(
      { error: `Handle check failed: ${message}` },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Probes — each one returns a ProbeResult, never throws.
// ---------------------------------------------------------------------------

function now(): string {
  return new Date().toISOString();
}

async function probeHead(
  url: string,
  platform: Platform,
  handle: string,
): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      method: "GET", // HEAD is blocked by several of these platforms
      redirect: "manual",
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return res;
  } catch (err) {
    console.error(
      `[handles] ${platform} probe failed for handle="${handle}" url=${url}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

async function probeX(handle: string): Promise<ProbeResult> {
  const url = `https://x.com/${handle}`;
  const res = await probeHead(url, "x", handle);
  const checked_at = now();
  if (!res) return { available: null, url, checked_at };

  // X often returns:
  //  - 200 for both profile and "sorry, this account doesn't exist" SPA shell
  //  - 302 redirect to login for unauthenticated scrapers
  //  - 429 when rate-limited
  // We can only safely claim "available" on explicit 404. Everything else
  // is unknown.
  if (res.status === 404) return { available: true, url, checked_at };
  if (res.status === 429) return { available: null, url, checked_at };
  if (res.status === 200) {
    // X's SPA ships an identical 200 shell for both real and missing
    // profiles — we can't distinguish without JS execution. Flag unknown.
    return { available: null, url, checked_at };
  }
  // Any other status (3xx redirect to login, 5xx) → unknown
  return { available: null, url, checked_at };
}

async function probeInstagram(handle: string): Promise<ProbeResult> {
  const url = `https://www.instagram.com/${handle}/`;
  const res = await probeHead(url, "instagram", handle);
  const checked_at = now();
  if (!res) return { available: null, url, checked_at };

  // Instagram:
  //  - 404 on truly missing profile
  //  - 200 for profile AND for consent/login wall
  //  - 429 when rate-limited
  if (res.status === 404) return { available: true, url, checked_at };
  if (res.status === 429) return { available: null, url, checked_at };
  if (res.status === 200) {
    // Can't distinguish consent-wall 200 from real-profile 200 reliably
    // without parsing; be honest and return unknown.
    return { available: null, url, checked_at };
  }
  return { available: null, url, checked_at };
}

async function probeGitHub(handle: string): Promise<ProbeResult> {
  // GitHub is the most deterministic — 404 for missing, 200 for real user.
  const url = `https://github.com/${handle}`;
  const res = await probeHead(url, "github", handle);
  const checked_at = now();
  if (!res) return { available: null, url, checked_at };

  if (res.status === 404) return { available: true, url, checked_at };
  if (res.status === 200) return { available: false, url, checked_at };
  if (res.status === 429) return { available: null, url, checked_at };
  return { available: null, url, checked_at };
}

async function probeTikTok(handle: string): Promise<ProbeResult> {
  const url = `https://www.tiktok.com/@${handle}`;
  const res = await probeHead(url, "tiktok", handle);
  const checked_at = now();
  if (!res) return { available: null, url, checked_at };

  if (res.status === 404) return { available: true, url, checked_at };
  if (res.status === 200) return { available: false, url, checked_at };
  if (res.status === 429) return { available: null, url, checked_at };
  return { available: null, url, checked_at };
}

async function probeYouTube(handle: string): Promise<ProbeResult> {
  const url = `https://www.youtube.com/@${handle}`;
  const res = await probeHead(url, "youtube", handle);
  const checked_at = now();
  if (!res) return { available: null, url, checked_at };

  if (res.status === 404) return { available: true, url, checked_at };
  if (res.status === 200) return { available: false, url, checked_at };
  if (res.status === 429) return { available: null, url, checked_at };
  return { available: null, url, checked_at };
}
