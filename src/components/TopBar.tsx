"use client";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-cyber-border bg-cyber-dark/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <div className="w-8 h-8 rounded bg-gradient-to-br from-cyber-cyan to-cyber-purple flex items-center justify-center text-cyber-black font-bold text-sm">
          Z
        </div>

        {/* Title with glitch */}
        <h1
          className="glitch-text text-lg font-bold tracking-[4px] uppercase text-white"
          data-text="ZOOBICON"
        >
          ZOOBICON
        </h1>

        <span className="text-[10px] uppercase tracking-[2px] text-cyber-cyan/40 hidden sm:inline">
          AI Website Builder
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[10px] text-cyber-green/60 uppercase tracking-wider">
          v0.1.0
        </span>
        <div className="w-2 h-2 rounded-full bg-cyber-green animate-glow-pulse" />
      </div>
    </header>
  );
}
