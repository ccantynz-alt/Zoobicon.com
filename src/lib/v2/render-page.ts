/**
 * V2 server-side page renderer — the reliability core of Builder V2.
 *
 * The V1 builder asked the user's browser to transpile (Babel), hash
 * (crypto.subtle), and module-load (blob URLs) the generated site. On iPad
 * WebKit that chain breaks constantly ("Preview failed", "Load failed",
 * blank previews). V2 inverts it: the SERVER assembles the slot-locked
 * page, renders it to static HTML with react-dom/server, and the browser
 * just displays that HTML in an iframe. The client does zero code
 * execution of generated output — so it works identically on every device.
 *
 * Generation is deterministic (slot-locked templates can't emit broken
 * code). AI only fills text/values into the templates; if no LLM key is
 * configured, the canned example fills produce a complete, polished page —
 * so the preview is NEVER blank.
 */

import ts from "typescript";
import React from "react";
import * as lucide from "lucide-react";
import * as framer from "framer-motion";

// react-dom/server is loaded dynamically (below) rather than as a static
// import: Next.js's compiler rejects a static `react-dom/server` import in
// a module it can't prove is server-only. This module only ever runs in
// the nodejs route handler, so a lazy import is safe and silences the guard.
let _renderToStaticMarkup: ((el: React.ReactElement) => string) | null = null;
async function getRenderToStaticMarkup() {
  if (!_renderToStaticMarkup) {
    const mod = await import("react-dom/server");
    _renderToStaticMarkup = mod.renderToStaticMarkup;
  }
  return _renderToStaticMarkup;
}

import { SLOT_REGISTRY } from "@/lib/slot-locked/registry";
import { assembleComponent } from "@/lib/slot-locked/assembler";
import { planPageForIndustry } from "@/lib/slot-locked/industry-planner";
import { schemaToPrompt } from "@/lib/slot-locked/assembler";
import { selectComponentsForPrompt } from "@/lib/component-registry";
import { callLLMWithFailover } from "@/lib/llm-provider";
import { validateEditJson } from "@/lib/llm-output-validator";
import { industryPhotoPool } from "@/lib/stock-images";
import type { SlotValueMap } from "@/lib/slot-locked/types";

export interface RenderedPage {
  html: string;
  componentIds: string[];
  industry: string;
  theme: string;
  aiUsed: boolean;
}

// Next.js App Router aliases `react` to its Server-Components subset inside
// route handlers — hooks (useState, useRef, …) simply DON'T EXIST there. Any
// registry component that called React.useState was silently dropped from the
// page in production ("react_1.default.useState is not a function"), while
// vitest — which loads full React — passed. Navbars, carousels and accordions
// vanished from built sites for months because of this. For a STATIC first
// render the correct hook semantics are exactly "initial state, no effects",
// so when hooks are missing we supply those. The browser hydration layer uses
// the real full React from esm.sh, so live interactivity is untouched.
let _reactForComponents: typeof React | null = null;
function getReactForComponents(): typeof React {
  if (_reactForComponents) return _reactForComponents;
  const anyR = React as Record<string, unknown>;
  if (typeof anyR.useState === "function") {
    _reactForComponents = React;
    return React;
  }
  let idCounter = 0;
  // Copy key-by-key: some RSC subset exports are guarded getters that throw
  // on access — a plain spread would explode at module init.
  const base: Record<string, unknown> = {};
  for (const k of Object.keys(anyR)) {
    try {
      base[k] = anyR[k];
    } catch {
      /* guarded server-subset export — skip it */
    }
  }
  _reactForComponents = {
    ...base,
    useState: (init: unknown) => [typeof init === "function" ? (init as () => unknown)() : init, () => {}],
    useReducer: (_r: unknown, init: unknown, initFn?: (i: unknown) => unknown) => [
      initFn ? initFn(init) : init,
      () => {},
    ],
    useEffect: () => {},
    useLayoutEffect: () => {},
    useInsertionEffect: () => {},
    useRef: (v: unknown = null) => ({ current: v }),
    useMemo: (fn: () => unknown) => fn(),
    useCallback: (fn: unknown) => fn,
    useContext: (ctx: { _currentValue?: unknown } | null | undefined) => ctx && ctx._currentValue,
    useId: () => `zb-${++idCounter}`,
    useTransition: () => [false, (fn: () => void) => fn()],
    useDeferredValue: (v: unknown) => v,
    useSyncExternalStore: (
      _sub: unknown,
      getSnapshot: () => unknown,
      getServerSnapshot?: () => unknown,
    ) => (getServerSnapshot || getSnapshot)(),
    useImperativeHandle: () => {},
    useDebugValue: () => {},
    createContext:
      base.createContext ||
      ((def: unknown) => {
        const ctx = {
          _currentValue: def,
          Provider: ({ children }: { children?: unknown }) => children,
          Consumer: ({ children }: { children?: (v: unknown) => unknown }) =>
            typeof children === "function" ? children(def) : null,
        };
        return ctx;
      }),
  } as unknown as typeof React;
  return _reactForComponents;
}

