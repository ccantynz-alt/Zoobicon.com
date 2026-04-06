"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  Users,
  BarChart3,
  MousePointerClick,
  Send,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Zap,
  Eye,
  Plus,
  LayoutDashboard,
  LogOut,
  Play,
  Pause,
  Code2,
  ArrowUpRight,
} from "lucide-react";
import {
  getSubscribers,
  getCampaigns,
  getAutomations,
  getEmailStats,
  getFormEmbedCode,
  SUBSCRIBER_GROWTH,
  type Subscriber,
  type Campaign,
  type Automation,
} from "@/lib/email-marketing";

/* ── animation helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

/* ── tab type ── */
type Tab = "campaigns" | "subscribers" | "automations" | "forms";

export default function EmailMarketingPage() {
  /* auth */
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  /* data */
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState({ totalSubscribers: 1247, avgOpenRate: 42.3, avgClickRate: 8.7, totalCampaignsSent: 23, monthlyGrowth: 0, activeAutomations: 0 });

  useEffect(() => {
    setSubscribers(getSubscribers());
    setCampaigns(getCampaigns());
    setAutomations(getAutomations());
    setStats(getEmailStats());
  }, []);

  /* ui state */
  const [tab, setTab] = useState<Tab>("campaigns");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [formStyle, setFormStyle] = useState<"inline" | "popup" | "slide-in" | "full-page">("inline");

  const copyEmbed = () => {
    const code = getFormEmbedCode(formStyle, {
      headline: "Stay in the loop",
      description: "Get the latest updates straight to your inbox.",
      buttonText: "Subscribe",
      primaryColor: "#6366f1",
      bgColor: "#1a1a2e",
      textColor: "#ffffff",
    });
    navigator.clipboard.writeText(code);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  const STAT_CARDS = [
    { label: "Total Subscribers", value: stats.totalSubscribers.toLocaleString(), icon: Users, color: "from-indigo-500 to-purple-600" },
    { label: "Open Rate", value: `${stats.avgOpenRate}%`, icon: Eye, color: "from-emerald-500 to-teal-600" },
    { label: "Click Rate", value: `${stats.avgClickRate}%`, icon: MousePointerClick, color: "from-cyan-500 to-blue-600" },
    { label: "Campaigns Sent", value: String(stats.totalCampaignsSent), icon: Send, color: "from-rose-500 to-pink-600" },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: "campaigns", label: "Campaigns" },
    { key: "subscribers", label: "Subscribers" },
    { key: "automations", label: "Automations" },
    { key: "forms", label: "Sign-up Forms" },
  ];

  const statusColor = (s: string) => {
    if (s === "sent" || s === "active") return "bg-emerald-500/20 text-emerald-400";
    if (s === "scheduled") return "bg-blue-500/20 text-blue-400";
    if (s === "unsubscribed") return "bg-red-500/20 text-red-400";
    return "bg-white/10 text-white/60";
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Zoobicon
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            {user ? (
              <button
                onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} setUser(null); }}
                className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            ) : (
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Mail className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-white/50 uppercase tracking-wider">Business OS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Email Marketing
              </span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl">
              Grow your audience, powered by AI. Build lists, write campaigns, and automate follow-ups — all from one dashboard.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* ── Stats ── */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">{s.label}</span>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Subscriber Growth ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Subscriber Growth</h3>
          <div className="flex items-end gap-2 h-40">
            {SUBSCRIBER_GROWTH.map((d, i) => {
              const max = Math.max(...SUBSCRIBER_GROWTH.map((g) => g.count));
              const h = (d.count / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-white/40">{d.count}</span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-purple-500 transition-all"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[10px] text-white/30 truncate w-full text-center">{d.month.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 border-b border-white/10 pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {tab === "campaigns" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            {/* AI Campaign Writer */}
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> AI Campaign Writer
              </h3>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your campaign... e.g. 'Announce our spring sale with 30% off all plans'"
                className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleGenerate}
                  disabled={generating || !aiPrompt.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate with AI
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Campaigns Table */}
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Campaigns</h3>
                <button onClick={() => {}} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> New Campaign
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-left">
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Subject</th>
                      <th className="px-6 py-3 font-medium">Sent</th>
                      <th className="px-6 py-3 font-medium">Open Rate</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.slice(0, 6).map((c) => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3 font-medium">{c.name}</td>
                        <td className="px-6 py-3 text-white/60 max-w-xs truncate">{c.subject}</td>
                        <td className="px-6 py-3 text-white/50">
                          {c.sentAt
                            ? new Date(c.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : c.scheduledFor
                            ? new Date(c.scheduledFor).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : "—"}
                        </td>
                        <td className="px-6 py-3 text-white/50">{c.openRate ? `${c.openRate}%` : "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {tab === "subscribers" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold">Subscribers ({subscribers.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 text-left">
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium">Source</th>
                      <th className="px-6 py-3 font-medium">Tags</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-3 font-medium">{s.name}</td>
                        <td className="px-6 py-3 text-white/60">{s.email}</td>
                        <td className="px-6 py-3 text-white/50 capitalize">{s.source.replace("-", " ")}</td>
                        <td className="px-6 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {s.tags.map((t) => (
                              <span key={t} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/50">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor(s.status)}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}

        {tab === "automations" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            {automations.map((a) => (
              <motion.div key={a.id} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      {a.name}
                    </h4>
                    <p className="text-sm text-white/50 mt-1">{a.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${a.active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/40"}`}>
                      {a.active ? "Active" : "Paused"}
                    </span>
                    <button onClick={() => {}} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      {a.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="text-sm text-white/40 mb-3">
                  <span className="text-white/60">Trigger:</span> {a.trigger} &middot; <span className="text-white/60">{a.sent}</span> emails sent
                </div>
                <div className="flex gap-2 flex-wrap">
                  {a.emails.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs">
                      <Mail className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-white/70">{e.subject}</span>
                      <span className="text-white/30">&middot; {e.delay}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === "forms" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Sign-up Form Builder</h3>
              <p className="text-sm text-white/50 mb-4">Choose a form style and embed it on your website to collect subscribers.</p>
              <div className="flex gap-2 mb-6">
                {(["inline", "popup", "slide-in", "full-page"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFormStyle(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                      formStyle === s ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "bg-white/5 text-white/50 border border-white/10 hover:text-white/70"
                    }`}
                  >
                    {s.replace("-", " ")}
                  </button>
                ))}
              </div>
              {/* Preview */}
              <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-8 mb-4">
                <h4 className="text-lg font-bold mb-1">Stay in the loop</h4>
                <p className="text-sm text-white/50 mb-4">Get the latest updates straight to your inbox.</p>
                <div className="flex gap-2">
                  <input
                    disabled
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/50"
                  />
                  <button onClick={() => {}} className="px-5 py-2.5 bg-indigo-500 rounded-lg text-sm font-semibold">Subscribe</button>
                </div>
              </div>
              <button
                onClick={copyEmbed}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
              >
                {embedCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Code2 className="w-4 h-4 text-white/50" />}
                {embedCopied ? "Copied!" : "Copy Embed Code"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">&copy; {new Date().getFullYear()} Zoobicon. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-white/30 hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-sm text-white/30 hover:text-white/60 transition-colors">Terms</Link>
            <Link href="/support" className="text-sm text-white/30 hover:text-white/60 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
