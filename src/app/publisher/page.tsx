"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe,
  Send,
  TrendingUp,
  BarChart3,
  Sparkles,
  Hash,
  Smile,
  Zap,
  Calendar,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Share2,
  Link2,
  Camera,
  Users,
  MessageSquare,
  Eye,
  Heart,
  Lightbulb,
  MessageCircle,
  MessageSquare,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

type Tab = "compose" | "feed" | "connections" | "ideas";

interface Platform {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  connected: boolean;
  followers: string;
}

interface RecentPost {
  id: string;
  content: string;
  platforms: string[];
  publishedAt: string;
  reach: number;
  likes: number;
  status: "published" | "scheduled" | "draft";
}

const PLATFORMS: Platform[] = [
  { id: "twitter", name: "Twitter / X", icon: Share2, color: "from-sky-500 to-blue-600", connected: true, followers: "2.4K" },
  { id: "linkedin", name: "LinkedIn", icon: Link2, color: "from-blue-600 to-blue-800", connected: true, followers: "1.8K" },
  { id: "instagram", name: "Instagram", icon: Camera, color: "from-pink-500 to-purple-600", connected: false, followers: "0" },
  { id: "tiktok", name: "TikTok", icon: Zap, color: "from-rose-500 to-pink-600", connected: false, followers: "0" },
  { id: "facebook", name: "Facebook", icon: Users, color: "from-blue-500 to-indigo-600", connected: true, followers: "890" },
  { id: "reddit", name: "Reddit", icon: MessageSquare, color: "from-orange-500 to-red-600", connected: false, followers: "0" },
];

const RECENT_POSTS: RecentPost[] = [
  { id: "p1", content: "Just launched AI-powered multi-page site generation. Build complete 6-page websites from a single prompt. The future of web development is here.", platforms: ["twitter", "linkedin"], publishedAt: "2026-03-22T10:00:00Z", reach: 1240, likes: 89, status: "published" },
  { id: "p2", content: "New feature: Visual editing with click-to-select. Edit fonts, colors, spacing, and content directly in the browser. No code required.", platforms: ["twitter", "linkedin", "facebook"], publishedAt: "2026-03-21T14:00:00Z", reach: 2100, likes: 156, status: "published" },
  { id: "p3", content: "We shipped 43 specialized generators this week. From restaurant menus to SaaS dashboards, each with its own AI-tuned prompt.", platforms: ["twitter"], publishedAt: "2026-03-20T09:00:00Z", reach: 890, likes: 67, status: "published" },
  { id: "p4", content: "Speed update: Our 7-agent pipeline now completes full-stack apps in 95 seconds. Database, API, and frontend included.", platforms: ["linkedin", "facebook"], publishedAt: "2026-03-19T11:00:00Z", reach: 1560, likes: 112, status: "published" },
  { id: "p5", content: "Why every small business needs a website in 2026 (and how AI makes it cost $0). New blog post dropping tomorrow.", platforms: ["twitter", "linkedin"], publishedAt: "2026-03-18T16:00:00Z", reach: 780, likes: 45, status: "published" },
  { id: "p6", content: "Agency partners: You can now generate, approve, and deploy client sites with full white-label branding. Zero attribution.", platforms: ["linkedin"], publishedAt: "2026-03-17T10:00:00Z", reach: 640, likes: 38, status: "published" },
  { id: "p7", content: "Comparing AI website builders: Why our Opus-powered pipeline produces noticeably better output than Sonnet-based competitors.", platforms: ["twitter", "linkedin", "facebook"], publishedAt: "2026-03-16T09:00:00Z", reach: 3200, likes: 234, status: "published" },
  { id: "p8", content: "E-commerce storefront generation is live. Shopping cart, checkout, product filters, wishlists, reviews, and discount codes.", platforms: ["twitter"], publishedAt: "2026-03-15T14:00:00Z", reach: 520, likes: 31, status: "published" },
  { id: "p9", content: "Announcing our Video Creator pipeline. AI script, storyboard, scene images, voiceover, and subtitles from a single description.", platforms: ["twitter", "linkedin"], publishedAt: "2026-03-25T10:00:00Z", reach: 0, likes: 0, status: "scheduled" },
  { id: "p10", content: "Case study: How one agency built 200 client sites in a month using our bulk generation workflow.", platforms: ["linkedin"], publishedAt: "", reach: 0, likes: 0, status: "draft" },
];

const AI_IDEAS = [
  { title: "Behind-the-scenes: How our 7-agent pipeline works", type: "Thread" },
  { title: "5 website mistakes that cost businesses $10K/year", type: "Post" },
  { title: "AI vs. Traditional Web Design: A cost comparison", type: "Infographic" },
  { title: "Tutorial: Build a SaaS landing page in 90 seconds", type: "Video" },
  { title: "The future of AI-generated websites in 2027", type: "Article" },
];