// Transpile a TSX component string and render it to static HTML. Runs
// entirely on the server (Node runtime). Mirrors the proven approach in
// the render smoke tests.
export async function renderComponentToHtml(tsx: string): Promise<string> {
  const renderToStaticMarkup = await getRenderToStaticMarkup();
  const js = ts.transpileModule(tsx, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    reportDiagnostics: false,
  }).outputText;

  const moduleObj: { exports: Record<string, unknown> } = { exports: {} };
  const requireShim = (id: string): unknown => {
    if (id === "react") return getReactForComponents();
    if (id === "react/jsx-runtime" || id === "react/jsx-dev-runtime") return require("react/jsx-runtime");
    if (id === "lucide-react") return lucide;
    if (id === "framer-motion") return framer;
    return {};
  };
  new Function("require", "module", "exports", js)(requireShim, moduleObj, moduleObj.exports);
  const Comp = moduleObj.exports.default as React.ComponentType | undefined;
  if (typeof Comp !== "function") throw new Error("component has no default export");
  return renderToStaticMarkup(React.createElement(Comp));
}

// Compile a TSX component to a browser-ready ES MODULE (imports kept as bare
// specifiers, resolved by the iframe's importmap). This is the other half of
// "live but reliable": the server does the TypeScript+JSX compile (no Babel
// in the browser — the single most fragile piece of the old V1 runtime), and
// the iframe just imports the finished module and mounts it over the static
// HTML. If the import/mount fails for any reason, the static render stays —
// so hydration can only ever ENHANCE the page, never blank it.
export function compileComponentToModule(tsx: string): string {
  return ts.transpileModule(tsx, {
    compilerOptions: {
      jsx: ts.JsxEmit.React, // classic runtime — React is imported in the module
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    reportDiagnostics: false,
  }).outputText;
}

// Lightweight industry/theme heuristics so we don't need an LLM round-trip
// just to plan the page. (The AI still customises the copy below.)
export function detectIndustry(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/\b(restaurant|cafe|bakery|menu|dining|bistro|coffee)\b/.test(p)) return "restaurant";
  if (/\b(portfolio|photographer|designer|artist|creative)\b/.test(p)) return "portfolio";
  if (/\b(saas|software|platform|api|dashboard|app|startup)\b/.test(p)) return "saas";
  if (/\b(agency|studio|consultanc|marketing)\b/.test(p)) return "agency";
  if (/\b(shop|store|ecommerce|product|boutique)\b/.test(p)) return "ecommerce";
  if (/\b(law|legal|attorney|firm|accountant|finance)\b/.test(p)) return "professional";
  if (/\b(gym|fitness|trainer|yoga|wellness)\b/.test(p)) return "fitness";
  return "other";
}

function detectTheme(prompt: string): "editorial" | "warm" | "light" {
  const p = prompt.toLowerCase();
  if (/\b(restaurant|cafe|bakery|warm|cozy|rustic|artisan)\b/.test(p)) return "warm";
  return "editorial";
}

