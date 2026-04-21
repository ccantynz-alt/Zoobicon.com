import { NextRequest, NextResponse } from "next/server";
import { checkWithFallback } from "@/lib/opensrs";

// ---------------------------------------------------------------------------
// GET /api/domains/search?q=domainname&tlds=com,io,ai&mode=com-priority
// Searches domain availability via RDAP (authoritative) with OpenSRS + DNS
// fallbacks.
//
// Modes:
//   - default  — checks every requested TLD in parallel.
//   - com-priority — checks .com ONLY (fast path). If .com is available,
//     UI can offer to expand to other TLDs; when .com is free, the others
//     are almost always free too, so the first click should be .com only.
// ---------------------------------------------------------------------------

// TLD pricing (registration price per year)
const TLD_PRICING: Record<string, number> = {
  com: 12.99,
  io: 39.99,
  ai: 69.99,
  dev: 14.99,
  app: 14.99,
  co: 29.99,
  sh: 24.99,
  xyz: 2.99,
  net: 13.99,
  org: 12.99,
  me: 19.99,
  us: 9.99,
};

const DEFAULT_TLDS = Object.keys(TLD_PRICING);

// Lightweight premium signal: dictionary-word bonus. This is not Merriam-
// Webster — just a ~200-word seed of common high-value English stems that
// make a domain meaningfully more brandable when matched exactly.
const DICTIONARY_SEEDS = new Set([
  "love", "care", "work", "flow", "rise", "edge", "peak", "core", "hub",
  "labs", "life", "time", "wave", "spark", "light", "dream", "cloud",
  "pixel", "atlas", "orbit", "nova", "echo", "path", "shift", "forge",
  "zen", "ember", "sage", "frost", "north", "south", "loop", "prism",
  "vector", "quantum", "stellar", "cosmic", "signal", "pulse", "lumen",
  "pace", "kinetic", "vault", "anchor", "helix", "vertex", "crown",
  "summit", "nimbus", "flux", "mint", "bolt", "zap", "fuse",
]);

function classifyName(name: string) {
  const n = name.toLowerCase();
  const tags: string[] = [];
  if (n.length <= 3) tags.push("ultra-short");
  else if (n.length <= 5) tags.push("short");
  if (DICTIONARY_SEEDS.has(n)) tags.push("dictionary-word");
  if (/^[aeiou]/.test(n) && /[aeiou]$/.test(n)) tags.push("vowel-bookended");
  const syllables = n.replace(/[^aeiouy]+/g, " ").trim().split(/\s+/).filter(Boolean).length;
  if (syllables === 1 && n.length >= 4) tags.push("one-syllable");
  return { tags, premium: n.length <= 3 || DICTIONARY_SEEDS.has(n) };
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const tldsParam = req.nextUrl.searchParams.get("tlds");
    const mode = (req.nextUrl.searchParams.get("mode") || "default").toLowerCase();

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "q query parameter is required (minimum 2 characters)." },
        { status: 400 },
      );
    }

    // Sanitize: lowercase, alphanumeric + hyphens only, max 63 chars
    const sanitized = query
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/^-+|-+$/g, "")
      .slice(0, 63);

    if (!sanitized) {
      return NextResponse.json(
        { error: "Invalid domain name. Use only letters, numbers, and hyphens." },
        { status: 400 },
      );
    }

    // .com-priority mode overrides TLD selection — only .com is checked.
    // This is the fast path: if .com is available, the others almost
    // always are too, and the user can expand in a second click.
    const comPriority = mode === "com-priority" || mode === "com-only";

    // Parse requested TLDs or use defaults
    const tlds = comPriority
      ? ["com"]
      : tldsParam
        ? tldsParam
            .split(",")
            .map((t) => t.trim().replace(/^\./, "").toLowerCase())
            .filter((t) => t)
        : DEFAULT_TLDS;

    const isShort = sanitized.length <= 3;
    console.log(`[Domain Search] query="${sanitized}" mode=${mode} tlds=${tlds.join(",")} source=rdap-authoritative`);

    // Check TLDs with bounded concurrency. RDAP rate-limits aggressively and
    // the AI name generator fires one of these per name — if we blasted the
    // public RDAP endpoint with 12 names × 5 TLDs unbounded, every request
    // would 429 and the UI would silently show "No available domains."
    //
    // HARD TIME BUDGET: we cap the entire batch at 9s so a single stuck probe
    // can never hang the whole response. Any TLD still in-flight at the cap
    // is returned as `null` (uncertain) — the UI renders those as "unknown"
    // rather than silently timing out.
    const MAX_CONCURRENT = 6;
    const TOTAL_BUDGET_MS = 9000;
    const checks: Array<{ domain: string; tld: string; available: boolean | null }> = tlds.map(
      (tld) => ({ domain: `${sanitized}.${tld}`, tld, available: null }),
    );
    let cursor = 0;
    const runPool = Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT, tlds.length) }, async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= tlds.length) return;
          const tld = tlds[idx];
          const domain = `${sanitized}.${tld}`;
          try {
            const available = await checkWithFallback(domain);
            checks[idx] = { domain, tld, available };
          } catch {
            checks[idx] = { domain, tld, available: null };
          }
        }
      }),
    );
    const budget = new Promise<void>((resolve) => setTimeout(resolve, TOTAL_BUDGET_MS));
    await Promise.race([runPool, budget]);

    const { tags, premium: premiumName } = classifyName(sanitized);
    const results = checks.map(({ domain, tld, available }) => {
      const basePrice = TLD_PRICING[tld] ?? 14.99;
      const price = isShort ? Math.round(basePrice * 2 * 100) / 100 : basePrice;
      // Confidence: resolved = high, timed-out/unknown = low. The UI
      // uses this to show "unknown" with a retry affordance instead of
      // silently failing.
      const confidence: "high" | "low" = available === null ? "low" : "high";
      return {
        domain,
        tld,
        available,
        price,
        premium: isShort || premiumName,
        tags,
        confidence,
        source: "rdap",
      };
    });

    // Sort: available first, then unknown, then taken. Within each group, by price.
    results.sort((a, b) => {
      const aScore = a.available === true ? 0 : a.available === null ? 1 : 2;
      const bScore = b.available === true ? 0 : b.available === null ? 1 : 2;
      if (aScore !== bScore) return aScore - bScore;
      return a.price - b.price;
    });

    const availableCount = results.filter((r) => r.available === true).length;
    const comResult = results.find((r) => r.tld === "com");
    const comAvailable = comResult?.available === true;

    return NextResponse.json({
      query: sanitized,
      results,
      count: results.length,
      available: availableCount,
      taken: results.filter((r) => r.available === false).length,
      unknown: results.filter((r) => r.available === null).length,
      source: "rdap-authoritative",
      mode: comPriority ? "com-priority" : "default",
      // When .com is free, tell the client it can offer a one-click
      // expand to the other TLDs (they're almost always free too).
      hint: comPriority && comAvailable
        ? { type: "expand-tlds", message: "The .com is free — other TLDs will almost certainly be free too." }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
