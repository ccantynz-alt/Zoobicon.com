"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Globe,
  Video,
  Server,
  Layout,
  Search,
  ShoppingBag,
  Users,
  Code,
  BarChart3,
  Mail,
  Palette,
  Bot,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  LogOut,
  LayoutDashboard,
  Rocket,
  Shield,
  BookOpen,
  Sparkles,
  Wifi,
  Lock,
  HardDrive,
  Mic,
  Calendar,
  Wrench,
  KeyRound,
  FileText,
  QrCode,
  Hash,
  Type,
  FileCode,
  Smartphone,
} from "lucide-react";

// ── Product categories for mega menu — 6 columns ──

const PRODUCT_SECTIONS = [
  {
    label: "Build",
    items: [
      { name: "AI Website Builder", href: "/builder", icon: Zap, desc: "Build sites in 60 seconds", badge: "Core" },
      { name: "Generators", href: "/generators", icon: Sparkles, desc: "43 specialized generators" },
      { name: "Templates", href: "/starter-kits", icon: Layout, desc: "100+ ready-made templates" },
      { name: "Video Creator", href: "/video-creator", icon: Video, desc: "AI video production" },
    ],
  },
  {
    label: "Launch",
    items: [
      { name: "Hosting", href: "/hosting", icon: Server, desc: "Deploy to zoobicon.sh" },
      { name: "Domains", href: "/domains", icon: Globe, desc: "Search & register domains" },
      { name: "Domain Finder", href: "/domain-finder", icon: Search, desc: "AI domain discovery" },
      { name: "SEO Dashboard", href: "/seo", icon: BarChart3, desc: "Optimize rankings" },
    ],
  },
  {
    label: "Grow",
    items: [
      { name: "Email Marketing", href: "/email-marketing", icon: Mail, desc: "Campaigns & automation" },
      { name: "CRM", href: "/crm", icon: Users, desc: "Manage contacts & leads" },
      { name: "Analytics", href: "/analytics", icon: BarChart3, desc: "Track your traffic" },
      { name: "Marketplace", href: "/marketplace", icon: ShoppingBag, desc: "Add-ons & extensions" },
    ],
  },
  {
    label: "Products",
    items: [
      { name: "eSIM", href: "/products/esim", icon: Wifi, desc: "190+ countries", badge: "New" },
      { name: "VPN", href: "/products/vpn", icon: Lock, desc: "Secure browsing" },
      { name: "Cloud Storage", href: "/products/cloud-storage", icon: HardDrive, desc: "S3-compatible" },
      { name: "AI Dictation", href: "/products/dictation", icon: Mic, desc: "Speech to text" },
      { name: "Booking", href: "/products/booking", icon: Calendar, desc: "Scheduling & appointments" },
    ],
  },
  {
    label: "Free Tools",
    items: [
      { name: "Business Name Generator", href: "/tools/business-name-generator", icon: Sparkles, desc: "AI-powered names" },
      { name: "Password Generator", href: "/tools/password-generator", icon: KeyRound, desc: "Secure passwords" },
      { name: "QR Code Generator", href: "/tools/qr-code-generator", icon: QrCode, desc: "Create QR codes" },
      { name: "Meta Tag Generator", href: "/tools/meta-tag-generator", icon: FileCode, desc: "SEO meta tags" },
      { name: "More Tools", href: "/tools/word-counter", icon: Wrench, desc: "12 free tools" },
    ],
  },
  {
    label: "Scale",
    items: [
      { name: "Agency Platform", href: "/agencies", icon: Shield, desc: "White-label for agencies" },
      { name: "API & Developers", href: "/developers", icon: Code, desc: "REST API & CLI" },
      { name: "AI Agents", href: "/agents", icon: Bot, desc: "Agent framework" },
      { name: "Documentation", href: "/documentation", icon: BookOpen, desc: "Guides & reference" },
    ],
  },
];

const TOP_NAV_LINKS = [
  { name: "Pricing", href: "/pricing" },
  { name: "Domains", href: "/domains" },
  { name: "eSIM", href: "/products/esim" },
  { name: "Free Tools", href: "/tools/business-name-generator" },
];

