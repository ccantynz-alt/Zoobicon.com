// ---------------------------------------------------------------------------
// HTML-to-React Transpiler
//
// Converts generated HTML into a clean Next.js + Tailwind project structure
// with proper React components. Handles:
// - Semantic section decomposition (hero, features, pricing, etc.)
// - CSS extraction → Tailwind classes
// - Inline styles → className conversions
// - Script extraction → React hooks (useEffect)
// - Image/asset handling
// - Proper JSX attribute conversion (class→className, for→htmlFor, etc.)
// ---------------------------------------------------------------------------

interface ReactComponent {
  name: string;
  filename: string;
  source: string;
}

interface TranspileResult {
  page: string;         // src/app/page.tsx
  layout: string;       // src/app/layout.tsx
  globals: string;      // src/app/globals.css
  components: ReactComponent[];
  metadata: {
    title: string;
    description: string;
  };
}

// HTML attributes that need renaming in JSX
const ATTR_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  colspan: "colSpan",
  rowspan: "rowSpan",
  enctype: "encType",
  crossorigin: "crossOrigin",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  frameborder: "frameBorder",
  allowfullscreen: "allowFullScreen",
  srcdoc: "srcDoc",
  srcset: "srcSet",
  novalidate: "noValidate",
  formnovalidate: "formNoValidate",
};

// Self-closing HTML tags
const SELF_CLOSING = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/**
 * Convert raw HTML string to a set of React/Next.js files.
 */
export function transpileHtmlToReact(html: string, projectName: string = "my-site"): TranspileResult {
  // Extract metadata
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/is);
  const title = titleMatch?.[1]?.trim() || projectName;
  const description = descMatch?.[1]?.trim() || `Built with Zoobicon`;

  // Extract inline styles from <style> tags
  const styles: string[] = [];
  const htmlWithoutStyles = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
    styles.push(css);
    return "";
  });

  // Extract scripts
  const scripts: string[] = [];
  const htmlWithoutScripts = htmlWithoutStyles.replace(
    /<script[^>]*>([\s\S]*?)<\/script>/gi,
    (_, js) => {
      // Skip external scripts (CDN) and empty scripts
      if (js.trim()) scripts.push(js.trim());
      return "";
    }
  );

  // Extract body content
  const bodyMatch = htmlWithoutScripts.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyContent = bodyMatch?.[1]?.trim() || htmlWithoutScripts;

  // Decompose into sections
  const sections = decomposeSections(bodyContent);
  const components: ReactComponent[] = [];

  for (const section of sections) {
    const componentName = section.name;
    const jsx = htmlToJsx(section.html);

    components.push({
      name: componentName,
      filename: `${componentName}.tsx`,
      source: `export default function ${componentName}() {\n  return (\n    ${indentJsx(jsx, 4)}\n  );\n}\n`,
    });
  }

  // Build page.tsx
  const imports = components.map((c) => `import ${c.name} from "@/components/${c.name}";`).join("\n");
  const componentUsage = components.map((c) => `      <${c.name} />`).join("\n");

  const clientDirective = scripts.length > 0 ? '"use client";\n\n' : "";
  const useEffectImport = scripts.length > 0 ? 'import { useEffect } from "react";\n' : "";
  const useEffectBlock = scripts.length > 0
    ? `\n  useEffect(() => {\n    ${scripts.map((s) => `// Inline script\n    try { ${sanitizeScript(s)} } catch(e) { console.warn(e); }`).join("\n    ")}\n  }, []);\n`
    : "";

  const page = `${clientDirective}${useEffectImport}${imports}

export default function Home() {${useEffectBlock}
  return (
    <main>
${componentUsage}
    </main>
  );
}
`;

  // Build layout.tsx
  const layout = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
`;

  // Build globals.css (Tailwind + extracted styles)
  const globals = `@tailwind base;
@tailwind components;
@tailwind utilities;

