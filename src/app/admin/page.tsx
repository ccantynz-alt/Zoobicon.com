"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Zap, Shield, CheckCircle2, XCircle, AlertTriangle, LogOut,
  Settings, Users, Server, Globe, RefreshCw,
  Copy, Check, ExternalLink, BarChart3, Code2,
  Trash2, Edit3, Crown, ImagePlus, Workflow, Layout,
  TrendingUp, UserPlus, FolderOpen, Rocket,
} from "lucide-react";

type AdminTab = "overview" | "users" | "templates" | "analytics";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  subscription_status: string | null;
  created_at: string;
  projectCount: number;
}

interface TemplateRecord {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  tier: string;
  tags: string[];
  featured: boolean;
}

interface Analytics {
  stats: { totalUsers: number; totalProjects: number; totalSites: number; totalDeployments: number };
  recentUsers: Array<{ email: string; name: string; plan: string; created_at: string }>;
  recentProjects: Array<{ name: string; user_email: string; created_at: string }>;
  planDistribution: Array<{ plan: string; count: number }>;
}

export default function AdminPage() {
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [copied, setCopied] = useState("");
  const [apiTest, setApiTest] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [apiError, setApiError] = useState("");

  // Data states
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Edit states
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editPlan, setEditPlan] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (!raw) { window.location.href = "/auth/login"; return; }
      const user = JSON.parse(raw);
      if (user.role !== "admin") { window.location.href = "/dashboard"; return; }
      setUserName(user.name || user.email || "Admin");
      setIsAdmin(true);
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    window.location.href = "/";
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const testApiConnection = async () => {
    setApiTest("loading");
    setApiError("");
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }),
      });
      if (res.ok || res.status === 200) setApiTest("ok");
      else {
        const data = await res.json().catch(() => ({}));
        setApiError(data.error || `HTTP ${res.status}`);
        setApiTest("error");
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Network error");
      setApiTest("error");
    }
  };

  // ── Data fetchers ──

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch { setUsers([]); }
    setUsersLoading(false);
  }, []);

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch("/api/admin/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch { setTemplates([]); }
    setTemplatesLoading(false);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch { setAnalytics(null); }
    setAnalyticsLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "users") fetchUsers();
    if (activeTab === "templates") fetchTemplates();
    if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab, isAdmin, fetchUsers, fetchTemplates, fetchAnalytics]);

  // ── User actions ──

  const updateUser = async (id: string) => {
    await fetch(`/api/admin/users?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editRole || undefined, plan: editPlan || undefined }),
    });
    setEditingUser(null);
    fetchUsers();
  };

  const deleteUser = async (id: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    fetchUsers();
  };

  if (!isAdmin) return null;

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Zap className="w-4 h-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "users", label: "Users", icon: <Users className="w-4 h-4" /> },
    { id: "templates", label: "Templates", icon: <Layout className="w-4 h-4" /> },
  ];

  const envKeys = [
    { key: "ANTHROPIC_API_KEY", label: "Anthropic (Claude)", required: true },
    { key: "OPENAI_API_KEY", label: "OpenAI (DALL-E images)", required: false },
    { key: "STABILITY_API_KEY", label: "Stability AI (SDXL images)", required: false },
    { key: "UNSPLASH_ACCESS_KEY", label: "Unsplash (stock photos)", required: false },
    { key: "RESEND_API_KEY", label: "Resend (Email)", required: false },
    { key: "DATABASE_URL", label: "Neon Database", required: false },
    { key: "ADMIN_EMAIL", label: "Admin Email", required: true },
    { key: "ADMIN_PASSWORD", label: "Admin Password", required: true },
  ];

  const launchChecklist = [
    { done: true,  label: "AI website generation (Claude)" },
    { done: true,  label: "AI chat editor" },
    { done: true,  label: "Multi-agent pipeline (10 agents, 3 tiers)" },
    { done: true,  label: "AI image generation engine" },
    { done: true,  label: "Website cloning (URL-to-premium)" },
    { done: true,  label: "Support chat (Zoe)" },
    { done: true,  label: "Rate limiting on all API routes" },
    { done: true,  label: "Export HTML / GitHub / WordPress" },
    { done: true,  label: "Admin panel with user management" },
    { done: true,  label: "Template curation system" },
    { done: true,  label: "Password reset flow" },
    { done: true,  label: "Site hosting & deploy" },
    { done: false, label: "Stripe billing live" },
    { done: false, label: "OPENAI_API_KEY for DALL-E images" },
    { done: true, label: "Google / GitHub OAuth" },
    { done: false, label: "Production database (DATABASE_URL)" },
  ];

  const apiRoutes = [
    { method: "POST", path: "/api/generate/pipeline", desc: "10-agent pipeline (Standard/Premium/Ultra)", limit: "—" },
    { method: "POST", path: "/api/generate/stream", desc: "Stream AI website generation", limit: "10/min" },
    { method: "POST", path: "/api/generate/landing", desc: "Landing page generator (12 sections)", limit: "—" },
    { method: "POST", path: "/api/generate/saas", desc: "SaaS dashboard generator", limit: "—" },
    { method: "POST", path: "/api/generate/booking", desc: "Booking system generator", limit: "—" },
    { method: "POST", path: "/api/generate/dashboard", desc: "Data dashboard generator (SVG charts)", limit: "—" },
    { method: "POST", path: "/api/generate/portfolio", desc: "Portfolio & case study generator", limit: "—" },
    { method: "POST", path: "/api/generate/blog", desc: "Blog/magazine site generator", limit: "—" },
    { method: "POST", path: "/api/generate/restaurant", desc: "Restaurant site generator", limit: "—" },
    { method: "POST", path: "/api/generate/realestate", desc: "Real estate site generator", limit: "—" },
    { method: "POST", path: "/api/generate/marketplace", desc: "Marketplace platform generator", limit: "—" },
    { method: "POST", path: "/api/generate/event", desc: "Event/conference site generator", limit: "—" },
    { method: "POST", path: "/api/generate/directory", desc: "Business directory generator", limit: "—" },
    { method: "POST", path: "/api/generate/hrm", desc: "HR management system generator", limit: "—" },
    { method: "POST", path: "/api/generate/project-mgmt", desc: "Project management tool generator", limit: "—" },
    { method: "POST", path: "/api/generate/lms", desc: "Learning platform (LMS) generator", limit: "—" },
    { method: "POST", path: "/api/generate/inventory", desc: "Inventory management generator", limit: "—" },
    { method: "POST", path: "/api/generate/admin", desc: "Admin panel / CMS generator", limit: "—" },
    { method: "POST", path: "/api/generate/animations", desc: "Animation enhancement agent", limit: "—" },
    { method: "POST", path: "/api/generate/seo-markup", desc: "SEO markup injection agent", limit: "—" },
    { method: "POST", path: "/api/generate/dark-mode", desc: "Dark mode enhancement agent", limit: "—" },
    { method: "POST", path: "/api/generate/forms-backend", desc: "Forms backend enhancement agent", limit: "—" },
    { method: "POST", path: "/api/generate/integrations", desc: "Third-party integrations agent", limit: "—" },
    { method: "POST", path: "/api/generate/email-sequence", desc: "Email sequence generator", limit: "—" },
    { method: "POST", path: "/api/generate/pitch-deck", desc: "Pitch deck generator", limit: "—" },
    { method: "POST", path: "/api/generate/copy", desc: "Copywriter agent", limit: "—" },
    { method: "POST", path: "/api/generate/brand-kit", desc: "Brand kit / design system generator", limit: "—" },
    { method: "POST", path: "/api/generate/api-gen", desc: "REST API code generator", limit: "—" },
    { method: "POST", path: "/api/generate/chrome-ext", desc: "Chrome extension generator", limit: "—" },
    { method: "POST", path: "/api/generate/component-lib", desc: "Component library generator", limit: "—" },
    { method: "POST", path: "/api/generate/pwa", desc: "Progressive web app generator", limit: "—" },
    { method: "POST", path: "/api/generate/form-builder", desc: "Form builder generator", limit: "—" },
    { method: "POST", path: "/api/generate/style-guide", desc: "Style guide extractor", limit: "—" },
    { method: "POST", path: "/api/generate/report", desc: "Business report generator", limit: "—" },
    { method: "POST", path: "/api/generate/ai-images", desc: "AI image generation (DALL-E/Stability)", limit: "—" },
    { method: "POST", path: "/api/clone", desc: "Clone & upgrade any website", limit: "—" },
    { method: "POST", path: "/api/chat", desc: "Stream AI code editing", limit: "20/min" },
    { method: "POST", path: "/api/support", desc: "Stream Zoe support chat", limit: "30/min" },
    { method: "GET",  path: "/api/admin/users", desc: "User management", limit: "admin" },
    { method: "GET",  path: "/api/admin/analytics", desc: "Platform analytics", limit: "admin" },
    { method: "GET",  path: "/api/admin/templates", desc: "Template management", limit: "admin" },
    { method: "POST", path: "/api/hosting/deploy", desc: "Deploy site", limit: "—" },
  ];

  return (
    <div className="min-h-screen bg-[#0d1525]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0d1525]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-sm font-semibold text-white/70">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50 hidden sm:block">{userName}</span>
            <Link href="/builder" className="text-xs text-white/60 hover:text-white/60 px-3 py-1.5 rounded-lg border border-white/[0.10] transition-colors">
              Builder
            </Link>
            <Link href="/dashboard" className="text-xs text-white/60 hover:text-white/60 px-3 py-1.5 rounded-lg border border-white/[0.10] transition-colors">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-brand-500 text-brand-400"
                  : "border-transparent text-white/50 hover:text-white/65"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-8">

        {/* ═══════ OVERVIEW TAB ═══════ */}
        {activeTab === "overview" && (
          <>
            <div>
              <h1 className="text-2xl font-black tracking-tight mb-1">Admin Panel</h1>
              <p className="text-white/60 text-sm">System health, configuration, and launch checklist.</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Code2, label: "Builder", href: "/builder", desc: "AI website builder" },
                { icon: Globe, label: "View Site", href: "/", desc: "Public homepage", external: true },
                { icon: Settings, label: "Settings", href: "/auth/settings", desc: "Change password" },
                { icon: BarChart3, label: "Dashboard", href: "/dashboard", desc: "Project dashboard" },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  target={a.external ? "_blank" : undefined}
                  className="gradient-border p-4 rounded-xl card-hover flex items-center gap-3 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
                    <a.icon className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{a.label}</div>
                    <div className="text-[10px] text-white/50 truncate">{a.desc}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* New Feature Highlights */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Workflow, title: "10-Agent Pipeline", desc: "Strategist, Brand, Copywriter, Architect, Developer, Animator, SEO, Forms, Integrations, QA — 3 tiers: Standard, Premium, Ultra.", color: "brand" },
                { icon: ImagePlus, title: "AI Image Generation", desc: "DALL-E 3, Stability AI, and Unsplash integration. Replace placeholders with contextual AI images.", color: "accent-cyan" },
                { icon: Globe, title: "Website Cloner", desc: "Paste any URL to analyze, extract content, and rebuild as a premium modern website.", color: "accent-purple" },
              ].map((f) => (
                <div key={f.title} className="gradient-border rounded-2xl p-5">
                  <div className={`w-10 h-10 rounded-xl bg-${f.color === "brand" ? "brand-500" : f.color === "accent-cyan" ? "cyan-500" : "purple-500"}/10 flex items-center justify-center mb-3`}>
                    <f.icon className={`w-5 h-5 ${f.color === "brand" ? "text-brand-400" : f.color === "accent-cyan" ? "text-cyan-400" : "text-blue-400"}`} />
                  </div>
                  <h3 className="text-sm font-bold mb-1">{f.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* System Checks */}
              <div className="gradient-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold">System Status</h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-400/80">Operational</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "AI Generation Engine", detail: "Claude Sonnet + streaming SSE" },
                    { label: "Multi-Agent Pipeline", detail: "10 agents · 3 tiers · Parallel execution" },
                    { label: "AI Generators", detail: "32+ specialized generators across 6 categories" },
                    { label: "Dominat8 Brand", detail: "dominat8.io + dominat8.com white-label active" },
                    { label: "AI Image Engine", detail: "DALL-E 3 / Stability AI / Unsplash" },
                    { label: "Website Cloner", detail: "Fetch, analyze, rebuild premium" },
                    { label: "Rate Limiting", detail: "10 gen/min · 20 chat/min · 30 support/min" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">{c.label}</div>
                        <div className="text-xs text-white/50">{c.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-white/[0.10]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-white/60" />
                      <span className="text-sm font-medium">Anthropic API</span>
                    </div>
                    <button onClick={testApiConnection} disabled={apiTest === "loading"}
                      className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/60 border border-white/[0.10] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50">
                      <RefreshCw className={`w-3 h-3 ${apiTest === "loading" ? "animate-spin" : ""}`} />
                      Test
                    </button>
                  </div>
                  {apiTest === "ok" && <div className="flex items-center gap-2 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />Connection successful</div>}
                  {apiTest === "error" && <div className="flex items-center gap-2 text-xs text-red-400"><XCircle className="w-3.5 h-3.5" />{apiError}</div>}
                </div>
              </div>

              {/* Env Vars */}
              <div className="gradient-border rounded-2xl p-6">
                <h2 className="text-base font-bold mb-1">Environment Variables</h2>
                <p className="text-xs text-white/50 mb-5">Set in <span className="text-white/65">Vercel → Environment Variables</span></p>
                <div className="space-y-2.5">
                  {envKeys.map((e) => (
                    <div key={e.key} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-mono text-white/70 truncate">{e.key}</div>
                        <div className="text-[10px] text-white/45">{e.label}</div>
                      </div>
                      <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        e.required ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-white/[0.07] text-white/50 border border-white/[0.10]"
                      }`}>
                        {e.required ? "Required" : "Optional"}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-white/[0.10]">
                  <button
                    onClick={() => copyToClipboard(
                      "ANTHROPIC_API_KEY=\nOPENAI_API_KEY=\nSTABILITY_API_KEY=\nUNSPLASH_ACCESS_KEY=\nDATABASE_URL=\nADMIN_EMAIL=admin@zoobicon.com\nADMIN_PASSWORD=\nRESEND_API_KEY=\nNEXT_PUBLIC_APP_URL=https://zoobicon.com",
                      "envblock"
                    )}
                    className="flex items-center gap-2 text-xs text-white/60 hover:text-white/60 border border-white/[0.10] rounded-lg px-3 py-1.5 transition-colors"
                  >
                    {copied === "envblock" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied === "envblock" ? "Copied!" : "Copy .env.local template"}
                  </button>
                </div>
              </div>
            </div>

            {/* Launch Checklist */}
            <div className="gradient-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold">Launch Checklist</h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    {launchChecklist.filter((i) => i.done).length} of {launchChecklist.length} complete
                  </p>
                </div>
                <div className="text-2xl font-black gradient-text-static">
                  {Math.round((launchChecklist.filter((i) => i.done).length / launchChecklist.length) * 100)}%
                </div>
              </div>
              <div className="h-2 bg-white/[0.07] rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan rounded-full transition-all duration-500"
                  style={{ width: `${(launchChecklist.filter((i) => i.done).length / launchChecklist.length) * 100}%` }} />
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {launchChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    {item.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-white/[0.12] flex-shrink-0" />}
                    <span className={`text-sm ${item.done ? "text-white/60" : "text-white/60"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* API Reference */}
            <div className="gradient-border rounded-2xl p-6">
              <h2 className="text-base font-bold mb-5">API Reference</h2>
              <div className="space-y-2">
                {apiRoutes.map((r) => (
                  <div key={r.path} className="flex items-center gap-4 py-2 border-b border-white/[0.08] last:border-0">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded w-12 text-center flex-shrink-0 ${
                      r.method === "GET" ? "text-emerald-400 bg-emerald-500/10" : "text-brand-400 bg-brand-500/10"
                    }`}>{r.method}</span>
                    <code className="text-xs font-mono text-white/60 w-56 flex-shrink-0">{r.path}</code>
                    <span className="text-xs text-white/50 flex-1">{r.desc}</span>
                    <span className="text-[10px] text-white/40 flex-shrink-0">{r.limit}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ═══════ ANALYTICS TAB ═══════ */}
        {activeTab === "analytics" && (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black tracking-tight">Analytics</h1>
              <button onClick={fetchAnalytics} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/60 border border-white/[0.10] rounded-lg px-3 py-1.5 transition-colors">
                <RefreshCw className={`w-3 h-3 ${analyticsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: analytics?.stats.totalUsers || 0, icon: Users, color: "brand" },
                { label: "Projects", value: analytics?.stats.totalProjects || 0, icon: FolderOpen, color: "purple" },
                { label: "Sites Deployed", value: analytics?.stats.totalSites || 0, icon: Rocket, color: "cyan" },
                { label: "Deployments", value: analytics?.stats.totalDeployments || 0, icon: TrendingUp, color: "emerald" },
              ].map((s) => (
                <div key={s.label} className="gradient-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <s.icon className={`w-5 h-5 ${s.color === "brand" ? "text-brand-400" : s.color === "purple" ? "text-blue-400" : s.color === "cyan" ? "text-cyan-400" : "text-emerald-400"}`} />
                  </div>
                  <div className="text-3xl font-black">{s.value}</div>
                  <div className="text-xs text-white/50 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Plan Distribution */}
              <div className="gradient-border rounded-2xl p-6">
                <h2 className="text-base font-bold mb-4">Plan Distribution</h2>
                {analytics?.planDistribution && analytics.planDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.planDistribution.map((p) => (
                      <div key={p.plan} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/60 capitalize">{p.plan || "free"}</span>
                          <span className="text-white/50">{p.count} users</span>
                        </div>
                        <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-brand-500 to-accent-purple rounded-full"
                            style={{ width: `${Math.max(5, (p.count / (analytics.stats.totalUsers || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40">No user data available yet.</p>
                )}
              </div>

              {/* Recent signups */}
              <div className="gradient-border rounded-2xl p-6">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-brand-400" />
                  Recent Signups
                </h2>
                {analytics?.recentUsers && analytics.recentUsers.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.recentUsers.slice(0, 8).map((u, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.08] last:border-0">
                        <div>
                          <div className="text-xs font-medium">{u.name || u.email}</div>
                          <div className="text-[10px] text-white/40">{u.email}</div>
                        </div>
                        <div className="text-[10px] text-white/40">
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40">No users yet. They&apos;ll show up here once people sign up.</p>
                )}
              </div>
            </div>

            {/* Recent projects */}
            <div className="gradient-border rounded-2xl p-6">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-400" />
                Recent Projects
              </h2>
              {analytics?.recentProjects && analytics.recentProjects.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {analytics.recentProjects.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.05] border border-white/[0.08]">
                      <div>
                        <div className="text-xs font-medium">{p.name}</div>
                        <div className="text-[10px] text-white/40">{p.user_email}</div>
                      </div>
                      <div className="text-[10px] text-white/40">
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40">No projects created yet.</p>
              )}
            </div>
          </>
        )}

        {/* ═══════ USERS TAB ═══════ */}
        {activeTab === "users" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight">User Management</h1>
                <p className="text-white/60 text-sm mt-1">{users.length} registered users</p>
              </div>
              <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/60 border border-white/[0.10] rounded-lg px-3 py-1.5 transition-colors">
                <RefreshCw className={`w-3 h-3 ${usersLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {users.length > 0 ? (
              <div className="gradient-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.10]">
                        <th className="text-left text-[10px] uppercase tracking-wider text-white/50 px-4 py-3">User</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-white/50 px-4 py-3">Role</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-white/50 px-4 py-3">Plan</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-white/50 px-4 py-3">Projects</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-white/50 px-4 py-3">Joined</th>
                        <th className="text-right text-[10px] uppercase tracking-wider text-white/50 px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-white/[0.07] hover:bg-white/[0.05] transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">{user.name || "—"}</div>
                            <div className="text-[10px] text-white/50">{user.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            {editingUser === user.id ? (
                              <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                                className="bg-white/[0.09] border border-white/[0.1] rounded px-2 py-1 text-xs">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                user.role === "admin" ? "bg-brand-500/10 text-brand-400 border border-brand-500/20" : "bg-white/[0.07] text-white/60 border border-white/[0.10]"
                              }`}>
                                {user.role === "admin" && <Crown className="w-3 h-3 inline mr-1" />}
                                {user.role}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingUser === user.id ? (
                              <select value={editPlan} onChange={(e) => setEditPlan(e.target.value)}
                                className="bg-white/[0.09] border border-white/[0.1] rounded px-2 py-1 text-xs">
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="unlimited">Unlimited</option>
                              </select>
                            ) : (
                              <span className="text-xs text-white/65 capitalize">{user.plan || "free"}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-white/60">{user.projectCount}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-white/50">
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingUser === user.id ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => updateUser(user.id)}
                                  className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors">
                                  Save
                                </button>
                                <button onClick={() => setEditingUser(null)}
                                  className="text-xs text-white/50 hover:text-white/65 px-2 py-1 rounded border border-white/[0.10] transition-colors">
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => { setEditingUser(user.id); setEditRole(user.role); setEditPlan(user.plan); }}
                                  className="text-white/40 hover:text-white/65 p-1 transition-colors" title="Edit">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteUser(user.id, user.email)}
                                  className="text-white/40 hover:text-red-400 p-1 transition-colors" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="gradient-border rounded-2xl p-12 text-center">
                <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <h3 className="text-sm font-semibold mb-1">No users yet</h3>
                <p className="text-xs text-white/50">
                  {usersLoading ? "Loading..." : "Users will appear here once they sign up. Make sure DATABASE_URL is configured."}
                </p>
              </div>
            )}
          </>
        )}

        {/* ═══════ TEMPLATES TAB ═══════ */}
        {activeTab === "templates" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight">Template Gallery</h1>
                <p className="text-white/60 text-sm mt-1">{templates.length} curated templates</p>
              </div>
              <button onClick={fetchTemplates} className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/60 border border-white/[0.10] rounded-lg px-3 py-1.5 transition-colors">
                <RefreshCw className={`w-3 h-3 ${templatesLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="gradient-border rounded-2xl p-5 hover:bg-white/[0.05] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold">{t.name}</h3>
                      <span className="text-[10px] text-white/50">{t.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {t.featured && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Featured
                        </span>
                      )}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        t.tier === "premium"
                          ? "bg-brand-500/10 text-brand-400 border border-brand-500/20"
                          : "bg-white/[0.07] text-white/50 border border-white/[0.10]"
                      }`}>
                        {t.tier}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-white/50 mb-3 line-clamp-2">{t.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.tags.map((tag) => (
                      <span key={tag} className="text-[9px] text-white/40 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.08]">
                    <button
                      onClick={() => copyToClipboard(t.prompt, t.id)}
                      className="flex items-center gap-1.5 text-[10px] text-white/50 hover:text-white/60 transition-colors"
                    >
                      {copied === t.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied === t.id ? "Copied prompt!" : "Copy prompt"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {templates.length === 0 && !templatesLoading && (
              <div className="gradient-border rounded-2xl p-12 text-center">
                <Layout className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <h3 className="text-sm font-semibold mb-1">Loading templates...</h3>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
