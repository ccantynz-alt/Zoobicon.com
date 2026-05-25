/**
 * Page builder — turns a SitePlanPage into a customised React file tree.
 *
 * Used by the multi-page orchestrator (/api/generate/site-build). Each
 * page in the approved plan is built by one call to buildPage(): per
 * section, we look up the registry component, customise its copy + tone
 * via one Haiku call, and write the result under components/<PageName>/
 * <SectionCategory>.tsx.
 *
 * Why this is leaner than react-stream's per-component pipeline:
 * - One Haiku call per section, no failover chain to Sonnet/OpenAI
 *   (Phase 2 ships speed; Phase 3 can layer in failover if needed).
 * - No quality-loop critique pass (saves ~30s per component).
 * - No Supabase wiring inside components (handled centrally in the
 *   orchestrator's shared lib file).
 *
 * Caller is responsible for:
 * - Selecting the registry component for each section
 * - Customising + persisting shared navbar + footer ONCE before pages
 * - Merging per-page file trees into one App with router setup
 */

import { callLLMWithFailover } from "./llm-provider";
import type { SitePlanBrand, SitePlanPage, PageSection } from "./site-planner";
import type { RegistryComponent } from "./component-registry/store";

export interface BuildPageInput {
  page: SitePlanPage;
  brand: SitePlanBrand;
  /** Resolved registry component for each section, in section order. */
  components: RegistryComponent[];
  /** Component file names already taken on the project (collision avoidance). */
  takenNames?: Set<string>;
}

export interface BuildPageResult {
  /** Files keyed by relative path within the project. Includes the page
   *  module itself plus its private section components. */
  files: Record<string, string>;
  /** The exported page component name (e.g. "PageLanding") so the
   *  orchestrator can wire it into the router. */
  pageExport: string;
  /** Relative import path the orchestrator should use from App.tsx. */
  pageImport: string;
  /** Sections that fell back to base code (LLM unavailable / refused).
   *  Empty array means clean build. */
  failedSections: string[];
  /** Total LLM calls actually made — for telemetry. */
  customisationCount: number;
}

const CUSTOMISER_MODEL = "claude-haiku-4-5";

const CUSTOMISER_SYSTEM = `You customise a single React component for the Zoobicon AI website builder.

You receive:
- A base TSX component (TypeScript + Tailwind).
- A brief: brand, voice, page purpose, section role.

Your job: rewrite the component, preserving its structure, exports, props, and Tailwind classes, but replacing placeholder copy with real, specific, on-brand copy.

Hard rules:
- Output ONLY the full updated TypeScript file. No prose. No markdown fences.
- Keep the same default export name and signature.
- Keep imports identical unless you genuinely need a new one.
- Replace AI-slop ("revolutionary", "unleash", "empower", "synergy",
  "next-generation", "game-changer", "leverage", "elevate", "seamless",
  "cutting-edge") with specific copy.
- Use real-sounding numbers, not "10,000+ users".
- Keep responsive + accessibility classes. Add aria-labels to icon buttons.
- Navbar links MUST be react-router-style absolute paths matching real
  pages on this site. The orchestrator will give you the live page slug
  list — only use those.`;

const THEME_HINTS: Record<string, string> = {
  editorial:
    "Theme: editorial. Use stone/neutral colors only. Wrap one word per h1/h2 in <em> for the Fraunces italic accent. Restrained, premium, world-stage voice.",
  light:
    "Theme: light. White or stone-50 background. text-slate-900 / text-stone-900 for primary text. Single accent (blue-600, indigo-600, emerald-600). No dark backgrounds.",
  warm:
    "Theme: warm. amber-50 / orange-50 background. Sensory copy. Wrap one evocative word per h1/h2 in <em>. Amber/orange accents.",
  dark:
    "Theme: dark. Dark navy/zinc background. White / slate-100 text. ONE neon accent (cyan-400, emerald-400, violet-500). Confident, technical voice.",
};

/**
 * Sanitise a string into a PascalCase identifier safe for a TSX export
 * name. "Pricing & Plans" → "PricingPlans".
 */
function pascalCase(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join("") || "Untitled";
}

/**
 * Map a slug to a route-safe path. Plan slugs already start with "/"
 * but we coerce defensively.
 */
function normaliseSlug(slug: string): string {
  if (!slug || slug === "/") return "/";
  const cleaned = slug.startsWith("/") ? slug : `/${slug}`;
  return cleaned.replace(/\/+$/, "");
}

/**
 * Strip markdown fences + ensure React import — same logic react-stream
 * uses but inlined to keep this module self-contained.
 */
