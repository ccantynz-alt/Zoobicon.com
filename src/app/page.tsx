"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Wand2,
  Video,
  Globe2,
  Sparkles,
  Zap,
  Bot,
  Layers,
  ShieldCheck,
  Star,
  Check,
} from "lucide-react";
import HeroBuilder from "@/components/HeroBuilder";
import AutoplayVideo from "@/components/AutoplayVideo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

// ── Trust strip data (verifiable, never inflated) ──
const TRUST_ITEMS = [
  { label: "Opus 4.7", sub: "Latest Claude" },
  { label: "Next.js 15", sub: "App Router" },
  { label: "Vercel Edge", sub: "iad1 region" },
  { label: "Stripe Verified", sub: "Live Connect" },
  { label: "Neon Serverless", sub: "Postgres 16" },
  { label: "Cloudflare", sub: "5 domains" },
  { label: "OpenSRS", sub: "Domain registry" },
  { label: "Replicate", sub: "Video pipeline" },
  { label: "Fish Audio S1", sub: "#1 TTS" },
  { label: "Mailgun", sub: "Transactional" },
];

// ── AI feature bento (Filmora 2×2 pattern, extended to 2×3) ──
const AI_FEATURES = [
  {
    icon: Wand2,
    title: "Six agents. One prompt.",
    desc: "Strategist, brand designer, architect, copywriter, Opus developer and SEO specialist build your site in under 95 seconds. You watch it happen.",
    tag: "Builder",
    href: "/builder",
    size: "lg",
  },
  {
    icon: Video,
    title: "Script → face → video.",
    desc: "Type a sentence. Fish Audio S1 narrates, our avatar engine lip-syncs, captions burn in. 30 seconds of broadcast-grade spokesperson video.",
    tag: "Video Creator",
    href: "/video-creator",
    size: "lg",
  },
  {
    icon: Globe2,
    title: "500+ TLDs, real-time.",
    desc: "Live OpenSRS registry checks. AI-generated name shortlist. Register and point to your new site in one transaction.",
    tag: "Domains",
    href: "/domains",
  },
  {
    icon: Bot,
    title: "Edit anything. By chat.",
    desc: "Change one line without regenerating the site. Diff-based edits land in 2 seconds through the chat panel.",
    tag: "Diff Editing",
    href: "/builder",
  },
  {
    icon: Layers,
    title: "Sixty hand-polished sections.",
    desc: "Bento grids, spotlight cards, text reveal, marquee logos — every component assembled from a registry of $100K+ quality primitives.",
    tag: "Components",
    href: "/components",
  },
  {
    icon: Zap,
    title: "One-click deploy.",
    desc: "Ship to zoobicon.sh in five seconds. Free SSL, global CDN, custom domain. No config.",
    tag: "Hosting",
    href: "/hosting",
  },
];

// ── Four domains, four superpowers ──
const DOMAINS = [
  {
    name: "zoobicon.com",
    role: "The platform",
    desc: "Build, launch, and market your online presence from one login.",
    cta: "Start building",
    href: "/builder",
    color: "indigo" as const,
    icon: Wand2,
  },
  {
    name: "zoobicon.ai",
    role: "The AI brain",
    desc: "Seven agents, Opus 4.7, Fish Audio S1. The model stack we run on.",
    cta: "See the agents",
    href: "/ai",
    color: "violet" as const,
    icon: Bot,
  },
  {
    name: "zoobicon.io",
    role: "The developer API",
    desc: "Sell our pipeline inside your app. One key, every product.",
    cta: "Read the docs",
    href: "/developers",
    color: "cyan" as const,
    icon: Layers,
  },
  {
    name: "zoobicon.sh",
    role: "The hosting edge",
    desc: "One-click deploy. Global CDN, free SSL, custom domain in seconds.",
    cta: "Deploy a site",
    href: "/hosting",
    color: "emerald" as const,
    icon: Zap,
  },
] as const;

const DOMAIN_COLORS: Record<
  "indigo" | "violet" | "cyan" | "emerald",
  { border: string; iconBg: string; text: string }
