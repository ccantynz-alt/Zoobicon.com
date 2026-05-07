import { NextRequest, NextResponse } from "next/server";

// Each platform check has a tight timeout — this whole endpoint must finish
// inside the function deadline even if every upstream is slow.
export const maxDuration = 15;

/**
 * Social handle availability checker.
 *
 * GET /api/handles/check?slug=mercury
 *
 * Returns availability for the username `mercury` across the platforms
 * founders care about most. Each platform is checked independently with a
 * short per-request timeout so one slow target can't block the others.
 *
 * Result shape per platform: true = available, false = taken, null = unknown
 * (rate limited, network error, anti-bot challenge, etc). The UI MUST treat
 * null as "we couldn't tell" — never as available.
 */

type Availability = boolean | null;

interface HandleResults {
  github: Availability;
  x: Availability;
  instagram: Availability;
  tiktok: Availability;
}

const HANDLE_TIMEOUT_MS = 4000;

// Browser-like User-Agent so platforms don't blanket-reject us as a bot.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const COMMON_HEADERS: Record<string, string> = {
  "User-Agent": UA,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// GitHub has a real public API — the cleanest of the four. 404 = available.
async function checkGithub(slug: string): Promise<Availability> {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(slug)}`, {
      headers: { ...COMMON_HEADERS, Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(HANDLE_TIMEOUT_MS),
    });
    if (res.status === 404) return true;
    if (res.status === 200) return false;
    return null;
  } catch {
    return null;
  }
}

// X (Twitter) is anti-bot heavy. We hit the public profile path and look at
// status code. 404 = available, 200 = taken. 403/429 = unknown (rate-limited
// or challenged). Reliable enough for a "fast hint" but the UI should treat
// any null as "verify manually."
async function checkX(slug: string): Promise<Availability> {
  try {
    const res = await fetch(`https://x.com/${encodeURIComponent(slug)}`, {
      headers: COMMON_HEADERS,
      signal: AbortSignal.timeout(HANDLE_TIMEOUT_MS),
      redirect: "manual",
    });
    if (res.status === 404) return true;
    if (res.status === 200) return false;
    return null;
  } catch {
    return null;
  }
}

// Instagram. Same pattern. Their challenge page returns 200 sometimes so
// this is the least reliable of the four — UI shows it with a "?" when null.
async function checkInstagram(slug: string): Promise<Availability> {
  try {
    const res = await fetch(`https://www.instagram.com/${encodeURIComponent(slug)}/`, {
      headers: COMMON_HEADERS,
      signal: AbortSignal.timeout(HANDLE_TIMEOUT_MS),
      redirect: "manual",
    });
    if (res.status === 404) return true;
    if (res.status === 200) return false;
    return null;
  } catch {
    return null;
  }
}

// TikTok — public profile path with @ prefix.
async function checkTikTok(slug: string): Promise<Availability> {
  try {
    const res = await fetch(`https://www.tiktok.com/@${encodeURIComponent(slug)}`, {
      headers: COMMON_HEADERS,
      signal: AbortSignal.timeout(HANDLE_TIMEOUT_MS),
      redirect: "manual",
    });
    if (res.status === 404) return true;
    if (res.status === 200) return false;
    return null;
  } catch {
    return null;
  }
}

// Tiny in-memory cache keyed by slug. Same TTL as the domain RDAP cache —
// 10 minutes is enough to survive a burst of 100 row checks coming back-to-back
// from the /domain-finder page without hammering platforms.
const CACHE = new Map<string, { result: HandleResults; at: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const slug = (req.nextUrl.searchParams.get("slug") || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!slug || slug.length < 2 || slug.length > 30) {
    return NextResponse.json(
      { error: "slug query parameter is required (2-30 chars, alphanumeric)." },
      { status: 400 },
    );
  }

  const cached = CACHE.get(slug);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ slug, ...cached.result, cached: true });
  }

  // Fan all four out in parallel — the 4s per-platform timeout means the
  // whole endpoint finishes in roughly 4s worst case, well within Vercel's
  // 15s budget configured above.
  const [github, x, instagram, tiktok] = await Promise.all([
    checkGithub(slug),
    checkX(slug),
    checkInstagram(slug),
    checkTikTok(slug),
  ]);

  const result: HandleResults = { github, x, instagram, tiktok };
  CACHE.set(slug, { result, at: Date.now() });
  // Bound cache so a long-running process can't leak.
  if (CACHE.size > 5000) {
    const first = CACHE.keys().next().value;
    if (first) CACHE.delete(first);
  }

  return NextResponse.json({ slug, ...result });
}
