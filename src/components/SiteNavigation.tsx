"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Globe,
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
  Wrench,
  KeyRound,
  QrCode,
  FileCode,
} from "lucide-react";

// ── Product categories for mega menu — 4 columns (post-Crontech pivot) ──
// Rule 31 — Zoobicon is now pure AI Builder + Domains + Free Tools.
// Hosting/email/CRM/analytics all delegated to Crontech.
// Rule 19 retired 2026-05-26 — AI Video Creator removed from launch
// scope. Quality bar (HeyGen-grade) wasn't reachable as a side feature.

// Rule 32 — one product: AI Website Builder. Domain registration is a
// feature of the builder checkout, not a separate product in the nav.
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
      { name: "Changelog", href: "/changelog", icon: BookOpen, desc: "What&apos;s new" },
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

export default function SiteNavigation() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Admin role is intentionally NOT surfaced in the public nav per
  // Craig's directive — admin access is URL-only (/admin). The
  // localStorage payload still includes role for downstream guards.
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const megaRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Check auth state
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) {
        // Parse just to validate the payload shape; role intentionally
        // not surfaced in nav per Craig's directive (admin via URL only).
        JSON.parse(raw);
        setIsLoggedIn(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Scroll-aware: strengthen backdrop once the user moves off the hero
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mega menu on route change
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Close mega menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Don't close if clicking inside the mega menu panel itself
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
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        // Craig (May 13): "The menu disappears when you start scrolling
        // through the different pages." Root cause: previous rgba alphas
        // (0.82/0.94) composited against the pure white page rendered as
        // `~#fafaf6` — barely distinguishable from the body, so the header
        // visually merged with content on scroll. Pulled the alpha up to
        // 0.96/0.99 and shifted the tint slightly warmer so the bar reads
        // as a defined stratum at all times. Stronger bottom shadow on
        // scroll for an unmistakable edge.
        background: scrolled
          ? "rgba(252, 250, 243, 0.99)"
          : "rgba(254, 252, 245, 0.96)",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        borderBottom: "1px solid var(--rule)",
        boxShadow: scrolled
          ? "0 8px 24px -8px rgba(10,10,11,0.10), 0 1px 0 0 rgba(184,146,63,0.32)"
          : "0 2px 8px -4px rgba(10,10,11,0.04), 0 1px 0 0 rgba(184,146,63,0.22)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[76px]">
          {/* Logo — editorial monogram. Thin gold ring on bone holding a
              Playfair italic Z. Reads like a Sotheby's mark, not a tech
              square. Wordmark sits next to it in Playfair regular at
              the right optical weight to balance the italic Z. */}
          <Link href="/" className="group flex items-center gap-3 flex-shrink-0">
            <div
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-[1.04]"
              style={{
                background: "var(--paper)",
                border: "1.5px solid var(--gold)",
                boxShadow: "0 2px 6px -2px rgba(140,107,37,0.18), inset 0 0 0 3px var(--paper)",
              }}
            >
              <span
                className="text-[20px] leading-none"
                style={{
                  fontFamily: "'Playfair Display', 'Fraunces', ui-serif, Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 600,
                  color: "var(--ink)",
                  marginTop: "1px",
                }}
              >
                Z
              </span>
            </div>
            <span
              className="hidden sm:block text-[19px] tracking-[-0.01em]"
              style={{
                fontFamily: "'Playfair Display', 'Fraunces', ui-serif, Georgia, serif",
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "0.005em",
              }}
            >
              Zoobicon
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Products mega menu trigger */}
            <div ref={megaRef} className="relative">
              <button
                onClick={() => setMegaOpen(!megaOpen)}
                className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-300 ${
                  megaOpen
                    ? "text-white bg-white/[0.08] border border-white/[0.12]"
                    : "text-white/70 hover:text-white border border-transparent hover:bg-white/[0.04] hover:border-white/[0.08]"
                }`}
              >
                Products
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${megaOpen ? "rotate-180 text-[#E8D4B0]" : ""}`} />
              </button>

              {/* Mega Menu Panel — FULL WIDTH 6 columns, editorial bright treatment.
                  Background sits at near-paper-input white (very bright) with a
                  strong rule + shadow so it reads as a defined drop-down panel
                  on top of the cream header. Item text below uses explicit ink
                  colours instead of relying on the override layer's mapping —
                  the override pulls text-white/X down to muted grey which read
                  as dull. */}
              {megaOpen && (
                <div
                  data-mega-menu
                  className="fixed top-[76px] left-0 right-0"
                  style={{
                    background: "rgba(255, 254, 250, 0.99)",
                    backdropFilter: "blur(28px) saturate(140%)",
                    WebkitBackdropFilter: "blur(28px) saturate(140%)",
                    borderBottom: "1px solid var(--rule-strong)",
                    boxShadow: "0 16px 48px -12px rgba(10,10,11,0.18), 0 4px 12px -4px rgba(10,10,11,0.08)",
                  }}
                >
                  <div className="relative max-w-7xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-4 gap-8">
                      {PRODUCT_SECTIONS.map((section) => (
                        <div key={section.label}>
                          <h3
                            className="mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
                            style={{ color: "var(--gold-deep)" }}
                          >
                            {section.label}
                          </h3>
                          <div className="space-y-1">
                            {section.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="group flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-200 hover:translate-x-0.5"
                                style={{ background: "transparent" }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "var(--paper-elevated)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                }}
                                onClick={() => setMegaOpen(false)}
                              >
                                <item.icon
                                  className="w-4 h-4 group-hover:text-[var(--gold-deep)] transition-colors mt-0.5 flex-shrink-0"
                                  style={{ color: "var(--ink-muted)" }}
                                />
                                <div className="min-w-0">
                                  <div
                                    className="text-[13px] font-semibold flex items-center gap-1.5"
                                    style={{ color: "var(--ink)" }}
                                  >
                                    <span className="truncate">{item.name}</span>
                                    {item.badge && (
                                      <span
                                        className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 uppercase tracking-wider"
                                        style={{
                                          background: "var(--gold-soft)",
                                          color: "var(--gold-deep)",
                                          border: "1px solid var(--gold)",
                                        }}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    className="text-[11px] mt-0.5 leading-relaxed"
                                    style={{ color: "var(--ink-secondary)" }}
                                  >
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
                      style={{ borderTop: "1px solid var(--rule)" }}
                    >
                      <span className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                        AI Website Builder.{" "}
                        <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                          Hosting + custom domain via Crontech at deploy.
                        </span>
                      </span>
                      <div className="flex items-center gap-5">
                        <Link
                          href="/builder"
                          className="group text-[12px] flex items-center gap-1.5 transition-colors"
                          style={{ color: "var(--ink-secondary)" }}
                          onClick={() => setMegaOpen(false)}
                        >
                          Open builder
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                          href="/generators"
                          className="group text-[12px] text-white/60 hover:text-[#E8D4B0] flex items-center gap-1.5 transition-colors"
                          onClick={() => setMegaOpen(false)}
                        >
                          All generators
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
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
                  className={`px-4 py-2 text-[13px] font-medium rounded-full transition-all duration-300 border ${
                    active
                      ? "text-white bg-white/[0.08] border-white/[0.12]"
                      : "text-white/70 hover:text-white hover:bg-white/[0.04] border-transparent hover:border-white/[0.08]"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right side: CTA only. Rule 31 — auth delegated to Crontech SSO.
              Builder runs anonymously; signed-in identity comes from the
              Crontech token forwarded on SSO callback. Until SSO is wired,
              no "Sign in" button surfaces in the public nav. Admin access
              is URL-only (/admin) per Craig's directive. */}
          <div className="hidden lg:flex items-center gap-2">
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="p-2 text-white/40 hover:text-white/70 rounded-full hover:bg-white/[0.04] transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <Link
              href="/builder"
              className="group inline-flex items-center gap-2 px-5 py-2.5 text-[13px] rounded-full transition-all duration-300 hover:-translate-y-0.5"
              style={{
                // Bright champagne gradient with crisp white text — Craig:
                // "the gold is nice but doesn't seem to work — the writing
                // should be white." A subtle gradient (soft champagne →
                // deeper champagne) keeps the gold feel while giving the
                // button enough body for white text to land cleanly. Inner
                // highlight + soft warm shadow finish the polish.
                background: "linear-gradient(135deg, #d4af5e 0%, #b8923f 100%)",
                color: "#ffffff",
                border: "1px solid #a47d2c",
                boxShadow: "0 6px 18px -8px rgba(140,107,37,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
                fontWeight: 600,
                letterSpacing: "0.01em",
                textShadow: "0 1px 1px rgba(80,55,15,0.35)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #b8923f 0%, #8c6b25 100%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #d4af5e 0%, #b8923f 100%)";
              }}
            >
              <span>Start Building</span>
              <span
                className="text-[15px] leading-none transition-transform group-hover:translate-x-0.5"
                style={{
                  fontFamily: "'Playfair Display', 'Fraunces', ui-serif, Georgia, serif",
                  fontWeight: 500,
                  marginTop: "-1px",
                }}
                aria-hidden
              >
                →
              </span>
            </Link>
          </div>

          {/* Mobile/tablet hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-[#E8D4B0] rounded-full transition-colors border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — full-screen editorial overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden max-h-[85vh] overflow-y-auto"
          style={{
            background: "rgba(250,250,247,0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderTop: "1px solid var(--rule)",
          }}
        >
          <div className="px-4 py-4 space-y-5">
            {PRODUCT_SECTIONS.map((section) => (
              <div key={section.label}>
                <h3 className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-2">{section.label}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-stone-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-white/80 flex items-center gap-1.5">
                          {item.name}
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-500/20 text-stone-300 font-semibold">{item.badge}</span>
                          )}
                        </span>
                        <span className="text-[11px] text-stone-500 block">{item.desc}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-white/[0.06] space-y-2">
              <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block p-2.5 text-sm text-white/80 rounded-lg hover:bg-white/[0.05] font-medium">
                Pricing
              </Link>
              <Link href="/compare" onClick={() => setMobileOpen(false)} className="block p-2.5 text-sm text-white/80 rounded-lg hover:bg-white/[0.05]">
                Compare
              </Link>
              {/* Rule 31 — auth delegated to Crontech SSO; no in-product
                  sign-in link until SSO is wired. */}
              <Link
                href="/builder"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-center text-sm rounded-lg transition-colors"
                style={{
                  background: "linear-gradient(135deg, #d4af5e 0%, #b8923f 100%)",
                  color: "#ffffff",
                  border: "1px solid #a47d2c",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  boxShadow: "0 4px 12px -4px rgba(140,107,37,0.45), inset 0 1px 0 0 rgba(255,255,255,0.35)",
                  textShadow: "0 1px 1px rgba(80,55,15,0.35)",
                }}
              >
                Start Building →
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
