"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Hash,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Trash2,
  X,
  Zap,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  RefreshCw,
  Eye,
} from "lucide-react";

/* ─── animation helpers ─── */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

/* ─── types ─── */
type Platform = "twitter" | "linkedin" | "instagram" | "tiktok" | "facebook";
type PostStatus = "scheduled" | "published" | "draft" | "failed";

interface ScheduledPost {
  id: string;
  platform: Platform;
  caption: string;
  imagePrompt?: string;
  hashtags: string[];
  scheduledAt: string;
  status: PostStatus;
  createdAt: string;
}

interface Insight {
  label: string;
  value: string;
  icon: string;
}

/* ─── constants ─── */
const PLATFORM_COLORS: Record<Platform, string> = {
  twitter: "bg-stone-500",
  linkedin: "bg-stone-600",
  instagram: "bg-gradient-to-br from-stone-500 to-stone-500",
  tiktok: "bg-black ring-1 ring-white/20",
  facebook: "bg-stone-500",
};

const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: "MessageCircle / X",
  linkedin: "LinkedIn",
  instagram: "Camera",
  tiktok: "TikTok",
  facebook: "ThumbsUp",
};

const PLATFORM_ICONS: Record<Platform, string> = {
  twitter: "X",
  linkedin: "in",
  instagram: "IG",
  tiktok: "TT",
  facebook: "fb",
};

const STATUS_STYLES: Record<PostStatus, { bg: string; text: string; label: string }> = {
  scheduled: { bg: "bg-stone-500/15", text: "text-stone-400", label: "Scheduled" },
  published: { bg: "bg-stone-500/15", text: "text-stone-400", label: "Published" },
  draft: { bg: "bg-white/10", text: "text-white/60", label: "Draft" },
  failed: { bg: "bg-stone-500/15", text: "text-stone-400", label: "Failed" },
};