function stripFencesAndWrap(raw: string): string {
  const m = raw.match(/```(?:tsx?|typescript)?\s*([\s\S]*?)```/);
  const code = (m ? m[1] : raw).trim();
  if (!code.includes("import React")) {
    return `import React from "react";\n\n${code}\n`;
  }
  return `${code}\n`;
}

/**
 * Lightweight sanity check — we don't run the full validator from
 * react-stream because the multi-page build prioritises throughput.
 * If the LLM returns clearly broken output (no default export, no JSX,
 * runaway length), the caller falls back to the base component.
 */
function isPlausibleComponent(code: string): boolean {
  if (!code) return false;
  if (code.length < 50 || code.length > 60_000) return false;
  if (!/export\s+default\s+/.test(code)) return false;
  if (!/<[A-Za-z]/.test(code)) return false; // must contain JSX
  // Reject obvious refusals.
  if (/I (cannot|can't|am unable to)/i.test(code.slice(0, 200))) return false;
  return true;
}

interface CustomiseOneArgs {
  baseCode: string;
  brand: SitePlanBrand;
  page: SitePlanPage;
  section: PageSection;
  slugList: string[];
}

async function customiseOne(args: CustomiseOneArgs): Promise<{ code: string; ok: boolean }> {
  const themeHint = THEME_HINTS[args.brand.theme] || THEME_HINTS.editorial;
  const slugLine = args.slugList.length
    ? `Live pages on this site (use ONLY these for navbar links): ${args.slugList.join(", ")}`
    : "No other pages yet.";
  const userMessage =
    `BRAND: ${args.brand.name}\n` +
    `PRIMARY COLOR: ${args.brand.primaryColor}\n` +
    `VOICE: ${args.brand.voice}\n` +
    `\n${themeHint}\n` +
    `\nPAGE: ${args.page.name} (${args.page.slug}) — ${args.page.purpose}\n` +
    `SECTION: ${args.section.category}\n` +
    `SECTION BRIEF: ${args.section.brief}\n` +
    `\n${slugLine}\n` +
    `\nBASE COMPONENT:\n${args.baseCode}\n\n` +
    `Output the full updated TypeScript file only.`;

  try {
    const res = await callLLMWithFailover({
      model: CUSTOMISER_MODEL,
      system: CUSTOMISER_SYSTEM,
      userMessage,
      maxTokens: 4000,
    });
    const cleaned = stripFencesAndWrap(res.text || "");
    if (isPlausibleComponent(cleaned)) {
      return { code: cleaned, ok: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[page-builder] customise failed for ${args.section.category}: ${msg.slice(0, 120)}`);
  }
  // Fall back to the base code — site still works, just less personalised.
  return { code: stripFencesAndWrap(args.baseCode), ok: false };
}

/**
 * Build one page. Sections are customised serially within a page to
 * keep the per-page cost predictable; the orchestrator runs PAGES in
 * parallel, which gives the throughput. Each section's progress is
 * reported via the optional onSectionDone callback so the UI can
 * stream per-component progress events.
 */
export async function buildPage(
  input: BuildPageInput,
  opts?: {
    onSectionStart?: (section: PageSection, index: number) => void;
    onSectionDone?: (section: PageSection, index: number, ok: boolean) => void;
    slugList?: string[];
  },
): Promise<BuildPageResult> {
  const { page, brand, components } = input;
  const slugList = (opts?.slugList || []).map(normaliseSlug);
  const pageDirName = pascalCase(page.name) || pascalCase(page.slug.replace("/", ""));
  const pageExport = `Page${pageDirName}`;

  const sectionFiles: Record<string, string> = {};
  const sectionImports: string[] = [];
  const sectionElements: string[] = [];
  const failedSections: string[] = [];
  let customisationCount = 0;

  for (let i = 0; i < page.sections.length; i++) {
    const section = page.sections[i];
    const baseComponent = components[i];
    if (!baseComponent) continue; // resolver mis-aligned; skip
    opts?.onSectionStart?.(section, i);

    // Shared sections (navbar/footer) are customised ONCE by the
    // orchestrator and reused — when the page-builder sees them, the
    // takenNames set already contains the shared filename so we skip
    // the customisation and just reference it.
    const sharedFile = section.category === "navbar"
      ? "components/SharedNavbar"
      : section.category === "footer"
        ? "components/SharedFooter"
        : null;
    if (sharedFile) {
      const sharedExport = sharedFile.endsWith("Navbar") ? "SharedNavbar" : "SharedFooter";
      sectionImports.push(`import ${sharedExport} from "../${sharedFile}";`);
      sectionElements.push(`<${sharedExport} />`);
      opts?.onSectionDone?.(section, i, true);
      continue;
    }

    const componentName = `${pageDirName}${pascalCase(section.category)}`;
    const filePath = `pages/${pageDirName}/${componentName}.tsx`;

    const renamed = baseComponent.code.replace(
      /export\s+default\s+function\s+\w+/,
      `export default function ${componentName}`,
    );
    const { code, ok } = await customiseOne({
      baseCode: renamed,
      brand,
      page,
      section,
      slugList,
    });
    customisationCount++;
    if (!ok) failedSections.push(`${page.slug}::${section.category}`);
    sectionFiles[filePath] = code.includes(`export default function ${componentName}`)
      ? code
      : code.replace(/export\s+default\s+function\s+\w+/, `export default function ${componentName}`);
    sectionImports.push(`import ${componentName} from "./${componentName}";`);
    sectionElements.push(`<${componentName} />`);
    opts?.onSectionDone?.(section, i, ok);
  }

  // Build the page module that stitches sections together.
  const pageModulePath = `pages/${pageDirName}/index.tsx`;
  sectionFiles[pageModulePath] =
    `import React from "react";\n` +
    sectionImports.join("\n") +
    `\n\nexport default function ${pageExport}() {\n` +
    `  return (\n    <>\n      ${sectionElements.join("\n      ")}\n    </>\n  );\n}\n`;

  return {
    files: sectionFiles,
    pageExport,
    pageImport: `./pages/${pageDirName}`,
    failedSections,
    customisationCount,
  };
}

/**
 * Customise the shared navbar/footer once. Returns the file path +
 * content keyed by the canonical shared name. Shared components are
 * imported from every page module via `../components/SharedNavbar` etc.
 */
export async function buildSharedChrome(
  brand: SitePlanBrand,
  navbarComponent: RegistryComponent | null,
  footerComponent: RegistryComponent | null,
  slugList: string[],
): Promise<{
  files: Record<string, string>;
  failedNames: string[];
}> {
  const out: Record<string, string> = {};
  const failedNames: string[] = [];

  if (navbarComponent) {
    const renamed = navbarComponent.code.replace(
      /export\s+default\s+function\s+\w+/,
      `export default function SharedNavbar`,
    );
    const { code, ok } = await customiseOne({
      baseCode: renamed,
      brand,
      page: {
        slug: "/",
        name: "Shared",
        purpose: "Shared navbar reused across every page in the site.",
        sections: [],
        isPublic: true,
        isAdmin: false,
      },
      section: { category: "navbar", brief: "Shared site navbar — links to all live pages with primary CTA." },
      slugList,
    });
    if (!ok) failedNames.push("navbar");
    out["components/SharedNavbar.tsx"] = code.includes("export default function SharedNavbar")
      ? code
      : code.replace(/export\s+default\s+function\s+\w+/, "export default function SharedNavbar");
  }

  if (footerComponent) {
    const renamed = footerComponent.code.replace(
      /export\s+default\s+function\s+\w+/,
      `export default function SharedFooter`,
    );
    const { code, ok } = await customiseOne({
      baseCode: renamed,
      brand,
      page: {
        slug: "/",
        name: "Shared",
        purpose: "Shared footer reused across every page in the site.",
        sections: [],
        isPublic: true,
        isAdmin: false,
      },
      section: { category: "footer", brief: "Shared site footer — secondary links + contact." },
      slugList,
    });
    if (!ok) failedNames.push("footer");
    out["components/SharedFooter.tsx"] = code.includes("export default function SharedFooter")
      ? code
      : code.replace(/export\s+default\s+function\s+\w+/, "export default function SharedFooter");
  }

  return { files: out, failedNames };
}

/**
 * Build the top-level App.tsx that wires react-router to the page
 * exports. Uses HashRouter so the preview iframe (which doesn't run
 * a real server) handles navigation without 404s.
 */
export function buildAppRouter(
  pages: Array<{ slug: string; exportName: string; importPath: string }>,
  brand: SitePlanBrand,
): string {
  const imports = pages
    .map((p, i) => `import ${p.exportName} from "${p.importPath}";`)
    .join("\n");
  const routes = pages
    .map((p) => `        <Route path="${p.slug}" element={<${p.exportName} />} />`)
    .join("\n");
  return `import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
${imports}

/**
 * Generated by Zoobicon Full-Site Mode.
 * Brand: ${brand.name}
 * Theme: ${brand.theme}
 * Primary: ${brand.primaryColor}
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
${routes}
      </Routes>
    </HashRouter>
  );
}
`;
}
