"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function TopBar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const user = localStorage.getItem("zoobicon_user");
      if (user) {
        const parsed = JSON.parse(user);
        setIsAdmin(parsed.role === "admin");
      }
    } catch { /* ignore */ }
  }, []);

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

        <nav className="hidden sm:flex items-center gap-1 ml-4">
          <Link href="/builder" className="px-2.5 py-1 text-xs text-white/40 hover:text-white/70 transition-colors rounded-md hover:bg-white/[0.04]">
            Builder
          </Link>
          <Link href="/dashboard" className="px-2.5 py-1 text-xs text-white/40 hover:text-white/70 transition-colors rounded-md hover:bg-white/[0.04]">
            Dashboard
          </Link>
          <Link href="/hosting" className="px-2.5 py-1 text-xs text-white/40 hover:text-white/70 transition-colors rounded-md hover:bg-white/[0.04]">
            Hosting
          </Link>
          {isAdmin && (
            <Link href="/admin" className="px-2.5 py-1 text-xs text-brand-400/50 hover:text-brand-400 transition-colors rounded-md hover:bg-brand-500/5">
              Admin
            </Link>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {isAdmin && (
          <span className="text-[10px] text-brand-400/40 font-medium tracking-wider hidden sm:inline">
            ADMIN · UNLIMITED
          </span>
        )}
        <span className="text-[10px] text-brand-400/60 tracking-wider">
          v0.1.0
        </span>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-glow-pulse" />
      </div>
    </header>
  );
}
