import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// OpenSRS (Tucows) Domain API — Real domain availability lookups
// ---------------------------------------------------------------------------

const OPENSRS_API_KEY = () => process.env.OPENSRS_API_KEY || "";
const OPENSRS_USER = () => process.env.OPENSRS_RESELLER_USER || "";
const OPENSRS_ENV = () => process.env.OPENSRS_ENV || "test";

function getBaseUrl(): string {
  return OPENSRS_ENV() === "live"
    ? "https://rr-n1-tor.opensrs.net:55443"
    : "https://horizon.opensrs.net:55443";
}

function sign(xml: string): string {
  const apiKey = OPENSRS_API_KEY();
  const inner = createHash("md5").update(xml + apiKey).digest("hex");
  return createHash("md5").update(inner + apiKey).digest("hex");
}

/**
 * Check if OpenSRS credentials are configured.
 */
export function isOpenSRSConfigured(): boolean {
  return !!(OPENSRS_API_KEY() && OPENSRS_USER());
}

/**
 * Check a single domain's availability via OpenSRS LOOKUP command.
 * Returns { domain, available, status, error? }
 */
export async function checkDomainAvailability(domain: string): Promise<{
  domain: string;
  available: boolean;
  status: string;
  error?: string;
}> {
  const apiKey = OPENSRS_API_KEY();
  const user = OPENSRS_USER();

  if (!apiKey || !user) {
    return { domain, available: false, status: "error", error: "OpenSRS not configured" };
  }

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

  const signature = sign(xml);

  try {
    const res = await fetch(getBaseUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "X-Username": user,
        "X-Signature": signature,
        "Content-Length": String(Buffer.byteLength(xml)),
      },
      body: xml,
      signal: AbortSignal.timeout(10000),
    });

    const text = await res.text();

    // OpenSRS response codes: 210 = available, 211 = taken
    // Also parse explicit status text as backup
    const responseCodeMatch = text.match(/<item key="response_code">(\d+)<\/item>/);
    const responseCode = responseCodeMatch?.[1];

    if (responseCode === "210") {
      return { domain, available: true, status: "available" };
    }
    if (responseCode === "211") {
      return { domain, available: false, status: "taken" };
    }

    // Fallback: check for status text
    const statusMatch = text.match(/<item key="status">(.*?)<\/item>/);
    const statusText = statusMatch?.[1]?.toLowerCase() || "";

    if (statusText === "available" || text.includes("210")) {
      return { domain, available: true, status: "available" };
    }
    if (statusText === "taken" || statusText === "not available" || text.includes("211")) {
      return { domain, available: false, status: "taken" };
    }

    // If we got a response but can't parse it, log for debugging
    console.error(`[OpenSRS] Unparseable response for ${domain}:`, text.slice(0, 500));
    return { domain, available: false, status: "unknown", error: "Could not parse response" };
  } catch (err) {
    console.error(`[OpenSRS] Lookup failed for ${domain}:`, err instanceof Error ? err.message : err);
    return {
      domain,
      available: false,
      status: "error",
      error: err instanceof Error ? err.message : "Lookup failed",
    };
  }
}

/**
 * Check multiple domains across TLDs in parallel (batched to avoid rate limiting).
 * @param baseName - domain name without extension (e.g. "mybusiness")
 * @param tlds - array of TLDs to check (e.g. ["com", "io", "ai"])
 * @param batchSize - how many concurrent lookups per batch (default 5)
 */
export async function checkMultipleDomains(
  baseName: string,
  tlds: string[],
  batchSize = 5,
): Promise<
  Array<{
    domain: string;
    available: boolean;
    status: string;
    error?: string;
  }>
> {
  const results = [];
  for (let i = 0; i < tlds.length; i += batchSize) {
    const batch = tlds.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((tld) => checkDomainAvailability(`${baseName}.${tld}`)),
    );
    results.push(...batchResults);
  }
  return results;
}

/**
 * Check a single full domain (e.g. "mybusiness.com") with DNS fallback.
 * Uses OpenSRS if configured, otherwise falls back to Google DNS.
 */
export async function checkWithFallback(domain: string): Promise<boolean | null> {
  if (isOpenSRSConfigured()) {
    const result = await checkDomainAvailability(domain);
    if (result.status !== "error" && result.status !== "unknown") {
      return result.available;
    }
  }

  // Fallback 1: RDAP (Registration Data Access Protocol) — authoritative registry check
  // RDAP is the official replacement for WHOIS, run by registries themselves
  try {
    const rdapRes = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/rdap+json" },
    });
    if (rdapRes.status === 404) return true; // Not found in registry = available
    if (rdapRes.ok) return false; // Found in registry = taken
  } catch {
    // RDAP failed, try DNS
  }

  // Fallback 2: DNS — only trust NXDOMAIN as "likely available"
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    if (data.Status === 3) return true; // NXDOMAIN = likely available
    return null; // Unknown — don't assume taken from DNS alone
  } catch {
    return null;
  }
}
