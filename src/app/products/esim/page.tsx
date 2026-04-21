"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Globe,
  ArrowRight,
  Check,
  Minus,
  ChevronDown,
  Smartphone,
  Wifi,
  Signal,
  Clock,
  CreditCard,
  QrCode,
  Sparkles,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";

const STATS = [
  { value: "190+", label: "Countries covered" },
  { value: "<1 min", label: "Activation time" },
  { value: "4G/5G", label: "Premium networks" },
  { value: "$4.99", label: "Plans from" },
];

const FEATURES = [
  { icon: QrCode, title: "Instant QR Activation", desc: "Scan a QR code with your phone camera. eSIM installs in seconds — no store visits, no waiting for delivery." },
  { icon: Smartphone, title: "Keep Your Number", desc: "Your existing number stays active for calls and texts. The eSIM runs as a second line for data only." },
  { icon: CreditCard, title: "Pay What You Use", desc: "Transparent per-GB pricing. No contracts, no hidden fees, no surprise roaming charges. Cancel anytime." },
  { icon: Signal, title: "Premium Networks", desc: "We connect to top-tier local carriers in every country. Fast, reliable 4G/5G — not throttled tourist networks." },
  { icon: Sparkles, title: "AI Plan Recommendations", desc: "Tell us where you're going and for how long. Our AI recommends the best value plan based on similar travelers." },
  { icon: Globe, title: "Deep Link Install", desc: "On iPhone (iOS 17.4+) and modern Android, skip QR scanning entirely. Tap a link and the eSIM installs directly." },
];

const REGIONS = [
  { name: "Pacific Islands", countries: "Fiji, Samoa, Tonga, Vanuatu, Cook Islands", emoji: "🌊" },
  { name: "Australia & NZ", countries: "Australia, New Zealand", emoji: "🦘" },
  { name: "Southeast Asia", countries: "Thailand, Vietnam, Indonesia, Philippines, Malaysia, Singapore", emoji: "🌏" },
  { name: "Europe", countries: "UK, France, Germany, Spain, Italy + 25 more", emoji: "🇪🇺" },
  { name: "North America", countries: "USA, Canada, Mexico", emoji: "🌎" },
  { name: "Global", countries: "190+ countries with one eSIM", emoji: "🌍" },
];

const COMPETITORS = [
  { name: "Countries", zoobicon: "190+", airalo: "200+", holafly: "170+", nomad: "100+", alosim: "130+" },
  { name: "Pacific Island Coverage", zoobicon: true, airalo: "Limited", holafly: false, nomad: false, alosim: false },
  { name: "Instant QR Activation", zoobicon: true, airalo: true, holafly: true, nomad: true, alosim: true },
  { name: "Deep Link Install", zoobicon: true, airalo: false, holafly: false, nomad: false, alosim: false },
  { name: "AI Plan Recommendations", zoobicon: true, airalo: false, holafly: false, nomad: false, alosim: false },
  { name: "Bundled VPN", zoobicon: true, airalo: false, holafly: false, nomad: false, alosim: false },
  { name: "Bundled Website Builder", zoobicon: true, airalo: false, holafly: false, nomad: false, alosim: false },
  { name: "Business/Team Plans", zoobicon: true, airalo: "Basic", holafly: false, nomad: false, alosim: false },
  { name: "Real-Time Usage Dashboard", zoobicon: true, airalo: true, holafly: false, nomad: true, alosim: false },
  { name: "1GB/7-day Price", zoobicon: "$4.99", airalo: "$4.50", holafly: "N/A", nomad: "$5.00", alosim: "$4.50" },
  { name: "5GB/30-day Price", zoobicon: "$14.99", airalo: "$16.00", holafly: "$19.00", nomad: "$18.00", alosim: "$15.00" },
];

const PLANS = [
  { name: "Travel Basic", data: "1 GB", validity: "7 days", price: "$4.99", desc: "Quick trip or backup data", featured: false },
  { name: "Travel Standard", data: "5 GB", validity: "30 days", price: "$14.99", desc: "Most popular for holidays", featured: true },
  { name: "Digital Nomad", data: "20 GB", validity: "30 days", price: "$39.99", desc: "Work remotely anywhere", featured: false },
];

