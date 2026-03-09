"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check, Zap, ArrowRight, HelpCircle, Sparkles, Globe, Video, BarChart3,
  Mail, Bot, Palette, Code2, Shield, Users, Building2, Loader2,
  LayoutDashboard, LogOut,
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
    desc: "Perfect for side projects, experiments, and getting started.",
    cta: "Start Building",
    ctaHref: "/builder",
    featured: false,
    color: "from-white/5 to-white/0",
    features: [
      "5 AI-generated websites per month",
      "Basic SEO tools",
      "Community support",
      "1 AI support agent",
      "Zoobicon subdomain hosting",
      "Export HTML files",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    desc: "Everything you need to run a serious digital business.",
    cta: "Start Pro Trial",
    ctaHref: "/auth/signup",
    featured: true,
    color: "from-brand-500/10 to-accent-purple/5",
    features: [
      "Unlimited AI-generated websites",
      "AI Video Creator",
      "SEO Campaign Agent",
      "AI Email Support",
      "AI Brand Kit",
      "Email Marketing",
      "Social Media Manager",
      "Analytics dashboard",
      "Chatbot Builder",
      "Custom domain support",
      "Priority support",
      "API access (100K req/mo)",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "White-label, custom AI, and dedicated agents for agencies and large teams.",
    cta: "Contact Sales",
    ctaHref: "mailto:sales@zoobicon.com?subject=Enterprise Inquiry",
    featured: false,
    isExternal: true,
    color: "from-accent-cyan/5 to-white/0",
    features: [
      "Everything in Pro",
      "White-label platform",
      "Custom AI model training",
      "Dedicated AI agents",
      "Unlimited API access",
      "Client management portal",
      "Bulk operations & automation",
      "Custom integrations",
      "SLA guarantee (99.99%)",
      "Dedicated account manager",
      "On-boarding & training",
      "Invoiced billing",
    ],
  },
];

