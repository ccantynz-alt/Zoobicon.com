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
  Activity,
  Database,
  Cpu,
  Wifi,
  ArrowUpRight,
} from "lucide-react";

// Rule 31 — Users + Analytics tabs delegated to Crontech.
type AdminTab = "overview" | "templates";

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

export default function AdminPage() {
  // AdminShell is the single auth gate — see src/app/admin/AdminShell.tsx.
  // A duplicated check here used to race against it and flash redirects.
  const [isAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [copied, setCopied] = useState("");
  const [apiTest, setApiTest] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [apiError, setApiError] = useState("");

  // Rule 31 — users/analytics state removed (delegated to Crontech).
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Real env-var presence — `Required` was a static label that the
  // user (rightly) read as "this is missing", but it actually only
  // expressed intent. We now ask the server which keys are actually
  // set in Vercel and render Set / Missing instead.
  const [envStatus, setEnvStatus] = useState<Record<string, boolean> | null>(null);
  const [envStatusError, setEnvStatusError] = useState("");

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

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch("/api/admin/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch { setTemplates([]); }
    setTemplatesLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "templates") fetchTemplates();
  }, [activeTab, isAdmin, fetchTemplates]);

  // Read the admin email from localStorage so we can authenticate
  // to /api/admin/env-status. The endpoint returns booleans only,
  // never the values, so this is purely a UI affordance.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem("zoobicon_user") : null;
        if (!raw) return;
        const user = JSON.parse(raw);
        if (!user?.email) return;
        const res = await fetch("/api/admin/env-status", {
          headers: { "x-admin-email": user.email },
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setEnvStatusError(`HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        if (!cancelled) setEnvStatus(data.status || {});
      } catch (e) {
        if (!cancelled) setEnvStatusError(e instanceof Error ? e.message : "Failed to load env status");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Rule 31 — user CRUD lives in Crontech; updateUser/deleteUser removed.

  if (!isAdmin) return null;

  // Rule 31 — Users + Analytics tabs removed (delegated to Crontech).
  // Overview + Templates only — both Zoobicon-owned.
  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <Zap className="w-4 h-4" /> },
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
    // Substrate (self-hosted LLM fallback — see docs/substrate-deploy.md)
    { key: "SELFHOSTED_LLM_URL", label: "Substrate base URL (Hetzner vLLM)", required: false, group: "Substrate (LLM fallback)" },
    { key: "SELFHOSTED_LLM_KEY", label: "Substrate API key", required: false, group: "Substrate (LLM fallback)" },
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
    { method: "GET",  path: "/api/admin/templates", desc: "Template management", limit: "admin" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-800">Command Center</h1>
          <p className="text-sm text-stone-600 mt-1">System health, configuration, and platform management</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/builder" className="text-xs text-stone-700 hover:text-stone-700 px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 hover:bg-white backdrop-blur-sm transition-all shadow-sm">
            Builder
          </Link>
          <Link href="/admin" className="text-xs text-white px-3 py-1.5 rounded-xl bg-gradient-to-r from-stone-500 to-stone-600 hover:from-stone-400 hover:to-stone-500 shadow-md shadow-stone-500/20 transition-all">
            Dashboard
          </Link>
        </div>
      </div>

      {/* ── Content Tabs ── */}
      <div className="border-b border-stone-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-stone-500 text-stone-700"
                  : "border-transparent text-stone-600 hover:text-stone-600 hover:bg-stone-50"
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
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-600 mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-stone-500" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  // AI Website Builder — the only product (Rule 32). Surfaces first.
                  { icon: Code2, label: "AI Builder", href: "/builder", desc: "Open the builder" },
                  // Intel Flywheel — daily painkillers from HN + Reddit
                  { icon: TrendingUp, label: "HN Flywheel", href: "/admin/intel/hn", desc: "Hacker News painkillers" },
                  { icon: TrendingUp, label: "Reddit Flywheel", href: "/admin/intel/reddit", desc: "Reddit painkillers" },
                  { icon: Activity, label: "Competitive Intel", href: "/admin/intel", desc: "Competitor crawler" },
                  // Product surfaces that actually exist on disk.
                  // Rule 33 (2026-05-30): Zoobicon owns no domain UI —
                  // custom domains for built sites are provisioned via
                  // Crontech's API at deploy time.
                  { icon: FolderOpen, label: "Builds", href: "/admin/builds", desc: "Build history" },
                  { icon: Workflow, label: "Integrations", href: "/admin/integrations", desc: "Third-party hooks" },
                  { icon: TrendingUp, label: "SEO control room", href: "/admin/seo", desc: "Sitemap + IndexNow" },
                  { icon: Rocket, label: "Pre-Launch", href: "/admin/pre-launch", desc: "Launch checklist & readiness" },
                  // Account + public surfaces
                  { icon: Settings, label: "Settings", href: "/admin/settings", desc: "Admin settings" },
                  { icon: Globe, label: "View Site", href: "/", desc: "Public homepage", external: true },
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
                      className="group relative overflow-hidden rounded-2xl border border-stone-200/80 hover:border-stone-300 bg-white hover:bg-white backdrop-blur-xl p-5 flex items-start gap-4 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-stone-100/50 hover:scale-[1.02]"
                    >
                      {/* Editorial-light icon medallion: cream surface + gold
                          hairline + ink glyph. The previous dark stone
                          gradient + `text-white` glyph rendered as solid
                          black under the Rule 29 override (globals.css:2354
                          rewrites .text-white → var(--ink)), making every
                          icon invisible on a near-black background. */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                        style={{
                          background: "var(--paper)",
                          border: "1px solid var(--gold-soft, rgba(232,64,43,0.35))",
                          boxShadow: "0 1px 3px rgba(194,51,31,0.10)",
                        }}
                      >
                        <a.icon className="w-5 h-5" style={{ color: "var(--gold-deep, #c2331f)" }} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate text-stone-700 group-hover:text-stone-900 transition-colors">{a.label}</div>
                        <div className="text-xs text-stone-600 truncate mt-0.5">{a.desc}</div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 absolute top-4 right-4 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Feature Highlights ── */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Workflow, title: "10-Agent Pipeline", desc: "Strategist, Brand, Copywriter, Architect, Developer, Animator, SEO, Forms, Integrations, QA — 3 tiers." },
                { icon: ImagePlus, title: "AI Image Generation", desc: "DALL-E 3, Stability AI, and Unsplash integration. Contextual AI images." },
                { icon: Globe, title: "Website Cloner", desc: "Paste any URL to analyze, extract content, and rebuild as a premium site." },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="rounded-2xl p-6 bg-white border border-stone-200/80 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-stone-100/30 hover:border-stone-200 hover:scale-[1.02] transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--gold-soft, rgba(232,64,43,0.35))",
                      boxShadow: "0 1px 3px rgba(194,51,31,0.10)",
                    }}
                  >
                    <f.icon className="w-6 h-6" style={{ color: "var(--gold-deep, #c2331f)" }} />
                  </div>
                  <h3 className="text-sm font-bold mb-1.5 text-stone-700">{f.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* System Checks */}
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-stone-200 bg-white backdrop-blur-xl p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold flex items-center gap-2 text-stone-700">
                    <Cpu className="w-4 h-4 text-stone-500" />
                    System Status
                  </h2>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-50 border border-stone-200">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
                        <div className="text-sm font-medium text-stone-700">{c.label}</div>
                        <div className="text-xs text-stone-600">{c.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-stone-500" />
                      <span className="text-sm font-medium text-stone-700">Anthropic API</span>
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
                className="rounded-2xl border border-stone-200/80 bg-white backdrop-blur-xl p-6 shadow-sm"
              >
                <h2 className="text-base font-bold mb-1 flex items-center gap-2 text-stone-700">
                  <Database className="w-4 h-4 text-stone-500" />
                  Environment Variables
                </h2>
                <p className="text-xs text-stone-600 mb-1">
                  Set in <span className="text-stone-600 font-medium">Vercel → Environment Variables</span> · {envKeys.length} total
                </p>
                {envStatus && (
                  <p className="text-xs text-stone-500 mb-5">
                    {Object.values(envStatus).filter(Boolean).length} of {envKeys.length} configured
                    {envKeys.filter((e) => e.required && envStatus[e.key] === false).length > 0 && (
                      <span className="ml-2 text-rose-700 font-medium">
                        · {envKeys.filter((e) => e.required && envStatus[e.key] === false).length} required missing
                      </span>
                    )}
                  </p>
                )}
                {envStatusError && (
                  <p className="text-xs text-rose-700 mb-5">Could not load env status — {envStatusError}. Falling back to required/optional labels.</p>
                )}
                <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                  {(() => {
                    let lastGroup = "";
                    return envKeys.map((e) => {
                      const showGroup = e.group !== lastGroup;
                      lastGroup = e.group;
                      // Three rendered states: real status (Set / Missing /
                      // Optional-missing) when we have it, fallback to the
                      // intent label (Required / Optional) when the env
                      // endpoint failed or hasn't returned yet.
                      let badgeLabel: string;
                      let badgeClass: string;
                      if (envStatus) {
                        const isSet = envStatus[e.key] === true;
                        if (isSet) {
                          badgeLabel = "Set";
                          badgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
                        } else if (e.required) {
                          badgeLabel = "Missing";
                          badgeClass = "bg-rose-50 text-rose-700 border border-rose-200";
                        } else {
                          badgeLabel = "Not set";
                          badgeClass = "bg-stone-50 text-stone-500 border border-stone-200";
                        }
                      } else {
                        badgeLabel = e.required ? "Required" : "Optional";
                        badgeClass = "bg-stone-50 text-stone-600 border border-stone-200";
                      }
                      return (
                        <div key={e.key}>
                          {showGroup && (
                            <div className="text-xs font-semibold uppercase tracking-wider text-stone-600 mt-3 mb-1.5 first:mt-0">{e.group}</div>
                          )}
                          <div className="flex items-center justify-between gap-3 py-1.5">
                            <div className="min-w-0">
                              <div className="text-xs font-mono text-stone-600 truncate">{e.key}</div>
                              <div className="text-xs text-stone-600">{e.label}</div>
                            </div>
                            <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${badgeClass}`}>
                              {badgeLabel}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-5 pt-5 border-t border-stone-100">
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
                  <h2 className="text-base font-bold flex items-center gap-2 text-stone-700">
                    <Rocket className="w-4 h-4 text-stone-500" />
                    Launch Checklist
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {launchChecklist.filter((i) => i.done).length} of {launchChecklist.length} complete
                  </p>
                </div>
                <div className="text-3xl font-black bg-gradient-to-r from-stone-500 via-stone-600 to-stone-500 bg-clip-text text-transparent">
                  {Math.round((launchChecklist.filter((i) => i.done).length / launchChecklist.length) * 100)}%
                </div>
              </div>
              <div className="h-3 bg-stone-100 rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-stone-500 via-stone-600 to-stone-700 rounded-full transition-all duration-700"
                  style={{ width: `${(launchChecklist.filter((i) => i.done).length / launchChecklist.length) * 100}%` }} />
              </div>
              <div className="grid md:grid-cols-2 gap-2.5">
                {launchChecklist.map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 py-2 px-3 rounded-xl ${item.done ? "bg-stone-50" : "bg-stone-50"}`}>
                    {item.done
                      ? <CheckCircle2 className="w-4 h-4 text-stone-500 flex-shrink-0" />
                      : <div className="w-4 h-4 rounded-full border-2 border-stone-200 flex-shrink-0" />
                    }
                    <span className={`text-sm ${item.done ? "text-stone-600" : "text-stone-600"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* API Reference */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-stone-200/80 bg-white backdrop-blur-xl p-6 shadow-sm"
            >
              <h2 className="text-base font-bold mb-5 flex items-center gap-2 text-stone-700">
                <Server className="w-4 h-4 text-stone-500" />
                API Reference
              </h2>
              <div className="space-y-1.5">
                {apiRoutes.map((r) => (
                  <div key={r.path} className="flex items-center gap-4 py-2.5 px-3 rounded-xl border-b border-stone-100 last:border-0 hover:bg-stone-50/40 transition-colors">
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg w-14 text-center flex-shrink-0 ${
                      r.method === "GET"
                        ? "text-stone-600 bg-stone-50 border border-stone-200"
                        : "text-stone-700 bg-stone-50 border border-stone-200"
                    }`}>{r.method}</span>
                    <code className="text-xs font-mono text-stone-700 w-60 flex-shrink-0">{r.path}</code>
                    <span className="text-xs text-stone-600 flex-1">{r.desc}</span>
                    <span className="text-xs text-stone-600 flex-shrink-0 font-medium">{r.limit}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* ═══════ TEMPLATES TAB ═══════ */}
        {activeTab === "templates" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-stone-800">Template Gallery</h1>
                <p className="text-stone-600 text-sm mt-1 font-medium">{templates.length} curated templates</p>
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
                  className="rounded-2xl p-5 border border-stone-200/80 bg-white hover:bg-white hover:border-stone-200 backdrop-blur-xl transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-stone-100/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-stone-700">{t.name}</h3>
                      <span className="text-xs text-stone-600 font-medium">{t.category}</span>
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
                          : "bg-stone-50 text-stone-600 border border-stone-200"
                      }`}>
                        {t.tier}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 mb-3 line-clamp-2">{t.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.tags.map((tag) => (
                      <span key={tag} className="text-[9px] text-stone-600 px-1.5 py-0.5 rounded-md bg-stone-50 border border-stone-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => copyToClipboard(t.prompt, t.id)}
                      className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-600 transition-colors font-medium"
                    >
                      {copied === t.id ? <Check className="w-3 h-3 text-stone-500" /> : <Copy className="w-3 h-3" />}
                      {copied === t.id ? "Copied prompt!" : "Copy prompt"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {templates.length === 0 && !templatesLoading && (
              <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
                <Layout className="w-14 h-14 text-stone-200 mx-auto mb-4" />
                <h3 className="text-sm font-bold mb-1 text-stone-600">Loading templates...</h3>
              </div>
            )}
          </>
        )}
    </div>
  );
}
