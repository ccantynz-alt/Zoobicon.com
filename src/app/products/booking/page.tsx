"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Minus,
  ChevronDown,
  Calendar,
  Brain,
  Bell,
  Scissors,
  Stethoscope,
  Dumbbell,
  UtensilsCrossed,
  Wrench,
  Briefcase,
  MessageSquare,
  Phone,
  CreditCard,
  Palette,
  BadgeCheck,
} from "lucide-react";

const CARD_BG = "linear-gradient(135deg, rgba(20,40,95,0.85) 0%, rgba(10,10,15,0.7) 100%)";
const PRIMARY_CTA = {
  background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
  color: "#0a1628",
  boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
} as const;
const SERIF: React.CSSProperties = {
  fontFamily: "Fraunces, ui-serif, Georgia, serif",
  fontStyle: "italic",
  fontWeight: 400,
  color: "#E8D4B0",
};

const STATS = [
  { value: "Free", label: "Starter plan" },
  { value: "AI", label: "Smart scheduling" },
  { value: "24/7", label: "Online booking" },
  { value: "75%", label: "No-show reduction" },
];

const FEATURES = [
  { icon: Brain, title: "AI Smart Scheduling", desc: "AI fills gaps in your calendar by suggesting optimal times. Predicts no-shows before they happen. Your calendar works smarter, not harder." },
  { icon: MessageSquare, title: "AI Chat Booking", desc: "Customers book via natural conversation. 'I need a haircut Tuesday afternoon' → booked. No forms, no clicking through calendars." },
  { icon: Phone, title: "AI Voice Receptionist", desc: "An AI answers your phone 24/7, books appointments, answers FAQs, and only forwards calls that need a human. Never miss a booking." },
  { icon: Bell, title: "SMS & Email Reminders", desc: "Automatic reminders at 24hr and 1hr before. Reduces no-shows by up to 75%. Customers can reschedule with one tap." },
  { icon: CreditCard, title: "Deposits & Payments", desc: "Take deposits at booking time. Charge for no-shows. Accept full payment upfront. Integrated with Stripe — no extra fees." },
  { icon: Palette, title: "White-Label Ready", desc: "Your brand, your domain, your colours. Agencies can resell to their clients. No 'Powered by' watermarks on Business plan." },
];

const INDUSTRIES = [
  { icon: Scissors, name: "Hair & Beauty", examples: "Salons, barbers, nail bars, spas, makeup artists" },
  { icon: Stethoscope, name: "Health & Medical", examples: "Dentists, physios, chiropractors, therapists, optometrists" },
  { icon: Dumbbell, name: "Fitness", examples: "Personal trainers, yoga studios, gyms, pilates, martial arts" },
  { icon: UtensilsCrossed, name: "Restaurants", examples: "Table reservations, private dining, tasting menus, food trucks" },
  { icon: Wrench, name: "Trades & Services", examples: "Plumbers, electricians, mechanics, cleaners, dog groomers" },
  { icon: Briefcase, name: "Professional", examples: "Lawyers, accountants, consultants, tutors, coaches, real estate" },
];

const COMPETITORS = [
  { name: "Free plan", zoobicon: "1 staff", calendly: "1 type only", acuity: "7-day trial", simplybook: "50 bookings", fresha: "Yes (salon only)" },
  { name: "AI smart scheduling", zoobicon: true, calendly: false, acuity: false, simplybook: false, fresha: false },
  { name: "AI chat booking", zoobicon: true, calendly: false, acuity: false, simplybook: false, fresha: false },
  { name: "AI voice receptionist", zoobicon: true, calendly: false, acuity: false, simplybook: false, fresha: false },
  { name: "No-show prediction", zoobicon: true, calendly: false, acuity: false, simplybook: false, fresha: false },
  { name: "SMS reminders", zoobicon: "Pro ($6.99)", calendly: "$16/user", acuity: "$16/mo", simplybook: "$9.90/mo", fresha: "Free" },
  { name: "Deposits & payments", zoobicon: true, calendly: "Paid only", acuity: true, simplybook: true, fresha: true },
  { name: "Group bookings", zoobicon: true, calendly: "Paid only", acuity: true, simplybook: true, fresha: true },
  { name: "White-label", zoobicon: "$14.99/mo", calendly: "Enterprise only", acuity: false, simplybook: "$59.90/mo", fresha: false },
  { name: "Multi-industry", zoobicon: true, calendly: true, acuity: true, simplybook: true, fresha: "Salon only" },
  { name: "Bundled website builder", zoobicon: true, calendly: false, acuity: false, simplybook: false, fresha: false },
  { name: "Bundled eSIM + VPN", zoobicon: true, calendly: false, acuity: false, simplybook: false, fresha: false },
  { name: "API access", zoobicon: "Pro+", calendly: "Pro ($20)", acuity: "Powerhouse", simplybook: "Premium", fresha: false },
  { name: "Pro plan price", zoobicon: "$6.99/mo", calendly: "$16/user/mo", acuity: "$16/mo", simplybook: "$9.90/mo", fresha: "Free (salon)" },
];

