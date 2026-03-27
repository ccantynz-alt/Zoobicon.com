import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// GET /api/domains/search?q=domainname&tlds=com,io,ai
// Searches domain availability via OpenSRS (Tucows) API.
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
// OpenSRS (Tucows) API — Real domain availability lookup
// ---------------------------------------------------------------------------

function getOpenSRSConfig() {
  const apiKey = process.env.OPENSRS_API_KEY;
  const user = process.env.OPENSRS_RESELLER_USER;
  const env = process.env.OPENSRS_ENV || "test";

  if (!apiKey || !user) return null;

  return {
    apiKey,
    user,
    baseUrl: env === "live"
      ? "https://rr-n1-tor.opensrs.net:55443"
      : "https://horizon.opensrs.net:55443",
  };
}

/**
 * Check domain availability via OpenSRS LOOKUP API.
 * Returns true if available, false if taken.
 */
async function checkViaOpenSRS(domain: string): Promise<boolean | null> {
  const config = getOpenSRSConfig();
  if (!config) return null;

  const xml = `<?xml version='1.0' encoding='UTF-8' standalone='no' ?>
<!DOCTYPE OPS_envelope SYSTEM 'ops.dtd'>
<OPS_envelope>
  <header><version>0.9</version></header>
  <body>
    <data_block>
      <dt_assoc>
        <item key="protocol">XCP</item>
        <item key="action">LOOKUP</item>
        <item key="object">DOMAIN</item>
        <item key="attributes">
          <dt_assoc>
            <item key="domain">${domain}</item>
          </dt_assoc>
        </item>
      </dt_assoc>
    </data_block>
  </body>
</OPS_envelope>`;

  const inner = createHash("md5").update(xml + config.apiKey).digest("hex");
  const signature = createHash("md5").update(inner + config.apiKey).digest("hex");

  try {
    const response = await fetch(config.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "X-Username": config.user,
        "X-Signature": signature,
      },
      body: xml,
      signal: AbortSignal.timeout(10000),
    });

    const text = await response.text();

    // OpenSRS returns response_code 210 for "available" and 211 for "taken"
    if (text.includes("210")) return true;  // Available
    if (text.includes("211")) return false; // Taken
    // Check for explicit status text
    if (text.includes("available")) return true;
    if (text.includes("taken") || text.includes("not available")) return false;

    return null; // Can't determine
  } catch (err) {
    console.error(`[OpenSRS] Lookup failed for ${domain}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Fallback: Check domain availability via Google Public DNS.
 * NXDOMAIN (status 3) = likely available, but not 100% reliable.
 */
async function checkViaDNS(domain: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data.Status === 3) return true;  // NXDOMAIN = likely available
    if (data.Status === 0 && data.Answer) return false; // Resolves = taken
    return null;
  } catch {
    return null;
  }
}

/**
 * Check availability using best available method.
 * Priority: OpenSRS (real registry) → DNS (fallback)
 */
async function checkAvailability(domain: string): Promise<boolean | null> {
  // Try OpenSRS first (authoritative)
  const opensrsResult = await checkViaOpenSRS(domain);
  if (opensrsResult !== null) return opensrsResult;

  // Fall back to DNS check
  return checkViaDNS(domain);
}

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
        { status: 400 }
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
        { status: 400 }
      );
    }

    // Parse requested TLDs or use defaults
    const tlds = tldsParam
      ? tldsParam.split(",").map((t) => t.trim().replace(/^\./, "").toLowerCase()).filter((t) => t)
      : DEFAULT_TLDS;

    const isShort = sanitized.length <= 3;

    // Check all domains in parallel (batch of 4 to avoid rate limiting)
    const domains = tlds.map((tld) => `${sanitized}.${tld}`);
    const availabilityResults = new Map<string, boolean | null>();

    // Process in batches of 4
    for (let i = 0; i < domains.length; i += 4) {
      const batch = domains.slice(i, i + 4);
      const batchResults = await Promise.all(
        batch.map(async (domain) => ({
          domain,
          available: await checkAvailability(domain),
        }))
      );
      for (const { domain, available } of batchResults) {
        availabilityResults.set(domain, available);
      }
    }

    const results = tlds.map((tld) => {
      const domain = `${sanitized}.${tld}`;
      const available = availabilityResults.get(domain) ?? null;
      const basePrice = TLD_PRICING[tld] ?? 14.99;
      const price = isShort ? Math.round(basePrice * 2 * 100) / 100 : basePrice;

      return {
        domain,
        tld,
        available,
        price,
        premium: isShort,
        source: getOpenSRSConfig() ? "opensrs" : "dns",
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
      source: getOpenSRSConfig() ? "opensrs-live" : "dns-fallback",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