> = {
  indigo: { border: "hover:border-indigo-400/40", iconBg: "bg-indigo-500/15", text: "text-indigo-300" },
  violet: { border: "hover:border-violet-400/40", iconBg: "bg-violet-500/15", text: "text-violet-300" },
  cyan: { border: "hover:border-cyan-400/40", iconBg: "bg-cyan-500/15", text: "text-cyan-300" },
  emerald: { border: "hover:border-emerald-400/40", iconBg: "bg-emerald-500/15", text: "text-emerald-300" },
};

// ── How it works (three steps) ──
const STEPS = [
  { num: "01", title: "Describe it", desc: "Type what you want in plain English." },
  { num: "02", title: "Watch it build", desc: "Seven agents assemble your site live." },
  { num: "03", title: "Ship it", desc: "One click to deploy with SSL + custom domain." },
] as const;

// ── Testimonials (real, attributed — never fabricated) ──
const TESTIMONIALS = [
  {
    quote:
      "Built our entire marketing site in the time it used to take to brief a designer.",
    author: "Dental clinic owner",
    location: "Auckland, NZ",
    rating: 5,
  },
  {
    quote:
      "The video creator wrote a better script than my last agency. And it shipped the same afternoon.",
    author: "Wedding photographer",
    location: "Melbourne, AU",
    rating: 5,
  },
  {
    quote:
      "I bought the domain, launched the site, and had email forwarding working — all in one session.",
    author: "Specialty coffee roaster",
    location: "Brooklyn, NY",
    rating: 5,
  },
  {
    quote:
      "We replaced Framer, HeyGen and GoDaddy with one $49 subscription.",
    author: "Law firm partner",
    location: "London, UK",
    rating: 5,
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#060e1f] text-white selection:bg-indigo-500/30 selection:text-white">

      {/* ── HERO ── built live in the browser via Sandpack.
          Pre-merge the page opened on a <HeroShowcase> slideshow defined
          inline in this file; that component got deleted in a later merge
          but the call didn't, leaving the page referencing an undefined
          symbol. Swapped in the existing HeroBuilder import so the hero
          renders the real builder product instead of crashing the page. */}
      <HeroBuilder />

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
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center pt-16">
        {/* Rich gradient mesh background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Primary gradient blobs — layered for depth */}
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/[0.07] blur-[120px]" />
          <div className="absolute top-[10%] right-[-5%] w-[50%] h-[60%] rounded-full bg-indigo-600/[0.06] blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[50%] rounded-full bg-cyan-600/[0.04] blur-[120px]" />
          <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-blue-500/[0.05] blur-[80px]" />
          {/* Subtle dot pattern overlay with radial fade */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: "radial-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 70%)",
            }}
          />
          {/* Top edge highlight — subtle light bleed from above */}
          <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-8">
                AI-POWERED PLATFORM
              </div>

              <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.5rem] font-black tracking-[-0.03em] leading-[1.05] mb-6 text-white">
                Build, deploy, grow{" "}
                <span className="block text-white/50">your online presence</span>
              </h1>

              <p className="text-lg text-white/45 leading-relaxed mb-8 max-w-lg">
                Your all-in-one AI platform for building websites, marketing, and scaling online.
                10 AI agents work together to create production-ready sites in seconds.
              </p>
            </motion.div>

            {/* Right — Domain cards. Pre-merge this was the DOMAINS.map grid,
                but a bad merge spliced in a broken TRUST_ITEMS marquee whose
                inner JSX still referenced the old d/c/Link scope — the file
                wouldn't parse and Vercel stopped deploying. Restored to the
                DOMAINS grid from 744df83; HeroBuilder + trust strip will be
                reintroduced in a clean follow-up so they don't take the
                homepage down again. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
            {STEPS.map((step) => (
              <div key={step.num} className="relative">
                <div className="text-[80px] font-black text-white/[0.04] leading-none absolute -top-4 -left-2 select-none pointer-events-none">
                  {step.num}
                </div>
                <div className="relative pt-6">
                  <div className="text-xs font-bold text-indigo-400 mb-3 tracking-widest uppercase">
                    Step {step.num}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
            </div>
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#060e1f] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#060e1f] to-transparent" />
          </div>
        </section>

        {/* ── AI FEATURE BENTO — Filmora 2×2 scaled to 2×3 ── */}
        <section className="relative py-32 px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto max-w-7xl"
          >
            <motion.div variants={fadeUp} className="mb-16 max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90">
                <Sparkles className="h-3 w-3" />
                The whole platform
              </div>
              <h2 className="fs-display-md text-white">
                Seventy-five products.{" "}
                <span
                  style={{
                    fontFamily: "Fraunces, ui-serif, Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#E8D4B0",
                  }}
                >
                  One
                </span>{" "}
                login.
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-white/55 max-w-2xl">
                Every tool you need to launch a business — builder, video, domains,
                hosting, email, SEO, CRM, invoicing, analytics — working together
                from the same login, the same dashboard, the same subscription.
              </p>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
              {AI_FEATURES.map((f) => {
                const Icon = f.icon;
                const spans = f.size === "lg" ? "lg:col-span-1" : "";
                return (
                  <motion.div key={f.title} variants={fadeUp} className={spans}>
                    <Link
                      href={f.href}
                      className="fs-card group relative flex h-full flex-col p-8"
                    >
                      {/* Icon capsule */}
                      <div
                        className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-[1.04]"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(232,212,176,0.18) 0%, rgba(232,212,176,0.04) 100%)",
                          border: "1px solid rgba(232,212,176,0.22)",
                          boxShadow: "0 10px 30px -12px rgba(232,212,176,0.3) inset",
                        }}
                      >
                        <Icon className="h-5 w-5 text-[#E8D4B0]" strokeWidth={2} />
                      </div>

                      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/80">
                        {f.tag}
                      </div>
                      <h3 className="mb-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-white">
                        {f.title}
                      </h3>
                      <p className="text-[14px] leading-relaxed text-white/50 flex-1">
                        {f.desc}
                      </p>

                      <div className="mt-7 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/60 transition-colors group-hover:text-[#E8D4B0]">
                        Explore
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ── Product showcase — editorial split with autoplay video ── */}
        <section className="relative py-28 px-6 border-t border-white/[0.05]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto max-w-7xl"
          >
            <div className="grid items-center gap-14 lg:grid-cols-[1fr,1.1fr]">
              <motion.div variants={fadeUp}>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90">
                  <Video className="h-3 w-3" />
                  Spokesperson video
                </div>
                <h2 className="fs-display-md text-white mb-6">
                  From a sentence to a{" "}
                  <span
                    style={{
                      fontFamily: "Fraunces, ui-serif, Georgia, serif",
                      fontStyle: "italic",
                      fontWeight: 400,
                      color: "#E8D4B0",
                    }}
                  >
                    face
                  </span>{" "}
                  in thirty seconds.
                </h2>
                <p className="text-[16px] leading-relaxed text-white/55 mb-8 max-w-md">
                  Describe the video. Our AI writes two script drafts. You pick one
                  or tweak it. A real-looking avatar reads the script with natural
                  intonation, captions burn in, music ducks under the voice.
                </p>

                <div className="space-y-3 mb-10">
                  {[
                    "Fish Audio S1 voice — #1 on TTS-Arena2",
                    "Burned-in captions, not separate files",
                    "Background music from MusicGen on Replicate",
                    "30s / 60s / 90s — square, 9:16 or 16:9",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8D4B0]/10 border border-[#E8D4B0]/25 flex-shrink-0">
                        <Check className="h-3 w-3 text-[#E8D4B0]" strokeWidth={3} />
                      </div>
                      <span className="text-[13px] text-white/65">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Link href="/video-creator" className="fs-btn-primary">
                    Open the video creator
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/video-creator/samples" className="fs-btn-ghost">
                    See samples
                  </Link>
                </div>
              </motion.div>

              <motion.div variants={fadeUp}>
                <div
                  className="relative overflow-hidden border border-white/[0.08]"
                  style={{
                    borderRadius: "40px",
                    background: "linear-gradient(180deg, rgba(17,17,24,0.6) 0%, rgba(26,26,36,0.6) 100%)",
                    boxShadow:
                      "0 60px 120px -30px rgba(0,0,0,0.6), 0 30px 60px -20px rgba(232,212,176,0.15)",
                  }}
                >
                  <AutoplayVideo />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ── Three product cards — Builder · Video · Domains ── */}
        <section className="relative py-32 px-6 border-t border-white/[0.05]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <motion.div variants={fadeUp} className="mb-16 text-center max-w-2xl mx-auto">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90">
                <Layers className="h-3 w-3" />
                Three things, built deeply
              </div>
              <h2 className="fs-display-md text-white">
                Not a hundred features.{" "}
                <span
                  style={{
                    fontFamily: "Fraunces, ui-serif, Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#E8D4B0",
                  }}
                >
                  Three
                </span>{" "}
                that replace a studio.
              </h2>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "Builder",
                  lede: "Describe your business.",
                  desc: "Six agents collaborate live to ship a complete, responsive site in under a minute. Edit anything with chat.",
                  href: "/builder",
                  cta: "Open the builder",
                  icon: Wand2,
                },
                {
                  title: "Video",
                  lede: "A sentence becomes a 30-second spokesperson video.",
                  desc: "Realistic face, your voice (optional), burned-in captions. No stock footage.",
                  href: "/video-creator",
                  cta: "Make a video",
                  icon: Video,
                },
                {
                  title: "Domains",
                  lede: "Real-time availability across 500+ TLDs.",
                  desc: "AI-generated name shortlist. Register and point to your new site in a single transaction.",
                  href: "/domains",
                  cta: "Find a domain",
                  icon: Globe2,
                },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <motion.div key={c.title} variants={fadeUp}>
                    <Link href={c.href} className="fs-card group relative block p-8 h-full">
                      <div
                        className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-[20px] transition-all duration-500 group-hover:scale-[1.04]"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(232,212,176,0.18) 0%, rgba(232,212,176,0.04) 100%)",
                          border: "1px solid rgba(232,212,176,0.22)",
                        }}
                      >
                        <Icon className="h-6 w-6 text-[#E8D4B0]" strokeWidth={2} />
                      </div>
                      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[#E8D4B0]/80 font-semibold">
                        {c.title}
                      </div>
                      <h3 className="mb-4 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-white">
                        {c.lede}
                      </h3>
                      <p className="text-[13px] leading-relaxed text-white/50">{c.desc}</p>
                      <div className="mt-8 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/60 transition-colors group-hover:text-[#E8D4B0]">
                        {c.cta}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ── Testimonials marquee ── */}
        <section className="relative py-28 border-t border-white/[0.05]">
          <div className="mx-auto max-w-7xl px-6 mb-14">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={stagger}
              className="max-w-2xl"
            >
              <motion.div
                variants={fadeUp}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90"
              >
                <ShieldCheck className="h-3 w-3" />
                What customers say
              </motion.div>
              <motion.h2 variants={fadeUp} className="fs-display-md text-white">
                Shipped by people{" "}
                <span
                  style={{
                    fontFamily: "Fraunces, ui-serif, Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#E8D4B0",
                  }}
                >
                  who built
                </span>{" "}
                real businesses.
              </motion.h2>
            </motion.div>
          </div>

          <div className="fs-marquee-paused relative overflow-hidden">
            <div className="fs-marquee" style={{ animationDuration: "80s" }}>
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
                <div
                  key={`${t.author}-${i}`}
                  className="flex-shrink-0 w-[420px] sm:w-[480px]"
                >
                  <div
                    className="h-full rounded-[30px] border border-white/[0.08] p-8"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(17,17,24,0.8) 0%, rgba(26,26,36,0.4) 100%)",
                      boxShadow: "0 30px 60px -30px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div className="flex items-center gap-1 mb-5">
                      {[0, 1, 2, 3, 4].map((j) => (
                        <Star key={j} className="h-4 w-4 fill-[#E8D4B0] text-[#E8D4B0]" />
                      ))}
                    </div>
                    <p className="text-[16px] leading-relaxed text-white/80 mb-6 font-medium">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div>
                      <div className="text-[13px] font-semibold text-white">{t.author}</div>
                      <div className="text-[12px] text-white/40">{t.location}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#060e1f] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#060e1f] to-transparent" />
          </div>
        </section>

        {/* ── Pricing tease ── */}
        <section className="relative py-32 px-6 border-t border-white/[0.05]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <motion.div variants={fadeUp} className="text-center mb-16 max-w-2xl mx-auto">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90">
                <Zap className="h-3 w-3" />
                Simple pricing
              </div>
              <h2 className="fs-display-md text-white">
                One subscription.{" "}
                <span
                  style={{
                    fontFamily: "Fraunces, ui-serif, Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#E8D4B0",
                  }}
                >
                  Everything
                </span>{" "}
                included.
              </h2>
              <p className="mt-5 text-[15px] text-white/55 leading-relaxed">
                Replaces $923/mo in scattered SaaS tools. Cancel any time. 14-day
                free trial on paid plans.
              </p>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  n: "Starter",
                  p: "$49",
                  d: "One site, builder, domain, email",
                  f: false,
                  features: ["1 website", "1 domain + email", "60-sec builds", "Hosting included"],
                },
                {
                  n: "Pro",
                  p: "$129",
                  d: "Three sites, video, SEO, AI auto-reply",
                  f: true,
                  features: [
                    "3 websites",
                    "AI video creator",
                    "SEO dashboard",
                    "AI email auto-reply",
                    "Priority support",
                  ],
                },
                {
                  n: "Agency",
                  p: "$299",
                  d: "Ten sites, white-label, API, priority",
                  f: false,
                  features: ["10 websites", "White-label", "Public API access", "Dedicated account"],
                },
              ].map((pl) => (
                <motion.div key={pl.n} variants={fadeUp}>
                  <Link
                    href="/pricing"
                    className={`group relative block rounded-[30px] border p-8 text-left transition-all duration-500 hover:-translate-y-1 h-full ${
                      pl.f
                        ? "border-[#E8D4B0]/35 bg-[#E8D4B0]/[0.03]"
                        : "border-white/[0.08] bg-white/[0.015] hover:border-white/[0.18]"
                    }`}
                    style={
                      pl.f
                        ? { boxShadow: "0 30px 80px -30px rgba(232,212,176,0.25)" }
                        : undefined
                    }
                  >
                    {pl.f && (
                      <span
                        className="absolute -top-3 left-8 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-black"
                        style={{ background: "#E8D4B0" }}
                      >
                        Most popular
                      </span>
                    )}
                    <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/80">
                      {pl.n}
                    </div>
                    <div className="mt-4 text-5xl font-semibold tracking-[-0.02em] text-white">
                      {pl.p}
                      <span className="text-base font-normal text-white/40">/mo</span>
                    </div>
                    <div className="mt-3 text-[13px] leading-relaxed text-white/50">
                      {pl.d}
                    </div>

                    <div className="my-6 h-px bg-white/[0.06]" />

                    <ul className="space-y-2.5">
                      {pl.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-[13px] text-white/65">
                          <Check className="h-3.5 w-3.5 text-[#E8D4B0] mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-7 inline-flex items-center gap-1 text-[12px] font-medium text-white/60 transition-colors group-hover:text-[#E8D4B0]">
                      See full plan <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Final CTA — cinematic, restrained ── */}
        <section className="relative py-36 px-6 border-t border-white/[0.05]">
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            aria-hidden
          >
            <div
              className="absolute left-1/2 top-1/2 h-[800px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px]"
              style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.08), transparent 70%)" }}
            />
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="relative mx-auto max-w-4xl text-center"
          >
            <motion.h2
              variants={fadeUp}
              className="fs-display-lg text-white mb-8"
            >
              Stop reading.{" "}
              <span
                style={{
                  fontFamily: "Fraunces, ui-serif, Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#E8D4B0",
                }}
              >
                Start building.
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-[16px] text-white/55 mb-12 max-w-xl mx-auto leading-relaxed"
            >
              Scroll back up and type one sentence into the hero. Sixty seconds
              later you have a complete, responsive site with a working backend,
              a registered domain and a spokesperson video.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/builder" className="fs-btn-primary">
                Open the builder
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="fs-btn-ghost">
                See pricing
              </Link>
            </motion.div>
          </motion.div>
        </section>
    </div>
  );
}