const STEPS = [
  { step: "1", icon: Globe, title: "Choose Your Plan", desc: "Pick a country or region and select your data amount." },
  { step: "2", icon: QrCode, title: "Scan the QR Code", desc: "We email you a QR code. Scan it with your phone camera." },
  { step: "3", icon: Wifi, title: "You're Connected", desc: "eSIM activates instantly. Start using data immediately." },
];

const FAQS = [
  { q: "Is my phone compatible with eSIM?", a: "Most modern phones support eSIM: iPhone XS and later, Samsung Galaxy S20 and later, Google Pixel 3 and later, and most flagship Android devices from 2020 onwards. Check your phone settings — if you see 'Add eSIM' or 'Add Cellular Plan', you're good to go." },
  { q: "Will I lose my existing phone number?", a: "No. The eSIM runs as a second line on your phone, used only for data. Your existing SIM card and phone number remain active for calls and texts. You choose which line to use for data in your phone settings." },
  { q: "How fast is the activation?", a: "Under 60 seconds. Purchase a plan, scan the QR code (or tap the deep link on newer phones), and your eSIM is active. No store visits, no waiting for physical SIM delivery, no PIN codes." },
  { q: "Does unused data roll over?", a: "Data is valid for the plan period (7 or 30 days from activation). Unused data does not roll over, but you can top up anytime if you need more. We recommend our AI plan recommender to help you pick the right amount." },
  { q: "Can I use eSIM for calls and texts?", a: "Our eSIM plans are data-only, which is what most travelers need. For calls and texts, use your existing SIM or apps like WhatsApp, FaceTime, or Send over the eSIM data connection — this is usually cheaper than international calling anyway." },
];

const CARD_BG = "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)";
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

