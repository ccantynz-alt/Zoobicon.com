/**
 * Sitemap + robots.txt generator for hosted customer sites.
 */

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

export interface RobotsOptions {
  userAgent?: string;
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
  additionalSitemaps?: string[];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map((e) => {
      const parts: string[] = [`    <loc>${escapeXml(e.loc)}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${escapeXml(e.lastmod)}</lastmod>`);
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (typeof e.priority === "number") {
        const p = Math.max(0, Math.min(1, e.priority));
        parts.push(`    <priority>${p.toFixed(1)}</priority>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function generateSitemapIndex(
  sitemaps: Array<{ loc: string; lastmod?: string }>
): string {
  const items = sitemaps
    .map((s) => {
      const parts: string[] = [`    <loc>${escapeXml(s.loc)}</loc>`];
      if (s.lastmod) parts.push(`    <lastmod>${escapeXml(s.lastmod)}</lastmod>`);
      return `  <sitemap>\n${parts.join("\n")}\n  </sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`;
}

export function generateRobotsTxt(
  siteUrl: string,
  options: RobotsOptions = {}
): string {
  const {
    userAgent = "*",
    allow = [],
    disallow = ["/admin", "/api"],
    crawlDelay,
    additionalSitemaps = [],
  } = options;

  const lines: string[] = [];
  lines.push(`User-agent: ${userAgent}`);
  for (const a of allow) lines.push(`Allow: ${a}`);
  for (const d of disallow) lines.push(`Disallow: ${d}`);
  if (typeof crawlDelay === "number") lines.push(`Crawl-delay: ${crawlDelay}`);
  lines.push("");

  const base = siteUrl.replace(/\/$/, "");
  lines.push(`Sitemap: ${base}/sitemap.xml`);
  for (const s of additionalSitemaps) lines.push(`Sitemap: ${s}`);

  return lines.join("\n") + "\n";
}

async function fetchWithRetry(
  url: string,
  signal: AbortSignal,
  attempts = 4
): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        signal,
        headers: { "User-Agent": "ZoobiconSitemapBot/1.0" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (signal.aborted) throw err;
      const backoff = 200 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("fetch failed");
}

function extractLinks(html: string, baseUrl: URL): string[] {
  const out: string[] = [];
  const re = /<a\s+[^>]*href\s*=\s*["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    try {
      const u = new URL(href, baseUrl);
      if (u.host === baseUrl.host) {
        u.hash = "";
        out.push(u.toString());
      }
    } catch {
      // ignore invalid urls
    }
  }
  return out;
}

export async function crawlSiteForUrls(
  baseUrl: string,
  maxPages = 100
): Promise<SitemapEntry[]> {
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    throw new Error(`Invalid baseUrl: ${baseUrl}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const visited = new Set<string>();
  const queue: string[] = [base.toString()];
  const entries: SitemapEntry[] = [];
  const now = new Date().toISOString();

  try {
    // Verify base reachable first
    try {
      const html = await fetchWithRetry(base.toString(), controller.signal);
      visited.add(base.toString());
      entries.push({ loc: base.toString(), lastmod: now, changefreq: "weekly", priority: 1.0 });
      for (const link of extractLinks(html, base)) {
        if (!visited.has(link)) queue.push(link);
      }
    } catch (err) {
      throw new Error(
        `Base URL unreachable: ${baseUrl} (${err instanceof Error ? err.message : "unknown"})`
      );
    }

    while (queue.length > 0 && entries.length < maxPages) {
      if (controller.signal.aborted) break;
      const next = queue.shift();
      if (!next || visited.has(next)) continue;
      visited.add(next);
      try {
        const html = await fetchWithRetry(next, controller.signal);
        entries.push({ loc: next, lastmod: now, changefreq: "weekly", priority: 0.7 });
        for (const link of extractLinks(html, base)) {
          if (!visited.has(link) && entries.length + queue.length < maxPages) {
            queue.push(link);
          }
        }
      } catch {
        // skip failing pages
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  return entries;
}
