"use client";

import { useState } from "react";

interface CodePanelProps {
  html: string;
}

export default function CodePanel({ html }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zoobicon-site.html";
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
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[10px] uppercase tracking-[2px] text-white/20 flex-1">
          Generated HTML
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
        <code>{html}</code>
      </pre>
    </div>
  );
}
