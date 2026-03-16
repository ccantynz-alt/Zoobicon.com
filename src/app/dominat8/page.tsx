"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Zap, Globe, Layout, BarChart3, Search, ArrowRight, Check,
  Star, Menu, X, Sparkles, Rocket, Shield, Clock, Users, Bot, Code2,
  TrendingUp, Trophy, Flame, ChevronRight, Play,
} from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

/**
 * Dominat8.io Landing Page
 *
 * Aggressive, conversion-focused landing page for the Dominat8 brand.
 * This serves as the homepage when accessed from dominat8.io or dominat8.com.
 *
 * Same platform as Zoobicon, different brand positioning:
 * - Zoobicon = "Build anything with AI" (creative, broad)
 * - Dominat8 = "Dominate your market with AI" (competitive, aggressive)
 */

const STATS = [
  { value: "43", label: "AI Generators" },
  { value: "7", label: "Agent Pipeline" },
  { value: "<60s", label: "Generation Time" },
  { value: "24/7", label: "Availability" },
];

const WEAPONS = [
  {
    icon: Globe,
    name: "Killer Websites",
    description: "Generate full production websites in seconds. While competitors spend weeks with agencies, you launch today.",
    stat: "43 site types",
  },
  {
    icon: Layout,
    name: "Landing Pages That Convert",
    description: "AI-optimized landing pages with 12 conversion sections, A/B variants, and proven copywriting frameworks.",
    stat: "12 conversion sections",
  },
  {
    icon: BarChart3,
    name: "Dashboards & Apps",
    description: "SaaS dashboards, booking systems, CRM, inventory — full business applications generated from a prompt.",
    stat: "7 app types",
  },
  {
    icon: Search,
    name: "SEO Domination",
    description: "Auto-injected JSON-LD schema, Open Graph, meta optimization. Outrank competitors from day one.",
    stat: "95+ SEO score",
  },
  {
    icon: Bot,
    name: "10-Agent AI Pipeline",
    description: "Strategist, Brand Designer, Copywriter, Architect, Developer, SEO, and Animation agents — all working together.",
    stat: "7 specialized agents",
  },
  {
    icon: Code2,
    name: "API & Developer Arsenal",
    description: "REST API generators, Chrome extensions, component libraries, PWAs. Ship developer tools at warp speed.",
    stat: "4 dev tools",
  },
];

const COMPARISON = [
  { feature: "Build time", us: "< 60 seconds", them: "2-6 weeks" },
  { feature: "Cost", us: "$49/month", them: "$5,000-$50,000" },
  { feature: "Design quality", us: "Agency-grade", them: "Agency-grade" },
  { feature: "SEO optimization", us: "Auto-injected", them: "Extra $2,000+" },
  { feature: "Dark mode", us: "One click", them: "Extra $1,000+" },
  { feature: "Animations", us: "One click", them: "Extra $3,000+" },
  { feature: "Revisions", us: "Unlimited, instant", them: "3-5 rounds, weeks" },
  { feature: "Mobile responsive", us: "Always", them: "Usually extra" },
];

const TESTIMONIALS = [
  {
    quote: "We launched 14 client websites in one afternoon. Our agency went from 2 sites/month to 2 sites/hour. Competitors have no idea how we move this fast.",
    name: "Agency Founder",
    title: "Digital Agency",
    company: "Example Use Case",
    rating: 5,
  },
  {
    quote: "The AI pipeline produced a site that our $15K agency couldn't match. I cancelled my agency retainer the same day.",
    name: "Marketing Director",
    title: "SaaS Company",
    company: "Example Use Case",
    rating: 5,
  },
  {
    quote: "Generated a complete SaaS dashboard with user management, analytics, and billing. What would have taken my team 3 months took 90 seconds.",
    name: "Startup CTO",
    title: "Tech Startup",
    company: "Example Use Case",
    rating: 5,
  },
];

