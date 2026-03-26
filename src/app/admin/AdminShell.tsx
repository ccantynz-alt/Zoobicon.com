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
} from "lucide-react";

const SIDEBAR_SECTIONS = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
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
    ],
  },
  {
    label: "EMAIL",
    items: [
      { name: "Email Settings", href: "/admin/email-settings", icon: Mail },
      { name: "Mailboxes", href: "/admin/mailboxes", icon: Inbox },
    ],
  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) {
        const user = JSON.parse(raw);
        setUserName(user.name || user.email || "Admin");
      }
    } catch {}
  }, []);

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
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white/90">ZOOBICON</span>
        </Link>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold px-2 mb-2">
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
                        ? "text-white bg-indigo-600/20 font-medium"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]"
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 border border-indigo-500/20">
            {userName ? userName.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-white/75 truncate">{userName || "Admin"}</div>
            <div className="text-[10px] text-slate-500">Administrator</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#131520] text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-[#0c0e1a] border-r border-white/[0.06] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-60 bg-[#0c0e1a] border-r border-white/[0.06] z-50 flex flex-col transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:pl-60 min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 border-b border-white/[0.06] bg-[#131520]/80 backdrop-blur-xl lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white/80">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
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
