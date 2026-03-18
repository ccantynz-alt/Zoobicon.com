"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Check, Zap, ArrowRight, HelpCircle, Sparkles, Globe, Video, BarChart3,
  Mail, Bot, Palette, Code2, Shield, Users, Building2, Loader2,
  LayoutDashboard, LogOut, Plus, ShoppingCart, Server, AtSign, Lock,
  Blocks, Languages, TestTube2, Megaphone, Headphones,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const PLANS = [
  {
    name: "Starter",
    price: "Free",
    period: "Forever",
    desc: "Full-power AI builds. See exactly what Zoobicon can do — no credit card, no catch.",
    cta: "Start Building Free",
    ctaHref: "/builder",
    featured: false,
    color: "from-white/5 to-white/0",
    features: [
      "3 AI-generated websites per month",
      "10 edits per month",
      "Full 10-agent pipeline (same AI as paid)",
      "Opus-powered builds — agency quality",
      "Industry-aware design intelligence",
      "Basic SEO tools",
      "7-day hosting preview — then upgrade to keep",
      "Community support",
    ],
  },
  {
    name: "Creator",
    price: "$19",
    period: "/month",
    desc: "For freelancers and small businesses shipping real sites.",
    cta: "Start Creator Trial",
    ctaHref: "/auth/signup",
    planSlug: "creator" as const,
    featured: false,
    color: "from-emerald-500/5 to-white/0",
    features: [
      "15 AI-generated websites per month",
      "100 edits per month",
      "10-agent pipeline (premium quality)",
      "Custom domain support",
      "React + Next.js export",
      "GitHub export & WordPress export",
      "Permanent hosting included",
      "Basic SEO tools",
      "Email support",
      "API access (10K req/mo)",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    desc: "The full arsenal. Every AI tool, high limits, zero compromise.",
    cta: "Start Pro Trial",
    ctaHref: "/auth/signup",
    planSlug: "pro" as const,
    featured: true,
    color: "from-brand-500/10 to-accent-purple/5",
    features: [
      "50 AI-generated websites per month",
      "500 edits per month",
      "Everything in Creator, plus:",
      "AI-generated images (DALL-E)",
      "Full SEO Campaign Agent",
      "AI Video Creator",
      "AI Email Support & Marketing",
      "AI Brand Kit",
      "Chatbot Builder",
      "A/B Testing & Analytics",
      "Figma Import",
      "Live Agent support (30 min/mo)",
      "Priority support",
      "API access (100K req/mo)",
    ],
  },
  {
    name: "Agency",
    price: "$99",
    period: "/month",
    desc: "For agencies building sites at scale. White-label and client handoff.",
    cta: "Start Agency Trial",
    ctaHref: "/auth/signup",
    planSlug: "agency" as const,
    featured: false,
    color: "from-purple-500/5 to-white/0",
    features: [
      "200 AI-generated websites per month",
      "Unlimited edits",
      "Everything in Pro, plus:",
      "White-label platform (your brand)",
      "Client handoff & management",
      "Team seats (up to 10)",
      "Template marketplace access",
      "Bulk operations & automation",
      "API access (500K req/mo)",
      "Priority Slack support",
    ],
  },
  {
    name: "Enterprise",
    price: "$299",
    period: "/month",
    desc: "Unlimited everything. Custom AI, SSO, SLA, and dedicated support.",
    cta: "Contact Sales",
    ctaHref: "mailto:sales@zoobicon.com?subject=Enterprise Inquiry",
    featured: false,
    isExternal: true,
    color: "from-accent-cyan/5 to-white/0",
    features: [
      "Unlimited generations & edits",
      "Everything in Agency, plus:",
      "Custom AI model training",
      "Dedicated AI agents",
      "Unlimited API access",
      "SSO / SAML authentication",
      "Custom integrations",
      "SLA guarantee (99.99%)",
      "Dedicated account manager",
      "Invoiced billing (NET 30)",
    ],
  },
];

const PRODUCTS = [
  { icon: Zap, name: "AI Website Builder", starter: "3/mo", creator: "15/mo", pro: "50/mo", agency: "200/mo", enterprise: "Unlimited" },
  { icon: Code2, name: "AI Edits", starter: "10/mo", creator: "100/mo", pro: "500/mo", agency: "Unlimited", enterprise: "Unlimited" },
  { icon: Sparkles, name: "10-Agent Pipeline", starter: true, creator: true, pro: true, agency: true, enterprise: true },
  { icon: Palette, name: "React + shadcn/ui Export", starter: false, creator: true, pro: true, agency: true, enterprise: true },
  { icon: BarChart3, name: "SEO Campaign Agent", starter: "Basic", creator: "Basic", pro: "Full", agency: "Full", enterprise: "Full" },
  { icon: Video, name: "AI Video Creator", starter: false, creator: false, pro: true, agency: true, enterprise: true },
  { icon: Mail, name: "AI Email Support", starter: false, creator: false, pro: true, agency: true, enterprise: true },
  { icon: Bot, name: "Chatbot Builder", starter: false, creator: false, pro: true, agency: true, enterprise: true },
  { icon: Users, name: "White-Label & Teams", starter: false, creator: false, pro: false, agency: "10 seats", enterprise: "Unlimited" },
  { icon: Headphones, name: "Live Agent Support", starter: false, creator: false, pro: "30 min/mo", agency: false, enterprise: false },
  { icon: Shield, name: "SLA Guarantee", starter: false, creator: false, pro: false, agency: false, enterprise: "99.99%" },
  { icon: Code2, name: "API Access", starter: false, creator: "10K/mo", pro: "100K/mo", agency: "500K/mo", enterprise: "Unlimited" },
];

// Features that are not yet fully built — show a subtle "Soon" badge
const SOON_FEATURES = new Set([
  // Creator tier
  "Custom domain support",
  "Email support",
  // Pro tier
  "Full SEO Campaign Agent",
  "AI Video Creator",
  "AI Email Support & Marketing",
  "AI Brand Kit",
  "Chatbot Builder",
  "A/B Testing & Analytics",
  // Agency tier
  "Client handoff & management",
  "Template marketplace access",
  "Bulk operations & automation",
  // Enterprise tier
  "Custom AI model training",
  "Dedicated AI agents",
  "SSO / SAML authentication",
  "Custom integrations",
  "SLA guarantee (99.99%)",
  "Invoiced billing (NET 30)",
]);

// Products in the comparison table that are not yet built
const SOON_PRODUCTS = new Set([
  "SEO Campaign Agent",
  "AI Video Creator",
  "AI Email Support",
  "Chatbot Builder",
  "White-Label & Teams",
]);

const SoonBadge = () => (
  <span className="ml-1 text-[9px] text-amber-400/60 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Soon</span>
);

const FAQS = [
  {
    q: "No credits? No usage tokens? What's the catch?",
    a: "There is no catch. We don't use a credit system because we think credits are designed to confuse people and drain wallets. You get a flat monthly price with clear generation limits. Starter is free with 3 sites/month and the FULL 10-agent AI pipeline — same Opus-powered quality as paid plans. We want you to see exactly what Zoobicon can do. Free sites are hosted for 7 days so you can share them, then upgrade to keep them permanently.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your dashboard settings. You keep access until the end of your billing period. No cancellation fees, no guilt trips.",
  },
  {
    q: "Is there a free trial for Creator and Pro?",
    a: "Yes — 14 days free on both Creator and Pro. No credit card required to start the trial. You can downgrade to Starter anytime.",
  },
  {
    q: "What's the difference between Creator, Pro, and Agency?",
    a: "Creator ($19/mo) gives you 15 websites/month with the full 10-agent pipeline, custom domains, React export, and permanent hosting. Pro ($49/mo) bumps to 50/month and adds all 12+ AI tools: Video Creator, DALL-E images, Brand Kit, Email Marketing, Chatbot Builder, and more. Agency ($99/mo) adds 200/month, white-labeling, team seats, and client management — perfect for agencies building sites for clients. Enterprise ($299/mo) is truly unlimited with custom AI training, SSO, and SLA.",
  },
  {
    q: "Do I own the websites I generate?",
    a: "Yes, 100%. All generated code is yours — export to GitHub, download as HTML, deploy anywhere. No lock-in. Even on the free tier.",
  },
  {
    q: "What happens to my websites if I downgrade?",
    a: "Your sites are preserved forever. On Starter, you can still view, edit, and export everything. You just can't generate new ones beyond the 3/month limit. Hosted sites stay live as long as you have a paid plan — Starter sites get 7-day previews.",
  },
  {
    q: "What's Live Agent support?",
    a: "Free users get Zoe, our quick AI assistant (powered by Claude Haiku). Pro includes Live Agent support — a full Claude Sonnet-powered AI that gives deeper, more thorough answers with 30 minutes/month (10 min sessions). Agency and Enterprise don't include it because those users already have Priority Slack and dedicated account managers. Anyone can add Premium Support for $19/month for 60 minutes of live agent time with 20-minute sessions.",
  },
  {
    q: "How does white-labeling work on Enterprise?",
    a: "We give you a fully branded version of the platform — your logo, your domain, your colors. Your clients never see Zoobicon. Perfect for agencies serving multiple clients.",
  },
];

export default function PricingPage() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  async function handleCheckout(plan: "creator" | "pro" | "agency") {
    setCheckoutLoading(true);
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    const email = window.prompt(`Enter your email to start the ${planLabel} trial:`);
    if (!email) { setCheckoutLoading(false); return; }

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error ?? "Something went wrong");
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050508]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button
                  onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} setUser(null); }}
                  className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2">Sign in</Link>
                <Link href="/auth/signup" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <CursorGlowTracker />

      <main>
        {/* Hero */}
        <section className="relative py-20 lg:py-28 text-center">
          <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/5 text-brand-400 text-sm font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Simple, transparent pricing
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                Ready to<br /><span className="gradient-text">Dominate?</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg text-white/60 max-w-xl mx-auto">
                Start free. Scale when you&apos;re ready. No credit card required for Starter or the 14-day Pro trial.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-20 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer} className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {PLANS.map((plan) => (
                <motion.div
                  key={plan.name}
                  variants={fadeInUp}
                  className={`relative rounded-2xl p-8 flex flex-col ${
                    plan.featured
                      ? "border border-brand-500/30 bg-gradient-to-b from-brand-500/10 to-accent-purple/5 shadow-glow"
                      : "gradient-border"
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-purple text-xs font-bold text-white whitespace-nowrap">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <div className={`text-sm font-semibold mb-2 ${plan.featured ? "text-brand-400" : "text-white/65"}`}>{plan.name}</div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-black">{plan.price}</span>
                      {plan.period && <span className="text-white/50 text-sm">{plan.period}</span>}
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{plan.desc}</p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.featured ? "text-brand-400" : "text-white/50"}`} />
                        <span className="text-sm text-white/65">{f}{SOON_FEATURES.has(f) && <SoonBadge />}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.isExternal ? (
                    <a
                      href={plan.ctaHref}
                      className="block w-full py-3 rounded-xl text-sm font-bold text-center border border-white/[0.1] text-white/70 hover:text-white hover:border-white/20 transition-all"
                    >
                      {plan.cta}
                    </a>
                  ) : plan.planSlug ? (
                    <button
                      onClick={() => handleCheckout(plan.planSlug!)}
                      disabled={checkoutLoading}
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed ${
                        plan.featured
                          ? "btn-gradient text-white shadow-glow"
                          : "border border-white/[0.1] text-white/70 hover:text-white hover:border-white/20 transition-all"
                      }`}
                    >
                      {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {plan.cta}
                    </button>
                  ) : (
                    <Link
                      href={plan.ctaHref}
                      className="block w-full py-3 rounded-xl text-sm font-bold text-center border border-white/[0.1] text-white/70 hover:text-white hover:border-white/20 transition-all"
                    >
                      {plan.cta}
                    </Link>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Feature comparison */}
        <section className="py-20 border-t border-white/[0.08] px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-3xl font-black text-center mb-2">What&apos;s included</motion.h2>
              <motion.p variants={fadeInUp} className="text-white/50 text-center mb-10">Every AI product, broken down by plan. No credits. No surprises.</motion.p>

              <motion.div variants={fadeInUp} className="gradient-border rounded-2xl overflow-hidden overflow-x-auto">
                {/* Header */}
                <div className="grid grid-cols-6 gap-0 border-b border-white/[0.10] min-w-[800px]">
                  <div className="px-4 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Product</div>
                  <div className="px-3 py-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-center">Starter</div>
                  <div className="px-3 py-4 text-xs font-semibold text-emerald-400 uppercase tracking-wider text-center bg-emerald-500/[0.03]">Creator</div>
                  <div className="px-3 py-4 text-xs font-semibold text-brand-400 uppercase tracking-wider text-center bg-brand-500/[0.03]">Pro</div>
                  <div className="px-3 py-4 text-xs font-semibold text-purple-400 uppercase tracking-wider text-center bg-purple-500/[0.03]">Agency</div>
                  <div className="px-3 py-4 text-xs font-semibold text-accent-cyan uppercase tracking-wider text-center">Enterprise</div>
                </div>

                {PRODUCTS.map((p, i) => (
                  <div key={p.name} className={`grid grid-cols-6 gap-0 border-b border-white/[0.07] min-w-[800px] ${i % 2 === 0 ? "" : "bg-white/[0.04]"}`}>
                    <div className="px-4 py-3 flex items-center gap-2">
                      <p.icon className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                      <span className="text-xs text-white/60">{p.name}{SOON_PRODUCTS.has(p.name) && <SoonBadge />}</span>
                    </div>
                    {(["starter", "creator", "pro", "agency", "enterprise"] as const).map((tier) => {
                      const val = p[tier];
                      const tierColors: Record<string, string> = {
                        starter: "text-white/60",
                        creator: "text-emerald-400",
                        pro: "text-brand-400",
                        agency: "text-purple-400",
                        enterprise: "text-accent-cyan",
                      };
                      const bgClass = tier === "creator" ? "bg-emerald-500/[0.02]" : tier === "pro" ? "bg-brand-500/[0.02]" : tier === "agency" ? "bg-purple-500/[0.02]" : "";
                      return (
                        <div key={tier} className={`px-3 py-3 flex items-center justify-center ${bgClass}`}>
                          {typeof val === "string" ? (
                            <span className={`text-[11px] ${tierColors[tier]}`}>{val}</span>
                          ) : val ? (
                            <Check className={`w-3.5 h-3.5 ${tierColors[tier]}`} />
                          ) : (
                            <span className="w-3.5 h-px bg-white/10 block" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Popular Add-ons */}
        <section className="py-20 border-t border-white/[0.08] px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="flex items-center gap-2 justify-center mb-2">
                <Plus className="w-5 h-5 text-brand-400" />
                <h2 className="text-3xl font-black">Power up your plan</h2>
              </motion.div>
              <motion.p variants={fadeInUp} className="text-white/50 text-center mb-4 max-w-xl mx-auto">
                Add individual AI agents and tools to any plan. Pay only for what you need.
              </motion.p>
              <motion.p variants={fadeInUp} className="text-xs text-brand-400/60 text-center mb-10">
                Pro plan includes all add-ons at no extra cost
              </motion.p>

              <motion.div variants={staggerContainer} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { icon: BarChart3, name: "SEO Campaign Agent", price: "$29", period: "/mo", desc: "Autonomous SEO: keyword discovery, content gen, rank tracking", color: "text-emerald-400", borderColor: "border-emerald-500/15 hover:border-emerald-500/30", soon: true },
                  { icon: Video, name: "AI Video Creator", price: "$19", period: "/mo", desc: "Auto-generate social videos for TikTok, Reels, YouTube", color: "text-brand-400", borderColor: "border-brand-500/15 hover:border-brand-500/30", soon: true },
                  { icon: Mail, name: "AI Email Support", price: "$24", period: "/mo", desc: "AI auto-reply, smart inbox, sentiment analysis, <30s response", color: "text-accent-cyan", borderColor: "border-accent-cyan/15 hover:border-accent-cyan/30", soon: true },
                  { icon: Megaphone, name: "Email Marketing Suite", price: "$14", period: "/mo", desc: "Campaigns, automations, A/B testing, deliverability tools", color: "text-amber-400", borderColor: "border-amber-500/15 hover:border-amber-500/30", soon: true },
                  { icon: Bot, name: "AI Chatbot Builder", price: "$14", period: "/mo", desc: "Train on your content, embed anywhere, capture leads", color: "text-purple-400", borderColor: "border-purple-500/15 hover:border-purple-500/30", soon: true },
                  { icon: Languages, name: "Multi-Language (i18n)", price: "$14", period: "/mo", desc: "Auto-translate your site into 30+ languages", color: "text-pink-400", borderColor: "border-pink-500/15 hover:border-pink-500/30", soon: true },
                  { icon: TestTube2, name: "A/B Testing Engine", price: "$19", period: "/mo", desc: "Split test pages, CTAs, and layouts with AI recommendations", color: "text-orange-400", borderColor: "border-orange-500/15 hover:border-orange-500/30", soon: true },
                  { icon: Palette, name: "AI Brand Kit", price: "$19", period: "one-time", desc: "Logo, color palette, typography, brand guidelines — AI generated", color: "text-rose-400", borderColor: "border-rose-500/15 hover:border-rose-500/30", soon: true },
                  { icon: Headphones, name: "Premium Support", price: "$19", period: "/mo", desc: "+60 min/mo live Claude agent support with 20 min sessions. Real answers, not canned responses", color: "text-emerald-400", borderColor: "border-emerald-500/15 hover:border-emerald-500/30", soon: false },
                  { icon: Blocks, name: "Component Library", price: "$19", period: "one-time", desc: "500+ premium components: heroes, CTAs, navs, footers, forms", color: "text-teal-400", borderColor: "border-teal-500/15 hover:border-teal-500/30", soon: false },
                ].map((addon) => (
                  <motion.div key={addon.name} variants={fadeInUp}>
                    <Link href="/marketplace" className={`block p-5 rounded-xl border ${addon.borderColor} bg-white/[0.04] transition-all group`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <addon.icon className={`w-4 h-4 ${addon.color}`} />
                          <span className="text-sm font-semibold text-white/80">{addon.name}{addon.soon && <SoonBadge />}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-white">{addon.price}</span>
                          <span className="text-[10px] text-white/50 ml-0.5">{addon.period}</span>
                        </div>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed">{addon.desc}</p>
                      <div className="mt-3 text-[10px] font-semibold text-white/40 group-hover:text-white/60 transition-colors flex items-center gap-1">
                        Add to plan <ArrowRight className="w-2.5 h-2.5" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-6 text-center">
                <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  View all 20+ add-ons in the Marketplace
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Domain + Hosting Bundle */}
        <section className="py-20 border-t border-white/[0.08] px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-3xl font-black text-center mb-2">Launch the complete stack</motion.h2>
              <motion.p variants={fadeInUp} className="text-white/50 text-center mb-10 max-w-lg mx-auto">Domain, hosting, SSL, email — everything to go live. Bundle and save.</motion.p>

              <motion.div variants={staggerContainer} className="grid md:grid-cols-3 gap-5">
                {/* Domain */}
                <motion.div variants={fadeInUp}>
                  <Link href="/domains" className="block gradient-border rounded-2xl p-7 h-full hover:bg-white/[0.04] transition-all group">
                    <Globe className="w-8 h-8 text-brand-400 mb-4" />
                    <h3 className="text-lg font-bold mb-1">Custom Domain<SoonBadge /></h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-black">$2.99</span>
                      <span className="text-sm text-white/50">/year</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {[".com from $12.99/yr", ".ai from $69.99/yr", ".io, .dev, .app available", "Free WHOIS privacy included"].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                          <Check className="w-3 h-3 text-brand-400/60 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <span className="text-xs text-white/40 group-hover:text-brand-400 transition-colors flex items-center gap-1 font-medium">
                      Browse domains <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </motion.div>

                {/* Hosting */}
                <motion.div variants={fadeInUp}>
                  <Link href="/hosting" className="block gradient-border rounded-2xl p-7 h-full hover:bg-white/[0.04] transition-all group">
                    <Server className="w-8 h-8 text-accent-cyan mb-4" />
                    <h3 className="text-lg font-bold mb-1">Premium Hosting</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-black">$12.99</span>
                      <span className="text-sm text-white/50">/month</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {["Global CDN (300+ edge nodes)", "99.99% uptime SLA", "Auto SSL & DDoS protection", "Instant rollbacks & staging"].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                          <Check className="w-3 h-3 text-accent-cyan/60 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <span className="text-xs text-white/40 group-hover:text-accent-cyan transition-colors flex items-center gap-1 font-medium">
                      View hosting <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                </motion.div>

                {/* Email + Security bundle */}
                <motion.div variants={fadeInUp}>
                  <div className="gradient-border rounded-2xl p-7 h-full">
                    <AtSign className="w-8 h-8 text-emerald-400 mb-4" />
                    <h3 className="text-lg font-bold mb-1">Email + Security<SoonBadge /></h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-black">$14.98</span>
                      <span className="text-sm text-white/50">/month</span>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {["Professional email (you@domain)", "10GB storage per mailbox", "Wildcard SSL certificate", "Malware scanning & firewall"].map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                          <Check className="w-3 h-3 text-emerald-400/60 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                      <Lock className="w-3 h-3" /> Email $4.99/mo + SSL & Security $9.99/mo
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Bundle callout */}
              <motion.div variants={fadeInUp} className="mt-6 gradient-border rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-white/80">Full Stack Bundle: </span>
                  <span className="text-sm text-white/60">Creator plan + domain + hosting + email + SSL</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-white/40 line-through">$51.96/mo + domain</div>
                    <div className="text-sm font-black text-brand-400">From $46.98/mo + $2.99/yr</div>
                  </div>
                  <Link href="/domains" className="btn-gradient px-5 py-2.5 rounded-lg text-xs font-bold text-white whitespace-nowrap flex items-center gap-1.5">
                    Start with a domain <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* For Agencies */}
        <section className="py-20 border-t border-white/[0.08] px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="gradient-border rounded-2xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-accent-cyan" />
                    <span className="text-sm font-semibold text-accent-cyan">For Agencies</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight mb-3">Scale your agency with Zoobicon</h2>
                  <p className="text-white/60 leading-relaxed">
                    White-label the entire platform. Manage all your clients from one dashboard.
                    Bulk-generate websites. Custom pricing on request.
                  </p>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <Link href="/agencies" className="btn-gradient px-8 py-4 rounded-xl text-sm font-bold text-white flex items-center gap-2">
                    View Agency Plans <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href="mailto:sales@zoobicon.com?subject=Agency Demo Request" className="px-8 py-4 rounded-xl text-sm font-semibold text-white/65 border border-white/[0.12] hover:border-white/20 transition-all text-center flex items-center gap-2 justify-center">
                    <Users className="w-4 h-4" /> Book a Demo
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 border-t border-white/[0.08] px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="flex items-center gap-2 justify-center mb-2">
                <HelpCircle className="w-5 h-5 text-white/50" />
                <h2 className="text-3xl font-black">FAQ</h2>
              </motion.div>
              <motion.p variants={fadeInUp} className="text-white/50 text-center mb-12">Everything you need to know.</motion.p>

              <motion.div variants={staggerContainer} className="space-y-4">
                {FAQS.map((faq) => (
                  <motion.div key={faq.q} variants={fadeInUp} className="gradient-border rounded-xl p-6">
                    <h3 className="text-sm font-bold mb-2">{faq.q}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{faq.a}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-24 text-center border-t border-white/[0.08] px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Start free today.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/60 mb-8">No credit card required. Cancel anytime.</motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/builder" className="group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center gap-2 shadow-glow">
                <span>Try the Builder</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/auth/signup" className="px-8 py-4 rounded-2xl text-base font-semibold text-white/65 border border-white/[0.12] hover:border-white/20 transition-all">
                Create Free Account
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
