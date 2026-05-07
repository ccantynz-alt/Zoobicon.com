"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Heart,
  Globe,
  Shield,
  HeadphonesIcon,
  BarChart3,
  CheckCircle,
  Puzzle,
  Mail,
  Inbox,
  LogOut,
  Menu,
  X,
  Zap,
  Smartphone,
  Wifi,
  Calendar,
  Settings,
} from "lucide-react";

const SIDEBAR_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Mobile", href: "/admin/mobile", icon: Smartphone },
      { name: "Operations", href: "/admin/operations", icon: Activity },
    ],
  },
  {
    label: "MONITORING",
    items: [
      { name: "Health", href: "/admin/health", icon: Heart },
      { name: "Market Intel", href: "/admin/market-intel", icon: Globe },
      { name: "Competitive Intel", href: "/admin/intel", icon: Shield },
    ],
  },
  {
    label: "PRODUCTS",
    items: [
      { name: "My Domains", href: "/my-domains", icon: Globe },
      { name: "Domain Admin", href: "/admin/domains", icon: Globe },
      { name: "Register Domain", href: "/domains", icon: Globe },
      { name: "eSIM", href: "/admin/esim", icon: Wifi },
      { name: "Booking", href: "/admin/booking", icon: Calendar },
    ],
  },
  {
    label: "USERS & SUPPORT",
    items: [
      { name: "Support Tickets", href: "/admin/support", icon: HeadphonesIcon },
      { name: "Usage & Analytics", href: "/admin/usage", icon: BarChart3 },
    ],
  },
  {
    label: "CONTENT",
    items: [
      { name: "Pre-Launch Checklist", href: "/admin/pre-launch", icon: CheckCircle },
      { name: "Integrations", href: "/admin/integrations", icon: Puzzle },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    label: "EMAIL",
    items: [
      { name: "Email Dashboard", href: "/admin/email", icon: Mail },
      { name: "Email Settings", href: "/admin/email-settings", icon: Mail },
      { name: "Mailboxes", href: "/admin/mailboxes", icon: Inbox },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (!raw) {
        window.location.href = "/auth/login";
        return;
      }
      const user = JSON.parse(raw);
      if (user.role !== "admin") {
        window.location.href = "/dashboard";
        return;
      }
      setUserName(user.name || user.email || "Admin");
      setIsAdmin(true);
    } catch {
      window.location.href = "/auth/login";
    }
    setChecking(false);
  }, []);

  // Don't render anything until auth check completes
  if (checking || !isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-600 text-sm">Checking permissions...</div>
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
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-stone-400 to-stone-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
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
