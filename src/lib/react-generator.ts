/**
 * React/Next.js Generator — Converts HTML output to React components
 * or generates React/Next.js project structures directly.
 *
 * This module bridges Zoobicon's HTML generation pipeline with modern
 * React/Next.js output, enabling export to component-based frameworks
 * that developers actually use in production.
 */

export interface ProjectFile {
  path: string;
  content: string;
  language: string;
}

export interface ReactProject {
  name: string;
  framework: "react" | "nextjs";
  files: ProjectFile[];
}

// Internal type for parsed HTML sections
interface ParsedSection {
  tag: string;
  id: string;
  className: string;
  content: string;
  componentName: string;
}

// ─── Utility: Slugify to valid component name ───────────────────────

function toComponentName(raw: string): string {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9\s-_]/g, "")
    .replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
  if (!cleaned || /^\d/.test(cleaned)) return "Section";
  return cleaned;
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    || "my-project";
}

// ─── Utility: Extract inline styles from HTML ───────────────────────

function extractStyleBlocks(html: string): string {
  const styles: string[] = [];
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    styles.push(match[1].trim());
  }
  return styles.join("\n\n");
}

// ─── Utility: Clean HTML content for JSX ────────────────────────────

function htmlToJsx(html: string): string {
  return html
    // Self-closing tags
    .replace(/<(img|br|hr|input|meta|link)([^>]*?)(?<!\/)>/gi, "<$1$2 />")
    // class → className
    .replace(/\bclass="/g, 'className="')
    .replace(/\bclass='/g, "className='")
    // for → htmlFor
    .replace(/\bfor="/g, 'htmlFor="')
    // Style attribute: convert inline style strings to objects is complex,
    // so we leave them as-is for Tailwind-based output (most styles are class-based)
    // tabindex → tabIndex
    .replace(/\btabindex="/g, 'tabIndex="')
    // Remove onclick and other inline handlers (they won't work in React)
    .replace(/\s+on[a-z]+="[^"]*"/gi, "")
    .replace(/\s+on[a-z]+='[^']*'/gi, "")
    // Remove script tags (logic should be in React)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // Remove style tags (extracted separately)
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Collapse whitespace around tags
    .replace(/>\s+</g, ">\n<");
}

// ─── Utility: Infer component name from section attributes ──────────

function inferComponentName(tag: string, id: string, className: string, content: string): string {
  // Check id first
  if (id) {
    const idName = toComponentName(id);
    if (idName !== "Section") return idName;
  }

  // Check classnames for hints
  const classHints = [
    { pattern: /hero/i, name: "Hero" },
    { pattern: /feature/i, name: "Features" },
    { pattern: /pricing/i, name: "Pricing" },
    { pattern: /testimonial/i, name: "Testimonials" },
    { pattern: /faq/i, name: "FAQ" },
    { pattern: /contact/i, name: "Contact" },
    { pattern: /about/i, name: "About" },
    { pattern: /team/i, name: "Team" },
    { pattern: /service/i, name: "Services" },
    { pattern: /portfolio/i, name: "Portfolio" },
    { pattern: /gallery/i, name: "Gallery" },
    { pattern: /blog/i, name: "Blog" },
    { pattern: /cta|call.to.action/i, name: "CallToAction" },
    { pattern: /stats|statistic|counter/i, name: "Stats" },
    { pattern: /how.it.works|steps/i, name: "HowItWorks" },
    { pattern: /newsletter|subscribe/i, name: "Newsletter" },
    { pattern: /logo|brand|partner/i, name: "LogoStrip" },
  ];

  const searchText = `${id} ${className} ${content.slice(0, 500)}`;
  for (const hint of classHints) {
    if (hint.pattern.test(searchText)) return hint.name;
  }

  return "Section";
}

// ─── Core: Parse HTML into sections ─────────────────────────────────

function parseHtmlSections(html: string): { nav: string | null; sections: ParsedSection[]; footer: string | null } {
  let nav: string | null = null;
  let footer: string | null = null;
  const sections: ParsedSection[] = [];

  // Extract nav
  const navMatch = html.match(/<nav[\s\S]*?<\/nav>/i);
  if (navMatch) {
    nav = navMatch[0];
  }

  // Extract header (might contain nav)
  if (!nav) {
    const headerMatch = html.match(/<header[\s\S]*?<\/header>/i);
    if (headerMatch) {
      nav = headerMatch[0];
    }
  }

  // Extract footer
  const footerMatch = html.match(/<footer[\s\S]*?<\/footer>/i);
  if (footerMatch) {
    footer = footerMatch[0];
  }

  // Extract sections
  const sectionRegex = /<section([^>]*)>([\s\S]*?)<\/section>/gi;
  let sectionMatch;
  const usedNames = new Set<string>(["Navbar", "Footer"]);
  let sectionIndex = 0;

  while ((sectionMatch = sectionRegex.exec(html)) !== null) {
    const attrs = sectionMatch[1];
    const content = sectionMatch[2];

    const idMatch = attrs.match(/id="([^"]*)"/i) || attrs.match(/id='([^']*)'/i);
    const classMatch = attrs.match(/class="([^"]*)"/i) || attrs.match(/class='([^']*)'/i);

    const id = idMatch ? idMatch[1] : "";
    const className = classMatch ? classMatch[1] : "";

    let componentName = inferComponentName("section", id, className, content);

    // Deduplicate names
    if (usedNames.has(componentName)) {
      sectionIndex++;
      componentName = `${componentName}${sectionIndex}`;
    }
    usedNames.add(componentName);

    sections.push({
      tag: "section",
      id,
      className,
      content: `<section${attrs}>${content}</section>`,
      componentName,
    });
  }

  // If no sections found, try to extract main/div-based sections
  if (sections.length === 0) {
    const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = mainMatch ? mainMatch[0] : bodyMatch ? bodyMatch[1] : "";

    if (bodyContent) {
      // Remove nav and footer from body content
      let cleaned = bodyContent;
      if (nav) cleaned = cleaned.replace(nav, "");
      if (footer) cleaned = cleaned.replace(footer, "");

      // Try splitting by top-level divs
      const divRegex = /<div([^>]*)>([\s\S]*?)<\/div>(?=\s*<div|\s*$)/gi;
      let divMatch;
      while ((divMatch = divRegex.exec(cleaned)) !== null) {
        const attrs = divMatch[1];
        const content = divMatch[2];
        const idMatch = attrs.match(/id="([^"]*)"/i);
        const classMatch = attrs.match(/class="([^"]*)"/i);
        const id = idMatch ? idMatch[1] : "";
        const className = classMatch ? classMatch[1] : "";

        let componentName = inferComponentName("div", id, className, content);
        if (usedNames.has(componentName)) {
          sectionIndex++;
          componentName = `${componentName}${sectionIndex}`;
        }
        usedNames.add(componentName);

        sections.push({
          tag: "div",
          id,
          className,
          content: `<div${attrs}>${content}</div>`,
          componentName,
        });
      }

      // Fallback: treat entire body as single component
      if (sections.length === 0 && cleaned.trim()) {
        sections.push({
          tag: "main",
          id: "",
          className: "",
          content: cleaned,
          componentName: "MainContent",
        });
      }
    }
  }

  return { nav, sections, footer };
}

