"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail, Save, CheckCircle2, AlertTriangle, ArrowLeft,
  Server, Send, Eye, EyeOff, Loader2, TestTube,
  Globe, Key, Bell, Bot, Shield, ExternalLink,
  Copy, Check, Info, Zap,
} from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

interface EmailConfig {
  adminEmail: string;
  supportEmail: string;
  mailgunApiKey: string;
  mailgunDomain: string;
  fromName: string;
  fromAddress: string;
  notifyOnSignup: boolean;
  notifyOnDeploy: boolean;
  notifyOnContact: boolean;
  notifyOnWaitlist: boolean;
  aiAutoReply: boolean;
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
    description: "In Mailgun → Receiving → Create Route. Match recipient: admin@zoobicon.com → Forward to: https://zoobicon.com/api/email/inbox (webhook). Create a second route for support@zoobicon.com → Forward to: https://zoobicon.com/api/email/support/inbound.",
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
    description: "Get your API key from Mailgun → Settings → API Keys. Add MAILGUN_API_KEY and MAILGUN_DOMAIN to your Vercel environment variables.",
    link: "https://app.mailgun.com/settings/api_security",
  },
];

export default function AdminEmailSettingsPage() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [config, setConfig] = useState<EmailConfig>({
    adminEmail: "admin@zoobicon.com",
    supportEmail: "support@zoobicon.com",
    mailgunApiKey: "",
    mailgunDomain: "",
    fromName: "Zoobicon",
    fromAddress: "noreply@zoobicon.com",
    notifyOnSignup: true,
    notifyOnDeploy: true,
    notifyOnContact: true,
    notifyOnWaitlist: true,
    aiAutoReply: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

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
      const res = await fetch("/api/email/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: config.adminEmail,
          subject: "[Zoobicon] Test Email - Configuration Verified",
          text: "This is a test email from your Zoobicon admin panel. If you received this, your Mailgun configuration is working correctly.",
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#131520;color:#fff;border-radius:16px">
            <h1 style="font-size:22px;font-weight:800;margin:0 0 16px">Email Configuration Test</h1>
            <p style="color:rgba(255,255,255,0.7);line-height:1.6">This is a test email from your Zoobicon admin panel. Your Mailgun configuration is working correctly.</p>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:24px">Sent at ${new Date().toISOString()}</p>
          </div>`,
        }),
      });
      if (res.ok) {
        setTestResult({ ok: true, message: `Test email sent to ${config.adminEmail}` });
      } else {
        setTestResult({ ok: false, message: "Failed to send. Check your Mailgun API key and domain." });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error. Mailgun may not be configured yet." });
    }
    setTestSending(false);
  };

  const toggleKey = (key: string) => setShowKeys((p) => ({ ...p, [key]: !p[key] }));
  const maskKey = (val: string) => val ? val.substring(0, 8) + "..." + val.substring(val.length - 4) : "";
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="min-h-screen bg-[#131520] text-white">
      <BackgroundEffects />

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/10 bg-zinc-800/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Admin</span>
            </Link>
            <span className="text-zinc-600">/</span>
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
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Email Configuration</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Mailgun-powered email for admin inbox, support tickets, and AI replies — no Google Workspace needed</p>
          </div>
        </div>

        {/* Architecture Overview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">How It Works — All Mailgun, Zero Google</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/[0.06] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-blue-300">Admin Inbox</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <span className="text-white/80 font-mono text-[11px]">admin@zoobicon.com</span> → Mailgun receives it → webhook sends to <span className="text-cyan-400 font-mono text-[11px]">/api/email/inbox</span> → appears in <span className="text-cyan-400 font-mono text-[11px]">/admin/email</span>
              </p>
            </div>
            <div className="bg-white/[0.06] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-purple-300">Support Tickets</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <span className="text-white/80 font-mono text-[11px]">support@zoobicon.com</span> → Mailgun receives it → webhook sends to <span className="text-cyan-400 font-mono text-[11px]">/api/email/support/inbound</span> → ticket created in <span className="text-cyan-400 font-mono text-[11px]">/email-support</span> → AI drafts reply
              </p>
            </div>
            <div className="bg-white/[0.06] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-green-400" />
                <span className="font-semibold text-green-300">Outbound</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                All outbound emails (notifications, replies, password resets) sent via Mailgun API from <span className="text-white/80 font-mono text-[11px]">noreply@zoobicon.com</span>. Zoobicon controls everything.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <span>Total cost: <strong className="text-white/80">$0/month</strong> on Mailgun free tier (5,000 emails/month). No Google Workspace, no per-seat charges.</span>
          </div>
        </motion.div>

        {/* Setup Guide */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold">Setup Guide — 5 Steps</h2>
          </div>
          <div className="space-y-2">
            {SETUP_STEPS.map((s) => (
              <div key={s.step} className="border border-white/5 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expandedStep === s.step ? null : s.step)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                    {s.step}
                  </div>
                  <span className="text-sm font-medium text-zinc-200 flex-1 text-left">{s.title}</span>
                  <div className={`text-zinc-500 transition-transform ${expandedStep === s.step ? "rotate-180" : ""}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </button>
                {expandedStep === s.step && (
                  <div className="px-4 pb-4 pl-14">
                    <p className="text-xs text-zinc-400 leading-relaxed">{s.description}</p>
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

        {/* Email Addresses */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Email Addresses</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">Admin Email</label>
              <input
                type="email" value={config.adminEmail}
                onChange={(e) => setConfig((p) => ({ ...p, adminEmail: e.target.value }))}
                placeholder="admin@zoobicon.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1">Your main inbox. Mailgun routes emails here → <code className="text-cyan-400/70">/admin/email</code></p>
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">Support Email</label>
              <input
                type="email" value={config.supportEmail}
                onChange={(e) => setConfig((p) => ({ ...p, supportEmail: e.target.value }))}
                placeholder="support@zoobicon.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1">Customer-facing support. Creates tickets in <code className="text-cyan-400/70">/email-support</code> with AI auto-reply.</p>
            </div>
          </div>
        </motion.div>

        {/* Sender Identity */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Send className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold">Sender Identity</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">From Name</label>
              <input
                type="text" value={config.fromName}
                onChange={(e) => setConfig((p) => ({ ...p, fromName: e.target.value }))}
                placeholder="Zoobicon"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">From Address (outbound)</label>
              <input
                type="email" value={config.fromAddress}
                onChange={(e) => setConfig((p) => ({ ...p, fromAddress: e.target.value }))}
                placeholder="noreply@zoobicon.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Mailgun API Key */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Key className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Mailgun API Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">Mailgun API Key</label>
              <div className="relative">
                <input
                  type={showKeys.mailgun ? "text" : "password"}
                  value={config.mailgunApiKey}
                  onChange={(e) => setConfig((p) => ({ ...p, mailgunApiKey: e.target.value }))}
                  placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                />
                <button onClick={() => toggleKey("mailgun")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showKeys.mailgun ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Found at Mailgun → Settings → API Keys. This one key handles all sending and receiving.</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">Mailgun Domain</label>
              <input
                type="text" value={config.mailgunDomain}
                onChange={(e) => setConfig((p) => ({ ...p, mailgunDomain: e.target.value }))}
                placeholder="mail.zoobicon.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1">The verified sending domain in your Mailgun account. Can be a subdomain like mail.zoobicon.com or the root zoobicon.com.</p>
            </div>
          </div>
        </motion.div>

        {/* AI & Notification Preferences */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Notifications & AI</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "aiAutoReply" as const, label: "AI auto-reply on support tickets", desc: "Zoobicon AI drafts a reply when a customer emails support@zoobicon.com", icon: Bot, highlight: true },
              { key: "notifyOnSignup" as const, label: "New user signups", desc: "Get notified at admin@zoobicon.com when someone creates an account" },
              { key: "notifyOnDeploy" as const, label: "Site deployments", desc: "Get notified when a site is deployed to zoobicon.sh" },
              { key: "notifyOnContact" as const, label: "Contact form submissions", desc: "Get notified when someone submits a contact form" },
              { key: "notifyOnWaitlist" as const, label: "Waitlist signups", desc: "Get notified when someone joins a product waitlist" },
            ].map(({ key, label, desc, icon: Icon, highlight }) => (
              <div key={key} className={`flex items-center justify-between py-3 border-b border-white/5 last:border-0 ${highlight ? "bg-purple-500/[0.04] -mx-2 px-2 rounded-lg" : ""}`}>
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="w-4 h-4 text-purple-400 shrink-0" />}
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">{label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig((p) => ({ ...p, [key]: !p[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config[key] ? "bg-blue-600" : "bg-zinc-700"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config[key] ? "left-6" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Environment Variables */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">Environment Variables</h2>
            </div>
            <button
              onClick={() => copyText(
                `# Email (Mailgun only — no Google Workspace needed)\nMAILGUN_API_KEY=${config.mailgunApiKey || "key-xxxxx"}\nMAILGUN_DOMAIN=${config.mailgunDomain || "mail.zoobicon.com"}\nADMIN_EMAIL=${config.adminEmail || "admin@zoobicon.com"}\nADMIN_NOTIFICATION_EMAIL=${config.adminEmail || "admin@zoobicon.com"}`,
                "envblock"
              )}
              className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 bg-cyan-500/5 rounded-lg px-3 py-1.5 transition-all"
            >
              {copied === "envblock" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === "envblock" ? "Copied!" : "Copy all"}
            </button>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Add these to your <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-cyan-300">.env.local</code> file or Vercel dashboard.
          </p>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
            <div><span className="text-zinc-500"># Email (Mailgun only — no Google Workspace needed)</span></div>
            <div><span className="text-blue-400">MAILGUN_API_KEY</span><span className="text-zinc-500">=</span><span className="text-green-400">{config.mailgunApiKey ? maskKey(config.mailgunApiKey) : "key-xxxxx"}</span></div>
            <div><span className="text-blue-400">MAILGUN_DOMAIN</span><span className="text-zinc-500">=</span><span className="text-green-400">{config.mailgunDomain || "mail.zoobicon.com"}</span></div>
            <div><span className="text-blue-400">ADMIN_EMAIL</span><span className="text-zinc-500">=</span><span className="text-green-400">{config.adminEmail || "admin@zoobicon.com"}</span></div>
            <div><span className="text-blue-400">ADMIN_NOTIFICATION_EMAIL</span><span className="text-zinc-500">=</span><span className="text-green-400">{config.adminEmail || "admin@zoobicon.com"}</span></div>
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>Resend (RESEND_API_KEY) is optional — only needed if you want a separate service for transactional emails like password resets. Mailgun handles everything if you prefer one service.</span>
          </div>
        </motion.div>

        {/* Mailgun Inbound Routes Reference */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Globe className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-semibold">Mailgun Inbound Routes</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-4">Create these two routes in your Mailgun dashboard under Receiving → Routes.</p>
          <div className="space-y-3">
            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-400">Route 1: Admin Inbox</span>
                <button onClick={() => copyText(`match_recipient("admin@zoobicon.com")`, "route1")}
                  className="text-zinc-500 hover:text-white transition-colors">
                  {copied === "route1" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="font-mono text-[11px] space-y-1">
                <div><span className="text-zinc-500">Match: </span><span className="text-amber-300">match_recipient(&quot;{config.adminEmail || "admin@zoobicon.com"}&quot;)</span></div>
                <div><span className="text-zinc-500">Action: </span><span className="text-green-400">forward(&quot;https://zoobicon.com/api/email/inbox&quot;)</span></div>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-400">Route 2: Support Tickets</span>
                <button onClick={() => copyText(`match_recipient("support@zoobicon.com")`, "route2")}
                  className="text-zinc-500 hover:text-white transition-colors">
                  {copied === "route2" ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="font-mono text-[11px] space-y-1">
                <div><span className="text-zinc-500">Match: </span><span className="text-amber-300">match_recipient(&quot;{config.supportEmail || "support@zoobicon.com"}&quot;)</span></div>
                <div><span className="text-zinc-500">Action: </span><span className="text-green-400">forward(&quot;https://zoobicon.com/api/email/support/inbound&quot;)</span></div>
              </div>
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
            className="flex items-center gap-2 border border-white/10 hover:bg-white/5 text-zinc-300 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
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

        {/* Quick Links */}
        <div className="border-t border-white/10 pt-6 mt-8">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Related Pages</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/email" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Admin Inbox</Link>
            <Link href="/admin/mailboxes" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Mailboxes</Link>
            <Link href="/email-support" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Support Tickets</Link>
            <Link href="/admin/pre-launch" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Pre-Launch Checklist</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
