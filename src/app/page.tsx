"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import HeroBuilder from "@/components/HeroBuilder";
import AutoplayVideo from "@/components/AutoplayVideo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

export default function HomePage() {
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white antialiased overflow-x-hidden selection:bg-[#E8D4B0] selection:text-black">
      {/* ONE warm editorial glow — no cyberpunk orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[18%] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[#E8D4B0]/[0.05] blur-[160px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* nav — restrained, editorial, no rainbow logo */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05] bg-[#0a0a0c]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8D4B0]">
              <Sparkles className="h-3.5 w-3.5 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-[17px] font-semibold tracking-tight">
              Zoobicon
            </span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              href="/builder"
              className="text-[13px] text-white/60 hover:text-white transition-colors"
            >
              Builder
            </Link>
            <Link
              href="/video-creator"
              className="text-[13px] text-white/60 hover:text-white transition-colors"
            >
              Video
            </Link>
            <Link
              href="/domains"
              className="text-[13px] text-white/60 hover:text-white transition-colors"
            >
              Domains
            </Link>
            <Link
              href="/pricing"
              className="text-[13px] text-white/60 hover:text-white transition-colors"
            >
              Pricing
            </Link>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="text-[13px] text-white/60 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/builder"
              className="rounded-full bg-[#E8D4B0] px-4 py-1.5 text-[13px] font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#E8D4B0]/20"
            >
              Open builder
            </Link>
          </div>
          <button
            className="md:hidden text-white/60"
            onClick={() => setMenu(!menu)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  menu
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>
        {menu && (
          <div className="border-t border-white/[0.05] bg-[#0a0a0c]/95 backdrop-blur-xl px-6 py-4 md:hidden flex flex-col gap-3">
            <Link href="/builder" className="text-[13px] text-white/80">
              Builder
            </Link>
            <Link href="/video-creator" className="text-[13px] text-white/80">
              Video
            </Link>
            <Link href="/domains" className="text-[13px] text-white/80">
              Domains
            </Link>
            <Link href="/pricing" className="text-[13px] text-white/80">
              Pricing
            </Link>
            <Link href="/auth/login" className="text-[13px] text-white/80">
              Sign in
            </Link>
          </div>
        )}
      </nav>

      {/* ── THE HERO IS THE PRODUCT ── */}
      <HeroBuilder />

      {/* Quiet proof strip — verifiable numbers, editorial restraint */}
      <section className="border-y border-white/[0.05] bg-white/[0.012] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-4 px-6 py-7">
          {[
            { v: "60+", l: "components" },
            { v: "75+", l: "products bundled" },
            { v: "6", l: "AI agents" },
            { v: "$49", l: "/mo everything" },
            { v: "Opus 4.6", l: "latest model" },
          ].map((m) => (
            <div key={m.l} className="text-center">
              <div className="text-[20px] font-semibold text-white tracking-tight">
                {m.v}
              </div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/35">
                {m.l}
              </div>
            </div>
          ))}
          <Link
            href="/launch-status"
            className="group inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-1.5 text-[11px] font-medium text-emerald-300/80 transition-all hover:border-emerald-400/40 hover:text-emerald-300"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live status
            <ChevronRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Three editorial product cards — no gradient spam */}
      <section className="py-28 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto max-w-6xl"
        >
          <motion.div variants={fadeUp} className="mb-16 max-w-2xl">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-white/40 font-medium">
              Three things, built deeply
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-[-0.03em]">
              Not a hundred features.{" "}
              <span className="font-serif italic font-normal text-[#E8D4B0]">
                Three
              </span>{" "}
              that replace a studio.
            </h2>
          </motion.div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Builder",
                desc: "Describe your business. Six agents collaborate live to ship a complete, responsive site in under a minute. Edit anything with chat.",
                href: "/builder",
                cta: "Open the builder",
              },
              {
                title: "Video",
                desc: "A sentence becomes a 30-second spokesperson video with a realistic face, your voice (optional), and burned-in captions. No stock footage.",
                href: "/video-creator",
                cta: "Make a video",
              },
              {
                title: "Domains",
                desc: "Real-time availability across 500+ TLDs. AI-generated name shortlist. Register and point to your new site in a single transaction.",
                href: "/domains",
                cta: "Find a domain",
              },
            ].map((c) => (
              <motion.div key={c.title} variants={fadeUp}>
                <Link
                  href={c.href}
                  className="group relative block rounded-2xl border border-white/[0.07] bg-white/[0.015] p-8 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25 hover:bg-white/[0.025]"
                >
                  <div className="mb-6 text-[11px] uppercase tracking-[0.2em] text-[#E8D4B0]/80 font-semibold">
                    {c.title}
                  </div>
                  <h3 className="mb-4 text-[22px] font-semibold leading-tight tracking-tight">
                    {c.desc.split(".")[0]}.
                  </h3>
                  <p className="text-[13px] leading-relaxed text-white/45">
                    {c.desc.split(".").slice(1).join(".").trim()}
                  </p>
                  <div className="mt-8 inline-flex items-center gap-1.5 text-[12px] font-medium text-white/60 transition-colors group-hover:text-[#E8D4B0]">
                    {c.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Video showcase — editorial split */}
      <section className="py-28 px-6 border-t border-white/[0.05]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto max-w-6xl"
        >
          <div className="grid items-center gap-14 lg:grid-cols-[1fr,1.1fr]">
            <motion.div variants={fadeUp}>
              <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-white/40 font-medium">
                Spokesperson video
              </p>
              <h2 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.03em] mb-6">
                From a sentence to a{" "}
                <span className="font-serif italic font-normal text-[#E8D4B0]">
                  face
                </span>{" "}
                in thirty seconds.
              </h2>
              <p className="text-[15px] leading-relaxed text-white/50 mb-8 max-w-md">
                Type a description. A real avatar reads your script with
                natural intonation, burned-in captions, and background music.
                No stock footage. No filming. No editor.
              </p>
              <Link
                href="/video-creator"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-5 py-2.5 text-[13px] font-medium text-white/80 backdrop-blur transition-all hover:border-[#E8D4B0]/40 hover:text-[#E8D4B0] hover:bg-[#E8D4B0]/[0.04]"
              >
                Try the video creator
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp}>
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-2xl">
                <AutoplayVideo />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Quiet pricing teaser */}
      <section className="py-28 px-6 border-t border-white/[0.05]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto max-w-5xl"
        >
          <motion.div variants={fadeUp} className="text-center mb-14">
            <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-white/40 font-medium">
              Simple pricing
            </p>
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em]">
              One price.{" "}
              <span className="font-serif italic font-normal text-[#E8D4B0]">
                Everything
              </span>{" "}
              included.
            </h2>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                n: "Starter",
                p: "$49",
                d: "One site, builder, domain, email",
                f: false,
              },
              {
                n: "Pro",
                p: "$129",
                d: "Three sites, video, SEO, AI auto-reply",
                f: true,
              },
              {
                n: "Agency",
                p: "$299",
                d: "Ten sites, white-label, API, priority",
                f: false,
              },
            ].map((pl) => (
              <motion.div key={pl.n} variants={fadeUp}>
                <Link
                  href="/pricing"
                  className={`group relative block rounded-2xl border p-7 text-left transition-all duration-500 hover:-translate-y-1 ${
                    pl.f
                      ? "border-[#E8D4B0]/30 bg-[#E8D4B0]/[0.03]"
                      : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.18]"
                  }`}
                >
                  {pl.f && (
                    <span className="absolute -top-3 left-7 rounded-full bg-[#E8D4B0] px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black">
                      Most popular
                    </span>
                  )}
                  <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/50">
                    {pl.n}
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-tight">
                    {pl.p}
                    <span className="text-base font-normal text-white/40">
                      /mo
                    </span>
                  </div>
                  <div className="mt-3 text-[13px] leading-relaxed text-white/45">
                    {pl.d}
                  </div>
                  <div className="mt-6 inline-flex items-center gap-1 text-[12px] font-medium text-white/50 transition-colors group-hover:text-[#E8D4B0]">
                    See details <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA — editorial, restrained */}
      <section className="py-32 px-6 border-t border-white/[0.05]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h2
            variants={fadeUp}
            className="text-4xl sm:text-6xl font-semibold leading-[1.05] tracking-[-0.035em] mb-8"
          >
            Stop reading.{" "}
            <span className="font-serif italic font-normal text-[#E8D4B0]">
              Start building.
            </span>
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-[15px] text-white/50 mb-10 max-w-lg mx-auto leading-relaxed"
          >
            You&apos;ve been on this page long enough. Scroll back up and
            type one sentence into the hero. That&apos;s all it takes.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 rounded-full bg-[#E8D4B0] px-7 py-3.5 text-[14px] font-semibold text-black transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#E8D4B0]/20"
            >
              Or open the full builder
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* footer */}
      <footer className="border-t border-white/[0.05] bg-[#0a0a0c] py-14 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8D4B0]">
                  <Sparkles
                    className="h-3.5 w-3.5 text-black"
                    strokeWidth={2.5}
                  />
                </div>
                <span className="font-semibold">Zoobicon</span>
              </div>
              <p className="text-[13px] text-white/40 leading-relaxed max-w-xs">
                The AI platform for building websites, creating videos, and
                launching businesses.
              </p>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/60 mb-4">
                Products
              </div>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/builder"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  AI Builder
                </Link>
                <Link
                  href="/video-creator"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  AI Video
                </Link>
                <Link
                  href="/domains"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  Domains
                </Link>
                <Link
                  href="/pricing"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  Pricing
                </Link>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/60 mb-4">
                Tools
              </div>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/tools"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  Free SEO Tools
                </Link>
                <Link
                  href="/tools/business-names"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  Name Generator
                </Link>
                <Link
                  href="/developers"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  API
                </Link>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/60 mb-4">
                Company
              </div>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/auth/login"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  Sign up
                </Link>
                <Link
                  href="/disclaimers"
                  className="text-[13px] text-white/40 hover:text-white transition-colors"
                >
                  Legal
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-14 border-t border-white/[0.05] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[11px] text-white/30">
              © {new Date().getFullYear()} Zoobicon. All rights reserved.
            </div>
            <div className="text-[11px] text-white/30 font-mono">
              zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
