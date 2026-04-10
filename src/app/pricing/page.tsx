"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Zap, Star, Crown, Building2, ArrowRight } from "lucide-react";

/* ─── animation presets ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

/* ─── tier data ─── */
const PLANS = [
  {
    id: "starter",
    name: "Starter",
    icon: Zap,
    monthly: 49,
    annual: 39,
    description: "Everything you need to launch your first AI-powered website.",
    features: [
      "1 AI-generated website",
      "AI website builder",
      "1 custom domain included",
      "3 email mailboxes",
      "SSL certificate",
      "Managed hosting",
      "Basic SEO tools",
      "Community support",
    ],
    cta: "Get Started",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Star,
    monthly: 129,
    annual: 99,
    description: "For creators and businesses ready to scale with the full AI toolkit.",
    features: [
      "3 AI-generated websites",
      "AI builder + video creator",
      "3 custom domains included",
      "10 email mailboxes",
      "SEO monitor & optimizer",
      "AI auto-reply on emails",
      "Priority generation queue",
      "GitHub & React export",
      "Email support (24h SLA)",
    ],
    cta: "Start Pro Trial",
    featured: true,
  },
  {
    id: "agency",
    name: "Agency",
    icon: Crown,
    monthly: 299,
    annual: 249,
    description: "White-label the platform. Build for clients at scale.",
    features: [
      "10 AI-generated websites",
      "Everything in Pro",
      "White-label branding",
      "Client management portal",
      "Priority support (4h SLA)",
      "API access (500K req/mo)",
      "Team seats (up to 10)",
      "Bulk generation tools",
    ],
    cta: "Start Agency Trial",
    featured: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    monthly: 0,
    annual: 0,
    description: "Unlimited everything with dedicated infrastructure and SLA.",
    features: [
      "Unlimited websites",
      "Everything in Agency",
      "Dedicated account manager",
      "Custom AI model training",
      "SSO / SAML authentication",
      "99.99% uptime SLA",
      "Custom integrations",
      "Invoiced billing (NET 30)",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes. Pro and Agency both come with a 14-day free trial. No credit card required to start. You can downgrade or cancel at any time from your dashboard.",
  },
  {
    q: "What happens when I hit my site limit?",
    a: "You can upgrade your plan at any time to unlock more sites. Existing sites are never affected when you downgrade, but you won't be able to create new ones beyond your plan's limit.",
  },
  {
    q: "Do I own the code?",
    a: "Yes, 100%. Every site you generate is yours. Export to GitHub, download as React/Next.js, deploy anywhere. No lock-in, ever.",
  },
  {
    q: "Can I cancel at any time?",
    a: "Absolutely. All plans are month-to-month (or annual). Cancel from your dashboard in one click. You keep access until the end of your billing period.",
  },
  {
    q: "What's included in white-label?",
    a: "Agency and Enterprise plans include full white-label capability. Your logo, your domain, your colors. Your clients never see Zoobicon. Perfect for agencies and resellers.",
  },
  {
    q: "How does annual billing work?",
    a: "Pay upfront for the year and save up to 23%. Annual plans include the same features as monthly. You can switch between monthly and annual at any time.",
  },
  {
    q: "What AI models power the builder?",
    a: "Every plan uses Claude Opus 4.6 for the core developer agent, the most powerful AI model available. We also use Claude Haiku for planning and Sonnet for enhancements. Same quality across all tiers.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're not satisfied within the first 14 days of a paid plan, we'll refund you in full. No questions asked.",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* ─── structured data ─── */
  const pricingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Zoobicon Plans",
    description: "AI Website Builder plans for individuals, creators, professionals, and agencies.",
    url: "https://zoobicon.com/pricing",
    brand: { "@type": "Brand", name: "Zoobicon" },
    offers: PLANS.filter((p) => p.monthly > 0).map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: String(annual ? p.annual : p.monthly),
      priceCurrency: "USD",
      billingIncrement: annual ? "P1Y" : "P1M",
      description: p.description,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-white selection:bg-stone-500/30 overflow-hidden">
      {/* ── structured data ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── ambient background ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-stone-600/[0.07] blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-stone-600/[0.05] blur-[140px]" />
      </div>

      <main className="relative z-10">
        {/* ━━━━━━━━━━ HERO ━━━━━━━━━━ */}
        <section className="pt-32 pb-16 text-center px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto"
          >
            <motion.div
              custom={0}
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-stone-500/20 bg-stone-500/[0.06] text-stone-300 text-sm font-medium mb-8"
            >
              <Star className="w-3.5 h-3.5" />
              Simple, transparent pricing
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
            >
              Build smarter.{" "}
              <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">
                Pay&nbsp;less.
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              className="text-lg text-zinc-400 max-w-xl mx-auto mb-12"
            >
              One platform for AI websites, domains, hosting, email, and video.
              Start with a 14-day free trial. No credit card required.
            </motion.p>

            {/* ── billing toggle ── */}
            <motion.div custom={3} variants={fadeUp} className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium transition-colors ${!annual ? "text-white" : "text-zinc-500"}`}>
                Monthly
              </span>
              <button
                onClick={() => setAnnual(!annual)}
                className="relative w-14 h-7 rounded-full bg-zinc-800 border border-zinc-700/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
                aria-label="Toggle annual billing"
              >
                <motion.div
                  className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-stone-500 to-stone-600 shadow-lg"
                  animate={{ x: annual ? 28 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${annual ? "text-white" : "text-zinc-500"}`}>
                Annual
              </span>
              <AnimatePresence>
                {annual && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8, x: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -8 }}
                    className="text-xs font-bold text-stone-400 bg-stone-400/10 border border-stone-400/20 px-2.5 py-1 rounded-full"
                  >
                    Save up to 23%
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </section>

        {/* ━━━━━━━━━━ PRICING CARDS ━━━━━━━━━━ */}
        <section className="pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
              {PLANS.map((plan, index) => {
                const price = annual ? plan.annual : plan.monthly;
                const isCustom = price === 0;
                const Icon = plan.icon;

                return (
                  <motion.div
                    key={plan.id}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={fadeUp}
                    className={`relative group rounded-2xl p-[1px] transition-transform duration-300 hover:-translate-y-1 ${
                      plan.featured
                        ? "bg-gradient-to-b from-stone-500/80 via-stone-500/40 to-stone-500/80 shadow-[0_0_40px_-8px_rgba(168,85,247,0.35)]"
                        : "bg-gradient-to-b from-white/[0.08] to-white/[0.02]"
                    }`}
                  >
                    {/* animated glow ring on featured card */}
                    {plan.featured && (
                      <div className="absolute -inset-[1px] rounded-2xl opacity-60 blur-sm bg-gradient-to-b from-stone-500/60 via-stone-500/20 to-stone-500/60 -z-10" />
                    )}

                    <div
                      className={`relative h-full rounded-[15px] p-7 flex flex-col backdrop-blur-xl ${
                        plan.featured
                          ? "bg-zinc-950/90"
                          : "bg-white/[0.03] hover:bg-white/[0.05]"
                      } transition-colors`}
                    >
                      {/* popular badge */}
                      {plan.featured && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                          <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-stone-600 to-stone-600 text-[11px] font-bold tracking-wide uppercase text-white shadow-lg shadow-stone-500/25 whitespace-nowrap">
                            Most Popular
                          </span>
                        </div>
                      )}

                      {/* icon + name */}
                      <div className="flex items-center gap-2.5 mb-4 mt-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            plan.featured
                              ? "bg-stone-500/15 text-stone-400"
                              : "bg-white/[0.06] text-zinc-400"
                          }`}
                        >
                          <Icon className="w-4.5 h-4.5" />
                        </div>
                        <h3 className="text-lg font-bold">{plan.name}</h3>
                      </div>

                      {/* price */}
                      <div className="mb-4">
                        {isCustom ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight">Custom</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold tracking-tight">
                              ${price}
                            </span>
                            <span className="text-sm text-zinc-500 font-medium">/mo</span>
                          </div>
                        )}
                        {annual && !isCustom && (
                          <p className="text-xs text-zinc-500 mt-1">
                            ${price * 12}/yr &middot;{" "}
                            <span className="text-stone-400">
                              save ${(plan.monthly - plan.annual) * 12}/yr
                            </span>
                          </p>
                        )}
                      </div>

                      {/* description */}
                      <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                        {plan.description}
                      </p>

                      {/* features */}
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5">
                            <div
                              className={`flex-shrink-0 w-4.5 h-4.5 rounded-full flex items-center justify-center mt-0.5 ${
                                plan.featured
                                  ? "bg-stone-500/15 text-stone-400"
                                  : "bg-white/[0.06] text-zinc-500"
                              }`}
                            >
                              <Check className="w-3 h-3" strokeWidth={2.5} />
                            </div>
                            <span className="text-sm text-zinc-300">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      {plan.id === "enterprise" ? (
                        <a
                          href="mailto:sales@zoobicon.com?subject=Enterprise%20Inquiry"
                          className="block w-full py-3.5 rounded-xl text-sm font-semibold text-center border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all"
                        >
                          {plan.cta}
                        </a>
                      ) : (
                        <Link
                          href="/auth/signup"
                          className={`group/btn flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                            plan.featured
                              ? "bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-white shadow-lg shadow-stone-500/20 hover:shadow-stone-500/30"
                              : "border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          {plan.cta}
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ SOCIAL PROOF STRIP ━━━━━━━━━━ */}
        <section className="pb-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-zinc-500"
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-stone-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-stone-400" />
                14-day free trial on all paid plans
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-stone-400" />
                Cancel anytime
              </span>
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FAQ ━━━━━━━━━━ */}
        <section className="pb-32 px-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <motion.h2
                custom={0}
                variants={fadeUp}
                className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-4"
              >
                Frequently asked questions
              </motion.h2>
              <motion.p
                custom={1}
                variants={fadeUp}
                className="text-zinc-400 text-center mb-12"
              >
                Everything you need to know about our plans.
              </motion.p>

              <div className="space-y-3">
                {FAQS.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <motion.div
                      key={i}
                      custom={i + 2}
                      variants={fadeUp}
                      className={`rounded-xl border transition-colors ${
                        isOpen
                          ? "border-stone-500/20 bg-stone-500/[0.03]"
                          : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                      }`}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                        aria-expanded={isOpen}
                      >
                        <span className="text-sm font-semibold text-zinc-200">{faq.q}</span>
                        <motion.span
                          animate={{ rotate: isOpen ? 45 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-shrink-0 w-5 h-5 rounded-full border border-white/[0.1] flex items-center justify-center text-zinc-500"
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="overflow-hidden"
                          >
                            <p className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━ BOTTOM CTA ━━━━━━━━━━ */}
        <section className="pb-32 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-stone-500/30 via-white/[0.06] to-white/[0.02] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-stone-600/[0.06] to-transparent pointer-events-none" />
              <div className="relative rounded-[15px] bg-zinc-950/80 backdrop-blur-xl py-16 px-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                  Ready to build something{" "}
                  <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
                    extraordinary
                  </span>
                  ?
                </h2>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                  Join thousands of creators and agencies building with Zoobicon.
                  Start your free trial today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/builder"
                    className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-sm font-bold text-white shadow-lg shadow-stone-500/20 hover:shadow-stone-500/30 transition-all"
                  >
                    Try the Builder Free
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold text-zinc-300 border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04] transition-all"
                  >
                    Create Free Account
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
