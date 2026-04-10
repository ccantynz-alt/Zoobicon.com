/**
 * Zoobicon Component Registry
 *
 * Pre-built, production-ready React section components that the AI selects
 * and assembles based on the user's prompt. Instead of generating from scratch,
 * the system picks the best variant for each section and customizes only
 * the content (company name, headlines, descriptions, colors).
 *
 * This gives us sub-1-second scaffold assembly via Sandpack.
 */

// ── Types ──

export interface RegistryComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  variant: string;
  description: string;
  code: string;
  tags: string[];
}

// Re-export image system so routes can import everything from this module
export { detectIndustry, swapImagesForIndustry, INDUSTRY_POOLS } from "./images";
export type { Industry } from "./images";

export type ComponentCategory =
  | "navbar"
  | "hero"
  | "features"
  | "testimonials"
  | "pricing"
  | "stats"
  | "faq"
  | "cta"
  | "footer"
  | "about"
  | "contact"
  | "gallery"
  | "blog"
  | "ecommerce"
  | "forms"
  | "misc";

// ── Registry Store ──

export const REGISTRY: RegistryComponent[] = [];

/**
 * Register a component into the global registry.
 * Called by each category file (navbars.ts, heroes.ts, etc.) at import time.
 */
export function registerComponent(component: RegistryComponent): void {
  // Prevent duplicate registration
  if (!REGISTRY.find(c => c.id === component.id)) {
    REGISTRY.push(component);
  }
}

// ── Query Functions ──

/** Get all components in a given category */
export function getByCategory(category: string): RegistryComponent[] {
  ensureRegistryLoaded();
  return REGISTRY.filter(c => c.category === category);
}

/** Get a specific component by ID */
export function getById(id: string): RegistryComponent | undefined {
  ensureRegistryLoaded();
  return REGISTRY.find(c => c.id === id);
}

/** Get all available categories that have at least one component */
export function getCategories(): string[] {
  ensureRegistryLoaded();
  return Array.from(new Set(REGISTRY.map(c => c.category)));
}

/** Get all variants for a given category */
export function getVariants(category: string): RegistryComponent[] {
  ensureRegistryLoaded();
  return REGISTRY.filter(c => c.category === category);
}

// ── AI Selection ──

/** Keyword sets for industry detection */
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  tech: ["tech", "saas", "software", "api", "developer", "platform", "code", "devtool", "startup", "app"],
  cyber: ["cyber", "security", "firewall", "threat", "breach", "soc", "compliance", "encryption", "pentest"],
  dark: ["dark", "hacker", "terminal", "cli", "devops", "infrastructure"],
  restaurant: ["restaurant", "food", "cafe", "dining", "bistro", "menu", "chef", "cuisine", "catering", "bakery"],
  warm: ["warm", "cozy", "artisan", "handmade", "craft", "organic", "farm"],
  creative: ["portfolio", "creative", "designer", "artist", "photographer", "studio", "freelance", "illustrator"],
  minimal: ["minimal", "clean", "simple", "elegant", "modern"],
  agency: ["agency", "marketing", "consulting", "branding", "firm", "services"],
  ecommerce: ["shop", "store", "ecommerce", "product", "buy", "sell", "retail", "fashion"],
  health: ["health", "fitness", "wellness", "gym", "yoga", "medical", "clinic", "therapy"],
  education: ["education", "course", "learn", "school", "university", "training", "academy"],
};

/**
 * Score a component against the prompt by matching tags to prompt keywords.
 * Returns a numeric score — higher is better.
 */
