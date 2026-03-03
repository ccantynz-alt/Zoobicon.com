"use client";

interface StatusBarProps {
  isGenerating: boolean;
  codeLength: number;
}

export default function StatusBar({ isGenerating, codeLength }: StatusBarProps) {
  return (
    <footer className="flex items-center justify-between px-6 py-2 border-t border-gray-200 bg-white text-xs text-gray-400">
      <div className="flex items-center gap-3">
        <span>Zoobicon v0.1</span>
        <span className="text-gray-200">|</span>
        <span className={isGenerating ? "text-brand-500" : ""}>
          {isGenerating ? "Generating..." : "Ready"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {codeLength > 0 && (
          <span>{codeLength.toLocaleString()} chars</span>
        )}
        <span className="text-gray-300">Powered by Claude</span>
      </div>
    </footer>
  );
}