// ─── Generate component file from HTML section ──────────────────────

function generateComponentFile(name: string, htmlContent: string): string {
  const jsx = htmlToJsx(htmlContent);

  return `"use client";

import React from "react";

export default function ${name}() {
  return (
    <>
      ${jsx}
    </>
  );
}
`;
}

// ─── Generate globals.css from extracted styles ─────────────────────

function generateGlobalsCss(extractedStyles: string): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Custom Properties (from generated site) ── */
:root {
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-secondary: #7c3aed;
  --color-bg: #ffffff;
  --color-bg-alt: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-border: #e2e8f0;
}

.dark {
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-secondary: #8b5cf6;
  --color-bg: #0f172a;
  --color-bg-alt: #1e293b;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-border: #334155;
}

/* ── Base Resets ── */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: var(--color-bg);
  color: var(--color-text);
}

/* ── Extracted Styles ── */
${extractedStyles}
`;
}

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API: htmlToReact
// ═══════════════════════════════════════════════════════════════════════

export function htmlToReact(html: string, projectName: string): ReactProject {
  const safeName = sanitizeProjectName(projectName);
  const { nav, sections, footer } = parseHtmlSections(html);
  const extractedStyles = extractStyleBlocks(html);
  const files: ProjectFile[] = [];

  // Track component imports for App.tsx
  const componentImports: { name: string; path: string }[] = [];

  // ── Navbar component ──
  if (nav) {
    const name = "Navbar";
    files.push({
      path: `components/${name}.tsx`,
      content: generateComponentFile(name, nav),
      language: "typescript",
    });
    componentImports.push({ name, path: `./components/${name}` });
  }

  // ── Section components ──
  for (const section of sections) {
    files.push({
      path: `components/${section.componentName}.tsx`,
      content: generateComponentFile(section.componentName, section.content),
      language: "typescript",
    });
    componentImports.push({
      name: section.componentName,
      path: `./components/${section.componentName}`,
    });
  }

  // ── Footer component ──
  if (footer) {
    const name = "Footer";
    files.push({
      path: `components/${name}.tsx`,
      content: generateComponentFile(name, footer),
      language: "typescript",
    });
    componentImports.push({ name, path: `./components/${name}` });
  }

  // ── globals.css ──
  files.push({
    path: "styles/globals.css",
    content: generateGlobalsCss(extractedStyles),
    language: "css",
  });

  // ── App.tsx ──
  const importStatements = componentImports
    .map((c) => `import ${c.name} from "${c.path}";`)
    .join("\n");

  const componentRenders = componentImports
    .map((c) => `      <${c.name} />`)
    .join("\n");

  files.push({
    path: "App.tsx",
    content: `import React from "react";
