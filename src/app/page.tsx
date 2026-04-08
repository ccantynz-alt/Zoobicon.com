"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  Globe,
  Brain,
  Code2,
  Terminal,
  Layers,
  Zap,
  Shield,
  Palette,
  BarChart3,
  Sparkles,
  ChevronDown,
} from "lucide-react";

/* ─── animated counter ─── */
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !started) { setStarted(true); } },
      { threshold: 0.5 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const dur = 1800;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── hero showcase slides — cinematic backgrounds ─── */
const HERO_SLIDES = [
  {
    bg: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2400&q=80",
    badge: "AI Website Builder for the Modern Web",
    h1: ["Prompt.", "Preview.", "Publish."],
    accent: 2,
    sub: "7 AI agents collaborate in real-time to build production-ready websites, apps, and stores — from a single sentence.",
  },
  {
    bg: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=2400&q=80",
    badge: "From Idea to Live Site in 95 Seconds",
    h1: ["Describe.", "Generate.", "Launch."],
    accent: 2,
    sub: "Full-stack apps, e-commerce stores, multi-page sites — built by AI agents, deployed instantly to your custom domain.",
  },
  {
    bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=80",
    badge: "43 Specialized Generators. One Platform.",
    h1: ["Dream.", "Build.", "Ship."],
    accent: 2,
    sub: "SaaS dashboards, restaurant sites, portfolios, email templates — each with a purpose-built AI pipeline tuned for quality.",
  },
  {
    bg: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=2400&q=80",
    badge: "Full-Stack Apps in Under 2 Minutes",
    h1: ["Code.", "Create.", "Conquer."],
    accent: 2,
    sub: "Database schemas, API routes, and interactive frontends — generated together as a complete, working application.",
  },
];

function HeroShowcase() {
  const [current, setCurrent] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(HERO_SLIDES.map(() => false));

  useEffect(() => {
    HERO_SLIDES.forEach((slide, i) => {
      const img = new Image();
      img.onload = () => setImagesLoaded(prev => { const n = [...prev]; n[i] = true; return n; });
      img.src = slide.bg;
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCurrent(i => (i + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const slide = HERO_SLIDES[current];

  return (
    <section className="relative h-screen min-h-[700px] max-h-[1100px] overflow-hidden pt-16">
      {/* Background images — all rendered, opacity-switched for smooth crossfade */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
            style={{
              backgroundImage: imagesLoaded[i] ? `url(${s.bg})` : undefined,
              backgroundColor: "#0a0a0f",
            }}
          />
        </div>
      ))}

      {/* Dark overlays for text readability */}
      <div className="absolute inset-0 bg-black/55 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-transparent to-[#0a0a14]/60 z-[2]" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/[0.08] via-transparent to-transparent z-[2]" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        {/* Glass pill badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`badge-${current}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white/80 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
              {slide.badge}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Massive stacked headline */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={`h1-${current}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3rem,10vw,8rem)] font-black tracking-[-0.04em] leading-[0.95] mb-6"
          >
            {slide.h1.map((word, wi) => (
              <span key={wi}>
                <span
                  className={
                    wi === slide.accent
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400"
                      : "text-white"
                  }
                >
                  {word}
                </span>
                {wi < slide.h1.length - 1 && <br />}
              </span>
            ))}
          </motion.h1>
        </AnimatePresence>

        {/* Subtitle */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`sub-${current}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            {slide.sub}
          </motion.p>
        </AnimatePresence>

        {/* Dual CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link
            href="/builder"
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-indigo-600 text-white text-base font-bold hover:bg-indigo-500 transition-all shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.45)]"
          >
            Start Building Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/domains"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-white/80 bg-white/[0.08] backdrop-blur-sm border border-white/[0.15] hover:bg-white/[0.14] hover:border-white/[0.25] transition-all"
          >
            <Globe className="w-4 h-4" /> Search Domains
          </Link>
        </motion.div>

        {/* Slide indicators */}
        <div className="flex items-center gap-2 mt-10">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`transition-all duration-500 rounded-full ${
                i === current
                  ? "w-8 h-2 bg-white/80"
                  : "w-2 h-2 bg-white/25 hover:bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/50 uppercase tracking-[0.2em] font-medium">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4 text-white/50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── data ─── */

const STATS = [
  { value: "43+", label: "Specialized Generators" },
  { value: "7", label: "AI Agents Per Build" },
  { value: "95s", label: "Average Build Time" },
  { value: "100+", label: "Ready Templates" },
];

const STEPS = [
  {
    num: "01",
    title: "Describe",
    body: "Tell us what you need in plain English. A fintech dashboard, a bakery website, an e-commerce store — anything.",
  },
  {
    num: "02",
    title: "Generate",
    body: "7 specialized AI agents collaborate — strategist, designer, copywriter, architect, developer, SEO, and animator.",
  },
  {
    num: "03",
    title: "Deploy",
    body: "Your site goes live instantly on zoobicon.sh. Edit visually, export to React or WordPress, connect your domain.",
  },
];

const FEATURES = [
  {
    icon: Layers,
    title: "Multi-Page Sites",
    body: "Generate 3-6 page websites with consistent navigation, shared design system, and cross-linked content.",
  },
  {
    icon: Zap,
    title: "Full-Stack Apps",
    body: "Database schemas, API routes, and interactive frontends — generated together as a complete working application.",
  },
  {
    icon: Palette,
    title: "Visual Editor",
    body: "Click any element to edit. Change colors, fonts, spacing, and layout with a visual property panel.",
  },
  {
    icon: Shield,
    title: "Built-In SEO",
    body: "Meta tags, JSON-LD schema, heading hierarchy, and Open Graph tags — optimized automatically by the SEO agent.",
  },
  {
    icon: BarChart3,
    title: "75+ Business Tools",
    body: "CRM, invoicing, booking, email marketing, forms, analytics — a complete business OS bundled into one platform.",
  },
  {
    icon: Sparkles,
    title: "Multi-LLM Pipeline",
    body: "Choose Claude, GPT-4o, or Gemini. Our pipeline routes to the best model for each task with automatic failover.",
  },
];

const DOMAINS = [
  {
    name: "zoobicon.com",
    role: "Build",
    desc: "AI website builder with 43 generators and visual editing.",
    color: "indigo",
    icon: Globe,
    href: "/builder",
    cta: "Start building",
  },
  {
    name: "zoobicon.ai",
    role: "Grow",
    desc: "Multi-LLM pipeline, autonomous SEO, smart optimization.",
    color: "cyan",
    icon: Brain,
    href: "/ai",
    cta: "Explore AI",
  },
  {
    name: "zoobicon.io",
    role: "Connect",
    desc: "Public API, webhooks, GitHub integration, and SDKs.",
    color: "emerald",
    icon: Code2,
    href: "/io",
    cta: "View API docs",
  },
  {
    name: "zoobicon.sh",
    role: "Ship",
    desc: "Instant hosting with SSL, CDN, custom domains, and analytics.",
    color: "amber",
    icon: Terminal,
    href: "/sh",
    cta: "Deploy now",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["3 sites / month", "7-agent AI pipeline", "Opus-quality builds", "Free hosting on .sh"],
    cta: "Get Started",
    href: "/builder",
    featured: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/mo",
    features: ["Unlimited sites", "All 43 generators", "Custom domains", "Visual editor", "Multi-page sites", "GitHub & WP export"],
    cta: "Start Pro Trial",
    href: "/auth/signup",
    featured: true,
  },
  {
    name: "Agency",
    price: "$99",
    period: "/mo",
    features: ["Everything in Pro", "White-label platform", "Client portal", "Bulk generation", "API access", "Priority support"],
    cta: "Start Agency Trial",
    href: "/auth/signup",
    featured: false,
  },
];

/* ─── color map for domain cards ─── */
const DOMAIN_COLORS: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  indigo: { bg: "bg-indigo-500/[0.06]", text: "text-indigo-400", border: "hover:border-indigo-500/30", iconBg: "bg-indigo-500/10" },
  cyan: { bg: "bg-cyan-500/[0.06]", text: "text-cyan-400", border: "hover:border-cyan-500/30", iconBg: "bg-cyan-500/10" },
  emerald: { bg: "bg-emerald-500/[0.06]", text: "text-emerald-400", border: "hover:border-emerald-500/30", iconBg: "bg-emerald-500/10" },
  amber: { bg: "bg-amber-500/[0.06]", text: "text-amber-400", border: "hover:border-amber-500/30", iconBg: "bg-amber-500/10" },
};

/* ═══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="bg-[#0a0a14] text-white selection:bg-indigo-500/30 selection:text-white">

      {/* ── HERO SLIDESHOW ── */}
      <HeroShowcase />

      {/* ── FOUR DOMAINS ── */}
      <section className="py-28 md:py-36 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-indigo-400 mb-4">
              One Platform, Four Domains
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Every domain, a different superpower
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DOMAINS.map((d) => {
              const c = DOMAIN_COLORS[d.color];
              const Icon = d.icon;
              return (
                <Link
                  key={d.name}
                  href={d.href}
                  className={`group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-7 transition-all duration-200 hover:bg-white/[0.06] ${c.border}`}
                >
                  <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center mb-5`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{d.name}</h3>
                  <p className={`text-sm font-semibold ${c.text} mb-3`}>{d.role}</p>
                  <p className="text-[15px] text-slate-400 leading-relaxed mb-5">{d.desc}</p>
                  <span className={`text-sm font-semibold ${c.text} inline-flex items-center gap-1 group-hover:gap-2 transition-all`}>
                    {d.cta} <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — lighter background band ── */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-slate-900/30 to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Describe it. We build it.
            </h2>
            <p className="text-xl text-slate-300 max-w-lg mx-auto">
              Three steps. No code. No templates. No compromise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                <div className="text-[80px] font-black text-white/[0.04] leading-none absolute -top-4 -left-2 select-none pointer-events-none">
                  {step.num}
                </div>
                <div className="relative pt-6">
                  <div className="text-xs font-bold text-indigo-400 mb-3 tracking-widest uppercase">
                    Step {step.num}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">{step.title}</h3>
                  <p className="text-[15px] text-slate-400 leading-relaxed">{step.body}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-14 -right-6 text-white/10">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="mt-16 text-center">
            <p className="text-sm text-slate-500 uppercase tracking-widest mb-5">What you can build</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "SaaS Landing Pages", "E-Commerce Stores", "Portfolios", "Dashboards",
                "Restaurants", "Agency Sites", "Blogs", "Full-Stack Apps",
              ].map((tag) => (
                <span key={tag} className="px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.02] text-sm text-slate-400">
                  {tag}
                </span>
              ))}
              <Link
                href="/generators"
                className="px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/[0.04] text-sm text-indigo-400 hover:border-indigo-500/40 transition-colors"
              >
                +35 more generators
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-28 md:py-36 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Everything you need to ship
            </h2>
            <p className="text-xl text-slate-300 max-w-xl mx-auto">
              Not just a website builder. A complete platform for building, launching,
              and growing your online presence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 hover:bg-white/[0.06] hover:border-white/[0.10] transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                  <p className="text-[15px] text-slate-400 leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FREE TOOLS — lighter section ── */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/10 via-slate-900/20 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" /> 100% Free — No Account Required
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              Free tools that actually work
            </h2>
            <p className="text-xl text-slate-300 max-w-xl mx-auto">
              12 essential business and developer tools. Free forever. No strings attached.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: "Business Name Generator", href: "/tools/business-name-generator", desc: "AI-powered names" },
              { name: "Password Generator", href: "/tools/password-generator", desc: "Secure passwords" },
              { name: "QR Code Generator", href: "/tools/qr-code-generator", desc: "Create QR codes" },
              { name: "Meta Tag Generator", href: "/tools/meta-tag-generator", desc: "SEO meta tags" },
              { name: "Color Palette", href: "/tools/color-palette-generator", desc: "Design palettes" },
              { name: "Invoice Generator", href: "/tools/invoice-generator", desc: "Professional invoices" },
              { name: "JSON Formatter", href: "/tools/json-formatter", desc: "Format & validate" },
              { name: "Privacy Policy", href: "/tools/privacy-policy-generator", desc: "Legal templates" },
              { name: "Robots.txt Generator", href: "/tools/robots-txt-generator", desc: "SEO crawl control" },
              { name: "Word Counter", href: "/tools/word-counter", desc: "Count & analyze" },
              { name: "Domain Search", href: "/domains", desc: "Real availability" },
              { name: "Domain Finder", href: "/domain-finder", desc: "AI name ideas" },
            ].map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-emerald-500/20 transition-all"
              >
                <div className="text-[15px] font-semibold text-white group-hover:text-emerald-300 transition-colors mb-1">{tool.name}</div>
                <div className="text-sm text-slate-500">{tool.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS — what we offer ── */}
      <section className="py-28 md:py-36 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">
              More than a website builder
            </h2>
            <p className="text-xl text-slate-300 max-w-xl mx-auto">
              eSIM, VPN, cloud storage, AI dictation, booking — everything a modern business needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: "eSIM", desc: "Travel data plans for 190+ countries. No physical SIM needed.", href: "/products/esim", color: "text-cyan-400", bg: "bg-cyan-500/10", badge: "New" },
              { name: "VPN", desc: "Secure, private browsing with global servers. No-log policy.", href: "/products/vpn", color: "text-emerald-400", bg: "bg-emerald-500/10", badge: "New" },
              { name: "Cloud Storage", desc: "S3-compatible storage. Upload, share, and manage files.", href: "/products/cloud-storage", color: "text-purple-400", bg: "bg-purple-500/10", badge: "New" },
              { name: "AI Dictation", desc: "Speech-to-text powered by AI. 50+ languages supported.", href: "/products/dictation", color: "text-amber-400", bg: "bg-amber-500/10", badge: "New" },
              { name: "Booking", desc: "Scheduling, appointments, and calendar management.", href: "/products/booking", color: "text-pink-400", bg: "bg-pink-500/10", badge: "New" },
              { name: "Video Creator", desc: "AI spokesperson videos, storyboards, and rendering.", href: "/video-creator", color: "text-indigo-400", bg: "bg-indigo-500/10", badge: null },
            ].map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-7 hover:bg-white/[0.06] hover:border-white/[0.10] transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center`}>
                    <Globe className={`w-5 h-5 ${p.color}`} />
                  </div>
                  {p.badge && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">{p.badge}</span>}
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">{p.name}</h3>
                <p className="text-[15px] text-slate-400 leading-relaxed">{p.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUE PROPOSITION — lighter section ── */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/15 via-slate-900/20 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-indigo-400 mb-4">
            Replace your entire SaaS stack
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            75+ tools. One platform.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              $49/month.
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-12">
            Website builder, CRM, invoicing, booking, email marketing, forms, analytics,
            SEO tools, and more — replacing $923/month in separate subscriptions.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: "Website Builder", saves: "Replaces Wix" },
              { label: "CRM", saves: "Replaces HubSpot" },
              { label: "Email Marketing", saves: "Replaces ConvertKit" },
              { label: "Invoicing", saves: "Replaces FreshBooks" },
              { label: "Booking", saves: "Replaces Calendly" },
              { label: "Forms", saves: "Replaces Typeform" },
              { label: "Automation", saves: "Replaces Zapier" },
              { label: "Analytics", saves: "Replaces Hotjar" },
            ].map((t) => (
              <div key={t.label} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5 text-left">
                <div className="text-[15px] font-semibold text-white mb-1">{t.label}</div>
                <div className="text-sm text-slate-500">{t.saves}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 md:py-32 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-slate-400">
              Start free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.featured
                    ? "border-2 border-indigo-500/30 bg-indigo-500/[0.04] relative"
                    : "border border-white/[0.06] bg-white/[0.03]"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                    Most Popular
                  </div>
                )}
                <div className="text-base text-slate-400 mb-2">{plan.name}</div>
                <div className="text-4xl font-bold mb-1">
                  {plan.price}
                  <span className="text-lg font-normal text-slate-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 my-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-base text-slate-400">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.featured ? "text-indigo-400" : "text-slate-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full py-3 text-center rounded-full text-base font-semibold transition-colors ${
                    plan.featured
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-white/[0.1] text-slate-400 hover:text-white hover:border-white/[0.2]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            Need more?{" "}
            <a href="mailto:sales@zoobicon.com" className="text-slate-400 underline underline-offset-4 hover:text-white transition-colors">
              Contact sales
            </a>{" "}
            for Enterprise.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 md:py-40 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Stop browsing.<br />
            Start building.
          </h2>
          <p className="text-xl text-slate-400 max-w-lg mx-auto mb-10">
            Join creators, agencies, and entrepreneurs who ship
            production-ready websites in minutes, not months.
          </p>
          <Link
            href="/builder"
            className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-[#0a0a14] text-lg font-bold hover:bg-slate-100 transition-colors"
          >
            Start Building Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER — comprehensive, shows everything ── */}
      <footer className="border-t border-white/[0.06] bg-[#080810] py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-x-8 gap-y-10 mb-16">
            {/* Brand */}
            <div className="col-span-2">
              <div className="text-3xl font-black tracking-tight mb-4">Zoobicon</div>
              <p className="text-[15px] text-slate-400 max-w-xs leading-relaxed mb-6">
                The AI platform for building, launching, and scaling
                websites and web applications.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <a href="https://zoobicon.com" className="px-4 py-2 rounded-full bg-indigo-500/15 text-indigo-300 font-semibold text-sm hover:bg-indigo-500/25 transition-colors">zoobicon.com</a>
                <a href="https://zoobicon.ai" className="px-4 py-2 rounded-full bg-cyan-500/15 text-cyan-300 font-semibold text-sm hover:bg-cyan-500/25 transition-colors">zoobicon.ai</a>
                <a href="https://zoobicon.io" className="px-4 py-2 rounded-full bg-emerald-500/15 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/25 transition-colors">zoobicon.io</a>
                <a href="https://zoobicon.sh" className="px-4 py-2 rounded-full bg-amber-500/15 text-amber-300 font-semibold text-sm hover:bg-amber-500/25 transition-colors">zoobicon.sh</a>
              </div>
            </div>

            {/* Products */}
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Products</div>
              <ul className="space-y-2.5">
                {[
                  ["/builder", "AI Website Builder"],
                  ["/generators", "43 Generators"],
                  ["/video-creator", "Video Creator"],
                  ["/domains", "Domain Search"],
                  ["/domain-finder", "Domain Finder"],
                  ["/products/esim", "eSIM"],
                  ["/products/vpn", "VPN"],
                  ["/products/cloud-storage", "Cloud Storage"],
                  ["/products/dictation", "AI Dictation"],
                  ["/products/booking", "Booking"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Free Tools */}
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Free Tools</div>
              <ul className="space-y-2.5">
                {[
                  ["/tools/business-name-generator", "Business Name Generator"],
                  ["/tools/password-generator", "Password Generator"],
                  ["/tools/qr-code-generator", "QR Code Generator"],
                  ["/tools/meta-tag-generator", "Meta Tag Generator"],
                  ["/tools/color-palette-generator", "Color Palette"],
                  ["/tools/invoice-generator", "Invoice Generator"],
                  ["/tools/json-formatter", "JSON Formatter"],
                  ["/tools/privacy-policy-generator", "Privacy Policy Generator"],
                  ["/tools/robots-txt-generator", "Robots.txt Generator"],
                  ["/tools/word-counter", "Word Counter"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Platform</div>
              <ul className="space-y-2.5">
                {[
                  ["/hosting", "Hosting"],
                  ["/developers", "API Docs"],
                  ["/agents", "AI Agents"],
                  ["/marketplace", "Marketplace"],
                  ["/agencies", "For Agencies"],
                  ["/products/seo-agent", "SEO Agent"],
                  ["/products/email-support", "Email Support"],
                  ["/documentation", "Documentation"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <div className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Company</div>
              <ul className="space-y-2.5">
                {[
                  ["/pricing", "Pricing"],
                  ["/compare", "Compare"],
                  ["/support", "Support"],
                  ["/privacy", "Privacy Policy"],
                  ["/terms", "Terms of Service"],
                  ["/refund-policy", "Refund Policy"],
                  ["/acceptable-use", "Acceptable Use"],
                  ["/disclaimers", "Disclaimers"],
                  ["/dmca", "DMCA"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">&copy; 2026 Zoobicon. All rights reserved.</div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link href="/refund-policy" className="hover:text-slate-300 transition-colors">Refunds</Link>
              <Link href="/disclaimers" className="hover:text-slate-300 transition-colors">Disclaimers</Link>
              <Link href="/dmca" className="hover:text-slate-300 transition-colors">DMCA</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
