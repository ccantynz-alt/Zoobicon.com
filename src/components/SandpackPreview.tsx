"use client";

import {
  SandpackProvider,
  SandpackPreview as SandboxPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  Component,
} from "react";
import type { ReactNode } from "react";
import { extractSandpackFiles } from "@/lib/sandpack-utils";
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

/* ───────────────────────────────────────────────────────────
   Types
   ─────────────────────────────────────────────────────────── */

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

type ViewportSize = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<ViewportSize, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

/* ───────────────────────────────────────────────────────────
   Zoobicon dark theme
   ─────────────────────────────────────────────────────────── */

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

/* ───────────────────────────────────────────────────────────
   Pre-warm: common dependencies that get pre-bundled
   ─────────────────────────────────────────────────────────── */

const PREWARM_DEPENDENCIES: Record<string, string> = {
  react: "^18.2.0",
  "react-dom": "^18.2.0",
  "lucide-react": "^0.300.0",
  "framer-motion": "^11.0.0",
};

/* ───────────────────────────────────────────────────────────
   Build React Sandpack files (with placeholder stubs)
   ─────────────────────────────────────────────────────────── */

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
  const appContent = sandpackFiles["/App.tsx"] || "";
  const importRegex = /import\s+\w+\s+from\s+["']\.\/([^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(appContent)) !== null) {
    const importPath = match[1];
    const candidates = [
      `/${importPath}.tsx`,
      `/${importPath}.ts`,
      `/${importPath}/index.tsx`,
      `/${importPath}/index.ts`,
      `/${importPath}`,
    ];
    const exists = candidates.some((c) => sandpackFiles[c]);
    if (!exists) {
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
      <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>&#x23F3;</div>
      <div style={{ fontSize: "0.875rem" }}>Building ${componentName}...</div>
    </div>
  );
}
`;
    }
  }

  if (appContent.includes("./styles.css") && !sandpackFiles["/styles.css"]) {
    sandpackFiles["/styles.css"] = "/* Generating styles... */\n";
  }

  return sandpackFiles;
}

/* ───────────────────────────────────────────────────────────
   CSS override for full-height Sandpack
   ─────────────────────────────────────────────────────────── */

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

/* ───────────────────────────────────────────────────────────
   Skeleton loader — $100K premium quality
   ─────────────────────────────────────────────────────────── */

function PreviewSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#131520] overflow-hidden">
      {/* Shimmer animation keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes zb-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes zb-pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes zb-spin {
          to { transform: rotate(360deg); }
        }
        .zb-shimmer-block {
          background: linear-gradient(
            90deg,
            rgba(109, 93, 252, 0.05) 0%,
            rgba(109, 93, 252, 0.12) 40%,
            rgba(109, 93, 252, 0.05) 80%
          );
          background-size: 200% 100%;
          animation: zb-shimmer 1.8s ease-in-out infinite;
          border-radius: 8px;
        }
      `,
        }}
      />

      {/* Fake navbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="zb-shimmer-block w-28 h-6" />
        <div className="flex gap-4">
          <div className="zb-shimmer-block w-16 h-4" />
          <div className="zb-shimmer-block w-16 h-4" />
          <div className="zb-shimmer-block w-16 h-4" />
          <div className="zb-shimmer-block w-20 h-8 rounded-full" />
        </div>
      </div>

      {/* Fake hero section */}
      <div className="flex flex-col items-center justify-center px-8 py-16 gap-4">
        <div className="zb-shimmer-block w-16 h-5 rounded-full" />
        <div className="zb-shimmer-block w-[480px] max-w-full h-10" />
        <div className="zb-shimmer-block w-[360px] max-w-full h-10" />
        <div className="zb-shimmer-block w-[520px] max-w-full h-5 mt-2" />
        <div className="zb-shimmer-block w-[400px] max-w-full h-5" />
        <div className="flex gap-3 mt-4">
          <div className="zb-shimmer-block w-32 h-11 rounded-lg" />
          <div className="zb-shimmer-block w-32 h-11 rounded-lg" />
        </div>
      </div>

      {/* Fake feature cards */}
      <div className="grid grid-cols-3 gap-4 px-8 pb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 p-6 flex flex-col gap-3"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="zb-shimmer-block w-10 h-10 rounded-lg" />
            <div className="zb-shimmer-block w-3/4 h-5" />
            <div className="zb-shimmer-block w-full h-4" />
            <div className="zb-shimmer-block w-5/6 h-4" />
          </div>
        ))}
      </div>

      {/* Loading indicator overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-4 bg-[#131520]/80 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/10">
          <div
            className="w-8 h-8 rounded-full border-[3px] border-white/10"
            style={{
              borderTopColor: "#6d5dfc",
              animation: "zb-spin 0.8s linear infinite",
            }}
          />
          <span className="text-sm text-white/50 tracking-wide">
            Preparing live preview...
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   Error boundary for Sandpack crashes
   ─────────────────────────────────────────────────────────── */

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class SandpackErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#131520]">
          <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Preview crashed
            </h3>
            <p className="text-sm text-white/50 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred in the preview renderer."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              className="px-5 py-2.5 rounded-lg bg-[#6d5dfc] hover:bg-[#5d4de6] text-white text-sm font-medium transition-colors"
            >
              Restart Preview
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ───────────────────────────────────────────────────────────
   Responsive preview toolbar
   ─────────────────────────────────────────────────────────── */

interface PreviewToolbarProps {
  viewport: ViewportSize;
  onViewportChange: (v: ViewportSize) => void;
  onRefresh: () => void;
  onOpenNewTab: () => void;
}

function PreviewToolbar({
  viewport,
  onViewportChange,
  onRefresh,
  onOpenNewTab,
}: PreviewToolbarProps) {
  const viewportLabels: Record<ViewportSize, string> = {
    desktop: "Desktop",
    tablet: "768px",
    mobile: "375px",
  };

  const viewportIcons: Record<ViewportSize, ReactNode> = {
    desktop: <Monitor className="w-3.5 h-3.5" />,
    tablet: <Tablet className="w-3.5 h-3.5" />,
    mobile: <Smartphone className="w-3.5 h-3.5" />,
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1d2e] border-b border-white/5 shrink-0">
      {/* Viewport buttons */}
      <div className="flex items-center gap-1">
        {(["desktop", "tablet", "mobile"] as ViewportSize[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewportChange(v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              viewport === v
                ? "bg-[#6d5dfc]/20 text-[#6d5dfc] border border-[#6d5dfc]/30"
                : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"
            }`}
            title={`${v.charAt(0).toUpperCase() + v.slice(1)} view`}
          >
            {viewportIcons[v]}
            <span className="hidden sm:inline">{viewportLabels[v]}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          title="Refresh preview"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onOpenNewTab}
          className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────
   Pre-warm app template
   ─────────────────────────────────────────────────────────── */

const PREWARM_APP = `import React from "react";
import { Monitor } from "lucide-react";

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
        <div>Preview ready &mdash; describe your site to begin</div>
        <style>{"@keyframes sp-spin { to { transform: rotate(360deg); } }"}</style>
      </div>
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
<body><div><div class="spinner"></div><div>Preview ready &mdash; describe your site to begin</div></div></body>
</html>`;

/* ───────────────────────────────────────────────────────────
   Main component
   ─────────────────────────────────────────────────────────── */

export default function SandpackPreview(props: SandpackPreviewProps) {
  const { showEditor = false } = props;
  const mode = props.mode || "html";

  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [resetKey, setResetKey] = useState(0);
  const [sandpackReady, setSandpackReady] = useState(false);
  const prevFilesRef = useRef<Record<string, string>>({});

  /* ── Detect prewarm state ── */
  const isPrewarm =
    mode === "react"
      ? !(props as SandpackPreviewPropsReact).files ||
        Object.keys((props as SandpackPreviewPropsReact).files || {}).length ===
          0
      : !(props as SandpackPreviewPropsHTML).html ||
        !(props as SandpackPreviewPropsHTML).html.trim();

  /* ── HTML files ── */
  const htmlFiles = useMemo(() => {
    if (mode !== "html") return {};
    const html = (props as SandpackPreviewPropsHTML).html || "";
    return extractSandpackFiles(html);
  }, [mode, mode === "html" ? (props as SandpackPreviewPropsHTML).html : ""]);

  /* ── React files with smart diffing ── */
  const reactFiles = useMemo(() => {
    if (mode !== "react") return {};
    const files = (props as SandpackPreviewPropsReact).files || {};
    const built = buildReactSandpackFiles(files);

    // Smart diff: only update changed files. Sandpack internally handles
    // incremental recompilation, but we avoid unnecessary rerenders by
    // returning the same reference when nothing changed.
    const prev = prevFilesRef.current;
    const prevKeys = Object.keys(prev);
    const builtKeys = Object.keys(built);

    let hasChanges = prevKeys.length !== builtKeys.length;
    if (!hasChanges) {
      for (const key of builtKeys) {
        if (prev[key] !== built[key]) {
          hasChanges = true;
          break;
        }
      }
    }

    if (hasChanges) {
      prevFilesRef.current = built;
      return built;
    }

    return prev;
  }, [
    mode,
    mode === "react" ? (props as SandpackPreviewPropsReact).files : null,
  ]);

  const dependencies =
    mode === "react"
      ? (props as SandpackPreviewPropsReact).dependencies
      : undefined;

  /* ── Mark Sandpack as ready after initial mount + short delay ── */
  useEffect(() => {
    // Give Sandpack a moment to initialize the iframe
    const timer = setTimeout(() => {
      setSandpackReady(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  /* ── When real files arrive after prewarm, mark ready immediately ── */
  useEffect(() => {
    if (!isPrewarm && !sandpackReady) {
      setSandpackReady(true);
    }
  }, [isPrewarm, sandpackReady]);

  /* ── Toolbar handlers ── */
  const handleRefresh = useCallback(() => {
    setResetKey((k) => k + 1);
  }, []);

  const handleOpenNewTab = useCallback(() => {
    // Build a standalone HTML page from current files and open in new tab
    if (mode === "react") {
      const files = isPrewarm ? { "/App.tsx": PREWARM_APP } : reactFiles;
      const appCode = files["/App.tsx"] || files["/App.ts"] || "";
      const newWin = window.open("", "_blank");
      if (newWin) {
        newWin.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Zoobicon Preview</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,sans-serif;}</style>
</head><body>
<div id="root"></div>
<pre style="padding:2rem;background:#1a1d2e;color:#e0e0e0;white-space:pre-wrap;border-radius:8px;margin:2rem;font-size:13px;">
${appCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
</pre>
</body></html>`);
        newWin.document.close();
      }
    } else {
      const html = (props as SandpackPreviewPropsHTML).html || "";
      const newWin = window.open("", "_blank");
      if (newWin) {
        newWin.document.write(html);
        newWin.document.close();
      }
    }
  }, [mode, isPrewarm, reactFiles, props]);

  const handleErrorReset = useCallback(() => {
    setResetKey((k) => k + 1);
    setSandpackReady(false);
    setTimeout(() => setSandpackReady(true), 2000);
  }, []);

  /* ── Viewport wrapper style ── */
  const viewportStyle: React.CSSProperties =
    viewport === "desktop"
      ? { width: "100%", height: "100%" }
      : {
          width: VIEWPORT_WIDTHS[viewport],
          height: "100%",
          margin: "0 auto",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          transition: "width 0.3s ease",
        };

  /* ── Render: React mode ── */
  if (mode === "react") {
    const effectiveFiles = isPrewarm
      ? { "/App.tsx": PREWARM_APP }
      : reactFiles;
    const effectiveDeps = {
      ...PREWARM_DEPENDENCIES,
      ...(dependencies || {}),
    };

    return (
      <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#131520]">
        <style dangerouslySetInnerHTML={{ __html: SANDPACK_FULL_HEIGHT_CSS }} />

        {/* Toolbar */}
        <PreviewToolbar
          viewport={viewport}
          onViewportChange={setViewport}
          onRefresh={handleRefresh}
          onOpenNewTab={handleOpenNewTab}
        />

        {/* Skeleton shown until Sandpack initializes */}
        {!sandpackReady && isPrewarm && <PreviewSkeleton />}

        <SandpackErrorBoundary onReset={handleErrorReset}>
          <SandpackProvider
            key={resetKey}
            template="react-ts"
            files={effectiveFiles}
            theme={zoobiconTheme}
            customSetup={{
              dependencies: effectiveDeps,
            }}
            options={{
              autorun: true,
              autoReload: true,
              recompileMode: "delayed",
              recompileDelay: 500,
              externalResources: ["https://cdn.tailwindcss.com"],
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
              <div
                className={
                  showEditor ? "flex-[2] min-w-0" : "flex-1 min-w-0"
                }
                style={{ height: "100%" }}
              >
                <div style={viewportStyle}>
                  <SandboxPreview
                    showOpenInCodeSandbox={false}
                    showRefreshButton={false}
                    style={{ height: "100%" }}
                  />
                </div>
              </div>
            </div>
          </SandpackProvider>
        </SandpackErrorBoundary>
      </div>
    );
  }

  /* ── Render: HTML mode ── */
  const effectiveHtmlFiles = isPrewarm
    ? { "/index.html": PREWARM_HTML }
    : htmlFiles;

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#131520]">
      <style dangerouslySetInnerHTML={{ __html: SANDPACK_FULL_HEIGHT_CSS }} />

      {/* Toolbar */}
      <PreviewToolbar
        viewport={viewport}
        onViewportChange={setViewport}
        onRefresh={handleRefresh}
        onOpenNewTab={handleOpenNewTab}
      />

      {/* Skeleton shown until Sandpack initializes */}
      {!sandpackReady && isPrewarm && <PreviewSkeleton />}

      <SandpackErrorBoundary onReset={handleErrorReset}>
        <SandpackProvider
          key={resetKey}
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
            <div
              className={showEditor ? "flex-[2] min-w-0" : "flex-1 min-w-0"}
              style={{ height: "100%" }}
            >
              <div style={viewportStyle}>
                <SandboxPreview
                  showOpenInCodeSandbox={false}
                  showRefreshButton={false}
                  style={{ height: "100%" }}
                />
              </div>
            </div>
          </div>
        </SandpackProvider>
      </SandpackErrorBoundary>
    </div>
  );
}
