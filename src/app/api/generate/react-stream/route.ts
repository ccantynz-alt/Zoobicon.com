/**
 * POST /api/generate/react-stream
 *
 * Streams a Sandpack-ready React project as Server-Sent Events.
 * Built on the new primitives:
 *   - src/lib/anthropic-cached.ts        (callClaude / streamClaude)
 *   - src/lib/builder-critique.ts        (runQualityLoop)
 *   - src/lib/component-registry/index.ts (60-component registry)
 *
 * Event types emitted:
 *   phase     { phase, message }
 *   component { name, code, position }
 *   files     { files }
 *   supabase  { projectUrl, anonKey, projectRef, needsAuth, needsDatabase, needsStorage, tables, authProviders, buckets }
 *   score     { score, issues }
 *   error     { message, hint }
 *   done      { files, score, durationMs, supabase? }
 *
 * Bible Law 8: every error path emits an "error" SSE event with a clear hint.
 */

import { NextRequest } from "next/server";
import { callClaude, streamClaude } from "@/lib/anthropic-cached";
import { runQualityLoop } from "@/lib/builder-critique";
import { callLLMWithFailover, getAvailableProviders } from "@/lib/llm-provider";
import { validateGeneratedComponent, detectRefusal } from "@/lib/llm-output-validator";
import { verifyGeneratedCode, buildRepairPrompt } from "@/lib/builder-critique/code-verifier";
import { TelemetryRecorder } from "@/lib/build-telemetry";
import { checkBuildQuota, recordBuildQuotaUsage, type QuotaPlan } from "@/lib/build-quota";
import { getPlanFromRequest, shouldWatermark } from "@/lib/user-plan";
import {
  detectSupabaseNeeds,
  needsSupabase,
} from "@/lib/supabase-detect";
import type { SupabaseNeeds } from "@/lib/supabase-detect";
import { generateZoobiconClient, generateZoobiconAuthProvider } from "@/lib/zoobicon-client";
// Component registry is imported lazily inside POST to avoid circular dependency
// at module load time (the registry's side-effect imports cause a TDZ error in webpack).
import type { RegistryComponent, ComponentCategory } from "@/lib/component-registry";

async function getRegistry() {
  const mod = await import("@/lib/component-registry");
  // CRITICAL — REGISTRY is empty until ensureRegistryLoaded() runs the
  // side-effect imports for navbars/heroes/features/etc. Without this
  // call, any direct REGISTRY.map / REGISTRY.filter on the returned
  // module reads an empty array — which silently broke planComponents
  // (it kept falling through to the heuristic selector). 2026-05-26 fix.
  mod.ensureRegistryLoaded();
  return mod;
}

export const maxDuration = 300;

type Mode = "fast" | "premium";

interface RequestBody {
  prompt: string;
  mode?: Mode;
}

interface SSEWriter {
  send: (event: string, data: unknown) => void;
  close: () => void;
}

/**
 * Map the route's semantic event names to the legacy event types the builder
 * client understands. The builder reads `data:` lines and dispatches on
 * `event.type`, accepting: status | partial | scaffold | scaffold-update |
 * customization | done | error.
 *
 * Previously, this writer emitted `event: NAME\ndata: {...}\n\n` SSE frames
 * — proper SSE — but the builder client never reads `event:` lines. Every
 * message was silently dropped and the safety net fired "No components
 * generated." That's the bug Craig has been hitting.
 */
function mapEvent(name: string, data: unknown): Record<string, unknown> {
  const obj =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : { data };

  switch (name) {
    case "phase":
      // { phase, message } → status event the builder shows in the pipeline log
      return { type: "status", message: obj.message || obj.phase || "Working…", ...obj };
    case "files":
      // { files } → partial event the builder uses to update Sandpack preview
      return { type: "partial", ...obj };
    case "component": {
      // { name, code, position } → status log entry (partial already carries files)
      const position = typeof obj.position === "number" ? obj.position + 1 : undefined;
      return {
        type: "status",
        message: position ? `Customising ${obj.name} (#${position})` : `Customising ${obj.name}`,
        section: obj.name,
        phase: "building",
      };
    }
    case "supabase":
      return { type: "status", message: "Backend provisioned", supabase: obj };
    case "score":
      return { type: "status", message: `Quality score: ${obj.score ?? "?"}`, ...obj };
    case "fallback":
      // Phase 2 (2026-05-13): when callLLMWithFailover switches providers
      // mid-build, surface which model is being tried so the UI can
      // show "Anthropic overloaded — switching to OpenAI" instead of a
      // silent 10-second wait.
      return {
        type: "status",
        message: obj.section
          ? `Anthropic unavailable — switching to ${obj.model} (${obj.provider}) for ${obj.section}`
          : `Switching to ${obj.model} (${obj.provider})`,
        ...obj,
      };
    case "warning":
      // Was previously dropped on the floor — client never saw partial-
      // failure warnings emitted by customiseComponent.
      return { type: "warning", ...obj };
    case "done":
      return { type: "done", ...obj };
    case "error":
      return { type: "error", ...obj };
    default:
      return { type: name, ...obj };
  }
}