export default function SiteNavigation() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const megaRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Check auth state
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) {
        const user = JSON.parse(raw);
        setIsLoggedIn(true);
        setIsAdmin(user.role === "admin");
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0b1530]/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_8px_32px_-16px_rgba(0,0,0,0.6)]"
          : "bg-[#0b1530]/40 backdrop-blur-xl border-b border-white/[0.03]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-[72px]">
          {/* Logo — editorial warm mark + word mark */}
          <Link href="/" className="group flex items-center gap-2.5 flex-shrink-0">
            <div
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-[1.04]"
              style={{
                background: "linear-gradient(135deg, #E8D4B0 0%, #F7C8A0 60%, #E08BB0 100%)",
                boxShadow: "0 10px 30px -12px rgba(232,212,176,0.55)",
              }}
            >
              <span className="text-black font-black text-[15px] tracking-tight">Z</span>
            </div>
            <span className="hidden sm:block text-white font-semibold text-[17px] tracking-[-0.02em]">
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

              {/* Mega Menu Panel — FULL WIDTH 6 columns, cinematic treatment */}
              {megaOpen && (
                <div
                  data-mega-menu
                  className="fixed top-[72px] left-0 right-0 border-b border-white/[0.08] shadow-[0_40px_80px_-24px_rgba(0,0,0,0.8)]"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(10,10,15,0.98) 0%, rgba(20,40,95,0.98) 100%)",
                    backdropFilter: "blur(24px)",
                  }}
                >
                  {/* Ambient warm glow */}
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div
                      className="absolute left-1/2 top-0 h-[400px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]"
                      style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.08), transparent 70%)" }}
                    />
                  </div>

                  <div className="relative max-w-7xl mx-auto px-6 py-10">
                    <div className="grid grid-cols-6 gap-8">
                      {PRODUCT_SECTIONS.map((section) => (
                        <div key={section.label}>
                          <h3
                            className="mb-4 text-[10px] uppercase tracking-[0.2em] font-semibold"
                            style={{ color: "rgba(232,212,176,0.75)" }}
                          >
                            {section.label}
                          </h3>
                          <div className="space-y-1">
                            {section.items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className="group flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-300 hover:bg-white/[0.04] hover:translate-x-0.5"
                                onClick={() => setMegaOpen(false)}
                              >
                                <item.icon className="w-4 h-4 text-white/40 group-hover:text-[#E8D4B0] transition-colors mt-0.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[13px] text-white/85 group-hover:text-white font-medium flex items-center gap-1.5">
                                    <span className="truncate">{item.name}</span>
                                    {item.badge && (
                                      <span
                                        className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                                        style={{
                                          background: "rgba(232,212,176,0.14)",
                                          color: "#F0DCB8",
                                          border: "1px solid rgba(232,212,176,0.3)",
                                        }}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{item.desc}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[12px] text-white/45">
                        75+ products bundled.{" "}
                        <span className="text-white/65">Replaces $923/mo in SaaS subscriptions.</span>
                      </span>
                      <div className="flex items-center gap-5">
                        <Link
                          href="/domains"
                          className="group text-[12px] text-white/60 hover:text-[#E8D4B0] flex items-center gap-1.5 transition-colors"
                          onClick={() => setMegaOpen(false)}
                        >
                          Search domains
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

          {/* Right side: Auth + CTA */}
          <div className="hidden lg:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-3.5 py-2 text-[13px] text-white/70 hover:text-white rounded-full hover:bg-white/[0.04] transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3.5 py-2 text-[13px] text-[#E8D4B0]/70 hover:text-[#E8D4B0] rounded-full hover:bg-[#E8D4B0]/[0.06] transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-white/40 hover:text-white/70 rounded-full hover:bg-white/[0.04] transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-[13px] text-white/70 hover:text-white rounded-full transition-colors"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/builder"
              className="group inline-flex items-center gap-1.5 px-5 py-2.5 text-[13px] font-semibold rounded-full transition-all duration-500 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                color: "#0a1628",
                boxShadow: "0 10px 30px -12px rgba(232,212,176,0.45)",
              }}
            >
              <Rocket className="w-3.5 h-3.5 transition-transform group-hover:rotate-[-8deg]" />
              Start Building
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

      {/* Mobile Menu — full-screen cinematic overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden border-t border-white/[0.06] max-h-[85vh] overflow-y-auto"
          style={{
            background: "linear-gradient(180deg, rgba(5,5,8,0.98) 0%, rgba(10,10,15,0.98) 100%)",
            backdropFilter: "blur(24px)",
          }}
        >
          <div className="px-4 py-4 space-y-5">
            {PRODUCT_SECTIONS.map((section) => (
              <div key={section.label}>
                <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">{section.label}</h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-white/80 flex items-center gap-1.5">
                          {item.name}
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-stone-500/20 text-stone-300 font-semibold">{item.badge}</span>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-500 block">{item.desc}</span>
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
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block p-2.5 text-sm text-white/80 rounded-lg hover:bg-white/[0.05]">Dashboard</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)} className="block p-2.5 text-sm text-stone-400 rounded-lg hover:bg-stone-500/10">Admin Panel</Link>}
                </>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block p-2.5 text-sm text-white/80 rounded-lg hover:bg-white/[0.05]">Sign in</Link>
              )}
              <Link
                href="/builder"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-center text-sm font-semibold bg-stone-600 text-white rounded-lg"
              >
                Start Building
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
