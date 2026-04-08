import { NextRequest, NextResponse } from "next/server";
import { checkWithFallback } from "@/lib/opensrs";

// ---------------------------------------------------------------------------
// GET /api/domains/search?q=domainname&tlds=com,io,ai
// Searches domain availability via OpenSRS (Tucows) live API.
// Falls back to DNS-based check if OpenSRS credentials aren't configured.
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

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q");
    const tldsParam = req.nextUrl.searchParams.get("tlds");

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

    // Parse requested TLDs or use defaults
    const tlds = tldsParam
      ? tldsParam
          .split(",")
          .map((t) => t.trim().replace(/^\./, "").toLowerCase())
          .filter((t) => t)
      : DEFAULT_TLDS;

    const isShort = sanitized.length <= 3;
    console.log(`[Domain Search] query="${sanitized}" tlds=${tlds.join(",")} source=rdap-authoritative`);

    // Check TLDs with bounded concurrency. RDAP rate-limits aggressively and
    // the AI name generator fires one of these per name — if we blasted the
    // public RDAP endpoint with 12 names × 5 TLDs unbounded, every request
    // would 429 and the UI would silently show "No available domains."
    const MAX_CONCURRENT = 4;
    const checks: Array<{ domain: string; tld: string; available: boolean | null }> = new Array(tlds.length);
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(MAX_CONCURRENT, tlds.length) }, async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= tlds.length) return;
          const tld = tlds[idx];
          const domain = `${sanitized}.${tld}`;
          const available = await checkWithFallback(domain);
          checks[idx] = { domain, tld, available };
        }
      }),
    );

    const results = checks.map(({ domain, tld, available }) => {
      const basePrice = TLD_PRICING[tld] ?? 14.99;
      const price = isShort ? Math.round(basePrice * 2 * 100) / 100 : basePrice;
      return {
        domain,
        tld,
        available,
        price,
        premium: isShort,
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

    return NextResponse.json({
      query: sanitized,
      results,
      count: results.length,
      available: results.filter((r) => r.available === true).length,
      taken: results.filter((r) => r.available === false).length,
      unknown: results.filter((r) => r.available === null).length,
      source: "rdap-authoritative",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
