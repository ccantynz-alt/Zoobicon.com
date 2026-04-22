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

// ── Types & Store (re-exported from ./store to avoid circular-import TDZ) ──

export {
  REGISTRY,
  registerComponent,
  type RegistryComponent,
  type ComponentCategory,
} from "./store";

export {
  detectIndustry,
  detectTheme,
  swapImagesForIndustry,
} from "./images";

import { REGISTRY, type RegistryComponent, type ComponentCategory } from "./store";

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
    theme?: "editorial" | "raw" | "light" | "warm" | "dark";
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
    } else if (theme === "light") {
      body = reskinLight(body);
    } else if (theme === "warm") {
      body = reskinWarm(body);
    }
    // Swap images unconditionally — every theme benefits from industry-
    // appropriate imagery (dark tech pool for cyber, transport pool for
    // shuttles, etc.). Only "raw" mode opts out.
    if (theme !== "raw") {
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

  // Generate styles.css — theme-aware (editorial / light / warm / dark / raw)
  files["styles.css"] = buildStylesFile({
    primaryColor: options?.primaryColor,
    bgColor: options?.bgColor,
    theme,
  });

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
  theme?: "editorial" | "raw" | "light" | "warm" | "dark";
}): string {
  const theme = options?.theme ?? "editorial";

  const defaultPrimary: Record<string, string> = {
    editorial: "#1c1917",
    raw: "#4f46e5",
    light: "#0f172a",
    warm: "#7c2d12",
    dark: "#f5f5f4",
  };
  const defaultBg: Record<string, string> = {
    editorial: "#FAF9F6",
    raw: "#ffffff",
    light: "#ffffff",
    warm: "#FFFBEB",
    dark: "#0a0a0f",
  };

  const primaryColor = options?.primaryColor || defaultPrimary[theme] || "#4f46e5";
  const bgColor = options?.bgColor || defaultBg[theme] || "#ffffff";

  // LIGHT THEME — bright, airy, optimistic. Sans-serif only, confident
  // but friendly. This is what a consumer-facing local service needs:
  // high contrast, easy to read, no editorial serif, no dark chrome.
  if (theme === "light") {
    return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --color-primary: ${primaryColor};
  --color-bg: ${bgColor};
  --color-ink: #0f172a;
  --color-ink-soft: #475569;
  --color-surface: #f8fafc;
  --color-border: #e2e8f0;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-ink);
  letter-spacing: -0.011em;
}
img, video { max-width: 100%; height: auto; }

h1, h2, h3 { letter-spacing: -0.025em; }
h1 { line-height: 1.05; }
h2 { line-height: 1.1; }
h3 { line-height: 1.2; }
p { line-height: 1.65; color: var(--color-ink-soft); }

@keyframes zbFadeUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
section {
  animation: zbFadeUp 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
section:nth-of-type(2) { animation-delay: 0.05s; }
section:nth-of-type(3) { animation-delay: 0.10s; }
section:nth-of-type(4) { animation-delay: 0.15s; }
section:nth-of-type(n+5) { animation-delay: 0.20s; }

button, a[class*="rounded"] {
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.25s ease;
}
button:active { transform: translateY(0.5px); }

a:focus-visible, button:focus-visible, input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;
  }

  // WARM THEME — cream + amber, Playfair display for headlines. Food,
  // hospitality, artisan.
  if (theme === "warm") {
    return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');

:root {
  --color-primary: ${primaryColor};
  --color-bg: ${bgColor};
  --color-ink: #1c1917;
  --color-ink-soft: #57534e;
  --color-accent: #d97706;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --font-display: 'Playfair Display', Georgia, serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-ink);
  letter-spacing: -0.003em;
}
img, video { max-width: 100%; height: auto; }

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.02em;
}
h1 { line-height: 1.08; }
h2 { line-height: 1.15; }
h1 em, h2 em, h3 em {
  font-style: italic;
  font-weight: 400;
  color: var(--color-accent);
}
p { line-height: 1.68; color: var(--color-ink-soft); }

@keyframes zbFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
section { animation: zbFadeUp 0.9s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
section:nth-of-type(n+2) { animation-delay: 0.05s; }

button, a[class*="rounded"] {
  transition: transform 0.25s ease, background-color 0.25s ease;
}
button:active { transform: translateY(0.5px); }

a:focus-visible, button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}
::selection { background: #fde68a; color: #1c1917; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;
  }

  // DARK THEME — kept for cyber/tech/crypto/gaming. Unchanged from
  // the registry's native dark mood, but with Inter + subtle motion.
  if (theme === "dark") {
    return `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --color-primary: ${primaryColor};
  --color-bg: ${bgColor};
  --color-ink: #f5f5f4;
  --color-ink-soft: #a8a29e;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-ink);
  letter-spacing: -0.011em;
}
img, video { max-width: 100%; height: auto; }

h1, h2, h3 { letter-spacing: -0.025em; }
p { line-height: 1.65; color: var(--color-ink-soft); }

@keyframes zbFadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
section { animation: zbFadeUp 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
section:nth-of-type(n+2) { animation-delay: 0.05s; }

button, a[class*="rounded"] {
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.25s ease;
}
button:active { transform: translateY(0.5px); }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;
  }

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
 * Convert every base registry component (which is hardcoded dark —
 * `bg-gray-950`, `text-white`, `border-white/10` etc.) into a bright,
 * airy LIGHT theme. This is the fix for "every site Claude generates
 * comes out dark even when the business is an airport shuttle service."
 *
 * The registry itself is all dark because that's what looked best for
 * the original SaaS-leaning launch. Instead of forking every component
 * into a light variant (hours of work × 114 components), we run this
 * regex pass over the customised output when detectTheme() says "light".
 *
 * Maps:
 *   - Dark base surfaces (gray-950/900/800, neutral-950, zinc-950,
 *     arbitrary hex like #0a0a0f, #09090f, #131520) → white / stone-50
 *   - On-dark text (text-white, text-gray-100..300) → text-stone-900/700
 *   - On-dark borders (border-white/10, border-gray-800) → stone-200
 *   - Dark gradients (from-gray-950) → from-stone-50
 *   - Accent-on-dark patterns like text-white/80 → text-stone-700
 *
 * Idempotent: running twice is a no-op because pass 2 finds no dark
 * utilities left to rewrite.
 */
export function reskinLight(code: string): string {
  let out = code;

  // 1. Arbitrary hex dark backgrounds — the registry peppers these
  //    throughout heroes/features/testimonials.
  const darkHexes = [
    "#0a0a0f", "#09090f", "#0a0a12", "#131520", "#0b0b0f", "#050510",
    "#020617", "#030712", "#111111", "#000000",
  ];
  for (const hex of darkHexes) {
    // bg-[#0a0a0f], from-[#0a0a0f], to-[#0a0a0f], border-[#0a0a0f/..]
    const re = new RegExp(
      `(bg|from|via|to|border|text|ring)-\\[${hex.replace(/[#]/g, "\\#")}(\\/[\\d.]+)?\\]`,
      "g",
    );
    out = out.replace(re, (_m, util) => {
      if (util === "bg" || util === "from" || util === "to" || util === "via") return `${util}-white`;
      if (util === "border" || util === "ring") return `${util}-stone-200`;
      return `${util}-stone-900`;
    });
  }

  // 2. Dark Tailwind family backgrounds → white / stone-50
  //    gray-950, gray-900, neutral-950, zinc-950, slate-950, black
  out = out.replace(
    /((?:[a-z-]+:)*)(bg|from|via|to)-(?:gray|neutral|zinc|slate|stone)-(9\d{2})(\/\d+)?/g,
    (_m, prefix, util) => `${prefix}${util}-white`,
  );
  out = out.replace(
    /((?:[a-z-]+:)*)(bg|from|via|to)-black(\/\d+)?/g,
    (_m, prefix, util) => `${prefix}${util}-white`,
  );

  // 3. Dark mid-tone surfaces (gray-800/700) → stone-50/100 for cards
  out = out.replace(
    /((?:[a-z-]+:)*)(bg)-(?:gray|neutral|zinc|slate)-(8\d{2})(\/\d+)?/g,
    (_m, prefix, util) => `${prefix}${util}-stone-50`,
  );

  // 4. Light-on-dark text (white, gray-100/200/300) → dark-on-light
  out = out.replace(
    /((?:[a-z-]+:)*)text-white(\/\d+)?/g,
    (_m, prefix) => `${prefix}text-stone-900`,
  );
  out = out.replace(
    /((?:[a-z-]+:)*)text-(?:gray|neutral|zinc|slate|stone)-(1\d{2})(\/\d+)?/g,
    (_m, prefix) => `${prefix}text-stone-900`,
  );
  out = out.replace(
    /((?:[a-z-]+:)*)text-(?:gray|neutral|zinc|slate|stone)-(2\d{2})(\/\d+)?/g,
    (_m, prefix) => `${prefix}text-stone-800`,
  );
  out = out.replace(
    /((?:[a-z-]+:)*)text-(?:gray|neutral|zinc|slate|stone)-(3\d{2})(\/\d+)?/g,
    (_m, prefix) => `${prefix}text-stone-700`,
  );
  out = out.replace(
    /((?:[a-z-]+:)*)text-(?:gray|neutral|zinc|slate|stone)-(4\d{2})(\/\d+)?/g,
    (_m, prefix) => `${prefix}text-stone-600`,
  );

  // 5. White-on-dark borders → stone-200
  out = out.replace(
    /((?:[a-z-]+:)*)border-white(\/\d+)?/g,
    (_m, prefix) => `${prefix}border-stone-200`,
  );
  out = out.replace(
    /((?:[a-z-]+:)*)border-(?:gray|neutral|zinc|slate)-(8\d{2}|9\d{2})(\/\d+)?/g,
    (_m, prefix) => `${prefix}border-stone-200`,
  );
  out = out.replace(
    /((?:[a-z-]+:)*)divide-(?:gray|neutral|zinc|slate)-(8\d{2}|9\d{2})(\/\d+)?/g,
    (_m, prefix) => `${prefix}divide-stone-200`,
  );

  // 6. White-on-dark rings → stone-200
  out = out.replace(
    /((?:[a-z-]+:)*)ring-white(\/\d+)?/g,
    (_m, prefix) => `${prefix}ring-stone-200`,
  );

  // 7. Shadow on dark surfaces — kill the saturated black shadows,
  //    they look heavy on light.
  out = out.replace(/shadow-black\/\d+/g, "shadow-stone-900/5");

  return out;
}

/**
 * Warm theme reskin — cream/beige/amber background with warm stone text.
 * Used for restaurants, bakeries, hospitality, artisan businesses.
 */
export function reskinWarm(code: string): string {
  // Start from the light reskin, then overlay warm accents
  let out = reskinLight(code);
  // Swap the light surfaces for warm cream / amber tints
  out = out.replace(/((?:[a-z-]+:)*)(bg|from|via|to)-white\b/g, (_m, prefix, util) => `${prefix}${util}-amber-50`);
  out = out.replace(/((?:[a-z-]+:)*)(bg)-stone-50\b/g, (_m, prefix, util) => `${prefix}${util}-amber-50`);
  return out;
}

/**
 * Build a single component file.
 * Applies the editorial reskin by default (theme: "editorial"). Pass
 * theme: "raw" to emit the original vibrant palette.
 */
export function buildComponentFile(
  component: RegistryComponent,
  options?: { theme?: "editorial" | "raw" | "light" | "warm" | "dark" }
): { fileName: string; code: string } {
  const theme = options?.theme ?? "editorial";
  const componentName = capitalize(component.category);
  let body = component.code;
  if (theme === "editorial") body = reskinEditorial(body);
  else if (theme === "light") body = reskinLight(body);
  else if (theme === "warm") body = reskinWarm(body);
  // "dark" and "raw" pass through untouched
  return {
    fileName: `components/${componentName}.tsx`,
    code: `import React from "react";\n\n${body}\n`,
  };
}

/**
 * INSTANT SHELL — cinematic skeleton shown for the first ~1-8 seconds
 * while Haiku plans + customises the real components. This is the
 * "perceived speed" layer: the user sees a beautiful animated hero
 * with their prompt echoed back within ~1s of hitting Generate,
 * instead of staring at a blank pre-warm spinner for 5-8s of TTFB.
 *
 * It's fully self-contained React+Tailwind — no imports of registry
 * components, no styles.css dependency (inline animations only),
 * so it mounts in Sandpack the moment the first SSE frame arrives.
 * Each real component then replaces a skeleton block via subsequent
 * partial events, and buildAppFile(accumulated) takes over the
 * moment `accumulated.length > 0`.
 *
 * @param prompt - The user's original prompt (first 140 chars echoed
 *   into the hero so they see their intent immediately).
 * @param brandName - Optional brand hint for the navbar placeholder.
 */
export function buildShellAppFile(prompt?: string, brandName?: string): string {
  const safePrompt = (prompt || "")
    .slice(0, 140)
    .replace(/[`$\\]/g, "")
    .replace(/"/g, "\\\"")
    .replace(/\n/g, " ")
    .trim();
  const safeBrand = (brandName || "Your brand")
    .slice(0, 40)
    .replace(/[`$\\]/g, "")
    .replace(/"/g, "\\\"");

  return `import React from "react";

/**
 * Zoobicon instant shell — rendered in <1s while the real components
 * are still being customised by the LLM. Replaced live as soon as the
 * first registry component finishes streaming.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 overflow-hidden">
      <style>{\`
        @keyframes zbk-shimmer {
          0% { background-position: -500px 0; }
          100% { background-position: 500px 0; }
        }
        @keyframes zbk-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes zbk-fade-in {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes zbk-pulse-soft {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .zbk-shimmer {
          background: linear-gradient(90deg, #ece9e3 0%, #f5f3ee 50%, #ece9e3 100%);
          background-size: 500px 100%;
          animation: zbk-shimmer 1.6s linear infinite;
        }
        .zbk-fade { animation: zbk-fade-in 0.6s ease-out both; }
        .zbk-pulse { animation: zbk-pulse-soft 2.4s ease-in-out infinite; }
        .zbk-float { animation: zbk-float 4s ease-in-out infinite; }
        .zbk-serif { font-family: Georgia, "Times New Roman", serif; }
      \`}</style>

      {/* Navbar skeleton */}
      <nav className="w-full border-b border-stone-200/70 bg-[#FAF9F6]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 zbk-fade">
            <div className="w-8 h-8 rounded-lg bg-stone-900" />
            <span className="zbk-serif text-xl font-semibold text-stone-900">${safeBrand}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 zbk-fade" style={{ animationDelay: "0.1s" }}>
            <div className="h-3 w-14 rounded zbk-shimmer" />
            <div className="h-3 w-16 rounded zbk-shimmer" />
            <div className="h-3 w-12 rounded zbk-shimmer" />
            <div className="h-3 w-14 rounded zbk-shimmer" />
          </div>
          <div className="h-9 w-24 rounded-full zbk-shimmer zbk-fade" style={{ animationDelay: "0.2s" }} />
        </div>
      </nav>

      {/* Hero skeleton */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="absolute top-10 right-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-stone-200/60 to-transparent blur-3xl zbk-pulse pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-amber-100/40 to-transparent blur-3xl zbk-pulse pointer-events-none" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-300/70 bg-white/60 backdrop-blur-sm mb-8 zbk-fade">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-900 animate-pulse" />
            <span className="text-[11px] uppercase tracking-widest text-stone-600 font-medium">
              Building your site
            </span>
          </div>

          <h1 className="zbk-serif text-6xl md:text-7xl font-semibold text-stone-900 leading-[1.05] tracking-tight mb-8 zbk-fade" style={{ animationDelay: "0.1s" }}>
            Crafting something
            <br />
            <em className="font-normal text-stone-500">extraordinary</em> for you
          </h1>

          {${safePrompt ? "true" : "false"} && (
            <p className="text-xl text-stone-600 leading-relaxed mb-10 max-w-2xl zbk-fade" style={{ animationDelay: "0.2s" }}>
              &ldquo;${safePrompt}&rdquo;
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 zbk-fade" style={{ animationDelay: "0.3s" }}>
            <div className="h-12 w-40 rounded-full zbk-shimmer" />
            <div className="h-12 w-32 rounded-full border border-stone-300/70 zbk-pulse" />
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl zbk-fade" style={{ animationDelay: "0.4s" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-10 w-20 rounded zbk-shimmer" />
                <div className="h-3 w-full rounded zbk-shimmer" />
              </div>
            ))}
          </div>
        </div>

        {/* Floating preview card */}
        <div className="absolute right-8 top-32 w-80 hidden lg:block zbk-float">
          <div className="rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl zbk-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded zbk-shimmer" />
                <div className="h-2 w-1/2 rounded zbk-shimmer" />
              </div>
            </div>
            <div className="h-32 rounded-xl zbk-shimmer" />
            <div className="space-y-2">
              <div className="h-2 w-full rounded zbk-shimmer" />
              <div className="h-2 w-5/6 rounded zbk-shimmer" />
              <div className="h-2 w-4/6 rounded zbk-shimmer" />
            </div>
          </div>
        </div>
      </section>

      {/* Features skeleton strip */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-stone-200/70">
        <div className="grid md:grid-cols-3 gap-10">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-4 zbk-fade" style={{ animationDelay: \`\${0.5 + i * 0.1}s\` }}>
              <div className="w-12 h-12 rounded-xl zbk-shimmer" />
              <div className="h-5 w-3/4 rounded zbk-shimmer" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded zbk-shimmer" />
                <div className="h-3 w-5/6 rounded zbk-shimmer" />
                <div className="h-3 w-4/6 rounded zbk-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
`;
}

/**
 * Build App.tsx that imports and renders the given components in order.
 * Called incrementally as each component is added.
 */
export function buildAppFile(
  components: RegistryComponent[],
  options?: { theme?: "editorial" | "raw" | "light" | "warm" | "dark" },
): string {
  const theme = options?.theme ?? "editorial";
  const rootBg: Record<string, string> = {
    editorial: "bg-[#FAF9F6]",
    light: "bg-white",
    warm: "bg-amber-50",
    dark: "bg-[#0a0a0f]",
    raw: "bg-white",
  };
  const rootClass = `min-h-screen ${rootBg[theme] || "bg-white"}`;

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
    <div className="${rootClass}">
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
