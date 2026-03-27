"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, Globe, Video, Server, Layout, Search, ShoppingBag,
  Users, Code, BarChart3, Mail, FileText, Palette, Bot,
  ChevronDown, Menu, X, ArrowRight, LogOut, LayoutDashboard,
  Rocket, Shield, BookOpen, Sparkles,
} from "lucide-react";

// ── Product categories for mega menu ──

const PRODUCT_SECTIONS = [
  {
    label: "Build",
    items: [
      { name: "AI Website Builder", href: "/builder", icon: Zap, desc: "Build sites in 60 seconds", badge: "Core" },
      { name: "Generators", href: "/generators", icon: Sparkles, desc: "43 specialized AI generators" },
      { name: "Templates", href: "/starter-kits", icon: Layout, desc: "100+ ready-made templates" },
      { name: "Video Creator", href: "/video-creator", icon: Video, desc: "AI video production pipeline" },
    ],
  },
  {
    label: "Launch",
    items: [
      { name: "Hosting", href: "/hosting", icon: Server, desc: "Deploy to zoobicon.sh" },
      { name: "Domains", href: "/domains", icon: Globe, desc: "Search & register domains" },
      { name: "Domain Finder", href: "/domain-finder", icon: Search, desc: "AI domain name discovery" },
      { name: "SEO Dashboard", href: "/seo", icon: BarChart3, desc: "Optimize your rankings" },
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
    label: "Scale",
    items: [
      { name: "Agency Platform", href: "/agencies", icon: Shield, desc: "White-label for agencies" },
      { name: "API & Developers", href: "/developers", icon: Code, desc: "REST API & CLI tools" },
      { name: "AI Agents", href: "/agents", icon: Bot, desc: "Open-source agent framework" },
      { name: "Documentation", href: "/documentation", icon: BookOpen, desc: "Guides & API reference" },
    ],
  },
];

const TOP_NAV_LINKS = [
  { name: "Pricing", href: "/pricing" },
  { name: "Compare", href: "/compare" },
];

export default function SiteNavigation() {
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Close mega menu on route change
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Close mega menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a14]/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">Z</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight hidden sm:block">Zoobicon</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Products mega menu trigger */}
            <div ref={megaRef} className="relative">
              <button
                onClick={() => setMegaOpen(!megaOpen)}
                onMouseEnter={() => { clearTimeout(timeoutRef.current); setMegaOpen(true); }}
                onMouseLeave={() => { timeoutRef.current = setTimeout(() => setMegaOpen(false), 300); }}
                className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  megaOpen ? "text-white bg-white/[0.08]" : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                Products <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Mega Menu Panel */}
              {megaOpen && (
                <div
                  onMouseEnter={() => clearTimeout(timeoutRef.current)}
                  onMouseLeave={() => { timeoutRef.current = setTimeout(() => setMegaOpen(false), 300); }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[720px] bg-[#141420] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/50 p-6"
                >
                  <div className="grid grid-cols-4 gap-6">
                    {PRODUCT_SECTIONS.map((section) => (
                      <div key={section.label}>
                        <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-3">{section.label}</h3>
                        <div className="space-y-1">
                          {section.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.05] transition-colors group"
                              onClick={() => setMegaOpen(false)}
                            >
                              <item.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-sm text-white/80 group-hover:text-white font-medium flex items-center gap-1.5">
                                  {item.name}
                                  {item.badge && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">{item.badge}</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs text-slate-500">75+ tools replacing $923/mo in SaaS subscriptions</span>
                    <Link href="/generators" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      View all products <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Static links */}
            {TOP_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  pathname === link.href
                    ? "text-white bg-white/[0.08]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right side: Auth + CTA */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="px-3 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/[0.04] transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="px-3 py-2 text-sm text-indigo-400/60 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/[0.06] transition-colors">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="px-3 py-2 text-sm text-white/40 hover:text-white/60 rounded-lg transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="px-3 py-2 text-sm text-white/60 hover:text-white rounded-lg transition-colors">
                  Sign in
                </Link>
              </>
            )}
            <Link
              href="/builder"
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Rocket className="w-3.5 h-3.5" /> Start Building
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-white/60 hover:text-white rounded-lg"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a0a14] border-t border-white/[0.06] max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-6">
            {PRODUCT_SECTIONS.map((section) => (
              <div key={section.label}>
                <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">{section.label}</h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-white/80">{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-white/[0.06] space-y-2">
              {TOP_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block p-2.5 text-sm text-white/80 rounded-lg hover:bg-white/[0.05]"
                >
                  {link.name}
                </Link>
              ))}
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block p-2.5 text-sm text-white/80 rounded-lg hover:bg-white/[0.05]">Dashboard</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setMobileOpen(false)} className="block p-2.5 text-sm text-indigo-400 rounded-lg hover:bg-indigo-500/10">Admin</Link>}
                </>
              ) : (
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="block p-2.5 text-sm text-white/80 rounded-lg hover:bg-white/[0.05]">Sign in</Link>
              )}
              <Link
                href="/builder"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-center text-sm font-semibold bg-indigo-600 text-white rounded-lg"
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