function scoreComponent(component: RegistryComponent, promptLower: string): number {
  let score = 0;

  // Direct tag matching
  for (const tag of component.tags) {
    if (promptLower.includes(tag.toLowerCase())) {
      score += 2;
    }
  }

  // Industry-aware variant boosting
  const techMatch = /tech|cyber|saas|software|dark|startup|developer|api|platform|devtool/i.test(promptLower);
  const warmMatch = /restaurant|food|cafe|dining|bakery|chef|cuisine|hospitality|hotel|event|catering/i.test(promptLower);
  const minimalMatch = /portfolio|creative|minimal|designer|artist|photographer|freelance|studio|clean/i.test(promptLower);
  const agencyMatch = /agency|marketing|consulting|branding|firm|services/i.test(promptLower);

  if (techMatch && (component.variant.includes("dark") || component.variant.includes("cards-dark") || component.variant.includes("dark-gradient") || component.variant.includes("dashboard"))) {
    score += 4;
  }
  if (warmMatch && (component.variant.includes("warm") || component.variant.includes("image") || component.variant.includes("overlay") || component.variant.includes("quote") || component.variant.includes("video") || component.variant.includes("centered"))) {
    score += 4;
  }
  if (minimalMatch && (component.variant.includes("minimal") || component.variant.includes("quote"))) {
    score += 4;
  }
  if (agencyMatch && (component.variant.includes("alternating") || component.variant.includes("gradient") || component.variant.includes("centered") || component.variant.includes("video"))) {
    score += 3;
  }

  // Additional industry-variant boosting for newer variants
  const enterpriseMatch = /enterprise|corporate|fintech|banking|finance|b2b|marketplace/i.test(promptLower);
  const cryptoMatch = /crypto|web3|defi|blockchain|nft|trading|exchange/i.test(promptLower);
  const luxuryMatch = /luxury|fashion|beauty|boutique|premium|high-end/i.test(promptLower);
  const gamingMatch = /gaming|esports|cyberpunk|neon|hacker/i.test(promptLower);
  const productMatch = /app|mobile|ios|android|product|tool|productivity/i.test(promptLower);
  const landingMatch = /landing|launch|waitlist|coming soon/i.test(promptLower);

  if (enterpriseMatch && (component.variant.includes("mega") || component.variant.includes("stats") || component.variant.includes("dashboard"))) {
    score += 4;
  }
  if (cryptoMatch && (component.variant.includes("glass") || component.variant.includes("dark-gradient"))) {
    score += 4;
  }
  if (luxuryMatch && (component.variant.includes("centered") || component.variant.includes("glass"))) {
    score += 3;
  }
  if (gamingMatch && (component.variant.includes("dark-gradient") || component.variant.includes("glass"))) {
    score += 4;
  }
  if (productMatch && (component.variant.includes("animated") || component.variant.includes("dashboard") || component.variant.includes("two-cta"))) {
    score += 3;
  }
  if (landingMatch && (component.variant.includes("sticky") || component.variant.includes("animated"))) {
    score += 3;
  }

  return score;
}

/**
 * AI selects the best component for each section based on the user's prompt.
 * Returns an ordered list of components: navbar → hero → features → about → testimonials → stats → faq → cta → footer
 */
export function selectComponentsForPrompt(prompt: string): RegistryComponent[] {
  ensureRegistryLoaded();
  const promptLower = prompt.toLowerCase();

  // Industry-aware section order. Premium SaaS / startup / agency sites get a
  // logo strip + pricing block (this is what every Lovable/Bolt/v0 output has).
  // E-commerce gets a gallery. Restaurants/portfolios skew visual.
  const isSaaSish = /saas|software|platform|app|startup|tool|api|developer|fintech|enterprise|b2b|marketing|agency|crypto|web3/i.test(promptLower);
  const isEcom = /shop|store|ecommerce|product|retail|fashion|boutique|brand/i.test(promptLower);
  const isFood = /restaurant|food|cafe|dining|bakery|catering|chef|cuisine/i.test(promptLower);
  const isPortfolio = /portfolio|creative|designer|artist|photographer|studio/i.test(promptLower);
  const isLanding = /landing|launch|waitlist|coming soon/i.test(promptLower);

  // Slot list — "logos" is a virtual slot resolved to the logos-marquee misc component.
  type Slot = ComponentCategory | "logos";
  let sectionOrder: Slot[];
  if (isSaaSish) {
    sectionOrder = ["navbar", "hero", "logos", "features", "stats", "testimonials", "pricing", "faq", "cta", "footer"];
  } else if (isEcom) {
    sectionOrder = ["navbar", "hero", "ecommerce", "features", "gallery", "testimonials", "cta", "footer"];
  } else if (isFood) {
    sectionOrder = ["navbar", "hero", "features", "gallery", "about", "testimonials", "contact", "footer"];
  } else if (isPortfolio) {
    sectionOrder = ["navbar", "hero", "gallery", "about", "stats", "testimonials", "contact", "footer"];
  } else if (isLanding) {
    sectionOrder = ["navbar", "hero", "features", "logos", "stats", "cta", "footer"];
  } else {
    sectionOrder = ["navbar", "hero", "features", "about", "testimonials", "stats", "faq", "cta", "footer"];
  }

  const logoMarquee = getById("logos-marquee");
  const selected: RegistryComponent[] = [];

  for (const slot of sectionOrder) {
    const category = slot as ComponentCategory;
    if (slot === "logos") {
      if (logoMarquee) selected.push(logoMarquee);
      continue;
    }
    const options = getByCategory(category);
    if (options.length === 0) continue;

    // Score each option and pick the best
    let best = options[0];
    let bestScore = -1;

    for (const opt of options) {
      const score = scoreComponent(opt, promptLower);
      if (score > bestScore) {
        bestScore = score;
        best = opt;
      }
    }

    selected.push(best);
  }

  return selected;
}

