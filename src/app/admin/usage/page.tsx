"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import {
  BarChart3,
  Zap,
  Globe,
  HardDrive,
  Key,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Clock,
  LogOut,
  Settings,
  Shield,
  ChevronDown,
} from "lucide-react";

// --- Demo data generators ---

function generateDailyData(): { day: string; count: number }[] {
  const data: { day: string; count: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = 8 + Math.floor(Math.random() * 30);
    const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.5 : 1;
    data.push({
      day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: Math.floor(base * weekend),
    });
  }
  return data;
}

const API_KEYS_DEMO = [
  { prefix: "zbk_live_abc", label: "Production", requestsToday: 142, requestsMonth: 3840, rateLimit: 60, status: "active" as const },
  { prefix: "zbk_live_f9d", label: "Staging", requestsToday: 27, requestsMonth: 612, rateLimit: 60, status: "active" as const },
  { prefix: "zbk_live_x2k", label: "Legacy v1", requestsToday: 0, requestsMonth: 3, rateLimit: 10, status: "inactive" as const },
];

const ACTIVITY_TYPES = ["generate", "deploy", "edit"] as const;
const MODELS = ["claude-opus-4-6", "claude-sonnet-4-20250514", "gpt-4o", "gemini-2.5-pro"];
const STATUSES = ["success", "success", "success", "success", "error"] as const;

