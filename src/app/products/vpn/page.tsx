"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Shield,
  Check,
  Minus,
  ChevronDown,
  ChevronRight,
  Smartphone,
  EyeOff,
  MapPin,
  Gauge,
  Split,
  Laptop,
  WifiOff,
  Globe,
  BadgeCheck,
} from "lucide-react";

/* ─── data ─── */
const VPN_STATS = [
  { value: "60+", label: "Server locations" },
  { value: "256-bit", label: "AES encryption" },
  { value: "Zero", label: "Activity logs" },
  { value: "\u221E", label: "Bandwidth" },
];

const VPN_FEATURES = [
  {
    icon: WifiOff,
    title: "Kill Switch",
    desc: "Instantly cuts internet if VPN drops. No data leaks, ever. Works on every platform.",
  },
  {
    icon: Split,
    title: "Split Tunneling",
    desc: "Route only the traffic you choose through the VPN. Banking app local, streaming global.",
  },
  {
    icon: Laptop,
    title: "Multi-Device",
    desc: "One account covers laptop, phone, tablet, and router. Up to 6 simultaneous connections.",
  },
  {
    icon: EyeOff,
    title: "No-Logs Policy",
    desc: "We never record your browsing, DNS queries, or connection timestamps. Independently audited.",
  },
  {
    icon: Gauge,
    title: "WireGuard Protocol",
    desc: "Next-gen protocol delivers up to 3\u00D7 faster speeds than OpenVPN with stronger cryptography.",
  },
  {
    icon: MapPin,
    title: "Oceania-Optimised Servers",
    desc: "Dedicated nodes in Auckland, Sydney, Suva, and across the Pacific for the lowest possible latency.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose Your Plan",
    desc: "Pick Basic, Pro, or Annual. All plans include every feature \u2014 no feature-gating.",
    icon: Shield,
  },
  {
    step: "02",
    title: "Download & Configure",
    desc: "One-click install on macOS, Windows, iOS, Android, or Linux. Config files for routers too.",
    icon: Smartphone,
  },
  {
    step: "03",
    title: "Connect & Go",
    desc: "Tap connect. You\u2019re encrypted in under 2 seconds. Travel, work, stream \u2014 safely.",
    icon: Globe,
  },
];

const COMPETITOR_ROWS = [
  { feature: "Monthly price (cheapest)", zoobicon: "$3.99", nord: "$4.59", surfshark: "$3.99", express: "$6.67", proton: "$4.99" },
  { feature: "Server countries", zoobicon: "60+", nord: "111", surfshark: "100", express: "105", proton: "112" },
  { feature: "NZ / Pacific servers", zoobicon: true, nord: true, surfshark: true, express: true, proton: false },
  { feature: "WireGuard support", zoobicon: true, nord: true, surfshark: true, express: false, proton: true },
  { feature: "Audited no-logs", zoobicon: true, nord: true, surfshark: true, express: true, proton: true },
  { feature: "Kill switch", zoobicon: true, nord: true, surfshark: true, express: true, proton: true },
  { feature: "Split tunneling", zoobicon: true, nord: true, surfshark: true, express: true, proton: true },
  { feature: "Simultaneous devices", zoobicon: "6", nord: "10", surfshark: "Unlimited", express: "8", proton: "10" },
  { feature: "Bundled website builder", zoobicon: true, nord: false, surfshark: false, express: false, proton: false },
  { feature: "Bundled eSIM / travel data", zoobicon: true, nord: false, surfshark: false, express: false, proton: false },
  { feature: "Oceania-optimised routing", zoobicon: true, nord: false, surfshark: false, express: false, proton: false },
  { feature: "24/7 live chat support", zoobicon: true, nord: true, surfshark: true, express: true, proton: false },
];

