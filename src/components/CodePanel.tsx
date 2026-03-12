"use client";

import { useState } from "react";
import { FileCode, FileText } from "lucide-react";

interface CodePanelProps {
  html: string;
  reactSource?: Record<string, string> | null;
}

export default function CodePanel({ html, reactSource }: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  const hasReact = reactSource && Object.keys(reactSource).length >= 3;
  const displayCode = activeFile && reactSource?.[activeFile] ? reactSource[activeFile] : html;
  const displayLabel = activeFile || "Generated HTML";

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(displayCode); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const isReact = activeFile !== null;
    const blob = new Blob([displayCode], { type: isReact ? "text/plain" : "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile || "zoobicon-site.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!html) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-white/30 uppercase tracking-[2px]">
          No code generated yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* File tabs when React components are available */}
      {hasReact && (
        <div className="flex items-center gap-1 px-2 pt-2 pb-0 overflow-x-auto border-b border-white/[0.06]">
          <button
            onClick={() => setActiveFile(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-[11px] font-medium whitespace-nowrap transition-colors ${
              activeFile === null
                ? "bg-white/[0.06] text-brand-400 border-b-2 border-brand-400"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <FileText size={12} />
            HTML
          </button>
          {Object.keys(reactSource!).map((filename) => (
            <button
              key={filename}
              onClick={() => setActiveFile(filename)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeFile === filename
                  ? "bg-white/[0.06] text-purple-400 border-b-2 border-purple-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <FileCode size={12} />
              {filename.replace(/^src\/components\//, "").replace(/^src\/app\//, "")}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[10px] uppercase tracking-[2px] text-white/20 flex-1 truncate">
          {displayLabel}
        </span>
        <button
          onClick={handleCopy}
          className="text-[11px] text-brand-400/60 hover:text-brand-400 transition-colors px-2 py-1 rounded hover:bg-white/[0.03]"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={handleDownload}
          className="text-[11px] text-accent-pink/60 hover:text-accent-pink transition-colors px-2 py-1 rounded hover:bg-white/[0.03]"
        >
          Download
        </button>
      </div>

      {/* Code display */}
      <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed text-green-400/80">
        <code>{displayCode}</code>
      </pre>
    </div>
  );
}