// AI-fill one component's slots. Best-effort: any failure returns the
// canned example so the page is never blank or broken.
async function fillSlots(
  entry: typeof SLOT_REGISTRY[string],
  prompt: string,
  brandName: string,
): Promise<{ slots: SlotValueMap; aiUsed: boolean }> {
  try {
    const aiPrompt = schemaToPrompt(entry.schema, `Brand: ${brandName || "(none)"}. User prompt: ${prompt}`);
    const fb = await callLLMWithFailover({
      model: "claude-sonnet-4-6",
      system:
        "You are filling in the slots of a hand-written React component template. " +
        "Output ONLY a valid JSON object matching the schema. No prose, no markdown fences.",
      userMessage: aiPrompt,
      maxTokens: 2000,
    });
    const validation = validateEditJson(fb.text);
    if (!validation.ok) return { slots: entry.example, aiUsed: false };
    const start = fb.text.indexOf("{");
    const end = fb.text.lastIndexOf("}");
    if (start === -1 || end === -1) return { slots: entry.example, aiUsed: false };
    return { slots: JSON.parse(fb.text.slice(start, end + 1)) as SlotValueMap, aiUsed: true };
  } catch {
    return { slots: entry.example, aiUsed: false };
  }
}

/**
 * Build + render a complete slot-locked page to static HTML on the server.
 *
 * @param opts.useExampleFill - skip the LLM and assemble from canned
 *   examples (fast, deterministic; used for previews/tests/no-key envs).
 */
export async function renderSlotPage(opts: {
  prompt: string;
  brandName?: string;
  industry?: string;
  theme?: string;
  useExampleFill?: boolean;
}): Promise<RenderedPage> {
  const industry = opts.industry || detectIndustry(opts.prompt);
  const theme = opts.theme || detectTheme(opts.prompt);
  const brandName = (opts.brandName || "").trim();

  const componentIds = planPageForIndustry({ industry, theme }).filter((id) => SLOT_REGISTRY[id]);

  const hasKey = Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY,
  );
  const doAi = !opts.useExampleFill && hasKey;

  let aiUsed = false;
  const sections: string[] = [];

  // Fill all components in parallel (independent), then assemble + render
  // each in order. Parallel fill keeps wall-clock to the slowest call.
  const fills = await Promise.all(
    componentIds.map(async (id) => {
      const entry = SLOT_REGISTRY[id];
      if (doAi) {
        const r = await fillSlots(entry, opts.prompt, brandName);
        if (r.aiUsed) aiUsed = true;
        return { id, slots: r.slots };
      }
      return { id, slots: entry.example };
    }),
  );

  for (const { id, slots } of fills) {
    const entry = SLOT_REGISTRY[id];
    const asm = assembleComponent({ template: entry.template, schema: entry.schema, slots });
    const code = asm.ok && asm.code ? asm.code : assembleComponent({ template: entry.template, schema: entry.schema, slots: entry.example }).code;
    if (!code) continue;
    try {
      sections.push(await renderComponentToHtml(code));
    } catch {
      // A single section failing to render never blanks the page.
      continue;
    }
  }

  return {
    html: pageShell(sections.join("\n"), brandName, { industry }),
    componentIds,
    industry,
    theme,
    aiUsed,
  };
}

// ───────────────────────────────────────────────────────────────────────
// REGISTRY-POWERED RENDER (the rich path) — V2's default engine.
//
// Uses the full 118-component $100K-agency registry with prompt-aware
// selection (selectComponentsForPrompt scores every component against the
// prompt), then AI-rewrites the COPY in each selected component to fit the
// business, then server-renders. Quality of V1's library + reliability of
// V2's server render. A customisation that fails to render falls back to
// the (already polished) base component — so it can't break the page.
// ───────────────────────────────────────────────────────────────────────

