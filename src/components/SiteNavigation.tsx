"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Layout,
  Bot,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  LogOut,
  Shield,
  BookOpen,
  Sparkles,
} from "lucide-react";

// ── Product categories for the mega menu ──
// Rule 32 — one product: AI Website Builder. Domain + hosting are
// features of the builder deploy step (Crontech-provisioned), not
// separate products in the nav.
const PRODUCT_SECTIONS = [
  {
    label: "Build",
    items: [
      { name: "AI Website Builder", href: "/builder", icon: Zap, desc: "Build sites in 60 seconds", badge: "Core" },
      { name: "Generators", href: "/generators", icon: Sparkles, desc: "Specialized site generators" },
      { name: "Templates", href: "/showcase", icon: Layout, desc: "Live builds from the community" },
    ],
  },
  {
    label: "Pricing",
    items: [
      { name: "Plans & Pricing", href: "/pricing", icon: Sparkles, desc: "Starter · Pro · Agency" },
      { name: "Compare", href: "/compare", icon: Layout, desc: "vs Lovable, Bolt, v0" },
    ],
  },
  {
    label: "Scale",
    items: [
      { name: "Agency Platform", href: "/agencies", icon: Shield, desc: "White-label for agencies" },
      { name: "AI Agents", href: "/agents", icon: Bot, desc: "Agent framework" },
      { name: "Changelog", href: "/changelog", icon: BookOpen, desc: "What's new" },
    ],
  },
];

