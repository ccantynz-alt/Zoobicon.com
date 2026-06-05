/**
 * Multi-page site planner — Phase 1 of "Build the whole site from a plan".
 *
 * The existing /api/generate/react-stream pipeline plans + builds a SINGLE
 * page. Craig flagged the gap: complex sites like crontech.ai have 6+
 * pages (landing, pricing, docs, blog, auth, admin) and the user shouldn't
 * have to glue them together by hand.
 *
 * This module owns the multi-page planning step:
 *
 *   prompt → SitePlan (brand + sitemap + per-page section list + shared
 *                      components + backend needs + cost estimate)
 *
 * The plan is what the user reviews + approves BEFORE we spend the
 * expensive build budget. Cost: ~$0.001 per plan. Saves ~$0.30 every
 * time a multi-page misclick gets caught at plan stage.
 *
 * Phase 2 (next session) consumes this plan and runs N parallel react-
 * stream builds, one per page, sharing the brand kit and shared
 * navbar/footer.
 *
 * Failure model:
 *   - LLM call wrapped in callLLMWithFailover (Anthropic → OpenAI → Gemini).
 *   - If all providers fail, returns a deterministic fallback plan built
 *     from heuristic page detection on the prompt. Never throws — the
 *     caller surfaces a soft warning instead of a blank screen (Law 8).
 *   - JSON parse failures fall through to the same heuristic fallback.
 */

import { callLLMWithFailover } from "./llm-provider";
import type { ComponentCategory } from "./component-registry/store";

export type SiteTheme = "editorial" | "light" | "warm" | "dark";

export interface SitePlanBrand {
  name: string;
  primaryColor: string;     // hex
  secondaryColor?: string;
  theme: SiteTheme;
  voice: string;             // e.g. "developer-first, technical, confident"
  tagline?: string;
}

export interface PageSection {
  category: ComponentCategory;
  variantHint?: string;       // optional registry component id
  brief: string;              // one-line content brief
}

export interface SitePlanPage {
  slug: string;               // "/", "/pricing", "/docs"
  name: string;               // "Landing", "Pricing"
  purpose: string;            // why this page exists
  sections: PageSection[];
  isPublic: boolean;          // false for auth-gated
  isAdmin: boolean;           // true for admin/dashboard pages
}

export interface SitePlanShared {
  navbarVariant: string;      // registry id, e.g. "navbar-minimal"
  footerVariant: string;      // registry id
}

export interface SitePlanBackend {
  needsAuth: boolean;
  needsDatabase: boolean;
  needsStorage: boolean;
  tables?: string[];          // hinted table names
  authProviders?: string[];   // e.g. ["email", "github", "google"]
}

export interface SitePlanMeta {
  estimatedTimeSeconds: number;
  estimatedCostUsd: number;
  pageCount: number;
  componentCount: number;
  promptHash: string;
}

export interface SitePlan {
  brand: SitePlanBrand;
  pages: SitePlanPage[];
  shared: SitePlanShared;
  backend: SitePlanBackend;
  meta: SitePlanMeta;
}

const PLANNER_MODEL = "claude-haiku-4-5";

const PLANNER_SYSTEM = `You are the Zoobicon multi-page site planner.

Given a user's prompt describing a site, you return a JSON plan that
maps the prompt to a multi-page structure. The plan drives a parallel
build — one React page per entry in your sitemap.

Hard rules:
- Output ONLY a single JSON object. No prose. No markdown fences.
- Pages MUST be unique by slug. Slugs are POSIX-style ("/", "/pricing",
  "/docs/getting-started"). Home is always slug "/".
- 2-8 pages. Pick the minimum that matches the prompt. Don't pad.
- For each page, list 3-7 sections from this fixed category set:
  navbar, hero, features, testimonials, pricing, stats, faq, cta,
  footer, about, contact, gallery, blog, ecommerce, forms, misc.
- Every page should start with "navbar" and end with "footer" UNLESS
  the page is intentionally chromeless (e.g. /admin, /auth/login).
- Theme: "editorial" for premium / agency / portfolio sites, "warm" for
  hospitality / restaurant / artisan, "light" for SaaS / B2B / dev tools,
  "dark" for cyber / crypto / gaming / devtool brands.
- Backend: set needsAuth=true if the prompt mentions login/signup/
  account/admin/dashboard. needsDatabase=true if it mentions posts/
  comments/users/orders/bookings. needsStorage=true for files/uploads/
  images.
- Voice: 1-2 phrases capturing tone, e.g. "developer-first, technical,
  confident" or "warm, sensory, restaurant-friendly".

Schema you MUST match exactly:
{
  "brand": {
    "name": "string",
    "primaryColor": "#rrggbb",
    "secondaryColor": "#rrggbb",
    "theme": "editorial" | "light" | "warm" | "dark",
    "voice": "string",
    "tagline": "string"
  },
  "pages": [
    {
      "slug": "/",
      "name": "Landing",
      "purpose": "string",
      "sections": [
        { "category": "navbar", "brief": "string" },
        { "category": "hero",   "brief": "string" }
      ],
      "isPublic": true,
      "isAdmin": false
    }
  ],
  "shared": {
    "navbarVariant": "navbar-minimal",
    "footerVariant": "footer-luxury-minimal"
  },
  "backend": {
    "needsAuth": false,
    "needsDatabase": false,
    "needsStorage": false,
    "tables": [],
    "authProviders": []
  }
}`;

