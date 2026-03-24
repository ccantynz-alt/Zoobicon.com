/**
 * Search Engine Auto-Submission
 *
 * Supports:
 * - IndexNow (Bing, Yandex, DuckDuckGo, Seznam, Naver) — instant indexing
 * - Google Ping (sitemap ping endpoint)
 * - Google Indexing API (for sites with verified Search Console)
 *
 * Called automatically after every deployment and on sitemap changes.
 */

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'zoobicon-indexnow-key-2026';

const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',      // Bing, DuckDuckGo
  'https://yandex.com/indexnow',              // Yandex
  'https://searchadvisor.naver.com/indexnow', // Naver
];

const ZOOBICON_HOST = 'zoobicon.com';
const ZOOBICON_SH_HOST = 'zoobicon.sh';

interface SubmitResult {
  engine: string;
  status: 'success' | 'error';
  statusCode?: number;
  message?: string;
}

interface SubmitSummary {
  urls: string[];
  results: SubmitResult[];
  submittedAt: string;
}

/**
 * Submit URLs via IndexNow protocol
 * Supports batch submission of up to 10,000 URLs per request
 */
async function submitIndexNow(urls: string[]): Promise<SubmitResult[]> {
  const results: SubmitResult[] = [];

  // Determine the host from the first URL
  const host = urls.length > 0 ? new URL(urls[0]).host : ZOOBICON_HOST;

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const body = {
        host,
        key: INDEXNOW_KEY,
        keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
      });

      const engineName = new URL(endpoint).hostname;
      results.push({
        engine: `IndexNow (${engineName})`,
        status: res.ok || res.status === 202 ? 'success' : 'error',
        statusCode: res.status,
        message: res.ok || res.status === 202
          ? `Submitted ${urls.length} URL(s)`
          : `HTTP ${res.status}`,
      });
    } catch (err) {
      const engineName = new URL(endpoint).hostname;
      results.push({
        engine: `IndexNow (${engineName})`,
        status: 'error',
        message: err instanceof Error ? err.message : 'Network error',
      });
    }
  }

  return results;
}

/**
 * Ping Google with sitemap URL
 * This is the classic sitemap ping — simple GET request
 */
async function pingGoogle(sitemapUrl: string): Promise<SubmitResult> {
  try {
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const res = await fetch(pingUrl, { method: 'GET' });

    return {
      engine: 'Google Sitemap Ping',
      status: res.ok ? 'success' : 'error',
      statusCode: res.status,
      message: res.ok ? 'Sitemap ping sent' : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      engine: 'Google Sitemap Ping',
      status: 'error',
      message: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Ping Bing with sitemap URL
 */
async function pingBing(sitemapUrl: string): Promise<SubmitResult> {
  try {
    const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const res = await fetch(pingUrl, { method: 'GET' });

    return {
      engine: 'Bing Sitemap Ping',
      status: res.ok ? 'success' : 'error',
      statusCode: res.status,
      message: res.ok ? 'Sitemap ping sent' : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      engine: 'Bing Sitemap Ping',
      status: 'error',
      message: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Google Indexing API submission (requires service account)
 * For sites verified in Google Search Console with Indexing API enabled
 */
async function submitGoogleIndexingAPI(urls: string[]): Promise<SubmitResult[]> {
  const serviceAccountKey = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT;
  if (!serviceAccountKey) {
    return [{
      engine: 'Google Indexing API',
      status: 'error',
      message: 'GOOGLE_INDEXING_SERVICE_ACCOUNT not configured — skipped',
    }];
  }

  const results: SubmitResult[] = [];

  try {
    // Parse the service account JSON
    const credentials = JSON.parse(serviceAccountKey);
    const token = await getGoogleAccessToken(credentials);

    // Google Indexing API supports batch requests
    // Submit each URL individually (batch endpoint has different format)
    for (const url of urls.slice(0, 200)) { // API limit: 200 per day
      try {
        const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            url,
            type: 'URL_UPDATED',
          }),
        });

        const data = await res.json();
        results.push({
          engine: 'Google Indexing API',
          status: res.ok ? 'success' : 'error',
          statusCode: res.status,
          message: res.ok
            ? `Submitted: ${url}`
            : data.error?.message || `HTTP ${res.status}`,
        });
      } catch (err) {
        results.push({
          engine: 'Google Indexing API',
          status: 'error',
          message: `Failed for ${url}: ${err instanceof Error ? err.message : 'Unknown'}`,
        });
      }
    }
  } catch (err) {
    results.push({
      engine: 'Google Indexing API',
      status: 'error',
      message: `Auth failed: ${err instanceof Error ? err.message : 'Unknown'}`,
    });
  }

  return results;
}

/**
 * Get Google OAuth2 access token from service account credentials
 * Uses JWT assertion flow (no external library needed)
 */
async function getGoogleAccessToken(credentials: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key and sign
  const pemContents = credentials.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const sigBytes = new Uint8Array(signature);
  let sigStr = '';
  for (let i = 0; i < sigBytes.length; i++) {
    sigStr += String.fromCharCode(sigBytes[i]);
  }
  const signatureB64 = btoa(sigStr)
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(tokenData.error_description || 'Failed to get access token');
  }
  return tokenData.access_token;
}

/**
 * Submit a deployed site URL to all search engines
 * Called automatically after every deployment
 */
export async function submitToSearchEngines(urls: string[]): Promise<SubmitSummary> {
  if (!urls.length) {
    return { urls: [], results: [], submittedAt: new Date().toISOString() };
  }

  const allResults: SubmitResult[] = [];

  // Run all submissions in parallel
  const [indexNowResults, googlePing, bingPing, googleApiResults] = await Promise.allSettled([
    submitIndexNow(urls),
    pingGoogle(`https://${ZOOBICON_HOST}/sitemap.xml`),
    pingBing(`https://${ZOOBICON_HOST}/sitemap.xml`),
    submitGoogleIndexingAPI(urls),
  ]);

  if (indexNowResults.status === 'fulfilled') allResults.push(...indexNowResults.value);
  if (googlePing.status === 'fulfilled') allResults.push(googlePing.value);
  if (bingPing.status === 'fulfilled') allResults.push(bingPing.value);
  if (googleApiResults.status === 'fulfilled') allResults.push(...googleApiResults.value);

  return {
    urls,
    results: allResults,
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Submit a newly deployed zoobicon.sh site
 */
export async function submitDeployedSite(slug: string): Promise<SubmitSummary> {
  const siteUrl = `https://${slug}.${ZOOBICON_SH_HOST}`;
  return submitToSearchEngines([siteUrl]);
}

/**
 * Submit the main zoobicon.com sitemap to all engines
 * Call this when pages are added/updated
 */
export async function submitSitemap(): Promise<SubmitSummary> {
  const sitemapUrl = `https://${ZOOBICON_HOST}/sitemap.xml`;

  const allResults: SubmitResult[] = [];

  const [googlePing, bingPing] = await Promise.allSettled([
    pingGoogle(sitemapUrl),
    pingBing(sitemapUrl),
  ]);

  if (googlePing.status === 'fulfilled') allResults.push(googlePing.value);
  if (bingPing.status === 'fulfilled') allResults.push(bingPing.value);

  return {
    urls: [sitemapUrl],
    results: allResults,
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Get the IndexNow key for verification file
 */
export function getIndexNowKey(): string {
  return INDEXNOW_KEY;
}
