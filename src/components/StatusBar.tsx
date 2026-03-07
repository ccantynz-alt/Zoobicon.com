"use client";

interface StatusBarProps {
  status: "idle" | "generating" | "complete" | "error";
}

const STATUS_CONFIG = {
  idle: { color: "bg-cyber-border", label: "Ready" },
  generating: { color: "bg-cyber-yellow", label: "Generating..." },
  complete: { color: "bg-cyber-green", label: "Build Complete" },
  error: { color: "bg-red-500", label: "Error" },
} as const;

export default function StatusBar({ status }: StatusBarProps) {
  const config = STATUS_CONFIG[status];

  return (
    <footer className="flex items-center justify-between px-4 py-1.5 border-t border-cyber-border bg-cyber-dark/80 text-[10px] uppercase tracking-[1px]">
      <div className="flex items-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full ${config.color} ${
            status === "generating" ? "animate-glow-pulse" : ""
          }`}
        />
        <span className="text-cyber-border">{config.label}</span>
      </div>

      <div className="flex items-center gap-4 text-cyber-border/50">
        <span>Powered by Claude</span>
        <span>Zoobicon v0.1.0</span>
      </div>
    </footer>
  );
}
