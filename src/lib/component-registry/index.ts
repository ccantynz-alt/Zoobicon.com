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
  | "gallery";

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
  return REGISTRY.filter(c => c.category === category);
}

/** Get a specific component by ID */
export function getById(id: string): RegistryComponent | undefined {
  return REGISTRY.find(c => c.id === id);
}

/** Get all available categories that have at least one component */
export function getCategories(): string[] {
  return Array.from(new Set(REGISTRY.map(c => c.category)));
}

/** Get all variants for a given category */
export function getVariants(category: string): RegistryComponent[] {
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

  if (techMatch && (component.variant.includes("dark") || component.variant.includes("cards-dark"))) {
    score += 4;
  }
  if (warmMatch && (component.variant.includes("warm") || component.variant.includes("image") || component.variant.includes("overlay") || component.variant.includes("quote"))) {
    score += 4;
  }
  if (minimalMatch && (component.variant.includes("minimal") || component.variant.includes("quote"))) {
    score += 4;
  }
  if (agencyMatch && (component.variant.includes("alternating") || component.variant.includes("gradient") || component.variant.includes("centered"))) {
    score += 3;
  }

  return score;
}

/**
 * AI selects the best component for each section based on the user's prompt.
 * Returns an ordered list of components: navbar → hero → features → about → testimonials → stats → faq → cta → footer
 */
export function selectComponentsForPrompt(prompt: string): RegistryComponent[] {
  const sectionOrder: ComponentCategory[] = [
    "navbar",
    "hero",
    "features",
    "about",
    "testimonials",
    "stats",
    "faq",
    "cta",
    "footer",
  ];

  const selected: RegistryComponent[] = [];
  const promptLower = prompt.toLowerCase();

  for (const category of sectionOrder) {
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
  }
): Record<string, string> {
  const files: Record<string, string> = {};

  // Generate individual component files
  for (const comp of components) {
    const componentName = capitalize(comp.category);
    const fileName = `components/${componentName}.tsx`;
    files[fileName] = `import React from "react";\n\n${comp.code}\n`;
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

  // Generate styles.css with font import and minimal reset
  const primaryColor = options?.primaryColor || "#4f46e5";
  const bgColor = options?.bgColor || "#ffffff";

  files["styles.css"] = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --color-primary: ${primaryColor};
  --color-bg: ${bgColor};
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img {
  max-width: 100%;
  height: auto;
}
`;

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

// ── Helpers ──

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ── Register All Components ──
// Import category files to trigger their registerComponent() calls.
// These must come AFTER the REGISTRY and registerComponent are defined.

import "./navbars";
import "./heroes";
import "./features";
import "./testimonials";
import "./footers";
import "./extras";