const PRICING = [
  {
    name: "Recon",
    price: "Free",
    period: "",
    description: "Test the weapons",
    features: ["5 sites/month", "Basic AI generation", "Standard templates", "Community support"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Strike",
    price: "$49",
    period: "/mo",
    description: "Full arsenal access",
    features: [
      "Unlimited sites",
      "All 30+ generators",
      "7-agent AI pipeline",
      "Priority support",
      "Custom domains",
      "API access",
      "GitHub & WP export",
    ],
    cta: "Start Dominating",
    highlighted: true,
  },
  {
    name: "Command",
    price: "Custom",
    period: "",
    description: "For agencies & enterprises",
    features: [
      "Everything in Strike",
      "White-label platform",
      "Dedicated infrastructure",
      "SLA guarantee",
      "Dedicated success manager",
      "Bulk generation API",
      "Priority queue",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function Dominat8Page() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);

  return (
    <div className="min-h-screen bg-[#050508] text-white relative">
      <BackgroundEffects preset="contrast" />
      {/* Announcement bar */}
      <div className="relative z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-center py-2.5 text-xs font-medium">
        <span className="hidden sm:inline">Join businesses already dominating their market with AI</span>
        <span className="sm:hidden">Dominate your market with AI</span>
        <span className="mx-2 text-blue-200/40">|</span>
        <Link href="/builder" className="underline font-bold hover:text-blue-100 transition-colors">Try free →</Link>
      </div>

      {/* Nav */}
      <nav className="relative sticky top-0 z-50 border-b border-white/[0.10] bg-[#050508]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dominat8" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Target size={18} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Dominat<span className="text-blue-400">8</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#weapons" className="text-sm text-white/65 hover:text-white transition-colors">Arsenal</a>
            <a href="#compare" className="text-sm text-white/65 hover:text-white transition-colors">Compare</a>
            <a href="#testimonials" className="text-sm text-white/65 hover:text-white transition-colors">Proof</a>
            <a href="#pricing" className="text-sm text-white/65 hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden sm:block text-sm text-white/65 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/builder"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
            >
              Start Dominating
            </Link>
            <button className="md:hidden text-white/65" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Dramatic background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full bg-blue-600/[0.07] blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.06] blur-[130px]" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-[100px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          {/* Spotlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[50%] bg-gradient-to-b from-blue-500/[0.08] to-transparent blur-[60px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center relative w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-10">
              <div className="relative">
                <Zap size={14} />
                <div className="absolute inset-0 animate-ping opacity-40"><Zap size={14} /></div>
              </div>
              The AI Competitive Advantage
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[3.5rem] sm:text-[5rem] lg:text-[6.5rem] font-black tracking-[-0.04em] mb-8 leading-[0.85]"
          >
            <span className="block text-white">Your competitors</span>
            <span className="block mt-3 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_80px_rgba(59,130,246,0.3)]" style={{ backgroundSize: "200% auto", animation: "gradient-shift 4s ease-in-out infinite" }}>
              are not ready.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl lg:text-2xl text-white/65 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            While they spend weeks and tens of thousands on websites, you generate
            agency-quality sites, apps, and marketing assets in{" "}
            <span className="text-white font-semibold">under 60 seconds</span>.
            <br className="hidden sm:block" />
            30+ AI generators. 7-agent pipeline. <span className="text-blue-300 font-semibold">Zero mercy.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mb-16"
          >
            <Link
              href="/builder"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-2xl text-lg font-bold hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all shadow-[0_0_40px_rgba(59,130,246,0.3),0_8px_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_60px_rgba(59,130,246,0.4),0_12px_40px_rgba(59,130,246,0.3)] hover:-translate-y-1 duration-300"
            >
              <Sparkles size={20} />
              Start Dominating Free
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#weapons"
              className="inline-flex items-center gap-2 px-8 py-5 bg-white/[0.09] text-white/80 rounded-2xl text-base font-medium hover:bg-white/[0.1] transition-all border border-white/[0.12] hover:border-white/[0.15]"
            >
              <Play size={16} />
              See the Arsenal
            </a>
          </motion.div>

          {/* Stats bar — with animated appearance */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto p-8 rounded-2xl border border-white/[0.10] bg-white/[0.05] backdrop-blur-sm"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-white/60 mt-1.5 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Weapons (Features) */}
      <section id="weapons" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Your AI Arsenal</h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            30+ specialized AI generators. Each one replaces thousands of dollars in agency work.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WEAPONS.map((weapon) => {
            const Icon = weapon.icon;
            return (
              <div
                key={weapon.name}
                className="group rounded-xl border border-white/[0.10] bg-white/[0.05] p-6 hover:border-blue-500/30 hover:bg-blue-500/[0.02] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center mb-4 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-colors">
                  <Icon size={22} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{weapon.name}</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-4">{weapon.description}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold">
                  <Zap size={12} />
                  {weapon.stat}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section id="compare" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Dominat<span className="text-blue-400">8</span> vs Traditional Agencies
          </h2>
          <p className="text-white/60">Same quality. Fraction of the cost. None of the waiting.</p>
        </div>

        <div className="rounded-xl border border-white/[0.10] overflow-hidden">
          <div className="grid grid-cols-3 bg-white/[0.07] border-b border-white/[0.10]">
            <div className="p-4 text-xs font-bold text-white/65 uppercase tracking-wider">Feature</div>
            <div className="p-4 text-xs font-bold text-blue-400 uppercase tracking-wider text-center">Dominat8</div>
            <div className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider text-center">Agency</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 ${i < COMPARISON.length - 1 ? "border-b border-white/[0.08]" : ""}`}
            >
              <div className="p-4 text-sm text-white/60">{row.feature}</div>
              <div className="p-4 text-sm text-center font-semibold text-emerald-400">{row.us}</div>
              <div className="p-4 text-sm text-center text-white/50">{row.them}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">What Users Are Saying</h2>
          <p className="text-white/60">Example use cases based on typical results.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-white/[0.10] bg-white/[0.05] p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-white/60">{t.title}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Choose Your Weapon</h2>
          <p className="text-white/60 mb-8">Cancel anytime. No credit card required for free tier.</p>

          <div className="inline-flex items-center gap-3 p-1 rounded-lg bg-white/[0.07] border border-white/[0.10]">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                !annualBilling ? "bg-white/[0.1] text-white" : "text-white/60"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                annualBilling ? "bg-white/[0.1] text-white" : "text-white/60"
              }`}
            >
              Annual <span className="text-emerald-400 font-bold">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-8 ${
                plan.highlighted
                  ? "border-blue-500/30 bg-blue-500/[0.03] shadow-xl shadow-blue-500/5"
                  : "border-white/[0.10] bg-white/[0.05]"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-white/60 mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-black">
                  {plan.price === "Custom"
                    ? "Custom"
                    : plan.price === "Free"
                      ? "Free"
                      : annualBilling
                        ? "$39"
                        : plan.price}
                </span>
                {plan.period && (
                  <span className="text-white/60 text-sm">{plan.period}</span>
                )}
                {annualBilling && plan.price !== "Free" && plan.price !== "Custom" && (
                  <div className="text-xs text-emerald-400 mt-1">Save $120/year</div>
                )}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                    <Check size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.price === "Custom" ? "/support" : "/builder"}
                className={`block w-full text-center py-3 rounded-lg text-sm font-bold transition-all ${
                  plan.highlighted
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/20"
                    : "bg-white/[0.09] text-white/80 hover:bg-white/[0.1] border border-white/[0.12]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5" />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center relative">
          <Trophy size={48} className="mx-auto text-blue-400/60 mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Stop competing. Start dominating.
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Every minute you wait, a competitor with Dominat8 is launching another site.
            The question isn&apos;t whether you can afford to use AI — it&apos;s whether you can afford not to.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-lg font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/25"
          >
            Start Dominating — It&apos;s Free
            <ArrowRight size={20} />
          </Link>
          <p className="text-xs text-white/50 mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.10] bg-[#0d1525]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Target size={16} className="text-white" />
              </div>
              <span className="text-lg font-black">
                Dominat<span className="text-blue-400">8</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/50">
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
              <Link href="/support" className="hover:text-white/60 transition-colors">Support</Link>
              <Link href="/developers" className="hover:text-white/60 transition-colors">API</Link>
            </div>
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Dominat8. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
