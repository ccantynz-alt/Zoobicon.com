"use client";

import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";

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
      <div className="flex items-center justify-center h-full bg-dark-400">
        <div className="text-sm text-white/30">No code generated yet</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-dark-300/50">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/50 bg-white/[0.04]
                     hover:bg-white/[0.08] rounded-lg transition-colors border border-white/[0.06]"
        >
          {copied ? <Check className="w-3 h-3 text-accent-cyan" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy code"}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-400 bg-brand-500/10
                     hover:bg-brand-500/20 rounded-lg transition-colors border border-brand-500/20"
        >
          <Download className="w-3 h-3" />
          Download HTML
        </button>
        <span className="ml-auto text-xs text-white/20">
          {code.length.toLocaleString()} chars
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-dark-400 code-output">
        <pre className="text-xs leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