// Ask the model to rewrite only the user-facing text of a component to fit
// the business, keeping structure/classes/imports intact. Returns the full
// component code, or null on any failure (caller falls back to the base).
export async function aiRewriteCopy(
  baseCode: string,
  prompt: string,
  brandName: string,
  category: string,
): Promise<string | null> {
  try {
    const fb = await callLLMWithFailover({
      model: "claude-sonnet-4-6",
      system:
        "You are tailoring a production React component for a specific business. " +
        "You will receive a complete React component. Rewrite ONLY the user-facing TEXT " +
        "(headlines, paragraphs, button labels, nav links, testimonial quotes, customer names, " +
        "stat labels and numbers, FAQ questions/answers, footer text) so it fits the business described. " +
        "KEEP the JSX structure, every className, every import (including `import React`), all props, all logic, " +
        "and all inline SVG EXACTLY as-is. Do not add or remove elements. Do not change styling or layout. " +
        "Make the copy specific, confident and on-brand — never generic placeholder text like 'Acme' or 'lorem ipsum'. " +
        "Return ONLY the complete component code — no markdown fences, no commentary.",
      userMessage: `Business: ${prompt}\nBrand name: ${brandName || "(choose one that fits)"}\nSection: ${category}\n\nComponent code:\n\n${baseCode}`,
      maxTokens: 4000,
    });
    let out = (fb.text || "").trim();
    // Strip markdown fences if the model added them despite instructions.
    out = out.replace(/^```[a-zA-Z]*\n?/, "").replace(/\n?```$/, "").trim();
    if (out.length < 80 || !/export\s+default/.test(out)) return null;
    return out;
  } catch {
    return null;
  }
}

/**
 * Build + render a complete page from the full 118-component registry,
 * tailored to the prompt and rendered server-side. This is the rich,
 * prompt-relevant engine the /api/v2/build route uses by default.
 */
export async function renderFromRegistry(opts: {
  prompt: string;
  brandName?: string;
  useExampleFill?: boolean;
}): Promise<RenderedPage> {
  const prompt = opts.prompt.trim();
  const brandName = (opts.brandName || "").trim();
  const industry = detectIndustry(prompt);

  // Prompt-aware selection across the whole registry ($100K components).
  const components = selectComponentsForPrompt(prompt);

  const hasKey = Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY,
  );
  const doAi = !opts.useExampleFill && hasKey;
  let aiUsed = false;

  const allCategories = new Set(components.map((c) => c.category));
  const sections = await Promise.all(
    components.map(async (c, idx) => {
      // Registry component code omits `import React`; the pipeline prepends
      // it. Match that so the component renders in isolation. Same source
      // transforms as the streaming route: industry imagery + live CTAs.
      const base = activateCtas(
        swapImagesForIndustry(`import React from "react";\n\n${c.code}\n`, industry, idx),
        allCategories,
      );
      let code = base;
      if (doAi) {
        const rewritten = await aiRewriteCopy(base, prompt, brandName, c.category);
        if (rewritten) { code = rewritten; aiUsed = true; }
      }
      // Render the tailored version; if it fails, fall back to the polished
      // base; if THAT fails, drop the section rather than blank the page.
      try {
        return applyBrandTokens(await renderComponentToHtml(code), brandName);
      } catch {
        try {
          return applyBrandTokens(await renderComponentToHtml(base), brandName);
        } catch {
          return "";
        }
      }
    }),
  );

  // Anchor ids + link repair: first section of each category carries its
  // category as an id, and every internal href resolves to a real anchor.
  const present = new Set(components.map((c) => c.category));
  const seen = new Set<string>();
  const wrapped = sections.map((html, i) => {
    if (!html) return "";
    const cat = components[i].category;
    if (!seen.has(cat)) {
      seen.add(cat);
      // Some components already carry their own id="<category>" — don't duplicate.
      if (!html.includes(`id="${cat}"`)) return `<section id="${cat}">${html}</section>`;
    }
    return html;
  });

  return {
    html: pageShell(normalizePageLinks(wrapped.filter(Boolean).join("\n"), present), brandName, { industry }),
    componentIds: components.map((c) => c.id),
    industry,
    theme: "editorial",
    aiUsed,
  };
}

// ───────────────────────────────────────────────────────────────────────
// SHARED RENDER HELPERS (used by the streaming build route too).
// ───────────────────────────────────────────────────────────────────────

// Industries whose brand reads as editorial / prestige — these get Playfair
// display headings (the audit's "$100K serif pairing" gap). Modern/tech
// industries keep the clean Inter sans look, where serif would feel wrong.
const SERIF_INDUSTRIES = new Set(["restaurant", "portfolio", "professional", "agency", "other"]);