const VALID_CATEGORIES = new Set<ComponentCategory>([
  "navbar", "hero", "features", "testimonials", "pricing", "stats",
  "faq", "cta", "footer", "about", "contact", "gallery", "blog",
  "ecommerce", "forms", "misc",
]);

const VALID_THEMES = new Set<SiteTheme>(["editorial", "light", "warm", "dark"]);

/**
 * Parse the LLM's JSON output with depth-aware bracket matching so
 * markdown fences and leading prose don't break the parse.
 */
function extractJson<T>(raw: string): T | null {
  if (!raw) return null;
  let start = raw.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/**
 * Sanity-check + coerce the LLM's plan into our schema. Bad entries
 * are dropped rather than failing the whole plan — the caller sees
 * a valid SitePlan even if the LLM was sloppy.
 */
function normalisePlan(raw: Partial<SitePlan> | null, prompt: string): SitePlan {
  const fallback = heuristicPlan(prompt);
  if (!raw) return fallback;

  const brand: SitePlanBrand = {
    name: raw.brand?.name?.slice(0, 60) || fallback.brand.name,
    primaryColor: /^#[0-9a-f]{6}$/i.test(raw.brand?.primaryColor || "")
      ? (raw.brand!.primaryColor as string).toLowerCase()
      : fallback.brand.primaryColor,
    secondaryColor: /^#[0-9a-f]{6}$/i.test(raw.brand?.secondaryColor || "")
      ? raw.brand!.secondaryColor!.toLowerCase()
      : fallback.brand.secondaryColor,
    theme: VALID_THEMES.has(raw.brand?.theme as SiteTheme)
      ? (raw.brand!.theme as SiteTheme)
      : fallback.brand.theme,
    voice: raw.brand?.voice?.slice(0, 200) || fallback.brand.voice,
    tagline: raw.brand?.tagline?.slice(0, 140) || fallback.brand.tagline,
  };

  const seenSlugs = new Set<string>();
  const pages: SitePlanPage[] = [];
  for (const p of raw.pages || []) {
    if (!p || typeof p !== "object") continue;
    const slug = typeof p.slug === "string" && p.slug.startsWith("/")
      ? p.slug.slice(0, 80).toLowerCase()
      : null;
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);
    const sections: PageSection[] = [];
    for (const s of p.sections || []) {
      if (!s || typeof s !== "object") continue;
      if (!VALID_CATEGORIES.has(s.category as ComponentCategory)) continue;
      sections.push({
        category: s.category as ComponentCategory,
        variantHint: typeof s.variantHint === "string" ? s.variantHint : undefined,
        brief: typeof s.brief === "string" ? s.brief.slice(0, 200) : "",
      });
    }
    if (sections.length === 0) continue;
    pages.push({
      slug,
      name: typeof p.name === "string" ? p.name.slice(0, 60) : slug,
      purpose: typeof p.purpose === "string" ? p.purpose.slice(0, 200) : "",
      sections,
      isPublic: p.isPublic !== false,
      isAdmin: p.isAdmin === true,
    });
    if (pages.length >= 12) break;  // hard cap
  }
  if (pages.length === 0) return fallback;

  const shared: SitePlanShared = {
    navbarVariant: raw.shared?.navbarVariant || "navbar-minimal",
    footerVariant: raw.shared?.footerVariant || "footer-luxury-minimal",
  };

  const backend: SitePlanBackend = {
    needsAuth: raw.backend?.needsAuth === true,
    needsDatabase: raw.backend?.needsDatabase === true,
    needsStorage: raw.backend?.needsStorage === true,
    tables: Array.isArray(raw.backend?.tables)
      ? raw.backend!.tables!.filter((t) => typeof t === "string").slice(0, 20)
      : [],
    authProviders: Array.isArray(raw.backend?.authProviders)
      ? raw.backend!.authProviders!.filter((t) => typeof t === "string").slice(0, 5)
      : [],
  };

  const componentCount = pages.reduce((n, p) => n + p.sections.length, 0);
  // Build-time estimate: ~6-8s per component customisation (single LLM call),
  // running 4-wide in parallel within a page, pages run sequentially. So:
  //   timeSeconds ≈ pages × ceil(sectionsPerPage / 4) × 7
  const estimatedTimeSeconds = pages.reduce(
    (n, p) => n + Math.ceil(p.sections.length / 4) * 7,
    0,
  ) + 5; // 5s planning overhead
  // Cost estimate: $0.0012 per customisation (Haiku) + $0.001 plan = ~$0.0014/section
  const estimatedCostUsd = Math.max(0.05, componentCount * 0.0014);

  return {
    brand,
    pages,
    shared,
    backend,
    meta: {
      estimatedTimeSeconds,
      estimatedCostUsd,
      pageCount: pages.length,
      componentCount,
      promptHash: hashPrompt(prompt),
    },
  };
}

