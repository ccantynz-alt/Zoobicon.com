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
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-sm text-gray-400">
          No code generated yet
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white">
        <button
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100
                     hover:bg-gray-200 rounded-md transition-colors"
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50
                     hover:bg-brand-100 rounded-md transition-colors"
        >
          Download HTML
        </button>
        <span className="ml-auto text-xs text-gray-400">
          {code.length.toLocaleString()} chars
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-gray-50 code-output">
        <pre className="text-xs leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
