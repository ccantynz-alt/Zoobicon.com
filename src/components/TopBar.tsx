"use client";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-cyber-border bg-cyber-dark/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="relative">
          <span
            className="font-display text-xl font-black tracking-[4px] uppercase glitch-text text-cyber-magenta"
            data-text="ZOOBICON"
          >
            ZOOBICON
          </span>
        </div>
        <div className="h-5 w-px bg-cyber-border" />
        <span className="font-mono text-[10px] text-cyber-cyan/60 uppercase tracking-widest">
          AI Builder v0.1
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span className="font-mono text-[10px] text-cyber-green/80 uppercase">
            System Online
          </span>
        </div>
      </div>
    </header>
  );
}
