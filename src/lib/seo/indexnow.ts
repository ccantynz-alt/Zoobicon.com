/**
 * IndexNow client — submit URLs to Bing + Yandex (and any compatible
 * search engine) in one POST.
 *
 * Why IndexNow over the legacy "ping sitemap" endpoints:
 *   - Google deprecated their sitemap ping endpoint in 2023. They now
 *     rely on RSS, Atom, or the (jobs-only) Indexing API.
 *   - Bing + Yandex run a unified IndexNow protocol: POST a key once,
 *     then POST URL lists indefinitely. URLs are crawled within minutes.
 *   - Cloudflare announced their search engine ("Cloudflare Search")
 *     would also honor IndexNow. Free reach for the price of one fetch.
 *
 * The key is whatever string we choose. We host it at
 * /[key].txt containing exactly the key. IndexNow verifies the file
 * exists before honoring submissions.
 *
 * Configure via INDEXNOW_KEY env. If unset, submissions are no-ops
 * with a clear reason — same pattern as email-send / hn-flywheel.
 */

const INDEXNOW_HOST = "zoobicon.com";

export function getIndexNowKey(): string | null {
  return process.env.INDEXNOW_KEY || null;
}

export interface SubmitResult {
  ok: boolean;
  submitted: number;
  status?: number;
  reason?: string;
  /** Endpoints we hit, with per-endpoint result */
  endpoints?: Array<{ url: string; ok: boolean; status: number }>;
}

/**
 * Submit a batch of URLs to the IndexNow network.
 *
 * Notes:
 *   - IndexNow spec accepts up to 10,000 URLs per request; we batch
 *     conservatively at 500 to play nice with intermediaries.
 *   - We hit both api.indexnow.org (the unified relay) AND
 *     yandex.com/indexnow directly so that if either is down the
 *     other still indexes. Bing's bing.com/indexnow is the third path.
 *   - All URLs must share the same host as the IndexNow key file
 *     (the spec requires this). We filter and warn on cross-host URLs.
 */
export async function submitToIndexNow(urls: string[]): Promise<SubmitResult> {
  const key = getIndexNowKey();
  if (!key) {
    return {
      ok: false,
      submitted: 0,
      reason: "INDEXNOW_KEY env not set — IndexNow submissions disabled",
    };
  }

  // Filter to same-host URLs only (spec requirement)
  const sameHost = urls.filter((u) => {
    try {
      return new URL(u).host === INDEXNOW_HOST;
    } catch {
      return false;
    }
  });

  if (sameHost.length === 0) {
    return { ok: false, submitted: 0, reason: "No same-host URLs to submit" };
  }

  const keyLocation = `https://${INDEXNOW_HOST}/${key}.txt`;

  // Try IndexNow's unified relay first, then direct Bing + Yandex
  const endpoints = [
    "https://api.indexnow.org/IndexNow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow",
  ];

  const results: Array<{ url: string; ok: boolean; status: number }> = [];

  // Batch at 500 (the spec allows 10k but smaller is safer for proxies)
  const batches: string[][] = [];
  for (let i = 0; i < sameHost.length; i += 500) {
    batches.push(sameHost.slice(i, i + 500));
  }

  for (const endpoint of endpoints) {
    let lastStatus = 0;
    let allOk = true;
    for (const batch of batches) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host: INDEXNOW_HOST,
            key,
            keyLocation,
            urlList: batch,
          }),
          signal: AbortSignal.timeout(15000),
        });
        lastStatus = res.status;
        // IndexNow spec: 200 = received, 202 = accepted+processed
        if (!(res.ok || res.status === 202)) allOk = false;
      } catch {
        allOk = false;
      }
    }
    results.push({ url: endpoint, ok: allOk, status: lastStatus });
  }

  const anyOk = results.some((r) => r.ok);

  // Honest failure reporting — if every endpoint rejected, surface the
  // most common status so the admin UI can show something better than
  // "Submission failed: undefined." Common causes:
  //   403 — key file at /<key>.txt isn't returning the key (verify
  //         INDEXNOW_KEY in Vercel + visit /<key>.txt manually)
  //   422 — host mismatch (the URL list contains URLs not matching
  //         INDEXNOW_HOST). The same-host filter above should prevent
  //         this in practice.
  //   0   — fetch threw (network / timeout). Endpoint may be down.
  let reason: string | undefined;
  if (!anyOk) {
    const statuses = results.map((r) => r.status).filter(Boolean);
    if (statuses.length === 0) {
      reason =
        "All three IndexNow endpoints failed to respond (network or timeout). Retry, or check the IndexNow status page.";
    } else {
      const dominant = statuses[0];
      if (dominant === 403) {
        reason = `IndexNow returned 403 — your key file at https://${INDEXNOW_HOST}/${key}.txt is not returning the key. Verify INDEXNOW_KEY in Vercel and visit that URL directly to confirm it returns "${key}" (200 OK).`;
      } else if (dominant === 422) {
        reason = `IndexNow returned 422 — URL host mismatch. URLs being submitted don't all match ${INDEXNOW_HOST}.`;
      } else {
        reason = `All three IndexNow endpoints rejected the submission (HTTP ${dominant}). Check per-endpoint detail below.`;
      }
    }
  }

  return {
    ok: anyOk,
    submitted: sameHost.length,
    endpoints: results,
    ...(reason ? { reason } : {}),
  };
}
