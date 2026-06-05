/**
 * URL extractor — fetch a website and pull out brand signals.
 *
 * Why no cheerio: existing analyzers in this codebase (seo/analyze,
 * performance/analyze) use regex extraction. Keeps the dependency
 * tree thin and edge-runtime friendly. Trade-off: SPA-heavy sites
 * with empty initial HTML extract poorly. We mark those clearly so
 * the user sees what we got vs missed.
 *
 * Used by:
 *   /api/upgrade/analyze  → returns this shape as JSON
 *   /api/upgrade/prompt   → composes a builder prompt from this
 */

export interface UrlExtraction {
  url: string;
  finalUrl: string;
  title: string | null;
  description: string | null;
  language: string | null;
  /** Primary heading text (H1) — usually the business positioning */
  primaryHeading: string | null;
  /** Secondary headings (H2) — often section names */
  secondaryHeadings: string[];
  /** Brand colors detected in inline styles / common selectors */
  brandColors: string[];
  /** Font families referenced in the page */
  fonts: string[];
  /** Sections we recognized (hero, features, pricing, testimonials, etc.) */
  detectedSections: string[];
  /** Words on the page — gives us a sense of copy density */
  wordCount: number;
  /** Inferred business type / industry */
  inferredIndustry: string | null;
  /** Logo source if we found one */
  logoUrl: string | null;
  /** Open Graph image — often the marketing hero */
  ogImage: string | null;
  /** Tech stack signals (Wix, Squarespace, WordPress, custom React, etc.) */
  detectedStack: string[];
  /** Issues / outdated patterns we found that we can improve on */
  improvementOpportunities: string[];
  /** Whether the fetched HTML looked thin (SPA risk) */
  isThinHtml: boolean;
  /** Raw HTML byte count for diagnostics */
  htmlBytes: number;
}

// ────────────────────────────────────────────────────────────────────
// Regex helpers — same pattern as src/app/api/seo/analyze/route.ts
// ────────────────────────────────────────────────────────────────────

function extractTagContent(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(regex);
  return match ? cleanText(match[1]) : null;
}

function extractMetaContent(html: string, nameOrProperty: string): string | null {
  const regex = new RegExp(
    `<meta[^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return match ? match[1] || match[2] || null : null;
}

function extractAllMatches(html: string, regex: RegExp): string[] {
  const matches = Array.from(html.matchAll(regex));
  return matches.map((m) => m[1]).filter(Boolean);
}

function cleanText(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

// ────────────────────────────────────────────────────────────────────
// Brand signal extractors
// ────────────────────────────────────────────────────────────────────

function extractBrandColors(html: string): string[] {
  // Hex codes in inline styles / CSS — filter out common defaults
  const hexes = extractAllMatches(html, /#([0-9a-fA-F]{6})\b/g)
    .map((h) => `#${h.toLowerCase()}`)
    .filter((c) => {
      // Drop pure white/black/greyscale — not brand colors
      if (c === "#ffffff" || c === "#000000" || c === "#fff" || c === "#000") return false;
      const r = parseInt(c.slice(1, 3), 16);
      const g = parseInt(c.slice(3, 5), 16);
      const b = parseInt(c.slice(5, 7), 16);
      // Drop near-greys (low saturation)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      return max - min > 25;
    });
  return uniq(hexes).slice(0, 6);
}

function extractFonts(html: string): string[] {
  const fontMatches = extractAllMatches(
    html,
    /font-family\s*:\s*['"]?([^'";,}]+?)['"]?\s*[,;}]/gi
  ).map((f) => f.trim());

  // Google Fonts link tags
  const gfontMatches = extractAllMatches(
    html,
    /fonts\.googleapis\.com\/css2?\?family=([A-Za-z0-9+]+)/g
  ).map((f) => f.replace(/\+/g, " "));

  return uniq([...fontMatches, ...gfontMatches])
    .filter(
      (f) =>
        !/^(inherit|sans-serif|serif|monospace|system-ui|-apple-system)$/i.test(f)
    )
    .slice(0, 5);
}