const PRODUCTS = [
  { icon: Zap, name: "AI Website Builder", starter: "5/mo", pro: "Unlimited" },
  { icon: BarChart3, name: "SEO Campaign Agent", starter: "Basic", pro: "Full (Aggressive mode)" },
  { icon: Video, name: "AI Video Creator", starter: false, pro: true },
  { icon: Mail, name: "AI Email Support", starter: false, pro: true },
  { icon: Palette, name: "AI Brand Kit", starter: false, pro: true },
  { icon: Globe, name: "Email Marketing", starter: false, pro: true },
  { icon: Bot, name: "Social Media Manager", starter: false, pro: true },
  { icon: Code2, name: "Chatbot Builder", starter: false, pro: true },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel anytime from your dashboard settings. You'll keep access until the end of your billing period.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Yes — your first 14 days on Pro are free. No credit card required to start.",
  },
  {
    q: "What happens to my websites if I downgrade?",
    a: "Your sites are preserved. On Starter, you can still view and export your sites, but you won't be able to generate new ones beyond the 5/month limit.",
  },
  {
    q: "Do I own the websites I generate?",
    a: "Yes, 100%. All generated code is yours to export, host anywhere, and use commercially.",
  },
  {
    q: "What's included in the API access?",
    a: "Pro includes 100,000 API requests per month to the zoobicon.io REST API. This lets you embed AI website generation into your own tools and workflows.",
  },
  {
    q: "How does white-labeling work on Enterprise?",
    a: "We give you a fully branded version of the platform — your logo, your domain, your colors. Your clients never see Zoobicon.",
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

  async function handleProCheckout() {
    setCheckoutLoading(true);
    const email = window.prompt("Enter your email to start the Pro trial:");
    if (!email) { setCheckoutLoading(false); return; }

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
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
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-blue w-[700px] h-[700px] -top-40 -left-40 opacity-20" />
        <div className="glow-orb glow-orb-purple w-[500px] h-[500px] top-1/2 right-0 opacity-10" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-dark-400/80 backdrop-blur-2xl">
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
                <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                </Link>
                <button
                  onClick={() => { localStorage.removeItem("zoobicon_user"); setUser(null); }}
                  className="text-sm text-white/50 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-white/50 hover:text-white transition-colors px-3 py-2">Sign in</Link>
                <Link href="/auth/signup" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="py-20 lg:py-28 text-center">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/20 bg-brand-500/5 text-brand-400 text-sm font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Simple, transparent pricing
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                Ready to<br /><span className="gradient-text">Dominate?</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg text-white/40 max-w-xl mx-auto">
                Start free. Scale when you&apos;re ready. No credit card required for Starter or the 14-day Pro trial.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-20 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer} className="grid md:grid-cols-3 gap-6">
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
                    <div className={`text-sm font-semibold mb-2 ${plan.featured ? "text-brand-400" : "text-white/50"}`}>{plan.name}</div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-black">{plan.price}</span>
                      {plan.period && <span className="text-white/30 text-sm">{plan.period}</span>}
                    </div>
                    <p className="text-xs text-white/30 leading-relaxed">{plan.desc}</p>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.featured ? "text-brand-400" : "text-white/30"}`} />
                        <span className="text-sm text-white/50">{f}</span>
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
                  ) : plan.featured ? (
                    <button
                      onClick={handleProCheckout}
                      disabled={checkoutLoading}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold btn-gradient text-white shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
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
        <section className="py-20 border-t border-white/[0.04] px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-3xl font-black text-center mb-2">What&apos;s included</motion.h2>
              <motion.p variants={fadeInUp} className="text-white/30 text-center mb-10">All 8 AI products, broken down by plan.</motion.p>

              <motion.div variants={fadeInUp} className="gradient-border rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-4 gap-0 border-b border-white/[0.06]">
                  <div className="px-6 py-4 text-xs font-semibold text-white/30 uppercase tracking-wider">Product</div>
                  <div className="px-6 py-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-center">Starter</div>
                  <div className="px-6 py-4 text-xs font-semibold text-brand-400 uppercase tracking-wider text-center bg-brand-500/[0.03]">Pro</div>
                  <div className="px-6 py-4 text-xs font-semibold text-white/30 uppercase tracking-wider text-center">Enterprise</div>
                </div>

                {PRODUCTS.map((p, i) => (
                  <div key={p.name} className={`grid grid-cols-4 gap-0 border-b border-white/[0.03] ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                    <div className="px-6 py-4 flex items-center gap-3">
                      <p.icon className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <span className="text-sm text-white/60">{p.name}</span>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-center">
                      {typeof p.starter === "string" ? (
                        <span className="text-xs text-white/40">{p.starter}</span>
                      ) : p.starter ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="w-4 h-px bg-white/10 block" />
                      )}
                    </div>
                    <div className="px-6 py-4 flex items-center justify-center bg-brand-500/[0.02]">
                      {typeof p.pro === "string" ? (
                        <span className="text-xs text-brand-400">{p.pro}</span>
                      ) : p.pro ? (
                        <Check className="w-4 h-4 text-brand-400" />
                      ) : (
                        <span className="w-4 h-px bg-white/10 block" />
                      )}
                    </div>
                    <div className="px-6 py-4 flex items-center justify-center">
                      <Check className="w-4 h-4 text-accent-cyan" />
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* For Agencies */}
        <section className="py-20 border-t border-white/[0.04] px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="gradient-border rounded-2xl p-10 md:p-16 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-accent-cyan" />
                    <span className="text-sm font-semibold text-accent-cyan">For Agencies</span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight mb-3">Scale your agency with Zoobicon</h2>
                  <p className="text-white/40 leading-relaxed">
                    White-label the entire platform. Manage all your clients from one dashboard.
                    Bulk-generate websites. Custom pricing on request.
                  </p>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <Link href="/agencies" className="btn-gradient px-8 py-4 rounded-xl text-sm font-bold text-white flex items-center gap-2">
                    View Agency Plans <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href="mailto:sales@zoobicon.com?subject=Agency Demo Request" className="px-8 py-4 rounded-xl text-sm font-semibold text-white/50 border border-white/[0.08] hover:border-white/20 transition-all text-center flex items-center gap-2 justify-center">
                    <Users className="w-4 h-4" /> Book a Demo
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 border-t border-white/[0.04] px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="flex items-center gap-2 justify-center mb-2">
                <HelpCircle className="w-5 h-5 text-white/30" />
                <h2 className="text-3xl font-black">FAQ</h2>
              </motion.div>
              <motion.p variants={fadeInUp} className="text-white/30 text-center mb-12">Everything you need to know.</motion.p>

              <motion.div variants={staggerContainer} className="space-y-4">
                {FAQS.map((faq) => (
                  <motion.div key={faq.q} variants={fadeInUp} className="gradient-border rounded-xl p-6">
                    <h3 className="text-sm font-bold mb-2">{faq.q}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{faq.a}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-24 text-center border-t border-white/[0.04] px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={staggerContainer}>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-black tracking-tight mb-6">
              Start free today.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/40 mb-8">No credit card required. Cancel anytime.</motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/builder" className="group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center gap-2 shadow-glow">
                <span>Try the Builder</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/auth/signup" className="px-8 py-4 rounded-2xl text-base font-semibold text-white/50 border border-white/[0.08] hover:border-white/20 transition-all">
                Create Free Account
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
