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
 * Matches the builder's #131520 / #1a1d2e palette.
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
 * Sandpack expects paths prefixed with / and an index.tsx entry point.
 */
function buildReactSandpackFiles(
  files: Record<string, string>,
): Record<string, string> {
  const sandpackFiles: Record<string, string> = {};

  for (const [path, content] of Object.entries(files)) {
    // Ensure leading slash
    const key = path.startsWith("/") ? path : `/${path}`;
    sandpackFiles[key] = content;
  }

  // Sandpack react-ts template requires /App.tsx at the root.
  // Our generation outputs "App.tsx" which becomes "/App.tsx" — this is correct.
  // But the template also needs an index.tsx if one doesn't exist.
  if (!sandpackFiles["/index.tsx"] && !sandpackFiles["/index.ts"]) {
    sandpackFiles["/index.tsx"] = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
`;
  }

  return sandpackFiles;
}

/**
 * In-browser Sandpack preview with optional code editor.
 * Supports two modes:
 * - "html" (default): Renders generated HTML/CSS/JS using the static template
 * - "react": Renders generated React/TypeScript components using the react-ts template
 */
export default function SandpackPreview(props: SandpackPreviewProps) {
  const { showEditor = false } = props;
  const mode = props.mode || "html";

  // HTML mode: extract files from raw HTML string
  const htmlFiles = useMemo(() => {
    if (mode !== "html") return {};
    const html = (props as SandpackPreviewPropsHTML).html || "";
    return extractSandpackFiles(html);
  }, [mode, mode === "html" ? (props as SandpackPreviewPropsHTML).html : ""]);

  // React mode: convert files map to Sandpack format
  const reactFiles = useMemo(() => {
    if (mode !== "react") return {};
    const files = (props as SandpackPreviewPropsReact).files || {};
    return buildReactSandpackFiles(files);
  }, [mode, mode === "react" ? (props as SandpackPreviewPropsReact).files : null]);

  const dependencies = mode === "react" ? (props as SandpackPreviewPropsReact).dependencies : undefined;

  // Empty state
  if (mode === "html") {
    const html = (props as SandpackPreviewPropsHTML).html;
    if (!html || !html.trim()) {
      return (
        <div className="h-full flex items-center justify-center bg-[#131520] text-white/40 text-sm">
          <p>No content to preview</p>
        </div>
      );
    }
  } else if (mode === "react") {
    const files = (props as SandpackPreviewPropsReact).files;
    if (!files || Object.keys(files).length === 0) {
      return (
        <div className="h-full flex items-center justify-center bg-[#131520] text-white/40 text-sm">
          <p>No React components to preview</p>
        </div>
      );
    }
  }

  if (mode === "react") {
    return (
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
        <div className="flex h-full w-full overflow-hidden">
          {showEditor && (
            <div className="h-full overflow-hidden border-r border-white/5" style={{ flex: 1 }}>
              <SandpackCodeEditor
                showTabs
                showLineNumbers
                showInlineErrors
                wrapContent
                style={{ height: "100%" }}
              />
            </div>
          )}
          <div style={{ flex: showEditor ? 2 : 1, height: "100%" }}>
            <SandboxPreview
              showOpenInCodeSandbox={false}
              showRefreshButton
              style={{ height: "100%" }}
            />
          </div>
        </div>
      </SandpackProvider>
    );
  }

  // HTML mode (default / existing behavior)
  return (
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
      <div className="flex h-full w-full overflow-hidden">
        {showEditor && (
          <div className="h-full overflow-hidden border-r border-white/5" style={{ flex: 1 }}>
            <SandpackCodeEditor
              showTabs
              showLineNumbers
              showInlineErrors
              wrapContent
              style={{ height: "100%" }}
            />
          </div>
        )}
        <div style={{ flex: showEditor ? 2 : 1, height: "100%" }}>
          <SandboxPreview
            showOpenInCodeSandbox={false}
            showRefreshButton
            style={{ height: "100%" }}
          />
        </div>
      </div>
    </SandpackProvider>
  );
}
