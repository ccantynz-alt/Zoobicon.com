"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Wand2,
  Globe2,
  Sparkles,
  Zap,
  Bot,
  Layers,
  ShieldCheck,
  Check,
} from "lucide-react";
import HeroBuilder from "@/components/HeroBuilder";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ── Trust strip (verifiable, never inflated) ──
const TRUST_ITEMS = [
  { label: "Claude Opus 4.7", sub: "Latest model" },
  { label: "Next.js 14", sub: "App Router" },
  { label: "Vercel Edge", sub: "iad1 region" },
  { label: "Stripe", sub: "Live Connect" },
  { label: "Neon", sub: "Postgres 16" },
  { label: "Cloudflare", sub: "5 domains" },
  { label: "Crontech", sub: "Hosting + domains" },
  { label: "121 Components", sub: "Registry" },
];

const FEATURES = [
  {
    icon: Wand2,
    tag: "Builder",
    title: "Six agents. One prompt.",
    desc: "Strategist, brand designer, architect, copywriter, developer and SEO specialist build your site in under 95 seconds. You watch it happen.",
  },
  {
    icon: Layers,
    tag: "Components",
    title: "121 hand-polished sections.",
    desc: "Bento grids, spotlight cards, text-reveal heroes, marquee logos — every site assembled from a registry of $100K-agency primitives, never generated from scratch.",
  },
  {
    icon: Bot,
    tag: "Diff editing",
    title: "Edit anything. By chat.",
    desc: "“Make the header bolder.” Change one thing without regenerating the whole site. Diff-based edits land in seconds through the chat panel.",
  },
  {
    icon: Globe2,
    tag: "Domains + hosting",
    title: "Ship it, domain and all.",
    desc: "Hosting and a custom domain (.com, .ai, .io) are provisioned through Crontech at deploy time. One platform, no glue scripts, no second invoice.",
  },
  {
    icon: Zap,
    tag: "Deploy",
    title: "One click to live.",
    desc: "Push your generated site to the cloud in seconds. Free SSL, global CDN, custom domain. Nothing to configure.",
  },
  {
    icon: ShieldCheck,
    tag: "Backend",
    title: "Real backend, day one.",
    desc: "Auth, database, storage and email wired in from the start — not a frontend-only mockup. Your site works the moment it ships.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Describe it.",
    desc: "Tell the builder what your business does. One sentence is enough — six AI agents handle brand, copy, structure and code.",
    icon: Wand2,
  },
  {
    step: "02",
    title: "Watch it build.",
    desc: "Components stream in live: navbar, hero, features, pricing, footer — assembled from 121 hand-polished sections and tailored to your brand.",
    icon: Layers,
  },
  {
    step: "03",
    title: "Ship it.",
    desc: "Hosting plus a custom domain provisioned in one deploy step. Free SSL. No infrastructure to manage. One click and you’re live.",
    icon: Globe2,
  },
];

const PLANS = [
  {
    n: "Starter",
    p: "$49",
    d: "One site, builder, domain + email.",
    f: false,
    features: ["1 website", "1 domain + email", "60-second builds", "Hosting included"],
  },
  {
    n: "Pro",
    p: "$129",
    d: "Three sites, deep builds, SEO, AI auto-reply.",
    f: true,
    features: ["3 websites", "Deep agentic builds", "SEO dashboard", "AI email auto-reply", "Priority support"],
  },
  {
    n: "Agency",
    p: "$299",
    d: "Ten sites, white-label, API, priority.",
    f: false,
    features: ["10 websites", "White-label reseller", "Public API access", "Dedicated account"],
  },
];

