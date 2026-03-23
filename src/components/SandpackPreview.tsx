"use client";

import {
  SandpackProvider,
  SandpackPreview as SandboxPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";
import { useMemo } from "react";
import { extractSandpackFiles } from "@/lib/sandpack-utils";

interface SandpackPreviewProps {
  html: string;
  showEditor?: boolean;
}

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
 * In-browser Sandpack preview with optional code editor.
 * Provides hot-reload for generated HTML/CSS/JS sites.
 */
export default function SandpackPreview({ html, showEditor = false }: SandpackPreviewProps) {
  const files = useMemo(() => extractSandpackFiles(html || ""), [html]);

  if (!html || !html.trim()) {
    return (
      <div className="h-full flex items-center justify-center bg-[#131520] text-white/40 text-sm">
        <p>No content to preview</p>
      </div>
    );
  }

  return (
    <SandpackProvider
      template="static"
      files={files}
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
