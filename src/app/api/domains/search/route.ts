import { NextRequest, NextResponse } from "next/server";
import {
  checkDomainAvailability,
  isOpenSRSConfigured,
  checkWithFallback,
} from "@/lib/opensrs";

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
    const useOpenSRS = isOpenSRSConfigured();
    console.log(`[Domain Search] query="${sanitized}" tlds=${tlds.join(",")} source=${useOpenSRS ? "opensrs" : "dns-fallback"}`);

    // Check all domains in parallel (batch of 4 to avoid rate limiting)
    const domains = tlds.map((tld) => `${sanitized}.${tld}`);
    const availabilityResults = new Map<
      string,
      { available: boolean | null; status: string; error?: string }
    >();

    // Process in batches of 4
    for (let i = 0; i < domains.length; i += 4) {
      const batch = domains.slice(i, i + 4);

      // Always try OpenSRS first, then fall back to DNS for any failures
      const batchResults = await Promise.all(
        batch.map(async (domain) => {
          // Try OpenSRS if configured
          if (useOpenSRS) {
            const result = await checkDomainAvailability(domain);
            if (result.status !== "error" && result.status !== "unknown") {
              return { domain, available: result.available, status: result.status };
            }
            // OpenSRS failed for this domain — fall back to DNS
            console.warn(`[Domain Search] OpenSRS failed for ${domain}: ${result.error || result.status}, trying DNS fallback`);
          }

          // DNS fallback — check if domain resolves
          const dnsAvailable = await checkWithFallback(domain);
          return {
            domain,
            available: dnsAvailable,
            status: dnsAvailable === true ? "available" : dnsAvailable === false ? "taken" : "unknown",
          };
        }),
      );

      for (const result of batchResults) {
        availabilityResults.set(result.domain, {
          available: result.available,
          status: result.status,
        });
      }
    }

    const results = tlds.map((tld) => {
      const domain = `${sanitized}.${tld}`;
      const result = availabilityResults.get(domain);
      const available = result?.available ?? null;
      const basePrice = TLD_PRICING[tld] ?? 14.99;
      const price = isShort ? Math.round(basePrice * 2 * 100) / 100 : basePrice;

      return {
        domain,
        tld,
        available,
        price,
        premium: isShort,
        source: useOpenSRS ? "opensrs" : "dns",
        ...(result?.error ? { error: result.error } : {}),
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
      source: useOpenSRS ? "opensrs-live" : "dns-fallback",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
