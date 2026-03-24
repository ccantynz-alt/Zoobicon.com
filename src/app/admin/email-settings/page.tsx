"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail, Save, CheckCircle2, AlertTriangle, ArrowLeft,
  Server, Send, Eye, EyeOff, Loader2, TestTube,
  Globe, Key, Bell, ExternalLink, Copy, Check,
  Inbox, MessageSquare, ArrowRight, Bot, Shield,
  Smartphone, Laptop2, Wifi, Monitor, RefreshCw,
} from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

interface EmailConfig {
  adminEmail: string;
  supportEmail: string;
  notificationEmail: string;
  mailgunApiKey: string;
  mailgunDomain: string;
  fromName: string;
  fromAddress: string;
  aiAutoReply: boolean;
  notifyOnSignup: boolean;
  notifyOnDeploy: boolean;
  notifyOnContact: boolean;
  notifyOnWaitlist: boolean;
  personalForwardEmail: string;
  smtpUsername: string;
  smtpPassword: string;
}

const SETUP_STEPS = [
  {
    step: 1,
    title: "Create a Mailgun account",
    description: "Sign up at mailgun.com (free tier = 5,000 emails/month). No credit card required for sandbox.",
    link: "https://signup.mailgun.com/new/signup",
  },
  {
    step: 2,
    title: "Add and verify your domain",
    description: "Add mail.zoobicon.com (or zoobicon.com) as a sending domain. Mailgun will give you DNS records (SPF, DKIM, MX) to add to your domain registrar.",
    link: "https://app.mailgun.com/sending/domains",
  },
  {
    step: 3,
    title: "Set up inbound routing",
    description: "In Mailgun \u2192 Receiving \u2192 Create Route. Create ONE catch-all route: Match recipient '.*@zoobicon.com' \u2192 Forward to: https://zoobicon.com/api/email/webhook. This single webhook handles both admin@zoobicon.com and support@zoobicon.com automatically. Action: 'Store and notify' with the webhook URL.",
    link: "https://app.mailgun.com/receiving/routes",
  },
  {
    step: 4,
    title: "Add MX records to your DNS",
    description: "Point zoobicon.com MX records to Mailgun's servers (mxa.mailgun.org and mxb.mailgun.org, priority 10). This tells the internet to deliver emails for @zoobicon.com to Mailgun.",
  },
  {
    step: 5,
    title: "Copy your API key and set env vars",
    description: "Get your API key from Mailgun \u2192 Settings \u2192 API Keys. Add MAILGUN_API_KEY and MAILGUN_DOMAIN to your Vercel environment variables.",
    link: "https://app.mailgun.com/settings/api_security",
  },
  {
    step: 6,
    title: "Set up event webhooks (optional but recommended)",
    description: "In Mailgun \u2192 Sending \u2192 Webhooks, add https://zoobicon.com/api/email/events for all event types (delivered, opened, clicked, bounced, complained, unsubscribed). This enables delivery tracking, open rates, and automatic bounce suppression.",
    link: "https://app.mailgun.com/sending/webhooks",
  },
];