export default function PublisherPage() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const [tab, setTab] = useState<Tab>("compose");
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(["twitter", "linkedin"]));
  const [enhancing, setEnhancing] = useState(false);

  const togglePlatform = (id: string) => {
    const next = new Set(selectedPlatforms);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPlatforms(next);
  };

  const enhance = (type: string) => {
    setEnhancing(true);
    setTimeout(() => setEnhancing(false), 1500);
  };

  const connectedCount = PLATFORMS.filter((p) => p.connected).length;
  const totalReach = RECENT_POSTS.filter((p) => p.status === "published").reduce((s, p) => s + p.reach, 0);
  const totalEngagement = RECENT_POSTS.filter((p) => p.status === "published").reduce((s, p) => s + p.likes, 0);
  const publishedCount = RECENT_POSTS.filter((p) => p.status === "published").length;

  const statusColor = (s: string) => {
    if (s === "published") return "bg-emerald-500/20 text-emerald-400";
    if (s === "scheduled") return "bg-blue-500/20 text-blue-400";
    return "bg-white/10 text-white/40";
  };

  const STAT_CARDS = [
    { label: "Posts Published", value: String(publishedCount), icon: Send, color: "from-indigo-500 to-purple-600" },
    { label: "Total Reach", value: totalReach >= 1000 ? `${(totalReach / 1000).toFixed(1)}K` : String(totalReach), icon: Eye, color: "from-emerald-500 to-teal-600" },
    { label: "Engagement Rate", value: totalReach > 0 ? `${((totalEngagement / totalReach) * 100).toFixed(1)}%` : "0%", icon: Heart, color: "from-rose-500 to-pink-600" },
    { label: "Platforms", value: String(connectedCount), icon: Globe, color: "from-cyan-500 to-blue-600" },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: "compose", label: "Compose" },
    { key: "feed", label: "Recent Posts" },
    { key: "connections", label: "Platforms" },
    { key: "ideas", label: "AI Ideas" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Zoobicon</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</Link>
            {user ? (
              <button onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} setUser(null); }} className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
            ) : (
              <Link href="/auth/login" className="text-sm text-white/60 hover:text-white transition-colors">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-fuchsia-600/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600"><Globe className="w-6 h-6" /></div>
              <span className="text-sm font-medium text-white/50 uppercase tracking-wider">Business OS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Publish Everywhere</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl">One post. Every platform. AI-optimized. Write once, publish to X, LinkedIn, Instagram, TikTok, Facebook, and Reddit.</p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Stats */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/50">{s.label}</span>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.color}`}><s.icon className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t.key ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>{t.label}</button>
          ))}
        </div>

        {/* Compose */}
        {tab === "compose" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post... or let AI help you"
                className="w-full h-36 bg-transparent text-sm text-white placeholder:text-white/30 resize-none focus:outline-none"
              />
              <div className="flex items-center gap-2 mt-2 border-t border-white/5 pt-3">
                <button onClick={() => enhance("viral")} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> Make it viral
                </button>
                <button onClick={() => enhance("pro")} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors flex items-center gap-1">
                  <Smile className="w-3.5 h-3.5 text-blue-400" /> Professional tone
                </button>
                <button onClick={() => enhance("hash")} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-amber-400" /> Add hashtags
                </button>
                {enhancing && <div className="w-4 h-4 border-2 border-white/30 border-t-fuchsia-400 rounded-full animate-spin" />}
              </div>
            </motion.div>

            {/* Platform Toggles */}
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/50 mb-3">Publish to</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => p.connected && togglePlatform(p.id)}
                    disabled={!p.connected}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      selectedPlatforms.has(p.id)
                        ? "bg-white/10 border-white/20"
                        : p.connected
                        ? "bg-white/[0.02] border-white/5 hover:border-white/10"
                        : "bg-white/[0.01] border-white/5 opacity-40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${p.color}`}><p.icon className="w-3.5 h-3.5" /></div>
                      <span className="text-sm font-medium">{p.name}</span>
                      {selectedPlatforms.has(p.id) && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                      {!p.connected && <span className="text-[10px] text-white/30 ml-auto">Not connected</span>}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Schedule + Publish */}
            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <button onClick={() => {}} className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                <Send className="w-4 h-4" /> Publish Now
              </button>
              <button onClick={() => {}} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/50" /> Schedule
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Feed */}
        {tab === "feed" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            {RECENT_POSTS.map((p) => (
              <motion.div key={p.id} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-1.5">
                    {p.platforms.map((pl) => {
                      const platform = PLATFORMS.find((x) => x.id === pl);
                      if (!platform) return null;
                      return (
                        <div key={pl} className={`p-1 rounded bg-gradient-to-br ${platform.color}`}>
                          <platform.icon className="w-3 h-3" />
                        </div>
                      );
                    })}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status}</span>
                </div>
                <p className="text-sm text-white/70 mb-3">{p.content}</p>
                <div className="flex items-center gap-4 text-xs text-white/30">
                  {p.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                  {p.reach > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {p.reach.toLocaleString()} reach</span>}
                  {p.likes > 0 && <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {p.likes}</span>}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Connections */}
        {tab === "connections" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            {PLATFORMS.map((p) => (
              <motion.div key={p.id} variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${p.color}`}><p.icon className="w-5 h-5" /></div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.connected && <p className="text-xs text-white/40">{p.followers} followers</p>}
                  </div>
                </div>
                <button onClick={() => {}} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  p.connected
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                }`}>
                  {p.connected ? "Connected" : "Connect"}
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* AI Ideas */}
        {tab === "ideas" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-400" /> AI Content Ideas
              </h3>
              <p className="text-sm text-white/40 mb-4">Based on your industry and past performance, here are content ideas for this week.</p>
              <div className="space-y-3">
                {AI_IDEAS.map((idea, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/40">{i + 1}</span>
                      <p className="text-sm font-medium">{idea.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/40">{idea.type}</span>
                      <button onClick={() => {}} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs hover:bg-white/10 transition-colors">
                        Draft
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>

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
