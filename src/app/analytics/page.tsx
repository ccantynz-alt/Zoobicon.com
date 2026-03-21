"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap,
  BarChart3,
  TrendingUp,
  FileText,
  Plus,
  Globe,
  Search,
  ArrowRight,
  Clock,
  ChevronDown,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { getProjects, type SavedProject } from "@/lib/storage";

interface SEOEntry {
  url?: string;
  prompt?: string;
  score: number;
  date: string;
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [seoHistory, setSeoHistory] = useState<SEOEntry[]>([]);
  const [userName, setUserName] = useState("User");
  const [userPlan, setUserPlan] = useState("free");
  const [userRole, setUserRole] = useState<"user" | "admin">("user");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);

  useEffect(() => {
    let userEmail = "";
    try {
      const user = localStorage.getItem("zoobicon_user");
      if (user) {
        const parsed = JSON.parse(user);
        setUserName(parsed.name || "User");
        setUserPlan(parsed.plan || "free");
        setUserRole(parsed.role === "admin" ? "admin" : "user");
        userEmail = parsed.email || "";
      }
    } catch { /* ignore */ }

    // Load generation counter
    try {
      const count = localStorage.getItem("zoobicon_generation_count");
      if (count) setGenerationCount(parseInt(count, 10) || 0);
    } catch { /* ignore */ }

    // Load SEO history
    try {
      const seo = localStorage.getItem("zoobicon_seo_history");
      if (seo) setSeoHistory(JSON.parse(seo));
    } catch { /* ignore */ }

    // Load projects: try API first, fall back to localStorage
    if (userEmail) {
      fetch(`/api/projects?email=${encodeURIComponent(userEmail)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((p: Record<string, string>) => ({
              id: p.id,
              name: p.name,
              prompt: p.prompt || "",
              code: p.code || "",
              template: p.template,
              createdAt: new Date(p.created_at).getTime(),
              updatedAt: new Date(p.updated_at).getTime(),
            }));
            setProjects(mapped);
            // Sync generation count if it's lower than project count
            if (!localStorage.getItem("zoobicon_generation_count")) {
              setGenerationCount(mapped.length);
            }
          } else {
            loadLocal();
          }
        })
        .catch(() => loadLocal());
    } else {
      loadLocal();
    }

    function loadLocal() {
      const local = getProjects();
      setProjects(local);
      if (!localStorage.getItem("zoobicon_generation_count") && local.length > 0) {
        setGenerationCount(local.length);
      }
    }
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch { /* ignore */ }
    window.location.href = "/";
  };

  const totalCharacters = projects.reduce((sum, p) => sum + (p.code?.length || 0), 0);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const planLabel = userRole === "admin" ? "Admin (Unlimited)" : userPlan === "unlimited" || userPlan === "pro" ? "Pro" : "Free";

  // Sort projects by most recent first
  const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  // Max SEO score for bar chart scaling
  const maxSeo = seoHistory.length > 0 ? Math.max(...seoHistory.map((s) => s.score), 100) : 100;

  return (
    <div className="min-h-screen bg-[#111a2e] relative">
      <BackgroundEffects preset="technical" />
      {/* Top Nav */}
      <nav className="border-b border-white/[0.08] bg-[#111a2e]/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">Zoobicon</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <Link href="/builder" className="px-3 py-1.5 text-sm text-white/60 hover:text-white/60 rounded-lg transition-colors">
                  Builder
                </Link>
                <Link href="/dashboard" className="px-3 py-1.5 text-sm text-white/60 hover:text-white/60 rounded-lg transition-colors">
                  Dashboard
                </Link>
                <Link href="/analytics" className="px-3 py-1.5 text-sm font-medium text-white/80 bg-white/[0.07] rounded-lg">
                  Analytics
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/builder"
                className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Project</span>
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.07] transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-[10px] font-bold text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white/60 hidden sm:block">{userName}</span>
                  <ChevronDown className="w-3 h-3 text-white/50" />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-[#161f35] border border-white/[0.12] rounded-xl shadow-lg overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-white/[0.10]">
                        <div className="text-sm font-medium">{userName}</div>
                        <div className="text-xs text-white/50">{planLabel}</div>
                      </div>
                      <div className="py-1">
                        {userRole === "admin" && (
                          <Link href="/admin" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-brand-400/70 hover:text-brand-400 hover:bg-white/[0.07] transition-colors">
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <Link href="/auth/settings" className="w-full flex items-center gap-2 px-4 py-2 text-sm text-white/65 hover:text-white hover:bg-white/[0.07] transition-colors">
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400/60 hover:text-red-400 hover:bg-white/[0.07] transition-colors">
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <CursorGlowTracker />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-brand-400" />
            Analytics
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Usage stats and generation history from your account.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="rounded-xl border border-white/[0.10] bg-white/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-brand-400" />
              </div>
              <span className="text-xs text-white/60 font-medium">Total Projects</span>
            </div>
            <div className="text-3xl font-black tracking-tight">{projects.length}</div>
          </div>

          <div className="rounded-xl border border-white/[0.10] bg-white/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent-cyan" />
              </div>
              <span className="text-xs text-white/60 font-medium">Generations</span>
            </div>
            <div className="text-3xl font-black tracking-tight">{generationCount || projects.length}</div>
          </div>

          <div className="rounded-xl border border-white/[0.10] bg-white/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-accent-purple" />
              </div>
              <span className="text-xs text-white/60 font-medium">Characters Generated</span>
            </div>
            <div className="text-3xl font-black tracking-tight">{totalCharacters.toLocaleString()}</div>
          </div>

          <div className="rounded-xl border border-white/[0.10] bg-white/[0.05] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-white/60 font-medium">Current Plan</span>
            </div>
            <div className="text-3xl font-black tracking-tight">{planLabel}</div>
          </div>
        </div>

        {/* Two-column layout: Generation History + Sidebar */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Generation History - takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-white/[0.10] bg-white/[0.05] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.10] flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/60" />
                  Generation History
                </h2>
                <span className="text-xs text-white/50">{sortedProjects.length} total</span>
              </div>

              {sortedProjects.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-10 h-10 text-white/50 mx-auto mb-3" />
                  <p className="text-sm text-white/50 mb-4">No generations yet. Create your first project to see history here.</p>
                  <Link href="/builder" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
                    <Plus className="w-4 h-4" /> Go to Builder
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {sortedProjects.slice(0, 20).map((project) => (
                    <Link
                      key={project.id}
                      href={`/builder?project=${project.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.05] transition-colors group"
                    >
                      {/* Status dot */}
                      <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Completed" />

                      {/* Prompt + Name */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate group-hover:text-white transition-colors">
                          {project.name}
                        </div>
                        <div className="text-xs text-white/50 truncate mt-0.5">
                          {project.prompt || "No prompt recorded"}
                        </div>
                      </div>

                      {/* Character count */}
                      <div className="text-xs text-white/50 flex-shrink-0 hidden sm:block">
                        {(project.code?.length || 0).toLocaleString()} chars
                      </div>

                      {/* Template/tier */}
                      <div className="flex-shrink-0 hidden md:block">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.07] text-white/50 border border-white/[0.10]">
                          {project.template || "custom"}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-white/50 flex-shrink-0 w-16 text-right">
                        {formatDate(project.updatedAt)}
                      </div>

                      <ArrowRight className="w-3 h-3 text-white/50 group-hover:text-white/50 transition-colors flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}

              {sortedProjects.length > 20 && (
                <div className="px-5 py-3 border-t border-white/[0.10] text-center">
                  <Link href="/dashboard" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    View all {sortedProjects.length} projects in Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SEO Score Trends */}
            <div className="rounded-xl border border-white/[0.10] bg-white/[0.05] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.10]">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Search className="w-4 h-4 text-white/60" />
                  SEO Score Trends
                </h2>
              </div>

              {seoHistory.length === 0 ? (
                <div className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 text-white/50 mx-auto mb-2" />
                  <p className="text-xs text-white/50 mb-3">No SEO analyses yet.</p>
                  <Link href="/products/seo-agent" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                    Run an SEO audit
                  </Link>
                </div>
              ) : (
                <div className="p-5 space-y-3">
                  {seoHistory.slice(-8).map((entry, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-[10px] text-white/50 w-16 truncate flex-shrink-0">
                        {entry.url || entry.prompt || `Audit ${i + 1}`}
                      </div>
                      <div className="flex-1 h-5 bg-white/[0.07] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            entry.score >= 80
                              ? "bg-emerald-500/60"
                              : entry.score >= 50
                              ? "bg-amber-500/60"
                              : "bg-red-500/60"
                          }`}
                          style={{ width: `${(entry.score / maxSeo) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white/60 w-8 text-right">{entry.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-white/[0.10] bg-white/[0.05] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.10]">
                <h2 className="text-sm font-bold">Quick Actions</h2>
              </div>
              <div className="p-3 space-y-1">
                <Link
                  href="/builder"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.07] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium group-hover:text-white transition-colors">New Website</div>
                    <div className="text-[10px] text-white/50">AI-powered builder</div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-white/50" />
                </Link>

                <Link
                  href="/products/seo-agent"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.07] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-emerald-600 flex items-center justify-center">
                    <Search className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium group-hover:text-white transition-colors">SEO Audit</div>
                    <div className="text-[10px] text-white/50">Analyze site performance</div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-white/50" />
                </Link>

                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.07] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-pink-600 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium group-hover:text-white transition-colors">View Dashboard</div>
                    <div className="text-[10px] text-white/50">Manage all projects</div>
                  </div>
                  <ArrowRight className="w-3 h-3 text-white/50" />
                </Link>
              </div>
            </div>

            {/* Project Size Distribution */}
            {projects.length > 0 && (
              <div className="rounded-xl border border-white/[0.10] bg-white/[0.05] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.10]">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-white/60" />
                    Project Sizes
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  {sortedProjects.slice(0, 6).map((project) => {
                    const maxChars = Math.max(...projects.map((p) => p.code?.length || 0), 1);
                    const pct = ((project.code?.length || 0) / maxChars) * 100;
                    return (
                      <div key={project.id} className="flex items-center gap-3">
                        <div className="text-[10px] text-white/50 w-20 truncate flex-shrink-0" title={project.name}>
                          {project.name}
                        </div>
                        <div className="flex-1 h-4 bg-white/[0.07] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-brand-500/40"
                            style={{ width: `${Math.max(pct, 3)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-white/50 w-12 text-right">
                          {((project.code?.length || 0) / 1000).toFixed(1)}k
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