// ── Assembly ──

/**
 * Assemble selected components into a Sandpack-ready file map.
 * Each component becomes its own file, and App.tsx imports and renders them all.
 */
export function assembleComponents(
  components: RegistryComponent[],
  options?: {
    brandName?: string;
    primaryColor?: string;
    bgColor?: string;
    theme?: "editorial" | "raw";
    /** Drives imagery selection. If omitted, pool is "editorial". */
    industry?: import("./images").Industry;
  }
): Record<string, string> {
  const files: Record<string, string> = {};
  const theme = options?.theme ?? "editorial";
  const industry = options?.industry ?? "editorial";

  // Generate individual component files
  for (const comp of components) {
    const componentName = capitalize(comp.category);
    const fileName = `components/${componentName}.tsx`;
    let body = comp.code;
    if (theme === "editorial") {
      body = reskinEditorial(body);
      // swap Unsplash photo IDs to the industry pool
      // (import is static at top of file via re-export)
      const { swapImagesForIndustry } = require("./images") as typeof import("./images");
      body = swapImagesForIndustry(body, industry);
    }
    files[fileName] = `import React from "react";\n\n${body}\n`;
  }

  // Generate App.tsx that imports and renders all components in order
  const imports = components
    .map(c => {
      const name = capitalize(c.category);
      return `import ${name} from "./components/${name}";`;
    })
    .join("\n");

  const renders = components
    .map(c => {
      const name = capitalize(c.category);
      return `      <${name} />`;
    })
    .join("\n");

  files["App.tsx"] = `import React from "react";
import "./styles.css";
${imports}

export default function App() {
  return (
    <div className="min-h-screen bg-white">
${renders}
    </div>
  );
}`;

  // Generate styles.css — editorial design system (default) or raw theme
  const primaryColor = options?.primaryColor || (theme === "editorial" ? "#1c1917" : "#4f46e5");
  const bgColor = options?.bgColor || (theme === "editorial" ? "#FAF9F6" : "#ffffff");

  files["styles.css"] = buildStylesFile({ primaryColor, bgColor, theme });

  return files;
}

/**
 * One-shot: select + assemble from a prompt string.
 * Returns a Sandpack-ready file map.
 */
export function buildFromPrompt(
  prompt: string,
  options?: {
    brandName?: string;
    primaryColor?: string;
    bgColor?: string;
  }
): { files: Record<string, string>; components: RegistryComponent[] } {
  const components = selectComponentsForPrompt(prompt);
  const files = assembleComponents(components, options);
  return { files, components };
}

// ── Incremental Assembly (for streaming) ──

/**
 * Build the styles.css file with given colors.
 * Default theme is "editorial" — the world-stage typographic preset that every
 * Zoobicon-generated site ships with. Use theme "raw" to opt out.
 */
