"use client";

import {
  SandpackProvider,
  SandpackPreview as SandboxPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { useMemo } from "react";
import { extractSandpackFiles } from "@/lib/sandpack-utils";

interface SandpackPreviewPropsHTML {
  mode?: "html";
  html: string;
  showEditor?: boolean;
}

interface SandpackPreviewPropsReact {
  mode: "react";
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  showEditor?: boolean;
}

type SandpackPreviewProps = SandpackPreviewPropsHTML | SandpackPreviewPropsReact;

/**
 * Zoobicon-branded dark theme for Sandpack.
 */
const zoobiconTheme = {
  colors: {
    surface1: "#131520",
    surface2: "#1a1d2e",
    surface3: "#252840",
    clickable: "#999999",
    base: "#e0e0e0",
    disabled: "#4a4a4a",
    hover: "#c5c5c5",
    accent: "#6d5dfc",
    error: "#ff453a",
    errorSurface: "#3d1e1e",
  },
  syntax: {
    plain: "#d4d4d4",
    comment: { color: "#6a737d", fontStyle: "italic" as const },
    keyword: "#c792ea",
    tag: "#80cbc4",
    punctuation: "#89ddff",
    definition: "#82aaff",
    property: "#c792ea",
    static: "#f78c6c",
    string: "#c3e88d",
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "Fira Mono", monospace',
    size: "13px",
    lineHeight: "20px",
  },
};

/**
 * Convert our React files map to Sandpack's expected format.
 * Also generates placeholder stubs for any components that App.tsx
 * imports but haven't been generated yet (during streaming).
 */
function buildReactSandpackFiles(
  files: Record<string, string>,
): Record<string, string> {
  const sandpackFiles: Record<string, string> = {};

  for (const [path, content] of Object.entries(files)) {
    const key = path.startsWith("/") ? path : `/${path}`;
    sandpackFiles[key] = content;
  }

  if (!sandpackFiles["/index.tsx"] && !sandpackFiles["/index.ts"]) {
    sandpackFiles["/index.tsx"] = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
`;
  }

  // Generate placeholder stubs for missing imports during streaming.
  // Scan App.tsx for import statements and create stubs for any files not yet generated.
  const appContent = sandpackFiles["/App.tsx"] || "";
  const importRegex = /import\s+\w+\s+from\s+["']\.\/([^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(appContent)) !== null) {
    const importPath = match[1];
    // Try common extensions
    const candidates = [
      `/${importPath}.tsx`,
      `/${importPath}.ts`,
      `/${importPath}/index.tsx`,
      `/${importPath}/index.ts`,
      `/${importPath}`,
    ];
    const exists = candidates.some(c => sandpackFiles[c]);
    if (!exists) {
      // Extract component name from import statement
      const nameMatch = match[0].match(/import\s+(\w+)/);
      const componentName = nameMatch?.[1] || "Component";
      sandpackFiles[`/${importPath}.tsx`] = `export default function ${componentName}() {
  return (
    <div style={{
      padding: "2rem",
      textAlign: "center",
      color: "rgba(255,255,255,0.3)",
      background: "rgba(255,255,255,0.02)",
      borderRadius: "1rem",
      margin: "1rem 0",
      border: "1px dashed rgba(255,255,255,0.1)",
    }}>
      <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
      <div style={{ fontSize: "0.875rem" }}>Building ${componentName}...</div>
    </div>
  );
}
`;
    }
  }

  // Also check for CSS imports
  if (appContent.includes('./styles.css') && !sandpackFiles["/styles.css"]) {
    sandpackFiles["/styles.css"] = "/* Generating styles... */\n";
  }

  return sandpackFiles;
}

/**
 * CSS override to force Sandpack's internal elements to fill the container.
 * Sandpack creates its own wrapper divs that don't respect parent height.
 * This forces EVERY div in the Sandpack tree to fill available space.
 */
const SANDPACK_FULL_HEIGHT_CSS = `
  .sp-wrapper,
  .sp-layout,
  .sp-stack,
  .sp-preview-container,
  .sp-preview-iframe,
  .sp-preview-actions-wrapper {
    height: 100% !important;
    max-height: 100% !important;
  }
  .sp-wrapper {
    display: flex !important;
    flex-direction: column !important;
  }
  .sp-layout {
    flex: 1 !important;
    border: none !important;
    border-radius: 0 !important;
  }
  .sp-stack {
    height: 100% !important;
  }
  .sp-preview-container {
    overflow: hidden !important;
  }
  .sp-preview-iframe {
    border: none !important;
  }
`;

/**
 * In-browser Sandpack preview — FULL HEIGHT, fills parent container.
 *
 * The parent MUST have explicit height (h-full, h-screen, or absolute positioning).
 * This component uses absolute positioning internally to guarantee Sandpack
 * fills the entire available space regardless of Sandpack's internal layout.
 */
export default function SandpackPreview(props: SandpackPreviewProps) {
  const { showEditor = false } = props;
  const mode = props.mode || "html";

  const htmlFiles = useMemo(() => {
    if (mode !== "html") return {};
    const html = (props as SandpackPreviewPropsHTML).html || "";
    return extractSandpackFiles(html);
  }, [mode, mode === "html" ? (props as SandpackPreviewPropsHTML).html : ""]);

  const reactFiles = useMemo(() => {
    if (mode !== "react") return {};
    const files = (props as SandpackPreviewPropsReact).files || {};
    return buildReactSandpackFiles(files);
  }, [mode, mode === "react" ? (props as SandpackPreviewPropsReact).files : null]);

  const dependencies = mode === "react" ? (props as SandpackPreviewPropsReact).dependencies : undefined;

  // PRE-WARM MODE: When there are no files yet, mount Sandpack with a realistic
  // placeholder that IMPORTS the same libraries the generated app will use
  // (lucide-react, framer-motion, react-hook-form, clsx, tailwind-merge). This
  // forces the Sandpack bundler to actually fetch + bundle those libraries in
  // the background so the FIRST swap to real content is instant (tested: <2s
  // vs 20-30s cold). The imports must execute at module level — if they're
  // inside a conditional that never runs, the bundler tree-shakes them.
  const isPrewarm =
    mode === "react"
      ? !(props as SandpackPreviewPropsReact).files ||
        Object.keys((props as SandpackPreviewPropsReact).files || {}).length === 0
      : !(props as SandpackPreviewPropsHTML).html ||
        !(props as SandpackPreviewPropsHTML).html.trim();

  // These deps are declared up-front so Sandpack resolves + bundles them
  // BEFORE the first real component arrives. Keep this list tight — every
  // extra dep adds to the pre-warm cost. Only include things >80% of generated
  // sites use.
  const PREWARM_DEPS: Record<string, string> = {
    "lucide-react": "latest",
    "framer-motion": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
  };

  // Pre-warm App that actually imports and references the common libraries.
  // The `const _warm = ...` lines prevent tree-shaking — the bundler has to
  // include the real library code. Wrapped in `if (false)` so they never
  // execute but still get bundled.
  const PREWARM_APP = `import { motion } from "framer-motion";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

// Force bundler to include these libraries so the first real component
// renders instantly. Never executes.
const _warm = { motion, Sparkles, Zap, ArrowRight, clsx, twMerge };

export default function App() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#131520",
      color: "rgba(255,255,255,0.4)",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "14px",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px",
          height: "40px",
          margin: "0 auto 16px",
          border: "3px solid rgba(109,93,252,0.2)",
          borderTopColor: "#6d5dfc",
          borderRadius: "50%",
          animation: "sp-spin 0.8s linear infinite",
        }} />
        <div>Preview ready — describe your site to begin</div>
        <div style={{ fontSize: "11px", marginTop: "8px", opacity: 0.6 }}>
          Pre-warming bundler & dependencies…
        </div>
        <style>{"@keyframes sp-spin { to { transform: rotate(360deg); } }"}</style>
      </div>
      {false && <div>{JSON.stringify(_warm)}</div>}
    </div>
  );
}`;

  const PREWARM_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; background: #131520; color: rgba(255,255,255,0.4); font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-size: 14px; text-align: center; }
    .spinner { width: 40px; height: 40px; margin: 0 auto 16px; border: 3px solid rgba(109,93,252,0.2); border-top-color: #6d5dfc; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body><div><div class="spinner"></div><div>Preview ready — describe your site to begin</div></div></body>
</html>`;

  if (mode === "react") {
    const effectiveFiles = isPrewarm ? { "/App.tsx": PREWARM_APP } : reactFiles;
    return (
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: SANDPACK_FULL_HEIGHT_CSS }} />
        <SandpackProvider
          template="react-ts"
          files={effectiveFiles}
          theme={zoobiconTheme}
          customSetup={{
            dependencies: {
              // During pre-warm, force-load the common libraries so the
              // bundler has them cached when real content arrives.
              ...(isPrewarm ? PREWARM_DEPS : {}),
              ...(dependencies || {}),
            },
          }}
          options={{
            autorun: true,
            autoReload: true,
            recompileMode: "delayed",
            recompileDelay: 500,
            externalResources: [
              "https://cdn.tailwindcss.com",
            ],
          }}
        >
          <div className="flex flex-1 min-h-0 w-full overflow-hidden">
            {showEditor && (
              <div className="flex-1 min-w-0 overflow-hidden border-r border-white/5">
                <SandpackCodeEditor
                  showTabs
                  showLineNumbers
                  showInlineErrors
                  wrapContent
                  style={{ height: "100%" }}
                />
              </div>
            )}
            <div className={showEditor ? "flex-[2] min-w-0" : "flex-1 min-w-0"} style={{ height: "100%" }}>
              <SandboxPreview
                showOpenInCodeSandbox={false}
                showRefreshButton
                style={{ height: "100%" }}
              />
            </div>
          </div>
        </SandpackProvider>
      </div>
    );
  }

  // HTML mode
  const effectiveHtmlFiles = isPrewarm ? { "/index.html": PREWARM_HTML } : htmlFiles;
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: SANDPACK_FULL_HEIGHT_CSS }} />
      <SandpackProvider
        template="static"
        files={effectiveHtmlFiles}
        theme={zoobiconTheme}
        options={{
          autorun: true,
          autoReload: true,
          recompileMode: "delayed",
          recompileDelay: 300,
        }}
      >
        <div className="flex flex-1 min-h-0 w-full overflow-hidden">
          {showEditor && (
            <div className="flex-1 min-w-0 overflow-hidden border-r border-white/5">
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                wrapContent
                style={{ height: "100%" }}
              />
            </div>
          )}
          <div className={showEditor ? "flex-[2] min-w-0" : "flex-1 min-w-0"} style={{ height: "100%" }}>
            <SandboxPreview
              showOpenInCodeSandbox={false}
              showRefreshButton
              style={{ height: "100%" }}
            />
          </div>
        </div>
      </SandpackProvider>
    </div>
  );
}
