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
  const config = STATUS_CONFIG[status];

  return (
    <footer className="flex items-center justify-between px-4 py-1.5 border-t border-white/[0.06] bg-[#12121a]/80 text-[10px] tracking-wide">
      <div className="flex items-center gap-2">
        <div
          className={`w-1.5 h-1.5 rounded-full ${config.color} ${
            status === "generating" || status === "editing" ? "animate-glow-pulse" : ""
          }`}
        />
        <span className="text-white/30">{config.label}</span>
      </div>

      <div className="flex items-center gap-4 text-white/15">
        <span>Powered by Claude</span>
        <span>Zoobicon v0.1.0</span>
      </div>
    </footer>
  );
}