export function usesSerifHeadings(industry: string): boolean {
  return SERIF_INDUSTRIES.has(industry);
}

// Wrap a rendered section so the in-iframe script can address it by index
// for progressive hot-swap (instant base render → AI-tailored copy lands).
// When the section's category is an anchor target (features/pricing/faq/…),
// the wrapper carries that id so in-page nav/footer links actually work.
export function sectionWrap(index: number, html: string, anchorId?: string): string {
  const id = anchorId ? ` id="${anchorId}"` : "";
  return `<section data-zb-i="${index}"${id}>${html}</section>`;
}

// ── In-page link repair ─────────────────────────────────────────────────
// Registry components link to conventional anchors (#features, #pricing) or
// route-style paths (/about, /pricing). On a single-page build those ids
// never existed and the routes 404 — in the srcdoc preview a route click
// navigated the iframe to an invalid URL ("all the footer links error").
// Fix: sections expose their category as an id (sectionWrap above), and
// every internal href is normalised to the matching anchor — or defused to
// "#" if nothing on the page matches. External/mailto/tel links untouched.
const ANCHOR_SYNONYMS: Record<string, string[]> = {
  features: ["features", "feature", "services", "service", "products", "product", "solutions", "work", "menu", "how-it-works"],
  pricing: ["pricing", "prices", "plans", "plan"],
  faq: ["faq", "faqs", "questions", "help"],
  contact: ["contact", "contact-us", "get-in-touch", "book", "booking", "quote", "support"],
  testimonials: ["testimonials", "reviews", "customers", "stories", "case-studies"],
  about: ["about", "about-us", "team", "story", "mission", "company"],
  stats: ["stats", "results", "numbers", "impact"],
  gallery: ["gallery", "photos", "showcase", "portfolio"],
  blog: ["blog", "news", "articles", "resources"],
  cta: ["signup", "sign-up", "start", "get-started", "demo", "trial"],
};

// ── Source-level transforms ─────────────────────────────────────────────
// These run on the component CODE (not the rendered HTML) so the static
// render, the live hydrated React, the export, and follow-up edits all stay
// consistent — an HTML-only patch would be undone the moment a section
// hydrates and re-renders from source.

// (1) Industry image swap. Registry components ship with fixed Unsplash IDs
// (SaaS dashboards, nature shots) regardless of the business — a bakery was
// getting analytics laptops and beaches. Swap every Unsplash photo ID for one
// from the curated industry pool (src/lib/stock-images.ts), deterministically
// seeded by section index so builds are stable. Size/crop params are kept.
// Avatar photos (randomuser.me) are intentionally untouched.
export function swapImagesForIndustry(code: string, industry: string, seed: number): string {
  const pool = industryPhotoPool(industry);
  if (!pool.length) return code;
  let n = 0;
  return code.replace(/images\.unsplash\.com\/photo-[a-zA-Z0-9_-]+/g, () => {
    const id = pool[(seed * 2 + n) % pool.length];
    n += 1;
    return `images.unsplash.com/${id}`;
  });
}

// (2) Dead-CTA activation. Many registry components render their calls to
// action as bare <button> elements with no onClick and no href — "Order
// Online Now" did literally nothing. Buttons WITHOUT behaviour whose label
// matches a known intent become real anchors to the matching section on the
// page. Buttons with onClick (menus, accordions, carousels) and submit
// buttons are never touched.
const CTA_INTENTS: Array<{ pattern: RegExp; targets: string[] }> = [
  { pattern: /order|buy now|shop|add to cart|cart/i, targets: ["ecommerce", "contact", "cta", "pricing"] },
  { pattern: /pricing|plans?\b/i, targets: ["pricing", "cta", "contact"] },
  { pattern: /menu|baking|browse|gallery|portfolio|our work|view|see |explore|discover|learn more|what we do/i, targets: ["features", "gallery", "about", "pricing"] },
  { pattern: /book|reserve|contact|get in touch|quote|call us|talk to/i, targets: ["contact", "cta", "forms"] },
  { pattern: /start|trial|join|sign up|demo|get started/i, targets: ["cta", "contact", "forms", "pricing"] },
];

