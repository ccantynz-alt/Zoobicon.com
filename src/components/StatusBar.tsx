"use client";

import { Zap } from "lucide-react";

interface StatusBarProps {
  isGenerating: boolean;
  codeLength: number;
}

export default function StatusBar({ isGenerating, codeLength }: StatusBarProps) {
  return (
    <footer className="flex items-center justify-between px-6 py-2 border-t border-white/[0.06] bg-dark-300/80 backdrop-blur-xl text-xs text-white/30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-brand-400" />
          <span>Zoobicon v0.1</span>
        </div>
        <span className="text-white/10">|</span>
        <span className={isGenerating ? "text-brand-400 animate-pulse" : ""}>
          {isGenerating ? "Generating..." : "Ready"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {codeLength > 0 && (
          <span>{codeLength.toLocaleString()} chars</span>
        )}
        <span className="text-white/15">Powered by Claude</span>
      </div>
    </footer>
  );
}