export default function EsimProductPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Zoobicon eSIM",
    description: "Instant eSIM data plans for 190+ countries. No physical SIM needed. Activate in seconds via QR code. AI-powered plan recommendations.",
    url: "https://zoobicon.com/products/esim",
    brand: { "@type": "Brand", name: "Zoobicon" },
    category: "Telecommunications",
    keywords: "best eSIM for travel, eSIM New Zealand, eSIM Pacific Islands, travel data plans, international eSIM",
    offers: { "@type": "AggregateOffer", lowPrice: "4.99", highPrice: "39.99", priceCurrency: "USD", availability: "https://schema.org/PreOrder" },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zoobicon.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://zoobicon.com/products" },
      { "@type": "ListItem", position: 3, name: "eSIM", item: "https://zoobicon.com/products/esim" },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const Cell = ({ val, highlight = false }: { val: unknown; highlight?: boolean }) => {
    if (val === true) {
      return <Check className="w-4 h-4 mx-auto" style={{ color: highlight ? "#E8D4B0" : "rgba(255,255,255,0.55)" }} />;
    }
    if (val === false) return <Minus className="w-4 h-4 mx-auto text-white/25" />;
    return <span className="text-[13px]" style={{ color: highlight ? "#E8D4B0" : "rgba(255,255,255,0.65)" }}>{String(val)}</span>;
  };

  return (
    <div className="min-h-screen bg-[#060e1f] text-white fs-grain pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Hero */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute left-1/2 top-0 h-[720px] w-[1200px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.09), transparent 70%)" }}
          />
          <div
            className="absolute right-[-10%] top-[30%] h-[420px] w-[520px] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(224,139,176,0.07), transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-8">
            <Clock className="w-3 h-3" />
            Coming Soon · Join the waitlist
          </div>

          <h1 className="fs-display-xl mb-6">
            Stay connected in{" "}
            <span style={SERIF}>190+ countries.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            Instant eSIM data plans. No physical SIM card. No store visits. Scan a QR code and
            you&apos;re online in seconds — across 190+ countries.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["190+ Countries", "Instant QR", "AI Recommendations", "Pacific Coverage", "Pay-As-You-Go", "Premium 4G/5G"].map((pill) => (
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
              Join the waitlist
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <BadgeCheck className="w-4 h-4" />
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
              Why Zoobicon eSIM
            </div>
            <h2 className="fs-display-lg mb-4">
              Built for travelers who{" "}
              <span style={SERIF}>never wait.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              For travelers, digital nomads, and remote workers who need reliable data everywhere.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
                />
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

      {/* Coverage */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Global coverage
            </div>
            <h2 className="fs-display-lg mb-4">
              Coverage that{" "}
              <span style={SERIF}>goes where you go.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              From the Pacific Islands to Europe — one eSIM, every destination.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REGIONS.map((r) => (
              <div
                key={r.name}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
                />
                <div className="relative flex items-start gap-4">
                  <span className="text-3xl leading-none">{r.emoji}</span>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-1.5">{r.name}</h3>
                    <p className="text-[13px] text-white/55 leading-relaxed">{r.countries}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="fs-display-lg mb-4">
              Three steps.{" "}
              <span style={SERIF}>That&apos;s it.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              From purchase to connected in under sixty seconds.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <div
                key={s.step}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 text-center transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
                />
                <div className="relative">
                  <div className="mx-auto mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <s.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: "rgba(232,212,176,0.75)" }}>
                    Step {s.step}
                  </div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-2">{s.title}</h3>
                  <p className="text-[13px] text-white/55 leading-relaxed">{s.desc}</p>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="hidden md:block absolute top-9 -right-3 w-5 h-5 text-white/15" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Industry comparison
            </div>
            <h2 className="fs-display-lg mb-4">
              See how we{" "}
              <span style={SERIF}>stack up.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              The only travel eSIM with bundled VPN, website builder, and AI plan recommendations.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-white/[0.08]" style={{ background: CARD_BG }}>
            <div className="min-w-[820px]">
              <div className="grid grid-cols-6 px-6 py-4 border-b border-white/[0.08] text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55">
                <div>Feature</div>
                <div className="text-center" style={{ color: "#E8D4B0" }}>Zoobicon</div>
                <div className="text-center">Airalo</div>
                <div className="text-center">Holafly</div>
                <div className="text-center">Nomad</div>
                <div className="text-center">aloSIM</div>
              </div>
              {COMPETITORS.map((row, i) => (
                <div
                  key={row.name}
                  className={`grid grid-cols-6 px-6 py-4 text-[13px] items-center ${
                    i !== COMPETITORS.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <div className="text-white/75 font-medium">{row.name}</div>
                  <div className="text-center"><Cell val={row.zoobicon} highlight /></div>
                  <div className="text-center"><Cell val={row.airalo} /></div>
                  <div className="text-center"><Cell val={row.holafly} /></div>
                  <div className="text-center"><Cell val={row.nomad} /></div>
                  <div className="text-center"><Cell val={row.alosim} /></div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-white/30 mt-4 text-center">
            Comparison based on publicly available information as of March 2026. Features and pricing
            may change. All trademarks belong to their respective owners. See our{" "}
            <Link href="/disclaimers" className="underline hover:text-white/55">disclaimers</Link>.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Pricing
            </div>
            <h2 className="fs-display-lg mb-4">
              Simple, transparent{" "}
              <span style={SERIF}>pricing.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Pay only for the data you need. No contracts. No surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-[24px] p-7 transition-all duration-500 hover:-translate-y-1 ${
                  p.featured ? "border-2 border-[#E8D4B0]/35" : "border border-white/[0.08] hover:border-[#E8D4B0]/25"
                }`}
                style={{
                  background: p.featured
                    ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(17,17,24,0.85) 100%)"
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
                </div>
                <p className="text-[13px] text-white/55 mb-1">{p.desc}</p>
                <p className="text-[12px] text-white/40 mb-6">{p.data} · {p.validity}</p>
                <Link
                  href="/auth/signup"
                  className={`block text-center rounded-full py-3 text-[13px] font-semibold transition-all ${
                    p.featured ? "" : "border border-white/[0.12] bg-white/[0.03] text-white/80 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                  }`}
                  style={p.featured ? PRIMARY_CTA : undefined}
                >
                  Join waitlist
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
              Questions,{" "}
              <span style={SERIF}>answered.</span>
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
                  <div className="px-6 pb-5 text-[13px] text-white/60 leading-relaxed">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.11), transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="fs-display-lg mb-5">
            Travel connected.{" "}
            <span style={SERIF}>Always.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            190+ countries. Instant activation. No roaming surprises. Join the waitlist and be first
            to know when we go live.
          </p>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={PRIMARY_CTA}
          >
            Join the waitlist
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> 190+ countries</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Under 60 seconds</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Keep your number</span>
          </div>
        </div>
      </section>
    </div>
  );
}
