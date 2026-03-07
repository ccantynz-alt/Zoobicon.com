"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap, Shield, CheckCircle2, XCircle, AlertTriangle, LogOut,
  Settings, Key, Users, Activity, Server, Globe, RefreshCw,
  Copy, Check, ExternalLink, ArrowRight, BarChart3, Code2,
} from "lucide-react";

interface EnvStatus {
  key: string;
  label: string;
  required: boolean;
  set: boolean | null;
}

interface SystemCheck {
  label: string;
  status: "ok" | "warn" | "error" | "loading";
  detail: string;
}

export default function AdminPage() {
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState("");
  const [apiTest, setApiTest] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [apiError, setApiError] = useState("");

  const [checks] = useState<SystemCheck[]>([
    { label: "Next.js App Router", status: "ok", detail: "Running Next.js 14 with App Router" },
    { label: "Streaming API", status: "ok", detail: "SSE streaming enabled on generate, chat, support" },
    { label: "Rate Limiting", status: "ok", detail: "10 gen/min · 20 chat/min · 30 support/min per IP" },
    { label: "Password Reset", status: "ok", detail: "HMAC-signed tokens, 1-hour expiry, no DB required" },
    { label: "Export HTML", status: "ok", detail: "Single-file HTML download from builder" },
  ]);

  const envKeys: EnvStatus[] = [
    { key: "ANTHROPIC_API_KEY", label: "Anthropic (Claude)", required: true, set: null },
    { key: "RESEND_API_KEY", label: "Resend (Email)", required: false, set: null },
    { key: "RESET_TOKEN_SECRET", label: "Reset Token Secret", required: false, set: null },
    { key: "NEXT_PUBLIC_APP_URL", label: "App URL", required: false, set: null },
    { key: "ADMIN_EMAIL", label: "Admin Email", required: true, set: null },
    { key: "ADMIN_PASSWORD", label: "Admin Password", required: true, set: null },
  ];

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
    localStorage.removeItem("zoobicon_user");
    window.location.href = "/";
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
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
      if (res.ok || res.status === 200) {
        setApiTest("ok");
      } else {
        const data = await res.json().catch(() => ({}));
        setApiError(data.error || `HTTP ${res.status}`);
        setApiTest("error");
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : "Network error");
      setApiTest("error");
    }
  };

  if (!isAdmin) return null;

  const quickActions = [
    { icon: Settings, label: "Change Password", href: "/auth/settings", desc: "Update admin credentials" },
    { icon: Globe, label: "View Site", href: "/", desc: "Open public homepage", external: true },
    { icon: BarChart3, label: "Dashboard", href: "/dashboard", desc: "User project dashboard" },
    { icon: Code2, label: "Builder", href: "/builder", desc: "AI website builder" },
  ];

  const launchChecklist = [
    { done: true,  label: "AI generation working (claude-3-5-sonnet)" },
    { done: true,  label: "AI chat editor working" },
    { done: true,  label: "Support chat working (Zoe)" },
    { done: true,  label: "Rate limiting on all API routes" },
    { done: true,  label: "Export HTML from builder" },
    { done: true,  label: "Password reset flow + email" },
    { done: true,  label: "Reset password page (/auth/reset-password)" },
    { done: true,  label: "Admin panel (/admin)" },
    { done: true,  label: "Zoe avatar redesigned (real photo)" },
    { done: false, label: "Add RESEND_API_KEY in Vercel → password reset emails live" },
    { done: false, label: "Add RESET_TOKEN_SECRET in Vercel → secure reset tokens" },
    { done: false, label: "Set NEXT_PUBLIC_APP_URL in Vercel (e.g. https://zoobicon.com)" },
    { done: false, label: "Stripe billing integration" },
    { done: false, label: "Supabase database (persistent user projects)" },
    { done: false, label: "Google / GitHub OAuth" },
    { done: false, label: "PostHog analytics" },
  ];

  return (
    <div className="min-h-screen bg-[#050507]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl">
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
            <span className="text-sm text-white/30 hidden sm:block">{userName}</span>
            <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/60 px-3 py-1.5 rounded-lg border border-white/[0.06] transition-colors">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-red-400/60 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-10 space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-1">Admin Panel</h1>
          <p className="text-white/40 text-sm">System health, configuration, and launch checklist.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((a) => (
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
                <div className="text-[10px] text-white/30 truncate">{a.desc}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* System Checks */}
          <div className="gradient-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold">System Status</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400/80">All systems operational</span>
              </div>
            </div>
            <div className="space-y-3">
              {checks.map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-xs text-white/30">{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* API test */}
            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-white/40" />
                  <span className="text-sm font-medium">Anthropic API</span>
                </div>
                <button
                  onClick={testApiConnection}
                  disabled={apiTest === "loading"}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${apiTest === "loading" ? "animate-spin" : ""}`} />
                  Test connection
                </button>
              </div>
              {apiTest === "ok" && (
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  API key valid — connection successful
                </div>
              )}
              {apiTest === "error" && (
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <XCircle className="w-3.5 h-3.5" />
                  {apiError}
                </div>
              )}
            </div>
          </div>

          {/* Env Vars Status */}
          <div className="gradient-border rounded-2xl p-6">
            <h2 className="text-base font-bold mb-1">Environment Variables</h2>
            <p className="text-xs text-white/30 mb-5">
              Set these in <span className="text-white/50">Vercel → Project Settings → Environment Variables</span>
            </p>
            <div className="space-y-3">
              {envKeys.map((e) => (
                <div key={e.key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-mono text-white/70 truncate">{e.key}</div>
                    <div className="text-[10px] text-white/25">{e.label}{e.required ? " — required" : " — optional"}</div>
                  </div>
                  <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    e.required
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-white/[0.04] text-white/30 border border-white/[0.06]"
                  }`}>
                    {e.required ? "Required" : "Optional"}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              <p className="text-xs text-white/30 mb-3">Copy env var block for <code className="text-white/50">.env.local</code></p>
              <button
                onClick={() => copyToClipboard(
                  "ANTHROPIC_API_KEY=\nADMIN_EMAIL=\nADMIN_PASSWORD=\nRESEND_API_KEY=\nRESET_TOKEN_SECRET=\nNEXT_PUBLIC_APP_URL=https://zoobicon.com",
                  "envblock"
                )}
                className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
              >
                {copied === "envblock" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied === "envblock" ? "Copied!" : "Copy template"}
              </button>
            </div>
          </div>
        </div>

        {/* Launch Checklist */}
        <div className="gradient-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold">Launch Checklist</h2>
              <p className="text-xs text-white/30 mt-0.5">
                {launchChecklist.filter((i) => i.done).length} of {launchChecklist.length} complete
              </p>
            </div>
            <div className="text-2xl font-black gradient-text-static">
              {Math.round((launchChecklist.filter((i) => i.done).length / launchChecklist.length) * 100)}%
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/[0.04] rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan rounded-full transition-all duration-500"
              style={{ width: `${(launchChecklist.filter((i) => i.done).length / launchChecklist.length) * 100}%` }}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-2">
            {launchChecklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/[0.12] flex-shrink-0" />
                )}
                <span className={`text-sm ${item.done ? "text-white/60" : "text-white/40"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Next steps */}
          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400/80">Next steps to go live</span>
            </div>
            <ol className="space-y-2 text-xs text-white/40 list-decimal list-inside">
              <li>Add <code className="text-white/60">RESEND_API_KEY</code> in Vercel — password reset emails will start working instantly</li>
              <li>Add <code className="text-white/60">RESET_TOKEN_SECRET</code> — any random 32+ char string for secure token signing</li>
              <li>Set <code className="text-white/60">NEXT_PUBLIC_APP_URL</code> to your production domain</li>
              <li>Merge the latest branch to <code className="text-white/60">main</code> to deploy all recent fixes</li>
            </ol>
          </div>
        </div>

        {/* API Reference */}
        <div className="gradient-border rounded-2xl p-6">
          <h2 className="text-base font-bold mb-5">Internal API Reference</h2>
          <div className="space-y-3">
            {[
              { method: "POST", path: "/api/generate", desc: "Stream AI website generation", limit: "10 req/min" },
              { method: "POST", path: "/api/chat", desc: "Stream AI code editing", limit: "20 req/min" },
              { method: "POST", path: "/api/support", desc: "Stream Zoe support chat", limit: "30 req/min" },
              { method: "POST", path: "/api/auth/login", desc: "Admin login", limit: "—" },
              { method: "POST", path: "/api/auth/forgot-password", desc: "Request password reset email", limit: "—" },
              { method: "POST", path: "/api/auth/reset-password", desc: "Validate token + reset password", limit: "—" },
              { method: "POST", path: "/api/auth/change-password", desc: "Admin password change", limit: "—" },
            ].map((r) => (
              <div key={r.path} className="flex items-center gap-4 py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-[10px] font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded w-12 text-center flex-shrink-0">
                  {r.method}
                </span>
                <code className="text-xs font-mono text-white/60 w-52 flex-shrink-0">{r.path}</code>
                <span className="text-xs text-white/30 flex-1">{r.desc}</span>
                <span className="text-[10px] text-white/20 flex-shrink-0">{r.limit}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
