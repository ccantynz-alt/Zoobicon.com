"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap,
  Mail,
  ArrowRight,
  Bot,
  Inbox,
  Clock,
  BarChart3,
  Brain,
  Globe,
  Shield,
  Users,
  Smile,
  Frown,
  Meh,
  MessageSquare,
  Sparkles,
  Check,
  BookOpen,
  Tag,
  Workflow,
  Send,
  Search,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
  { icon: Brain, title: "AI Auto-Reply", desc: "AI reads, understands, and drafts perfect replies to every customer email. Human review optional." },
  { icon: Inbox, title: "Smart Inbox", desc: "Unified inbox for all channels — email, chat, forms. Auto-categorized by topic, urgency, and sentiment." },
  { icon: Smile, title: "Sentiment Analysis", desc: "Real-time mood detection. Route angry customers to humans, let AI handle the happy ones." },
  { icon: BookOpen, title: "Knowledge Base AI", desc: "Train the AI on your docs, FAQs, and product info. It answers like your best support agent." },
  { icon: Tag, title: "Auto-Tagging", desc: "Automatically tags, categorizes, and prioritizes every ticket. Bug report? Billing issue? Sorted instantly." },
  { icon: Workflow, title: "Escalation Workflows", desc: "Custom rules: if sentiment < 3, escalate to human. If VIP customer, priority queue. Fully configurable." },
  { icon: Clock, title: "24/7 Response", desc: "AI never sleeps. Customers get instant replies at 3am on a Sunday. Average response: under 30 seconds." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "CSAT scores, resolution times, common issues, agent performance — all tracked in real-time." },
  { icon: Globe, title: "Multi-Language", desc: "AI responds in 30+ languages. Auto-detects customer language and replies natively." },
  { icon: Shield, title: "GDPR Compliant", desc: "Data encryption, auto-deletion policies, consent management. Built for EU compliance from day one." },
  { icon: Users, title: "Team Collaboration", desc: "Internal notes, @mentions, ticket assignments, collision detection. Your team works as one." },
  { icon: Send, title: "Outbound Campaigns", desc: "Proactive support emails, onboarding sequences, and NPS surveys — all AI-powered." },
];

const MOCK_TICKETS = [
  { id: "TK-2847", from: "sarah@startup.io", subject: "Can't export my website as React", sentiment: "frustrated", priority: "high", status: "ai-replied", time: "2m ago", aiDraft: "Hi Sarah! I understand the frustration. React export is available on Pro plans. I've applied a 7-day free trial of Pro to your account so you can export right away. Let me know if you need anything else!" },
  { id: "TK-2846", from: "james@agency.co", subject: "Bulk generation CSV format question", sentiment: "neutral", priority: "medium", status: "ai-replied", time: "5m ago", aiDraft: "Hi James! The CSV format requires 3 columns: name, prompt, template. I've attached a sample CSV file to get you started. Our docs also have a full guide at zoobicon.io/docs/bulk." },
  { id: "TK-2845", from: "lisa@design.com", subject: "Love the new video creator!", sentiment: "happy", priority: "low", status: "resolved", time: "12m ago", aiDraft: "Thank you so much Lisa! We're thrilled you're enjoying the Video Creator. If you share any videos you create, tag us — we'd love to feature them! 🎬" },
  { id: "TK-2844", from: "mike@enterprise.com", subject: "Enterprise SSO integration timeline", sentiment: "neutral", priority: "high", status: "escalated", time: "18m ago", aiDraft: "" },
  { id: "TK-2843", from: "anna@freelance.dev", subject: "CLI deploy fails with custom domain", sentiment: "frustrated", priority: "high", status: "ai-replied", time: "22m ago", aiDraft: "Hi Anna! This is usually a DNS propagation issue. Please verify your CNAME record points to deploy.zoobicon.sh. It can take up to 48 hours to propagate. Run `zb deploy --check-dns` to verify." },
];