const TOP_NAV_LINKS = [
  { name: "Builder", href: "/builder" },
  { name: "Import", href: "/import" },
  { name: "Free audit", href: "/audit" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Pricing", href: "/pricing" },
];

/**
 * SiteNavigation — ZOOBICON BOLD (Rule 37).
 *
 * A confident near-black bar (the Klaviyo stratum) that reads as one
 * defined band over both the dark hero and the bright content sections.
 * White links, ONE lime CTA. Lime square logo mark with an ink Z —
 * no serif, no gold, no glass gradients.
 */
export default function SiteNavigation() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Admin role is intentionally NOT surfaced in the public nav per
  // Craig's directive — admin access is URL-only (/admin).
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const megaRef = useRef<HTMLDivElement>(null);

  // Check auth state
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) {
        JSON.parse(raw);
        setIsLoggedIn(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Scroll-aware: tighten the shadow once the user moves off the hero
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Close mega menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-mega-menu]")) return;
      if (megaRef.current && !megaRef.current.contains(target)) {
        setMegaOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Don't show on admin pages (admin has its own sidebar)
  if (pathname?.startsWith("/admin")) return null;
  // Don't show on builder (has TopBar)
  if (pathname === "/builder") return null;
  // Don't show on edit pages
  if (pathname?.startsWith("/edit/")) return null;

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch { /* ignore */ }
    window.location.href = "/";
  };

  return (
    <nav
      className="zb-nav fixed top-0 left-0 right-0 z-50 transition-shadow duration-300"
      style={{
        background: "rgba(11, 11, 13, 0.92)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderBottom: "1px solid var(--zb-line-dark)",
        boxShadow: scrolled ? "0 12px 32px -16px rgba(0,0,0,0.55)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo — lime square mark, bold Jakarta wordmark */}
          <Link href="/" className="group flex items-center gap-2.5 flex-shrink-0">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-[10px] transition-transform duration-300 group-hover:scale-[1.06] group-hover:-rotate-3"
              style={{ background: "var(--zb-accent)" }}
            >
              <span
                className="zb-display text-[19px] leading-none"
                style={{ color: "var(--zb-accent-ink)", marginTop: "-1px" }}
              >
                Z
              </span>
            </div>
            <span
              className="zb-display hidden sm:block text-[19px]"
              style={{ color: "#ffffff", letterSpacing: "-0.02em" }}
            >
              zoobicon
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* Products mega menu trigger */}
            <div ref={megaRef} className="relative">
              <button
                onClick={() => setMegaOpen(!megaOpen)}
                className={`flex items-center gap-1.5 px-4 py-2 text-[13.5px] font-semibold rounded-full transition-all duration-200 ${
                  megaOpen
                    ? "text-white bg-white/[0.1]"
                    : "text-white/75 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                Product
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${megaOpen ? "rotate-180" : ""}`}
                  style={megaOpen ? { color: "var(--zb-accent)" } : undefined}
                />
              </button>

              {/* Mega menu panel — same ink stratum as the bar, hairline-split */}
              {megaOpen && (
                <div
                  data-mega-menu
                  className="fixed top-[72px] left-0 right-0"
                  style={{
                    background: "rgba(11, 11, 13, 0.98)",
                    backdropFilter: "blur(24px) saturate(140%)",
                    WebkitBackdropFilter: "blur(24px) saturate(140%)",
                    borderBottom: "1px solid var(--zb-line-dark)",
                    boxShadow: "0 32px 64px -24px rgba(0,0,0,0.7)",
                  }}
                >
                  <div className="relative max-w-7xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-3 gap-10">
                      {PRODUCT_SECTIONS.map((section) => (
                        <div key={section.label}>
                          <h3
                            className="zb-eyebrow mb-4"
                            style={{ color: "var(--zb-accent)" }}
                          >
                            {section.label}
                          </h3>
                          <div className="space-y-1">
                            {section.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="group flex items-start gap-3 p-3 rounded-2xl transition-all duration-200 hover:bg-white/[0.06]"
                                onClick={() => setMegaOpen(false)}
                              >
                                <div
                                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] transition-colors duration-200"
                                  style={{ background: "rgba(255,255,255,0.07)" }}
                                >
                                  <item.icon
                                    className="w-4 h-4 transition-colors group-hover:text-[var(--zb-accent)]"
                                    style={{ color: "rgba(255,255,255,0.6)" }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-[14px] font-bold flex items-center gap-1.5 text-white">
                                    <span className="truncate">{item.name}</span>
                                    {item.badge && (
                                      <span
                                        className="text-[9px] px-1.5 py-0.5 rounded-full font-extrabold flex-shrink-0 uppercase tracking-wider"
                                        style={{
                                          background: "var(--zb-accent)",
                                          color: "var(--zb-accent-ink)",
                                        }}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                                    {item.desc}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      className="mt-8 pt-6 flex items-center justify-between"
                      style={{ borderTop: "1px solid var(--zb-line-dark)" }}
                    >
                      <span className="text-[12.5px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                        AI Website Builder.{" "}
                        <span className="font-semibold text-white">
                          Hosting + custom domain provisioned at deploy.
                        </span>
                      </span>
                      <Link
                        href="/builder"
                        className="group text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors hover:text-[var(--zb-accent)]"
                        style={{ color: "rgba(255,255,255,0.75)" }}
                        onClick={() => setMegaOpen(false)}
                      >
                        Open the builder
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Static links — most important pages always visible */}
            {TOP_NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 text-[13.5px] font-semibold rounded-full transition-all duration-200 ${
                    active
                      ? "text-white bg-white/[0.1]"
                      : "text-white/75 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right side: ONE lime CTA. Rule 31 — auth delegated to Crontech
              SSO; no sign-in button until SSO is wired. Admin is URL-only. */}
          <div className="hidden lg:flex items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="p-2 text-white/45 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <Link
              href="/builder"
              className="group inline-flex items-center gap-2 px-5 py-2.5 text-[13.5px] font-bold rounded-full transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "var(--zb-accent)",
                color: "var(--zb-accent-ink)",
                boxShadow: "0 10px 26px -12px rgba(232,64,43,0.55)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--zb-accent-hi)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--zb-accent)"; }}
            >
              Start building
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile/tablet hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2.5 text-white rounded-full transition-colors hover:bg-white/[0.08]"
            style={{ border: "1px solid var(--zb-line-dark)" }}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — same ink stratum, full-bleed */}
      {mobileOpen && (
        <div
          className="lg:hidden max-h-[85vh] overflow-y-auto"
          style={{
            background: "rgba(11, 11, 13, 0.98)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid var(--zb-line-dark)",
          }}
        >
          <div className="px-4 py-5 space-y-6">
            {PRODUCT_SECTIONS.map((section) => (
              <div key={section.label}>
                <h3 className="zb-eyebrow mb-2.5" style={{ color: "var(--zb-accent)" }}>
                  {section.label}
                </h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] transition-colors"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.55)" }} />
                      <div className="min-w-0 flex-1">
                        <span className="text-[14px] font-semibold text-white flex items-center gap-1.5">
                          {item.name}
                          {item.badge && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider"
                              style={{ background: "var(--zb-accent)", color: "var(--zb-accent-ink)" }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </span>
                        <span className="text-[11.5px] block" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {item.desc}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-4 space-y-2" style={{ borderTop: "1px solid var(--zb-line-dark)" }}>
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-[14px] font-semibold text-white/85 rounded-xl hover:bg-white/[0.06]"
              >
                Pricing
              </Link>
              <Link
                href="/compare"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-[14px] font-semibold text-white/85 rounded-xl hover:bg-white/[0.06]"
              >
                Compare
              </Link>
              {/* Rule 31 — auth delegated to Crontech SSO; no in-product
                  sign-in link until SSO is wired. */}
              <Link
                href="/builder"
                onClick={() => setMobileOpen(false)}
                className="block p-3.5 text-center text-[14px] font-bold rounded-full transition-colors"
                style={{
                  background: "var(--zb-accent)",
                  color: "var(--zb-accent-ink)",
                  boxShadow: "0 10px 26px -12px rgba(232,64,43,0.55)",
                }}
              >
                Start building →
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