const PLANS = [
  { name: "Starter", price: "Free", period: "", desc: "Solo professionals and freelancers", features: ["1 staff member", "Unlimited bookings", "Email confirmations", "Google & Outlook sync", "Booking page", "Basic analytics"], featured: false },
  { name: "Pro", price: "$6.99", period: "/month", desc: "Growing businesses with a small team", features: ["3 staff members", "AI smart scheduling", "SMS reminders", "No-show prediction", "Deposits & payments", "Custom branding", "Group bookings", "Recurring appointments", "API access"], featured: true },
  { name: "Business", price: "$14.99", period: "/month", desc: "Multi-location and agencies", features: ["Unlimited staff", "Everything in Pro", "White-label (your brand)", "AI voice receptionist", "AI chat booking", "Multi-location", "Webhook integrations", "Priority support"], featured: false },
];

const FAQS = [
  { q: "How does AI scheduling work?", a: "Our AI analyses your booking patterns to identify gaps and suggest optimal appointment times. When a customer asks to book, the AI recommends times that fill your quiet periods first, maximising your revenue per day. It also predicts which customers are likely to no-show based on booking history and sends extra reminders." },
  { q: "What is the AI voice receptionist?", a: "It's an AI that answers your business phone 24/7. When a customer calls, the AI greets them by name (if they're in your system), answers common questions about your services and pricing, and books appointments directly into your calendar. It only forwards calls to you when a human is genuinely needed. Available on the Business plan." },
  { q: "Can I use this for any type of business?", a: "Yes. Whether you're a hairdresser, dentist, personal trainer, restaurant, plumber, lawyer, or any service business that takes appointments — it works. The system adapts to your specific services, durations, staff, and booking rules." },
  { q: "How does white-label work?", a: "On the Business plan, you get a fully branded booking experience — your logo, your colours, your domain. No 'Powered by Zoobicon' anywhere. Perfect for agencies who want to offer booking to their clients under their own brand." },
  { q: "Is there really a free plan?", a: "Yes. The Starter plan is genuinely free — 1 staff member, unlimited bookings, email confirmations, calendar sync. No credit card required, no time limit. We make money when you upgrade for AI features, SMS, or more staff. Most solo professionals stay on free and that's fine with us." },
];