const sentimentIcon = (s: string) => {
  if (s === "happy") return <Smile className="w-3.5 h-3.5 text-green-400" />;
  if (s === "frustrated") return <Frown className="w-3.5 h-3.5 text-red-400" />;
  return <Meh className="w-3.5 h-3.5 text-amber-400" />;
};

const statusBadge = (s: string) => {
  if (s === "ai-replied") return <span className="px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 text-[9px] font-bold">AI Replied</span>;
  if (s === "resolved") return <span className="px-2 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan text-[9px] font-bold">Resolved</span>;
  if (s === "escalated") return <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[9px] font-bold">Escalated</span>;
  return <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-[9px] font-bold">Open</span>;
};

export default function EmailSupportPage() {
  const [selectedTicket, setSelectedTicket] = useState(MOCK_TICKETS[0]);
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
        body: JSON.stringify({ email: waitlistEmail, source: "email-support-waitlist" }),
      });
      setWaitlistStatus("success");
    } catch {
      setWaitlistStatus("error");
    }
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/60">/</span>
            <span className="text-sm text-white/65">AI Email Support</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
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
                <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2">
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
      <CursorGlowTracker />

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5">
                <Bot className="w-3 h-3 text-brand-400" />
                <span className="text-xs font-medium text-brand-400">AI-Powered Support</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                <Clock size={12} /> Coming Soon
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              Customer Support<br />
              <span className="gradient-text-hero">That Never Sleeps.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg md:text-xl text-white/60 leading-relaxed mb-10">
              AI reads every email, understands the issue, drafts the perfect reply, and resolves tickets —
              all in under 30 seconds. Your customers think they&apos;re talking to your best agent.
            </motion.p>

            <motion.div variants={fadeInUp} className="max-w-lg mb-16 space-y-4">
              <Link
                href="/email-support"
                className="group inline-flex items-center gap-2.5 btn-gradient px-6 py-4 rounded-xl text-sm font-bold text-white shadow-glow"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Try Demo Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              {waitlistStatus === "success" ? (
                <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">You&apos;re on the list! We&apos;ll notify you when AI Email Support launches.</span>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-3">
                  <input
                    type="email"
                    required
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="Or enter your email for early access"
                    className="flex-1 bg-white/[0.07] border border-white/[0.12] rounded-xl px-5 py-4 text-white placeholder:text-white/60 outline-none text-sm focus:border-brand-500/30 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={waitlistStatus === "loading"}
                    className="group btn-gradient px-6 py-4 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-glow whitespace-nowrap disabled:opacity-50"
                  >
                    <span>{waitlistStatus === "loading" ? "Joining..." : "Join Early Access"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { value: "<30s", label: "Avg response time" },
                { value: "94%", label: "Auto-resolution rate" },
                { value: "30+", label: "Languages" },
                { value: "24/7", label: "Always on" },
              ].map((stat) => (
                <div key={stat.label} className="gradient-border p-4 rounded-xl text-center">
                  <div className="text-2xl font-black gradient-text-static">{stat.value}</div>
                  <div className="text-xs text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Live Inbox Demo */}
            <motion.div variants={fadeInUp}>
              <div className="gradient-border rounded-2xl overflow-hidden">
                <div className="bg-dark-300/90 backdrop-blur-xl">
                  {/* Inbox header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.10]">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-brand-400" />
                      <span className="text-sm font-semibold text-white/70">AI Support Inbox</span>
                      <span className="px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-400 text-[10px] font-bold">
                        {MOCK_TICKETS.length} tickets
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-white/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input className="bg-white/[0.06] border border-white/[0.10] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white/60 placeholder-white/20 w-48" placeholder="Search tickets..." />
                      </div>
                    </div>
                  </div>

                  <div className="flex h-[420px]">
                    {/* Ticket list */}
                    <div className="w-[45%] border-r border-white/[0.10] overflow-y-auto">
                      {MOCK_TICKETS.map((ticket) => (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className={`w-full text-left px-4 py-3 border-b border-white/[0.06] transition-colors ${
                            selectedTicket.id === ticket.id ? "bg-brand-500/5 border-l-2 border-l-brand-500" : "hover:bg-white/[0.05]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-white/60">{ticket.id}</span>
                            <div className="flex items-center gap-2">
                              {sentimentIcon(ticket.sentiment)}
                              {statusBadge(ticket.status)}
                            </div>
                          </div>
                          <div className="text-xs font-semibold text-white/70 truncate">{ticket.subject}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-white/60 truncate">{ticket.from}</span>
                            <span className="text-[10px] text-white/60">{ticket.time}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Ticket detail */}
                    <div className="flex-1 flex flex-col">
                      <div className="px-5 py-3 border-b border-white/[0.10]">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white/80">{selectedTicket.subject}</h3>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            selectedTicket.priority === "high" ? "bg-red-500/15 text-red-400" : selectedTicket.priority === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-white/10 text-white/60"
                          }`}>{selectedTicket.priority}</span>
                        </div>
                        <div className="text-[10px] text-white/60 mt-0.5">From: {selectedTicket.from} • {selectedTicket.time}</div>
                      </div>

                      <div className="flex-1 p-5 overflow-y-auto">
                        {selectedTicket.aiDraft ? (
                          <div className="space-y-4">
                            {/* Customer message */}
                            <div className="flex gap-3">
                              <div className="w-7 h-7 rounded-full bg-white/[0.09] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white/60">
                                {selectedTicket.from.charAt(0).toUpperCase()}
                              </div>
                              <div className="bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3 text-xs text-white/65 max-w-[80%]">
                                {selectedTicket.subject}
                              </div>
                            </div>

                            {/* AI Reply */}
                            <div className="flex gap-3 justify-end">
                              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3 text-xs text-white/60 max-w-[80%]">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Sparkles className="w-3 h-3 text-brand-400" />
                                  <span className="text-[9px] font-bold text-brand-400">AI Draft</span>
                                </div>
                                {selectedTicket.aiDraft}
                              </div>
                              <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3.5 h-3.5 text-brand-400" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full text-xs text-white/60">
                            Escalated to human agent — awaiting response
                          </div>
                        )}
                      </div>

                      {/* Reply bar */}
                      <div className="px-4 py-3 border-t border-white/[0.10] flex items-center gap-2">
                        <input className="flex-1 bg-white/[0.06] border border-white/[0.10] rounded-lg px-3 py-2 text-xs placeholder-white/15" placeholder="Add a reply or note..." />
                        <button className="p-2 btn-gradient rounded-lg"><Send className="w-3.5 h-3.5 text-white" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Every Feature Your<br /><span className="gradient-text">Support Team Needs</span></h2>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <f.icon className="w-8 h-8 text-brand-400/50 mb-4 group-hover:text-brand-400 transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Resolve 94% of Tickets<br /><span className="gradient-text">Automatically</span>
          </h2>
          <p className="text-lg text-white/60 mb-4">Be the first to know when AI Email Support launches. Or try the demo now.</p>
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <Clock size={12} /> Full Launch Coming Soon
            </span>
            <Link
              href="/email-support"
              className="group inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold hover:bg-brand-500/20 transition-all"
            >
              <LayoutDashboard size={12} />
              Try Demo Dashboard
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="max-w-lg mx-auto">
            {waitlistStatus === "success" ? (
              <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Check className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">You&apos;re on the list! We&apos;ll notify you when AI Email Support launches.</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex items-center gap-3">
                <input
                  type="email"
                  required
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="Enter your email for early access"
                  className="flex-1 bg-white/[0.07] border border-white/[0.12] rounded-xl px-5 py-4 text-white placeholder:text-white/60 outline-none text-sm focus:border-brand-500/30 transition-colors"
                />
                <button
                  type="submit"
                  disabled={waitlistStatus === "loading"}
                  className="group btn-gradient px-6 py-4 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-glow whitespace-nowrap disabled:opacity-50"
                >
                  <span>{waitlistStatus === "loading" ? "Joining..." : "Join Waitlist"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/60">&copy; 2026 Zoobicon</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/60 hover:text-white/60">Home</Link>
            <Link href="/marketplace" className="text-xs text-white/60 hover:text-white/60">Marketplace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
