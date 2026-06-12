"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Check,
  Wand2,
  Bot,
  ShieldCheck,
} from "lucide-react";
import HeroBuilder from "@/components/HeroBuilder";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// ── Red brand strip — OUR family of products + the Vapron platform.
// Never list suppliers or competitors here (Craig, 2026-06-12).
const TRUST_ITEMS = [
  { label: "Vapron", sub: "vapron.ai — the platform underneath" },
  { label: "Vapron Hosting", sub: "one-click deploy" },
  { label: "Vapron Domains", sub: "custom domains + SSL" },
  { label: "Vapron Auth", sub: "single sign-on" },
  { label: "Vapron Email", sub: "send + receive, built in" },
  { label: "GateTest", sub: "gatetest.ai — AI browser testing" },
  { label: "Gluecron", sub: "gluecron.com" },
  { label: "AlecRae", sub: "alecrae.com" },
];

// ── Stat ticker (honest numbers) ──
const STATS = [
  { n: "121", label: "hand-built components" },
  { n: "6", label: "AI agents per build" },
  { n: "<60s", label: "median build time" },
  { n: "1", label: "prompt to a live site" },
  { n: "13", label: "live competitor comparisons" },
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

// Pipeline rows for the dark product band
const PIPELINE = [
  { agent: "Strategist", out: "Site structure · 7 sections", t: "0:04" },
  { agent: "Brand designer", out: "Palette · type · art direction", t: "0:09" },
  { agent: "Copywriter", out: "Headlines · body · CTAs", t: "0:14" },
  { agent: "Developer", out: "React components · forms · state", t: "0:38" },
  { agent: "SEO specialist", out: "Meta · schema · sitemap", t: "0:46" },
  { agent: "Critic", out: "Multi-judge review · auto-repair", t: "0:52" },
];

export default function HomePage() {
  return (
    <div className="zb-bright">
      <div className="pt-[72px]">
        {/* ━━ 1 · HERO — photograph + floating product ━━ */}
        <HeroBuilder />

        {/* ━━ 2 · RED BRAND STRIP ━━ */}
        <section className="zb-band relative" style={{ background: "var(--zb-accent)" }}>
          <div className="relative overflow-hidden py-5 fs-marquee-paused">
            <div className="fs-marquee">
              {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, i) => (
                <div key={`${item.label}-${i}`} className="flex flex-shrink-0 items-baseline gap-2 px-7">
                  <span className="text-[13.5px] font-bold tracking-tight text-white">{item.label}</span>
                  <span className="text-[11px] text-white/70">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━ 3 · PLATFORM STATEMENT + EXPLORE CARDS ━━ */}
        <section className="zb-bright relative px-6 py-24 sm:py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto max-w-7xl"
          >
            <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
              <motion.div variants={fadeUp}>
                <h2 className="zb-display max-w-2xl text-4xl sm:text-[3.4rem]">
                  Your idea, six agents and a live website — working as one
                </h2>
                <p className="mt-6 max-w-xl text-[16px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                  Turn one sentence into a complete business website: brand,
                  copy, code, SEO, hosting and the matching domain — generated,
                  reviewed and deployed in a single flow, improving with every
                  edit you ask for.
                </p>
                <Link href="/builder" className="zb-btn-ink mt-8 !rounded-lg">
                  Explore the builder
                </Link>
              </motion.div>
              <motion.div variants={fadeUp} className="hidden justify-center lg:flex" aria-hidden>
                {/* brand mark moment — the reference page does exactly this */}
                <div
                  className="zb-display flex h-44 w-44 rotate-[8deg] items-center justify-center rounded-[28px] text-[96px] text-white shadow-[0_40px_80px_-30px_rgba(232,64,43,0.45)]"
                  style={{ background: "var(--zb-accent)" }}
                >
                  Z
                </div>
              </motion.div>
            </div>

            {/* explore cards */}
            <div className="mt-16 grid gap-5 lg:grid-cols-2">
              {/* Card A — the build */}
              <motion.div variants={fadeUp}>
                <div className="zb-card h-full p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: "var(--zb-ink)" }}>
                      Building that carries the conversation
                    </h3>
                    <Link
                      href="/builder"
                      className="flex-none text-[13px] font-bold underline decoration-2 underline-offset-4"
                      style={{ color: "var(--zb-ink)", textDecorationColor: "var(--zb-accent)" }}
                    >
                      Explore
                    </Link>
                  </div>
                  <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                    Every section of your site streams in live — navbar, hero,
                    features, pricing — assembled from 121 hand-polished
                    components and tailored to what you typed.
                  </p>
                  {/* build flow visual */}
                  <div className="mt-7 space-y-2.5">
                    {[
                      { k: "PROMPT", v: "“A dental clinic with online booking”", dark: true },
                      { k: "SECTION 3 OF 7", v: "Services grid · streamed 0:21", dark: false },
                      { k: "DEPLOYED", v: "smilebrightdental.com · live 0:54", dark: false },
                    ].map((r) => (
                      <div
                        key={r.k}
                        className={r.dark ? "zb-band flex items-center justify-between rounded-xl px-4 py-3" : "flex items-center justify-between rounded-xl px-4 py-3"}
                        style={
                          r.dark
                            ? { background: "var(--zb-ink)" }
                            : { background: "var(--zb-surface)", border: "1px solid var(--zb-line)" }
                        }
                      >
                        <span
                          className="text-[9.5px] font-extrabold tracking-[0.14em]"
                          style={{ color: r.dark ? "var(--zb-accent-hi)" : "var(--zb-accent)" }}
                        >
                          {r.k}
                        </span>
                        <span
                          className="text-[12.5px] font-semibold"
                          style={{ color: r.dark ? "#ffffff" : "var(--zb-ink)" }}
                        >
                          {r.v}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["Streaming builds", "Slot-locked sections", "Multi-judge review", "Diff edits"].map((t) => (
                      <span key={t} className="zb-chip-light text-[11.5px]">{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Card B — AI for every moment */}
              <motion.div variants={fadeUp}>
                <div className="zb-card h-full p-8">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: "var(--zb-ink)" }}>
                      AI built for every business moment
                    </h3>
                    <Link
                      href="/upgrade"
                      className="flex-none text-[13px] font-bold underline decoration-2 underline-offset-4"
                      style={{ color: "var(--zb-ink)", textDecorationColor: "var(--zb-accent)" }}
                    >
                      Explore
                    </Link>
                  </div>
                  <p className="mt-3 max-w-md text-[14px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                    Already have a site? Paste the URL and we rebuild it better,
                    keeping your brand. Need changes later? Say them in chat —
                    one section updates in seconds, never the whole site.
                  </p>
                  {/* chat visual */}
                  <div className="mt-7 space-y-2.5">
                    <div className="zb-band ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5" style={{ background: "var(--zb-ink)" }}>
                      <span className="text-[12.5px] font-medium text-white">
                        Make the header bolder and add a testimonials section
                      </span>
                    </div>
                    <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md px-4 py-2.5" style={{ background: "var(--zb-surface)", border: "1px solid var(--zb-line)" }}>
                      <span className="text-[12.5px] font-medium" style={{ color: "var(--zb-ink-2)" }}>
                        Done — header weight raised, testimonials added below
                        features. Anything else?
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="zb-band inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: "var(--zb-accent)" }}>
                        <Check className="h-3 w-3" strokeWidth={3} /> Edited in 4s
                      </span>
                      <span className="text-[11.5px]" style={{ color: "var(--zb-muted)" }}>
                        only the touched section re-rendered
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {["URL clone & upgrade", "Chat edits", "Brand-preserving", "Free site audit"].map((t) => (
                      <span key={t} className="zb-chip-light text-[11.5px]">{t}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ━━ 4 · DARK PRODUCT BAND — meet the pipeline ━━ */}
        <section className="zb-dark relative px-6 py-24 sm:py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_1fr]"
          >
            {/* pipeline visual */}
            <motion.div variants={fadeUp} aria-hidden>
              <div
                className="overflow-hidden rounded-[18px]"
                style={{ background: "var(--zb-ink-soft)", border: "1px solid var(--zb-line-dark)" }}
              >
                <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--zb-line-dark)" }}>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                    Build pipeline · brooklynroast.com
                  </span>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white" style={{ background: "var(--zb-accent)" }}>
                    LIVE
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--zb-line-dark)" }}>
                  {PIPELINE.map((row, i) => (
                    <div key={row.agent} className="flex items-center gap-4 px-5 py-3.5" style={{ borderColor: "var(--zb-line-dark)" }}>
                      <span
                        className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-[10px] font-extrabold"
                        style={
                          i < 5
                            ? { background: "var(--zb-accent)", color: "#ffffff" }
                            : { border: "1px solid var(--zb-line-dark)", color: "rgba(255,255,255,0.5)" }
                        }
                      >
                        {i < 5 ? <Check className="h-3 w-3" strokeWidth={3.5} /> : "6"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-bold text-white">{row.agent}</div>
                        <div className="truncate text-[11.5px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {row.out}
                        </div>
                      </div>
                      <span className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {row.t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* copy */}
            <motion.div variants={fadeUp}>
              <h2 className="zb-display text-4xl text-white sm:text-5xl">Meet the six-agent pipeline</h2>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
                The engine that creates complete, on-brand websites from just a
                prompt. Strategy, brand, copy, code, SEO — then a multi-judge
                critique pass that repairs weak sections before you ever see
                them. Welcome to your shipping era.
              </p>
              <Link
                href="/builder"
                className="group mt-8 inline-flex items-center gap-2 text-[15px] font-bold text-white underline decoration-2 underline-offset-4"
                style={{ textDecorationColor: "var(--zb-accent)" }}
              >
                Learn more
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ━━ 5 · AGENTS THAT DO THE WORK — split with product ━━ */}
        <section className="zb-bright relative px-6 py-24 sm:py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto max-w-7xl"
          >
            <motion.h2 variants={fadeUp} className="zb-display max-w-3xl text-5xl sm:text-[4.2rem]">
              Autonomous agents that do the work
            </motion.h2>

            <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_1.25fr]">
              {/* agent list */}
              <motion.div variants={fadeUp} className="space-y-10">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ background: "var(--zb-ink)" }}>
                      <Wand2 className="h-4.5 w-4.5 h-[18px] w-[18px]" style={{ color: "var(--zb-accent)" }} />
                    </span>
                    <h3 className="text-[21px] font-bold tracking-[-0.01em]" style={{ color: "var(--zb-ink)" }}>
                      Builder Agent
                    </h3>
                  </div>
                  <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                    Start fast, launch faster — with just a sentence or your
                    existing URL. In under a minute it learns your business and
                    builds the brand, pages and forms to get you growing.
                  </p>
                  <Link
                    href="/builder"
                    className="group mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-bold underline decoration-2 underline-offset-4"
                    style={{ color: "var(--zb-ink)", textDecorationColor: "var(--zb-accent)" }}
                  >
                    Explore Builder Agent
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ background: "var(--zb-ink)" }}>
                      <Bot className="h-[18px] w-[18px]" style={{ color: "var(--zb-accent)" }} />
                    </span>
                    <h3 className="text-[21px] font-bold tracking-[-0.01em]" style={{ color: "var(--zb-ink)" }}>
                      Edit Agent
                    </h3>
                  </div>
                  <p className="mt-3 max-w-sm text-[14.5px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                    Support with shipping power. Say the change — it finds the
                    right section, rewrites just that code, and hot-swaps it
                    into your live preview in seconds.
                  </p>
                  <Link
                    href="/builder"
                    className="group mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-bold underline decoration-2 underline-offset-4"
                    style={{ color: "var(--zb-ink)", textDecorationColor: "var(--zb-accent)" }}
                  >
                    Explore Edit Agent
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>
              </motion.div>

              {/* product frame — generated sports site + chat rail */}
              <motion.div variants={fadeUp} aria-hidden>
                <div
                  className="overflow-hidden rounded-[20px]"
                  style={{
                    background: "var(--zb-surface)",
                    border: "1px solid var(--zb-line)",
                    boxShadow: "0 40px 90px -40px rgba(11,11,13,0.3)",
                  }}
                >
                  <div className="grid sm:grid-cols-[1.2fr_1fr]">
                    {/* generated site */}
                    <div>
                      <div className="zb-band flex items-center justify-between px-4 py-2" style={{ background: "#101418" }}>
                        <span className="text-[9px] text-white/60">MENS</span>
                        <span className="text-[11px] font-extrabold tracking-[0.18em] text-white">EASTSIDE</span>
                        <span className="text-[9px] text-white/60">WOMENS</span>
                      </div>
                      <div className="px-5 pb-5 pt-6" style={{ background: "linear-gradient(160deg, #dfe7d8, #b9c7ad 65%, #99ab8c)" }}>
                        <div className="text-[9px] font-bold tracking-[0.2em]" style={{ color: "#445239" }}>
                          NEW DROP
                        </div>
                        <div className="zb-display mt-1 text-[26px] leading-[1.0]" style={{ color: "#1c2418" }}>
                          RACE DAY
                          <br />
                          READY
                        </div>
                        <div className="mt-4 h-20 rounded-lg" style={{ background: "linear-gradient(135deg, #2a3325, #4a5a40)" }} />
                        <div className="mt-3 flex items-center justify-between rounded-lg bg-white/85 px-3 py-2">
                          <div>
                            <div className="text-[9.5px] font-extrabold" style={{ color: "#1c2418" }}>
                              TIDEBREAKER 1350 TRAIL SHOE
                            </div>
                            <div className="text-[8.5px]" style={{ color: "#6b7563" }}>
                              from $130
                            </div>
                          </div>
                          <span className="zb-band rounded-full px-2.5 py-1 text-[8.5px] font-bold text-white" style={{ background: "var(--zb-accent)" }}>
                            SHOP NOW
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* chat rail */}
                    <div className="flex flex-col gap-2.5 p-4" style={{ borderLeft: "1px solid var(--zb-line)", background: "#fbfaf7" }}>
                      <div className="zb-band ml-auto w-fit max-w-[95%] rounded-xl rounded-br-sm px-3 py-2 text-[10.5px] font-medium leading-snug text-white" style={{ background: "var(--zb-ink)" }}>
                        Create a launch page for our new trail shoe — bold,
                        outdoorsy, with a featured product.
                      </div>
                      <div className="w-fit max-w-[95%] rounded-xl rounded-bl-sm px-3 py-2 text-[10.5px] leading-snug" style={{ background: "#f1efe7", color: "var(--zb-ink-2)" }}>
                        Built it — hero, drop announcement and featured product.
                        Want a size-guide section too?
                      </div>
                      <div className="mt-auto flex items-center gap-1.5 text-[10px]" style={{ color: "var(--zb-muted)" }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--zb-accent)" }} />
                        Thought for 31 seconds
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ━━ 6 · RED STAT TICKER ━━ */}
        <section className="zb-band relative" style={{ background: "var(--zb-accent)" }}>
          <div className="relative overflow-hidden py-7 fs-marquee-paused">
            <div className="fs-marquee items-baseline">
              {[...STATS, ...STATS, ...STATS].map((s, i) => (
                <div key={`${s.label}-${i}`} className="flex flex-shrink-0 items-baseline gap-3 px-10">
                  <span className="zb-display text-[40px] text-white">{s.n}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/80">{s.label}</span>
                  <span className="ml-6 text-white/50">◆</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━ 7 · PRICING ━━ */}
        <section className="zb-bright relative px-6 py-24 sm:py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="mx-auto max-w-6xl"
          >
            <motion.div variants={fadeUp} className="mb-14 max-w-2xl">
              <h2 className="zb-display text-4xl sm:text-6xl">
                One subscription. <span className="zb-mark">Everything</span> included.
              </h2>
              <p className="mt-6 text-[16px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                The AI Website Builder with hosting and a custom domain included.
                Cancel any time. 14-day free trial on paid plans.
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
                        className="absolute -top-3 left-8 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                        style={{ background: "var(--zb-accent)" }}
                      >
                        Most popular
                      </span>
                    )}
                    <div className="zb-eyebrow" style={{ color: pl.f ? "var(--zb-accent-hi)" : "var(--zb-muted)" }}>
                      {pl.n}
                    </div>
                    <div className="mt-4 text-5xl font-extrabold tracking-[-0.03em]" style={{ color: pl.f ? "#fff" : "var(--zb-ink)" }}>
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
                            style={{ color: pl.f ? "var(--zb-accent-hi)" : "var(--zb-ink)" }}
                            strokeWidth={2.5}
                          />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-7 inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: pl.f ? "var(--zb-accent-hi)" : "var(--zb-ink)" }}>
                      See full plan <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ━━ 8 · FOUNDER'S NOTE ━━ */}
        <section className="zb-bright relative py-24" style={{ borderTop: "1px solid var(--zb-line)" }}>
          <div className="mx-auto max-w-3xl px-6">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}>
              <motion.div variants={fadeUp} className="zb-eyebrow mb-6" style={{ color: "var(--zb-ink-2)" }}>
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--zb-accent)" }} />
                Founder&rsquo;s note
              </motion.div>
              <motion.h2 variants={fadeUp} className="zb-display mb-8 text-4xl sm:text-5xl">
                We&rsquo;re <span className="zb-mark">new.</span> Here&rsquo;s the honest pitch.
              </motion.h2>
              <motion.div variants={fadeUp} className="space-y-5 text-[16px] leading-relaxed" style={{ color: "var(--zb-ink-2)" }}>
                <p>
                  Most builder sites at this stage put fake testimonials here from
                  people who don&rsquo;t exist. We won&rsquo;t.
                </p>
                <p>
                  Zoobicon is built and run by one person alongside a 24/7 physical
                  business. We ship one product: the AI Website Builder. Every commit
                  is visible on{" "}
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
                <Link href="/builder" className="zb-btn !rounded-lg">
                  Try the builder <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="mailto:hello@zoobicon.com"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={{ border: "1px solid var(--rule-strong)", background: "var(--zb-surface)", color: "var(--zb-ink)" }}
                >
                  Tell us what&rsquo;s broken
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ━━ 9 · FINAL CTA (flat dark) ━━ */}
        <section className="zb-dark relative px-6 py-28 sm:py-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="relative mx-auto max-w-4xl text-center"
          >
            <motion.h2 variants={fadeUp} className="zb-display text-5xl text-white sm:text-7xl">
              Stop reading. Start building.
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
              <Link href="/builder" className="zb-btn !rounded-lg">
                Open the builder <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="zb-btn-ghost-dark !rounded-lg">
                See pricing <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