/**
 * Deterministic heuristic plan — used when the LLM is unreachable.
 * Returns a sensible single-page landing unless the prompt explicitly
 * mentions multi-page keywords.
 */
function heuristicPlan(prompt: string): SitePlan {
  const lower = prompt.toLowerCase();
  const wantsPricing = /pricing|tiers?|plans?|subscription|\$\d/i.test(prompt);
  const wantsDocs = /docs?|documentation|guides?|api reference/i.test(prompt);
  const wantsBlog = /blog|posts?|news|articles?/i.test(prompt);
  const wantsAuth = /login|signup|account|dashboard|admin|portal/i.test(prompt);
  const wantsContact = /contact|reach out|get in touch|email us/i.test(prompt);
  const wantsAbout = /about|story|team|founders?/i.test(prompt);

  const dark = /crypto|cyber|gaming|devtool|dev tool|hacker|terminal/i.test(prompt);
  const warm = /restaurant|cafe|bakery|hospitality|artisan|bistro|kitchen|pottery|craft/i.test(prompt);
  const light = /saas|b2b|developer|platform|api|cli|infrastructure/i.test(lower);
  const theme: SiteTheme = dark ? "dark" : warm ? "warm" : light ? "light" : "editorial";

  const pages: SitePlanPage[] = [
    {
      slug: "/",
      name: "Landing",
      purpose: "Capture leads and explain the product in 30 seconds.",
      sections: [
        { category: "navbar", brief: "Top navigation with logo, primary links, CTA button" },
        { category: "hero", brief: "Main headline + subheading + primary CTA" },
        { category: "features", brief: "3-6 key features that differentiate" },
        { category: "testimonials", brief: "Social proof from real users" },
        { category: "cta", brief: "Final conversion CTA" },
        { category: "footer", brief: "Footer with secondary links + contact" },
      ],
      isPublic: true,
      isAdmin: false,
    },
  ];

  if (wantsPricing) {
    pages.push({
      slug: "/pricing",
      name: "Pricing",
      purpose: "Show plans + convert visitors into paid users.",
      sections: [
        { category: "navbar", brief: "Same shared navbar" },
        { category: "pricing", brief: "Tier comparison table" },
        { category: "faq", brief: "Common pricing/billing questions" },
        { category: "cta", brief: "Get started CTA" },
        { category: "footer", brief: "Shared footer" },
      ],
      isPublic: true,
      isAdmin: false,
    });
  }

  if (wantsDocs) {
    pages.push({
      slug: "/docs",
      name: "Docs",
      purpose: "Onboarding documentation for new users.",
      sections: [
        { category: "navbar", brief: "Shared navbar" },
        { category: "hero", brief: "Docs entry hero with search" },
        { category: "features", brief: "Quickstart links — Install, First API call, Deploy" },
        { category: "footer", brief: "Shared footer" },
      ],
      isPublic: true,
      isAdmin: false,
    });
  }

  if (wantsBlog) {
    pages.push({
      slug: "/blog",
      name: "Blog",
      purpose: "Long-form content and product updates.",
      sections: [
        { category: "navbar", brief: "Shared navbar" },
        { category: "blog", brief: "Blog post grid with featured post" },
        { category: "footer", brief: "Shared footer" },
      ],
      isPublic: true,
      isAdmin: false,
    });
  }

  if (wantsAbout) {
    pages.push({
      slug: "/about",
      name: "About",
      purpose: "Tell the founder/team story.",
      sections: [
        { category: "navbar", brief: "Shared navbar" },
        { category: "about", brief: "Mission + team" },
        { category: "stats", brief: "Traction numbers" },
        { category: "footer", brief: "Shared footer" },
      ],
      isPublic: true,
      isAdmin: false,
    });
  }

  if (wantsContact) {
    pages.push({
      slug: "/contact",
      name: "Contact",
      purpose: "Direct sales / support contact form.",
      sections: [
        { category: "navbar", brief: "Shared navbar" },
        { category: "contact", brief: "Contact form + alternative channels" },
        { category: "footer", brief: "Shared footer" },
      ],
      isPublic: true,
      isAdmin: false,
    });
  }

  const componentCount = pages.reduce((n, p) => n + p.sections.length, 0);
  return {
    brand: {
      name: "Untitled Project",
      primaryColor: theme === "warm" ? "#b8923f" : theme === "dark" ? "#22d3ee" : "#1c1917",
      secondaryColor: theme === "warm" ? "#8c6b25" : theme === "dark" ? "#a78bfa" : "#a8a29e",
      theme,
      voice: theme === "warm"
        ? "warm, sensory, hospitality-friendly"
        : theme === "dark"
          ? "technical, confident, developer-first"
          : "editorial, restrained, premium",
      tagline: "",
    },
    pages,
    shared: {
      navbarVariant: "navbar-minimal",
      footerVariant: theme === "warm" ? "footer-luxury-minimal" : "footer-minimal-dark",
    },
    backend: {
      needsAuth: wantsAuth,
      needsDatabase: wantsAuth, // crude — auth implies users table
      needsStorage: /upload|files?|images?|media|gallery/i.test(prompt),
      tables: [],
      authProviders: wantsAuth ? ["email", "github", "google"] : [],
    },
    meta: {
      estimatedTimeSeconds: pages.reduce(
        (n, p) => n + Math.ceil(p.sections.length / 4) * 7,
        0,
      ) + 5,
      estimatedCostUsd: Math.max(0.05, componentCount * 0.0014),
      pageCount: pages.length,
      componentCount,
      promptHash: hashPrompt(prompt),
    },
  };
}