function generateActivity(): {
  id: number;
  timestamp: Date;
  type: (typeof ACTIVITY_TYPES)[number];
  status: "success" | "error";
  model: string;
  description: string;
}[] {
  const items = [];
  const now = new Date();
  for (let i = 0; i < 20; i++) {
    const ts = new Date(now.getTime() - i * (300000 + Math.random() * 600000));
    const type = ACTIVITY_TYPES[Math.floor(Math.random() * ACTIVITY_TYPES.length)];
    const model = MODELS[Math.floor(Math.random() * MODELS.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
    const descriptions: Record<string, string[]> = {
      generate: ["Landing page for SaaS startup", "Restaurant website", "Portfolio site", "E-commerce storefront", "Agency homepage"],
      deploy: ["saas-landing.zoobicon.sh", "best-pizza.zoobicon.sh", "my-portfolio.zoobicon.sh", "cool-shop.zoobicon.sh"],
      edit: ["Updated hero section", "Changed color scheme", "Added testimonials", "Fixed mobile layout"],
    };
    const descs = descriptions[type];
    items.push({
      id: i,
      timestamp: ts,
      type,
      status,
      model: type === "deploy" ? "-" : model,
      description: descs[Math.floor(Math.random() * descs.length)],
    });
  }
  return items;
}

// --- Component ---

export default function UsagePage() {
  const [userName, setUserName] = useState("User");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [dailyData] = useState(generateDailyData);
  const [activities] = useState(generateActivity);
  const [liveStats, setLiveStats] = useState<{
    totalGenerations: number;
    apiCalls: number;
    activeSites: number;
    storageUsedMB: number;
    creditsRemaining: number;
    creditsUsed: number;
    creditsTotal: number;
    plan: string;
  } | null>(null);

  useEffect(() => {
    try {
      const user = localStorage.getItem("zoobicon_user");
      if (user) {
        const parsed = JSON.parse(user);
        setUserName(parsed.name || "User");
      }
    } catch { /* ignore */ }

    // Attempt to fetch real stats from API, fall back to demo data
    fetch("/api/v1/status", {
      headers: { Authorization: "Bearer zbk_live_demo" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        const d = json.data;
        setLiveStats({
          totalGenerations: d.usage?.generations_count || 0,
          apiCalls: d.usage?.deployments_count || 0,
          activeSites: d.usage?.sites_count || 0,
          storageUsedMB: 0,
          creditsRemaining: d.plan === "enterprise" ? 9999 : d.plan === "pro" ? 500 : 50,
          creditsUsed: d.usage?.generations_count || 0,
          creditsTotal: d.plan === "enterprise" ? 10000 : d.plan === "pro" ? 1000 : 100,
          plan: d.plan || "free",
        });
      })
      .catch(() => {
        // Fallback demo data
        setLiveStats({
          totalGenerations: 1247,
          apiCalls: 3892,
          activeSites: 34,
          storageUsedMB: 287,
          creditsRemaining: 753,
          creditsUsed: 247,
          creditsTotal: 1000,
          plan: "pro",
        });
      });
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch { /* ignore */ }
    window.location.href = "/";
  };

  const maxBar = Math.max(...dailyData.map((d) => d.count), 1);
  const totalMonth = dailyData.reduce((s, d) => s + d.count, 0);
  const totalPrevMonth = Math.floor(totalMonth * 0.82);
  const trendPct = totalPrevMonth > 0 ? Math.round(((totalMonth - totalPrevMonth) / totalPrevMonth) * 100) : 0;
  const trendUp = trendPct >= 0;

  const stats = liveStats || {
    totalGenerations: totalMonth,
    apiCalls: 3892,
    activeSites: 34,
    storageUsedMB: 287,
    creditsRemaining: 753,
    creditsUsed: 247,
    creditsTotal: 1000,
    plan: "pro",
  };

  const creditPct = stats.creditsTotal > 0 ? Math.round((stats.creditsUsed / stats.creditsTotal) * 100) : 0;

  const planLimits: Record<string, { generations: string; apiRate: string; storage: string }> = {
    free: { generations: "100 / mo", apiRate: "10 req/min", storage: "500 MB" },
    pro: { generations: "1,000 / mo", apiRate: "60 req/min", storage: "5 GB" },
    enterprise: { generations: "10,000 / mo", apiRate: "600 req/min", storage: "50 GB" },
  };
  const currentLimits = planLimits[stats.plan] || planLimits.free;

  const formatRelative = (d: Date) => {
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diffMs / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
    }),
  };

  const overviewCards = [
    {
      label: "Total Generations",
      value: stats.totalGenerations.toLocaleString(),
      sub: `${trendUp ? "+" : ""}${trendPct}% vs last month`,
      trend: trendUp,
      icon: Zap,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "API Calls",
      value: stats.apiCalls.toLocaleString(),
      sub: "This billing period",
      trend: true,
      icon: BarChart3,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Active Sites",
      value: stats.activeSites.toLocaleString(),
      sub: "Currently deployed",
      trend: true,
      icon: Globe,
      iconColor: "text-violet-400",
      iconBg: "bg-violet-500/10",
    },
    {
      label: "Storage Used",
      value: `${stats.storageUsedMB} MB`,
      sub: `of ${currentLimits.storage}`,
      trend: null,
      icon: HardDrive,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#131520]">
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="border-b border-white/[0.08] bg-[#09090b]/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">Zoobicon</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg transition-colors">Dashboard</Link>
                <Link href="/admin" className="px-3 py-1.5 text-sm text-white/60 hover:text-white rounded-lg transition-colors">Admin</Link>
                <Link href="/admin/usage" className="px-3 py-1.5 text-sm font-medium text-white bg-white/[0.07] rounded-lg">Usage</Link>
              </div>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.07] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-white/60 hidden sm:block">{userName}</span>
                <ChevronDown className="w-3 h-3 text-white/50" />
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-white/[0.12] rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="py-1">
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-white/65 hover:text-white hover:bg-white/[0.07]">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </Link>
                      <Link href="/auth/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-white/65 hover:text-white hover:bg-white/[0.07]">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400/60 hover:text-red-400 hover:bg-white/[0.07]">
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <CreditCard className="w-6 h-6 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Usage &amp; Credits</h1>
          </div>
          <p className="text-white/50 text-sm">Monitor your platform usage, credit balance, and API activity.</p>
        </div>

        {/* ===== 1. Overview Cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {overviewCards.map((card, i) => (
            <motion.div
              key={card.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="rounded-xl border border-white/[0.08] bg-zinc-900/80 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                {card.trend !== null && (
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${card.trend ? "text-emerald-400" : "text-red-400"}`}>
                    {card.trend ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-white">{card.value}</div>
              <div className="text-xs text-white/40 mt-1">{card.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ===== 2. Generation History Chart ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="rounded-xl border border-white/[0.08] bg-zinc-900/80 p-6 mb-10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Daily Generations</h2>
              <p className="text-xs text-white/40">Last 30 days</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{totalMonth.toLocaleString()}</div>
              <div className={`text-xs font-semibold flex items-center gap-0.5 justify-end ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
                {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trendPct)}% vs prev
              </div>
            </div>
          </div>
          <div className="flex items-end gap-[3px] h-40">
            {dailyData.map((d, i) => {
              const heightPct = Math.max((d.count / maxBar) * 100, 4);
              return (
                <div key={i} className="flex-1 group relative flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full rounded-t bg-blue-600/80 hover:bg-blue-500 transition-colors cursor-default min-h-[3px]"
                    style={{ height: `${heightPct}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 border border-white/10 text-[10px] text-white px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {d.day}: {d.count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-white/30">
            <span>{dailyData[0]?.day}</span>
            <span>{dailyData[14]?.day}</span>
            <span>{dailyData[29]?.day}</span>
          </div>
        </motion.div>

        {/* ===== 3. Credit Balance ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="rounded-xl border border-white/[0.08] bg-zinc-900/80 p-6 mb-10"
        >
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Credit Balance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Big number */}
            <div className="flex flex-col items-center justify-center bg-zinc-800/50 rounded-xl p-6 border border-white/[0.06]">
              <div className="text-5xl font-black text-white mb-1">{stats.creditsRemaining.toLocaleString()}</div>
              <div className="text-sm text-white/40">credits remaining</div>
            </div>

            {/* Plan + limits */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  stats.plan === "enterprise"
                    ? "bg-amber-500/20 text-amber-400"
                    : stats.plan === "pro"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-white/10 text-white/60"
                }`}>
                  {stats.plan} Plan
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/50">Generations</span>
                  <span className="text-white font-medium">{currentLimits.generations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">API Rate</span>
                  <span className="text-white font-medium">{currentLimits.apiRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Storage</span>
                  <span className="text-white font-medium">{currentLimits.storage}</span>
                </div>
              </div>
            </div>

            {/* Progress + upgrade */}
            <div className="bg-zinc-800/50 rounded-xl p-6 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/50">Used this period</span>
                  <span className="text-white font-medium">{stats.creditsUsed.toLocaleString()} / {stats.creditsTotal.toLocaleString()}</span>
                </div>
                <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      creditPct > 90 ? "bg-red-500" : creditPct > 70 ? "bg-amber-500" : "bg-blue-600"
                    }`}
                    style={{ width: `${creditPct}%` }}
                  />
                </div>
                <div className="text-xs text-white/30 mt-1">{creditPct}% consumed</div>
              </div>
              <Link
                href="/pricing"
                className="mt-4 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors w-full"
              >
                <ArrowUpRight className="w-4 h-4" />
                Upgrade Plan
              </Link>
            </div>
          </div>
        </motion.div>

        {/* ===== 4. API Key Usage Table ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="rounded-xl border border-white/[0.08] bg-zinc-900/80 p-6 mb-10"
        >
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">API Key Usage</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Key</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Label</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Today</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">This Month</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Rate Limit</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {API_KEYS_DEMO.map((key) => (
                  <tr key={key.prefix} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-white/70">{key.prefix}...</td>
                    <td className="py-3 px-4 text-white/80">{key.label}</td>
                    <td className="py-3 px-4 text-right text-white font-medium">{key.requestsToday.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-white font-medium">{key.requestsMonth.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-white/60">{key.rateLimit} req/min</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        key.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-white/[0.06] text-white/40"
                      }`}>
                        {key.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ===== 5. Recent Activity Feed ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          className="rounded-xl border border-white/[0.08] bg-zinc-900/80 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Recent Activity</h2>
          </div>

          <div className="space-y-1">
            {activities.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                {/* Type badge */}
                <span className={`flex-shrink-0 w-20 text-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  item.type === "generate"
                    ? "bg-blue-500/15 text-blue-400"
                    : item.type === "deploy"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-violet-500/15 text-violet-400"
                }`}>
                  {item.type}
                </span>

                {/* Description */}
                <span className="flex-1 text-sm text-white/80 truncate">{item.description}</span>

                {/* Model */}
                <span className="hidden md:block text-xs text-white/30 font-mono w-36 text-right truncate">
                  {item.model}
                </span>

                {/* Status */}
                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${
                  item.status === "success" ? "bg-emerald-400" : "bg-red-400"
                }`} />

                {/* Timestamp */}
                <span className="flex-shrink-0 flex items-center gap-1 text-xs text-white/30 w-20 justify-end">
                  <Clock className="w-3 h-3" />
                  {formatRelative(item.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
