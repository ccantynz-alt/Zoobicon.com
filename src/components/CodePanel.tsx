"use client";

import { useState } from "react";

interface CodePanelProps {
  code: string;
}

export default function CodePanel({ code }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zoobicon-site.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="font-mono text-xs text-gray-600">
          // No code generated yet
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-cyber-border bg-cyber-dark/30">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider
                     border border-cyber-cyan/30 text-cyber-cyan/70 
                     hover:bg-cyber-cyan/10 hover:border-cyber-cyan/60 transition-all"
        >
          {copied ? "✓ Copied!" : "Copy Code"}
        </button>
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider
                     border border-cyber-magenta/30 text-cyber-magenta/70 
                     hover:bg-cyber-magenta/10 hover:border-cyber-magenta/60 transition-all"
        >
          Download HTML
        </button>
        <span className="ml-auto font-mono text-[10px] text-gray-600">
          {code.length.toLocaleString()} chars
        </span>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto p-4 code-output">
        <pre className="text-xs leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
