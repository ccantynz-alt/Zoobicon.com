"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Eye,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Plus,
  BarChart3,
  Globe,
  Calendar,
  Clock,
  LayoutDashboard,
  LogOut,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  getPosts,
  getBlogStats,
  getKeywordRankings,
  getCalendarData,
  type BlogPost,
  type KeywordRank,
} from "@/lib/blog-engine";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

type Tab = "writer" | "posts" | "seo" | "calendar";

const TONES = ["Professional", "Casual", "Technical", "Persuasive", "Educational", "Storytelling"];
const LENGTHS = ["Short (~500 words)", "BookOpen (~1,000 words)", "Long (~2,000 words)", "Comprehensive (~3,000 words)"];

export default function BlogEnginePage() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [keywords, setKeywords] = useState<KeywordRank[]>([]);
  const [stats, setStats] = useState({ totalPosts: 12, totalViews: 8430, avgSeoScore: 84, impressions: 23000 });
  const [tab, setTab] = useState<Tab>("writer");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("BookOpen (~1,000 words)");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setPosts(getPosts());
    setKeywords(getKeywordRankings());
    const s = getBlogStats();
    setStats({ totalPosts: s.totalPosts || 12, totalViews: s.totalViews || 8430, avgSeoScore: s.avgSeoScore || 84, impressions: s.impressions || 23000 });
  }, []);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2500);
  };

  const statusColor = (s: string) => {
    if (s === "published") return "bg-stone-500/20 text-stone-400";
    if (s === "scheduled") return "bg-stone-500/20 text-stone-400";
    return "bg-white/10 text-white/40";
  };

  const seoScoreColor = (score: number) => {
    if (score >= 85) return "text-stone-400";
    if (score >= 70) return "text-stone-400";
    return "text-stone-400";
  };

  const STAT_CARDS = [
    { label: "Total Posts", value: String(stats.totalPosts), icon: FileText, color: "from-stone-500 to-stone-600" },
    { label: "Total Views", value: stats.totalViews.toLocaleString(), icon: Eye, color: "from-stone-500 to-stone-600" },
    { label: "Avg SEO Score", value: String(stats.avgSeoScore), icon: BarChart3, color: "from-stone-500 to-stone-600" },
    { label: "Search Impressions", value: stats.impressions >= 1000 ? `${(stats.impressions / 1000).toFixed(0)}K` : String(stats.impressions), icon: Globe, color: "from-stone-500 to-stone-600" },
  ];

  const TABS: { key: Tab; label: string }[] = [
    { key: "writer", label: "AI Writer" },
    { key: "posts", label: "Posts" },
    { key: "seo", label: "SEO Dashboard" },
    { key: "calendar", label: "Content Calendar" },
  ];

  /* Calendar data for March 2026 */
  const calendarPosts = getCalendarData();
  const MARCH_DAYS = 31;
  const MARCH_START_DAY = 6; // March 1 2026 is a Sunday (index 0), actually let's compute
  const firstDay = new Date(2026, 2, 1).getDay(); // 0 = Sunday
  const calendarCells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    if (day < 1 || day > MARCH_DAYS) return null;
    return day;
  });

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">Zoobicon</Link>
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
        <div className="absolute inset-0 bg-gradient-to-br from-stone-600/10 via-stone-600/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 py-16 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-stone-500 to-stone-600"><FileText className="w-6 h-6" /></div>
              <span className="text-sm font-medium text-white/50 uppercase tracking-wider">Business OS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">AI Blog Engine</span>
            </h1>
            <p className="text-lg text-white/50 max-w-2xl">Write once, rank everywhere. AI-powered blog creation with auto-SEO, keyword tracking, and cross-platform publishing.</p>
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

        {/* AI Writer */}
        {tab === "writer" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-stone-400" /> AI Post Writer
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 block mb-1.5">Topic / Title</label>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 'How to build a SaaS landing page that converts'"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/50 block mb-1.5">Tone</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                    >
                      {TONES.map((t) => <option key={t} value={t} className="bg-[#0f2148]">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/50 block mb-1.5">Length</label>
                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                    >
                      {LENGTHS.map((l) => <option key={l} value={l} className="bg-[#0f2148]">{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !topic.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-stone-500 to-stone-600 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
                  >
                    {generating ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Writing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Post</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Posts */}
        {tab === "posts" && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold">All Posts</h3>
              <button onClick={() => {}} className="text-sm text-stone-400 hover:text-stone-300 flex items-center gap-1"><Plus className="w-4 h-4" /> New Post</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/40 text-left">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Views</th>
                    <th className="px-6 py-3 font-medium">SEO Score</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium max-w-xs truncate">{p.title}</p>
                        <p className="text-xs text-white/30 mt-0.5">{p.tags.slice(0, 3).join(", ")}</p>
                      </td>
                      <td className="px-6 py-3 text-white/50">
                        {(p.publishedAt || p.scheduledAt || p.createdAt) ?
                          new Date(p.publishedAt || p.scheduledAt || p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="px-6 py-3 text-white/50">{p.views > 0 ? p.views.toLocaleString() : "—"}</td>
                      <td className="px-6 py-3">
                        <span className={`font-semibold ${seoScoreColor(p.seoScore)}`}>{p.seoScore}</span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor(p.status)}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* SEO Dashboard */}
        {tab === "seo" && (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={fadeUp} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Keyword Rankings</h3>
              <div className="space-y-3">
                {keywords.map((kw) => (
                  <div key={kw.keyword} className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{kw.keyword}</p>
                      <p className="text-xs text-white/30 mt-0.5">{kw.url}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-bold">#{kw.position}</p>
                      </div>
                      <div className="flex items-center gap-1 w-20">
                        {kw.change > 0 ? (
                          <><TrendingUp className="w-4 h-4 text-stone-400" /><span className="text-sm text-stone-400">+{kw.change}</span></>
                        ) : kw.change < 0 ? (
                          <><TrendingDown className="w-4 h-4 text-stone-400" /><span className="text-sm text-stone-400">{kw.change}</span></>
                        ) : (
                          <><Minus className="w-4 h-4 text-white/30" /><span className="text-sm text-white/30">0</span></>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Content Calendar */}
        {tab === "calendar" && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">March 2026</h3>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-xs text-white/40 font-medium py-2">{d}</div>
              ))}
              {calendarCells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dateStr = `2026-03-${String(day).padStart(2, "0")}`;
                const postsOnDay = calendarPosts.filter((p) => p.date === dateStr);
                const isToday = day === new Date().getDate() && new Date().getMonth() === 2 && new Date().getFullYear() === 2026;
                return (
                  <div
                    key={`day-${day}`}
                    className={`relative p-2 min-h-[60px] rounded-lg border transition-colors ${
                      isToday ? "border-stone-500/50 bg-stone-500/5" : "border-white/5 hover:border-white/10"
                    }`}
                  >
                    <span className={`text-xs ${isToday ? "text-stone-400 font-bold" : "text-white/50"}`}>{day}</span>
                    {postsOnDay.map((p, j) => (
                      <div
                        key={j}
                        className={`mt-1 px-1.5 py-0.5 rounded text-[10px] truncate ${
                          p.status === "published" ? "bg-stone-500/20 text-stone-400" :
                          p.status === "scheduled" ? "bg-stone-500/20 text-stone-400" : "bg-white/10 text-white/40"
                        }`}
                      >
                        {p.title.slice(0, 20)}...
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
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