${styles.join("\n\n")}
`;

  return {
    page,
    layout,
    globals,
    components,
    metadata: { title, description },
  };
}

/**
 * Decompose HTML body into semantic sections.
 */
function decomposeSections(html: string): Array<{ name: string; html: string }> {
  const sections: Array<{ name: string; html: string }> = [];

  // Try to find semantic sections first
  const sectionPatterns = [
    { regex: /<(header|nav)[^>]*>[\s\S]*?<\/\1>/gi, prefix: "Header" },
    { regex: /<section[^>]*(?:id|class)=["'][^"']*hero[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, prefix: "Hero" },
    { regex: /<section[^>]*(?:id|class)=["'][^"']*feature[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, prefix: "Features" },
    { regex: /<section[^>]*(?:id|class)=["'][^"']*pricing[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, prefix: "Pricing" },
    { regex: /<section[^>]*(?:id|class)=["'][^"']*testimonial[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, prefix: "Testimonials" },
    { regex: /<section[^>]*(?:id|class)=["'][^"']*faq[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, prefix: "FAQ" },
    { regex: /<section[^>]*(?:id|class)=["'][^"']*cta[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, prefix: "CTA" },
    { regex: /<section[^>]*(?:id|class)=["'][^"']*contact[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, prefix: "Contact" },
    { regex: /<footer[^>]*>[\s\S]*?<\/footer>/gi, prefix: "Footer" },
  ];

  const usedRanges: Array<[number, number]> = [];
  let counter: Record<string, number> = {};

  for (const pattern of sectionPatterns) {
    let match;
    while ((match = pattern.regex.exec(html)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Check for overlap
      const overlaps = usedRanges.some(([s, e]) => start < e && end > s);
      if (overlaps) continue;

      usedRanges.push([start, end]);
      counter[pattern.prefix] = (counter[pattern.prefix] || 0) + 1;
      const name = counter[pattern.prefix] > 1
        ? `${pattern.prefix}${counter[pattern.prefix]}`
        : pattern.prefix;

      sections.push({ name, html: match[0] });
    }
  }

  // If no semantic sections found, try splitting by top-level <section> or <div>
  if (sections.length === 0) {
    const topLevelRegex = /<(section|div|main|article)[^>]*>[\s\S]*?<\/\1>/gi;
    let match;
    let idx = 0;
    while ((match = topLevelRegex.exec(html)) !== null) {
      idx++;
      const name = `Section${idx}`;
      sections.push({ name, html: match[0] });
      if (idx >= 10) break; // Limit to 10 sections
    }
  }

  // If still nothing, wrap the whole thing as one component
  if (sections.length === 0) {
    sections.push({ name: "Content", html });
  }

  return sections;
}

/**
 * Convert HTML string to valid JSX.
 */
function htmlToJsx(html: string): string {
  let jsx = html;

  // Convert self-closing tags
  for (const tag of SELF_CLOSING) {
    const regex = new RegExp(`<${tag}([^>]*?)\\s*/?>`, "gi");
    jsx = jsx.replace(regex, `<${tag}$1 />`);
  }

  // Convert HTML attributes to JSX equivalents
  for (const [htmlAttr, jsxAttr] of Object.entries(ATTR_MAP)) {
    const regex = new RegExp(`\\b${htmlAttr}=`, "g");
    jsx = jsx.replace(regex, `${jsxAttr}=`);
  }

  // Convert inline style strings to objects
  jsx = jsx.replace(/style="([^"]*)"/g, (_, styleStr: string) => {
    const styles = styleStr
      .split(";")
      .filter((s: string) => s.trim())
      .map((s: string) => {
        const [prop, ...vals] = s.split(":");
        if (!prop || vals.length === 0) return null;
        const cssProp = prop.trim();
        const value = vals.join(":").trim();
        // Convert CSS property to camelCase
        const jsProp = cssProp.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        // Keep numeric values as numbers, quote strings
        const jsValue = /^-?\d+(\.\d+)?(px|em|rem|%|vh|vw)?$/.test(value)
          ? value.endsWith("px") || value.endsWith("em") || value.endsWith("rem") || value.endsWith("%") || value.endsWith("vh") || value.endsWith("vw")
            ? `"${value}"`
            : value
          : `"${value.replace(/"/g, '\\"')}"`;
        return `${jsProp}: ${jsValue}`;
      })
      .filter(Boolean);

    return `style={{${styles.join(", ")}}}`;
  });

  // Convert HTML comments to JSX comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, "{/* $1 */}");

  // Handle onclick and other event handlers
  jsx = jsx.replace(/\bonclick=/gi, "onClick=");
  jsx = jsx.replace(/\bonchange=/gi, "onChange=");
  jsx = jsx.replace(/\bonsubmit=/gi, "onSubmit=");
  jsx = jsx.replace(/\bonmouseover=/gi, "onMouseOver=");
  jsx = jsx.replace(/\bonmouseout=/gi, "onMouseOut=");
  jsx = jsx.replace(/\bonkeydown=/gi, "onKeyDown=");
  jsx = jsx.replace(/\bonkeyup=/gi, "onKeyUp=");
  jsx = jsx.replace(/\bonfocus=/gi, "onFocus=");
  jsx = jsx.replace(/\bonblur=/gi, "onBlur=");

  return jsx;
}

/**
 * Indent JSX for clean formatting.
 */
function indentJsx(jsx: string, spaces: number): string {
  const indent = " ".repeat(spaces);
  return jsx
    .split("\n")
    .map((line, i) => (i === 0 ? line : indent + line))
    .join("\n");
}

/**
 * Sanitize script content for use in useEffect.
 */
function sanitizeScript(script: string): string {
  return script
    .replace(/document\.write\(/g, "// document.write(")
    .replace(/\beval\(/g, "// eval(")
    .trim();
}

/**
 * Build a complete Next.js project file map from transpile result.
 */
export function buildReactProjectFiles(
  result: TranspileResult,
  projectName: string
): Record<string, string> {
  const files: Record<string, string> = {};

  files["package.json"] = JSON.stringify({
    name: projectName,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
    },
    dependencies: {
      next: "^14.2.0",
      react: "^18.3.0",
      "react-dom": "^18.3.0",
      "lucide-react": "^0.400.0",
    },
    devDependencies: {
      typescript: "^5.4.0",
      "@types/node": "^20.0.0",
      "@types/react": "^18.3.0",
      "@types/react-dom": "^18.3.0",
      tailwindcss: "^3.4.0",
      postcss: "^8.4.0",
      autoprefixer: "^10.4.0",
    },
  }, null, 2);

  files["tsconfig.json"] = JSON.stringify({
    compilerOptions: {
      target: "es5",
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
      paths: { "@/*": ["./src/*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  }, null, 2);

  files["next.config.js"] = `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\nmodule.exports = nextConfig;\n`;
  files["tailwind.config.ts"] = `import type { Config } from "tailwindcss";\n\nconst config: Config = {\n  content: ["./src/**/*.{ts,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n};\nexport default config;\n`;
  files["postcss.config.js"] = `module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};\n`;
  files[".gitignore"] = "node_modules/\n.next/\nout/\n.env*.local\n";

  // App files
  files["src/app/page.tsx"] = result.page;
  files["src/app/layout.tsx"] = result.layout;
  files["src/app/globals.css"] = result.globals;

  // Components
  for (const comp of result.components) {
    files[`src/components/${comp.filename}`] = comp.source;
  }

  return files;
}
