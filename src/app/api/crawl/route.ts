import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * POST /api/crawl — Intelligent Crawler
 *
 * Crawls a competitor URL and returns:
 * - Tech stack detection (frameworks, CMS, CDN, analytics, etc.)
 * - Design analysis (layout, typography, color palette, sections)
 * - Feature inventory (forms, auth, e-commerce, chat, etc.)
 * - Competitive positioning (messaging, CTAs, pricing strategy)
 * - Actionable recommendations for how to beat them
 *
 * Body: { url: string, mode?: "quick" | "deep" }
 */

export const maxDuration = 60;

// ── Tech detection patterns ──

interface TechMatch {
  name: string;
  category: string;
  patterns: RegExp[];
}

const TECH_SIGNATURES: TechMatch[] = [
  // Frameworks
  { name: "Next.js", category: "Framework", patterns: [/_next\//, /next\/static/, /__next/] },
  { name: "React", category: "Framework", patterns: [/react[-.]/, /reactDOM/, /data-reactroot/, /__reactFiber/] },
  { name: "Vue.js", category: "Framework", patterns: [/vue[-.]/, /v-cloak/, /data-v-/, /__vue/] },
  { name: "Angular", category: "Framework", patterns: [/angular[-.]/, /ng-version/, /ng-app/] },
  { name: "Svelte", category: "Framework", patterns: [/svelte[-.]/, /__svelte/] },
  { name: "Nuxt", category: "Framework", patterns: [/_nuxt\//, /nuxt\.config/] },
  { name: "Gatsby", category: "Framework", patterns: [/gatsby[-.]/, /___gatsby/] },
  { name: "Astro", category: "Framework", patterns: [/astro[-.]/, /is:raw/] },
  { name: "Remix", category: "Framework", patterns: [/remix[-.]/, /__remix/] },

  // CMS
  { name: "WordPress", category: "CMS", patterns: [/wp-content/, /wp-includes/, /wp-json/] },
  { name: "Shopify", category: "CMS", patterns: [/cdn\.shopify/, /shopify[-.]/, /myshopify/] },
  { name: "Webflow", category: "CMS", patterns: [/webflow[-.]/, /wf-[-]/, /assets\.website-files/] },
  { name: "Squarespace", category: "CMS", patterns: [/squarespace[-.]/, /static\.squarespace/] },
  { name: "Wix", category: "CMS", patterns: [/wix[-.]/, /wixstatic/, /parastorage/] },
  { name: "Ghost", category: "CMS", patterns: [/ghost[-.]/, /ghost\/api/] },
  { name: "Contentful", category: "CMS", patterns: [/contentful[-.]/, /ctfassets/] },
  { name: "Sanity", category: "CMS", patterns: [/sanity[-.]/, /cdn\.sanity/] },
  { name: "Strapi", category: "CMS", patterns: [/strapi[-.]/, /uploads\//] },
  { name: "Prismic", category: "CMS", patterns: [/prismic[-.]/, /cdn\.prismic/] },

  // CSS
  { name: "Tailwind CSS", category: "CSS", patterns: [/tailwindcss/, /tailwind[-.]/, /\bmin-h-screen\b.*\bflex\b/] },
  { name: "Bootstrap", category: "CSS", patterns: [/bootstrap[-.]/, /\bcol-md-/, /\bbtn-primary\b/] },
  { name: "Material UI", category: "CSS", patterns: [/mui[-.]/, /MuiButton/] },
  { name: "Chakra UI", category: "CSS", patterns: [/chakra[-.]/, /css-[\w]+/] },
  { name: "Bulma", category: "CSS", patterns: [/bulma[-.]/, /\bis-primary\b/] },

  // Analytics
  { name: "Google Analytics", category: "Analytics", patterns: [/gtag/, /google-analytics/, /googletagmanager/, /UA-\d+/, /G-[\w]+/] },
  { name: "Segment", category: "Analytics", patterns: [/segment[-.]/, /analytics\.js/] },
  { name: "Mixpanel", category: "Analytics", patterns: [/mixpanel[-.]/, /mixpanel\.init/] },
  { name: "Hotjar", category: "Analytics", patterns: [/hotjar[-.]/, /hjSetting/] },
  { name: "Amplitude", category: "Analytics", patterns: [/amplitude[-.]/, /amplitude\.init/] },
  { name: "PostHog", category: "Analytics", patterns: [/posthog[-.]/, /posthog\.init/] },
  { name: "Plausible", category: "Analytics", patterns: [/plausible[-.]/, /plausible\.io/] },
  { name: "Fathom", category: "Analytics", patterns: [/usefathom/, /fathom\.js/] },

  // CDN / Hosting
  { name: "Vercel", category: "Hosting", patterns: [/vercel[-.]/, /\.vercel\.app/, /x-vercel/] },
  { name: "Netlify", category: "Hosting", patterns: [/netlify[-.]/, /\.netlify\.app/] },
  { name: "Cloudflare", category: "CDN", patterns: [/cloudflare[-.]/, /cdnjs\.cloudflare/, /cf-ray/] },
  { name: "AWS CloudFront", category: "CDN", patterns: [/cloudfront\.net/, /amzn/] },
  { name: "Fastly", category: "CDN", patterns: [/fastly[-.]/, /x-served-by.*cache/] },
  { name: "Akamai", category: "CDN", patterns: [/akamai[-.]/, /akamaized/] },

  // Auth
  { name: "Auth0", category: "Auth", patterns: [/auth0[-.]/, /auth0\.com/] },
  { name: "Clerk", category: "Auth", patterns: [/clerk[-.]/, /clerk\.com/] },
  { name: "Firebase Auth", category: "Auth", patterns: [/firebase[-.]/, /firebaseapp/] },
  { name: "Supabase", category: "Auth", patterns: [/supabase[-.]/, /supabase\.co/] },

  // Payments
  { name: "Stripe", category: "Payments", patterns: [/stripe[-.]/, /js\.stripe/, /stripe\.com/] },
  { name: "PayPal", category: "Payments", patterns: [/paypal[-.]/, /paypalobjects/] },
  { name: "Paddle", category: "Payments", patterns: [/paddle[-.]/, /paddle\.com/] },
  { name: "LemonSqueezy", category: "Payments", patterns: [/lemonsqueezy/, /lemon\.com/] },

  // Chat / Support
  { name: "Intercom", category: "Chat", patterns: [/intercom[-.]/, /intercomSettings/] },
  { name: "Zendesk", category: "Chat", patterns: [/zendesk[-.]/, /zdassets/] },
  { name: "Crisp", category: "Chat", patterns: [/crisp[-.]/, /crisp\.chat/] },
  { name: "Drift", category: "Chat", patterns: [/drift[-.]/, /drift\.com/] },
  { name: "Tawk.to", category: "Chat", patterns: [/tawk[-.]/, /tawk\.to/] },
  { name: "HubSpot", category: "Chat", patterns: [/hubspot[-.]/, /hs-scripts/] },

  // Email
  { name: "Mailchimp", category: "Email", patterns: [/mailchimp[-.]/, /list-manage/] },
  { name: "ConvertKit", category: "Email", patterns: [/convertkit[-.]/, /ck\.page/] },
  { name: "SendGrid", category: "Email", patterns: [/sendgrid[-.]/, /sendgrid\.net/] },

  // Other
  { name: "jQuery", category: "Library", patterns: [/jquery[-.]/, /jQuery/] },
  { name: "GSAP", category: "Animation", patterns: [/gsap[-.]/, /greensock/] },
  { name: "Framer Motion", category: "Animation", patterns: [/framer-motion/, /framer\.com/] },
  { name: "Three.js", category: "3D", patterns: [/three[-.]/, /three\.module/] },
  { name: "Lottie", category: "Animation", patterns: [/lottie[-.]/, /bodymovin/] },
  { name: "Sentry", category: "Monitoring", patterns: [/sentry[-.]/, /sentry\.io/] },
  { name: "LaunchDarkly", category: "Feature Flags", patterns: [/launchdarkly/, /ld\.js/] },
  { name: "Algolia", category: "Search", patterns: [/algolia[-.]/, /algoliasearch/] },
  { name: "Typesense", category: "Search", patterns: [/typesense/] },
  { name: "Google Fonts", category: "Fonts", patterns: [/fonts\.googleapis/, /fonts\.gstatic/] },
  { name: "Font Awesome", category: "Icons", patterns: [/fontawesome/, /fa-[\w]/, /font-awesome/] },
  { name: "Lucide", category: "Icons", patterns: [/lucide[-.]/, /lucide\.dev/] },
  { name: "Heroicons", category: "Icons", patterns: [/heroicons/] },
  { name: "reCAPTCHA", category: "Security", patterns: [/recaptcha/, /grecaptcha/] },
  { name: "hCaptcha", category: "Security", patterns: [/hcaptcha/] },
  { name: "Turnstile", category: "Security", patterns: [/turnstile/, /challenges\.cloudflare/] },
];

// ── Feature detection patterns ──

interface FeaturePattern {
  name: string;
  patterns: RegExp[];
}

const FEATURE_PATTERNS: FeaturePattern[] = [
  { name: "Authentication / Login", patterns: [/sign.?in|log.?in|auth|password/i] },
  { name: "User Registration", patterns: [/sign.?up|register|create.?account/i] },
  { name: "E-commerce / Cart", patterns: [/add.?to.?cart|shopping.?cart|checkout|buy.?now/i] },
  { name: "Search", patterns: [/search|type="search"|role="search"/i] },
  { name: "Newsletter Signup", patterns: [/newsletter|subscribe|email.?list|mailing.?list/i] },
  { name: "Contact Form", patterns: [/contact.?us|get.?in.?touch|send.?message/i] },
  { name: "Live Chat", patterns: [/live.?chat|chat.?widget|support.?chat/i] },
  { name: "Pricing Table", patterns: [/pricing|plans|per.?month|\$\d+/i] },
  { name: "Testimonials", patterns: [/testimonial|customer.?review|what.?our.?customers/i] },
  { name: "Blog / Articles", patterns: [/blog|article|posts|news/i] },
  { name: "FAQ Section", patterns: [/faq|frequently.?asked|common.?questions/i] },
  { name: "Video Embed", patterns: [/youtube\.com\/embed|vimeo\.com|wistia|video/i] },
  { name: "Social Media Links", patterns: [/twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com/i] },
  { name: "Cookie Consent", patterns: [/cookie.?consent|cookie.?policy|gdpr|accept.?cookies/i] },
  { name: "Dark Mode Toggle", patterns: [/dark.?mode|theme.?toggle|color-scheme/i] },
  { name: "Mobile Menu", patterns: [/mobile.?menu|hamburger|nav.?toggle/i] },
  { name: "Animations", patterns: [/animate|scroll.?reveal|intersection.?observer|motion/i] },
  { name: "Lazy Loading", patterns: [/loading="lazy"|data-src|lazyload/i] },
  { name: "PWA / Service Worker", patterns: [/service.?worker|manifest\.json|pwa/i] },
  { name: "Internationalization", patterns: [/i18n|lang=|hreflang|translate/i] },
  { name: "Accessibility", patterns: [/aria-|role="|sr-only|screen.?reader/i] },
  { name: "Schema.org / JSON-LD", patterns: [/schema\.org|application\/ld\+json|json-ld/i] },
  { name: "Open Graph Meta", patterns: [/og:title|og:description|og:image/i] },
  { name: "Twitter Cards", patterns: [/twitter:card|twitter:title/i] },
];

// ── Tech stack detection ──

function detectTechStack(html: string): Array<{ name: string; category: string; confidence: string }> {
  const found: Array<{ name: string; category: string; confidence: string }> = [];
  const seen = new Set<string>();

  for (const tech of TECH_SIGNATURES) {
    for (const pattern of tech.patterns) {
      if (pattern.test(html) && !seen.has(tech.name)) {
        seen.add(tech.name);
        // Multiple pattern matches = higher confidence
        const matchCount = tech.patterns.filter((p) => p.test(html)).length;
        found.push({
          name: tech.name,
          category: tech.category,
          confidence: matchCount >= 2 ? "high" : "medium",
        });
        break;
      }
    }
  }

  return found.sort((a, b) => a.category.localeCompare(b.category));
}

// ── Feature detection ──

function detectFeatures(html: string): string[] {
  const features: string[] = [];
  for (const fp of FEATURE_PATTERNS) {
    for (const p of fp.patterns) {
      if (p.test(html)) {
        features.push(fp.name);
        break;
      }
    }
  }
  return features;
}

// ── Extract meta info ──

function extractMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  if (descMatch) meta.description = descMatch[1];

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch) meta.ogTitle = ogTitleMatch[1];

  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  if (ogDescMatch) meta.ogDescription = ogDescMatch[1];

  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) meta.ogImage = ogImageMatch[1];

  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch) meta.canonical = canonicalMatch[1];

  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i);
  meta.hasViewport = viewportMatch ? "yes" : "no";

  // Count headings
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  meta.h1Count = String(h1s);

  // Count images
  const imgs = (html.match(/<img[\s>]/gi) || []).length;
  meta.imageCount = String(imgs);

  // Count links
  const links = (html.match(/<a[\s>]/gi) || []).length;
  meta.linkCount = String(links);

  // Count forms
  const forms = (html.match(/<form[\s>]/gi) || []).length;
  meta.formCount = String(forms);

  // Approximate word count
  const textOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  meta.wordCount = String(textOnly.split(/\s+/).length);

  return meta;
}

// ── Color extraction ──

function extractColors(html: string): string[] {
  const colors = new Set<string>();

  // Hex colors
  const hexMatches = html.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  hexMatches.forEach((c) => colors.add(c.toLowerCase()));

  // RGB/RGBA
  const rgbMatches = html.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g) || [];
  rgbMatches.forEach((c) => colors.add(c));

  // HSL
  const hslMatches = html.match(/hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)/g) || [];
  hslMatches.forEach((c) => colors.add(c));

  // Filter out common browser defaults and return top colors
  const filtered = Array.from(colors).filter(
    (c) => !["#000", "#000000", "#fff", "#ffffff", "#333", "#666", "#999", "#ccc", "transparent", "inherit"].includes(c)
  );

  return filtered.slice(0, 20);
}

// ── Extract fonts ──

function extractFonts(html: string): string[] {
  const fonts = new Set<string>();

  // Google Fonts
  const gfMatches = html.match(/family=([^"&]+)/g) || [];
  gfMatches.forEach((m) => {
    const family = m.replace("family=", "").replace(/\+/g, " ").split(":")[0];
    fonts.add(family);
  });

  // CSS font-family
  const ffMatches = html.match(/font-family:\s*['"]?([^;'"]+)/gi) || [];
  ffMatches.forEach((m) => {
    const family = m.replace(/font-family:\s*/i, "").replace(/['"]/g, "").split(",")[0].trim();
    if (family && !["inherit", "sans-serif", "serif", "monospace"].includes(family.toLowerCase())) {
      fonts.add(family);
    }
  });

  return Array.from(fonts);
}

export async function POST(req: NextRequest) {
  try {
    const { url, mode = "quick" } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // Validate URL
    try {
      new URL(targetUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // ── Fetch the page ──
    let html: string;
    let fetchDuration: number;
    const fetchStart = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Zoobicon-Crawler/1.0 (Competitive Intelligence; +https://zoobicon.com/crawl)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL (HTTP ${res.status}). The site may block crawlers.` },
          { status: 422 }
        );
      }

      html = await res.text();
      fetchDuration = Date.now() - fetchStart;
    } catch (err) {
      const message = err instanceof Error && err.name === "AbortError"
        ? "Request timed out (15s). The site may be slow or blocking crawlers."
        : "Could not fetch URL. The site may block cross-origin requests or be offline.";
      return NextResponse.json({ error: message }, { status: 422 });
    }

    // ── Run detections ──
    const techStack = detectTechStack(html);
    const features = detectFeatures(html);
    const meta = extractMeta(html);
    const colors = extractColors(html);
    const fonts = extractFonts(html);

    // ── Quick mode: return detections only ──
    if (mode === "quick") {
      return NextResponse.json({
        url: targetUrl,
        mode: "quick",
        fetchDuration,
        techStack,
        features,
        meta,
        colors,
        fonts,
        htmlSize: html.length,
      });
    }

    // ── Deep mode: AI analysis via Claude ──
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fall back to quick mode if no API key
      return NextResponse.json({
        url: targetUrl,
        mode: "quick",
        fetchDuration,
        techStack,
        features,
        meta,
        colors,
        fonts,
        htmlSize: html.length,
        note: "Deep analysis unavailable — ANTHROPIC_API_KEY not configured. Showing quick analysis.",
      });
    }

    const client = new Anthropic({ apiKey, timeout: 30000 });

    // Truncate HTML for Claude (keep first 30K chars)
    const truncatedHtml = html.length > 30000 ? html.slice(0, 30000) + "\n<!-- [TRUNCATED] -->" : html;

    const aiResult = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: `You are a competitive intelligence analyst. Analyze the given website HTML and provide a structured competitive analysis. Be specific, actionable, and data-driven. Focus on what a competitor building a similar product/site could learn and exploit.`,
      messages: [
        {
          role: "user",
          content: `Analyze this website (${targetUrl}).

DETECTED TECH: ${techStack.map((t) => `${t.name} (${t.category})`).join(", ") || "none detected"}
DETECTED FEATURES: ${features.join(", ") || "none detected"}
META: ${JSON.stringify(meta)}
COLORS: ${colors.join(", ")}
FONTS: ${fonts.join(", ")}

HTML (may be truncated):
${truncatedHtml}

Output a JSON object with these fields:
{
  "summary": "1-2 sentence summary of what this site is and who it's for",
  "positioning": {
    "targetAudience": "who they're targeting",
    "valueProposition": "their main value prop",
    "pricePosition": "budget|mid-range|premium|luxury|freemium",
    "tone": "professional|friendly|edgy|minimalist|corporate|playful"
  },
  "designAnalysis": {
    "layout": "describe layout approach (grid, full-width, sidebar, etc.)",
    "heroStyle": "describe hero section approach",
    "visualIdentity": "describe overall visual feel",
    "strengths": ["design strength 1", "design strength 2"],
    "weaknesses": ["design weakness 1", "design weakness 2"]
  },
  "contentStrategy": {
    "messagingApproach": "how they communicate value",
    "ctaStrategy": "describe their CTA approach",
    "socialProof": "how they use testimonials/logos/numbers",
    "contentGaps": ["missing content area 1", "missing content area 2"]
  },
  "competitiveInsights": {
    "uniqueAdvantages": ["what they do well that's hard to replicate"],
    "vulnerabilities": ["weaknesses you could exploit"],
    "opportunities": ["what they're NOT doing that you could do"],
    "threats": ["what makes them dangerous as a competitor"]
  },
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3",
    "Specific actionable recommendation 4",
    "Specific actionable recommendation 5"
  ]
}

Output ONLY valid JSON. No markdown, no code fences.`,
        },
      ],
    });

    let aiAnalysis = null;
    const aiText = aiResult.content[0].type === "text" ? aiResult.content[0].text : "";
    try {
      // Try to parse JSON from the response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // If parsing fails, include raw text
      aiAnalysis = { raw: aiText };
    }

    return NextResponse.json({
      url: targetUrl,
      mode: "deep",
      fetchDuration,
      techStack,
      features,
      meta,
      colors,
      fonts,
      htmlSize: html.length,
      aiAnalysis,
    });
  } catch (err) {
    console.error("[Crawl API] Error:", err);
    const message = err instanceof Error ? err.message : "Crawl failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