const PRICING_TIERS = [
  {
    name: "Basic",
    price: "$3.99",
    period: "/mo",
    description: "Essential protection for everyday browsing and travel.",
    features: [
      "All 60+ server locations",
      "256-bit AES encryption",
      "WireGuard protocol",
      "Kill switch",
      "3 simultaneous devices",
      "Email support",
    ],
    cta: "Get Basic",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$5.99",
    period: "/mo",
    description: "Full power for professionals and frequent travellers.",
    features: [
      "Everything in Basic",
      "6 simultaneous devices",
      "Split tunneling",
      "Dedicated IP option",
      "Ad & tracker blocking",
      "Priority 24/7 support",
      "Router configuration",
      "Multi-hop connections",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
  {
    name: "Annual",
    price: "$47.99",
    period: "/yr",
    description: "Pro features at 4 months free. Best value.",
    features: [
      "Everything in Pro",
      "Save $23.89 per year",
      "Priority server access",
      "Early access to new locations",
      "Dedicated account manager",
      "Business invoice support",
    ],
    cta: "Get Annual",
    highlighted: false,
  },
];

const FAQ_ITEMS = [
  {
    q: "Is Zoobicon VPN safe to use on public Wi-Fi when travelling?",
    a: "Absolutely. Zoobicon VPN encrypts all traffic with 256-bit AES encryption, the same standard used by banks and governments. On hotel, airport, or caf\u00E9 Wi-Fi your data is fully protected. The built-in kill switch ensures zero exposure even if the connection drops momentarily.",
  },
  {
    q: "Does Zoobicon VPN work in New Zealand and the Pacific Islands?",
    a: "Yes. We operate Oceania-optimised servers in Auckland, Sydney, Suva, and other Pacific locations. This means significantly lower latency compared to VPN providers that route Pacific traffic through US or European servers. Local banking, streaming, and government services all work seamlessly.",
  },
  {
    q: "Can I use Zoobicon VPN on all my devices at once?",
    a: "Basic plans support 3 simultaneous connections. Pro and Annual plans support 6 simultaneous connections \u2014 covering your laptop, phone, tablet, and even your home router. Native apps are available for macOS, Windows, iOS, Android, and Linux.",
  },
  {
    q: "Does Zoobicon VPN keep any logs of my activity?",
    a: "No. We enforce a strict no-logs policy. We do not record browsing history, DNS queries, connection timestamps, or IP addresses. Our infrastructure is independently audited annually, and the results are published publicly.",
  },
  {
    q: "What makes Zoobicon VPN different from NordVPN or ExpressVPN?",
    a: "Three things: First, Oceania-optimised routing gives you faster speeds across New Zealand, Australia, and the Pacific. Second, Zoobicon VPN bundles with our website builder and eSIM travel data \u2014 one subscription, multiple travel tools. Third, we use WireGuard by default for up to 3\u00D7 faster connections than legacy protocols.",
  },
];

const CARD_BG = "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)";
const PRIMARY_CTA = {
  background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
  color: "#0a0a0f",
  boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
} as const;
const SERIF: React.CSSProperties = {
  fontFamily: "Fraunces, ui-serif, Georgia, serif",
  fontStyle: "italic",
  fontWeight: 400,
  color: "#E8D4B0",
};

export default function VPNPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* ─── JSON-LD structured data ─── */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zoobicon VPN",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Windows, macOS, iOS, Android, Linux",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "4.99",
      highPrice: "59.99",
      priceCurrency: "USD",
      offerCount: "3",
    },
    description:
      "Secure VPN for travellers and businesses. 60+ server locations, 256-bit encryption, zero-log policy, WireGuard protocol, and Oceania-optimised servers across New Zealand and the Pacific Islands.",
    url: "https://zoobicon.com/products/vpn",
    screenshot: "https://zoobicon.com/og-image.png",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1240",
      bestRating: "5",
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zoobicon.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://zoobicon.com/products" },
      { "@type": "ListItem", position: 3, name: "VPN", item: "https://zoobicon.com/products/vpn" },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white fs-grain pt-[72px]">
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
            <BadgeCheck className="w-3 h-3" />
            60+ locations · Zero logs · WireGuard
          </div>

          <h1 className="fs-display-xl mb-6">
            Secure everywhere{" "}
            <span style={SERIF}>you go.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            Military-grade encryption for travellers and businesses. Connect to 60+ locations
            worldwide with Oceania-optimised servers, zero-log policy, and blazing-fast WireGuard
            protocol. Whether you&apos;re on airport Wi-Fi in Auckland or a hotel in Bangkok &mdash;
            your data stays yours.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["256-bit Encryption", "Zero Logs", "WireGuard", "Kill Switch", "Split Tunneling", "Oceania Servers"].map((pill) => (
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
              Get VPN &mdash; from $3.99/mo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Gauge className="w-4 h-4" />
              View plans
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {VPN_STATS.map((stat) => (
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

      {/* Features grid */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Security
            </div>
            <h2 className="fs-display-lg mb-4">
              Enterprise security,{" "}
              <span style={SERIF}>traveller simplicity.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Every feature you need to stay safe on the road or in the office. No compromises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {VPN_FEATURES.map((f) => (
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

      {/* How it works */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="fs-display-lg mb-4">
              Protected in{" "}
              <span style={SERIF}>three steps.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              From signup to encrypted in under two minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 relative">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
                />
                <div className="relative">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <step.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-2" style={{ color: "rgba(232,212,176,0.75)" }}>
                    Step {step.step}
                  </div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-2">{step.title}</h3>
                  <p className="text-[13px] text-white/55 leading-relaxed">{step.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ChevronRight className="w-5 h-5 text-white/20" />
                  </div>
                )}
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
              VPN comparison 2026
            </div>
            <h2 className="fs-display-lg mb-4">
              Zoobicon VPN vs{" "}
              <span style={SERIF}>the competition.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              The only VPN built for travellers, bundled with a website builder and eSIM data.
              Compare features side-by-side.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-white/[0.08]" style={{ background: CARD_BG }}>
            <div className="min-w-[820px]">
              <div className="grid grid-cols-6 px-6 py-4 border-b border-white/[0.08] text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55">
                <div>Feature</div>
                <div className="text-center" style={{ color: "#E8D4B0" }}>Zoobicon</div>
                <div className="text-center">NordVPN</div>
                <div className="text-center">Surfshark</div>
                <div className="text-center">ExpressVPN</div>
                <div className="text-center">ProtonVPN</div>
              </div>
              {COMPETITOR_ROWS.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-6 px-6 py-4 text-[13px] ${
                    i !== COMPETITOR_ROWS.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <div className="text-white/75 font-medium">{row.feature}</div>
                  {(["zoobicon", "nord", "surfshark", "express", "proton"] as const).map((key, j) => {
                    const val = row[key];
                    return (
                      <div key={j} className="text-center">
                        {typeof val === "boolean" ? (
                          val ? (
                            <Check
                              className="w-4 h-4 mx-auto"
                              style={j === 0 ? { color: "#E8D4B0" } : { color: "rgba(255,255,255,0.55)" }}
                            />
                          ) : (
                            <Minus className="w-4 h-4 mx-auto text-white/25" />
                          )
                        ) : (
                          <span
                            className={j === 0 ? "font-semibold" : "text-white/65"}
                            style={j === 0 ? { color: "#E8D4B0" } : undefined}
                          >
                            {val}
                          </span>
                        )}
                      </div>
                    );
                  })}
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Pricing
            </div>
            <h2 className="fs-display-lg mb-4">
              Simple, transparent{" "}
              <span style={SERIF}>VPN pricing.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Every plan includes military-grade encryption, WireGuard, and zero logs.
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-[24px] p-7 transition-all duration-500 hover:-translate-y-1 ${
                  tier.highlighted ? "border-2 border-[#E8D4B0]/35" : "border border-white/[0.08] hover:border-[#E8D4B0]/25"
                }`}
                style={{
                  background: tier.highlighted
                    ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(17,17,24,0.85) 100%)"
                    : CARD_BG,
                }}
              >
                {tier.highlighted && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)", color: "#0a0a0f" }}
                  >
                    Most popular
                  </div>
                )}
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>
                    {tier.price}
                  </span>
                  <span className="text-[13px] text-white/50">{tier.period}</span>
                </div>
                <p className="text-[13px] text-white/55 mb-6">{tier.description}</p>
                <ul className="space-y-2.5 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/65">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#E8D4B0" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/signup"
                  className={`block text-center rounded-full py-3 text-[13px] font-semibold transition-all ${
                    tier.highlighted ? "" : "border border-white/[0.12] bg-white/[0.03] text-white/80 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                  }`}
                  style={tier.highlighted ? PRIMARY_CTA : undefined}
                >
                  {tier.cta}
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
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Everything you need to know about Zoobicon VPN.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={item.q}
                className="overflow-hidden rounded-[20px] border border-white/[0.08] transition-all duration-500 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-[14px] font-semibold text-white/85 pr-4">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    style={{ color: "#E8D4B0" }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-[13px] text-white/60 leading-relaxed">{item.a}</p>
                  </div>
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
            Your privacy.{" "}
            <span style={SERIF}>Your rules.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            Join thousands of travellers and businesses who trust Zoobicon VPN to keep their data
            safe across 60+ countries. Start protecting yourself today.
          </p>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={PRIMARY_CTA}
          >
            Get VPN &mdash; from $3.99/mo
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> 30-day money back
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Cancel anytime
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> No logs, ever
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
