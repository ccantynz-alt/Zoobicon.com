"use client";

import Link from "next/link";

export default function TopBar() {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#12121a]/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Logo mark */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold text-sm">
            Z
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Zoobicon
          </h1>
        </Link>

        <span className="text-xs text-brand-400/60 hidden sm:inline">
          AI Website Builder
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[10px] text-brand-400/60 tracking-wider">
          v0.1.0
        </span>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-glow-pulse" />
      </div>
    </header>
  );
}
