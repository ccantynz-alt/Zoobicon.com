"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import HeroDemo from "@/components/HeroDemo";
import ScrollProgress from "@/components/ScrollProgress";
import {
  ArrowRight,
  Menu,
  X,
  Check,
  Shield,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Globe,
  Brain,
  Code2,
  Terminal,
} from "lucide-react";

const ShowcaseGallery = dynamic(() => import("@/components/ShowcaseGallery"), { ssr: false });

/* ─── animation presets ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

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
    // Laptop with code — developer workspace (clean, warm tones)
    bg: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2400&q=80",
    badge: "AI Website Builder for the Modern Web",
    h1: ["Prompt.", "Preview.", "Publish."],
    accent: 2, // which word gets the brand color (0-indexed)
    sub: "7 AI agents collaborate in real-time to build production-ready websites, apps, and stores — from a single sentence.",
  },
  {
    // Clean tech abstract — servers/technology, blue tones, minimal
    bg: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=2400&q=80",
    badge: "From Idea to Live Site in 95 Seconds",
    h1: ["Describe.", "Generate.", "Launch."],
    accent: 2,
    sub: "Full-stack apps, e-commerce stores, multi-page sites — built by AI agents, deployed instantly to your custom domain.",
  },
  {
    // Earth from space with glowing data network — cinematic, conveys global scale
    bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=80",
    badge: "43 Specialized Generators. One Platform.",
    h1: ["Dream.", "Build.", "Ship."],
    accent: 2,
    sub: "SaaS dashboards, restaurant sites, portfolios, email templates — each with a purpose-built AI pipeline tuned for quality.",
  },
  {
    // Clean modern workspace from above — bright, professional, airy
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

  // Preload images
  useEffect(() => {
    HERO_SLIDES.forEach((slide, i) => {
      const img = new Image();
      img.onload = () => setImagesLoaded(prev => { const n = [...prev]; n[i] = true; return n; });
      img.src = slide.bg;
    });
  }, []);

  // Auto-rotate every 6s
  useEffect(() => {
    const id = setInterval(() => setCurrent(i => (i + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const slide = HERO_SLIDES[current];

  return (
    <section className="relative h-screen min-h-[700px] max-h-[1100px] overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/60 z-[2]" />
      {/* Subtle brand-colored vignette */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7c5aff]/[0.08] via-transparent to-transparent z-[2]" />

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
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium text-white/80 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
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
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-[#7c5aff] to-[#b794ff]"
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
            className="text-base md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
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
            className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-[#7c5aff] text-white text-[15px] font-bold hover:bg-[#6d3bff] transition-all shadow-[0_0_40px_rgba(124,90,255,0.3)] hover:shadow-[0_0_60px_rgba(124,90,255,0.45)]"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold text-white/80 bg-white/[0.08] backdrop-blur-sm border border-white/[0.15] hover:bg-white/[0.14] hover:border-white/[0.25] transition-all"
          >
            Watch It Build
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-8 text-sm text-white/50 font-light tracking-wide"
        >
          Trusted by developers, agencies &amp; entrepreneurs worldwide
        </motion.p>

        {/* Slide indicators */}
        <div className="flex items-center gap-2 mt-8">
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
          <span className="text-[11px] text-white/50 uppercase tracking-[0.2em] font-medium">Scroll</span>
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

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem("zoobicon_user"); if (s) setUser(JSON.parse(s)); } catch {}
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    setUser(null);
  };

  return (
    <div className="relative bg-[#050505] text-white selection:bg-[#7c5aff]/30 selection:text-white">
      <ScrollProgress />

      {/* ── NAV ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#050505]/90 backdrop-blur-2xl border-b border-white/[0.06]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`flex items-center justify-between transition-all ${scrolled ? "h-14" : "h-16"}`}>
            <Link href="/" className="text-lg font-bold tracking-tight">
              Zoobicon
            </Link>
            <div className="hidden md:flex items-center gap-8 text-[13px] text-white/50">
              <Link href="/generators" className="hover:text-white transition-colors">Generators</Link>
              <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
              <Link href="/developers" className="hover:text-white transition-colors">Developers</Link>
              <Link href="/agencies" className="hover:text-white transition-colors">Agencies</Link>
              <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-[13px] text-white/50 hover:text-white transition-colors px-3 py-1.5 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-[13px] text-white/50 hover:text-white transition-colors px-3 py-1.5 flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="text-[13px] text-white/50 hover:text-white transition-colors">Sign in</Link>
              )}
              <Link
                href="/builder"
                className="text-[13px] font-semibold px-5 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors"
              >
                Start Building
              </Link>
            </div>
            <button className="md:hidden text-white/60" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden fixed inset-0 top-14 bg-[#050505]/98 backdrop-blur-2xl z-40 px-6 py-8 flex flex-col"
            >
              <div className="space-y-1 flex-1">
                {[
                  { href: "/generators", label: "Generators" },
                  { href: "/marketplace", label: "Marketplace" },
                  { href: "/developers", label: "Developers" },
                  { href: "/agencies", label: "Agencies" },
                  { href: "/pricing", label: "Pricing" },
                  { href: "/support", label: "Support" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-lg font-medium text-white/60 hover:text-white py-3 border-b border-white/[0.06]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="pt-6 border-t border-white/[0.06]">
                <Link href="/builder" onClick={() => setMobileMenuOpen(false)} className="block py-4 rounded-xl text-center text-base font-bold bg-white text-black">
                  Start Building Free
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══════════════════════════════════════════════
          SECTION 1 — CINEMATIC HERO
          Full-bleed product photo + overlaid text — Astra-inspired
          ═══════════════════════════════════════════════ */}
      <HeroShowcase />

      {/* ═══════════════════════════════════════════════
          SECTION 1.25 — FOUR DOMAINS, ONE PLATFORM
          Showcases zoobicon.com / .ai / .io / .sh
          ═══════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 bg-[#0a0a12] overflow-hidden">
        {/* subtle radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={stagger} className="text-center mb-14"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold tracking-[0.2em] uppercase text-purple-400 mb-3">
              One Platform — Four Experiences
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-white">
              Every domain, a different{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">superpower</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {/* zoobicon.com */}
            <motion.div variants={fadeUp} className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-purple-500/40 transition-all duration-300 hover:bg-white/[0.06]">
              <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center mb-4 group-hover:bg-purple-500/25 transition-colors">
                <Globe className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">zoobicon.com</h3>
              <p className="text-sm text-white/50 mb-3">The Builder</p>
              <p className="text-sm text-white/70 leading-relaxed">
                Full AI website builder. Prompt-to-production sites, stores, and apps with 43 specialized generators.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5">
                <Link href="/builder" className="text-xs font-semibold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 transition-colors">
                  Start building <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>

            {/* zoobicon.ai */}
            <motion.div variants={fadeUp} className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-cyan-500/40 transition-all duration-300 hover:bg-white/[0.06]">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/15 flex items-center justify-center mb-4 group-hover:bg-cyan-500/25 transition-colors">
                <Brain className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">zoobicon.ai</h3>
              <p className="text-sm text-white/50 mb-3">The Intelligence</p>
              <p className="text-sm text-white/70 leading-relaxed">
                AI-forward features — multi-LLM pipeline, autonomous SEO agent, smart templates, and intelligent optimization.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5">
                <Link href="/ai" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors">
                  Explore AI <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>

            {/* zoobicon.io */}
            <motion.div variants={fadeUp} className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-emerald-500/40 transition-all duration-300 hover:bg-white/[0.06]">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-4 group-hover:bg-emerald-500/25 transition-colors">
                <Code2 className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">zoobicon.io</h3>
              <p className="text-sm text-white/50 mb-3">The Developer Hub</p>
              <p className="text-sm text-white/70 leading-relaxed">
                Public API, webhooks, GitHub integration, project mode — built for developers who ship programmatically.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5">
                <Link href="/io" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 transition-colors">
                  View API docs <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>

            {/* zoobicon.sh */}
            <motion.div variants={fadeUp} className="group relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-amber-500/40 transition-all duration-300 hover:bg-white/[0.06]">
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4 group-hover:bg-amber-500/25 transition-colors">
                <Terminal className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">zoobicon.sh</h3>
              <p className="text-sm text-white/50 mb-3">The Deploy Engine</p>
              <p className="text-sm text-white/70 leading-relaxed">
                Instant hosting and deployment. Every site gets a live URL at yoursite.zoobicon.sh — SSL, CDN, and analytics included.
              </p>
              <div className="mt-4 pt-3 border-t border-white/5">
                <Link href="/sh" className="text-xs font-semibold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 transition-colors">
                  Deploy now <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 1.5 — LIVE DEMO (the proof)
          Bold light section that breaks from the dark theme
          ═══════════════════════════════════════════════ */}
      <section id="demo" className="relative py-24 md:py-32 bg-gradient-to-b from-[#FFF8F0] via-white to-[#FFF5EB] overflow-hidden">
        {/* Warm accent decorations */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-400/20 via-orange-300/10 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-rose-400/15 via-red-300/10 to-transparent rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 mb-6">
                Live Builder Preview
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-4 text-gray-900">
                Watch it build in{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500">
                  real-time.
                </span>
              </h2>
              <p className="text-base md:text-lg text-gray-500 max-w-xl mx-auto">
                Type a prompt. Watch 7 AI agents collaborate to build your site.
                Full-stack apps, e-commerce stores, dashboards — in seconds.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="relative max-w-5xl mx-auto">
              <div className="absolute -inset-8 bg-gradient-to-br from-amber-400/10 via-orange-300/5 to-rose-400/10 rounded-[32px] blur-2xl pointer-events-none" />
              <div className="relative rounded-2xl shadow-2xl shadow-orange-900/10 ring-1 ring-black/5">
                <HeroDemo />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Transition gradient back to dark */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[#050505]" />
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 2 — PROOF (numbers + showcase)
          "Don't tell me. Show me."
          ═══════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Stats strip — real numbers */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden mb-24 md:mb-32"
          >
            {[
              { val: 44, suffix: "", label: "Specialized generators" },
              { val: 100, suffix: "+", label: "Ready-made templates" },
              { val: 95, suffix: "s", label: "Average build time" },
              { val: 7, suffix: "", label: "AI agents per build" },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-[#0a0a0a] p-8 md:p-10 text-center">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                  <Counter end={s.val} suffix={s.suffix} />
                </div>
                <div className="text-xs text-white/50 uppercase tracking-[0.15em]">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Showcase gallery */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-4">
                Real output. Not mockups.
              </h2>
              <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto">
                Every site below was generated by Zoobicon from a single prompt.
                Click to see the prompt that created it.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} id="showcase">
              <ShowcaseGallery />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 3 — HOW IT WORKS (3 steps, simple)
          ═══════════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-4">
                Describe it. We build it.
              </h2>
              <p className="text-base md:text-lg text-white/50 max-w-lg mx-auto">
                Three steps. No code. No templates. No compromise.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-12">
              {[
                {
                  num: "01",
                  title: "Describe your vision",
                  body: "Type what you want in plain English. A fintech dashboard, a bakery site, an e-commerce store — anything.",
                },
                {
                  num: "02",
                  title: "7 agents build it",
                  body: "Strategist, designer, copywriter, architect, developer, SEO specialist, and animator work in parallel.",
                },
                {
                  num: "03",
                  title: "Deploy instantly",
                  body: "Your site goes live with one click. Edit visually, export to React or WordPress, connect a custom domain.",
                },
              ].map((step, i) => (
                <motion.div key={i} variants={fadeUp} className="relative">
                  <div className="text-[80px] md:text-[100px] font-black text-white/[0.03] leading-none absolute -top-6 -left-2 select-none pointer-events-none">
                    {step.num}
                  </div>
                  <div className="relative pt-8">
                    <div className="text-xs font-bold text-[#7c5aff] mb-3 tracking-[0.2em] uppercase">
                      Step {step.num}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">{step.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{step.body}</p>
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-16 -right-6 lg:-right-8 w-4 text-white/10">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* What it can build */}
            <motion.div variants={fadeUp} className="mt-20 text-center">
              <p className="text-xs text-white/50 uppercase tracking-[0.2em] mb-6">What you can build</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "SaaS Landing Pages", "E-Commerce Stores", "Portfolios", "Dashboards",
                  "Restaurants", "Agency Sites", "Blogs", "Full-Stack Apps",
                  "Multi-Page Sites", "Email Templates",
                ].map((tag) => (
                  <span key={tag} className="px-4 py-2 rounded-full border border-white/[0.06] text-xs text-white/50 hover:text-white/50 hover:border-white/[0.12] transition-all cursor-default">
                    {tag}
                  </span>
                ))}
                <Link
                  href="/generators"
                  className="px-4 py-2 rounded-full border border-[#7c5aff]/20 text-xs text-[#7c5aff]/60 hover:text-[#7c5aff] hover:border-[#7c5aff]/40 transition-all"
                >
                  +34 more generators →
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 4 — PRICING (clean, minimal)
          ═══════════════════════════════════════════════ */}
      <section id="pricing" className="relative py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-4">
                Simple pricing.
              </h2>
              <p className="text-base text-white/50">
                No credits. No tokens. No usage traps. Start free, upgrade when ready.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid md:grid-cols-3 gap-4">
              {/* Free */}
              <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-sm text-white/50 mb-2">Free</div>
                <div className="text-4xl font-extrabold mb-1">$0</div>
                <div className="text-xs text-white/50 mb-6">Forever</div>
                <ul className="space-y-3 mb-8">
                  {["3 sites / month", "7-agent AI pipeline", "Opus-quality builds", "Free hosting"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/50">
                      <Check className="w-3.5 h-3.5 text-white/50 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/builder" className="block w-full py-3 text-center rounded-full border border-white/[0.1] text-sm font-semibold text-white/60 hover:text-white hover:border-white/[0.2] transition-all">
                  Get Started
                </Link>
              </div>

              {/* Pro — featured */}
              <div className="relative p-8 rounded-2xl border border-[#7c5aff]/30 bg-[#7c5aff]/[0.04]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#7c5aff] text-[11px] font-bold text-white">
                  Most Popular
                </div>
                <div className="text-sm text-[#7c5aff]/70 mb-2">Pro</div>
                <div className="text-4xl font-extrabold mb-1">$49<span className="text-lg font-normal text-white/50">/mo</span></div>
                <div className="text-xs text-white/50 mb-6">Full arsenal</div>
                <ul className="space-y-3 mb-8">
                  {["Unlimited sites", "All 44 generators", "Custom domains", "GitHub & WP export", "Visual editor", "Multi-page sites"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/50">
                      <Check className="w-3.5 h-3.5 text-[#7c5aff]/60 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block w-full py-3 text-center rounded-full bg-[#7c5aff] text-sm font-bold text-white hover:bg-[#6d3bff] transition-colors">
                  Start Pro Trial
                </Link>
              </div>

              {/* Agency */}
              <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-sm text-white/50 mb-2">Agency</div>
                <div className="text-4xl font-extrabold mb-1">$99<span className="text-lg font-normal text-white/50">/mo</span></div>
                <div className="text-xs text-white/50 mb-6">White-label</div>
                <ul className="space-y-3 mb-8">
                  {["Everything in Pro", "White-label platform", "Client portal", "Bulk generation", "API access", "Priority support"].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/50">
                      <Check className="w-3.5 h-3.5 text-white/50 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block w-full py-3 text-center rounded-full border border-white/[0.1] text-sm font-semibold text-white/60 hover:text-white hover:border-white/[0.2] transition-all">
                  Start Agency Trial
                </Link>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center mt-8">
              <p className="text-xs text-white/50">
                Need more? <a href="mailto:sales@zoobicon.com" className="text-white/50 underline underline-offset-4 hover:text-white/60 transition-colors">Contact sales</a> for Enterprise.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          SECTION 5 — FINAL CTA
          ═══════════════════════════════════════════════ */}
      <section className="relative py-32 md:py-40 border-t border-white/[0.04] overflow-hidden">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7c5aff]/[0.03] to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-[5.5rem] font-extrabold tracking-[-0.05em] leading-[0.9] mb-6"
            >
              Stop browsing.<br />
              Start building.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-white/50 max-w-lg mx-auto mb-10">
              Join creators, agencies, and entrepreneurs who ship
              production-ready websites in minutes, not months.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link
                href="/builder"
                className="group inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black text-lg font-bold hover:bg-white/90 transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.12)]"
              >
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="text-lg font-bold mb-4">Zoobicon</div>
              <p className="text-sm text-white/50 max-w-xs leading-relaxed mb-6">
                The AI platform for building, launching, and scaling
                websites and web applications.
              </p>
              <div className="flex gap-2">
                {["zoobicon.com", "zoobicon.ai", "zoobicon.io", "zoobicon.sh"].map((d) => (
                  <span key={d} className="text-[10px] text-white/50 bg-white/[0.04] px-2 py-1 rounded-full">{d}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-4">Products</div>
              <ul className="space-y-2">
                {[
                  ["/products/website-builder", "Website Builder"],
                  ["/products/seo-agent", "SEO Agent"],
                  ["/products/email-support", "Email Support"],
                  ["/generators", "44 Generators"],
                  ["/marketplace", "Marketplace"],
                  ["/domains", "Domains"],
                ].map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-sm text-white/50 hover:text-white/50 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-4">Platform</div>
              <ul className="space-y-2">
                {[
                  ["/developers", "API Docs"],
                  ["/cli", "CLI Tools"],
                  ["/hosting", "Hosting"],
                  ["/wordpress", "WordPress"],
                ].map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-sm text-white/50 hover:text-white/50 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-4">Company</div>
              <ul className="space-y-2">
                {[
                  ["/agencies", "For Agencies"],
                  ["/support", "Support"],
                  ["/pricing", "Pricing"],
                  ["/privacy", "Privacy"],
                  ["/terms", "Terms"],
                ].map(([href, label]) => (
                  <li key={href}><Link href={href} className="text-sm text-white/50 hover:text-white/50 transition-colors">{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/50">&copy; 2026 Zoobicon. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-white/50 hover:text-white/50 transition-colors">Privacy</Link>
              <Link href="/terms" className="text-xs text-white/50 hover:text-white/50 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