import "./styles/globals.css";
${importStatements}

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
${componentRenders}
    </div>
  );
}
`,
    language: "typescript",
  });

  // ── package.json ──
  files.push({
    path: "package.json",
    content: JSON.stringify(
      {
        name: safeName,
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "lucide-react": "^0.460.0",
        },
        devDependencies: {
          "@types/react": "^18.3.12",
          "@types/react-dom": "^18.3.1",
          "@vitejs/plugin-react": "^4.3.4",
          autoprefixer: "^10.4.20",
          postcss: "^8.4.49",
          tailwindcss: "^3.4.15",
          typescript: "^5.6.3",
          vite: "^6.0.0",
        },
      },
      null,
      2
    ),
    language: "json",
  });

  // ── tsconfig.json ──
  files.push({
    path: "tsconfig.json",
    content: JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          isolatedModules: true,
          moduleDetection: "force",
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
          noFallthroughCasesInSwitch: true,
          forceConsistentCasingInFileNames: true,
          baseUrl: ".",
          paths: {
            "@/*": ["./*"],
          },
        },
        include: ["**/*.ts", "**/*.tsx"],
      },
      null,
      2
    ),
    language: "json",
  });

  // ── tailwind.config.ts ──
  files.push({
    path: "tailwind.config.ts",
    content: `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./App.tsx",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
