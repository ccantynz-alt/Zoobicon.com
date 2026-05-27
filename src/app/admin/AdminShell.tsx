"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Globe,
  Shield,
  CheckCircle,
  Puzzle,
  LogOut,
  Menu,
  X,
  Zap,
  Smartphone,
  Settings,
  Loader2,
  ArrowLeft,
} from "lucide-react";

// Rule 31 — post-Crontech pivot admin only covers what Zoobicon still owns:
// builder/video/domains/intel. Hosting, email, mailboxes, support tickets,
// usage analytics, eSIM, booking — all delegated to Crontech, sidebar items
// removed. Crontech admin panel covers those domains.
const SIDEBAR_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Mobile", href: "/admin/mobile", icon: Smartphone },
    ],
  },
  {
    label: "MONITORING",
    items: [
      { name: "Market Intel", href: "/admin/market-intel", icon: Globe },
      { name: "Competitive Intel", href: "/admin/intel", icon: Shield },
    ],
  },
  {
    label: "DOMAINS",
    items: [
      { name: "Domain Admin", href: "/admin/domains", icon: Globe },
      { name: "Register Domain", href: "/domains", icon: Globe },
    ],
  },
  {
    label: "BUILDS",
    items: [
      { name: "Builds", href: "/admin/builds", icon: Activity },
      { name: "Pre-Launch Checklist", href: "/admin/pre-launch", icon: CheckCircle },
    ],
  },
  {
    label: "PLATFORM",
    items: [
      { name: "Integrations", href: "/admin/integrations", icon: Puzzle },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  // Inline sign-in form state — replaces the old window.location.href = "/"
  // bounce. Pressing return on /admin used to escape the preview iframe and
  // dump the user on whatever the parent origin's root was (claude.ai when
  // viewed inside a Claude Code session). Rendering a form keeps navigation
  // local and shows the user why they can't get in.
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) {
        const user = JSON.parse(raw);
        if (user.role === "admin") {
          setUserName(user.name || user.email || "Admin");
          setIsAdmin(true);
        }
      }
    } catch {
      // Corrupt payload — fall through to the sign-in form.
    }
    setChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginSubmitting) return;
    setLoginError("");
    setLoginSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoginError(data.error || `Sign-in failed (HTTP ${res.status}).`);
        setLoginSubmitting(false);
        return;
      }
      try {
        localStorage.setItem("zoobicon_user", JSON.stringify(data.user));
      } catch {
        // Private mode / quota — surface it instead of silently failing.
        setLoginError("Could not store session. Check your browser's privacy settings.");
        setLoginSubmitting(false);
        return;
      }
      setUserName(data.user.name || data.user.email || "Admin");
      setIsAdmin(true);
      setLoginSubmitting(false);
    } catch {
      setLoginError("Network error. Check your connection and try again.");
      setLoginSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600 text-sm">Checking permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "var(--paper)", color: "var(--ink)" }}
      >
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl border p-7 shadow-sm"
            style={{
              background: "var(--paper-elevated)",
              borderColor: "var(--rule)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-5">
              <div
                className="relative w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--paper)",
                  border: "1.5px solid var(--gold)",
                  boxShadow: "0 2px 6px -2px rgba(140,107,37,0.18), inset 0 0 0 2.5px var(--paper)",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Playfair Display', 'Fraunces', ui-serif, Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 600,
                    fontSize: "17px",
                    lineHeight: 1,
                    color: "var(--ink)",
                  }}
                >
                  Z
                </span>
              </div>
              <div>
                <div
                  className="text-base font-semibold tracking-tight"
                  style={{ color: "var(--ink)" }}
                >
                  Zoobicon Admin
                </div>
                <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  Sign in to access the command centre
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--ink-muted)" }}
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@zoobicon.com"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none transition"
                  style={{
                    background: "var(--paper)",
                    borderColor: "var(--rule)",
                    color: "var(--ink)",
                  }}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--ink-muted)" }}
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none transition"
                  style={{
                    background: "var(--paper)",
                    borderColor: "var(--rule)",
                    color: "var(--ink)",
                  }}
                  required
                />
              </div>

              {loginError && (
                <div
                  className="rounded-lg border px-3 py-2 text-[12px]"
                  style={{
                    background: "rgba(184, 38, 38, 0.06)",
                    borderColor: "rgba(184, 38, 38, 0.25)",
                    color: "#9a1a1a",
                  }}
                >
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginSubmitting || !loginEmail || !loginPassword}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60"
                style={{ background: "var(--ink)", color: "var(--paper)" }}
              >
                {loginSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--rule)" }}>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium transition hover:opacity-70"
                style={{ color: "var(--ink-muted)" }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to home
              </Link>
            </div>
          </div>
          <p
            className="mt-4 text-[11px] text-center"
            style={{ color: "var(--ink-muted)" }}
          >
            Set <code style={{ color: "var(--ink)" }}>ADMIN_EMAIL</code> and{" "}
            <code style={{ color: "var(--ink)" }}>ADMIN_PASSWORD</code> in Vercel to
            enable sign-in.
          </p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("zoobicon_user");
    } catch {}
    window.location.href = "/";
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: "1px solid var(--rule)" }}>
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-[1.04]"
            style={{
              background: "var(--paper)",
              border: "1.5px solid var(--gold)",
              boxShadow: "0 2px 6px -2px rgba(140,107,37,0.18), inset 0 0 0 2.5px var(--paper)",
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', 'Fraunces', ui-serif, Georgia, serif",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "17px",
                lineHeight: 1,
                color: "var(--ink)",
                marginTop: "1px",
              }}
            >
              Z
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Playfair Display', 'Fraunces', ui-serif, Georgia, serif",
              fontWeight: 500,
              fontSize: "15px",
              letterSpacing: "0.005em",
              color: "var(--ink)",
            }}
          >
            Zoobicon
          </span>
        </Link>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-stone-700 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="text-xs uppercase tracking-wider text-stone-600 font-semibold px-2 mb-2">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-150 ${
                      active
                        ? "text-stone-800 bg-stone-100/80 font-medium shadow-sm"
                        : "text-stone-700 hover:text-stone-700 hover:bg-stone-100/80"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-stone-600" : ""}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-stone-200 px-3 py-3">
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          {/* Editorial medallion: cream surface + gold ring + ink initial.
              The previous stone gradient + text-white initial rendered as
              a solid black blob with no visible letter — the Rule 29
              override in globals.css forces .text-white to var(--ink). */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: "var(--paper)",
              border: "1.5px solid var(--gold)",
              color: "var(--ink)",
              boxShadow: "0 1px 3px rgba(140,107,37,0.12)",
            }}
          >
            {userName ? userName.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-stone-700 truncate">{userName || "Admin"}</div>
            <div className="text-xs text-stone-600">Administrator</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-stone-600 hover:text-stone-500 hover:bg-stone-50 transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex relative z-10">
      {/* Desktop sidebar — elevated cream so it separates from the bone page */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 z-40 shadow-sm"
        style={{
          background: "var(--paper-elevated)",
          borderRight: "1px solid var(--rule)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(10, 10, 11, 0.35)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-60 z-50 flex flex-col transform transition-transform duration-200 ease-in-out lg:hidden shadow-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--paper-elevated)",
          borderRight: "1px solid var(--rule)",
        }}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-3 p-1.5 rounded-lg text-stone-600 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-60 min-h-screen flex flex-col">
        {/* Mobile top bar — elevated cream */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:hidden shadow-sm"
          style={{
            background: "var(--paper-elevated)",
            borderBottom: "1px solid var(--rule)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-stone-600 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-stone-500" />
            <span className="text-sm font-semibold text-stone-700">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-stone-600 hover:text-stone-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