export default function BookingProductPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zoobicon Booking & Scheduling",
    description: "AI-powered booking and scheduling for every business. Smart scheduling, voice receptionist, no-show prediction, white-label. Free plan available.",
    url: "https://zoobicon.com/products/booking",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    keywords: "booking software, scheduling software, AI booking, appointment scheduling, online booking system, white label booking",
    offers: { "@type": "AggregateOffer", lowPrice: "0", highPrice: "14.99", priceCurrency: "USD" },
    brand: { "@type": "Brand", name: "Zoobicon" },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zoobicon.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://zoobicon.com/products" },
      { "@type": "ListItem", position: 3, name: "Booking", item: "https://zoobicon.com/products/booking" },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const Cell = ({ val }: { val: unknown }) => {
    if (val === true) return <Check className="w-4 h-4 mx-auto" style={{ color: "#E8D4B0" }} />;
    if (val === false) return <Minus className="w-4 h-4 mx-auto text-white/25" />;
    return <span className="text-[13px] text-white/65">{String(val)}</span>;
  };

  return (
    <div className="min-h-screen bg-[#0b1530] text-white fs-grain pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Hero */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[720px] w-[1200px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.09), transparent 70%)" }} />
          <div className="absolute right-[-10%] top-[30%] h-[420px] w-[520px] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(224,139,176,0.07), transparent 70%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-8">
            <BadgeCheck className="w-3 h-3" />
            AI-Powered Booking · Free plan · 24/7 voice receptionist
          </div>

          <h1 className="fs-display-xl mb-6">
            Your calendar,{" "}
            <span style={SERIF}>fully booked.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            AI scheduling that fills every gap. Voice receptionist that books while you sleep.
            No-show prediction that saves your revenue. Free to start.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["Smart scheduling", "Voice receptionist", "Chat booking", "SMS reminders", "Deposits", "White-label"].map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/60"
              >
                <Check className="w-3 h-3" style={{ color: "#E8D4B0" }} />
                {pill}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              Start free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Calendar className="w-4 h-4" />
              View plans
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-2" style={{ color: "#E8D4B0" }}>
                  {stat.value}
                </div>
                <div className="text-[13px] text-white/55">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Features
            </div>
            <h2 className="fs-display-lg mb-4">
              Not just booking.{" "}
              <span style={SERIF}>AI booking.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Every competitor offers a calendar. We offer an AI that fills it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <f.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{f.title}</h3>
                  <p className="text-[13px] text-white/55 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Industries
            </div>
            <h2 className="fs-display-lg mb-4">
              Built for every business{" "}
              <span style={SERIF}>that takes appointments.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              From solo barbers to multi-location clinics, the system adapts to your services, staff, and booking rules.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {INDUSTRIES.map((ind) => (
              <div
                key={ind.name}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <ind.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{ind.name}</h3>
                  <p className="text-[13px] text-white/55 leading-relaxed">{ind.examples}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Industry comparison
            </div>
            <h2 className="fs-display-lg mb-4">
              How Zoobicon Booking{" "}
              <span style={SERIF}>compares.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              We&apos;re the only booking platform with real AI at an SMB price point.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-white/[0.08]" style={{ background: CARD_BG }}>
            <div className="min-w-[820px]">
              <div className="grid grid-cols-6 px-6 py-4 border-b border-white/[0.08] text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55">
                <div>Feature</div>
                <div className="text-center" style={{ color: "#E8D4B0" }}>Zoobicon</div>
                <div className="text-center">Calendly</div>
                <div className="text-center">Acuity</div>
                <div className="text-center">SimplyBook</div>
                <div className="text-center">Fresha</div>
              </div>
              {COMPETITORS.map((row, i) => (
                <div
                  key={row.name}
                  className={`grid grid-cols-6 px-6 py-4 text-[13px] items-center ${
                    i !== COMPETITORS.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <div className="text-white/75 font-medium">{row.name}</div>
                  <div className="text-center"><Cell val={row.zoobicon} /></div>
                  <div className="text-center"><Cell val={row.calendly} /></div>
                  <div className="text-center"><Cell val={row.acuity} /></div>
                  <div className="text-center"><Cell val={row.simplybook} /></div>
                  <div className="text-center"><Cell val={row.fresha} /></div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-white/30 mt-4 text-center">
            Comparison based on publicly available information as of March 2026. Features and pricing may change.
            All trademarks belong to their respective owners. See our{" "}
            <Link href="/disclaimers" className="underline hover:text-white/55">disclaimers</Link>.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Pricing
            </div>
            <h2 className="fs-display-lg mb-4">
              Start free. Upgrade{" "}
              <span style={SERIF}>when you need AI.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              No credit card required. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-[24px] p-7 transition-all duration-500 hover:-translate-y-1 ${
                  p.featured ? "border-2 border-[#E8D4B0]/35" : "border border-white/[0.08] hover:border-[#E8D4B0]/25"
                }`}
                style={{
                  background: p.featured
                    ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(20,40,95,0.85) 100%)"
                    : CARD_BG,
                }}
              >
                {p.featured && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)", color: "#0a1628" }}
                  >
                    Most popular
                  </div>
                )}
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>{p.price}</span>
                  {p.period && <span className="text-[13px] text-white/50">{p.period}</span>}
                </div>
                <p className="text-[13px] text-white/55 mb-6">{p.desc}</p>
                <ul className="space-y-2.5 mb-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/65">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#E8D4B0" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center rounded-full py-3 text-[13px] font-semibold transition-all ${
                    p.featured ? "" : "border border-white/[0.12] bg-white/[0.03] text-white/80 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                  }`}
                  style={p.featured ? PRIMARY_CTA : undefined}
                >
                  {p.price === "Free" ? "Start Free" : "Start Free Trial"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              FAQ
            </div>
            <h2 className="fs-display-lg mb-4">
              Frequently asked{" "}
              <span style={SERIF}>questions.</span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div
                key={i}
                className="rounded-[20px] border border-white/[0.08] overflow-hidden transition-all duration-500 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-[15px] font-medium pr-4 text-white/85">{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    style={{ color: "#E8D4B0" }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[14px] text-white/60 leading-relaxed">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.11), transparent 70%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
            <Calendar className="h-6 w-6 text-[#E8D4B0]" />
          </div>
          <h2 className="fs-display-lg mb-5">
            Stop losing bookings.{" "}
            <span style={SERIF}>Start today.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            Free forever for solo professionals. AI features from $6.99/mo. No credit card required.
          </p>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={PRIMARY_CTA}
          >
            Start free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Cancel anytime</span>
          </div>
        </div>
      </section>
    </div>
  );
}
