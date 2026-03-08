"use client";

interface StatusBarProps {
  status: "idle" | "generating" | "editing" | "complete" | "error";
}

const STATUS_CONFIG = {
  idle: { color: "bg-white/20", label: "Ready" },
  generating: { color: "bg-yellow-400", label: "Generating..." },
  editing: { color: "bg-blue-400", label: "Editing..." },
  complete: { color: "bg-green-500", label: "Build Complete" },
  error: { color: "bg-red-500", label: "Error" },
} as const;

export default function StatusBar({ status }: StatusBarProps) {
  const isGenerating = status === "generating";

  return (
    <footer className="relative flex items-center justify-between px-4 py-1.5 border-t border-white/[0.06] bg-[#12121a]/80 text-[10px] tracking-wide overflow-hidden">
      {/* Animated progress bar during generation */}
      {isGenerating && (
        <div
          className={`w-1.5 h-1.5 rounded-full ${config.color} ${
            status === "generating" || status === "editing" ? "animate-glow-pulse" : ""
          }`}
        />
      )}

      <div className="relative flex items-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            status === "idle"
              ? "bg-white/20"
              : status === "generating"
              ? "bg-blue-400 shadow-[0_0_6px_rgba(0,150,255,0.6)]"
              : status === "complete"
              ? "bg-green-500"
              : "bg-red-500"
          } ${isGenerating ? "animate-pulse" : ""}`}
        />
        <span className={`${isGenerating ? "text-blue-400/60" : "text-white/30"}`}>
          {status === "idle"
            ? "Ready"
            : status === "generating"
            ? "Building your website..."
            : status === "complete"
            ? "Build Complete"
            : "Error"}
        </span>
      </div>

      <div className="relative flex items-center gap-4 text-white/15">
        <span>Powered by Claude</span>
        <span>Zoobicon v0.1.0</span>
      </div>

      <style>{`
        @keyframes status-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </footer>
  );
}
