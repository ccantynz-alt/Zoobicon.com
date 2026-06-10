/**
 * WordPress site importer — extracts content from any WordPress site
 * via the WP REST API and composes a builder prompt to modernize it
 * into a React app.
 *
 * Strategy:
 *   1. Probe /wp-json/ for site info (name, description, theme color).
 *   2. Fetch up to 10 recent posts + pages with title + excerpt +
 *      featured-media-url.
 *   3. Pull categories + tags for content structure.
 *   4. Compose a rich prompt that primes the existing builder to
 *      rebuild as a modern React site, preserving the brand voice
 *      and content structure.
 *
 * Fallback:
 *   Many WP sites disable wp-json (security plugin defaults). In that
 *   case the URL extractor at src/lib/seo/url-extractor.ts handles
 *   them via HTML parsing — same composition outcome, slightly less
 *   structured input.
 *
 * Why this matters: WordPress powers 43% of the internet. Every site
 * we modernize is a potential Zoobicon customer. The /upgrade flow
 * covers any site; this WordPress-specific path extracts richer
 * structured data when wp-json is available.
 */

const WP_FETCH_TIMEOUT = 15000;
const UA = "ZoobiconWordPressImport/1.0 (+https://zoobicon.com/wordpress)";

export interface WordPressPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  featuredImage: string | null;
  categories: string[];
}

export interface WordPressImport {
  ok: boolean;
  wpJsonAvailable: boolean;
  siteUrl: string;
  finalUrl: string;
  siteName: string | null;
  siteDescription: string | null;
  language: string | null;
  posts: WordPressPost[];
  pages: WordPressPost[]; // pages use the same shape as posts
  categories: string[];
  tags: string[];
  postCount: number;
  pageCount: number;
  reason?: string;
}

interface WpRoot {
  name?: string;
  description?: string;
  url?: string;
  home?: string;
  gmt_offset?: number;
  timezone_string?: string;
}

interface WpPost {
  id: number;
  slug: string;
  date: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  featured_media?: number;
  categories?: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
    "wp:term"?: Array<Array<{ name?: string; taxonomy?: string }>>;
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseUrl(input: string): string {
  let url = input.trim();
  if (!url.startsWith("http")) url = `https://${url}`;
  return url.replace(/\/$/, "");
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
      signal: AbortSignal.timeout(WP_FETCH_TIMEOUT),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function importWordPressSite(rawUrl: string): Promise<WordPressImport> {
  const base = normaliseUrl(rawUrl);
  const finalUrl = base; // wp-json calls follow redirects; this is good enough for the report

  const empty: WordPressImport = {
    ok: false,
    wpJsonAvailable: false,
    siteUrl: rawUrl,
    finalUrl,
    siteName: null,
    siteDescription: null,
    language: null,
    posts: [],
    pages: [],
    categories: [],
    tags: [],
    postCount: 0,
    pageCount: 0,
  };

  // Probe wp-json
  const root = await fetchJson<WpRoot>(`${base}/wp-json/`);
  if (!root) {
    return {
      ...empty,
      reason:
        "wp-json endpoint not available — try the URL Clone-and-Upgrade flow at /upgrade which uses HTML parsing.",
    };
  }

  // Site info
  const siteName = root.name || null;
  const siteDescription = root.description || null;

  // Recent posts + pages (parallel; use _embed for featured media + terms)
  const [postsRes, pagesRes, categoriesRes, tagsRes] = await Promise.all([
    fetchJson<WpPost[]>(
      `${base}/wp-json/wp/v2/posts?per_page=10&_embed=1&_fields=id,slug,date,title,excerpt,featured_media,categories,_links,_embedded`
    ),
    fetchJson<WpPost[]>(
      `${base}/wp-json/wp/v2/pages?per_page=10&_embed=1&_fields=id,slug,date,title,excerpt,featured_media,_links,_embedded`
    ),
    fetchJson<Array<{ name: string }>>(
      `${base}/wp-json/wp/v2/categories?per_page=20&_fields=name`
    ),
    fetchJson<Array<{ name: string }>>(
      `${base}/wp-json/wp/v2/tags?per_page=20&_fields=name`
    ),
  ]);

  function shapePost(p: WpPost): WordPressPost {
    const featuredMedia =
      p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;
    const cats =
      p._embedded?.["wp:term"]?.flat()
        ?.filter((t) => t.taxonomy === "category")
        ?.map((t) => t.name || "")
        .filter(Boolean) ?? [];
    return {
      id: p.id,
      slug: p.slug,
      title: stripHtml(p.title?.rendered || ""),
      excerpt: stripHtml(p.excerpt?.rendered || "").slice(0, 280),
      date: p.date,
      featuredImage: featuredMedia,
      categories: cats,
    };
  }

  const posts = (postsRes || []).map(shapePost);
  const pages = (pagesRes || []).map(shapePost);

  return {
    ok: true,
    wpJsonAvailable: true,
    siteUrl: rawUrl,
    finalUrl,
    siteName,
    siteDescription,
    language: null, // wp-json doesn't expose language at /; would need /wp-json/wp/v2/site-info
    posts,
    pages,
    categories: (categoriesRes || []).map((c) => c.name).filter(Boolean),
    tags: (tagsRes || []).map((t) => t.name).filter(Boolean),
    postCount: posts.length,
    pageCount: pages.length,
  };
}

/**
 * Compose a builder prompt from a WordPress import. The prompt
 * preserves the site's voice and content structure so the rebuild
 * feels like an evolution, not a replacement.
 */
export function composeWordPressBuilderPrompt(imp: WordPressImport): string {
  const parts: string[] = [];

  const name = imp.siteName || "the site";

  parts.push(
    `Build a modernized 2026 React version of an existing WordPress site for "${name}".`
  );

  if (imp.siteDescription) {
    parts.push(`Their current site description: "${imp.siteDescription}".`);
  }

  // Pull a navigation hint from the pages.
  if (imp.pages.length > 0) {
    const navLabels = imp.pages
      .slice(0, 5)
      .map((p) => p.title)
      .filter(Boolean);
    if (navLabels.length > 0) {
      parts.push(`Their current navigation includes: ${navLabels.join(", ")}.`);
    }
  }

  // Pull recent post titles for the blog/news/content section.
  if (imp.posts.length > 0) {
    const recentTitles = imp.posts
      .slice(0, 5)
      .map((p) => p.title)
      .filter(Boolean);
    parts.push(
      `Recent posts to preserve as a blog/news section: ${recentTitles.join("; ")}.`
    );
  }

  // Pull category structure for content organisation.
  if (imp.categories.length > 0) {
    parts.push(
      `Content categories: ${imp.categories.slice(0, 8).join(", ")}.`
    );
  }

  // Modernization brief — same shape as composeBuilderPrompt in
  // src/lib/seo/url-extractor.ts so the planner sees consistent
  // guidance regardless of the import source.
  parts.push(
    "Modernize: replace the WordPress + theme stack with a clean React + Tailwind output. Ship 2026 design patterns (bento grids, spotlight cards, text reveal, marquee logos), mobile-first responsive layout, semantic HTML, JSON-LD structured data, sub-second LCP. Hosting + custom domain provisioned via Vapron at deploy. Pick a refined editorial-light palette that respects the existing brand voice."
  );

  return parts.join(" ");
}