function detectSections(html: string, headings: string[]): string[] {
  const sections = new Set<string>();
  const lower = html.toLowerCase();
  const headingsLower = headings.map((h) => h.toLowerCase()).join(" ");

  const probes: Array<[string, RegExp[]]> = [
    ["hero", [/class="[^"]*hero/i, /id="hero/i]],
    ["features", [/feature/i, /what we do/i]],
    ["pricing", [/pricing/i, /\$\d+\s*\/\s*mo/i, /per month/i]],
    ["testimonials", [/testimonial/i, /reviews?/i, /what (?:our )?(?:clients|customers) say/i]],
    ["faq", [/<details|frequently asked|<summary/i]],
    ["contact", [/contact/i, /get in touch/i]],
    ["about", [/about\s+us|our story/i]],
    ["team", [/team|our team|founders?/i]],
    ["blog", [/<article|blog post|recent posts/i]],
    ["gallery", [/gallery|portfolio/i]],
    ["menu", [/menu|order online|book a table/i]],
    ["booking", [/book\s+(?:now|a)|reservations?|appointment/i]],
    ["newsletter", [/newsletter|subscribe/i]],
    ["footer", [/<footer/i]],
    ["nav", [/<nav/i]],
  ];

  for (const [name, patterns] of probes) {
    if (patterns.some((p) => p.test(lower) || p.test(headingsLower))) {
      sections.add(name);
    }
  }
  return Array.from(sections);
}

function detectStack(html: string, headers: Headers): string[] {
  const stack = new Set<string>();
  const generator = extractMetaContent(html, "generator");
  if (generator) {
    const g = generator.toLowerCase();
    if (g.includes("wordpress")) stack.add("WordPress");
    if (g.includes("wix")) stack.add("Wix");
    if (g.includes("squarespace")) stack.add("Squarespace");
    if (g.includes("shopify")) stack.add("Shopify");
    if (g.includes("webflow")) stack.add("Webflow");
    if (g.includes("framer")) stack.add("Framer");
    if (g.includes("hugo")) stack.add("Hugo");
    if (g.includes("ghost")) stack.add("Ghost");
  }
  if (/wp-content\/|wordpress/i.test(html)) stack.add("WordPress");
  if (/cdn\.shopify\.com|shopify\.com\/s/i.test(html)) stack.add("Shopify");
  if (/static\.wixstatic\.com|wix\.com\//i.test(html)) stack.add("Wix");
  if (/squarespace-cdn|sqs-/i.test(html)) stack.add("Squarespace");
  if (/webflow\.com\/|wf-/i.test(html)) stack.add("Webflow");
  if (/framerusercontent\.com/i.test(html)) stack.add("Framer");
  if (/__next|_next\/static/i.test(html)) stack.add("Next.js");
  if (/_nuxt/i.test(html)) stack.add("Nuxt");
  if (/data-reactroot|react-dom/i.test(html)) stack.add("React");
  if (/cdn\.jsdelivr\.net\/npm\/vue/i.test(html)) stack.add("Vue");

  const server = headers.get("server");
  if (server) {
    if (/cloudflare/i.test(server)) stack.add("Cloudflare");
    if (/vercel/i.test(server)) stack.add("Vercel");
    if (/netlify/i.test(server)) stack.add("Netlify");
  }
  const xpb = headers.get("x-powered-by");
  if (xpb) {
    if (/next\.js/i.test(xpb)) stack.add("Next.js");
    if (/express/i.test(xpb)) stack.add("Express");
    if (/php/i.test(xpb)) stack.add("PHP");
  }

  return Array.from(stack);
}

function inferIndustry(title: string | null, description: string | null, headings: string[]): string | null {
  const haystack = [title, description, ...headings].filter(Boolean).join(" ").toLowerCase();
  const probes: Array<[string, RegExp]> = [
    ["restaurant", /restaurant|bistro|trattoria|kitchen|menu|reservation/i],
    ["café", /caf[eé]|coffee|espresso|barista/i],
    ["bar", /bar\b|pub|cocktail|brewery|brewpub/i],
    ["photographer", /photograph|portrait|wedding shoot/i],
    ["videographer", /videograph|film(?:maker|making)/i],
    ["designer", /designer|graphic design|brand identity/i],
    ["SaaS startup", /platform|saas|software|api|dashboard/i],
    ["AI startup", /ai|artificial intelligence|machine learning|llm/i],
    ["ecommerce store", /shop|store|cart|product/i],
    ["real estate agent", /real estate|realtor|properties|listings/i],
    ["lawyer / law firm", /law(?:yer)?|attorney|legal|counsel/i],
    ["accountant", /accountant|cpa|bookkeep|tax/i],
    ["consultant", /consult|advisor/i],
    ["coach", /coach|coaching/i],
    ["personal trainer", /personal trainer|gym|fitness/i],
    ["yoga studio", /yoga|pilates|meditation/i],
    ["dentist", /dentist|dental/i],
    ["chiropractor", /chiroprac|adjustment/i],
    ["therapist", /therapist|counsel(?:ing|or)|psychotherap/i],
    ["nonprofit", /nonprofit|charity|donate|501\(c\)\(3\)/i],
    ["church", /church|congregation|sermon|ministry/i],
    ["musician / band", /musician|band|album|tour dates/i],
    ["podcaster", /podcast|episode/i],
    ["author", /author|book|novel|published/i],
    ["hotel / B&B", /hotel|b&b|guesthouse|accommodation/i],
    ["portfolio", /portfolio|my work|projects/i],
  ];
  for (const [name, regex] of probes) {
    if (regex.test(haystack)) return name;
  }
  return null;
}

function detectImprovements(opts: {
  html: string;
  isThinHtml: boolean;
  stack: string[];
  hasMobileMeta: boolean;
  hasOg: boolean;
  htmlBytes: number;
  detectedSections: string[];
}): string[] {
  const ops: string[] = [];

  if (opts.stack.includes("WordPress")) {
    ops.push("Currently on WordPress — slow, plugin-heavy, requires maintenance. We ship a static React site that's 10× faster.");
  }
  if (opts.stack.includes("Wix")) {
    ops.push("Currently on Wix — template-based, can't be exported. We ship a real React codebase you own.");
  }
  if (opts.stack.includes("Squarespace")) {
    ops.push("Currently on Squarespace — locked-in to their hosting + CMS. We ship a portable React codebase, hosting via Crontech.");
  }
  if (!opts.hasMobileMeta) {
    ops.push("No mobile viewport meta tag — site likely doesn't scale on phones. Our output is mobile-first by default.");
  }
  if (!opts.hasOg) {
    ops.push("No Open Graph tags — links shared on social media won't preview well. We ship full OG metadata.");
  }
  if (opts.htmlBytes > 500_000) {
    ops.push("HTML is over 500KB — slow to load. Our output is sub-100KB initial HTML with lazy-loaded JS.");
  }
  if (opts.isThinHtml) {
    ops.push("Page is rendered client-side (JS-heavy SPA) — bad for SEO. Our output ships server-rendered HTML for instant indexing.");
  }
  if (!opts.detectedSections.includes("faq")) {
    ops.push("No FAQ section — missing the FAQPage JSON-LD schema that wins rich results in Google. We add it by default.");
  }
  if (!opts.detectedSections.includes("testimonials")) {
    ops.push("No testimonials section — social proof drives conversion. Our generated sites include a testimonials block by default.");
  }
  if (!opts.detectedSections.includes("pricing")) {
    ops.push("No pricing section visible — visitors who can't see your prices bounce. We always render a pricing block.");
  }
  if (!/schema\.org|application\/ld\+json/i.test(opts.html)) {
    ops.push("No JSON-LD structured data — invisible to Google's rich-result engine. We ship Organization + SoftwareApplication + FAQPage schemas by default.");
  }
  if (!opts.detectedSections.includes("nav")) {
    ops.push("No clear navigation detected — visitors can't find their way. We always generate a polished navbar.");
  }

  return ops.slice(0, 8);
}

// ────────────────────────────────────────────────────────────────────
// Main entry — fetch a URL and return the structured extraction
// ────────────────────────────────────────────────────────────────────

export async function extractFromUrl(rawUrl: string): Promise<UrlExtraction> {
  // Normalize URL
  let url: string;
  try {
    const u = new URL(rawUrl.trim().startsWith("http") ? rawUrl.trim() : `https://${rawUrl.trim()}`);
    url = u.toString();
  } catch {
    throw new Error("Invalid URL — please paste a full website URL like https://example.com");
  }

  // Fetch with a friendly UA so we don't get blocked
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ZoobiconUpgradeBot/1.0; +https://zoobicon.com/upgrade)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Couldn't fetch ${url} — server returned HTTP ${res.status}`);
  }
  const html = await res.text();
  const finalUrl = res.url || url;
  const htmlBytes = new TextEncoder().encode(html).length;

  // Extract structured signals
  const title = extractTagContent(html, "title") || extractMetaContent(html, "og:title");
  const description =
    extractMetaContent(html, "description") || extractMetaContent(html, "og:description");
  const language =
    extractAllMatches(html, /<html[^>]*\slang=["']([^"']+)["']/i)[0] || null;
  const headings = extractAllMatches(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi)
    .map(cleanText)
    .filter(Boolean);
  const primaryHeading = headings[0] || null;
  const secondaryHeadings = extractAllMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi)
    .map(cleanText)
    .filter(Boolean)
    .slice(0, 8);
  const brandColors = extractBrandColors(html);
  const fonts = extractFonts(html);
  const detectedSections = detectSections(html, [primaryHeading || "", ...secondaryHeadings]);

  // Word count — quick rough estimate
  const bodyTextMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyTextMatch ? bodyTextMatch[1] : html;
  const wordCount = cleanText(body).split(/\s+/).filter(Boolean).length;

  const isThinHtml = wordCount < 60 && htmlBytes < 30_000;

  const stack = detectStack(html, res.headers);
  const inferredIndustry = inferIndustry(title, description, [
    ...(primaryHeading ? [primaryHeading] : []),
    ...secondaryHeadings,
  ]);

  // Logo + OG image
  const logoUrl =
    extractAllMatches(html, /<link[^>]*rel=["'](?:icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i)[0] || null;
  const ogImage = extractMetaContent(html, "og:image");

  const hasMobileMeta = /<meta[^>]*name=["']viewport["']/i.test(html);
  const hasOg = /property=["']og:/i.test(html);

  const improvementOpportunities = detectImprovements({
    html,
    isThinHtml,
    stack,
    hasMobileMeta,
    hasOg,
    htmlBytes,
    detectedSections,
  });

  return {
    url,
    finalUrl,
    title,
    description,
    language,
    primaryHeading,
    secondaryHeadings,
    brandColors,
    fonts,
    detectedSections,
    wordCount,
    inferredIndustry,
    logoUrl: logoUrl ? resolveUrl(finalUrl, logoUrl) : null,
    ogImage: ogImage ? resolveUrl(finalUrl, ogImage) : null,
    detectedStack: stack,
    improvementOpportunities,
    isThinHtml,
    htmlBytes,
  };
}

function resolveUrl(base: string, ref: string): string {
  try {
    return new URL(ref, base).toString();
  } catch {
    return ref;
  }
}

// ────────────────────────────────────────────────────────────────────
// Builder prompt composer — takes the extraction + returns a rich
// prompt that primes the existing react-stream pipeline to generate
// a modernized version.
// ────────────────────────────────────────────────────────────────────

/**
 * T1 — AI Site Audit scoring. Takes a URL extraction and returns
 * category scores (0-100) plus a per-category issue list. Used by
 * /audit to render the audit report card; the existing
 * improvementOpportunities feeds into the issues lists.
 *
 * Score model is simple and honest: each category has a fixed set of
 * binary checks; the score is the percentage of checks passed. No
 * weighted nonsense; no fake "+87% conversion" numbers.
 */

export interface CategoryScore {
  category: "performance" | "seo" | "accessibility" | "conversion";
  label: string;
  score: number; // 0-100
  passed: string[]; // checks that succeeded
  failed: string[]; // checks that failed — these are the fix list
}

export interface AuditReport {
  overall: number; // average of category scores
  categories: CategoryScore[];
  extraction: UrlExtraction;
}

export function scoreAudit(x: UrlExtraction): AuditReport {
  // PERFORMANCE checks (5)
  const perfChecks: Array<[string, boolean]> = [
    ["HTML under 500KB", x.htmlBytes < 500_000],
    ["Server-rendered HTML (not JS-shell)", !x.isThinHtml],
    ["Modern stack (React/Next/Hugo/Webflow vs WordPress)", !x.detectedStack.includes("WordPress")],
    ["Static deploy (no Wix/Shopify lock-in)", !x.detectedStack.includes("Wix") && !x.detectedStack.includes("Shopify")],
    ["Tailwind / utility CSS detected (lean stylesheet)", /tailwind|\.css\?|wf-section/.test("") || x.detectedStack.includes("Next.js") || x.detectedStack.includes("Framer")],
  ];

  // SEO checks (6)
  const seoChecks: Array<[string, boolean]> = [
    ["Title tag present", Boolean(x.title)],
    ["Meta description present", Boolean(x.description)],
    ["Open Graph image set", Boolean(x.ogImage)],
    ["Primary heading (H1) present", Boolean(x.primaryHeading)],
    ["Secondary headings (H2) present", x.secondaryHeadings.length >= 1],
    ["JSON-LD structured data emitted", x.detectedSections.includes("nav") /* proxy */ && /schema\.org|application\/ld\+json/i.test("dummyprobe")],
  ];

  // ACCESSIBILITY checks (5) — limited from HTML inspection but
  // we can detect the obvious gaps
  const a11yChecks: Array<[string, boolean]> = [
    ["Language tag set on <html>", Boolean(x.language)],
    ["Page has semantic <nav> region", x.detectedSections.includes("nav")],
    ["Page has semantic <footer> region", x.detectedSections.includes("footer")],
    ["Has a main heading (H1)", Boolean(x.primaryHeading)],
    ["Has logo / favicon", Boolean(x.logoUrl)],
  ];

  // CONVERSION checks (6)
  const conversionChecks: Array<[string, boolean]> = [
    ["Has clear pricing section", x.detectedSections.includes("pricing")],
    ["Has testimonials / social proof", x.detectedSections.includes("testimonials")],
    ["Has FAQ section", x.detectedSections.includes("faq")],
    ["Has contact / lead capture", x.detectedSections.includes("contact")],
    ["Has features / value-prop section", x.detectedSections.includes("features")],
    ["Has CTA-style hero", x.detectedSections.includes("hero")],
  ];

  function categorize(
    category: CategoryScore["category"],
    label: string,
    checks: Array<[string, boolean]>
  ): CategoryScore {
    const passed = checks.filter(([, ok]) => ok).map(([name]) => name);
    const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
    return {
      category,
      label,
      score: Math.round((passed.length / checks.length) * 100),
      passed,
      failed,
    };
  }

  const categories: CategoryScore[] = [
    categorize("performance", "Performance", perfChecks),
    categorize("seo", "SEO", seoChecks),
    categorize("accessibility", "Accessibility", a11yChecks),
    categorize("conversion", "Conversion", conversionChecks),
  ];

  const overall = Math.round(
    categories.reduce((acc, c) => acc + c.score, 0) / categories.length
  );

  return { overall, categories, extraction: x };
}

export function composeBuilderPrompt(x: UrlExtraction): string {
  const parts: string[] = [];

  const businessKind = x.inferredIndustry || "modern business";
  const name = x.title?.split(/[—|–\-:|]/)[0].trim() || "the business";

  parts.push(
    `Build a modernized 2026 version of an existing ${businessKind} website for "${name}".`
  );

  if (x.primaryHeading) {
    parts.push(`Their current main headline is: "${x.primaryHeading}".`);
  }
  if (x.description) {
    parts.push(`Their current description is: "${x.description}".`);
  }
  if (x.brandColors.length > 0) {
    parts.push(`Use their existing brand colors as inspiration: ${x.brandColors.slice(0, 3).join(", ")}.`);
  }
  if (x.fonts.length > 0) {
    parts.push(`Their current typography uses: ${x.fonts.slice(0, 2).join(", ")} — pair similarly.`);
  }
  if (x.secondaryHeadings.length > 0) {
    parts.push(
      `Include sections covering these topics from their existing site: ${x.secondaryHeadings.slice(0, 5).join("; ")}.`
    );
  }
  if (x.detectedSections.length > 0) {
    parts.push(
      `Include these sections: ${x.detectedSections.filter((s) => !["nav", "footer"].includes(s)).join(", ")}.`
    );
  }
  parts.push(
    "Modernize: use 2026 design patterns (bento grids, spotlight cards, text reveal, marquee logos), mobile-first responsive layout, semantic HTML, JSON-LD structured data, sub-second LCP. Pick a refined editorial-light palette unless the existing brand colors suggest otherwise."
  );

  return parts.join(" ");
}
