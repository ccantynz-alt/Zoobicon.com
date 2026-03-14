"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  Search,
  ArrowRight,
  Bot,
  TrendingUp,
  FileText,
  Link2,
  BarChart3,
  Target,
  Brain,
  Clock,
  Shield,
  Check,
  Cpu,
  Globe,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const CAPABILITIES = [
  { icon: Brain, title: "Keyword Discovery", desc: "AI analyzes your niche, competitors, and market gaps to find the highest-value keywords you should own." },
  { icon: FileText, title: "Content Generation", desc: "Autonomously writes and publishes SEO-optimized articles, blog posts, and landing pages that rank." },
  { icon: Link2, title: "Backlink Outreach", desc: "Identifies high-authority link opportunities and sends personalized outreach — all automated." },
  { icon: Target, title: "Technical SEO Audit", desc: "Crawls your entire site. Finds broken links, slow pages, missing meta tags, schema errors, and fixes them." },
  { icon: BarChart3, title: "Rank Tracking", desc: "Daily rank monitoring across Google, Bing, and YouTube. Alerts when positions change." },
  { icon: TrendingUp, title: "Competitor Intelligence", desc: "Monitors competitor rankings, backlinks, content strategy, and ad spend. Find their gaps, exploit them." },
  { icon: Clock, title: "24/7 Autonomous", desc: "The agent never sleeps. It continuously optimizes, publishes, outreaches, and reports — every single day." },
  { icon: Shield, title: "White-Hat Only", desc: "100% Google-compliant strategies. No black hat, no PBNs, no risk. Sustainable growth that lasts." },
  { icon: Globe, title: "Multi-Language", desc: "SEO campaigns in 30+ languages. Localized content, hreflang tags, and geo-targeting built in." },
];

const AGENT_WORKFLOW = [
  { phase: "Discovery", desc: "Agent analyzes your domain, identifies top competitors, maps keyword landscape, finds content gaps.", time: "Hour 1" },
  { phase: "Strategy", desc: "Creates a ranked priority list of keywords, content plan with titles and outlines, technical fixes needed.", time: "Hour 2" },
  { phase: "Execution", desc: "Writes content, fixes technical issues, starts backlink outreach, optimizes existing pages.", time: "Day 1-7" },
  { phase: "Monitoring", desc: "Tracks rankings daily, adjusts strategy based on results, sends weekly performance reports.", time: "Ongoing" },
  { phase: "Scaling", desc: "Expands keyword targets, scales content production, increases backlink velocity as authority grows.", time: "Month 2+" },
];

export default function SEOAgentPage() {
  const [user, setUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* Safari private mode / storage unavailable */ }
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    setUser(null);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim() || waitlistStatus === "loading") return;
    setWaitlistStatus("loading");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: waitlistEmail, source: "seo-agent-waitlist" }),
      });
      setWaitlistStatus("success");
    } catch {
      setWaitlistStatus("error");
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-cyan w-[500px] h-[500px] -top-[150px] right-[10%] opacity-10" />
        <div className="glow-orb glow-orb-blue w-[400px] h-[400px] bottom-[30%] -left-[100px] opacity-10" />
        <div className="grid-pattern fixed inset-0" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-emerald-600 flex items-center justify-center">
                <Search className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/20">/</span>
            <span className="text-sm text-white/50">SEO Agent</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
                <Link href="/builder" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>{user.name || user.email.split("@")[0]}</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-44 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5">
                <Bot className="w-3 h-3 text-accent-cyan" />
                <span className="text-xs font-medium text-accent-cyan">Autonomous AI Agent</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <Clock size={12} /> Coming Soon
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              SEO on<br />
              <span className="gradient-text-hero">Autopilot.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg md:text-xl text-white/40 leading-relaxed mb-10">
              An autonomous AI agent that researches, plans, and executes your entire SEO strategy
              24/7. Content creation, backlink outreach, technical audits — all handled while you sleep.
            </motion.p>

            <motion.div variants={fadeInUp} className="max-w-lg mb-16">
              {waitlistStatus === "success" ? (
                <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">You&apos;re on the list! We&apos;ll notify you when SEO Agent launches.</span>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-3">
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="Enter your email for early access"
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white placeholder:text-white/25 outline-none text-sm focus:border-accent-cyan/30 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={waitlistStatus === "loading"}
                    className="group btn-gradient px-6 py-4 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-glow-cyan whitespace-nowrap disabled:opacity-50"
                  >
                    <span>{waitlistStatus === "loading" ? "Joining..." : "Join Early Access"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "24/7", label: "Autonomous operation" },
                { value: "300%", label: "Avg. traffic increase" },
                { value: "30+", label: "Languages supported" },
                { value: "0", label: "Manual work required" },
              ].map((stat) => (
                <div key={stat.label} className="gradient-border p-4 rounded-xl text-center">
                  <div className="text-2xl font-black gradient-text-static">{stat.value}</div>
                  <div className="text-xs text-white/30 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                How the Agent <span className="gradient-text">Works</span>
              </h2>
              <p className="text-lg text-white/40">Set it and forget it. The agent handles everything.</p>
            </motion.div>

            <div className="space-y-3">
              {AGENT_WORKFLOW.map((step, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border p-6 rounded-xl flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="text-xs font-bold text-accent-cyan bg-accent-cyan/10 px-3 py-1.5 rounded-lg">{step.time}</div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-1">{step.phase}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Full <span className="gradient-text">Capabilities</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CAPABILITIES.map((c, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <c.icon className="w-8 h-8 text-accent-cyan/50 mb-4 group-hover:text-accent-cyan transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{c.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{c.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Cpu className="w-12 h-12 text-accent-cyan/30 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Stop Doing SEO.<br /><span className="gradient-text">Let AI Do It.</span>
          </h2>
          <p className="text-lg text-white/40 mb-4">Be the first to know when SEO Agent launches.</p>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-8">
            <Clock size={12} /> Coming Soon
          </span>
          <div className="max-w-lg mx-auto">
            {waitlistStatus === "success" ? (
              <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">You&apos;re on the list! We&apos;ll notify you when SEO Agent launches.</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-3">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white placeholder:text-white/25 outline-none text-sm focus:border-accent-cyan/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === "loading"}
                  className="group btn-gradient px-6 py-4 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-glow-cyan whitespace-nowrap disabled:opacity-50"
                >
                  <span>{waitlistStatus === "loading" ? "Joining..." : "Join Waitlist"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/20">&copy; 2026 Zoobicon</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/20 hover:text-white/40">Home</Link>
            <Link href="/products/website-builder" className="text-xs text-white/20 hover:text-white/40">Builder</Link>
            <Link href="/products/video-creator" className="text-xs text-white/20 hover:text-white/40">Video Creator</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
