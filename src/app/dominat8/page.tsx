"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Target, Zap, Globe, Layout, BarChart3, Search, ArrowRight, Check,
  Star, Menu, X, Sparkles, Rocket, Shield, Clock, Users, Bot, Code2,
  TrendingUp, Trophy, Flame, ChevronRight, Play,
} from "lucide-react";

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
  { value: "45+", label: "AI Generators" },
  { value: "10", label: "Agent Pipeline" },
  { value: "<60s", label: "Generation Time" },
  { value: "99.9%", label: "Uptime SLA" },
];

const WEAPONS = [
  {
    icon: Globe,
    name: "Killer Websites",
    description: "Generate full production websites in seconds. While competitors spend weeks with agencies, you launch today.",
    stat: "32 site types",
  },
  {
    icon: Layout,
    name: "Landing Pages That Convert",
    description: "AI-optimized landing pages with 12 conversion sections, A/B variants, and proven copywriting frameworks.",
    stat: "47% avg conversion lift",
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
    description: "Strategist, Brand Designer, Copywriter, Architect, Developer, Animator, SEO, Forms, Integrations, QA — all working together.",
    stat: "10 specialized agents",
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
    name: "Marcus Chen",
    title: "Founder",
    company: "Apex Digital Agency",
    rating: 5,
  },
  {
    quote: "The 10-agent pipeline produced a site that our $15K agency couldn't match. I cancelled my agency retainer the same day.",
    name: "Sarah Williams",
    title: "Marketing Director",
    company: "TechScale Inc",
    rating: 5,
  },
  {
    quote: "Generated a complete SaaS dashboard with user management, analytics, and billing. What would have taken my team 3 months took 90 seconds.",
    name: "James Park",
    title: "CTO",
    company: "DataFlow Systems",
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
      "All 45+ generators",
      "10-agent Ultra pipeline",
      "Priority support",
      "Custom domains",
      "API access (100K req/mo)",
      "A/B testing",
      "White-label export",
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
      "Custom AI training",
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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white text-center py-2 text-xs font-medium">
        <span className="hidden sm:inline">Join 10,000+ businesses already dominating their market with AI</span>
        <span className="sm:hidden">10,000+ businesses using Dominat8</span>
        <span className="mx-2">|</span>
        <Link href="/builder" className="underline font-bold">Try free →</Link>
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dominat8" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Target size={18} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">
              Dominat<span className="text-red-500">8</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#weapons" className="text-sm text-white/50 hover:text-white transition-colors">Arsenal</a>
            <a href="#compare" className="text-sm text-white/50 hover:text-white transition-colors">Compare</a>
            <a href="#testimonials" className="text-sm text-white/50 hover:text-white transition-colors">Proof</a>
            <a href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden sm:block text-sm text-white/50 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/builder"
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg text-sm font-bold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/20"
            >
              Start Dominating
            </Link>
            <button className="md:hidden text-white/50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/3 w-[600px] h-[600px] rounded-full bg-red-500/[0.04] blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-orange-500/[0.04] blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-8">
            <Flame size={14} />
            The AI Competitive Advantage
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1]">
            Your competitors are
            <br />
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              not ready for this.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 max-w-3xl mx-auto mb-10 leading-relaxed">
            While they spend weeks and tens of thousands on websites, you&apos;ll generate
            agency-quality sites, apps, and marketing assets in{" "}
            <span className="text-white font-semibold">under 60 seconds</span>.
            45+ AI generators. 10-agent pipeline. Zero mercy.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-base font-bold hover:from-red-600 hover:to-orange-600 transition-all shadow-xl shadow-red-500/25"
            >
              Start Dominating Free
              <ArrowRight size={18} />
            </Link>
            <a
              href="#weapons"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.06] text-white/80 rounded-xl text-base font-medium hover:bg-white/[0.1] transition-colors border border-white/[0.08]"
            >
              <Play size={16} />
              See the Arsenal
            </a>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weapons (Features) */}
      <section id="weapons" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Your AI Arsenal</h2>
          <p className="text-white/40 max-w-2xl mx-auto">
            45+ specialized AI generators. Each one replaces thousands of dollars in agency work.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WEAPONS.map((weapon) => {
            const Icon = weapon.icon;
            return (
              <div
                key={weapon.name}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-red-500/30 hover:bg-red-500/[0.02] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-4 group-hover:from-red-500/30 group-hover:to-orange-500/30 transition-colors">
                  <Icon size={22} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{weapon.name}</h3>
                <p className="text-sm text-white/40 leading-relaxed mb-4">{weapon.description}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-semibold">
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
            Dominat<span className="text-red-500">8</span> vs Traditional Agencies
          </h2>
          <p className="text-white/40">Same quality. Fraction of the cost. None of the waiting.</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="grid grid-cols-3 bg-white/[0.04] border-b border-white/[0.06]">
            <div className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Feature</div>
            <div className="p-4 text-xs font-bold text-red-400 uppercase tracking-wider text-center">Dominat8</div>
            <div className="p-4 text-xs font-bold text-white/30 uppercase tracking-wider text-center">Agency</div>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-3 ${i < COMPARISON.length - 1 ? "border-b border-white/[0.04]" : ""}`}
            >
              <div className="p-4 text-sm text-white/60">{row.feature}</div>
              <div className="p-4 text-sm text-center font-semibold text-emerald-400">{row.us}</div>
              <div className="p-4 text-sm text-center text-white/30">{row.them}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">The Proof</h2>
          <p className="text-white/40">Real businesses. Real results. Real domination.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
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
                <div className="text-xs text-white/40">{t.title}, {t.company}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Choose Your Weapon</h2>
          <p className="text-white/40 mb-8">Cancel anytime. No credit card required for free tier.</p>

          <div className="inline-flex items-center gap-3 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                !annualBilling ? "bg-white/[0.1] text-white" : "text-white/40"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${
                annualBilling ? "bg-white/[0.1] text-white" : "text-white/40"
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
                  ? "border-red-500/30 bg-red-500/[0.03] shadow-xl shadow-red-500/5"
                  : "border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-white/40 mb-4">{plan.description}</p>
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
                  <span className="text-white/40 text-sm">{plan.period}</span>
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
                    ? "bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 shadow-lg shadow-red-500/20"
                    : "bg-white/[0.06] text-white/80 hover:bg-white/[0.1] border border-white/[0.08]"
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
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5" />
        <div className="max-w-4xl mx-auto px-6 py-24 text-center relative">
          <Trophy size={48} className="mx-auto text-red-400/60 mb-6" />
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Stop competing. Start dominating.
          </h2>
          <p className="text-white/40 mb-8 max-w-2xl mx-auto">
            Every minute you wait, a competitor with Dominat8 is launching another site.
            The question isn&apos;t whether you can afford to use AI — it&apos;s whether you can afford not to.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-lg font-bold hover:from-red-600 hover:to-orange-600 transition-all shadow-xl shadow-red-500/25"
          >
            Start Dominating — It&apos;s Free
            <ArrowRight size={20} />
          </Link>
          <p className="text-xs text-white/30 mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#06060a]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <Target size={16} className="text-white" />
              </div>
              <span className="text-lg font-black">
                Dominat<span className="text-red-500">8</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/30">
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
              <Link href="/support" className="hover:text-white/60 transition-colors">Support</Link>
              <Link href="/developers" className="hover:text-white/60 transition-colors">API</Link>
            </div>
            <p className="text-xs text-white/20">
              © {new Date().getFullYear()} Dominat8. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