export default function AdminEmailSettingsPage() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [config, setConfig] = useState<EmailConfig>({
    adminEmail: "admin@zoobicon.com",
    supportEmail: "support@zoobicon.com",
    notificationEmail: "",
    mailgunApiKey: "",
    mailgunDomain: "zoobicon.com",
    fromName: "Zoobicon",
    fromAddress: "noreply@zoobicon.com",
    aiAutoReply: true,
    notifyOnSignup: true,
    notifyOnDeploy: true,
    notifyOnContact: true,
    notifyOnWaitlist: true,
    personalForwardEmail: "",
    smtpUsername: "",
    smtpPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<Record<string, { ok: boolean; detail: string }> | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(false);
  const [creatingTables, setCreatingTables] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("zoobicon_user");
      if (s) setUser(JSON.parse(s));
    } catch { /* */ }

    try {
      const saved = localStorage.getItem("zoobicon_email_config");
      if (saved) setConfig((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch { /* */ }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem("zoobicon_email_config", JSON.stringify(config));
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestEmail = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const targetEmail = config.notificationEmail || config.adminEmail || "admin@zoobicon.com";
      const domain = config.mailgunDomain || "zoobicon.com";
      const fromAddr = config.fromAddress || `noreply@${domain}`;
      const fromName = config.fromName || "Zoobicon";
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${fromName} <${fromAddr}>`,
          to: targetEmail,
          subject: "[Zoobicon] Test Email - Configuration Verified",
          text: "This is a test email from your Zoobicon admin panel. If you received this, your Mailgun configuration is working correctly.",
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#131520;color:#fff;border-radius:16px">
            <h1 style="font-size:22px;font-weight:800;margin:0 0 16px">Email Configuration Test</h1>
            <p style="color:rgba(255,255,255,0.7);line-height:1.6">This is a test email from your Zoobicon admin panel. Your Mailgun configuration is working correctly.</p>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:24px">Sent at ${new Date().toISOString()}</p>
          </div>`,
          tags: ["test"],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, message: `Test email sent to ${config.adminEmail}` });
      } else {
        setTestResult({ ok: false, message: data.error || "Failed to send test email. Check your MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables." });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error. Mailgun may not be configured yet." });
    }
    setTestSending(false);
  };

  const toggleKey = (key: string) => setShowKeys((p) => ({ ...p, [key]: !p[key] }));
  const maskKey = (val: string) => val ? val.substring(0, 8) + "..." + val.substring(val.length - 4) : "";

  const envBlock = `# Email (Mailgun only — no Google Workspace needed)
MAILGUN_API_KEY=${config.mailgunApiKey || "key-xxxxx"}
MAILGUN_DOMAIN=${config.mailgunDomain || "zoobicon.com"}
MAILGUN_WEBHOOK_SIGNING_KEY=your-webhook-signing-key
ADMIN_EMAIL=${config.adminEmail || "admin@zoobicon.com"}
ADMIN_NOTIFICATION_EMAIL=${config.notificationEmail || config.adminEmail || "admin@zoobicon.com"}`;

  const copyEnvBlock = () => {
    navigator.clipboard.writeText(envBlock);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const inputClass = "w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50 transition-colors";

  return (
    <div className="min-h-screen bg-[#131520] text-white">
      <BackgroundEffects preset="admin" />

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/10 bg-[#131520]/90 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Admin</span>
            </Link>
            <span className="text-white/50">/</span>
            <span className="text-sm text-white font-medium">Email Settings</span>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                {(user.name || user.email || "A").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Email Configuration</h1>
            <p className="text-white/60 text-sm mt-0.5">Mailgun-powered email for admin inbox, support tickets, and AI replies — no Google Workspace needed</p>
          </div>
        </div>

        {/* How It Works */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white/[0.04] border border-white/10 rounded-xl p-6 mb-6 mt-8">
          <h2 className="text-lg font-semibold mb-1">How It Works — All Mailgun, Zero Google</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            {/* Admin Inbox flow */}
            <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Inbox className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-blue-300">Admin Inbox</h3>
              </div>
              <div className="space-y-2 text-xs text-white/60 leading-relaxed">
                <p><span className="text-white/80">admin@zoobicon.com</span></p>
                <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/50 shrink-0" /><span>Mailgun receives it</span></div>
                <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/50 shrink-0" /><span>Webhook to <code className="text-cyan-400/80">/api/email/webhook</code></span></div>
                <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/50 shrink-0" /><span>Appears in <code className="text-cyan-400/80">/admin/email</code></span></div>
              </div>
            </div>

            {/* Support Tickets flow */}
            <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-purple-300">Support Tickets</h3>
              </div>
              <div className="space-y-2 text-xs text-white/60 leading-relaxed">
                <p><span className="text-white/80">support@zoobicon.com</span></p>
                <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/50 shrink-0" /><span>Mailgun receives it</span></div>
                <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/50 shrink-0" /><span>Webhook to <code className="text-cyan-400/80">/api/email/webhook</code></span></div>
                <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/50 shrink-0" /><span>Ticket in <code className="text-cyan-400/80">/email-support</code></span></div>
                <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/50 shrink-0" /><span>AI drafts reply</span></div>
              </div>
            </div>

            {/* Outbound flow */}
            <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-sm font-semibold text-green-300">Outbound</h3>
              </div>
              <div className="space-y-2 text-xs text-white/60 leading-relaxed">
                <p>All outbound emails (notifications, replies, password resets) sent via Mailgun API from <span className="text-white/80">noreply@zoobicon.com</span>.</p>
                <p className="pt-1 text-white/60">Zoobicon controls everything.</p>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-white/[0.04] border border-white/10 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1.5 font-medium">Mailgun Webhook URL (use this for ALL inbound routing):</p>
            <code className="text-xs text-cyan-400 bg-black/30 px-2 py-1 rounded select-all">https://zoobicon.com/api/email/webhook</code>
          </div>
          <p className="text-xs text-white/60 mt-3">Total cost: <span className="text-green-400/80">$0/month</span> on Mailgun free tier (5,000 emails/month). No Google Workspace, no per-seat charges.</p>
        </motion.div>

        {/* Setup Guide — Expandable accordion */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold">Setup Guide — 5 Steps</h2>
          </div>
          <div className="space-y-2">
            {SETUP_STEPS.map((s) => (
              <div key={s.step} className="border border-white/10 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expandedStep === s.step ? null : s.step)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                    {s.step}
                  </div>
                  <span className="text-sm font-medium text-white/90 flex-1 text-left">{s.title}</span>
                  <div className={`text-white/50 transition-transform ${expandedStep === s.step ? "rotate-180" : ""}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </button>
                {expandedStep === s.step && (
                  <div className="px-4 pb-4 pl-14">
                    <p className="text-xs text-white/60 leading-relaxed">{s.description}</p>
                    {s.link && (
                      <a href={s.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                        <ExternalLink className="w-3 h-3" /> Open in Mailgun
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Connection Verification */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-green-400" />
              <h2 className="text-lg font-semibold">Connection Status</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setCheckingSetup(true);
                  try {
                    const res = await fetch("/api/email/setup");
                    const data = await res.json();
                    setSetupStatus(data.checks);
                  } catch {
                    setSetupStatus({ error: { ok: false, detail: "Could not reach setup endpoint" } });
                  }
                  setCheckingSetup(false);
                }}
                disabled={checkingSetup}
                className="flex items-center gap-1.5 text-xs bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              >
                {checkingSetup ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Verify Setup
              </button>
              <button
                onClick={async () => {
                  setCreatingTables(true);
                  try {
                    await fetch("/api/email/setup", { method: "POST" });
                    // Re-check after creating
                    const res = await fetch("/api/email/setup");
                    const data = await res.json();
                    setSetupStatus(data.checks);
                  } catch {
                    setSetupStatus({ error: { ok: false, detail: "Failed to create tables" } });
                  }
                  setCreatingTables(false);
                }}
                disabled={creatingTables}
                className="flex items-center gap-1.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
              >
                {creatingTables ? <Loader2 className="w-3 h-3 animate-spin" /> : <Server className="w-3 h-3" />}
                Create DB Tables
              </button>
            </div>
          </div>
          {setupStatus && (
            <div className="space-y-2">
              {Object.entries(setupStatus).map(([key, val]) => (
                <div key={key} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs ${val.ok ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                  {val.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span className="font-medium min-w-[160px]">{key.replace(/_/g, " ")}</span>
                  <span className="text-white/60">{val.detail}</span>
                </div>
              ))}
            </div>
          )}
          {!setupStatus && (
            <p className="text-xs text-white/60">Click &ldquo;Verify Setup&rdquo; to check your Mailgun API key, domain, database tables, and webhook configuration.</p>
          )}
        </motion.div>

        {/* Email Addresses */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Email Addresses</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-1.5 font-medium">Admin Email</label>
              <input
                type="email" value={config.adminEmail}
                onChange={(e) => setConfig((p) => ({ ...p, adminEmail: e.target.value }))}
                placeholder="admin@zoobicon.com"
                className={inputClass}
              />
              <p className="text-xs text-white/60 mt-1">Your main inbox. Mailgun routes emails here &rarr; <code className="text-cyan-400/60">/admin/email</code></p>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1.5 font-medium">Support Email</label>
              <input
                type="email" value={config.supportEmail}
                onChange={(e) => setConfig((p) => ({ ...p, supportEmail: e.target.value }))}
                placeholder="support@zoobicon.com"
                className={inputClass}
              />
              <p className="text-xs text-white/60 mt-1">Customer-facing support. Creates tickets in <code className="text-cyan-400/60">/email-support</code> with AI auto-reply.</p>
            </div>
          </div>
        </motion.div>

        {/* Sender Identity */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Send className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold">Sender Identity</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/80 mb-1.5 font-medium">From Name</label>
              <input
                type="text" value={config.fromName}
                onChange={(e) => setConfig((p) => ({ ...p, fromName: e.target.value }))}
                placeholder="Zoobicon"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1.5 font-medium">From Address (outbound)</label>
              <input
                type="email" value={config.fromAddress}
                onChange={(e) => setConfig((p) => ({ ...p, fromAddress: e.target.value }))}
                placeholder="noreply@zoobicon.com"
                className={inputClass}
              />
            </div>
          </div>
        </motion.div>

        {/* Mailgun API Configuration */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Key className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Mailgun API Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-1.5 font-medium">Mailgun API Key</label>
              <div className="relative">
                <input
                  type={showKeys.mailgun ? "text" : "password"}
                  value={config.mailgunApiKey}
                  onChange={(e) => setConfig((p) => ({ ...p, mailgunApiKey: e.target.value }))}
                  placeholder="key-..."
                  className={`${inputClass} pr-10 font-mono`}
                />
                <button onClick={() => toggleKey("mailgun")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                  {showKeys.mailgun ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-white/60 mt-1">All emails (notifications, support tickets, password resets) are sent via Mailgun.</p>
            </div>
            <div>
              <label className="block text-sm text-white/80 mb-1.5 font-medium">Mailgun Domain</label>
              <input
                type="text" value={config.mailgunDomain}
                onChange={(e) => setConfig((p) => ({ ...p, mailgunDomain: e.target.value }))}
                placeholder="zoobicon.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <p className="text-xs text-white/60 mt-1">Just the domain name (e.g. <code className="text-white/60">zoobicon.com</code>), not the full API URL. The API base URL is added automatically.</p>
            </div>
          </div>
        </motion.div>

        {/* Notifications & AI */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Notifications & AI</h2>
          </div>
          <div className="space-y-1">
            {[
              { key: "aiAutoReply" as const, label: "AI auto-reply on support tickets", desc: "Zoobicon AI drafts a reply when a customer emails support@zoobicon.com", icon: <Bot className="w-4 h-4 text-purple-400" /> },
              { key: "notifyOnSignup" as const, label: "New user signups", desc: "Get notified at admin@zoobicon.com when someone creates an account" },
              { key: "notifyOnDeploy" as const, label: "Site deployments", desc: "Get notified when a site is deployed to zoobicon.sh" },
              { key: "notifyOnContact" as const, label: "Contact form submissions", desc: "Get notified when someone submits a contact form" },
              { key: "notifyOnWaitlist" as const, label: "Waitlist signups", desc: "Get notified when someone joins a product waitlist" },
            ].map(({ key, label, desc, icon }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                <div className="flex items-start gap-3">
                  {icon && <div className="mt-0.5">{icon}</div>}
                  <div>
                    <p className="text-sm text-white/90 font-medium">{label}</p>
                    <p className="text-xs text-white/60 mt-0.5">{desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig((p) => ({ ...p, [key]: !p[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${config[key] ? "bg-blue-600" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config[key] ? "left-6" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Environment Variables */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">Environment Variables</h2>
            </div>
            <button onClick={copyEnvBlock}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-lg px-3 py-1.5 transition-all">
              {copiedEnv ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedEnv ? "Copied!" : "Copy all"}
            </button>
          </div>
          <p className="text-sm text-white/60 mb-4">
            Add these to your <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-cyan-300">.env.local</code> file or Vercel dashboard.
          </p>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
            <div><span className="text-white/60"># Email (Mailgun only — no Google Workspace needed)</span></div>
            <div><span className="text-blue-400">MAILGUN_API_KEY</span><span className="text-white/50">=</span><span className="text-green-400">{config.mailgunApiKey ? maskKey(config.mailgunApiKey) : "key-xxxxx"}</span></div>
            <div><span className="text-blue-400">MAILGUN_DOMAIN</span><span className="text-white/50">=</span><span className="text-green-400">{config.mailgunDomain || "zoobicon.com"}</span></div>
            <div><span className="text-blue-400">MAILGUN_WEBHOOK_SIGNING_KEY</span><span className="text-white/50">=</span><span className="text-green-400">your-webhook-signing-key</span></div>
            <div><span className="text-blue-400">ADMIN_EMAIL</span><span className="text-white/50">=</span><span className="text-green-400">{config.adminEmail || "admin@zoobicon.com"}</span></div>
            <div><span className="text-blue-400">ADMIN_NOTIFICATION_EMAIL</span><span className="text-white/50">=</span><span className="text-green-400">{config.notificationEmail || config.adminEmail || "admin@zoobicon.com"}</span></div>
          </div>
        </motion.div>

        {/* ===== ACCESS EMAIL ON YOUR DEVICES ===== */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="bg-gradient-to-br from-white/[0.06] to-white/[0.03] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Access Email on Your Devices</h2>
              <p className="text-xs text-white/60 mt-0.5">Read and send as admin@zoobicon.com from iPhone, iPad, Mac, and Windows</p>
            </div>
          </div>

          {/* Architecture overview */}
          <div className="bg-white/[0.04] border border-white/10 rounded-lg p-4 mt-4 mb-5">
            <h3 className="text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400" /> Dual-Path Architecture
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                <p className="text-xs font-semibold text-indigo-300 mb-1.5">Path 1: Device Access (Cloudflare)</p>
                <div className="space-y-1.5 text-xs text-white/60">
                  <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/40 shrink-0" /><span>Inbound email arrives at Cloudflare</span></div>
                  <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/40 shrink-0" /><span>Forwarded to your personal email</span></div>
                  <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/40 shrink-0" /><span>Push notifications on all devices</span></div>
                </div>
              </div>
              <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                <p className="text-xs font-semibold text-purple-300 mb-1.5">Path 2: AI Ticketing (Mailgun)</p>
                <div className="space-y-1.5 text-xs text-white/60">
                  <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/40 shrink-0" /><span>Catch-all route still hits Mailgun webhook</span></div>
                  <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/40 shrink-0" /><span>Emails stored in DB for AI processing</span></div>
                  <div className="flex items-center gap-1.5"><ArrowRight className="w-3 h-3 text-white/40 shrink-0" /><span>Ticketing + auto-reply continues working</span></div>
                </div>
              </div>
            </div>
            <div className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
              <p className="text-xs text-indigo-300"><span className="font-semibold">Outbound (both paths):</span> Mailgun SMTP lets you send FROM admin@zoobicon.com or support@zoobicon.com on any device.</p>
            </div>
          </div>

          {/* Accordion sections */}
          <div className="space-y-2">

            {/* Sub-section 1: Cloudflare Email Routing */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedDevice(expandedDevice === "cloudflare" ? null : "cloudflare")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-white/90">Step 1: Cloudflare Email Routing Setup</span>
                  <p className="text-xs text-white/50 mt-0.5">Forward copies of inbound emails to your personal inbox</p>
                </div>
                <div className={`text-white/50 transition-transform ${expandedDevice === "cloudflare" ? "rotate-180" : ""}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>
              {expandedDevice === "cloudflare" && (
                <div className="px-4 pb-5 pt-1">
                  <div className="space-y-4 text-xs text-white/70 leading-relaxed">
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">1. Go to Cloudflare Email Routing</p>
                      <p>Log in to <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">Cloudflare Dashboard <ExternalLink className="w-3 h-3" /></a> &rarr; select <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-400/80">zoobicon.com</code> &rarr; <strong>Email</strong> &rarr; <strong>Email Routing</strong>.</p>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">2. Add a destination address</p>
                      <p>Under <strong>Destination addresses</strong>, click <strong>Add destination</strong>. Enter your personal email (e.g. <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-400/80">you@icloud.com</code> or <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-400/80">you@gmail.com</code>). Cloudflare will send a verification email — click the link to confirm.</p>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">3. Create routing rules</p>
                      <p className="mb-2">Under <strong>Routing rules</strong>, create two custom address rules:</p>
                      <div className="bg-black/30 rounded-lg p-3 space-y-2 font-mono">
                        <div><span className="text-blue-400">admin@zoobicon.com</span> <span className="text-white/50">&rarr;</span> <span className="text-green-400">your-personal@email.com</span></div>
                        <div><span className="text-blue-400">support@zoobicon.com</span> <span className="text-white/50">&rarr;</span> <span className="text-green-400">your-personal@email.com</span></div>
                      </div>
                      <p className="mt-2">Action: <strong>Forward to</strong> for each rule.</p>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">4. Keep the catch-all for Mailgun</p>
                      <p>Under <strong>Catch-all address</strong>, set the action to <strong>Send to an email address</strong> or leave the existing MX records pointing to Mailgun. The specific address rules above take priority, and unmatched addresses still go to Mailgun via MX records.</p>
                      <p className="mt-2 text-amber-400/80"><AlertTriangle className="w-3 h-3 inline mr-1" />If you previously had MX records pointing to Mailgun, Cloudflare Email Routing will manage MX records automatically. Your Mailgun catch-all webhook continues to receive emails that are not matched by specific routing rules.</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <p className="text-green-400 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" /><strong>Result:</strong> Emails to admin@ and support@ now arrive in your personal inbox with push notifications on all devices, AND still flow to Mailgun for AI ticketing.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 2: Apple Devices */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedDevice(expandedDevice === "apple" ? null : "apple")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-500/20 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-gray-300" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-white/90">Step 2: Apple Devices (iPhone / iPad / Mac Mail)</span>
                  <p className="text-xs text-white/50 mt-0.5">Send as admin@zoobicon.com from Apple Mail</p>
                </div>
                <div className={`text-white/50 transition-transform ${expandedDevice === "apple" ? "rotate-180" : ""}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>
              {expandedDevice === "apple" && (
                <div className="px-4 pb-5 pt-1">
                  <div className="space-y-4 text-xs text-white/70 leading-relaxed">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mb-3">
                      <p className="text-blue-300 text-xs"><Wifi className="w-3 h-3 inline mr-1" /><strong>Incoming mail</strong> already arrives in your personal email (iCloud/Gmail) via Cloudflare forwarding. These steps add the ability to <strong>send as</strong> admin@zoobicon.com or support@zoobicon.com.</p>
                    </div>

                    <p className="font-semibold text-white/90">iPhone / iPad Setup</p>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">1. Open Settings</p>
                      <p>Go to <strong>Settings</strong> &rarr; <strong>Mail</strong> &rarr; <strong>Accounts</strong> &rarr; <strong>Add Account</strong> &rarr; <strong>Other</strong> &rarr; <strong>Add Mail Account</strong>.</p>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">2. Enter account details</p>
                      <div className="bg-black/30 rounded-lg p-3 space-y-1.5 font-mono">
                        <div><span className="text-white/50">Name:</span> <span className="text-green-400">Zoobicon Admin</span></div>
                        <div><span className="text-white/50">Email:</span> <span className="text-green-400">admin@zoobicon.com</span></div>
                        <div><span className="text-white/50">Password:</span> <span className="text-green-400">[Mailgun SMTP password]</span></div>
                        <div><span className="text-white/50">Description:</span> <span className="text-green-400">Zoobicon</span></div>
                      </div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">3. Configure incoming mail server</p>
                      <p className="mb-2">Since incoming email is handled by Cloudflare forwarding to your personal inbox, you can skip the incoming server or set it to a dummy value. iOS may require values:</p>
                      <div className="bg-black/30 rounded-lg p-3 space-y-1.5 font-mono">
                        <div><span className="text-white/50">Host Name:</span> <span className="text-green-400">imap.mailgun.org</span></div>
                        <div><span className="text-white/50">Username:</span> <span className="text-green-400">admin@zoobicon.com</span></div>
                        <div><span className="text-white/50">Password:</span> <span className="text-green-400">[Mailgun SMTP password]</span></div>
                      </div>
                      <p className="mt-2 text-amber-400/70">Note: Mailgun does not provide IMAP access. If iOS insists on verifying incoming, you can enter these values and let the verification fail for incoming — then disable incoming mail fetching for this account. You will still receive emails via Cloudflare forwarding to your personal inbox.</p>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">4. Configure outgoing mail server (SMTP)</p>
                      <div className="bg-black/30 rounded-lg p-3 space-y-1.5 font-mono">
                        <div><span className="text-white/50">SMTP Server:</span> <span className="text-green-400">smtp.mailgun.org</span></div>
                        <div><span className="text-white/50">Port:</span> <span className="text-green-400">587</span></div>
                        <div><span className="text-white/50">Username:</span> <span className="text-green-400">{config.smtpUsername || "postmaster@zoobicon.com"}</span></div>
                        <div><span className="text-white/50">Password:</span> <span className="text-green-400">[Mailgun SMTP password]</span></div>
                        <div><span className="text-white/50">Use TLS:</span> <span className="text-green-400">Yes (STARTTLS)</span></div>
                        <div><span className="text-white/50">Authentication:</span> <span className="text-green-400">Password</span></div>
                      </div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">5. Save and test</p>
                      <p>Tap <strong>Save</strong>. Open Mail, compose a new email, tap the <strong>From</strong> field, and select <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-400/80">admin@zoobicon.com</code>. Send a test to yourself.</p>
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-4">
                      <p className="font-semibold text-white/90 mb-3">Mac Mail Setup</p>
                      <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                        <p>Open <strong>Mail</strong> &rarr; <strong>Settings</strong> (Cmd+,) &rarr; <strong>Accounts</strong> &rarr; click <strong>+</strong> &rarr; <strong>Other Mail Account</strong>. Enter the same credentials as above. When prompted for server settings, use the same SMTP configuration. Mac Mail will auto-detect that incoming fails and allow you to proceed with outgoing only.</p>
                      </div>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <p className="text-green-400 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" /><strong>Result:</strong> You receive emails in your regular inbox via forwarding. When you reply, it sends FROM admin@zoobicon.com via Mailgun SMTP. Recipients see your Zoobicon address, not your personal one.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 3: Windows */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedDevice(expandedDevice === "windows" ? null : "windows")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-white/90">Step 3: Windows (Outlook / Windows Mail)</span>
                  <p className="text-xs text-white/50 mt-0.5">Send as admin@zoobicon.com from Outlook or Windows Mail</p>
                </div>
                <div className={`text-white/50 transition-transform ${expandedDevice === "windows" ? "rotate-180" : ""}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>
              {expandedDevice === "windows" && (
                <div className="px-4 pb-5 pt-1">
                  <div className="space-y-4 text-xs text-white/70 leading-relaxed">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 mb-3">
                      <p className="text-blue-300 text-xs"><Wifi className="w-3 h-3 inline mr-1" /><strong>Incoming mail</strong> already arrives in your personal email (Outlook.com/Gmail) via Cloudflare forwarding. These steps add the ability to <strong>send as</strong> admin@zoobicon.com.</p>
                    </div>

                    <p className="font-semibold text-white/90">Microsoft Outlook (Desktop) Setup</p>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">1. Add a new account</p>
                      <p>Open Outlook &rarr; <strong>File</strong> &rarr; <strong>Add Account</strong>. Enter <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-400/80">admin@zoobicon.com</code>, then click <strong>Advanced options</strong> &rarr; check <strong>Let me set up my account manually</strong> &rarr; <strong>Connect</strong>.</p>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">2. Select account type</p>
                      <p>Choose <strong>IMAP</strong> (or <strong>POP</strong> if IMAP is not available).</p>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">3. Incoming mail settings</p>
                      <p className="mb-2">Since incoming is handled by Cloudflare forwarding, these values are placeholders. Outlook requires them to proceed:</p>
                      <div className="bg-black/30 rounded-lg p-3 space-y-1.5 font-mono">
                        <div><span className="text-white/50">Server:</span> <span className="text-green-400">imap.mailgun.org</span></div>
                        <div><span className="text-white/50">Port:</span> <span className="text-green-400">993</span></div>
                        <div><span className="text-white/50">Encryption:</span> <span className="text-green-400">SSL/TLS</span></div>
                        <div><span className="text-white/50">Username:</span> <span className="text-green-400">admin@zoobicon.com</span></div>
                        <div><span className="text-white/50">Password:</span> <span className="text-green-400">[Mailgun SMTP password]</span></div>
                      </div>
                      <p className="mt-2 text-amber-400/70">Incoming may fail to verify since Mailgun does not offer IMAP. Click <strong>Next</strong> or <strong>Skip</strong> if prompted — the important part is the outgoing SMTP server.</p>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">4. Outgoing mail settings (SMTP)</p>
                      <div className="bg-black/30 rounded-lg p-3 space-y-1.5 font-mono">
                        <div><span className="text-white/50">Server:</span> <span className="text-green-400">smtp.mailgun.org</span></div>
                        <div><span className="text-white/50">Port:</span> <span className="text-green-400">587</span></div>
                        <div><span className="text-white/50">Encryption:</span> <span className="text-green-400">STARTTLS</span></div>
                        <div><span className="text-white/50">Authentication:</span> <span className="text-green-400">Password</span></div>
                        <div><span className="text-white/50">Username:</span> <span className="text-green-400">{config.smtpUsername || "postmaster@zoobicon.com"}</span></div>
                        <div><span className="text-white/50">Password:</span> <span className="text-green-400">[Mailgun SMTP password]</span></div>
                      </div>
                    </div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                      <p className="font-semibold text-white/90 mb-2">5. Finish setup</p>
                      <p>Click <strong>Connect</strong> &rarr; <strong>Done</strong>. To test, compose a new email, click the <strong>From</strong> dropdown, and select <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-400/80">admin@zoobicon.com</code>.</p>
                    </div>

                    <div className="border-t border-white/10 pt-4 mt-4">
                      <p className="font-semibold text-white/90 mb-3">Windows Mail (built-in) Setup</p>
                      <div className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
                        <p>Open <strong>Windows Mail</strong> &rarr; <strong>Settings</strong> (gear icon) &rarr; <strong>Manage Accounts</strong> &rarr; <strong>Add account</strong> &rarr; <strong>Advanced setup</strong> &rarr; <strong>Internet email</strong>. Fill in the same server details as Outlook above. Set Account name to <strong>Zoobicon</strong> and send messages using the name <strong>Zoobicon Admin</strong>.</p>
                      </div>
                    </div>

                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                      <p className="text-green-400 text-xs"><CheckCircle2 className="w-3 h-3 inline mr-1" /><strong>Result:</strong> Emails forwarded to your personal Outlook.com/Gmail show up normally. Replies send FROM admin@zoobicon.com via Mailgun SMTP.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 4: SMTP Configuration Form */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedDevice(expandedDevice === "config" ? null : "config")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Key className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-white/90">Device Configuration</span>
                  <p className="text-xs text-white/50 mt-0.5">Save your forwarding email and SMTP credentials</p>
                </div>
                <div className={`text-white/50 transition-transform ${expandedDevice === "config" ? "rotate-180" : ""}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>
              {expandedDevice === "config" && (
                <div className="px-4 pb-5 pt-3">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Personal Forward Email</label>
                      <input
                        type="email"
                        value={config.personalForwardEmail}
                        onChange={(e) => setConfig((p) => ({ ...p, personalForwardEmail: e.target.value }))}
                        placeholder="you@icloud.com or you@gmail.com"
                        className={inputClass}
                      />
                      <p className="text-xs text-white/60 mt-1">The personal email address where Cloudflare forwards copies of admin@ and support@ emails for device access.</p>
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Mailgun SMTP Username</label>
                      <input
                        type="text"
                        value={config.smtpUsername}
                        onChange={(e) => setConfig((p) => ({ ...p, smtpUsername: e.target.value }))}
                        placeholder="postmaster@zoobicon.com"
                        className={`${inputClass} font-mono`}
                      />
                      <p className="text-xs text-white/60 mt-1">Found in Mailgun &rarr; Sending &rarr; Domain settings &rarr; SMTP credentials. Usually <code className="bg-black/30 px-1 rounded text-white/60">postmaster@yourdomain.com</code>.</p>
                    </div>
                    <div>
                      <label className="block text-sm text-white/80 mb-1.5 font-medium">Mailgun SMTP Password</label>
                      <div className="relative">
                        <input
                          type={showKeys.smtpPassword ? "text" : "password"}
                          value={config.smtpPassword}
                          onChange={(e) => setConfig((p) => ({ ...p, smtpPassword: e.target.value }))}
                          placeholder="Enter your Mailgun SMTP password"
                          className={`${inputClass} pr-10 font-mono`}
                        />
                        <button onClick={() => toggleKey("smtpPassword")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                          {showKeys.smtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-white/60 mt-1">This is NOT your Mailgun API key. Go to Mailgun &rarr; Sending &rarr; Domain settings &rarr; SMTP credentials to find or create an SMTP password.</p>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      <p className="text-xs text-amber-300"><AlertTriangle className="w-3 h-3 inline mr-1" />These credentials are saved to localStorage for your reference only. They are NOT sent to any server. Use them when configuring your mail apps.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sub-section 5: Quick Reference Card */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedDevice(expandedDevice === "reference" ? null : "reference")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                  <Laptop2 className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-medium text-white/90">Quick Reference Card</span>
                  <p className="text-xs text-white/50 mt-0.5">All settings at a glance — copy and use when configuring devices</p>
                </div>
                <div className={`text-white/50 transition-transform ${expandedDevice === "reference" ? "rotate-180" : ""}`}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>
              {expandedDevice === "reference" && (
                <div className="px-4 pb-5 pt-1">
                  <div className="bg-black/30 rounded-lg p-4 font-mono text-xs space-y-3 overflow-x-auto">
                    <div>
                      <div className="text-white/50 mb-1.5 uppercase tracking-wider font-sans font-semibold" style={{ fontSize: "10px" }}>Incoming (via Cloudflare forwarding)</div>
                      <div className="space-y-1">
                        <div><span className="text-blue-400">admin@zoobicon.com</span> <span className="text-white/40">&rarr;</span> <span className="text-green-400">{config.personalForwardEmail || "your-personal@email.com"}</span></div>
                        <div><span className="text-blue-400">support@zoobicon.com</span> <span className="text-white/40">&rarr;</span> <span className="text-green-400">{config.personalForwardEmail || "your-personal@email.com"}</span></div>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="text-white/50 mb-1.5 uppercase tracking-wider font-sans font-semibold" style={{ fontSize: "10px" }}>Outgoing (via Mailgun SMTP)</div>
                      <div className="space-y-1">
                        <div><span className="text-white/50">Server:</span>    <span className="text-green-400">smtp.mailgun.org</span></div>
                        <div><span className="text-white/50">Port:</span>      <span className="text-green-400">587</span></div>
                        <div><span className="text-white/50">Encryption:</span> <span className="text-green-400">TLS / STARTTLS</span></div>
                        <div><span className="text-white/50">Auth:</span>      <span className="text-green-400">Password</span></div>
                        <div><span className="text-white/50">Username:</span>  <span className="text-green-400">{config.smtpUsername || "postmaster@zoobicon.com"}</span></div>
                        <div><span className="text-white/50">Password:</span>  <span className="text-green-400">{config.smtpPassword ? "********" : "[from Mailgun dashboard]"}</span></div>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="text-white/50 mb-1.5 uppercase tracking-wider font-sans font-semibold" style={{ fontSize: "10px" }}>AI Ticketing (unchanged)</div>
                      <div className="space-y-1">
                        <div><span className="text-white/50">Webhook:</span> <span className="text-cyan-400">https://zoobicon.com/api/email/webhook</span></div>
                        <div><span className="text-white/50">Mailgun catch-all still active for DB storage + AI auto-reply</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Configuration"}
          </button>
          <button onClick={handleTestEmail} disabled={testSending}
            className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-white/80 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
            {testSending ? "Sending..." : "Send Test Email"}
          </button>
        </div>

        {testResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 p-4 rounded-lg mb-6 ${testResult.ok ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
            {testResult.ok ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="text-sm">{testResult.message}</span>
          </motion.div>
        )}

        {/* Related Pages */}
        <div className="border-t border-white/10 pt-6 mt-8">
          <h3 className="text-sm font-medium text-white/60 mb-3">Related Pages</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/email" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white/80 transition-colors">Admin Inbox</Link>
            <Link href="/admin/mailboxes" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white/80 transition-colors">Mailboxes</Link>
            <Link href="/email-support" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white/80 transition-colors">Support Tickets</Link>
            <Link href="/admin/pre-launch" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white/80 transition-colors">Pre-Launch Checklist</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
