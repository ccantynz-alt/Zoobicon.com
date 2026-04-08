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
let _configWarned = false;
export function isOpenSRSConfigured(): boolean {
  const apiKey = OPENSRS_API_KEY();
  const user = OPENSRS_USER();
  if (!apiKey && !user) return false;
  if (!apiKey || !user) {
    if (!_configWarned) {
      _configWarned = true;
      console.error(
        "[OpenSRS] Configuration incomplete: both OPENSRS_API_KEY and OPENSRS_RESELLER_USER must be set. Falling back to DNS."
      );
    }
    return false;
  }
  return true;
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
 * Authoritative single-domain availability check.
 *
 * Strategy (in order, first authoritative answer wins):
 *  1. RDAP (rdap.org) — official registry protocol. 404 = available, 200 = taken.
 *  2. OpenSRS LOOKUP — ONLY when env=live (test mode returns fake sandbox data
 *     and was the root cause of "available domains" that were actually taken).
 *  3. Google DNS NXDOMAIN — only as a corroborating signal, never alone.
 *
 * Returns:
 *   true  = definitely available
 *   false = definitely taken
 *   null  = uncertain (UI must NOT show as available)
 */
export async function checkWithFallback(domain: string): Promise<boolean | null> {
  // ── 1. RDAP (authoritative, free, no auth) ────────────────────────────────
  try {
    const rdapRes = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/rdap+json" },
      redirect: "follow",
    });
    // 404 = registry has no record = domain is available for registration
    if (rdapRes.status === 404) return true;
    // 200 = registry has a record = domain is taken
    if (rdapRes.status === 200) return false;
    // 429/5xx fall through to next signal — registry overloaded/unsupported TLD
  } catch {
    // network error — fall through
  }

  // ── 2. OpenSRS (LIVE mode only — test/horizon endpoint lies) ──────────────
  if (isOpenSRSConfigured() && OPENSRS_ENV() === "live") {
    const result = await checkDomainAvailability(domain);
    if (result.status === "available") return true;
    if (result.status === "taken") return false;
  }

  // ── 3. Google DNS — only NXDOMAIN is a useful signal ──────────────────────
  // A registered domain may have no A record (parked, MX-only) so absence of
  // an A record does NOT prove availability. We only trust NXDOMAIN, and even
  // then we additionally check NS to avoid false positives.
  try {
    const [aRes, nsRes] = await Promise.all([
      fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
        signal: AbortSignal.timeout(5000),
      }),
      fetch(`https://dns.google/resolve?name=${domain}&type=NS`, {
        signal: AbortSignal.timeout(5000),
      }),
    ]);
    const aData = await aRes.json();
    const nsData = await nsRes.json();
    // Both A and NS return NXDOMAIN → strong signal it's unregistered
    if (aData.Status === 3 && nsData.Status === 3) return true;
    // NS resolved → domain has nameservers → definitely registered
    if (nsData.Status === 0 && Array.isArray(nsData.Answer) && nsData.Answer.length > 0) {
      return false;
    }
    return null;
  } catch {
    return null;
  }
}
