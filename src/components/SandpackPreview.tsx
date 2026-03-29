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

  // Empty states
  if (mode === "html") {
    const html = (props as SandpackPreviewPropsHTML).html;
    if (!html || !html.trim()) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#131520] text-white/40 text-sm">
          <p>No content to preview</p>
        </div>
      );
    }
  } else if (mode === "react") {
    const files = (props as SandpackPreviewPropsReact).files;
    if (!files || Object.keys(files).length === 0) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[#131520] text-white/40 text-sm">
          <p>No React components to preview</p>
        </div>
      );
    }
  }

  if (mode === "react") {
    return (
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        <style dangerouslySetInnerHTML={{ __html: SANDPACK_FULL_HEIGHT_CSS }} />
        <SandpackProvider
          template="react-ts"
          files={reactFiles}
          theme={zoobiconTheme}
          customSetup={{
            dependencies: {
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
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: SANDPACK_FULL_HEIGHT_CSS }} />
      <SandpackProvider
        template="static"
        files={htmlFiles}
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
