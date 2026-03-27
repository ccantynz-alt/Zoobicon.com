"use client";

import Link from "next/link";
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
} from "lucide-react";

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

      {/* ── HERO ── */}
      <section className="relative pt-32 md:pt-44 pb-24 md:pb-32 px-4 sm:px-6 overflow-hidden">
        {/* Subtle top gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/[0.07] via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            7 AI agents. One prompt. Production-ready in 95 seconds.
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Build any website with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              a single sentence
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe what you want. 7 specialized AI agents collaborate to design, build,
            and deploy production-ready websites, apps, and stores — in under two minutes.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/builder"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20"
            >
              Start Building Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/generators"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-slate-300 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
            >
              Explore 43 Generators
            </Link>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUR DOMAINS ── */}
      <section className="py-24 md:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-indigo-400 mb-3">
              One Platform, Four Domains
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Every domain, a different superpower
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DOMAINS.map((d) => {
              const c = DOMAIN_COLORS[d.color];
              const Icon = d.icon;
              return (
                <div
                  key={d.name}
                  className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 transition-all duration-200 ${c.border}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-0.5">{d.name}</h3>
                  <p className={`text-sm ${c.text} mb-3`}>{d.role}</p>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">{d.desc}</p>
                  <Link href={d.href} className={`text-xs font-semibold ${c.text} inline-flex items-center gap-1 hover:underline`}>
                    {d.cta} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 md:py-32 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Describe it. We build it.
            </h2>
            <p className="text-lg text-slate-400 max-w-lg mx-auto">
              Three steps. No code. No templates. No compromise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                <div className="text-[80px] font-black text-white/[0.03] leading-none absolute -top-4 -left-2 select-none pointer-events-none">
                  {step.num}
                </div>
                <div className="relative pt-6">
                  <div className="text-xs font-bold text-indigo-400 mb-3 tracking-widest uppercase">
                    Step {step.num}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.body}</p>
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
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-5">What you can build</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "SaaS Landing Pages", "E-Commerce Stores", "Portfolios", "Dashboards",
                "Restaurants", "Agency Sites", "Blogs", "Full-Stack Apps",
              ].map((tag) => (
                <span key={tag} className="px-4 py-2 rounded-full border border-white/[0.06] text-xs text-slate-500">
                  {tag}
                </span>
              ))}
              <Link
                href="/generators"
                className="px-4 py-2 rounded-full border border-indigo-500/20 text-xs text-indigo-400 hover:border-indigo-500/40 transition-colors"
              >
                +35 more generators
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 md:py-32 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Everything you need to ship
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              Not just a website builder. A complete platform for building, launching,
              and growing your online presence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── VALUE PROPOSITION ── */}
      <section className="py-24 md:py-32 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-indigo-400 mb-3">
            Replace your entire SaaS stack
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            75+ tools. One platform.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              $49/month.
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
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
              <div key={t.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 text-left">
                <div className="text-sm font-semibold text-white mb-1">{t.label}</div>
                <div className="text-xs text-slate-500">{t.saves}</div>
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
            <p className="text-lg text-slate-400">
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
                <div className="text-sm text-slate-400 mb-2">{plan.name}</div>
                <div className="text-4xl font-bold mb-1">
                  {plan.price}
                  <span className="text-lg font-normal text-slate-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 my-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.featured ? "text-indigo-400" : "text-slate-600"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full py-3 text-center rounded-full text-sm font-semibold transition-colors ${
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

          <p className="text-center text-xs text-slate-500 mt-8">
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
          <p className="text-lg text-slate-400 max-w-lg mx-auto mb-10">
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

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.04] py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="text-lg font-bold mb-4">Zoobicon</div>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
                The AI platform for building, launching, and scaling
                websites and web applications.
              </p>
              <div className="flex flex-wrap gap-2">
                {["zoobicon.com", "zoobicon.ai", "zoobicon.io", "zoobicon.sh"].map((d) => (
                  <span key={d} className="text-[10px] text-slate-500 bg-white/[0.04] px-2.5 py-1 rounded-full">{d}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Products</div>
              <ul className="space-y-2.5">
                {[
                  ["/products/website-builder", "Website Builder"],
                  ["/products/seo-agent", "SEO Agent"],
                  ["/products/email-support", "Email Support"],
                  ["/generators", "43 Generators"],
                  ["/marketplace", "Marketplace"],
                  ["/domains", "Domains"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Platform</div>
              <ul className="space-y-2.5">
                {[
                  ["/developers", "API Docs"],
                  ["/cli", "CLI Tools"],
                  ["/hosting", "Hosting"],
                  ["/wordpress", "WordPress"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Company</div>
              <ul className="space-y-2.5">
                {[
                  ["/agencies", "For Agencies"],
                  ["/support", "Support"],
                  ["/pricing", "Pricing"],
                  ["/privacy", "Privacy"],
                  ["/terms", "Terms"],
                  ["/refund-policy", "Refund Policy"],
                  ["/acceptable-use", "Acceptable Use"],
                  ["/dmca", "DMCA"],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">&copy; 2026 Zoobicon. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="/terms" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Terms</Link>
              <Link href="/refund-policy" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Refunds</Link>
              <Link href="/dmca" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">DMCA</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
