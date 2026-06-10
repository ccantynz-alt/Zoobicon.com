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
    cta: "Get started",
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
      "Deep agentic builds",
      "3 custom domains included",
      "10 email mailboxes",
      "SEO monitor & optimizer",
      "AI auto-reply on emails",
      "Priority generation queue",
      "GitHub & React export",
      "Email support (24h SLA)",
    ],
    cta: "Start Pro trial",
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
    cta: "Start Agency trial",
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
    cta: "Contact sales",
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
    a: "Claude Sonnet 4.6 powers every component build and edit — the same model on every tier. Deep agentic builds run Claude Opus for the developer phase. Same quality whether you pay $49 or $299.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. If you're not satisfied within the first 14 days of a paid plan, we'll refund you in full. No questions asked.",
  },
];

/**
 * Pricing — ZOOBICON BOLD (Rule 37).
 * Bright warm canvas, bold Jakarta display, lime marker accents,
 * near-black featured card. The footer supplies the closing dark CTA.
 */
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
    <div className="zb-bright relative min-h-screen pt-[72px]">
      {/* ── structured data ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <main className="relative">
        {/* ━━━━━━━━━━ HERO ━━━━━━━━━━ */}
        <section className="px-6 pt-24 pb-16 text-center">
          <motion.div initial="hidden" animate="visible" className="mx-auto max-w-4xl">
            <motion.div
              custom={0}
              variants={fadeUp}
              className="zb-eyebrow mb-7 justify-center"
              style={{ color: "var(--zb-ink-2)" }}
            >
              <Star className="h-3.5 w-3.5" style={{ color: "var(--zb-accent)" }} />
              Simple, transparent pricing
            </motion.div>

            <motion.h1 custom={1} variants={fadeUp} className="zb-display text-5xl sm:text-7xl">
              One subscription.{" "}
              <span className="zb-mark">Everything</span> included.
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              className="mx-auto mt-8 max-w-2xl text-[17px] leading-relaxed"
              style={{ color: "var(--zb-ink-2)" }}
            >
              The AI Website Builder with hosting and a custom domain provisioned
              in the same deploy step. Start with a 14-day free trial.
              No credit card required.
            </motion.p>

            {/* ── billing toggle ── */}
            <motion.div custom={3} variants={fadeUp} className="mt-12 flex items-center justify-center gap-4">
              <span
                className="text-sm font-bold transition-colors"
                style={{ color: !annual ? "var(--zb-ink)" : "var(--zb-muted)" }}
              >
                Monthly
              </span>
              <button
                onClick={() => setAnnual(!annual)}
                className="relative h-8 w-[60px] rounded-full transition-colors focus:outline-none focus-visible:ring-2"
                style={{ background: annual ? "var(--zb-ink)" : "#d9d4c6" }}
                aria-label="Toggle annual billing"
              >
                <motion.div
                  className="absolute left-1 top-1 h-6 w-6 rounded-full"
                  style={{ background: "var(--zb-accent)" }}
                  animate={{ x: annual ? 26 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <span
                className="text-sm font-bold transition-colors"
                style={{ color: annual ? "var(--zb-ink)" : "var(--zb-muted)" }}
              >
                Annual
              </span>
              <AnimatePresence>
                {annual && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8, x: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -8 }}
                    className="rounded-full px-3 py-1 text-[11px] font-extrabold"
                    style={{ background: "var(--zb-accent)", color: "var(--zb-accent-ink)" }}
                  >
                    Save up to 23%
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </section>

        {/* ━━━━━━━━━━ PRICING CARDS ━━━━━━━━━━ */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {PLANS.map((plan, index) => {
                const price = annual ? plan.annual : plan.monthly;
                const isCustom = price === 0;
                const Icon = plan.icon;
                const dark = plan.featured;

                return (
                  <motion.div
                    key={plan.id}
                    custom={index}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={fadeUp}
                    className="relative"
                  >
                    <div className={`${dark ? "zb-card-dark" : "zb-card"} relative flex h-full flex-col p-8`}>
                      {/* popular badge */}
                      {dark && (
                        <span
                          className="absolute -top-3 left-8 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em]"
                          style={{ background: "var(--zb-accent)", color: "var(--zb-accent-ink)" }}
                        >
                          Most popular
                        </span>
                      )}

                      {/* icon + name */}
                      <div className="mb-6 flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                          style={
                            dark
                              ? { background: "var(--zb-accent)" }
                              : { background: "var(--zb-ink)" }
                          }
                        >
                          <Icon
                            className="h-4 w-4"
                            style={{ color: dark ? "var(--zb-accent-ink)" : "var(--zb-accent)" }}
                            strokeWidth={2.2}
                          />
                        </div>
                        <h3
                          className="text-[18px] font-bold tracking-[-0.01em]"
                          style={{ color: dark ? "#ffffff" : "var(--zb-ink)" }}
                        >
                          {plan.name}
                        </h3>
                      </div>

                      {/* price */}
                      <div className="mb-5">
                        <div className="flex items-baseline gap-1">
                          <span
                            className="text-5xl font-extrabold tracking-[-0.03em]"
                            style={{ color: dark ? "#ffffff" : "var(--zb-ink)" }}
                          >
                            {isCustom ? "Custom" : `$${price}`}
                          </span>
                          {!isCustom && (
                            <span
                              className="text-sm font-medium"
                              style={{ color: dark ? "rgba(255,255,255,0.45)" : "var(--zb-muted)" }}
                            >
                              /mo
                            </span>
                          )}
                        </div>
                        {annual && !isCustom && (
                          <p
                            className="mt-1.5 text-[11.5px]"
                            style={{ color: dark ? "rgba(255,255,255,0.5)" : "var(--zb-muted)" }}
                          >
                            ${price * 12}/yr ·{" "}
                            <span
                              className="font-bold"
                              style={{ color: dark ? "var(--zb-accent)" : "var(--zb-ink)" }}
                            >
                              save ${(plan.monthly - plan.annual) * 12}/yr
                            </span>
                          </p>
                        )}
                      </div>

                      {/* description */}
                      <p
                        className="mb-7 text-[13px] leading-relaxed"
                        style={{ color: dark ? "rgba(255,255,255,0.6)" : "var(--zb-ink-2)" }}
                      >
                        {plan.description}
                      </p>

                      {/* features */}
                      <ul className="mb-8 flex-1 space-y-2.5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2.5">
                            <Check
                              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
                              style={{ color: dark ? "var(--zb-accent)" : "var(--zb-ink)" }}
                              strokeWidth={2.5}
                            />
                            <span
                              className="text-[13px] leading-relaxed"
                              style={{ color: dark ? "rgba(255,255,255,0.78)" : "var(--zb-ink-2)" }}
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      {plan.id === "enterprise" ? (
                        <a
                          href="mailto:sales@zoobicon.com?subject=Enterprise%20Inquiry"
                          className="zb-btn-ink w-full"
                        >
                          {plan.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </a>
                      ) : dark ? (
                        <Link href="/builder" className="zb-btn w-full">
                          {plan.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <Link href="/builder" className="zb-btn-ink w-full">
                          {plan.cta}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━ TRUST STRIP ━━━━━━━━━━ */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center gap-5 text-[13.5px] font-semibold sm:flex-row sm:gap-10"
              style={{ color: "var(--zb-ink-2)" }}
            >
              {["No credit card required", "14-day free trial on paid plans", "Cancel anytime"].map((t) => (
                <span key={t} className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: "var(--zb-accent)" }}
                  >
                    <Check className="h-3 w-3" style={{ color: "var(--zb-accent-ink)" }} strokeWidth={3} />
                  </span>
                  {t}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ━━━━━━━━━━ FAQ (bright) ━━━━━━━━━━ */}
        <section
          className="zb-bright relative px-6 py-28"
          style={{ borderTop: "1px solid var(--zb-line)" }}
        >
          <div className="relative mx-auto max-w-3xl">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}>
              <div className="mb-14 text-center">
                <div className="zb-eyebrow mb-5 justify-center" style={{ color: "var(--zb-ink-2)" }}>
                  <Star className="h-3.5 w-3.5" style={{ color: "var(--gold-deep)" }} />
                  Questions
                </div>
                <motion.h2 custom={0} variants={fadeUp} className="zb-display text-4xl sm:text-6xl" style={{ color: "var(--zb-ink)" }}>
                  Frequently <span className="zb-mark">asked.</span>
                </motion.h2>
                <motion.p
                  custom={1}
                  variants={fadeUp}
                  className="mx-auto mt-5 max-w-lg text-[15px]"
                  style={{ color: "var(--zb-ink-2)" }}
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
                      className="rounded-[20px] transition-all duration-300"
                      style={{
                        border: isOpen
                          ? "1px solid var(--rule-strong)"
                          : "1px solid var(--zb-line)",
                        background: "var(--zb-surface)",
                        boxShadow: isOpen ? "0 16px 40px -24px rgba(11,11,13,0.18)" : "none",
                      }}
                    >
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="flex w-full items-center justify-between gap-4 px-7 py-5 text-left"
                        aria-expanded={isOpen}
                      >
                        <span
                          className="text-[15px] font-bold"
                          style={{ color: "var(--zb-ink)" }}
                        >
                          {faq.q}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 45 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
                          style={{
                            border: "1px solid var(--zb-line)",
                            color: "var(--zb-muted)",
                          }}
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
                            <p
                              className="px-7 pb-6 text-[14px] leading-relaxed"
                              style={{ color: "var(--zb-ink-2)" }}
                            >
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
      </main>
    </div>
  );
}