export function activateCtas(code: string, presentCategories: Set<string>): string {
  return code.replace(/<button\b([^>]*)>([\s\S]*?)<\/button>/g, (full, attrs: string, inner: string) => {
    if (/onClick|type=["']submit["']/.test(attrs)) return full;
    const label = inner.replace(/\{[^}]*\}/g, " ").replace(/<[^>]+>/g, " ");
    for (const intent of CTA_INTENTS) {
      if (!intent.pattern.test(label)) continue;
      const target = intent.targets.find((t) => presentCategories.has(t));
      if (!target) return full;
      return `<a href="#${target}"${attrs}>${inner}</a>`;
    }
    return full;
  });
}

function anchorForSlug(slug: string, present: Set<string>): string | null {
  for (const [category, slugs] of Object.entries(ANCHOR_SYNONYMS)) {
    if (present.has(category) && (category === slug || slugs.includes(slug))) return category;
  }
  return null;
}

export function normalizePageLinks(html: string, presentCategories: Set<string>): string {
  return html.replace(/href="([^"]*)"/g, (full, href: string) => {
    if (
      /^(https?:)?\/\//.test(href) ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href === "#"
    ) {
      return full;
    }
    const slug = href
      .replace(/^#/, "")
      .replace(/^\//, "")
      .replace(/\.html?$/, "")
      .replace(/\/$/, "")
      .toLowerCase();
    if (!slug || slug === "home" || slug === "top") return 'href="#"';
    const anchor = anchorForSlug(slug, presentCategories);
    if (anchor) return `href="#${anchor}"`;
    // Anchor to an id we know exists? Keep it. Anything else is a dead
    // route/section — defuse it so it can never error the page.
    if (href.startsWith("#") && presentCategories.has(slug)) return full;
    return 'href="#"';
  });
}

// CRITICAL FIX: the registry components were written against the main app's
// Tailwind config, which defines custom color ramps (navy/brand/zoo/dark/
// accent/warm). The preview iframe loads the *vanilla* Tailwind Play CDN,
// which knows none of them — so `bg-navy-950` (dark navbars/heroes), brand
// accents, etc. silently resolved to NOTHING, rendering dark sections with no
// background ("washed-out / average header"). Feeding the CDN the same custom
// palette makes those sections render exactly as designed. Mirrors
// tailwind.config.ts.
const TAILWIND_CONFIG = `<script>
window.tailwind = window.tailwind || {};
tailwind.config = { theme: { extend: { colors: {
  navy: {50:"#fafaf9",100:"#f5f5f4",200:"#e7e5e4",300:"#d6d3d1",400:"#a8a29e",500:"#78716c",600:"#57534e",700:"#44403c",800:"#292524",900:"#1c1917",950:"#0c0a09"},
  brand: {200:"#f4ead0",300:"#e7d6a3",400:"#d4b86d",500:"#b8923f",600:"#9c7a2c",700:"#7a5e1f"},
  dark: {100:"#fbf9f1",200:"#f7f4e8",300:"#f0ecdc"},
  zoo: {50:"#fdf9ec",100:"#fbf2d4",200:"#f4ead0",300:"#e7d6a3",400:"#d4b86d",500:"#b8923f",600:"#9c7a2c",700:"#7a5e1f",800:"#5a4716",900:"#3a2e0e"},
  accent: {cyan:"#a8a29e",purple:"#78716c",pink:"#b8923f",stone:"#78716c"},
  warm: {50:"#fafaf9",100:"#f5f5f4",200:"#e7e5e4",300:"#d6d3d1",400:"#a8a29e",500:"#78716c",600:"#57534e",700:"#44403c",800:"#292524",900:"#1c1917"}
} } } };
</script>`;

// Placeholder brand names baked into the registry templates. If the AI copy
// pass is off (no key) or misses them, they leak as "old website" branding.
// A cheap deterministic swap replaces them with the real (or derived) brand so
// the header never ships someone else's name.
const PLACEHOLDER_BRANDS = ["Acme", "Nexus", "Launchpad", "Velocita", "Lumina", "Apex", "Nova", "Stellar"];

