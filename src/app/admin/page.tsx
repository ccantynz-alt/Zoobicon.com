"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  CheckCircle2,
  XCircle,
  Settings,
  Users,
  Server,
  Globe,
  RefreshCw,
  Copy,
  Check,
  BarChart3,
  Code2,
  Trash2,
  Edit3,
  Crown,
  ImagePlus,
  Workflow,
  Layout,
  TrendingUp,
  UserPlus,
  FolderOpen,
  Rocket,
  Mail,
  Inbox,
  HeadphonesIcon,
  Activity,
  Database,
  Cpu,
  Wifi,
  ArrowUpRight,
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
  // userName removed — now displayed by AdminShell sidebar
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
      setIsAdmin(true);
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

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

  const envKeys: { key: string; label: string; required: boolean; group: string }[] = [
    // Core AI
    { key: "ANTHROPIC_API_KEY", label: "Anthropic (Claude) — powers the AI pipeline", required: true, group: "Core AI" },
    { key: "OPENAI_API_KEY", label: "OpenAI (GPT-4o, DALL-E images)", required: false, group: "Core AI" },
    { key: "GOOGLE_AI_API_KEY", label: "Google (Gemini 2.5 Pro/Flash)", required: false, group: "Core AI" },
    // Images
    { key: "STABILITY_API_KEY", label: "Stability AI (SDXL images)", required: false, group: "Images" },
    { key: "UNSPLASH_ACCESS_KEY", label: "Unsplash (stock photos)", required: false, group: "Images" },
    // Database & Auth
    { key: "DATABASE_URL", label: "Neon serverless Postgres", required: true, group: "Database & Auth" },
    { key: "ADMIN_EMAIL", label: "Admin login email", required: true, group: "Database & Auth" },
    { key: "ADMIN_PASSWORD", label: "Admin login password", required: true, group: "Database & Auth" },
    { key: "RESET_TOKEN_SECRET", label: "JWT/reset token signing secret", required: false, group: "Database & Auth" },
    // OAuth
    { key: "GOOGLE_CLIENT_ID", label: "Google OAuth client ID", required: false, group: "OAuth" },
    { key: "GOOGLE_CLIENT_SECRET", label: "Google OAuth client secret", required: false, group: "OAuth" },
    { key: "GITHUB_OAUTH_CLIENT_ID", label: "GitHub OAuth client ID", required: false, group: "OAuth" },
    { key: "GITHUB_OAUTH_CLIENT_SECRET", label: "GitHub OAuth client secret", required: false, group: "OAuth" },
    // Payments
    { key: "STRIPE_SECRET_KEY", label: "Stripe secret key", required: false, group: "Payments" },
    { key: "STRIPE_CREATOR_PRICE_ID", label: "Stripe Creator plan price ID ($19)", required: false, group: "Payments" },
    { key: "STRIPE_PRO_PRICE_ID", label: "Stripe Pro plan price ID ($49)", required: false, group: "Payments" },
    { key: "STRIPE_AGENCY_PRICE_ID", label: "Stripe Agency plan price ID ($99)", required: false, group: "Payments" },
    { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook signing secret", required: false, group: "Payments" },
    // Email
    { key: "MAILGUN_API_KEY", label: "Mailgun API key", required: false, group: "Email" },
    { key: "MAILGUN_DOMAIN", label: "Mailgun sending domain", required: false, group: "Email" },
    { key: "MAILGUN_WEBHOOK_SIGNING_KEY", label: "Mailgun webhook verification", required: false, group: "Email" },
    { key: "ADMIN_NOTIFICATION_EMAIL", label: "Where to send admin notifications", required: false, group: "Email" },
    // Infrastructure
    { key: "NEXT_PUBLIC_APP_URL", label: "Public app URL (emails, Stripe redirects)", required: false, group: "Infrastructure" },
    { key: "CLOUDFLARE_API_TOKEN", label: "Cloudflare API token (DNS/SSL/CDN)", required: false, group: "Infrastructure" },
    { key: "CLOUDFLARE_ZONE_ID", label: "Cloudflare zone ID", required: false, group: "Infrastructure" },
    { key: "CLOUDFLARE_ACCOUNT_ID", label: "Cloudflare account ID", required: false, group: "Infrastructure" },
    // Integrations
    { key: "GITHUB_TOKEN", label: "GitHub token (import feature)", required: false, group: "Integrations" },
    { key: "SLACK_BOT_TOKEN", label: "Hash bot token", required: false, group: "Integrations" },
    { key: "SLACK_SIGNING_SECRET", label: "Hash signing secret", required: false, group: "Integrations" },
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
    { method: "POST", path: "/api/generate/react", desc: "Stream React component generation (SSE)", limit: "10/min" },
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
    { method: "POST", path: "/api/generate/chrome-ext", desc: "Globe2 extension generator", limit: "—" },
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
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Command Center</h1>
          <p className="text-sm text-slate-400 mt-1">System health, configuration, and platform management</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/builder" className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl bg-white/60 border border-slate-200 hover:border-stone-300 hover:bg-white/80 backdrop-blur-sm transition-all shadow-sm">
            Builder
          </Link>
          <Link href="/dashboard" className="text-xs text-white px-3 py-1.5 rounded-xl bg-gradient-to-r from-stone-500 to-stone-600 hover:from-stone-400 hover:to-stone-500 shadow-md shadow-stone-500/20 transition-all">
            Dashboard
          </Link>
        </div>
      </div>

      {/* ── Content Tabs ── */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-stone-500 text-stone-700"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {activeTab === "overview" && (
        <>
            {/* ── Quick Actions ── */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-stone-500" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { icon: Mail, label: "Email Inbox", href: "/admin/email", desc: "Read & manage email", gradient: "from-stone-400 to-stone-400" },
                  { icon: Inbox, label: "Mailboxes", href: "/admin/mailboxes", desc: "Manage mailboxes & routing", gradient: "from-stone-400 to-stone-400" },
                  { icon: Settings, label: "Email Settings", href: "/admin/email-settings", desc: "Configure admin email", gradient: "from-stone-400 to-stone-400" },
                  { icon: HeadphonesIcon, label: "Support", href: "/admin/support", desc: "Support tickets & knowledge", gradient: "from-stone-400 to-stone-400" },
                  { icon: Rocket, label: "Pre-Launch", href: "/admin/pre-launch", desc: "Launch checklist & readiness", gradient: "from-stone-400 to-stone-500" },
                  { icon: Code2, label: "Builder", href: "/builder", desc: "AI website builder", gradient: "from-stone-400 to-stone-400" },
                  { icon: Globe, label: "View Site", href: "/", desc: "Public homepage", gradient: "from-stone-400 to-stone-400", external: true },
                  { icon: Settings, label: "Settings", href: "/auth/settings", desc: "Account settings", gradient: "from-slate-400 to-zinc-400" },
                  { icon: BarChart3, label: "Dashboard", href: "/dashboard", desc: "Project dashboard", gradient: "from-stone-500 to-stone-600" },
                ].map((a, i) => (
                  <motion.div
                    key={a.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={a.href}
                      target={(a as { external?: boolean }).external ? "_blank" : undefined}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 hover:border-stone-300 bg-white/70 hover:bg-white/90 backdrop-blur-xl p-5 flex items-start gap-4 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-stone-100/50 hover:scale-[1.02]"
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                        <a.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate text-slate-700 group-hover:text-slate-900 transition-colors">{a.label}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{a.desc}</div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-stone-500 absolute top-4 right-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Feature Highlights ── */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Workflow, title: "10-Agent Pipeline", desc: "Strategist, Brand, Copywriter, Architect, Developer, Animator, SEO, Forms, Integrations, QA — 3 tiers.", iconGradient: "from-stone-400 to-stone-500" },
                { icon: ImagePlus, title: "AI Image Generation", desc: "DALL-E 3, Stability AI, and Unsplash integration. Contextual AI images.", iconGradient: "from-stone-400 to-stone-500" },
                { icon: Globe, title: "Website Cloner", desc: "Paste any URL to analyze, extract content, and rebuild as a premium site.", iconGradient: "from-stone-400 to-stone-500" },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="rounded-2xl p-6 bg-white/60 border border-slate-200/80 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-stone-100/30 hover:border-stone-200 hover:scale-[1.02] transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.iconGradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5 text-slate-700">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* System Checks */}
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-stone-200 bg-white/70 backdrop-blur-xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold flex items-center gap-2 text-slate-700">
                    <Cpu className="w-4 h-4 text-stone-500" />
                    System Status
                  </h2>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-50 border border-stone-200">
                    <div className="w-2 h-2 rounded-full bg-stone-500 animate-pulse shadow-lg shadow-stone-400/50" />
                    <span className="text-xs font-semibold text-stone-600">All Systems Go</span>
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
                    <div key={c.label} className="flex items-start gap-3 py-1">
                      <CheckCircle2 className="w-4 h-4 text-stone-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-slate-700">{c.label}</div>
                        <div className="text-xs text-slate-400">{c.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-stone-500" />
                      <span className="text-sm font-medium text-slate-700">Anthropic API</span>
                    </div>
                    <button onClick={testApiConnection} disabled={apiTest === "loading"}
                      className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-700 border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 rounded-xl px-3 py-1.5 transition-all disabled:opacity-50 shadow-sm">
                      <RefreshCw className={`w-3 h-3 ${apiTest === "loading" ? "animate-spin" : ""}`} />
                      Test Connection
                    </button>
                  </div>
                  {apiTest === "ok" && <div className="flex items-center gap-2 text-xs text-stone-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Connection successful</div>}
                  {apiTest === "error" && <div className="flex items-center gap-2 text-xs text-stone-500 font-medium"><XCircle className="w-3.5 h-3.5" />{apiError}</div>}
                </div>
              </motion.div>

              {/* Env Vars */}
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xl p-6 shadow-sm"
              >
                <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-slate-700">
                  <Database className="w-4 h-4 text-stone-500" />
                  Environment Variables
                </h2>
                <p className="text-xs text-slate-400 mb-5">Set in <span className="text-stone-600 font-medium">Vercel → Environment Variables</span> · {envKeys.length} total</p>
                <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                  {(() => {
                    let lastGroup = "";
                    return envKeys.map((e) => {
                      const showGroup = e.group !== lastGroup;
                      lastGroup = e.group;
                      return (
                        <div key={e.key}>
                          {showGroup && (
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-600 mt-3 mb-1.5 first:mt-0">{e.group}</div>
                          )}
                          <div className="flex items-center justify-between gap-3 py-1.5">
                            <div className="min-w-0">
                              <div className="text-xs font-mono text-slate-600 truncate">{e.key}</div>
                              <div className="text-[10px] text-slate-400">{e.label}</div>
                            </div>
                            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                              e.required
                                ? "bg-stone-50 text-stone-700 border border-stone-200"
                                : "bg-slate-50 text-slate-400 border border-slate-200"
                            }`}>
                              {e.required ? "Required" : "Optional"}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <button
                    onClick={() => copyToClipboard(
                      "# Core AI\nANTHROPIC_API_KEY=\nOPENAI_API_KEY=\nGOOGLE_AI_API_KEY=\n\n# Images\nSTABILITY_API_KEY=\nUNSPLASH_ACCESS_KEY=\n\n# Database & Auth\nDATABASE_URL=\nADMIN_EMAIL=admin@zoobicon.com\nADMIN_PASSWORD=\nRESET_TOKEN_SECRET=\n\n# OAuth\nGOOGLE_CLIENT_ID=\nGOOGLE_CLIENT_SECRET=\nGITHUB_OAUTH_CLIENT_ID=\nGITHUB_OAUTH_CLIENT_SECRET=\n\n# Payments (Stripe)\nSTRIPE_SECRET_KEY=\nSTRIPE_CREATOR_PRICE_ID=\nSTRIPE_PRO_PRICE_ID=\nSTRIPE_AGENCY_PRICE_ID=\nSTRIPE_WEBHOOK_SECRET=\n\n# Email (Mailgun)\nMAILGUN_API_KEY=\nMAILGUN_DOMAIN=zoobicon.com\nMAILGUN_WEBHOOK_SIGNING_KEY=\nADMIN_NOTIFICATION_EMAIL=\n\n# Infrastructure\nNEXT_PUBLIC_APP_URL=https://zoobicon.com\nCLOUDFLARE_API_TOKEN=\nCLOUDFLARE_ZONE_ID=\nCLOUDFLARE_ACCOUNT_ID=\n\n# Integrations\nGITHUB_TOKEN=\nSLACK_BOT_TOKEN=\nSLACK_SIGNING_SECRET=",
                      "envblock"
                    )}
                    className="flex items-center gap-2 text-xs text-stone-600 hover:text-stone-700 border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 rounded-xl px-4 py-2 transition-all shadow-sm"
                  >
                    {copied === "envblock" ? <Check className="w-3.5 h-3.5 text-stone-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === "envblock" ? "Copied!" : "Copy .env.local template"}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Launch Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-stone-200 bg-gradient-to-br from-white/80 via-stone-50/30 to-white/60 p-6 backdrop-blur-xl shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2 text-slate-700">
                    <Rocket className="w-4 h-4 text-stone-500" />
                    Launch Checklist
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {launchChecklist.filter((i) => i.done).length} of {launchChecklist.length} complete
                  </p>
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-stone-500 via-stone-600 to-stone-500 bg-clip-text text-transparent">
                  {Math.round((launchChecklist.filter((i) => i.done).length / launchChecklist.length) * 100)}%
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-stone-400 via-stone-500 to-stone-600 rounded-full transition-all duration-700 shadow-lg shadow-stone-400/30"
                  style={{ width: `${(launchChecklist.filter((i) => i.done).length / launchChecklist.length) * 100}%` }} />
              </div>
              <div className="grid md:grid-cols-2 gap-2.5">
                {launchChecklist.map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 py-2 px-3 rounded-xl ${item.done ? "bg-stone-50/80" : "bg-slate-50/60"}`}>
                    {item.done
                      ? <CheckCircle2 className="w-4 h-4 text-stone-500 flex-shrink-0" />
                      : <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
                    }
                    <span className={`text-sm ${item.done ? "text-slate-600" : "text-slate-400"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* API Reference */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-xl p-6 shadow-sm"
            >
              <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-slate-700">
                <Server className="w-4 h-4 text-stone-500" />
                API Reference
              </h2>
              <div className="space-y-1.5">
                {apiRoutes.map((r) => (
                  <div key={r.path} className="flex items-center gap-4 py-2.5 px-3 rounded-xl border-b border-slate-100 last:border-0 hover:bg-stone-50/40 transition-colors">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg w-14 text-center flex-shrink-0 ${
                      r.method === "GET"
                        ? "text-stone-600 bg-stone-50 border border-stone-200"
                        : "text-stone-700 bg-stone-50 border border-stone-200"
                    }`}>{r.method}</span>
                    <code className="text-xs font-mono text-slate-500 w-60 flex-shrink-0">{r.path}</code>
                    <span className="text-xs text-slate-400 flex-1">{r.desc}</span>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 font-medium">{r.limit}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* ═══════ ANALYTICS TAB ═══════ */}
        {activeTab === "analytics" && (
          <>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black tracking-tight text-slate-800">Analytics</h1>
              <button onClick={fetchAnalytics} className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-700 border border-stone-200 bg-stone-50 hover:bg-stone-100 rounded-xl px-3 py-1.5 transition-all shadow-sm">
                <RefreshCw className={`w-3 h-3 ${analyticsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: analytics?.stats.totalUsers || 0, icon: Users, iconGradient: "from-stone-400 to-stone-500" },
                { label: "Projects", value: analytics?.stats.totalProjects || 0, icon: FolderOpen, iconGradient: "from-stone-400 to-stone-500" },
                { label: "Sites Deployed", value: analytics?.stats.totalSites || 0, icon: Rocket, iconGradient: "from-stone-400 to-stone-500" },
                { label: "Deployments", value: analytics?.stats.totalDeployments || 0, icon: TrendingUp, iconGradient: "from-stone-400 to-stone-500" },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl p-5 bg-white/70 border border-slate-200/80 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-stone-100/30 hover:scale-[1.03] transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.iconGradient} flex items-center justify-center shadow-lg`}>
                      <s.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-800">{s.value}</div>
                  <div className="text-xs text-slate-400 mt-1 font-medium">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Plan Distribution */}
              <div className="rounded-2xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-700">
                  <Crown className="w-4 h-4 text-stone-500" />
                  Plan Distribution
                </h2>
                {analytics?.planDistribution && analytics.planDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.planDistribution.map((p) => (
                      <div key={p.plan} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 capitalize font-medium">{p.plan || "free"}</span>
                          <span className="text-slate-400">{p.count} users</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-stone-400 to-stone-500 rounded-full shadow-sm"
                            style={{ width: `${Math.max(5, (p.count / (analytics.stats.totalUsers || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No user data available yet.</p>
                )}
              </div>

              {/* Recent signups */}
              <div className="rounded-2xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-700">
                  <UserPlus className="w-4 h-4 text-stone-500" />
                  Recent Signups
                </h2>
                {analytics?.recentUsers && analytics.recentUsers.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.recentUsers.slice(0, 8).map((u, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <div className="text-xs font-semibold text-slate-700">{u.name || u.email}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No users yet. They&apos;ll show up here once people sign up.</p>
                )}
              </div>
            </div>

            {/* Recent projects */}
            <div className="rounded-2xl p-6 border border-slate-200/80 bg-white/70 backdrop-blur-xl shadow-sm">
              <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-slate-700">
                <FolderOpen className="w-4 h-4 text-stone-500" />
                Recent Projects
              </h2>
              {analytics?.recentProjects && analytics.recentProjects.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {analytics.recentProjects.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-slate-200/80 hover:bg-stone-50/30 hover:border-stone-200 transition-all">
                      <div>
                        <div className="text-xs font-semibold text-slate-700">{p.name}</div>
                        <div className="text-[10px] text-slate-400">{p.user_email}</div>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No projects created yet.</p>
              )}
            </div>
          </>
        )}

        {/* ═══════ USERS TAB ═══════ */}
        {activeTab === "users" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-800">User Management</h1>
                <p className="text-slate-400 text-sm mt-1 font-medium">{users.length} registered users</p>
              </div>
              <button onClick={fetchUsers} className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-700 border border-stone-200 bg-stone-50 hover:bg-stone-100 rounded-xl px-3 py-1.5 transition-all shadow-sm">
                <RefreshCw className={`w-3 h-3 ${usersLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {users.length > 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-white/70 overflow-hidden backdrop-blur-xl shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left text-[10px] uppercase tracking-wider text-slate-400 px-4 py-3 font-bold">User</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-slate-400 px-4 py-3 font-bold">Role</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-slate-400 px-4 py-3 font-bold">Plan</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-slate-400 px-4 py-3 font-bold">Projects</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-slate-400 px-4 py-3 font-bold">Joined</th>
                        <th className="text-right text-[10px] uppercase tracking-wider text-slate-400 px-4 py-3 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-stone-50/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-sm font-semibold text-slate-700">{user.name || "—"}</div>
                            <div className="text-[10px] text-slate-400">{user.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            {editingUser === user.id ? (
                              <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700">
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                user.role === "admin"
                                  ? "bg-stone-50 text-stone-700 border border-stone-200"
                                  : "bg-slate-50 text-slate-500 border border-slate-200"
                              }`}>
                                {user.role === "admin" && <Crown className="w-3 h-3 inline mr-1" />}
                                {user.role}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {editingUser === user.id ? (
                              <select value={editPlan} onChange={(e) => setEditPlan(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700">
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="unlimited">Unlimited</option>
                              </select>
                            ) : (
                              <span className="text-xs text-slate-500 capitalize font-medium">{user.plan || "free"}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500 font-medium">{user.projectCount}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingUser === user.id ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => updateUser(user.id)}
                                  className="text-xs text-stone-600 hover:text-stone-700 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-all font-semibold">
                                  Save
                                </button>
                                <button onClick={() => setEditingUser(null)}
                                  className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 transition-all">
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => { setEditingUser(user.id); setEditRole(user.role); setEditPlan(user.plan); }}
                                  className="text-slate-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-50 transition-all" title="Edit">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteUser(user.id, user.email)}
                                  className="text-slate-400 hover:text-stone-500 p-1.5 rounded-lg hover:bg-stone-50 transition-all" title="Delete">
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
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-12 text-center">
                <Users className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                <h3 className="text-sm font-bold mb-1 text-slate-600">No users yet</h3>
                <p className="text-xs text-slate-400">
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
                <h1 className="text-2xl font-black tracking-tight text-slate-800">Template Gallery</h1>
                <p className="text-slate-400 text-sm mt-1 font-medium">{templates.length} curated templates</p>
              </div>
              <button onClick={fetchTemplates} className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-700 border border-stone-200 bg-stone-50 hover:bg-stone-100 rounded-xl px-3 py-1.5 transition-all shadow-sm">
                <RefreshCw className={`w-3 h-3 ${templatesLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl p-5 border border-slate-200/80 bg-white/70 hover:bg-white/90 hover:border-stone-200 backdrop-blur-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-stone-100/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">{t.name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">{t.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {t.featured && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-50 text-stone-600 border border-stone-200">
                          Featured
                        </span>
                      )}
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        t.tier === "premium"
                          ? "bg-stone-50 text-stone-700 border border-stone-200"
                          : "bg-slate-50 text-slate-400 border border-slate-200"
                      }`}>
                        {t.tier}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{t.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.tags.map((tag) => (
                      <span key={tag} className="text-[9px] text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => copyToClipboard(t.prompt, t.id)}
                      className="flex items-center gap-1.5 text-[10px] text-stone-500 hover:text-stone-600 transition-colors font-medium"
                    >
                      {copied === t.id ? <Check className="w-3 h-3 text-stone-500" /> : <Copy className="w-3 h-3" />}
                      {copied === t.id ? "Copied prompt!" : "Copy prompt"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {templates.length === 0 && !templatesLoading && (
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-12 text-center">
                <Layout className="w-14 h-14 text-slate-200 mx-auto mb-4" />
                <h3 className="text-sm font-bold mb-1 text-slate-600">Loading templates...</h3>
              </div>
            )}
          </>
        )}
    </div>
  );
}