export function buildStylesFile(options?: {
  primaryColor?: string;
  bgColor?: string;
  theme?: "editorial" | "raw";
}): string {
  const theme = options?.theme ?? "editorial";
  const primaryColor = options?.primaryColor || (theme === "editorial" ? "#1c1917" : "#4f46e5");
  const bgColor = options?.bgColor || (theme === "editorial" ? "#FAF9F6" : "#ffffff");

  if (theme === "raw") {
    return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --color-primary: ${primaryColor};
  --color-bg: ${bgColor};
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-body);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
img { max-width: 100%; height: auto; }
`;
  }

  // Editorial — world-stage typography + restrained palette
  return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&display=swap');

:root {
  --color-primary: ${primaryColor};
  --color-bg: ${bgColor};
  --color-ink: #1c1917;
  --color-ink-soft: #44403c;
  --color-paper: #FAF9F6;
  --color-accent: #E8D4B0;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Fraunces', 'Times New Roman', Georgia, serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-ink);
  font-feature-settings: "ss01", "cv11", "kern";
  letter-spacing: -0.003em;
}

img, video { max-width: 100%; height: auto; }

/* ── Editorial display typography ── */
h1, h2, h3 {
  letter-spacing: -0.025em;
  font-feature-settings: "ss01", "cv11", "kern";
}
h1 { line-height: 1.02; }
h2 { line-height: 1.08; }
h3 { line-height: 1.15; }

/* <em> inside headlines becomes Fraunces italic — the signature display accent */
h1 em, h2 em, h3 em, .display-accent {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.035em;
}

/* Body prose */
p {
  line-height: 1.62;
  font-feature-settings: "ss01", "cv11", "kern";
}

/* ── Measured motion ── */

@keyframes editorialFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes editorialFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

section {
  animation: editorialFadeUp 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
section:nth-of-type(2) { animation-delay: 0.05s; }
section:nth-of-type(3) { animation-delay: 0.10s; }
section:nth-of-type(4) { animation-delay: 0.15s; }
section:nth-of-type(5) { animation-delay: 0.20s; }
section:nth-of-type(n+6) { animation-delay: 0.25s; }

/* Buttons — restrained */
button, a[class*="rounded"] {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              background-color 0.25s ease,
              color 0.25s ease,
              border-color 0.25s ease,
              box-shadow 0.35s ease;
}
button:active { transform: translateY(0.5px); }

/* Focus — thin, warm */
a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible {
  outline: 1.5px solid var(--color-ink);
  outline-offset: 3px;
  border-radius: 2px;
}

/* Selection */
::selection {
  background: var(--color-accent);
  color: var(--color-ink);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;
}

/**
 * Auto-wrap one word per h1/h2 in <em>…</em> so the editorial Fraunces
 * italic serif accent actually lands. The customiser LLM is told to do this
 * in its system prompt, but LLMs ignore style instructions ~half the time.
 * This regex pass is the hard guarantee.
 *
 * Strategy:
 *   - Only touch headlines that don't already contain <em>, <i>, or a
 *     bg-clip-text span (those already have their own accent).
 *   - Find h1 / h2 elements, extract their plain text content, and wrap
 *     the LAST non-trivial word (>3 chars) in <em>…</em>.
 *   - JSX-safe: we only match simple string children, not nested elements.
 *     Anything more complex is left alone — no false edits.
 *
 * Idempotent: running twice is a no-op because the second pass skips any
 * headline that already contains <em>.
 */
export function emphasizeHeadings(code: string): string {
  return code.replace(
    // Capture: (opening tag with any className)(text content — no < or >)(closing tag)
    /<(h1|h2)([^>]*)>([^<>]+)<\/\1>/g,
    (match, tag, attrs, inner) => {
      // Skip if text is too short
      const trimmed = inner.trim();
      if (trimmed.length < 10) return match;

      // Find the last word that is > 3 chars and not already a stopword
      const words = trimmed.split(/\s+/);
      let targetIdx = -1;
      for (let i = words.length - 1; i >= 0; i--) {
        const w = words[i].replace(/[.,!?;:"'—–-]+$/g, "");
        if (w.length > 3 && !/^(the|and|for|with|that|this|from|your|into|over|more|most|ever|just|make|take|only|also|some|like|when|what|will|been|were|they|them|than|then|here|have|back|down|need|than|much|such|very|well|each|even|both)$/i.test(w)) {
          targetIdx = i;
          break;
        }
      }
      if (targetIdx === -1) return match;

      // Rebuild the text with the target word wrapped
      const newInner = words
        .map((w, i) => (i === targetIdx ? `<em>${w}</em>` : w))
        .join(" ");

      return `<${tag}${attrs}>${newInner}</${tag}>`;
    }
  );
}

/**
 * Rewrite vibrant Tailwind color utilities (violet/purple/fuchsia/pink/etc.)
 * into a restrained stone palette so every generated site inherits the
 * editorial look without touching any individual component file.
 *
 * Matches any Tailwind utility of the form:
 *    [state:]?<util>-<family>-<shade>[/<opacity>]
 * where state is hover:, focus:, group-hover:, dark:, md:, etc.
 */
export function reskinEditorial(code: string): string {
  const COLORS =
    "violet|purple|fuchsia|pink|rose|indigo|blue|sky|cyan|teal|emerald|green|lime|yellow|amber|orange|red";
  const UTILS =
    "from|via|to|text|bg|border|shadow|ring|ring-offset|outline|decoration|divide|placeholder|caret|accent|fill|stroke";
  // (?:[a-z-]+:)* allows arbitrary prefix chains like "md:hover:group-hover:"
  const re = new RegExp(
    `((?:[a-z-]+:)*)(${UTILS})-(?:${COLORS})-(\\d{2,3})(\\/\\d+)?`,
    "g"
  );
  return code.replace(re, (_m, prefix, util, shade, opacity) => {
    return `${prefix}${util}-stone-${shade}${opacity || ""}`;
  });
}

/**
 * Build a single component file.
 * Applies the editorial reskin by default (theme: "editorial"). Pass
 * theme: "raw" to emit the original vibrant palette.
 */
export function buildComponentFile(
  component: RegistryComponent,
  options?: { theme?: "editorial" | "raw" }
): { fileName: string; code: string } {
  const theme = options?.theme ?? "editorial";
  const componentName = capitalize(component.category);
  const body = theme === "editorial" ? reskinEditorial(component.code) : component.code;
  return {
    fileName: `components/${componentName}.tsx`,
    code: `import React from "react";\n\n${body}\n`,
  };
}

/**
 * Build App.tsx that imports and renders the given components in order.
 * Called incrementally as each component is added.
 */
export function buildAppFile(components: RegistryComponent[]): string {
  const imports = components
    .map(c => {
      const name = capitalize(c.category);
      return `import ${name} from "./components/${name}";`;
    })
    .join("\n");

  const renders = components
    .map(c => {
      const name = capitalize(c.category);
      return `      <${name} />`;
    })
    .join("\n");

  return `import React from "react";
import "./styles.css";
${imports}

export default function App() {
  return (
    <div className="min-h-screen bg-white">
${renders}
    </div>
  );
}`;
}

/** Human-readable label for a component category */
export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    navbar: "Navigation bar",
    hero: "Hero section",
    features: "Features section",
    about: "About section",
    testimonials: "Testimonials",
    stats: "Statistics",
    faq: "FAQ section",
    cta: "Call to action",
    footer: "Footer",
    contact: "Contact section",
    gallery: "Gallery",
    blog: "Blog section",
    pricing: "Pricing section",
    ecommerce: "E-commerce section",
    forms: "Form section",
    misc: "Additional section",
  };
  return labels[category] || capitalize(category);
}

// ── Helpers ──

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Register All Components ──
// Lazy initialization to prevent circular dependency TDZ errors in webpack.
// The category files (navbars.ts, heroes.ts, etc.) call registerComponent()
// which pushes into REGISTRY. We defer these imports to first access.

let _initialized = false;

export function ensureRegistryLoaded(): void {
  if (_initialized) return;
  _initialized = true;

  // Dynamic requires to avoid webpack hoisting these into the module init phase.
  // Each file calls registerComponent() as a side effect.
  try { require("./navbars"); } catch (e) { console.warn("[registry] navbars load failed:", e); }
  try { require("./heroes"); } catch (e) { console.warn("[registry] heroes load failed:", e); }
  try { require("./features"); } catch (e) { console.warn("[registry] features load failed:", e); }
  try { require("./testimonials"); } catch (e) { console.warn("[registry] testimonials load failed:", e); }
  try { require("./footers"); } catch (e) { console.warn("[registry] footers load failed:", e); }
  try { require("./extras"); } catch (e) { console.warn("[registry] extras load failed:", e); }
  try { require("./sections"); } catch (e) { console.warn("[registry] sections load failed:", e); }
}
