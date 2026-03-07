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
        <p className="text-sm text-cyber-border uppercase tracking-[2px]">
          No code generated yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-cyber-border">
        <span className="text-[10px] uppercase tracking-[2px] text-cyber-border flex-1">
          Generated HTML
        </span>
        <button
          onClick={handleCopy}
          className="text-[11px] text-cyber-cyan/60 hover:text-cyber-cyan transition-colors px-2 py-1 rounded hover:bg-cyber-panel"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={handleDownload}
          className="text-[11px] text-cyber-magenta/60 hover:text-cyber-magenta transition-colors px-2 py-1 rounded hover:bg-cyber-panel"
        >
          Download
        </button>
      </div>

      {/* Code display */}
      <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed text-cyber-green/80">
        <code>{html}</code>
      </pre>
    </div>
  );
}
