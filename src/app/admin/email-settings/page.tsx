"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail, Save, CheckCircle2, AlertTriangle, ArrowLeft,
  Server, Shield, Send, Eye, EyeOff, Loader2, TestTube,
  Globe, Key, Bell, Settings,
} from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

interface EmailConfig {
  adminEmail: string;
  notificationEmail: string;
  resendApiKey: string;
  mailgunApiKey: string;
  mailgunDomain: string;
  fromName: string;
  fromAddress: string;
  notifyOnSignup: boolean;
  notifyOnDeploy: boolean;
  notifyOnContact: boolean;
  notifyOnWaitlist: boolean;
}

export default function AdminEmailSettingsPage() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [config, setConfig] = useState<EmailConfig>({
    adminEmail: "",
    notificationEmail: "",
    resendApiKey: "",
    mailgunApiKey: "",
    mailgunDomain: "",
    fromName: "Zoobicon",
    fromAddress: "noreply@zoobicon.com",
    notifyOnSignup: true,
    notifyOnDeploy: true,
    notifyOnContact: true,
    notifyOnWaitlist: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const s = localStorage.getItem("zoobicon_user");
      if (s) setUser(JSON.parse(s));
    } catch { /* */ }

    // Load saved config from localStorage
    try {
      const saved = localStorage.getItem("zoobicon_email_config");
      if (saved) {
        setConfig((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch { /* */ }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Save to localStorage for persistence
    localStorage.setItem("zoobicon_email_config", JSON.stringify(config));
    // Simulate API call
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
      const res = await fetch("/api/email/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: targetEmail,
          subject: "[Zoobicon] Test Email - Configuration Verified",
          text: "This is a test email from your Zoobicon admin panel. If you received this, your email configuration is working correctly.",
          html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#131520;color:#fff;border-radius:16px">
            <h1 style="font-size:22px;font-weight:800;margin:0 0 16px">Email Configuration Test</h1>
            <p style="color:rgba(255,255,255,0.7);line-height:1.6">This is a test email from your Zoobicon admin panel. If you received this, your email configuration is working correctly.</p>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:24px">Sent at ${new Date().toISOString()}</p>
          </div>`,
        }),
      });
      if (res.ok) {
        setTestResult({ ok: true, message: `Test email sent to ${targetEmail}` });
      } else {
        setTestResult({ ok: false, message: "Failed to send test email. Check your API keys." });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error. Email service may not be configured." });
    }
    setTestSending(false);
  };

  const toggleKey = (key: string) => setShowKeys((p) => ({ ...p, [key]: !p[key] }));

  const maskKey = (val: string) => val ? val.substring(0, 8) + "..." + val.substring(val.length - 4) : "";

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
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Email Configuration</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Set up your admin email address and notification preferences</p>
          </div>
        </div>

        {/* Admin Email Section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Globe className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Admin Email Addresses</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">Primary Admin Email</label>
              <input
                type="email" value={config.adminEmail}
                onChange={(e) => setConfig((p) => ({ ...p, adminEmail: e.target.value }))}
                placeholder="admin@zoobicon.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1">Used for admin login and as fallback for notifications. Maps to ADMIN_EMAIL env var.</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">Notification Email (optional)</label>
              <input
                type="email" value={config.notificationEmail}
                onChange={(e) => setConfig((p) => ({ ...p, notificationEmail: e.target.value }))}
                placeholder="notifications@zoobicon.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <p className="text-xs text-zinc-500 mt-1">Separate email for receiving notifications. Falls back to primary admin email if empty.</p>
            </div>
          </div>
        </motion.div>

        {/* Sender Identity */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
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
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">From Address</label>
              <input
                type="email" value={config.fromAddress}
                onChange={(e) => setConfig((p) => ({ ...p, fromAddress: e.target.value }))}
                placeholder="noreply@zoobicon.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* API Keys */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Key className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Email Service API Keys</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">Resend API Key</label>
              <div className="relative">
                <input
                  type={showKeys.resend ? "text" : "password"}
                  value={config.resendApiKey}
                  onChange={(e) => setConfig((p) => ({ ...p, resendApiKey: e.target.value }))}
                  placeholder="re_..."
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                />
                <button onClick={() => toggleKey("resend")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showKeys.resend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Primary email service for admin notifications (signups, deploys, contact forms).</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">Mailgun API Key</label>
              <div className="relative">
                <input
                  type={showKeys.mailgun ? "text" : "password"}
                  value={config.mailgunApiKey}
                  onChange={(e) => setConfig((p) => ({ ...p, mailgunApiKey: e.target.value }))}
                  placeholder="key-..."
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
                />
                <button onClick={() => toggleKey("mailgun")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                  {showKeys.mailgun ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Used for support ticket email (inbound/outbound via webhook).</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5 font-medium">Mailgun Domain</label>
              <input
                type="text" value={config.mailgunDomain}
                onChange={(e) => setConfig((p) => ({ ...p, mailgunDomain: e.target.value }))}
                placeholder="mail.zoobicon.com"
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Notification Preferences */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "notifyOnSignup" as const, label: "New user signups", desc: "Get notified when someone creates an account" },
              { key: "notifyOnDeploy" as const, label: "Site deployments", desc: "Get notified when a site is deployed to zoobicon.sh" },
              { key: "notifyOnContact" as const, label: "Contact form submissions", desc: "Get notified when someone submits a contact form" },
              { key: "notifyOnWaitlist" as const, label: "Waitlist signups", desc: "Get notified when someone joins a product waitlist" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-zinc-200 font-medium">{label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => setConfig((p) => ({ ...p, [key]: !p[key] }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${config[key] ? "bg-blue-600" : "bg-zinc-700"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config[key] ? "left-6" : "left-1"}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Environment Variable Reference */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold">Environment Variables Reference</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            These settings map to environment variables in your <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs text-cyan-300">.env.local</code> file.
            For production, set these in your Vercel/hosting dashboard.
          </p>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-xs space-y-1.5 overflow-x-auto">
            <div><span className="text-zinc-500"># Admin credentials</span></div>
            <div><span className="text-blue-400">ADMIN_EMAIL</span><span className="text-zinc-500">=</span><span className="text-green-400">{config.adminEmail || "admin@zoobicon.com"}</span></div>
            <div><span className="text-blue-400">ADMIN_NOTIFICATION_EMAIL</span><span className="text-zinc-500">=</span><span className="text-green-400">{config.notificationEmail || config.adminEmail || "admin@zoobicon.com"}</span></div>
            <div className="pt-2"><span className="text-zinc-500"># Email services</span></div>
            <div><span className="text-blue-400">RESEND_API_KEY</span><span className="text-zinc-500">=</span><span className="text-green-400">{config.resendApiKey ? maskKey(config.resendApiKey) : "re_xxxxx"}</span></div>
            <div><span className="text-blue-400">MAILGUN_API_KEY</span><span className="text-zinc-500">=</span><span className="text-green-400">{config.mailgunApiKey ? maskKey(config.mailgunApiKey) : "key-xxxxx"}</span></div>
            <div><span className="text-blue-400">MAILGUN_DOMAIN</span><span className="text-zinc-500">=</span><span className="text-green-400">{config.mailgunDomain || "mail.zoobicon.com"}</span></div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-3 mb-12">
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
        <div className="border-t border-white/10 pt-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Related Pages</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/email" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Admin Inbox</Link>
            <Link href="/admin/mailboxes" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Mailboxes</Link>
            <Link href="/admin/support" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Support Dashboard</Link>
            <Link href="/email-support" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Email Support UI</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