const CONNECTED_PLATFORMS: { platform: Platform; connected: boolean }[] = [
  { platform: "twitter", connected: false },
  { platform: "linkedin", connected: false },
  { platform: "instagram", connected: false },
  { platform: "tiktok", connected: false },
  { platform: "facebook", connected: false },
];

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ─── helpers ─── */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function ContentCalendarPage() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [stats, setStats] = useState({ scheduledThisMonth: 0, published: 0, totalEngagement: 0, contentScore: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Calendar state
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // AI Planner
  const [businessDesc, setBusinessDesc] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<ScheduledPost[] | null>(null);

  // Detail modal
  const [viewingPost, setViewingPost] = useState<ScheduledPost | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content-calendar");
      const data = await res.json();
      setPosts(data.posts || []);
      setInsights(data.insights || []);
      setStats(data.stats || { scheduledThisMonth: 0, published: 0, totalEngagement: 0, contentScore: 0 });
    } catch {
      // fallback
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleGeneratePlan = async () => {
    if (!businessDesc.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/content-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-plan", businessDescription: businessDesc }),
      });
      const data = await res.json();
      if (data.plan) setGeneratedPlan(data.plan);
    } catch {
      // error
    }
    setGenerating(false);
  };

  const acceptPlan = () => {
    if (generatedPlan) {
      setPosts((prev) => [...prev, ...generatedPlan]);
      setGeneratedPlan(null);
      setBusinessDesc("");
    }
  };

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  // Calendar grid helpers
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayDate = now.getDate();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const postsForDay = (day: number): ScheduledPost[] => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return posts.filter((p) => p.scheduledAt.startsWith(dateStr));
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const insightIcons: Record<string, React.ReactNode> = {
    clock: <Clock className="w-4 h-4" />,
    trending: <TrendingUp className="w-4 h-4" />,
    help: <HelpCircle className="w-4 h-4" />,
    text: <FileText className="w-4 h-4" />,
    calendar: <Calendar className="w-4 h-4" />,
    hash: <Hash className="w-4 h-4" />,
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0b1530]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button
                  onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} setUser(null); }}
                  className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2">Sign in</Link>
                <Link href="/auth/signup" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <CursorGlowTracker />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        {/* Hero */}
        <motion.section className="pt-16 pb-12 text-center" initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm text-white/60 mb-6">
            <Calendar className="w-4 h-4 text-stone-400" /> Replaces Buffer & Later
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Content <span className="bg-gradient-to-r from-stone-400 to-stone-500 bg-clip-text text-transparent">Calendar</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg text-white/50 max-w-2xl mx-auto">
            Plan 30 days of social media content in 30 seconds. AI generates platform-specific posts with optimal timing, hashtags, and image prompts.
          </motion.p>
        </motion.section>

        {/* Stats */}
        <motion.section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          {[
            { label: "Scheduled This Month", value: stats.scheduledThisMonth, icon: <Send className="w-5 h-5 text-stone-400" />, color: "from-stone-500/10 to-stone-500/0" },
            { label: "Published", value: stats.published, icon: <CheckCircle2 className="w-5 h-5 text-stone-400" />, color: "from-stone-500/10 to-stone-500/0" },
            { label: "Total Engagement", value: stats.totalEngagement.toLocaleString(), icon: <TrendingUp className="w-5 h-5 text-stone-400" />, color: "from-stone-500/10 to-stone-500/0" },
            { label: "Content Score", value: `${stats.contentScore}/100`, icon: <BarChart3 className="w-5 h-5 text-stone-400" />, color: "from-stone-500/10 to-stone-500/0" },
          ].map((s) => (
            <motion.div key={s.label} variants={fadeInUp} className={`rounded-2xl border border-white/[0.06] bg-gradient-to-b ${s.color} p-5`}>
              <div className="flex items-center gap-3 mb-2">{s.icon}<span className="text-xs text-white/40 uppercase tracking-wider">{s.label}</span></div>
              <div className="text-2xl font-bold">{s.value}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* Calendar + Sidebar */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 mb-12">
          {/* Calendar Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <h2 className="text-lg font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 border-b border-white/[0.06]">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-xs text-white/40 py-2 uppercase tracking-wider">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-white/[0.04] bg-white/[0.01]" />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayPosts = postsForDay(day);
                const isToday = isCurrentMonth && day === todayDate;
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`min-h-[90px] border-b border-r border-white/[0.04] p-2 text-left transition-colors relative group
                      ${isToday ? "bg-stone-500/[0.06]" : "hover:bg-white/[0.04]"}
                      ${isSelected ? "bg-white/[0.06] ring-1 ring-stone-500/40" : ""}
                      ${dayPosts.length > 0 ? "bg-white/[0.02]" : ""}
                    `}
                  >
                    <span className={`text-sm font-medium ${isToday ? "text-stone-400" : "text-white/70"}`}>
                      {day}
                      {isToday && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />}
                    </span>
                    {dayPosts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {dayPosts.slice(0, 4).map((p) => (
                          <span key={p.id} className={`w-2 h-2 rounded-full ${PLATFORM_COLORS[p.platform]} flex-shrink-0`} title={PLATFORM_LABELS[p.platform]} />
                        ))}
                        {dayPosts.length > 4 && <span className="text-[10px] text-white/40">+{dayPosts.length - 4}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected day detail */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-white/[0.06]"
                >
                  <div className="p-5">
                    <h3 className="text-sm font-semibold text-white/70 mb-3">
                      {MONTH_NAMES[viewMonth]} {selectedDay}, {viewYear}
                    </h3>
                    {postsForDay(selectedDay).length === 0 ? (
                      <p className="text-sm text-white/40">No posts scheduled for this day.</p>
                    ) : (
                      <div className="space-y-3">
                        {postsForDay(selectedDay).map((p) => (
                          <div key={p.id} className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3 border border-white/[0.06]">
                            <div className={`w-8 h-8 rounded-lg ${PLATFORM_COLORS[p.platform]} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                              {PLATFORM_ICONS[p.platform]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/80 line-clamp-2">{p.caption}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status].bg} ${STATUS_STYLES[p.status].text}`}>
                                  {STATUS_STYLES[p.status].label}
                                </span>
                                <span className="text-xs text-white/30">
                                  {new Date(p.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                            <button onClick={() => setViewingPost(p)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Sidebar — AI Planner + Platform Connections */}
          <div className="space-y-6">
            {/* AI Content Planner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-stone-400" />
                <h3 className="font-semibold">AI Content Planner</h3>
              </div>
              <textarea
                value={businessDesc}
                onChange={(e) => setBusinessDesc(e.target.value)}
                placeholder="Describe your business and goals... e.g. 'Boutique yoga studio in Austin, TX. Goal: attract new students and promote our online membership.'"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-sm text-white placeholder:text-white/30 resize-none h-28 focus:outline-none focus:ring-1 focus:ring-stone-500/40 transition-all"
              />
              <button
                onClick={handleGeneratePlan}
                disabled={generating || !businessDesc.trim()}
                className="w-full mt-3 btn-gradient px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate 30-Day Plan</>}
              </button>

              {/* Generated plan preview */}
              <AnimatePresence>
                {generatedPlan && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="mt-4 p-3 rounded-xl bg-stone-500/[0.06] border border-stone-500/20">
                      <p className="text-sm text-stone-400 font-medium mb-2">{generatedPlan.length} posts generated</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {(["twitter", "linkedin", "instagram", "tiktok", "facebook"] as Platform[]).map((p) => {
                          const count = generatedPlan.filter((post) => post.platform === p).length;
                          return (
                            <span key={p} className="text-xs bg-white/10 rounded-full px-2 py-0.5 text-white/60">
                              {PLATFORM_LABELS[p]}: {count}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={acceptPlan} className="flex-1 bg-stone-500 hover:bg-stone-400 text-black text-sm font-semibold py-2 rounded-lg transition-colors">
                          Accept Plan
                        </button>
                        <button onClick={() => { setGeneratedPlan(null); handleGeneratePlan(); }} className="flex-1 bg-white/10 hover:bg-white/15 text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Platform Connections */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-4">Platform Connections</h3>
              <div className="space-y-3">
                {CONNECTED_PLATFORMS.map(({ platform, connected }) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${PLATFORM_COLORS[platform]} flex items-center justify-center text-[10px] font-bold text-white`}>
                        {PLATFORM_ICONS[platform]}
                      </div>
                      <span className="text-sm font-medium">{PLATFORM_LABELS[platform]}</span>
                    </div>
                    {connected ? (
                      <span className="text-xs text-stone-400 bg-stone-500/15 px-2.5 py-1 rounded-full">Connected</span>
                    ) : (
                      <button onClick={() => {}} className="text-xs text-white/60 bg-white/[0.06] hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/30 mt-4">Connect your accounts to auto-publish scheduled posts.</p>
            </motion.div>

            {/* Performance Insights */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="font-semibold mb-4">Performance Insights</h3>
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div key={insight.label} className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-stone-400 flex-shrink-0">
                      {insightIcons[insight.icon] || <BarChart3 className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-white/50 text-xs">{insight.label}</p>
                      <p className="text-white/90 font-medium">{insight.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scheduled Posts List */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <motion.div variants={fadeInUp} className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Scheduled Posts</h2>
            <span className="text-sm text-white/40">{posts.length} total</span>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No posts scheduled yet. Use the AI Content Planner to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  variants={fadeInUp}
                  className="flex items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4"
                >
                  {/* Platform badge */}
                  <div className={`w-10 h-10 rounded-xl ${PLATFORM_COLORS[post.platform]} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                    {PLATFORM_ICONS[post.platform]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 line-clamp-2 mb-2">{post.caption}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[post.status].bg} ${STATUS_STYLES[post.status].text}`}>
                        {STATUS_STYLES[post.status].label}
                      </span>
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(post.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {" "}
                        {new Date(post.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {post.hashtags.length > 0 && (
                        <span className="text-xs text-white/25">{post.hashtags.slice(0, 3).join(" ")}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setViewingPost(post)} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => deletePost(post.id)} className="p-2 rounded-lg hover:bg-stone-500/20 transition-colors text-white/40 hover:text-stone-400" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Pricing CTA */}
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-16 text-center rounded-3xl border border-white/[0.06] bg-gradient-to-b from-stone-500/[0.06] to-transparent p-12">
          <h2 className="text-2xl font-bold mb-3">Replace Buffer & Later</h2>
          <p className="text-white/50 max-w-lg mx-auto mb-6">
            AI-powered content planning, scheduling, and cross-platform publishing — included free with Pro ($49/mo).
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/pricing" className="btn-gradient px-6 py-3 rounded-xl text-sm font-semibold text-white">
              View Pricing
            </Link>
            <Link href="/builder" className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl text-sm font-medium transition-colors">
              Try the Builder
            </Link>
          </div>
        </motion.section>
      </main>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {viewingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewingPost(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#12121e] p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${PLATFORM_COLORS[viewingPost.platform]} flex items-center justify-center text-xs font-bold text-white`}>
                    {PLATFORM_ICONS[viewingPost.platform]}
                  </div>
                  <div>
                    <h3 className="font-semibold">{PLATFORM_LABELS[viewingPost.platform]}</h3>
                    <span className={`text-xs ${STATUS_STYLES[viewingPost.status].text}`}>{STATUS_STYLES[viewingPost.status].label}</span>
                  </div>
                </div>
                <button onClick={() => setViewingPost(null)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-white/80 leading-relaxed mb-4">{viewingPost.caption}</p>

              {viewingPost.imagePrompt && (
                <div className="mb-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <p className="text-xs text-white/40 mb-1">Suggested Image</p>
                  <p className="text-sm text-white/70">{viewingPost.imagePrompt}</p>
                </div>
              )}

              {viewingPost.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {viewingPost.hashtags.map((tag) => (
                    <span key={tag} className="text-xs bg-stone-500/10 text-stone-400 rounded-full px-2.5 py-1">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-white/40 border-t border-white/[0.06] pt-4">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Scheduled: {new Date(viewingPost.scheduledAt).toLocaleString()}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
