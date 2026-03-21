"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Zap, Menu, X } from "lucide-react";
import BackgroundEffects from "./BackgroundEffects";

type Preset = "default" | "energetic" | "calm" | "technical" | "premium" | "minimal" | "contrast" | "blackfog";

interface NavLink {
  label: string;
  href: string;
}

interface PageShellProps {
  children: React.ReactNode;
  preset?: Preset;
  navLinks?: NavLink[];
  showNav?: boolean;
  showFooter?: boolean;
  maxWidth?: "5xl" | "6xl" | "7xl";
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: "Builder", href: "/builder" },
  { label: "Generators", href: "/generators" },
  { label: "Pricing", href: "/pricing" },
  { label: "Marketplace", href: "/marketplace" },
];

/**
 * PageShell — Standardized page wrapper for all marketing pages.
 *
 * Provides consistent:
 *   - BackgroundEffects mesh gradient
 *   - Sticky nav with auth-aware buttons
 *   - Content z-indexing above background
 *   - Footer with standard links
 *   - Mobile-responsive nav drawer
 *
 * Usage:
 *   <PageShell preset="default">
 *     <section>...</section>
 *   </PageShell>
 */
export default function PageShell({
  children,
  preset = "default",
  navLinks = DEFAULT_NAV_LINKS,
  showNav = true,
  showFooter = true,
  maxWidth = "7xl",
}: PageShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const user = localStorage.getItem("zoobicon_user");
      setIsLoggedIn(!!user);
    } catch {
      // SSR or localStorage unavailable
    }
  }, []);

  const maxWidthClass = {
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
  }[maxWidth];

  return (
    <div className="min-h-screen bg-[#050508] text-[#e8e8ec] relative">
      <BackgroundEffects preset={preset} />

      {/* Nav */}
      {showNav && (
        <nav className="relative sticky top-0 z-50 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-xl">
          <div className={`${maxWidthClass} mx-auto px-6 h-16 flex items-center justify-between`}>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-semibold text-white text-sm tracking-tight">Zoobicon</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-1.5 text-sm text-white/55 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-4 py-1.5 text-sm text-white/65 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/builder"
                    className="px-4 py-1.5 rounded-lg text-sm font-medium bg-brand-500/15 text-brand-400 hover:bg-brand-500/25 transition-colors"
                  >
                    Open Builder
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-4 py-1.5 text-sm text-white/65 hover:text-white transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/builder"
                    className="px-4 py-1.5 rounded-lg text-sm font-medium bg-brand-500/15 text-brand-400 hover:bg-brand-500/25 transition-colors"
                  >
                    Start Building
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/60 hover:text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/[0.06] bg-[#050508]/95 backdrop-blur-xl px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 text-sm text-white/65 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-white/[0.06] mt-3 flex flex-col gap-2">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="px-3 py-2.5 rounded-lg text-sm font-medium bg-brand-500/15 text-brand-400 text-center"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="px-3 py-2.5 text-sm text-white/65 text-center"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/builder"
                      className="px-3 py-2.5 rounded-lg text-sm font-medium bg-brand-500/15 text-brand-400 text-center"
                    >
                      Start Building
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      )}

      {/* Content */}
      <main className="relative z-10">{children}</main>

      {/* Footer */}
      {showFooter && (
        <footer className="relative z-10 border-t border-white/[0.06] mt-24">
          <div className={`${maxWidthClass} mx-auto px-6 py-12`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Product</h4>
                <div className="space-y-2.5">
                  <Link href="/builder" className="block text-sm text-white/55 hover:text-white transition-colors">Builder</Link>
                  <Link href="/generators" className="block text-sm text-white/55 hover:text-white transition-colors">Generators</Link>
                  <Link href="/marketplace" className="block text-sm text-white/55 hover:text-white transition-colors">Marketplace</Link>
                  <Link href="/hosting" className="block text-sm text-white/55 hover:text-white transition-colors">Hosting</Link>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Solutions</h4>
                <div className="space-y-2.5">
                  <Link href="/agencies" className="block text-sm text-white/55 hover:text-white transition-colors">Agencies</Link>
                  <Link href="/developers" className="block text-sm text-white/55 hover:text-white transition-colors">Developers</Link>
                  <Link href="/products/website-builder" className="block text-sm text-white/55 hover:text-white transition-colors">Website Builder</Link>
                  <Link href="/products/seo-agent" className="block text-sm text-white/55 hover:text-white transition-colors">SEO Agent</Link>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Resources</h4>
                <div className="space-y-2.5">
                  <Link href="/pricing" className="block text-sm text-white/55 hover:text-white transition-colors">Pricing</Link>
                  <Link href="/support" className="block text-sm text-white/55 hover:text-white transition-colors">Support</Link>
                  <Link href="/domains" className="block text-sm text-white/55 hover:text-white transition-colors">Domains</Link>
                  <Link href="/cli" className="block text-sm text-white/55 hover:text-white transition-colors">CLI</Link>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Legal</h4>
                <div className="space-y-2.5">
                  <Link href="/privacy" className="block text-sm text-white/55 hover:text-white transition-colors">Privacy</Link>
                  <Link href="/terms" className="block text-sm text-white/55 hover:text-white transition-colors">Terms</Link>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/[0.06]">
              <div className="flex items-center gap-2.5 mb-4 md:mb-0">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <Zap size={12} className="text-white" />
                </div>
                <span className="text-xs text-white/50">&copy; {new Date().getFullYear()} Zoobicon. All rights reserved.</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span>Built with AI</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>43 Generators</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>7-Agent Pipeline</span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