`,
    language: "typescript",
  });

  // ── postcss.config.js ──
  files.push({
    path: "postcss.config.js",
    content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
    language: "javascript",
  });

  // ── vite.config.ts ──
  files.push({
    path: "vite.config.ts",
    content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": __dirname,
    },
  },
});
`,
    language: "typescript",
  });

  // ── index.html (Vite entry) ──
  files.push({
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
`,
    language: "html",
  });

  // ── main.tsx (Vite entry point) ──
  files.push({
    path: "main.tsx",
    content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
    language: "typescript",
  });

  return {
    name: safeName,
    framework: "react",
    files,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API: generateReactPrompt
// ═══════════════════════════════════════════════════════════════════════

export function generateReactPrompt(
  userPrompt: string,
  framework: "react" | "nextjs"
): string {
  const baseRules = `You are an expert React/TypeScript developer. Generate production-ready code.

RULES:
- Use TypeScript with proper types for all props, state, and data
- Use Tailwind CSS for ALL styling (no inline styles, no CSS modules)
- Use lucide-react for icons (import individually: import { Menu, X, ChevronDown } from "lucide-react")
- Use "use client" directive on components that use hooks or browser APIs
- Include realistic mock data (real company names, real-looking content — never "Lorem ipsum")
- Make everything mobile-responsive with Tailwind breakpoints (sm:, md:, lg:)
- Support dark mode with Tailwind dark: classes
- Use semantic HTML elements (nav, main, section, footer, article)
- Add proper aria labels for accessibility
- Use React.useState, React.useEffect as needed for interactivity
- Export components as default exports
- Use Inter font family`;

  if (framework === "react") {
    return `${baseRules}

FRAMEWORK: React (Vite)
- Generate a multi-file React project using Vite as the bundler
- Entry point: App.tsx that imports and renders all section components
- Each major section should be its own component in components/
- Include: App.tsx, components/*.tsx, styles/globals.css

FILE FORMAT: Return a JSON object where keys are file paths and values are file contents.
Example: { "App.tsx": "import React from...", "components/Hero.tsx": "...", "styles/globals.css": "..." }

USER REQUEST: ${userPrompt}

Generate the complete project now. Return ONLY valid JSON with file paths as keys.`;
  }

  // Next.js
  return `${baseRules}

FRAMEWORK: Next.js 14 (App Router)
- Use the App Router directory structure: app/page.tsx, app/layout.tsx
- Root layout (app/layout.tsx) should include <html>, <body>, font import, and global styles
- Page components go in app/page.tsx (or app/[route]/page.tsx for multi-page)
- Shared components go in components/
- Use next/link for navigation, next/image for images
- Include: app/layout.tsx, app/page.tsx, app/globals.css, components/*.tsx

FILE FORMAT: Return a JSON object where keys are file paths and values are file contents.
Example: { "app/layout.tsx": "...", "app/page.tsx": "...", "components/Hero.tsx": "..." }

USER REQUEST: ${userPrompt}

Generate the complete project now. Return ONLY valid JSON with file paths as keys.`;
}

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API: generateNextJSProject
// ═══════════════════════════════════════════════════════════════════════

export function generateNextJSProject(
  userPrompt: string,
  components: Record<string, string>
): ReactProject {
  const safeName = sanitizeProjectName(userPrompt.slice(0, 40));
  const files: ProjectFile[] = [];

  // Add user-provided component files
  for (const [path, content] of Object.entries(components)) {
    const ext = path.split(".").pop() || "tsx";
    const langMap: Record<string, string> = {
      tsx: "typescript",
      ts: "typescript",
      jsx: "javascript",
      js: "javascript",
      css: "css",
      json: "json",
    };
    files.push({
      path,
      content,
      language: langMap[ext] || "typescript",
    });
  }

  // Check if essential files exist; if not, generate scaffolding
  const existingPaths = new Set(Object.keys(components));

  if (!existingPaths.has("app/layout.tsx")) {
    // Collect component imports from app/page.tsx if it exists
    files.push({
      path: "app/layout.tsx",
      content: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "${safeName}",
  description: "Built with Zoobicon AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          {children}
        </div>
      </body>
    </html>
  );
}
`,
      language: "typescript",
    });
  }

  if (!existingPaths.has("app/globals.css")) {
    files.push({
      path: "app/globals.css",
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #2563eb;
  --color-secondary: #7c3aed;
}

.dark {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`,
      language: "css",
    });
  }

  if (!existingPaths.has("app/page.tsx")) {
    // Build a page that imports discovered components
    const componentFiles = Object.keys(components).filter(
      (p) => p.startsWith("components/") && p.endsWith(".tsx")
    );
    const imports = componentFiles.map((p) => {
      const name = p.replace("components/", "").replace(".tsx", "");
      return { name, path: `@/components/${name}` };
    });

    const importLines = imports.map((i) => `import ${i.name} from "${i.path}";`).join("\n");
    const renderLines = imports.map((i) => `        <${i.name} />`).join("\n");

    files.push({
      path: "app/page.tsx",
      content: `${importLines}

export default function Home() {
  return (
    <main>
${renderLines || "      <div className=\"flex items-center justify-center min-h-screen\">\n        <h1 className=\"text-4xl font-bold\">Welcome</h1>\n      </div>"}
    </main>
  );
}
`,
      language: "typescript",
    });
  }

  // ── package.json ──
  if (!existingPaths.has("package.json")) {
    files.push({
      path: "package.json",
      content: JSON.stringify(
        {
          name: safeName,
          version: "1.0.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            lint: "next lint",
          },
          dependencies: {
            next: "^14.2.15",
            react: "^18.3.1",
            "react-dom": "^18.3.1",
            "lucide-react": "^0.460.0",
          },
          devDependencies: {
            "@types/node": "^22.9.0",
            "@types/react": "^18.3.12",
            "@types/react-dom": "^18.3.1",
            autoprefixer: "^10.4.20",
            eslint: "^9.14.0",
            "eslint-config-next": "^14.2.15",
            postcss: "^8.4.49",
            tailwindcss: "^3.4.15",
            typescript: "^5.6.3",
          },
        },
        null,
        2
      ),
      language: "json",
    });
  }

  // ── tsconfig.json ──
  if (!existingPaths.has("tsconfig.json")) {
    files.push({
      path: "tsconfig.json",
      content: JSON.stringify(
        {
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: {
              "@/*": ["./*"],
            },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        },
        null,
        2
      ),
      language: "json",
    });
  }

  // ── tailwind.config.ts ──
  if (!existingPaths.has("tailwind.config.ts")) {
    files.push({
      path: "tailwind.config.ts",
      content: `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
`,
      language: "typescript",
    });
  }

  // ── next.config.js ──
  if (!existingPaths.has("next.config.js")) {
    files.push({
      path: "next.config.js",
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
`,
      language: "javascript",
    });
  }

  // ── postcss.config.js ──
  if (!existingPaths.has("postcss.config.js")) {
    files.push({
      path: "postcss.config.js",
      content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
      language: "javascript",
    });
  }

  return {
    name: safeName,
    framework: "nextjs",
    files,
  };
}