function makeWriter(controller: ReadableStreamDefaultController<Uint8Array>): SSEWriter & {
  hasTerminated: () => boolean;
} {
  const encoder = new TextEncoder();
  let closed = false;
  // Phase 2 (2026-05-13): track whether a terminal event (done/error/
  // fatal) was actually emitted before close(). The audit found cases
  // where controller.enqueue silently fails mid-stream and the writer
  // closes without the client ever seeing a terminal event — looks
  // like a hang. close() now force-emits a synthetic fatal if needed.
  let terminated = false;
  return {
    send(event, data) {
      if (closed) return;
      const payload = mapEvent(event, data);
      const sse = `data: ${JSON.stringify(payload)}\n\n`;
      try {
        controller.enqueue(encoder.encode(sse));
        if (event === "done" || event === "error") terminated = true;
      } catch {
        closed = true;
      }
    },
    close() {
      if (closed) return;
      if (!terminated) {
        // Force a terminal event so the client never hangs.
        try {
          const payload = mapEvent("error", {
            message: "Build stream closed unexpectedly.",
            hint: "Please retry. If this keeps happening contact support@zoobicon.com.",
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          /* enqueue may already fail — nothing we can do */
        }
      }
      closed = true;
      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
    hasTerminated: () => terminated,
  };
}

const MODEL_HAIKU = "claude-haiku-4-5";
// Sonnet 4.6 outperforms Opus on coding tasks — better structured output,
// faster, cheaper. Confirmed by Craig 2026-05-28.
const MODEL_SONNET = "claude-sonnet-4-6";

/** Build the cacheable registry catalog the planner sees. */
async function buildRegistryCatalog(): Promise<string> {
  const { REGISTRY, getByCategory } = await getRegistry();
  const lines: string[] = [
    "ZOOBICON COMPONENT REGISTRY — pick the best variant per slot.",
    "",
  ];
  const cats = Array.from(new Set(REGISTRY.map((c) => c.category))).sort();
  for (const cat of cats) {
    lines.push(`## ${cat}`);
    for (const c of getByCategory(cat)) {
      lines.push(`- id="${c.id}" variant="${c.variant}" tags=[${c.tags.join(",")}] — ${c.description}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

let _plannerSystemCache: string | null = null;
async function getPlannerSystemCacheable(): Promise<string> {
  if (_plannerSystemCache) return _plannerSystemCache;
  _plannerSystemCache = `You are the section planner for the Zoobicon AI website builder.

Your job: pick the best component id for each slot in a website, drawn ONLY from the registry catalog provided below. You also emit a BRAND SPEC — a typed sheet of design tokens (palette + typography) that the downstream customiser must use as the single source of truth for the build. You return JSON only.

Rules:
- Pick exactly one id per slot you include.
- Use slots that match the user's intent (a SaaS site needs pricing + logos; a restaurant needs gallery + contact).
- Order: navbar first, footer last. Hero second.
- Never invent ids. If a slot has no good fit, omit it.
- Output ONLY JSON, no prose, no markdown fences.

BRAND SPEC RULES (Sprint 1 Q4 — kills color drift across the build):
- The brand spec is the contract. Every component the customiser builds MUST draw colors + fonts from this sheet, not invent its own.
- textPrimary MUST meet 4.5:1 contrast against bgColor — this is WCAG AA. Pick deep ink on light bg (e.g. #18181b on #fafafa) or near-white on dark (e.g. #f5f5f4 on #0c0a09). The Prestige Properties cream-on-cream bug came from textPrimary being too pale; never pick something like #d4a574 as textPrimary on a cream background.
- accentColor is reserved for icons, hover states, small badge text, and primary button fills — never body text.
- headlineFont + bodyFont are explicit Google Font names (or "Inter", "Playfair Display", "Fraunces", "JetBrains Mono", etc.). The customiser will reference them via Tailwind's font-* classes.

Schema:
{
  "brandName": "<short brand name inferred from prompt>",
  "primaryColor": "<hex — main brand color, used for primary CTAs>",
  "bgColor": "<hex — page background color>",
  "textPrimary": "<hex — body text color, must hit 4.5:1 against bgColor>",
  "textSecondary": "<hex — supporting/muted text, must hit 4.5:1 against bgColor>",
  "accentColor": "<hex — for icons, hovers, small accent surfaces; NOT for body copy>",
  "headlineFont": "<font family name — e.g. 'Playfair Display' or 'Inter'>",
  "bodyFont": "<font family name — typically 'Inter' or system font stack>",
  "selections": [
    { "slot": "navbar|hero|features|stats|logos|testimonials|pricing|faq|cta|about|contact|gallery|blog|ecommerce|forms|footer|misc",
      "id": "<registry id>" }
  ]
}

REGISTRY CATALOG:
${await buildRegistryCatalog()}`;
  return _plannerSystemCache;
}

interface PlannerSelection {
  slot: string;
  id: string;
}

interface PlannerOutput {
  brandName?: string;
  primaryColor?: string;
  bgColor?: string;
  // Q4 brand-token-sheet additions (planner-emitted, customiser-consumed):
  textPrimary?: string;
  textSecondary?: string;
  accentColor?: string;
  headlineFont?: string;
  bodyFont?: string;
  selections: PlannerSelection[];
}

/** Q4: structured brand spec passed to every customiser call so all
 *  components share one palette + typography sheet. Kills the
 *  cream-on-cream bug class by making contrast a planner contract. */
interface BrandSpec {
  brandName: string;
  primaryColor: string;
  bgColor: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  headlineFont: string;
  bodyFont: string;
}

function safeParseJson<T>(raw: string): T | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

interface PlanResult {
  components: RegistryComponent[];
  brandName: string;
  primaryColor: string;
  bgColor: string;
  // Q4 brand spec — passed forward to every customiseComponent call
  brandSpec: BrandSpec;
}

/**
 * Best-effort brand name extraction from the user's prompt.
 *
 * Returns either an explicit name found in the prompt OR a slug derived
 * from the prompt's salient nouns. The previous version silently returned
 * "Northwind" whenever the explicit-name regex missed — which gave every
 * site that didn't say "called X" a generic Microsoft-branded fallback.
 * That was a Bible Law 8 violation: the user had no way to know we'd
 * picked a placeholder.
 *
 * Now: explicit match → use it. Otherwise pull the most signal-rich word
 * (first capitalised non-stopword, then first noun-like token) so the
 * generated site at least references the user's vocabulary. If even that
 * fails we surface a clear "BRAND_INFERRED" sentinel so the caller can
 * emit a warning event instead of shipping a placeholder name.
 */
const BRAND_STOPWORDS = new Set([
  "a","an","and","or","the","for","with","without","my","our","your","their",
  "this","that","these","those","is","are","was","were","be","been","being",
  "i","you","we","they","he","she","it","want","need","build","create","make",
  "site","website","page","app","application","store","shop","platform","tool",
]);

export function inferBrandName(prompt: string): string {
  const explicit = prompt.match(/(?:called|named|for|brand(?:ed)?)\s+([A-Z][A-Za-z0-9]{1,30})/);
  if (explicit) return explicit[1];

  const tokens = prompt.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const cap = tokens.find((t) => /^[A-Z]/.test(t) && !BRAND_STOPWORDS.has(t.toLowerCase()) && t.length >= 3 && t.length <= 24);
  if (cap) return cap.charAt(0).toUpperCase() + cap.slice(1);

  const noun = tokens.find((t) => !BRAND_STOPWORDS.has(t.toLowerCase()) && t.length >= 4 && t.length <= 24);
  if (noun) return noun.charAt(0).toUpperCase() + noun.slice(1).toLowerCase();

  // Last resort — derive from the first non-stopword token of any length.
  // This is still better than "Northwind" because at least the user's
  // vocabulary shows up in the generated copy.
  const firstReal = tokens.find((t) => !BRAND_STOPWORDS.has(t.toLowerCase()) && t.length >= 2);
  if (firstReal) return firstReal.charAt(0).toUpperCase() + firstReal.slice(1).toLowerCase();

  return "Studio";
}

async function planComponents(prompt: string): Promise<PlanResult> {
  const { getById, selectComponentsForPrompt } = await getRegistry();

  // T8 — industry-aware defaults. Detect the niche from the user prompt
  // using the existing detectIndustry heuristic, look up the niche in
  // our SEO catalog (the same catalog that drives the 28 niche pages
  // at /ai-website-builder-for/[slug]), and inject the must-haves +
  // sections list as planner context. The planner then has
  // niche-specific guidance for free.
  let nicheHint = "";
  try {
    const { detectIndustry } = await import("@/lib/stock-images");
    const { NICHES } = await import("@/lib/seo/niches");
    const industry = detectIndustry(prompt); // "restaurant", "saas", etc.
    if (industry) {
      // Loose match: niche slug starts with or contains the industry token.
      const niche = NICHES.find(
        (n) =>
          n.slug === industry ||
          n.slug.startsWith(industry) ||
          n.slug.includes(industry) ||
          n.name.toLowerCase().includes(industry)
      );
      if (niche) {
        nicheHint =
          `\n\nINDUSTRY DETECTED: ${niche.name} (${niche.slug})\n` +
          `Audience: ${niche.audience}\n` +
          `Typical sections for this niche (pick components that cover these):\n` +
          niche.sections.map((s) => `  - ${s}`).join("\n") +
          `\nMust-haves for this niche:\n` +
          niche.mustHaves.map((m) => `  - ${m}`).join("\n");
      }
    }
  } catch {
    // Industry detection or niche catalog failed — non-fatal; planner
    // proceeds with prompt-only context.
  }

  // Planning uses callLLMWithFailover so Anthropic outages don't kill builds.
  // Order: Anthropic Haiku (fastest) → Sonnet → OpenAI → Gemini.
  let text = "";
  try {
    const plannerSystem =
      "Return only JSON matching the schema.\n\n" + (await getPlannerSystemCacheable());
    const res = await callLLMWithFailover({
      model: MODEL_HAIKU,
      system: plannerSystem,
      userMessage: `User prompt: ${prompt}${nicheHint}`,
      maxTokens: 1500,
    });
    text = res.text || "";
  } catch (err) {
    console.warn("[react-stream] planComponents LLM failed, using registry fallback:", err);
    // Registry fallback will take over below — no throw.
  }

  const parsed = text ? safeParseJson<PlannerOutput>(text) : null;

  const resolved: RegistryComponent[] = [];
  if (parsed && Array.isArray(parsed.selections)) {
    const seenCategories = new Set<string>();
    for (const sel of parsed.selections) {
      const comp = getById(sel.id);
      if (comp && !seenCategories.has(comp.category)) {
        seenCategories.add(comp.category);
        resolved.push(comp);
      }
    }
  }

  // Q4: build a complete brand spec from parsed values plus contrast-
  // safe defaults. Spread the spec into the returned PlanResult so it
  // flows through to every customiseComponent call. The defaults are
  // chosen to PASS WCAG AA (4.5:1) — that's the whole point of Q4.
  const buildBrandSpec = (resolvedBrandName: string, fallbackMode: boolean): BrandSpec => ({
    brandName: resolvedBrandName,
    primaryColor: parsed?.primaryColor ?? (fallbackMode ? "#1c1917" : "#4f46e5"),
    bgColor: parsed?.bgColor ?? (fallbackMode ? "#FAF9F6" : "#ffffff"),
    // Default body text is near-black on light, near-white on dark.
    // Both pass AA against the bgColor defaults above (>12:1 ratio).
    textPrimary: parsed?.textPrimary ?? "#18181b",
    textSecondary: parsed?.textSecondary ?? "#52525b",
    accentColor: parsed?.accentColor ?? parsed?.primaryColor ?? "#a16207",
    headlineFont: parsed?.headlineFont ?? "Playfair Display",
    bodyFont: parsed?.bodyFont ?? "Inter",
  });

  if (resolved.length < 3) {
    const fallback = selectComponentsForPrompt(prompt);
    const resolvedBrandName = parsed?.brandName ?? inferBrandName(prompt);
    return {
      components: fallback,
      brandName: resolvedBrandName,
      primaryColor: parsed?.primaryColor ?? "#1c1917",
      bgColor: parsed?.bgColor ?? "#FAF9F6",
      brandSpec: buildBrandSpec(resolvedBrandName, true),
    };
  }

  const resolvedBrandName = parsed?.brandName ?? inferBrandName(prompt);
  return {
    components: resolved,
    brandName: resolvedBrandName,
    primaryColor: parsed?.primaryColor ?? "#4f46e5",
    bgColor: parsed?.bgColor ?? "#ffffff",
    brandSpec: buildBrandSpec(resolvedBrandName, false),
  };
}

const CUSTOMISER_SYSTEM_BASE = `You customise a single React component for the Zoobicon AI website builder.

You receive:
- A base component file (TypeScript + Tailwind).
- A customisation brief (brand, voice, colors, copy direction).

Your job: rewrite the component, preserving its structure, exports, and Tailwind classes, but replacing all placeholder copy with real, specific, on-brand copy.

Hard rules:
- Output ONLY the full updated TypeScript file. No prose. No markdown fences.
- Keep the same default export name and signature.
- Keep imports identical unless you genuinely need a new one.
- IMPORTS ARE LIMITED. You may only import from these packages:
    react, react-dom, lucide-react, framer-motion, clsx, tailwind-merge
  PLUS relative imports (./, ../) for sibling components and the
  generated './lib/zoobicon' client when auth/database is wired.
  NEVER import @supabase/*, @auth/*, react-countup, embla-carousel,
  react-icons, react-spring, swr, axios, lodash, date-fns, or ANY
  other npm package. The Sandpack runtime cannot resolve them and the
  preview will fail to compile. If you need an icon, use lucide-react.
  If you need motion, use framer-motion. If you need a carousel,
  build it with framer-motion + state instead of importing a library.
- Replace AI-slop words ("revolutionary", "unleash", "empower", "synergy", "next-generation", "game-changer", "leverage", "elevate", "seamless", "cutting-edge") with specific copy.
- Use real-sounding metrics, not "10,000+ users".
- Add aria-labels to icon-only buttons. Add alt text to images. Keep responsive classes.
- For navbars: anchor links (href="#features", "#pricing", etc.) MUST match real section ids on the page. Only use: features, pricing, faq, about, contact. Never use #docs, #solutions, #markets, or any id that won't exist as a section.

QUALITY CONTRACT — non-negotiable, the builder ships these or it doesn't ship:

CONTRAST (WCAG AA minimum 4.5:1 for body, 3:1 for large text):
- Body copy (any <p>, <span>, <li>, table cell) MUST use a text color that meets 4.5:1 against the section's background. On a light/cream background that means text-stone-900, text-stone-800, text-slate-900, text-slate-800, text-amber-950, text-orange-950, text-zinc-900 — NEVER text-amber-600 / text-orange-600 / text-yellow-700 / text-stone-500 / text-slate-500 for body copy.
- The same applies to feature descriptions, testimonial quotes, FAQ answers, and any descriptive text under a heading. If you would not be confident reading the copy in bright daylight on a phone, the contrast is wrong.
- Accent colors (text-amber-600, text-rose-700, etc.) are reserved for: small UPPERCASE eyebrow labels (>= text-xs font-semibold tracking-wider), icon strokes, link hover states, and small badge/pill text — never the main body.
- "EST. 1998" style eyebrow labels: if they're going to be small + uppercase + tracking-wide, make them text-stone-800 / text-amber-900 / text-orange-900, NOT pale gold. The Prestige Properties bug ("EST. 1998 · SOTHEBY'S AFFILIATED" rendered in pale gold on cream) is the failure mode we ship against.

NON-EMPTY CTAS:
- Every <button>, <a> styled as a button, and every link with role="button" MUST have visible text content (not just an icon). Pattern: <button>Get started <ArrowRight /></button> — never <button><ArrowRight /></button> unless it has BOTH aria-label="..." AND a visually-hidden span (sr-only) with the same label.
- The secondary CTA next to the primary in a hero MUST have a label. Never render an empty pill button just because it looks balanced.
- Form submits ("Subscribe", "Send", "Book a table", etc.) MUST have explicit text labels.

SEMANTIC HTML:
- Top-level region tags by component type:
    Navbar → <header><nav>...</nav></header>
    Hero / page top → <section> with id="hero" or omit id
    Features / pricing / FAQ / testimonials / about / contact → <section id="..."> matching the slug
    Footer → <footer>
- Use <article> for repeating cards that have a title + body (blog posts, testimonials, team members). Use <ul><li> for lists of links / nav items. Use <dl><dt><dd> for label-value pairs (stats).
- Headings descend logically: each page has exactly one <h1>; sections start with <h2>; sub-elements use <h3>. Never use <h4>+.

MOBILE-FIRST RESPONSIVENESS:
- Default classes apply at the smallest breakpoint. Add sm:, md:, lg: variants for larger screens.
- Grids: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 (never default to grid-cols-3 with no mobile fallback).
- Typography: text-2xl sm:text-3xl lg:text-5xl on h1/h2 (never default to a desktop size).
- Padding: px-4 sm:px-6 lg:px-8 minimum on outer containers.

ACCESSIBILITY:
- All images have alt="..." (descriptive, not "image of"). Decorative images use alt="".
- All form inputs have associated <label> (visible or sr-only).
- focus-visible:ring-2 focus-visible:ring-offset-2 on every interactive element.
- aria-current="page" on active nav items if you can infer them.`;

const THEME_BRIEFS: Record<string, string> = {
  editorial: `
EDITORIAL DESIGN SYSTEM — MANDATORY
This site ships on the Zoobicon editorial preset. It is a restrained, world-stage typographic aesthetic. You MUST:
- Use ONLY the stone- color family for every Tailwind color utility (from, via, to, text, bg, border, shadow, ring, outline, divide, etc.). NO violet, purple, fuchsia, pink, rose, indigo, blue, sky, cyan, teal, emerald, green, lime, yellow, amber, orange, red. Gray/slate/neutral/zinc/stone/black/white are fine, but prefer stone.
- Wrap one word or short phrase in each h1/h2 in <em>…</em> so the editorial Fraunces italic serif accent kicks in. Example: <h1>Design that <em>moves</em> people.</h1>
- Keep motion measured — subtle transitions only. No neon glows, no vibrant shadows, no arcade colors.
- Prefer understated copy. Editorial voice, not landing-page hype.`,

  light: `
LIGHT / BRIGHT DESIGN SYSTEM — MANDATORY
This site ships BRIGHT, AIRY, and WELCOMING — the visual opposite of the dark-tech default. You MUST:
- Backgrounds are WHITE (bg-white) or very light (bg-slate-50, bg-stone-50). NEVER bg-gray-900, bg-navy-950, bg-black, bg-[#0a1628], or any other dark background. If the base component has a dark background class, REPLACE it with bg-white.
- Primary text is dark on light: text-slate-900, text-stone-900, text-slate-800. Body text text-slate-600 or text-stone-600.
- Accent color is allowed and encouraged — pick ONE family (blue-600, indigo-600, sky-600, emerald-600, teal-600) and use it consistently for buttons, links, and highlights. Do NOT mix multiple accent colors.
- Borders are light: border-slate-200, border-stone-200, border-gray-200.
- Shadows are subtle: shadow-sm, shadow-md, shadow-slate-900/5. No black shadows on light backgrounds.
- Copy is warm, confident, human — not corporate jargon. Speak directly to the customer's need.
- Keep motion subtle. No neon, no glow, no gradient text that looks like a crypto site.`,

  warm: `
WARM / ARTISAN DESIGN SYSTEM — MANDATORY
This site ships on a warm cream + amber palette. Restaurant, bakery, hospitality, artisan voice. You MUST:
- Backgrounds are cream (bg-amber-50, bg-orange-50) or warm off-white. NEVER dark backgrounds.
- Primary text (body, paragraphs, descriptions, list items, table cells) is deep warm tone: text-stone-900, text-amber-950, text-orange-950, text-zinc-900. NEVER text-amber-600, text-amber-700, text-orange-600, text-yellow-700 on a cream background — those fail WCAG AA (the Prestige Properties cream-on-cream bug). If you find yourself reaching for text-amber-{500..700} for body copy, STOP and use text-stone-900 / text-amber-950 instead.
- Accent (used ONLY for small UPPERCASE eyebrow labels, icon strokes, link hover, badges): amber-700 / amber-800 / orange-700 / orange-800 / rose-700 (for restaurants). The accent should ALWAYS be at least -700 weight on a cream background to maintain 4.5:1 contrast. amber-600 is too pale; bump to amber-700.
- Eyebrow labels (e.g. "EST. 1998 · SOTHEBY'S AFFILIATED"): use text-amber-900 or text-stone-800 with tracking-widest, NOT text-amber-600 / text-amber-500.
- Stats and metric numbers (e.g. "$2.3B in Sales Volume"): the number itself is text-stone-900 / text-amber-950; the caption beneath is text-stone-700.
- Borders are warm: border-amber-200, border-stone-200.
- Wrap one evocative word in each h1/h2 in <em>…</em> so the Playfair italic serif accent renders.
- Copy is sensory, specific, inviting. Name real dishes, real rooms, real experiences.`,

  dark: `
DARK DESIGN SYSTEM — MANDATORY
This site ships DARK. You MUST:
- Backgrounds are dark: bg-navy-950, bg-[#0a1628], bg-navy-950, bg-zinc-950.
- Primary text is light: text-white, text-slate-100, text-stone-100. Body text text-slate-400 or text-slate-300.
- Accent color is neon-ish — cyan-400, emerald-400, violet-500, fuchsia-500 — pick ONE and stick with it.
- Borders are subtle white: border-white/10, border-slate-800.
- Shadows can use glow effects: shadow-cyan-500/20, shadow-violet-500/30.
- Copy is confident and technical. This is a cyber/crypto/gaming/devtool brand.`,
};

function buildCustomiserSystem(theme: "editorial" | "light" | "warm" | "dark"): string {
  return CUSTOMISER_SYSTEM_BASE + "\n" + (THEME_BRIEFS[theme] || THEME_BRIEFS.editorial);
}

// Back-compat default — the editorial preset is still the default when no theme is passed.
const CUSTOMISER_SYSTEM = buildCustomiserSystem("editorial");

interface CustomiseArgs {
  baseCode: string;
  brandName: string;
  category: ComponentCategory;
  variant: string;
  prompt: string;
  primaryColor: string;
  model: string;
  /** Visual theme — drives which system prompt is sent to the LLM. */
  theme: "editorial" | "light" | "warm" | "dark";
  /**
   * Q4 brand spec — the shared palette + typography sheet from the
   * planner. The customiser MUST draw colors + fonts from this spec;
   * no component should invent its own palette. Kills the
   * cream-on-cream class of bugs by making contrast a contract.
   * Optional for back-compat — if absent the customiser falls back
   * to the legacy brandName + primaryColor hints.
   */
  brandSpec?: BrandSpec;
  /**
   * When true, the generated project has a live Supabase client wired
   * up at `./lib/supabase`. The customiser should wire real auth / data
   * calls into interactive elements (sign-in, sign-up, contact forms,
   * bookings) so the site actually works end-to-end.
   */
  supabase?: {
    needsAuth: boolean;
    needsDatabase: boolean;
    needsStorage: boolean;
  };
  /**
   * Phase 2 (2026-05-13): called once if the primary model fails and
   * callLLMWithFailover switches to another provider mid-build. Lets
   * the caller emit a user-visible "switching to OpenAI" status event.
   */
  onFallback?: (provider: string, model: string) => void;
}

function stripFencesAndWrap(raw: string): string {
  const m = raw.match(/```(?:tsx?|typescript)?\s*([\s\S]*?)```/);
  const code = (m ? m[1] : raw).trim();
  if (!code.includes("import React")) {
    return `import React from "react";\n\n${code}\n`;
  }
  return `${code}\n`;
}

/**
 * Q3 — slot contract validation. After the customiser emits a
 * component, scan it for the failure patterns that produced the
 * Prestige Properties bug: empty <button></button>, anchor links
 * styled as buttons with no children, untouched placeholder copy,
 * images missing alt text.
 *
 * Returns an array of human-readable issue messages. Empty array
 * means the component passed; non-empty means the customiser needs a
 * second pass with the issues listed as the fix-list.
 *
 * We intentionally check for *patterns* in the source rather than
 * trying to render and inspect the DOM — keeps this synchronous, no
 * additional dependencies, and runs in well under a millisecond per
 * component.
 */
function validateCustomisedComponent(code: string): string[] {
  const issues: string[] = [];

  // 1. Empty buttons — <button>…</button> with no text content or
  // child elements other than self-closing icons. Catches both
  // <button></button> and <button>   </button> and
  // <button><ArrowRight /></button> (icon-only with no aria-label).
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
  let m: RegExpExecArray | null;
  while ((m = buttonRegex.exec(code))) {
    const attrs = m[1];
    const inner = m[2].trim();
    const hasAriaLabel = /\baria-label\s*=/.test(attrs);
    // Strip JSX children that are self-closing icons / spans
    const textish = inner
      .replace(/<[A-Z][A-Za-z0-9]*\b[^>]*\/>/g, "") // self-closing components
      .replace(/<\/?\w+[^>]*>/g, "") // open/close tags
      .replace(/\{[^}]*\}/g, "X") // JSX expressions count as "content"
      .trim();
    if (!textish && !hasAriaLabel) {
      issues.push(
        "Empty <button> with no text content and no aria-label — every button must have a visible label or aria-label."
      );
    }
  }

  // 2. Link-as-button with empty body — same failure mode rendered
  // via <a className="..button..">.
  const linkAsButton = /<a\b([^>]*className\s*=\s*["'][^"']*\b(?:btn|button|cta)\b[^"']*["'][^>]*)>([\s\S]*?)<\/a>/g;
  while ((m = linkAsButton.exec(code))) {
    const inner = m[2].trim();
    const textish = inner
      .replace(/<[A-Z][A-Za-z0-9]*\b[^>]*\/>/g, "")
      .replace(/<\/?\w+[^>]*>/g, "")
      .replace(/\{[^}]*\}/g, "X")
      .trim();
    if (!textish) {
      issues.push(
        "Anchor styled as button has no visible label — fill in the link text."
      );
    }
  }

  // 3. Images without alt text. Catches both <img ... /> and <img ...>
  // without an alt= attribute.
  const imgRegex = /<img\b([^>]*?)\/?>/g;
  while ((m = imgRegex.exec(code))) {
    const attrs = m[1];
    if (!/\balt\s*=/.test(attrs)) {
      issues.push(
        "<img> missing alt attribute — every image needs alt='descriptive text' (or alt='' if purely decorative)."
      );
    }
  }

  // 4. Untouched placeholder copy that betrays we didn't actually
  // customise. Either pure {{lorem}} mustache, Lorem ipsum substrings,
  // or our own sentinel keywords from base components.
  const placeholderHits = [
    /\bLorem ipsum\b/i,
    /\b\{\{\s*[a-z_]+\s*\}\}/, // {{handle}} mustache
    /\bAcme Inc\.?\b/,
    /\bCompany Name\b/,
  ];
  for (const re of placeholderHits) {
    if (re.test(code)) {
      issues.push(
        `Placeholder copy still present (${re.source}) — replace with real on-brand copy.`
      );
    }
  }

  // De-dupe — the same regex can fire multiple times per component
  // but the fix is the same.
  return Array.from(new Set(issues));
}

/**
 * When Supabase is provisioned, every interactive component (navbars with
 * Sign In, heroes with Sign Up, contact forms, auth pages) should wire
 * into the real client instead of shipping dead buttons. This block is
 * appended to the customiser's user message so the LLM knows the exact
 * imports and call patterns to use.
 */
function buildSupabaseBrief(needs: {
  needsAuth: boolean;
  needsDatabase: boolean;
  needsStorage: boolean;
}): string {
  const lines: string[] = [
    "",
    "BACKEND — ZOOBICON IS WIRED",
    "This project has a live Zoobicon client at ./lib/zoobicon.ts. If this",
    "component has ANY interactive elements, wire them to the real client",
    "using the patterns below. Do NOT leave dead buttons.",
    "",
    'Import with: import { signUp, signIn, signOut, getUser, insert, query } from "../lib/zoobicon";',
  ];

  if (needs.needsAuth) {
    lines.push(
      "",
      "AUTH (available):",
      "- Sign In buttons → onClick: const { user } = await signIn(email, password)",
      "- Sign Up buttons → onClick: const { user } = await signUp(email, password)",
      "- Sign Out → onClick: await signOut()",
      "- Use React useState for email/password inputs. Show error messages on failure.",
      "- For navbars: show 'Sign In' / 'Sign Up' when signed out, 'Sign Out' when signed in",
      "  (use useEffect + getUser() on mount to check session).",
    );
  }

  if (needs.needsDatabase) {
    lines.push(
      "",
      "DATABASE (available):",
      "- Contact forms → await insert(\"messages\", { name, email, message })",
      "- Bookings → await insert(\"bookings\", { name, date, time, email })",
      "- Profile reads → const rows = await query(\"profiles\", { user_id: userId })",
      "- Wire real submit handlers. Show success / error states with useState.",
    );
  }

  if (needs.needsStorage) {
    lines.push(
      "",
      "STORAGE (available):",
      "- File uploads → use a standard <input type=\"file\"> and POST to /api/v1/storage/upload",
      "- Show upload progress with useState. Store the returned URL via insert(\"files\", { url, name })",
    );
  }

  lines.push(
    "",
    "Still keep imports minimal. Only import `{ signUp, signIn, signOut, getUser, insert, query }`",
    "from \"../lib/zoobicon\" when this component actually needs them. Preserve the design system.",
    "",
  );

  return lines.join("\n");
}

interface CustomiseResult {
  ok: boolean;
  code: string;           // Either the customised file, or the raw base component as a last-resort fallback
  reason?: string;        // Why we fell back — always populated when ok === false
  modelUsed?: string;     // The model that actually produced the code (for telemetry)
}

async function customiseComponent(args: CustomiseArgs): Promise<CustomiseResult> {
  const supabaseBrief = args.supabase ? buildSupabaseBrief(args.supabase) : "";
  const systemPrompt = buildCustomiserSystem(args.theme);

  // Q4: brand spec block — the planner-emitted token sheet rendered
  // as a hard contract in the customiser user message. Every component
  // built in this run shares one palette + typography, killing the
  // color-drift bug class. Falls back to the legacy brandName +
  // primaryColor hints when brandSpec is absent (back-compat).
  const brandBlock = args.brandSpec
    ? [
        ``,
        `BRAND SPEC — these are the ONLY colors and fonts you may use.`,
        `Do NOT pick a Tailwind color outside this sheet for any element.`,
        ``,
        `  brandName       ${args.brandSpec.brandName}`,
        `  bgColor         ${args.brandSpec.bgColor}  (use as the section background)`,
        `  primaryColor    ${args.brandSpec.primaryColor}  (primary CTAs, primary buttons)`,
        `  textPrimary     ${args.brandSpec.textPrimary}  (body copy, paragraphs, list text — passes WCAG AA against bgColor)`,
        `  textSecondary   ${args.brandSpec.textSecondary}  (muted descriptions, captions)`,
        `  accentColor     ${args.brandSpec.accentColor}  (icon strokes, hover states, small badges — NEVER body text)`,
        `  headlineFont    ${args.brandSpec.headlineFont}  (use in <h1><h2><h3>)`,
        `  bodyFont        ${args.brandSpec.bodyFont}  (default body)`,
        ``,
        `When picking Tailwind classes, match the hex above to the closest Tailwind shade. For example: if textPrimary is #18181b use text-zinc-900; if accentColor is #a16207 use text-amber-700. Never reach for a vivid color (text-cyan-500, text-rose-500) that isn't in this sheet.`,
        ``,
      ].join("\n")
    : "";

  const userMsg =
    `BRAND: ${args.brandName}\n` +
    `PRIMARY COLOR: ${args.primaryColor}\n` +
    `THEME: ${args.theme}\n` +
    `SECTION: ${args.category} (${args.variant})\n` +
    `USER PROMPT: ${args.prompt}\n` +
    brandBlock +
    supabaseBrief +
    `\nBASE COMPONENT FILE:\n${args.baseCode}\n\n` +
    `Output the full updated TypeScript file only.`;

  const attemptLog: string[] = [];

  // Try streaming Claude first (fastest path when Anthropic is healthy).
  try {
    let collected = "";
    for await (const delta of streamClaude({
      model: args.model,
      system: systemPrompt,
      messages: [{ role: "user", content: userMsg }],
      maxTokens: 4000,
      temperature: 0.6,
    })) {
      if (delta.type === "text" && delta.text) {
        collected += delta.text;
      }
    }
    const stripped = stripFencesAndWrap(collected);
    const validation = validateGeneratedComponent(stripped);
    if (validation.ok) {
      // B2 verification loop — even when the validator passes, run the
      // deeper JSX-balance + tag-balance check. If THIS fails, send the
      // error back to Haiku for ONE repair pass before falling through
      // to the failover provider. Matches Bolt V2's auto-error-fixing.
      const verified = verifyGeneratedCode(stripped);
      if (verified.ok) {
        // Q3 slot contract validation — catches empty buttons, anchor
        // links styled as buttons with no labels, untouched placeholder
        // copy, missing alts. If issues found, ONE repair pass with the
        // slot issues as the fix-list. If repair doesn't help, ship the
        // original anyway (better than a base-component fallback).
        const slotIssues = validateCustomisedComponent(stripped);
        if (slotIssues.length === 0) {
          return { ok: true, code: stripped, modelUsed: args.model };
        }
        console.warn(
          `[react-stream] slot validator flagged ${args.category}: ${slotIssues.join("; ")}`
        );
        try {
          const slotRepair = await callLLMWithFailover({
            model: args.model,
            system: systemPrompt,
            userMessage: buildRepairPrompt(stripped, slotIssues),
            maxTokens: 4000,
          });
          const slotRepaired = stripFencesAndWrap(slotRepair.text || "");
          const slotRepairValid = validateGeneratedComponent(slotRepaired);
          const slotRepairVerified = verifyGeneratedCode(slotRepaired);
          const slotRepairIssues = validateCustomisedComponent(slotRepaired);
          if (
            slotRepairValid.ok &&
            slotRepairVerified.ok &&
            slotRepairIssues.length === 0
          ) {
            console.info(`[react-stream] slot repair succeeded for ${args.category}`);
            return {
              ok: true,
              code: slotRepaired,
              modelUsed: `${slotRepair.model || args.model} (slot-repair)`,
            };
          }
          attemptLog.push(
            `slot-repair: ${slotRepairIssues.length} issues remain after one pass`
          );
        } catch (repairErr) {
          const msg = repairErr instanceof Error ? repairErr.message : String(repairErr);
          attemptLog.push(`slot-repair: ${msg.slice(0, 80)}`);
        }
        // Repair didn't fix it — ship the original; slot issues degrade
        // quality but don't break the build. UI surfaces these via the
        // failedSections warning chain elsewhere.
        return { ok: true, code: stripped, modelUsed: args.model };
      }
      attemptLog.push(`${args.model}: verifier flagged ${verified.issues.length} issues`);
      console.warn(`[react-stream] verifier flagged ${args.category}: ${verified.issues.join("; ")}`);
      // Repair attempt — one shot at fixing, then fall through to failover.
      try {
        const repairFb = await callLLMWithFailover({
          model: args.model,
          system: systemPrompt,
          userMessage: buildRepairPrompt(stripped, verified.issues),
          maxTokens: 4000,
        });
        const repairedCode = stripFencesAndWrap(repairFb.text || "");
        const repairValidation = validateGeneratedComponent(repairedCode);
        if (repairValidation.ok) {
          const repairVerified = verifyGeneratedCode(repairedCode);
          if (repairVerified.ok) {
            console.info(`[react-stream] auto-repair succeeded for ${args.category}`);
            return { ok: true, code: repairedCode, modelUsed: `${repairFb.model || args.model} (auto-repair)` };
          }
        }
        attemptLog.push(`repair: still flagged after one pass`);
      } catch (repairErr) {
        const msg = repairErr instanceof Error ? repairErr.message : String(repairErr);
        attemptLog.push(`repair: ${msg.slice(0, 80)}`);
      }
    } else {
      attemptLog.push(`${args.model}: ${validation.reason}`);
      console.warn(`[react-stream] validation rejected ${args.category} from ${args.model}: ${validation.reason}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    attemptLog.push(`${args.model}: ${msg.slice(0, 120)}`);
    console.warn(`[react-stream] streamClaude failed for ${args.category}:`, msg);
  }

  // Failover path — callLLMWithFailover cycles Anthropic → OpenAI → Gemini.
  // Any provider returning usable text wins. If they all fail, we return ok=false
  // with the raw base component as last-resort code so the build still completes,
  // and the caller surfaces a warning event to the UI (Law 8: never silent).
  try {
    const fb = await callLLMWithFailover(
      {
        model: args.model,
        system: systemPrompt,
        userMessage: userMsg,
        maxTokens: 4000,
      },
      // Surface the provider switch to the caller so the UI shows
      // "Anthropic unavailable — switching to OpenAI" instead of a
      // silent 10-second pause.
      (provider, model) => args.onFallback?.(provider, model),
    );
    const stripped = stripFencesAndWrap(fb.text || "");
    const validation = validateGeneratedComponent(stripped);
    if (validation.ok) {
      return { ok: true, code: stripped, modelUsed: fb.model || args.model };
    }
    attemptLog.push(`${fb.model || "failover"}: ${validation.reason}`);
    console.warn(`[react-stream] validation rejected ${args.category} from failover: ${validation.reason}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    attemptLog.push(`failover: ${msg.slice(0, 120)}`);
    console.warn(`[react-stream] callLLMWithFailover failed for ${args.category}:`, msg);
  }

  return {
    ok: false,
    code: `import React from "react";\n\n${args.baseCode}\n`,
    reason: attemptLog.join(" | "),
  };
}

// Common deps every generated site uses. PINNED versions match the
// SandpackPreview pre-warm map (src/components/SandpackPreview.tsx)
// so the bundler's cache hits 100% of the time on the first real
// component arrival. Unpinned "latest" was the difference between a 2s
// and 25s first preview — see KNOWN ISSUES #builder-prewarm-drift.
const GENERATED_SITE_DEPS: Record<string, string> = {
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "lucide-react": "^1.7.0",
  "framer-motion": "^12.38.0",
  clsx: "^2.1.1",
  "tailwind-merge": "^2.5.5",
};

function buildPackageJson(): string {
  return JSON.stringify(
    {
      name: "zoobicon-generated-site",
      version: "1.0.0",
      private: true,
      dependencies: GENERATED_SITE_DEPS,
    },
    null,
    2,
  );
}

function classifyError(err: unknown): { message: string; hint: string } {
  const e = err as { message?: string; status?: number } | undefined;
  const msg = e?.message ?? String(err);
  if (msg.includes("ANTHROPIC_API_KEY")) {
    return {
      message: msg,
      hint: "Set ANTHROPIC_API_KEY in Vercel environment variables, then redeploy.",
    };
  }
  if (e?.status === 429 || msg.includes("rate")) {
    return {
      message: msg,
      hint: "Anthropic rate limit hit — wait 30 seconds and try again, or upgrade your Anthropic plan.",
    };
  }
  if (e?.status === 401 || msg.includes("401")) {
    return {
      message: msg,
      hint: "ANTHROPIC_API_KEY is invalid. Rotate the key in the Anthropic console and update Vercel.",
    };
  }
  if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
    return {
      message: msg,
      hint: "Upstream model timed out. Retry once — the route has a 300s budget.",
    };
  }
  return {
    message: msg,
    hint: "Check the server logs for the full stack trace. If this persists, run `npm run build` locally.",
  };
}

function buildTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
`;
}

export async function POST(req: NextRequest): Promise<Response> {
  const startedAt = Date.now();

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(
      JSON.stringify({
        error: "Invalid JSON body. Expected { prompt: string, mode?: 'fast'|'premium' }",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const prompt = (body.prompt ?? "").trim();
  // Craig 2026-05-31: Sonnet only for all generation — always premium mode.
  // Previously this read body.mode which the builder never set, defaulting
  // every build to Haiku ("fast"). Root cause of near-100% preview crashes.
  const mode: Mode = "premium";

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "prompt is required" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // Plan resolution drives the watermark + (later) feature gates. Single
  // source of truth lives in /lib/user-plan.ts.
  const plan = getPlanFromRequest(req);
  const showWatermark = shouldWatermark(plan);

  // KILLER-MOVES-BUILDER.md #5 + #6: per-user telemetry and cost ceiling.
  // Anonymous builds still log (with userEmail=null) but skip quota.
  const userEmail = req.headers.get("x-user-email") || null;
  const isAdmin = !!(req.headers.get("x-admin") && req.headers.get("x-admin") !== "0" && req.headers.get("x-admin") !== "false");
  const quotaPlan: QuotaPlan = isAdmin
    ? "admin"
    : (plan === "pro" || plan === "agency" || plan === "free" || plan === "creator")
      ? (plan as QuotaPlan)
      : "free";
  const quota = await checkBuildQuota(userEmail, quotaPlan);
  if (!quota.ok) {
    return new Response(
      JSON.stringify({
        error: quota.reason || "Daily build budget reached.",
        resetsAt: quota.resetsAtIso,
        buildsToday: quota.buildsToday,
        costToday: quota.costToday,
        hardCostUsd: quota.hardCostUsd,
        hardBuildCount: quota.hardBuildCount,
      }),
      { status: 429, headers: { "content-type": "application/json", "retry-after": "3600" } },
    );
  }

  // Telemetry recorder — every build, success or failure, gets one row
  // in `builds` for failure-pattern analysis and cost tracking. We track
  // the recorder via a closure so finally{} can finalise on both paths.
  const buildId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const telemetry = new TelemetryRecorder({
    buildId,
    endpoint: "react-stream",
    prompt,
    userEmail,
    userPlan: plan,
    mode,
    theme: body.theme ?? null,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = makeWriter(controller);
      // Surface soft-quota crossings to the user so they know they're
      // close to the daily cap before being blocked tomorrow.
      if (quota.crossedSoft) {
        writer.send("warning", {
          kind: "quota-soft",
          message: `You've used $${quota.costToday.toFixed(2)} of your $${quota.hardCostUsd.toFixed(2)} daily build budget.`,
          resetsAt: quota.resetsAtIso,
        });
      }
      try {
        // ── FLYWHEEL: load accumulated context from previous builds ──
        let flywheelContext = "";
        try {
          const { getMemories } = await import("@/lib/flywheel");
          const memories = await getMemories();
          // Filter to preference, brand, and context types only
          const relevant = memories
            .filter((m) => m.type === "preference" || m.type === "brand" || m.type === "context")
            .slice(0, 10);
          if (relevant.length > 0) {
            const lines = relevant.map((m) => `- [${m.type}] ${m.content}`);
            // Cap at ~500 chars to keep the injection concise
            let joined = lines.join("\n");
            if (joined.length > 500) {
              joined = joined.slice(0, 497) + "...";
            }
            flywheelContext = `\n\nContext from previous builds:\n${joined}\n`;
          }
        } catch (flywheelErr) {
          // Flywheel is a bonus — never break the build pipeline
          console.warn("[react-stream] Flywheel context load skipped:", flywheelErr);
        }

        // ── PHASE 1: planning ──
        writer.send("phase", {
          phase: "planning",
          message: "Analysing your prompt…",
        });

        // Detect full-stack intent (auth, database, storage needs)
        const supabaseNeeds = detectSupabaseNeeds(prompt);
        const wantsBackend = needsSupabase(supabaseNeeds);
        // Generate a stable project ID for this build — embedded in the Zoobicon
        // client so all data operations are automatically scoped to this site.
        const projectId = crypto.randomUUID();

        // ── FLOOR: emit a CINEMATIC INSTANT SHELL immediately. The shell is
        // a self-contained animated skeleton (hero + nav + features strip)
        // that mounts in Sandpack within ~1s of the POST, echoing the user's
        // prompt back to them. It's replaced live by real registry components
        // as each customisation finishes. This is the perceived-speed layer —
        // without it the user stares at a blank pre-warm spinner for the
        // 5-8s TTFB of the Haiku planning call.
        //
        // Law 8 bonus: if planning fails, the real error message surfaces
        // instead of being overridden by "No components generated".
        const registry = await getRegistry();
        const files: Record<string, string> = {
          "package.json": buildPackageJson(),
          "tailwind.config.js": buildTailwindConfig(),
          "styles.css": registry.buildStylesFile({ primaryColor: "#1c1917", bgColor: "#FAF9F6" }),
          "App.tsx": registry.buildShellAppFile(prompt),
        };
        writer.send("files", { files, fileCount: 0, totalComponents: 0 });

        // ── PHASE 2: selecting ──
        writer.send("phase", {
          phase: "selecting",
          message: "Picking best components for each section…",
        });
        const planStart = Date.now();
        const { components, brandName, primaryColor, bgColor, brandSpec } =
          await planComponents(prompt + flywheelContext);
        telemetry.phase("plan", Date.now() - planStart);
        telemetry.setComponents(components.map((c) => ({ category: c.category, variant: c.variant })));

        // Detect industry from the prompt once — drives imagery selection
        // for every component in this build (restaurants get warm hand/craft
        // imagery, SaaS gets workspace/dashboards, portfolio gets landscape).
        const industry = registry.detectIndustry(prompt);
        telemetry.setIndustry(industry);

        // Detect the visual theme the prompt actually wants. This is the
        // critical fix for "every site comes out dark editorial". Consumer-
        // facing verticals (transport, hospitality, medical, local services)
        // default to LIGHT. Food/hospitality default to WARM. Cyber/crypto/
        // gaming defaults to DARK. Everything else stays editorial.
        const theme = registry.detectTheme(prompt, industry);
        writer.send("phase", {
          phase: "themed",
          message: `Theme: ${theme} · Industry: ${industry}`,
        });

        // Update styles with the real brand colours now that planning succeeded.
        files["styles.css"] = registry.buildStylesFile({ primaryColor, bgColor, theme });

        // Pre-inject Zoobicon client whenever the prompt needs backend features.
        // Unlike Supabase, no external token is required — Zoobicon's own API
        // is always available, so wantsBackend is the only gate.
        if (wantsBackend) {
          files["lib/zoobicon.ts"] = generateZoobiconClient(projectId);
          if (supabaseNeeds.needsAuth) {
            files["lib/AuthProvider.tsx"] = generateZoobiconAuthProvider();
          }
        }

        writer.send("files", { files, fileCount: 0, totalComponents: components.length });

        // ── PHASE 3: generating (customise each component) ──
        writer.send("phase", {
          phase: "generating",
          message: `Customising ${components.length} components for ${brandName}…`,
        });

        const customiserModel =
          mode === "premium" ? MODEL_SONNET : MODEL_HAIKU;

        // Backend brief only passed to the customiser when the prompt actually
        // needs backend features. Without this gate, the AI adds zoobicon
        // imports to purely static components that don't need them.
        const customiserSupabase = wantsBackend
          ? {
              needsAuth: supabaseNeeds.needsAuth,
              needsDatabase: supabaseNeeds.needsDatabase,
              needsStorage: supabaseNeeds.needsStorage,
            }
          : undefined;

        // PARALLEL CUSTOMISATION — fire every Haiku call at once.
        // Previously sequential: ~12 components × ~2-3s = 24-36s wall time.
        // Now concurrent: total ≈ max single call ≈ 2-3s (plus whichever
        // finishes last). App.tsx is rebuilt in the ORIGINAL component
        // order each time one completes, so navbar always lands at the
        // top even if hero finishes customising first. Preview looks
        // coherent throughout the stream — components slot into place
        // in the right order as they arrive.
        const completedByIndex = new Map<number, RegistryComponent>();
        let completedCount = 0;
        const failedSections: Array<{ id: string; category: string; variant: string; reason: string }> = [];

        // Narrate every section start so the user sees continuous progress
        // instead of staring at "Customising N components for X…" for 30
        // seconds. This is the single biggest UX gap vs Lovable/Bolt
        // (audit 2026-05-26): users describe silence > 3s as "broken".
        await Promise.all(
          components.map(async (comp, i) => {
            writer.send("status", {
              message: `Writing ${comp.category} (${comp.variant})…`,
              section: comp.id,
              current: i,
              total: components.length,
              phase: "building",
            });
            const result = await customiseComponent({
              baseCode: comp.code,
              brandName,
              category: comp.category,
              variant: comp.variant,
              prompt: prompt + flywheelContext,
              primaryColor,
              model: customiserModel,
              theme,
              brandSpec, // Q4: planner-emitted token sheet, shared across all customise calls in this build
              supabase: customiserSupabase,
              onFallback: (provider, model) => {
                writer.send("fallback", {
                  provider,
                  model,
                  section: comp.id,
                  category: comp.category,
                });
              },
            });
            let updatedCode = result.code;
            if (!result.ok) {
              failedSections.push({
                id: comp.id,
                category: comp.category,
                variant: comp.variant,
                reason: result.reason || "unknown",
              });
              telemetry.fail({ id: comp.id, reason: result.reason || "unknown" });
              // Surface the failure to the client the moment it happens so the
              // UI can render a "this section used the base template" badge
              // instead of silently shipping placeholder copy (Law 8).
              writer.send("warning", {
                kind: "section-fallback",
                section: comp.id,
                category: comp.category,
                reason: result.reason,
              });
            }

            // Theme-aware reskin — regex pass guarantees the component
            // renders in the correct theme even when the LLM ignores the
            // system prompt. This is the HARD FIX for "every site comes
            // out dark even when it's an airport shuttle service": when
            // theme is "light", reskinLight swaps bg-navy-950 → bg-white,
            // text-white → text-stone-900, etc. When theme is "editorial",
            // reskinEditorial collapses vibrant colors into stone. When
            // theme is "dark", pass through unchanged. All reskins are
            // idempotent — safe to re-run on already-customised output.
            if (theme === "editorial") {
              updatedCode = registry.reskinEditorial(updatedCode);
            } else if (theme === "light") {
              updatedCode = registry.reskinLight(updatedCode);
            } else if (theme === "warm") {
              updatedCode = registry.reskinWarm(updatedCode);
            }
            // "dark" passes through unchanged.

            // Industry image swap — replace every Unsplash photo ID with one
            // drawn from the detected industry's curated pool, so imagery
            // matches the prompt instead of the base component's hardcoded
            // mountains/watches/dashboards.
            updatedCode = registry.swapImagesForIndustry(updatedCode, industry);

            // Auto-emphasize one word per h1/h2. Only runs on editorial +
            // warm themes — those are the themes with serif display fonts
            // that actually render the <em> as an italic accent. For light
            // and dark themes (both sans-serif), <em> would just look like
            // italicised noise, so we skip it.
            if (theme === "editorial" || theme === "warm") {
              updatedCode = registry.emphasizeHeadings(updatedCode);
            }

            // Re-validate after post-processing. The regex passes above
            // (reskin*, swapImagesForIndustry, emphasizeHeadings) can in
            // edge cases mutate JSX expression slots they shouldn't touch,
            // producing syntactically invalid output that crashes the
            // preview. Audit 2026-05-31 — root cause of recurring "Preview
            // failed" errors. If post-processing broke the code, revert to
            // the pre-process version (which already passed validation).
            const postCheck = validateGeneratedComponent(updatedCode);
            if (!postCheck.ok) {
              console.warn(
                `[react-stream] post-processing broke ${comp.id}: ${postCheck.reason} — reverting to pre-process code`
              );
              updatedCode = result.code;
            }

            // Write the component file
            const { fileName } = registry.buildComponentFile(comp, { theme });
            files[fileName] = updatedCode;

            // Record completion and rebuild App.tsx in ORIGINAL order —
            // skipping any holes from components still in-flight.
            completedByIndex.set(i, comp);
            completedCount++;
            const ordered: RegistryComponent[] = [];
            for (let j = 0; j < components.length; j++) {
              const done = completedByIndex.get(j);
              if (done) ordered.push(done);
            }
            files["App.tsx"] = registry.buildAppFile(ordered, { theme, showWatermark });

            writer.send("component", {
              name: comp.id,
              code: updatedCode,
              position: i,
            });

            // Progressive update — push the current files map so Sandpack
            // preview rebuilds as each component slots into place. This is
            // what makes the site appear to "build itself" live.
            writer.send("files", {
              files,
              fileCount: completedCount,
              totalComponents: components.length,
              section: comp.id,
              customized: true,
            });
          })
        );

        // Hard fail when every single component had to fall back to base
        // template code — that means no provider produced any customised
        // output and the entire build is a placeholder scaffold, which
        // directly violates the Filmora standard + Law 8. Better to tell
        // the user the real reason than ship a generic "Acme" site.
        if (failedSections.length === components.length && components.length > 0) {
          const providers = getAvailableProviders();
          const reasons = failedSections.slice(0, 3).map((f) => `${f.id}: ${f.reason}`).join(" / ");
          throw new Error(
            `Every section fell back to base template — no LLM provider produced customised output. ` +
            `Providers available: [${providers.join(", ") || "none"}]. Last reasons: ${reasons}`,
          );
        }

        // Partial-failure warning — 2026-05-26 fix. If >30% of sections
        // dropped to base templates, the site shipped is materially
        // worse than the intent. Surface a loud warning so the user
        // knows to regenerate rather than thinking it just worked.
        if (
          failedSections.length > 0 &&
          components.length > 0 &&
          failedSections.length / components.length >= 0.3
        ) {
          writer.send("warning", {
            kind: "section-fallback",
            fatal: false,
            message: `${failedSections.length} of ${components.length} sections used base templates (LLM unavailable). The site is usable but less personalised than intended — consider regenerating.`,
            reason: failedSections.slice(0, 2).map((f) => `${f.category}: ${f.reason.slice(0, 60)}`).join(" · "),
          });
        }

        writer.send("files", { files });

        // ── PHASE 3.5: Backend wiring (Zoobicon's own API — no provisioning needed) ──
        if (wantsBackend) {
          // Zoobicon's backend is always available — no external token required.
          // The client files were already pre-injected above. Here we just
          // emit the confirmation event so the UI can show "Backend ready".
          files["lib/zoobicon.ts"] = generateZoobiconClient(projectId);
          if (supabaseNeeds.needsAuth) {
            files["lib/AuthProvider.tsx"] = generateZoobiconAuthProvider();
          }
          writer.send("files", { files });
          writer.send("phase", {
            phase: "provisioned",
            message: `Backend ready — powered by Zoobicon${supabaseNeeds.needsAuth ? " · auth enabled" : ""}${supabaseNeeds.needsDatabase ? " · data storage enabled" : ""}`,
          });
        }

        // ── PHASE 4: critique loop — Sprint 2 Q2+T3 ──
        // Runs on EVERY build (Q2+T3 expansion from premium-only).
        // Premium gets up to 2 refinement passes; free gets 1 pass so
        // we always emit a score + brand-coherence audit without
        // doubling build time. brandSpec from the Q4 planner gets fed
        // in so the critic catches cross-component palette drift.
        let finalFiles = files;
        let finalScore = 0;

        try {
          writer.send("phase", {
            phase: "critiquing",
            message:
              mode === "premium"
                ? "Running $100K quality critique…"
                : "Auditing brand coherence + slot contract…",
          });
          const loop = await runQualityLoop({
            files,
            originalPrompt: prompt,
            maxPasses: mode === "premium" ? 2 : 1,
            brandSpec,
          });

          finalFiles = loop.finalFiles;
          finalScore = loop.finalScore;

          const lastCritique =
            loop.history[loop.history.length - 1];
          writer.send("score", {
            score: finalScore,
            issues: lastCritique?.issues ?? [],
          });

          if (loop.passes > 1) {
            writer.send("phase", {
              phase: "refining",
              message: `Refined ${loop.passes - 1} time(s) — final score ${finalScore}/100`,
            });
          }
          writer.send("files", { files: finalFiles });
        } catch (err) {
          // Critique loop failure is non-fatal — the unrefined site is still
          // usable and has already been streamed to the client.
          const { message, hint } = classifyError(err);
          writer.send("error", {
            fatal: false,
            message: `Critique loop skipped: ${message}`,
            hint: `${hint} The unrefined site is still usable.`,
          });
        }

        // ── PHASE 5: done ──
        writer.send("phase", {
          phase: "done",
          message: "Build complete.",
        });
        const durationMs = Date.now() - startedAt;
        writer.send("done", {
          // Client listens for `event.files` on the done event — it sets
          // receivedFiles = true and updates Sandpack's source. The previous
          // name `finalFiles` silently skipped both, leaving the preview on
          // the last progressive partial (usually fine) but also preventing
          // the post-build file replacement in premium critique mode.
          files: finalFiles,
          // Surface the pinned dep map to the client so SandpackPreview's
          // customSetup.dependencies gets the same versions the package.json
          // already declares. Without this, the client passes {} and Sandpack
          // auto-detects + downloads "latest" at iframe render time → cold
          // bundle, flicker, occasional API-version mismatches.
          dependencies: GENERATED_SITE_DEPS,
          score: finalScore,
          durationMs,
          failedSections,
          // T6 follow-up — surface the planner-emitted BrandSpec on
          // the done event so the client can wire the brand-kit page
          // to the actual build's palette + typography (favicon /
          // social cards / business card / email signature derived
          // from the same tokens the site uses).
          brandSpec,
          ...(wantsBackend ? { backend: { projectId } } : {}),
        });

        // ── FLYWHEEL: record this build for future context ──
        try {
          const { saveBuild } = await import("@/lib/flywheel");
          await saveBuild({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            prompt,
            siteName: brandName || inferBrandName(prompt),
            model: mode === "premium" ? MODEL_SONNET : MODEL_HAIKU,
            durationMs,
            createdAt: Date.now(),
          });
        } catch (flywheelErr) {
          // Flywheel save is non-critical — log and move on
          console.warn("[react-stream] Flywheel build save skipped:", flywheelErr);
        }

        // Finalise telemetry on success path — failed sections are still
        // tracked but the overall build counts as ok=true if any files
        // shipped. recordBuildQuotaUsage runs regardless so partial
        // builds still count against the daily cap.
        await telemetry.finalize({
          ok: true,
          qualityScore: typeof finalScore === "number" ? Math.round(finalScore) : null,
        });
        await recordBuildQuotaUsage(userEmail, [
          // Token counts not yet threaded through customise/plan paths;
          // logged as zero so the build_count column increments. Token
          // tracking lands in Q3 (Slot-Locked Composition) where we have
          // structured model output to count.
          { model: customiserModel, inputTokens: 0, outputTokens: 0 },
        ]);

        writer.close();
      } catch (err) {
        const { message, hint } = (() => {
          try { return classifyError(err); }
          catch { return { message: err instanceof Error ? err.message : "Unknown error", hint: "Please try again" }; }
        })();
        // Finalise telemetry on failure path so admin can see WHICH
        // builds failed and WHY.
        try {
          await telemetry.finalize({
            ok: false,
            errorKind: err instanceof Error ? err.constructor.name : "Unknown",
            errorMessage: message,
          });
          await recordBuildQuotaUsage(userEmail, [
            { model: "claude-haiku-4-5", inputTokens: 0, outputTokens: 0 },
          ]);
        } catch (telemetryErr) {
          console.warn("[react-stream] telemetry finalise on error failed:", telemetryErr);
        }

        try {
          writer.send("error", { message, hint });
        } catch (classifyErr) {
          console.error("[react-stream] Error classification failed:", classifyErr);
          try {
            writer.send("error", {
              message: err instanceof Error ? err.message : "Unknown error",
              hint: "Please try again",
            });
          } catch { /* writer may already be closed */ }
        } finally {
          try { writer.close(); } catch { /* already closed */ }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
