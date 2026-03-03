"use client";

interface StatusBarProps {
  isGenerating: boolean;
  codeLength: number;
}

export default function StatusBar({ isGenerating, codeLength }: StatusBarProps) {
  return (
    <footer className="flex items-center justify-between px-6 py-2 border-t border-cyber-border bg-cyber-dark/80 text-[10px] font-mono">
      <div className="flex items-center gap-4">
        <span className="text-gray-600">ZOOBICON v0.1.0</span>
        <span className="text-gray-700">|</span>
        <span className={isGenerating ? "text-cyber-yellow animate-pulse" : "text-gray-600"}>
          {isGenerating ? "GENERATING" : "IDLE"}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {codeLength > 0 && (
          <span className="text-cyber-cyan/50">
            OUTPUT: {codeLength.toLocaleString()} chars
          </span>
        )}
        <span className="text-gray-700">POWERED BY CLAUDE AI</span>
      </div>
    </footer>
  );
}
