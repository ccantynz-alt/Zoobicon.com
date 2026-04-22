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
    a: "Every plan uses Claude Opus 4.7 for the core developer agent, the most powerful AI model available. We also use Claude Haiku for planning and Sonnet for enhancements. Same quality across all tiers.",
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
    <div className="relative min-h-screen bg-[#0b1530] text-white selection:bg-[#E8D4B0]/30 overflow-hidden fs-grain pt-[72px]">
      {/* ── structured data ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── ambient cinematic background ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute top-[-30%] left-1/2 h-[900px] w-[1200px] -translate-x-1/2 rounded-full blur-[180px]"
          style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.09), transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[800px] rounded-full blur-[160px]"
          style={{ background: "radial-gradient(closest-side, rgba(224,139,176,0.05), transparent 70%)" }}
        />
      </div>

      <main className="relative z-10">
        {/* ━━━━━━━━━━ HERO ━━━━━━━━━━ */}
        <section className="pt-24 pb-20 text-center px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto"
          >
            <motion.div
              custom={0}
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-8"
            >
              <Star className="h-3 w-3" />
              Simple, transparent pricing
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="fs-display-xl text-white"
            >
              Build smarter.{" "}
              <span
                className="font-normal"
                style={{
                  fontFamily: "Fraunces, ui-serif, Georgia, serif",
                  fontStyle: "italic",
                  color: "#E8D4B0",
                }}
              >
                Pay&nbsp;less.
              </span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              className="mt-8 text-[17px] sm:text-lg text-white/55 max-w-2xl mx-auto leading-relaxed"
            >
              One platform for AI websites, domains, hosting, email, and video.
              Start with a 14-day free trial. No credit card required.
            </motion.p>

            {/* ── billing toggle ── */}
            <motion.div custom={3} variants={fadeUp} className="mt-12 flex items-center justify-center gap-4">
              <span className={`text-sm font-medium transition-colors ${!annual ? "text-white" : "text-white/35"}`}>
                Monthly
              </span>
              <button
                onClick={() => setAnnual(!annual)}
                className="relative h-7 w-14 rounded-full border border-white/[0.1] bg-white/[0.04] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8D4B0]"
                aria-label="Toggle annual billing"
              >
                <motion.div
                  className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #E8D4B0 0%, #F7C8A0 60%, #E08BB0 100%)",
                    boxShadow: "0 6px 14px -4px rgba(232,212,176,0.55)",
                  }}
                  animate={{ x: annual ? 28 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <span className={`text-sm font-medium transition-colors ${annual ? "text-white" : "text-white/35"}`}>
                Annual
              </span>
              <AnimatePresence>
                {annual && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8, x: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -8 }}
                    className="rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/10 px-2.5 py-1 text-[11px] font-bold text-[#E8D4B0]"
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
                    className="relative group"
                  >
                    {/* animated glow ring on featured card */}
                    {plan.featured && (
                      <div
                        className="absolute -inset-2 rounded-[32px] opacity-70 blur-2xl -z-10"
                        style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.25), transparent 70%)" }}
                      />
                    )}

                    <div
                      className="relative h-full rounded-[28px] border p-8 flex flex-col backdrop-blur-xl transition-all duration-500 hover:-translate-y-1"
                      style={{
                        borderColor: plan.featured ? "rgba(232,212,176,0.35)" : "rgba(255,255,255,0.08)",
                        background: plan.featured
                          ? "linear-gradient(180deg, rgba(232,212,176,0.07) 0%, rgba(20,40,95,0.85) 60%)"
                          : "linear-gradient(180deg, rgba(20,40,95,0.6) 0%, rgba(10,10,15,0.4) 100%)",
                        boxShadow: plan.featured
                          ? "0 1px 0 rgba(232,212,176,0.15) inset, 0 32px 80px -32px rgba(232,212,176,0.45)"
                          : "0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 50px -30px rgba(0,0,0,0.6)",
                      }}
                    >
                      {/* popular badge */}
                      {plan.featured && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                          <span
                            className="whitespace-nowrap rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                            style={{
                              background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                              color: "#0a1628",
                              boxShadow: "0 10px 24px -10px rgba(232,212,176,0.55)",
                            }}
                          >
                            Most popular
                          </span>
                        </div>
                      )}

                      {/* icon + name */}
                      <div className="flex items-center gap-3 mb-5 mt-1">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{
                            background: plan.featured
                              ? "linear-gradient(135deg, rgba(232,212,176,0.15), rgba(224,139,176,0.08))"
                              : "rgba(255,255,255,0.04)",
                            color: plan.featured ? "#E8D4B0" : "rgba(255,255,255,0.55)",
                            border: plan.featured ? "1px solid rgba(232,212,176,0.25)" : "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-[18px] font-semibold text-white tracking-[-0.01em]">{plan.name}</h3>
                      </div>

                      {/* price */}
                      <div className="mb-5">
                        {isCustom ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-semibold tracking-[-0.03em] text-white">Custom</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-semibold tracking-[-0.03em] text-white">
                              ${price}
                            </span>
                            <span className="text-sm text-white/40 font-medium">/mo</span>
                          </div>
                        )}
                        {annual && !isCustom && (
                          <p className="mt-1.5 text-[11px] text-white/45">
                            ${price * 12}/yr &middot;{" "}
                            <span className="text-[#E8D4B0]">
                              save ${(plan.monthly - plan.annual) * 12}/yr
                            </span>
                          </p>
                        )}
                      </div>

                      {/* description */}
                      <p className="mb-7 text-[13px] text-white/55 leading-relaxed">
                        {plan.description}
                      </p>

                      {/* features */}
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-3">
                            <div
                              className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full mt-0.5"
                              style={{
                                background: plan.featured ? "rgba(232,212,176,0.15)" : "rgba(255,255,255,0.05)",
                                color: plan.featured ? "#E8D4B0" : "rgba(255,255,255,0.4)",
                              }}
                            >
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                            </div>
                            <span className="text-[13px] text-white/70 leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      {plan.id === "enterprise" ? (
                        <a
                          href="mailto:sales@zoobicon.com?subject=Enterprise%20Inquiry"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] py-3.5 text-[13px] font-semibold text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                        >
                          {plan.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <Link
                          href="/auth/signup"
                          className="group/btn inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[13px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
                          style={plan.featured ? {
                            background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                            color: "#0a1628",
                            boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                          } : {
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.85)",
                          }}
                        >
                          {plan.cta}
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
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
              className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-[13px] text-white/45"
            >
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#E8D4B0]" />
                No credit card required
              </span>
              <span className="h-1 w-1 rounded-full bg-white/15 hidden sm:inline-flex" />
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#E8D4B0]" />
                14-day free trial on all paid plans
              </span>
              <span className="h-1 w-1 rounded-full bg-white/15 hidden sm:inline-flex" />
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#E8D4B0]" />
                Cancel anytime
              </span>
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FAQ ━━━━━━━━━━ */}
        <section className="pb-32 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
                  <Star className="h-3 w-3" />
                  Questions
                </div>
                <motion.h2
                  custom={0}
                  variants={fadeUp}
                  className="fs-display-md text-white"
                >
                  Frequently{" "}
                  <span
                    className="font-normal"
                    style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif", fontStyle: "italic", color: "#E8D4B0" }}
                  >
                    asked.
                  </span>
                </motion.h2>
                <motion.p
                  custom={1}
                  variants={fadeUp}
                  className="mt-5 text-[15px] text-white/55 max-w-lg mx-auto"
                >
                  Everything you need to know about our plans.
                </motion.p>
              </div>

              <div className="space-y-3">
                {FAQS.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <motion.div
                      key={i}
                      custom={i + 2}
                      variants={fadeUp}
                      className="rounded-[20px] border backdrop-blur-xl transition-all duration-500"
                      style={{
                        borderColor: isOpen ? "rgba(232,212,176,0.25)" : "rgba(255,255,255,0.08)",
                        background: isOpen
                          ? "linear-gradient(135deg, rgba(232,212,176,0.05) 0%, rgba(20,40,95,0.6) 100%)"
                          : "linear-gradient(135deg, rgba(20,40,95,0.6) 0%, rgba(10,10,15,0.4) 100%)",
                        boxShadow: isOpen
                          ? "0 1px 0 rgba(232,212,176,0.12) inset, 0 20px 50px -28px rgba(232,212,176,0.3)"
                          : "0 1px 0 rgba(255,255,255,0.03) inset",
                      }}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="w-full flex items-center justify-between gap-4 px-7 py-5 text-left"
                        aria-expanded={isOpen}
                      >
                        <span className={`text-[15px] font-semibold transition-colors ${isOpen ? "text-[#E8D4B0]" : "text-white"}`}>{faq.q}</span>
                        <motion.span
                          animate={{ rotate: isOpen ? 45 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.1] text-white/40"
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
                            <p className="px-7 pb-6 text-[14px] text-white/60 leading-relaxed">
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
            className="max-w-4xl mx-auto"
          >
            <div
              className="relative overflow-hidden rounded-[40px] border border-white/[0.08] p-12 sm:p-16 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(20,40,95,0.85) 0%, rgba(26,26,36,0.65) 100%)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset, 0 40px 100px -40px rgba(0,0,0,0.8)",
              }}
            >
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
                style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.18), transparent 70%)" }}
              />
              <div className="relative">
                <h2 className="fs-display-md text-white">
                  Build something{" "}
                  <span
                    className="font-normal"
                    style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif", fontStyle: "italic", color: "#E8D4B0" }}
                  >
                    extraordinary.
                  </span>
                </h2>
                <p className="mt-6 text-[16px] text-white/55 max-w-md mx-auto leading-relaxed">
                  Join thousands of creators and agencies building with Zoobicon.
                  Start your free trial today.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/builder"
                    className="group inline-flex items-center gap-2 rounded-full px-7 py-4 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                      color: "#0a1628",
                      boxShadow: "0 18px 48px -18px rgba(232,212,176,0.55)",
                    }}
                  >
                    Try the builder free
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-4 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                  >
                    Create free account
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
