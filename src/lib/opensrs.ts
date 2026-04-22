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

// Per-TLD authoritative RDAP endpoints. Going direct to the registry is
// strictly more reliable than rdap.org's third-party bootstrap — rdap.org
// will happily 404 when its upstream is flaky, and our old code treated
// that 404 as "available." These endpoints are the ones the registries
// themselves publish via the IANA bootstrap file, hardcoded for the
// majors to avoid a second round-trip and to remove rdap.org as a single
// point of failure for our most-searched TLDs.
const AUTHORITATIVE_RDAP: Record<string, string> = {
  com: "https://rdap.verisign.com/com/v1/domain/",
  net: "https://rdap.verisign.com/net/v1/domain/",
  org: "https://rdap.publicinterestregistry.org/rdap/domain/",
  io: "https://rdap.identitydigital.services/rdap/domain/",
  info: "https://rdap.identitydigital.services/rdap/domain/",
  me: "https://rdap.identitydigital.services/rdap/domain/",
  co: "https://rdap.nic.co/domain/",
  ai: "https://rdap.nic.ai/domain/",
  sh: "https://rdap.nic.sh/domain/",
  app: "https://rdap.nic.google/domain/",
  dev: "https://rdap.nic.google/domain/",
  xyz: "https://rdap.centralnic.com/xyz/domain/",
  us: "https://rdap.nic.us/domain/",
};

function extractTld(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  return parts[parts.length - 1] || "";
}

/**
 * Interpret an RDAP response body.
 *
 * Status 404 → available. 200 with an error body (RFC 9083) → derive from
 * errorCode. 200 with a real domain record → taken. Anything else → null.
 */
async function interpretRdap(res: Response): Promise<boolean | null> {
  if (res.status === 404) return true;
  if (res.status === 200) {
    try {
      const body = (await res.json()) as {
        objectClassName?: string;
        ldhName?: string;
        errorCode?: number;
      };
      if (body && typeof body.errorCode === "number" && body.errorCode === 404) return true;
      if (
        body &&
        body.objectClassName === "domain" &&
        typeof body.ldhName === "string" &&
        body.ldhName.length > 0
      ) {
        return false;
      }
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

async function fetchRdap(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/rdap+json" },
      redirect: "follow",
    });
  } catch {
    return null;
  }
}

/**
 * RDAP availability check — authoritative registry first, rdap.org as
 * fallback only when the registry is unreachable.
 *
 * The old single-source rdap.org path caused `auromax.com` to render as
 * AVAILABLE on our UI while Cloudflare's registrar check confirmed it was
 * registered — rdap.org had 404'd the bootstrap and we trusted the 404.
 * Per-TLD authoritative endpoints eliminate that class of bug because they
 * are the registry itself.
 *
 * Rules:
 *   - If an authoritative endpoint exists, hit it first. Trust its verdict.
 *   - On any uncertainty from the authoritative endpoint (network error,
 *     unparseable body), fall back to rdap.org with one 429 retry.
 *   - Any non-null answer is returned; otherwise null (uncertain).
 */
async function rdapCheck(domain: string, attempt = 0): Promise<boolean | null> {
  const tld = extractTld(domain);
  const authoritative = AUTHORITATIVE_RDAP[tld];

  if (authoritative) {
    const res = await fetchRdap(`${authoritative}${domain}`);
    if (res) {
      const verdict = await interpretRdap(res);
      if (verdict !== null) return verdict;
    }
    // Authoritative endpoint was unreachable or ambiguous — fall through
    // to rdap.org rather than returning null immediately. Giving up on one
    // registry hiccup would hurt availability more than it helps accuracy.
  }

  try {
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: AbortSignal.timeout(4000),
      headers: { Accept: "application/rdap+json" },
      redirect: "follow",
    });

    if (res.status === 429 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      return rdapCheck(domain, 1);
    }

    return interpretRdap(res);
  } catch {
    return null;
  }
}

