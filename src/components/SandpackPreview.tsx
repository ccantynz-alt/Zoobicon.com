"use client";

import {
  SandpackProvider,
  SandpackPreview as SandboxPreview,
  SandpackCodeEditor,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { useMemo } from "react";
import { extractSandpackFiles } from "@/lib/sandpack-utils";

/**
 * Compile-error overlay (Phase 2, 2026-05-13).
 *
 * Sandpack silently shows a blank preview when a generated component
 * has a syntax error, broken import, or runtime crash. The audit found
 * users assume the whole build failed because there's no visible
 * indicator anything went wrong. This overlay reads Sandpack's bundler
 * error state via the useSandpack hook and renders an editorial-light
 * panel naming the offending file with a Refresh action.
 */
function CompileErrorOverlay({ onDownload }: { onDownload?: () => void }) {
  const { sandpack } = useSandpack();
  const error = sandpack.error;

  if (!error) return null;

  // Differentiate Sandpack bundler-infrastructure errors (TIME_OUT,
  // network) from real generated-code compile errors. The bundler
  // service is hosted by codesandbox.io and can be flaky — when it
  // fails the user should know "your build is fine, the preview just
  // can't reach the bundler service" and have a download fallback.
  // 2026-05-26 fix: was previously just "Preview compile error" for
  // EVERYTHING, which made bundler timeouts look like build failures.
  const message = error.message || "Unknown compile error";
  const isInfraError =
    /TIME_OUT|TIMEOUT|connect to (server|runtime)|sandpack-bundler|create-react-app/i.test(message);

  return (
    <div
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 rounded-2xl border p-4 shadow-lg"
      style={{
        background: "var(--paper-elevated)",
        borderColor: "var(--rule)",
        color: "var(--ink)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: "var(--gold-soft)", color: "var(--gold-deep)" }}
        >
          !
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            {isInfraError
              ? "Preview bundler timed out"
              : "Preview compile error"}
          </div>
          {isInfraError ? (
            <div className="mt-0.5 text-xs" style={{ color: "var(--ink-muted)" }}>
              Your site built fine — the in-browser preview service just couldn&apos;t reach its bundler. This is on the upstream sandbox provider (codesandbox.io), not your build.
            </div>
          ) : (
            error.path && (
              <div className="mt-0.5 truncate text-xs" style={{ color: "var(--ink-muted)" }}>
                in {error.path}
              </div>
            )
          )}
          <div
            className="mt-2 max-h-32 overflow-auto rounded-md p-2 font-mono text-[11px] leading-relaxed"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              color: "var(--ink-secondary)",
            }}
          >
            {message}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => sandpack.runSandpack()}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              {isInfraError ? "Retry connection" : "Retry compile"}
            </button>
            {isInfraError && onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: "var(--paper)",
                  borderColor: "var(--rule)",
                  color: "var(--ink)",
                }}
              >
                Download project as ZIP
              </button>
            )}
            <span className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              {isInfraError
                ? "Or wait 30s and retry — the bundler usually recovers."
                : "The generation didn't fail — only this preview render. Edit the file or ask the chat to fix it."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SandpackPreviewPropsHTML {
  mode?: "html";
  html: string;
  showEditor?: boolean;
  /** Called when the user clicks "Download project" in the error
   *  overlay. Builder passes a handler that exports the current files
   *  as a ZIP so failed previews don't strand the user. */
  onDownload?: () => void;
}

interface SandpackPreviewPropsReact {
  mode: "react";
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  showEditor?: boolean;
  onDownload?: () => void;
}

type SandpackPreviewProps = SandpackPreviewPropsHTML | SandpackPreviewPropsReact;

/**
 * Zoobicon-branded LIGHT theme for Sandpack — editorial palette.
 * Was previously the Filmora dark theme (#0f2148 navy with cyan
 * syntax highlighting). Flipped to bone surfaces + ink syntax so
 * the builder's preview pane reads as part of the editorial-light
 * design system, not as a foreign code editor.
 */
const zoobiconTheme = {
  colors: {
    surface1: "#ffffff",      // primary: pure white iframe bg
    surface2: "#f4f1e6",      // secondary: warm cream (var --paper-elevated)
    surface3: "#eeebde",      // tertiary: deeper cream for selection
    clickable: "#76767e",     // interactive idle
    base: "#0a0a0b",          // body text — near-black
    disabled: "#a8a392",      // disabled / placeholder
    hover: "#0a0a0b",         // hover text
    accent: "#e8402b",        // champagne accent
    error: "#b91c1c",
    errorSurface: "#fef2f2",
  },
  syntax: {
    plain: "#0a0a0b",
    comment: { color: "#76767e", fontStyle: "italic" as const },
    keyword: "#c2331f",
    tag: "#0a0a0b",
    punctuation: "#2a2a30",
    definition: "#0a0a0b",
    property: "#c2331f",
    static: "#e8402b",
    string: "#1a3d2e",
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
  const { showEditor = false, onDownload } = props;
  const mode = props.mode || "html";

  // Extract the mode-specific input into a stable value so the useMemo
  // dependency arrays below can be statically checked. The previous inline
  // ternaries triggered react-hooks/exhaustive-deps because eslint can't
  // statically prove the discriminated-union narrowing.
  const htmlInput = mode === "html" ? (props as SandpackPreviewPropsHTML).html : "";
  const reactFilesInput = mode === "react" ? (props as SandpackPreviewPropsReact).files : null;

  const htmlFiles = useMemo(() => {
    if (mode !== "html") return {};
    return extractSandpackFiles(htmlInput || "");
  }, [mode, htmlInput]);

  const reactFiles = useMemo(() => {
    if (mode !== "react") return {};
    return buildReactSandpackFiles(reactFilesInput || {});
  }, [mode, reactFilesInput]);

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
  //
  // PINNED versions (not "latest"): "latest" forces Sandpack to re-resolve
  // from npm on every cold cache, which is the difference between a 2s and
  // a 25s first preview. Pinned versions are reproducible AND cached
  // aggressively by Sandpack's CDN. If a generated component imports a
  // newer API, react-stream's package.json overrides this map.
  const PREWARM_DEPS: Record<string, string> = {
    "lucide-react": "^1.7.0",
    "framer-motion": "^12.38.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
  };

  // Pre-warm App that ACTUALLY uses the common libraries in live JSX,
  // not just module-level dead references. The previous version had
  // `const _warm = {motion, Sparkles, ...}` + `{false && <div>...</div>}`
  // which the bundler tree-shook because the warm const was only used
  // in unreachable code. Audit 2026-05-13 confirmed deps weren't bundled
  // → first real prompt still cold-bundled for 15-20s.
  //
  // Fix: every pre-warm dep is referenced in active JSX that the
  // bundler cannot prove dead. clsx + twMerge build className strings;
  // Sparkles + Zap render real icons; framer-motion wraps the spinner
  // wrapper in a motion.div. By the time the real component arrives,
  // every dep is bundled and module-cached.
  const PREWARM_APP = `import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export default function App() {
  // Active uses of clsx + twMerge so the bundler must include them.
  const spinnerClass = twMerge(clsx("sp-spinner", "sp-rotate"));
  const dotClass = twMerge(clsx("sp-dot"));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        color: "rgba(10, 10, 11, 0.55)",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: "14px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div className={spinnerClass} style={{
          width: "40px",
          height: "40px",
          margin: "0 auto 16px",
          border: "3px solid rgba(232, 64, 43, 0.20)",
          borderTopColor: "#e8402b",
          borderRadius: "50%",
          animation: "sp-spin 0.8s linear infinite",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Sparkles size={14} color="#e8402b" />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <Zap size={12} color="#c2331f" />
          <span>Preview ready — describe your site to begin</span>
        </div>
        <div className={dotClass} style={{ fontSize: "11px", marginTop: "8px", opacity: 0.6 }}>
          Pre-warming bundler & dependencies…
        </div>
        <style>{"@keyframes sp-spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    </motion.div>
  );
}`;

  const PREWARM_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; background: #ffffff; color: #2a2a30; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-size: 14px; text-align: center; }
    .spinner { width: 40px; height: 40px; margin: 0 auto 16px; border: 3px solid rgba(232, 64, 43, 0.20); border-top-color: #e8402b; border-radius: 50%; animation: spin 0.8s linear infinite; }
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
              <div className="relative h-full w-full">
                <SandboxPreview
                  showOpenInCodeSandbox={false}
                  showRefreshButton
                  style={{ height: "100%" }}
                />
                {!isPrewarm && <CompileErrorOverlay onDownload={onDownload} />}
              </div>
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
