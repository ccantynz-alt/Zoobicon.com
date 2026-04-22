"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Zap,
  Users,
  Globe,
  Server,
  TrendingUp,
  RefreshCw,
  Mail,
  Shield,
  Activity,
  ChevronRight,
  ArrowUpRight,
  LayoutDashboard,
  LogOut,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserPlus,
  Rocket,
  BarChart3,
} from "lucide-react";

interface Analytics {
  stats: { totalUsers: number; totalProjects: number; totalSites: number; totalDeployments: number };
  recentUsers: Array<{ email: string; name: string; plan: string; created_at: string }>;
  recentProjects: Array<{ name: string; user_email: string; created_at: string }>;
  planDistribution: Array<{ plan: string; count: number }>;
  dbError?: boolean;
}

interface HealthCheck {
  status: string;
  checks: Record<string, { status: string; latency?: number; error?: string }>;
}

export default function MobileAdminDashboard() {
  // Auth is handled once by AdminShell (src/app/admin/AdminShell.tsx) — it
  // only renders children for authenticated admins. A duplicated check here
  // used to race against AdminShell and produce visible redirect flashes
  // ("Checking permissions…" → flash → dashboard → flash back) on slow
  // networks. Default to trusted-admin; AdminShell is the single gate.
  const [isAdmin] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [analyticsRes, healthRes] = await Promise.all([
        fetch("/api/admin/analytics").then(r => r.json()).catch(() => null),
        fetch("/api/health").then(r => r.json()).catch(() => null),
      ]);
      if (analyticsRes) setAnalytics(analyticsRes);
      if (healthRes) setHealth(healthRes);
      setLastRefresh(new Date());
    } catch {
      // Silently fail — dashboard still shows what it has
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (!isAdmin) return null;

  const stats = analytics?.stats;
  const overallHealth = health?.status === "healthy" ? "healthy" : health ? "degraded" : "unknown";

  return (
    <div className="pb-24 safe-area-inset">
      {/* Viewport meta for PWA-like experience */}
      <style>{`
        .safe-area-inset { padding-bottom: env(safe-area-inset-bottom, 24px); }
        @supports (padding-top: env(safe-area-inset-top)) {
          .safe-top { padding-top: calc(env(safe-area-inset-top, 0px) + 12px); }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">Zoobicon</h1>
              <p className="text-[10px] text-slate-400">Command Centre</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <Link href="/admin" className="p-2 rounded-lg bg-slate-50 active:bg-slate-100 transition-colors">
              <LayoutDashboard className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>
        {lastRefresh && (
          <div className="px-4 pb-2 text-[10px] text-slate-400">
            Updated {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-4">

          {/* Health Status Banner */}
          <div className={`rounded-2xl p-4 border ${
            overallHealth === "healthy"
              ? "bg-emerald-50 border-emerald-200"
              : overallHealth === "degraded"
              ? "bg-amber-50 border-amber-200"
              : "bg-slate-50 border-slate-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {overallHealth === "healthy" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : overallHealth === "degraded" ? (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                ) : (
                  <Activity className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${
                    overallHealth === "healthy" ? "text-emerald-700" :
                    overallHealth === "degraded" ? "text-amber-700" :
                    "text-slate-700"
                  }`}>
                    {overallHealth === "healthy" ? "All Systems Operational" :
                     overallHealth === "degraded" ? "Some Systems Degraded" :
                     "Status Unknown"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {health?.checks ? `${Object.keys(health.checks).length} services monitored` : "Checking..."}
                  </p>
                </div>
              </div>
              <Link href="/admin/health" className="p-1.5 rounded-lg active:bg-slate-100">
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {/* Service indicators */}
            {health?.checks && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {Object.entries(health.checks).map(([name, check]) => (
                  <span
                    key={name}
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      check.status === "healthy"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? 0} color="brand" />
            <StatCard icon={Rocket} label="Projects" value={stats?.totalProjects ?? 0} color="purple" />
            <StatCard icon={Globe} label="Live Sites" value={stats?.totalSites ?? 0} color="emerald" />
            <StatCard icon={Server} label="Deployments" value={stats?.totalDeployments ?? 0} color="cyan" />
          </div>

          {/* MRR Estimate */}
          {analytics?.planDistribution && analytics.planDistribution.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-slate-600">Plan Distribution</span>
              </div>
              <div className="space-y-2">
                {analytics.planDistribution.map((p) => (
                  <div key={p.plan} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 capitalize">{p.plan || "free"}</span>
                    <span className="text-sm font-mono text-indigo-600">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Signups */}
          {analytics?.recentUsers && analytics.recentUsers.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-700">Recent Signups</span>
                </div>
                <Link href="/admin" className="text-[10px] text-indigo-500 active:opacity-70">
                  View all <ArrowUpRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {analytics.recentUsers.slice(0, 5).map((user, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{user.name || "—"}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        user.plan === "pro" ? "bg-indigo-50 text-indigo-600" :
                        user.plan === "agency" ? "bg-purple-50 text-purple-600" :
                        user.plan === "creator" ? "bg-emerald-50 text-emerald-600" :
                        "bg-slate-100 text-slate-500"
                      }`}>{user.plan || "free"}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(user.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Projects */}
          {analytics?.recentProjects && analytics.recentProjects.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-slate-700">Recent Projects</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {analytics.recentProjects.slice(0, 5).map((proj, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{proj.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{proj.user_email}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 ml-3 shrink-0">{timeAgo(proj.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Quick Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              <QuickLink href="/admin" icon={LayoutDashboard} label="Full Admin Panel" />
              <QuickLink href="/admin/health" icon={Activity} label="System Health" />
              <QuickLink href="/admin/support" icon={Mail} label="Support Inbox" />
              <QuickLink href="/admin/intel" icon={Shield} label="Market Intel" />
              <QuickLink href="/admin/usage" icon={BarChart3} label="Usage & Billing" />
              <QuickLink href="/admin/operations" icon={Server} label="Operations" />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6">
            <p className="text-[10px] text-slate-400">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
            <button
              onClick={() => {
                try { localStorage.removeItem("zoobicon_user"); } catch {}
                window.location.href = "/auth/login";
              }}
              className="mt-3 text-xs text-slate-400 active:text-slate-600 flex items-center gap-1 mx-auto"
            >
              <LogOut className="w-3 h-3" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  const colorMap: Record<string, string> = {
    brand: "from-indigo-50 to-indigo-50/50 border-indigo-200",
    purple: "from-purple-50 to-purple-50/50 border-purple-200",
    emerald: "from-emerald-50 to-emerald-50/50 border-emerald-200",
    cyan: "from-cyan-50 to-cyan-50/50 border-cyan-200",
  };
  const iconMap: Record<string, string> = {
    brand: "text-indigo-500",
    purple: "text-purple-500",
    emerald: "text-emerald-500",
    cyan: "text-cyan-500",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} border p-4`}>
      <Icon className={`w-5 h-5 ${iconMap[color]} mb-2`} />
      <p className="text-2xl font-bold text-slate-800">{value.toLocaleString()}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between px-4 py-3.5 active:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-700">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-300" />
    </Link>
  );
}