export default function HomePage() {
  return (
    <div className="zb-bright">
      <div className="pt-[72px]">
        {/* ── HERO (bright, product on stage) ── */}
        <HeroBuilder />

        {/* ── Brand band (the Klaviyo red strip) ── */}
        <section className="zb-band relative" style={{ background: "var(--zb-accent)" }}>
          <div className="relative overflow-hidden py-5 fs-marquee-paused">
            <div className="fs-marquee">
              {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
                <div key={`${item.label}-${i}`} className="flex flex-shrink-0 items-baseline gap-2 px-7">
                  <span className="text-[13.5px] font-bold tracking-tight text-white">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-white/70">
                    {item.sub}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURE BENTO (bright) ── */}
        <section className="zb-bright relative px-6 py-28 sm:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <motion.div variants={fadeUp} className="mb-14 max-w-3xl">
              <div className="zb-eyebrow mb-5" style={{ color: "var(--zb-ink-2)" }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--zb-accent)" }} />
                What&rsquo;s inside
              </div>
              <h2 className="zb-display text-4xl sm:text-6xl">
                Everything a website needs. <span className="zb-mark">One</span> prompt.
              </h2>
              <p className="mt-6 max-w-2xl text-[16px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                The AI Website Builder generates your site, registers your domain
                and deploys to the cloud in a single flow. No switching tabs.
                No separate accounts. No half-finished mockups.
              </p>
            </motion.div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.title} variants={fadeUp}>
                    <Link href="/builder" className="zb-card group flex h-full flex-col p-8">
                      <div
                        className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-[1.06]"
                        style={{ background: "var(--zb-ink)" }}
                      >
                        <Icon className="h-5 w-5" style={{ color: "var(--zb-accent)" }} strokeWidth={2} />
                      </div>
                      <div className="zb-eyebrow mb-2" style={{ color: "var(--zb-muted)" }}>
                        {f.tag}
                      </div>
                      <h3 className="mb-3 text-[21px] font-bold leading-tight tracking-[-0.02em]" style={{ color: "var(--zb-ink)" }}>
                        {f.title}
                      </h3>
                      <p className="flex-1 text-[14px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                        {f.desc}
                      </p>
                      <div
                        className="mt-7 inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors"
                        style={{ color: "var(--zb-ink)" }}
                      >
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

        {/* ── HOW IT WORKS (dark statement) ── */}
        <section className="zb-dark relative overflow-hidden px-6 py-28 sm:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="relative mx-auto max-w-5xl"
          >
            <motion.div variants={fadeUp} className="mb-14 text-center">
              <div className="zb-eyebrow mb-5 justify-center" style={{ color: "var(--zb-accent)" }}>
                <Zap className="h-3.5 w-3.5" />
                How it works
              </div>
              <h2 className="zb-display mx-auto max-w-3xl text-4xl sm:text-6xl" style={{ color: "#fff" }}>
                Type one sentence. <span style={{ color: "var(--zb-accent)" }}>Ship.</span>
              </h2>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {STEPS.map((c) => {
                const Icon = c.icon;
                return (
                  <motion.div key={c.step} variants={fadeUp}>
                    <Link href="/builder" className="zb-card-dark group flex h-full flex-col p-8">
                      <div className="mb-6 flex items-center gap-3">
                        <div
                          className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] transition-transform duration-500 group-hover:scale-[1.06]"
                          style={{ background: "var(--zb-accent)" }}
                        >
                          <Icon className="h-5 w-5" style={{ color: "var(--zb-accent-ink)" }} strokeWidth={2.2} />
                        </div>
                        <span className="font-mono text-[12px] tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {c.step}
                        </span>
                      </div>
                      <h3 className="mb-4 text-[22px] font-bold leading-tight tracking-[-0.02em]" style={{ color: "#fff" }}>
                        {c.title}
                      </h3>
                      <p className="flex-1 text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.62)" }}>
                        {c.desc}
                      </p>
                      <div
                        className="mt-8 inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors group-hover:text-[var(--zb-accent)]"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                      >
                        Open the builder
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* ── FOUNDER'S NOTE (bright, honest) ── */}
        <section className="zb-bright relative py-28" style={{ borderTop: "1px solid var(--zb-line)" }}>
          <div className="mx-auto max-w-3xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
              <motion.div variants={fadeUp} className="zb-eyebrow mb-6" style={{ color: "var(--zb-ink-2)" }}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Founder&rsquo;s note
              </motion.div>
              <motion.h2 variants={fadeUp} className="zb-display mb-8 text-4xl sm:text-5xl">
                We&rsquo;re <span className="zb-mark">new</span>. Here&rsquo;s the honest pitch.
              </motion.h2>
              <motion.div variants={fadeUp} className="space-y-5 text-[16px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                <p>
                  Most builder sites at this stage put fake testimonials here from
                  people who don&rsquo;t exist. We won&rsquo;t.
                </p>
                <p>
                  Zoobicon is built and run by one person alongside a 24/7 physical
                  business. We ship one product: the AI Website Builder — generate,
                  register your domain, and deploy in a single flow. Every commit is
                  visible on{" "}
                  <a
                    href="https://github.com/ccantynz-alt/Zoobicon.com"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline decoration-2"
                    style={{ color: "var(--zb-ink)", textDecorationColor: "var(--zb-accent)" }}
                  >
                    GitHub
                  </a>
                  .
                </p>
                <p>
                  We&rsquo;d rather have ten real customers than a hundred fake quotes.
                  If you try it and something&rsquo;s broken, email{" "}
                  <a
                    href="mailto:hello@zoobicon.com"
                    className="font-semibold underline decoration-2"
                    style={{ color: "var(--zb-ink)", textDecorationColor: "var(--zb-accent)" }}
                  >
                    hello@zoobicon.com
                  </a>{" "}
                  and you&rsquo;ll hear back the same day — usually from Craig.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-3">
                <Link href="/builder" className="zb-btn-ink">
                  Try the builder <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="mailto:hello@zoobicon.com"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    border: "1px solid var(--rule-strong)",
                    background: "var(--zb-surface)",
                    color: "var(--zb-ink)",
                  }}
                >
                  Tell us what&rsquo;s broken
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── PRICING (bright) ── */}
        <section className="zb-bright relative px-6 py-28 sm:py-32" style={{ borderTop: "1px solid var(--zb-line)" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <motion.div variants={fadeUp} className="mb-14 max-w-2xl">
              <div className="zb-eyebrow mb-5" style={{ color: "var(--zb-ink-2)" }}>
                <Zap className="h-3.5 w-3.5" style={{ color: "var(--zb-accent)" }} />
                Simple pricing
              </div>
              <h2 className="zb-display text-4xl sm:text-6xl">
                One subscription. <span className="zb-mark">Everything</span> included.
              </h2>
              <p className="mt-6 text-[16px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                One product, one subscription: the AI Website Builder with domain
                registration and one-click deploy included. Cancel any time.
                14-day free trial on paid plans.
              </p>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {PLANS.map((pl) => (
                <motion.div key={pl.n} variants={fadeUp}>
                  <Link
                    href="/pricing"
                    className={pl.f ? "zb-card-dark group relative block h-full p-8" : "zb-card group relative block h-full p-8"}
                  >
                    {pl.f && (
                      <span
                        className="absolute -top-3 left-8 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                        style={{ background: "var(--zb-accent)", color: "var(--zb-accent-ink)" }}
                      >
                        Most popular
                      </span>
                    )}
                    <div className="zb-eyebrow" style={{ color: pl.f ? "var(--zb-accent)" : "var(--zb-muted)" }}>
                      {pl.n}
                    </div>
                    <div
                      className="mt-4 text-5xl font-extrabold tracking-[-0.03em]"
                      style={{ color: pl.f ? "#fff" : "var(--zb-ink)" }}
                    >
                      {pl.p}
                      <span className="text-base font-medium" style={{ color: pl.f ? "rgba(255,255,255,0.45)" : "var(--zb-muted)" }}>
                        /mo
                      </span>
                    </div>
                    <div className="mt-3 text-[13px] leading-relaxed" style={{ color: pl.f ? "rgba(255,255,255,0.6)" : "var(--zb-ink-2)" }}>
                      {pl.d}
                    </div>

                    <div className="my-6 h-px" style={{ background: pl.f ? "rgba(255,255,255,0.1)" : "var(--zb-line)" }} />

                    <ul className="space-y-2.5">
                      {pl.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2 text-[13px]" style={{ color: pl.f ? "rgba(255,255,255,0.78)" : "var(--zb-ink-2)" }}>
                          <Check
                            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                            style={{ color: pl.f ? "var(--zb-accent)" : "var(--zb-ink)" }}
                            strokeWidth={2.5}
                          />
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <div
                      className="mt-7 inline-flex items-center gap-1 text-[12px] font-semibold"
                      style={{ color: pl.f ? "var(--zb-accent)" : "var(--zb-ink)" }}
                    >
                      See full plan <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── FINAL CTA (dark) ── */}
        <section className="zb-dark relative overflow-hidden px-6 py-32 sm:py-36">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="relative mx-auto max-w-4xl text-center"
          >
            <motion.h2 variants={fadeUp} className="zb-display text-5xl sm:text-7xl" style={{ color: "#fff" }}>
              Stop reading. <span style={{ color: "var(--zb-accent)" }}>Start building.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-8 mb-12 max-w-xl text-[16px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Scroll back up and type one sentence into the hero. Sixty seconds
              later you have a complete, responsive site with a working backend
              and a registered domain — all in one flow.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/builder" className="zb-btn">
                Open the builder <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="zb-btn-ghost-dark">
                See pricing <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