export function applyBrandTokens(html: string, brand: string): string {
  const name = (brand || "").trim();
  if (!name) return html;
  let out = html;
  for (const p of PLACEHOLDER_BRANDS) {
    out = out.replace(new RegExp(`\\b${p}\\b`, "g"), name);
  }
  return out;
}

// Browser runtime deps for the live-preview hydration layer. React does the
// TS/JSX compile server-side, so the browser only needs these libs (no Babel,
// no module graph). esm.sh is the source; if any fails to load, the affected
// section simply stays as its server-rendered static HTML.
const HYDRATE_IMPORTMAP = JSON.stringify({
  imports: {
    react: "https://esm.sh/react@18.3.1",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "lucide-react": "https://esm.sh/lucide-react@1.7.0?external=react",
    "framer-motion": "https://esm.sh/framer-motion@12.38.0?external=react,react-dom",
    clsx: "https://esm.sh/clsx@2.1.1",
    "tailwind-merge": "https://esm.sh/tailwind-merge@2.5.5",
  },
});

// The iframe document. Editorial-light design tokens inline; Tailwind via
// CDN (a single reliable stylesheet generator — the ONLY script in the
// iframe, and not our generated code). Playfair + Inter for the editorial,
// non-cyberpunk look. The Tailwind Play CDN watches the DOM, so sections
// inserted/replaced after load are styled automatically.
export function pageShell(
  body: string,
  brandName: string,
  opts: { industry?: string; streaming?: boolean } = {},
): string {
  const title = brandName ? `${escapeHtml(brandName)} — built with Zoobicon` : "Zoobicon preview";
  const serif = opts.industry ? usesSerifHeadings(opts.industry) : true;
  const headingRule = serif
    ? `h1,h2{font-family:"Playfair Display",Georgia,serif;letter-spacing:-0.02em;}`
    : "";
  // Importmap (head, before any module) for the hydration layer.
  const importmap = opts.streaming
    ? `<script type="importmap">${HYDRATE_IMPORTMAP}</script>`
    : "";
  // Listener that (1) hot-swaps each section's static HTML as it streams in,
  // then (2) mounts the LIVE React component over it so the page is fully
  // interactive — accordions open, menus drop, toggles toggle, animations
  // play. Every step is wrapped so a failure leaves the static HTML intact:
  // hydration strictly enhances, never regresses. Only emitted for streaming.
  const streamScript = opts.streaming
    ? `<script>
(function(){
  var ZB = (window.__ZB__ = window.__ZB__ || { roots:{}, React:null, createRoot:null, reactPromise:null });
  function place(root, idx, html){
    if (!root) return;
    var existing = root.querySelector('[data-zb-i="'+idx+'"]');
    if (existing){ existing.outerHTML = html; return; }
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    var node = tmp.firstElementChild;
    if (!node) return;
    var after = null, kids = root.children;
    for (var i=0;i<kids.length;i++){
      var k = parseInt(kids[i].getAttribute('data-zb-i'),10);
      if (k > idx){ after = kids[i]; break; }
    }
    root.insertBefore(node, after);
  }
  function ensureReact(){
    if (ZB.React) return Promise.resolve();
    if (!ZB.reactPromise){
      ZB.reactPromise = Promise.all([import('react'), import('react-dom/client')]).then(function(m){
        ZB.React = m[0].default || m[0];
        ZB.createRoot = m[1].createRoot;
      });
    }
    return ZB.reactPromise;
  }
  function hydrate(idx, js){
    ensureReact().then(function(){
      var React = ZB.React;
      var node = document.querySelector('[data-zb-i="'+idx+'"]');
      if (!node || !React) return;
      var url;
      try { url = URL.createObjectURL(new Blob([js], { type: 'application/javascript' })); }
      catch(_){ return; }
      import(url).then(function(mod){
        try { URL.revokeObjectURL(url); } catch(_){}
        var Comp = (mod && (mod.default || mod));
        if (typeof Comp !== 'function') return;
        if (ZB.roots[idx]){ try { ZB.roots[idx].unmount(); } catch(_){} }
        // Capture the server-rendered static markup so we can put it back if
        // the live component throws — even asynchronously, in an effect. The
        // section degrades to static; it can never end up blank.
        var staticHtml = node.innerHTML;
        var restored = false;
        function restore(){
          if (restored) return; restored = true;
          try { if (ZB.roots[idx]) ZB.roots[idx].unmount(); } catch(_){}
          try { node.innerHTML = staticHtml; } catch(_){}
        }
        var Boundary = class extends React.Component {
          constructor(p){ super(p); this.state = { e: null }; }
          static getDerivedStateFromError(e){ return { e: e }; }
          componentDidCatch(){ setTimeout(restore, 0); }
          render(){ return this.state.e ? null : this.props.children; }
        };
        try {
          var root = ZB.createRoot(node);
          ZB.roots[idx] = root;
          root.render(React.createElement(Boundary, null, React.createElement(Comp)));
        } catch(_){ restore(); /* static HTML stays — never regress */ }
      }).catch(function(){ /* esm.sh / import failure — static stays */ });
    }).catch(function(){ /* React failed to load — page stays static */ });
  }
  window.addEventListener('message', function(e){
    var d = e.data || {};
    if (d.type === 'zb-section'){
      place(document.getElementById('zb-root'), d.index, d.html);
      if (d.js) hydrate(d.index, d.js);
    } else if (d.type === 'zb-edit-mode'){
      // Point-and-edit: parent toggles pick mode; we highlight sections on
      // hover and report the clicked one instead of activating it.
      ZB.pick = !!d.on;
      document.documentElement.classList.toggle('zb-pick', ZB.pick);
    }
  });
  document.addEventListener('click', function(e){
    var t = e.target;
    if (ZB.pick){
      e.preventDefault();
      e.stopPropagation();
      var sec = t && t.closest ? t.closest('[data-zb-i]') : null;
      if (sec){
        var idx = parseInt(sec.getAttribute('data-zb-i'), 10);
        try { parent.postMessage({ type: 'zb-section-pick', index: idx }, '*'); } catch(_){}
      }
      return;
    }
    // Link safety net: the preview lives in a srcdoc iframe, so navigating it
    // anywhere breaks the preview. External links open in a new tab, known
    // anchors smooth-scroll, everything else is inert (never an error page).
    var a = t && t.closest ? t.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^(https?:)?\\/\\//.test(href) || /^https?:/.test(href)){
      e.preventDefault();
      try { window.open(href, '_blank', 'noopener'); } catch(_){}
      return;
    }
    if (href.charAt(0) === '#' && href.length > 1){
      var target = document.getElementById(href.slice(1));
      e.preventDefault();
      if (target){ try { target.scrollIntoView({ behavior: 'smooth' }); } catch(_){ target.scrollIntoView(); } }
      return;
    }
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;
    e.preventDefault(); // '#', '', or a route that doesn't exist here
  }, true);
  function ready(){ try { parent.postMessage({type:'zb-ready'}, '*'); } catch(_){} }
  if (document.readyState !== 'loading') ready();
  else document.addEventListener('DOMContentLoaded', ready);
})();
</script>`
    : "";
  const bodyContent = opts.streaming ? `<div id="zb-root">${body}</div>` : body;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${TAILWIND_CONFIG}
  ${importmap}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300..900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --paper:#ffffff; --paper-elevated:#fcfaf3; --paper-bright:#fefdf7;
      --ink:#1a1a1c; --ink-secondary:#2a2a30; --ink-muted:#76767e;
      --rule:#ebe7d6; --rule-strong:#a8a392;
      --gold:#b8923f; --gold-soft:rgba(184,146,63,0.14); --gold-deep:#8c6b25;
    }
    html,body{margin:0;background:var(--paper);color:var(--ink);
      font-family:"Inter",system-ui,-apple-system,sans-serif;
      -webkit-font-smoothing:antialiased;}
    *{box-sizing:border-box;}
    ${headingRule}
    /* Point-and-edit pick mode (inert unless the parent toggles .zb-pick). */
    .zb-pick [data-zb-i]{cursor:crosshair;}
    .zb-pick [data-zb-i]:hover{outline:3px solid #e8402b;outline-offset:-3px;}
  </style>
</head>
<body>
${bodyContent}
${streamScript}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));
}