/**
 * Google DNS check — only returns definitive answers.
 *
 *   - NXDOMAIN on both A and NS → available (true)
 *   - NS records that belong to the domain itself → taken (false)
 *   - Anything else → null (uncertain) — never guess, never cache
 *
 * The "NS belongs to the domain itself" rule prevents false TAKEN results
 * from wildcard NS records at the TLD level (e.g. some registries publish
 * placeholder NS records for unregistered names).
 */
async function dnsCheck(domain: string): Promise<boolean | null> {
  try {
    const [aRes, nsRes] = await Promise.all([
      fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
        signal: AbortSignal.timeout(3000),
      }),
      fetch(`https://dns.google/resolve?name=${domain}&type=NS`, {
        signal: AbortSignal.timeout(3000),
      }),
    ]);
    const aData = (await aRes.json()) as { Status?: number; Answer?: Array<{ name?: string; type?: number }> };
    const nsData = (await nsRes.json()) as { Status?: number; Answer?: Array<{ name?: string; type?: number }> };

    // Both NXDOMAIN = definitely unregistered
    if (aData.Status === 3 && nsData.Status === 3) return true;

    // NS records must belong to the exact domain (not a wildcard parent)
    if (nsData.Status === 0 && Array.isArray(nsData.Answer) && nsData.Answer.length > 0) {
      const target = domain.toLowerCase().replace(/\.$/, "");
      const hasOwnNS = nsData.Answer.some((a) => {
        if (!a || typeof a.name !== "string") return false;
        const name = a.name.toLowerCase().replace(/\.$/, "");
        return name === target;
      });
      if (hasOwnNS) return false;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Require consensus before claiming a domain is available.
 *
 * - ANY probe returning `false` (taken) settles immediately as taken.
 * - Claiming `true` (available) requires EVERY probe to return `true`.
 *   If a single probe is uncertain (null), the overall result is null.
 *
 * Why: rdap.org is a third-party bootstrap service and has been seen
 * returning 404 for domains that are actually registered (e.g. auromax.com
 * returned AVAILABLE on our UI while Cloudflare's registrar check confirmed
 * it was taken). Trusting a single 404 as authoritative means every time
 * rdap.org fails to reach the real TLD registry, we show a for-sale banner
 * on a domain the user cannot actually buy — a credibility killer. Requiring
 * consensus from an independent DNS probe catches this cleanly.
 */
function consensusAvailability(
  probes: Array<Promise<boolean | null>>,
): Promise<boolean | null> {
  return new Promise((resolve) => {
    const results: (boolean | null)[] = new Array(probes.length).fill(undefined);
    let completed = 0;
    let settled = false;

    const finish = (value: boolean | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    probes.forEach((p, i) => {
      p.then(
        (v) => {
          if (settled) return;
          results[i] = v;
          completed++;
          if (v === false) {
            finish(false);
            return;
          }
          if (completed === probes.length) {
            const anyTrue = results.some((r) => r === true);
            const anyNull = results.some((r) => r === null);
            // Available only if at least one probe said `true` and no probe
            // was uncertain. Any null = downstream (OpenSRS) must decide.
            finish(anyTrue && !anyNull ? true : null);
          }
        },
        () => {
          if (settled) return;
          results[i] = null;
          completed++;
          if (completed === probes.length) {
            const anyTrue = results.some((r) => r === true);
            const anyNull = results.some((r) => r === null);
            finish(anyTrue && !anyNull ? true : null);
          }
        },
      );
    });
  });
}

export async function checkWithFallback(domain: string): Promise<boolean | null> {
  // ── 0. Cache ─────────────────────────────────────────────────────────────
  const cached = getCached(domain);
  if (cached !== undefined) return cached;

  // ── 1. Consensus of RDAP + DNS (false wins on sight; true needs agreement) ─
  const raced = await consensusAvailability([rdapCheck(domain), dnsCheck(domain)]);
  if (raced !== null) {
    setCached(domain, raced);
    return raced;
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

  // Genuinely uncertain — do NOT cache, let the next call retry
  return null;
}