function hashPrompt(prompt: string): string {
  // Lightweight deterministic hash — used to dedup repeat plan requests.
  // Not cryptographic; we just need stable strings.
  let h = 0;
  for (let i = 0; i < prompt.length; i++) {
    h = ((h << 5) - h + prompt.charCodeAt(i)) | 0;
  }
  return `p_${(h >>> 0).toString(36)}`;
}

/**
 * Main entry — plan the full site.
 */
export async function planSite(prompt: string): Promise<{
  plan: SitePlan;
  source: "llm" | "fallback";
  modelUsed?: string;
}> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return { plan: heuristicPlan(""), source: "fallback" };
  }

  try {
    const res = await callLLMWithFailover({
      model: PLANNER_MODEL,
      system: PLANNER_SYSTEM,
      userMessage: `User prompt: ${trimmed}\n\nReturn the full JSON plan now.`,
      maxTokens: 2000,
    });
    const parsed = extractJson<Partial<SitePlan>>(res.text || "");
    if (parsed) {
      return {
        plan: normalisePlan(parsed, trimmed),
        source: "llm",
        modelUsed: res.model,
      };
    }
    // LLM returned text but JSON parse failed — fall through to heuristic.
    console.warn("[site-planner] LLM returned unparseable JSON; using heuristic plan");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[site-planner] LLM call failed: ${msg.slice(0, 200)}`);
  }
  return { plan: heuristicPlan(trimmed), source: "fallback" };
}
