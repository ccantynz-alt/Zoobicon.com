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
 * Authoritative single-domain availability check.
 *
 * Strategy (in order, first authoritative answer wins):
 *  1. RDAP (rdap.org) — official registry protocol. 404 = available, 200 = taken.
 *     Retries once on 429 after a short delay.
 *  2. OpenSRS LOOKUP — ONLY when env=live (test mode returns fake sandbox data
 *     and was the root cause of "available domains" that were actually taken).
 *  3. Google DNS NXDOMAIN — final fallback, requires BOTH A and NS to NXDOMAIN.
 *
 * Returns:
 *   true  = definitely available
 *   false = definitely taken
 *   null  = uncertain (UI must NOT show as available)
 *
 * Results are memoised for 10 minutes to survive retries and burst checks.
 */
const AVAILABILITY_CACHE = new Map<string, { result: boolean | null; at: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(domain: string): boolean | null | undefined {
  const hit = AVAILABILITY_CACHE.get(domain);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    AVAILABILITY_CACHE.delete(domain);
    return undefined;
  }
  return hit.result;
}

function setCached(domain: string, result: boolean | null) {
  AVAILABILITY_CACHE.set(domain, { result, at: Date.now() });
  // Keep the cache bounded so it can't leak forever
  if (AVAILABILITY_CACHE.size > 5000) {
    const firstKey = AVAILABILITY_CACHE.keys().next().value;
    if (firstKey) AVAILABILITY_CACHE.delete(firstKey);
  }
}

async function rdapCheck(domain: string, attempt = 0): Promise<boolean | null> {
  try {
    const rdapRes = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: AbortSignal.timeout(7000),
      headers: { Accept: "application/rdap+json" },
      redirect: "follow",
    });
    if (rdapRes.status === 404) return true;
    if (rdapRes.status === 200) return false;
    // 429 = rate limited. Retry once with small backoff.
    if (rdapRes.status === 429 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      return rdapCheck(domain, 1);
    }
    return null; // 5xx / unsupported TLD / unknown — caller will try next signal
  } catch {
    return null;
  }
}

export async function checkWithFallback(domain: string): Promise<boolean | null> {
  // ── 0. Cache ─────────────────────────────────────────────────────────────
  const cached = getCached(domain);
  if (cached !== undefined) return cached;

  // ── 1. RDAP (authoritative, free, no auth) ────────────────────────────────
  const rdap = await rdapCheck(domain);
  if (rdap !== null) {
    setCached(domain, rdap);
    return rdap;
  }

  // ── 2. OpenSRS (LIVE mode only — test/horizon endpoint lies) ──────────────
  if (isOpenSRSConfigured() && OPENSRS_ENV() === "live") {
    const result = await checkDomainAvailability(domain);
    if (result.status === "available") {
      setCached(domain, true);
      return true;
    }
    if (result.status === "taken") {
      setCached(domain, false);
      return false;
    }
  }

  // ── 3. Google DNS — only NXDOMAIN is a useful signal ──────────────────────
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
    if (aData.Status === 3 && nsData.Status === 3) {
      setCached(domain, true);
      return true;
    }
    if (nsData.Status === 0 && Array.isArray(nsData.Answer) && nsData.Answer.length > 0) {
      setCached(domain, false);
      return false;
    }
    // Don't cache nulls — let the next call retry
    return null;
  } catch {
    return null;
  }
}
