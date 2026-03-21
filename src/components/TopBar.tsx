"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AgencyBrand {
  agencyName: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
}

export default function TopBar() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAgency, setIsAgency] = useState(false);
  const [agencyBrand, setAgencyBrand] = useState<AgencyBrand | null>(null);

  useEffect(() => {
    try {
      const user = localStorage.getItem("zoobicon_user");
      if (user) {
        const parsed = JSON.parse(user);
        setIsAdmin(parsed.role === "admin");
        setIsAgency(!!parsed.agencyId);
      }
      // Check for agency branding (set by builder page or agency dashboard)
      const brand = localStorage.getItem("zoobicon_agency_brand");
      if (brand) {
        const parsed = JSON.parse(brand);
        if (parsed.agencyName) setAgencyBrand(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const brandName = agencyBrand?.agencyName || "Zoobicon";
  const brandInitial = brandName[0] || "Z";
  const brandGradient = agencyBrand?.primaryColor
    ? { background: `linear-gradient(135deg, ${agencyBrand.primaryColor}, ${agencyBrand.secondaryColor || agencyBrand.primaryColor})` }
    : undefined;

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#12121a]/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Logo mark — agency branded or default */}
        <Link href="/" className="flex items-center gap-3">
          {agencyBrand?.logoUrl ? (
            <img src={agencyBrand.logoUrl} alt={brandName} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold text-sm"
              style={brandGradient}
            >
              {brandInitial}
            </div>
          )}
          <h1 className="text-lg font-bold tracking-tight text-white">
            {brandName}
          </h1>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 ml-4">
          <Link href="/builder" className="px-2.5 py-1 text-xs text-white/50 hover:text-white/70 transition-colors rounded-md hover:bg-white/[0.04]">
            Builder
          </Link>
          <Link href="/dashboard" className="px-2.5 py-1 text-xs text-white/50 hover:text-white/70 transition-colors rounded-md hover:bg-white/[0.04]">
            Dashboard
          </Link>
          <Link href="/hosting" className="px-2.5 py-1 text-xs text-white/50 hover:text-white/70 transition-colors rounded-md hover:bg-white/[0.04]">
            Hosting
          </Link>
          <Link href="/video-creator" className="px-2.5 py-1 text-xs text-white/50 hover:text-white/70 transition-colors rounded-md hover:bg-white/[0.04]">
            Video
          </Link>
          {isAgency && (
            <Link href="/agencies/dashboard" className="px-2.5 py-1 text-xs text-white/50 hover:text-white/70 transition-colors rounded-md hover:bg-white/[0.04]">
              Agency
            </Link>
          )}
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
        {agencyBrand && !isAdmin && (
          <span className="text-[10px] font-medium tracking-wider hidden sm:inline" style={{ color: agencyBrand.primaryColor || "#3b82f6", opacity: 0.6 }}>
            WHITE-LABEL
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
