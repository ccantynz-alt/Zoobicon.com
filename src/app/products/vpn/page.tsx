"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap,
  Globe,
  ArrowRight,
  Shield,
  Lock,
  Check,
  Minus,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff,
  Smartphone,
  Eye,
  EyeOff,
  Server,
  MapPin,
  Gauge,
  Binary,
  Split,
  Laptop,
  Plane,
  Briefcase,
} from "lucide-react";

/* ─── animation variants ─── */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

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
    color: "from-brand-500 to-accent-purple",
  },
  {
    step: "02",
    title: "Download & Configure",
    desc: "One-click install on macOS, Windows, iOS, Android, or Linux. Config files for routers too.",
    icon: Smartphone,
    color: "from-accent-cyan to-blue-600",
  },
  {
    step: "03",
    title: "Connect & Go",
    desc: "Tap connect. You\u2019re encrypted in under 2 seconds. Travel, work, stream \u2014 safely.",
    icon: Globe,
    color: "from-emerald-500 to-teal-600",
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

/* ─── SEO metadata (Next.js App Router) ─── */
// NOTE: metadata export must live in a server component or layout.
// For "use client" pages we inject JSON-LD instead and rely on
// the parent layout or a sibling layout.tsx for <head> meta.

export default function VPNPage() {
  /* ─── auth-aware nav ─── */
  const [user, setUser] = useState<{ name?: string } | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  /* ─── FAQ accordion state ─── */
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
    <div className="relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <BackgroundEffects preset="technical" />

      {/* ============================================ */}
      {/* NAVIGATION                                   */}
      {/* ============================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/60">/</span>
            <span className="text-sm text-white/65">VPN</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm text-white/65 hover:text-white transition-colors">
                {user.name || "Dashboard"}
              </Link>
            ) : (
              <Link href="/auth/signin" className="text-sm text-white/65 hover:text-white transition-colors">
                Sign in
              </Link>
            )}
            <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              <span>Get VPN</span>
            </Link>
          </div>
        </div>
      </nav>
      <CursorGlowTracker />

      {/* ============================================ */}
      {/* 1. HERO SECTION                              */}
      {/* ============================================ */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 mb-6">
              <Shield className="w-3 h-3 text-accent-cyan" />
              <span className="text-xs font-medium text-accent-cyan">Zoobicon VPN</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              Secure Everywhere<br />
              <span className="gradient-text-hero">You Go</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-3xl text-lg md:text-xl text-white/60 leading-relaxed mb-10">
              Military-grade encryption for travellers and businesses. Connect to 60+ locations worldwide
              with Oceania-optimised servers, zero-log policy, and blazing-fast WireGuard protocol.
              Whether you&apos;re on airport Wi-Fi in Auckland or a hotel in Bangkok &mdash; your data stays yours.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-12 max-w-3xl">
              {["256-bit Encryption", "Zero Logs", "WireGuard", "Kill Switch", "Split Tunneling", "Oceania Servers"].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] text-xs font-medium text-white/65"
                >
                  <Check className="w-3 h-3 text-accent-cyan" />
                  {pill}
                </span>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link href="/auth/signup" className="group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center gap-3 shadow-glow">
                <Shield className="w-5 h-5" />
                <span>Get VPN &mdash; From $3.99/mo</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#pricing" className="px-8 py-4 rounded-2xl text-base font-medium text-white/65 border border-white/[0.12] hover:border-white/20 transition-all flex items-center gap-3">
                <Gauge className="w-5 h-5" />
                <span>View Plans</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 2. STATS BANNER                              */}
      {/* ============================================ */}
      <section className="relative py-16 border-y border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {VPN_STATS.map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="text-4xl md:text-5xl font-black gradient-text-static mb-2">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3. FEATURES GRID                             */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Enterprise Security,<br /><span className="gradient-text">Traveller Simplicity</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Every feature you need to stay safe on the road or in the office. No compromises.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {VPN_FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <f.icon className="w-8 h-8 text-accent-cyan/50 mb-4 group-hover:text-accent-cyan transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 4. HOW IT WORKS                              */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Protected in<br /><span className="gradient-text">Three Steps</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                From signup to encrypted in under two minutes.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div key={i} variants={fadeInUp} className="relative gradient-border card-hover p-8 rounded-xl group text-center">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Step {step.step}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                      <ChevronRight className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 5. COMPETITOR COMPARISON TABLE                */}
      {/* ============================================ */}
      <section className="relative py-24 lg:py-32 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-blue w-[700px] h-[700px] top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-5" />
          <div className="glow-orb glow-orb-purple w-[500px] h-[500px] top-1/3 right-0 opacity-5" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 mb-6">
                <Eye className="w-3 h-3 text-brand-400" />
                <span className="text-xs font-medium text-brand-400">VPN Comparison 2026</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                Zoobicon VPN vs<br />
                <span className="gradient-text">The Competition</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                The only VPN built for travellers, bundled with a website builder and eSIM data.
                Compare features side-by-side.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-0 mb-2">
                  <div className="p-4" />
                  <div className="p-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-500/20 to-accent-purple/20 border border-brand-500/30">
                      <Zap className="w-4 h-4 text-brand-400" />
                      <span className="text-sm font-bold text-white">Zoobicon</span>
                    </div>
                  </div>
                  <div className="p-4 text-center"><span className="text-sm text-white/60">NordVPN</span></div>
                  <div className="p-4 text-center"><span className="text-sm text-white/60">Surfshark</span></div>
                  <div className="p-4 text-center"><span className="text-sm text-white/60">ExpressVPN</span></div>
                  <div className="p-4 text-center"><span className="text-sm text-white/60">ProtonVPN</span></div>
                </div>

                {/* Feature Rows */}
                {COMPETITOR_ROWS.map((row, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className={`grid grid-cols-6 gap-0 ${i % 2 === 0 ? "bg-white/[0.05]" : ""} rounded-lg`}
                  >
                    <div className="p-4 flex items-center">
                      <span className="text-sm text-white/60">{row.feature}</span>
                    </div>
                    {(["zoobicon", "nord", "surfshark", "express", "proton"] as const).map((key, j) => {
                      const val = row[key];
                      return (
                        <div key={j} className="p-4 flex items-center justify-center">
                          {typeof val === "boolean" ? (
                            val ? (
                              j === 0 ? (
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                </div>
                              ) : (
                                <Check className="w-4 h-4 text-white/60" />
                              )
                            ) : (
                              <Minus className="w-4 h-4 text-white/50" />
                            )
                          ) : (
                            <span className={`text-sm ${j === 0 ? "font-semibold text-white" : "text-white/60"}`}>{val}</span>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 6. PRICING SECTION                           */}
      {/* ============================================ */}
      <section id="pricing" className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Simple, Transparent<br /><span className="gradient-text">VPN Pricing</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Every plan includes military-grade encryption, WireGuard, and zero logs.
                No hidden fees. Cancel anytime.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {PRICING_TIERS.map((tier, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className={`relative p-6 rounded-2xl ${
                    tier.highlighted
                      ? "bg-gradient-to-b from-brand-500/10 to-accent-purple/10 border-2 border-brand-500/30"
                      : "gradient-border"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-purple text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-black">{tier.price}</span>
                    <span className="text-sm text-white/60">{tier.period}</span>
                  </div>
                  <p className="text-sm text-white/60 mb-6">{tier.description}</p>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/signup"
                    className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                      tier.highlighted
                        ? "btn-gradient text-white shadow-glow"
                        : "border border-white/[0.12] text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 7. FAQ SECTION                               */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Frequently Asked<br /><span className="gradient-text">Questions</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Everything you need to know about Zoobicon VPN.
              </p>
            </motion.div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="text-sm font-semibold text-white/80 pr-4">{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6">
                      <p className="text-sm text-white/60 leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 8. FINAL CTA                                 */}
      {/* ============================================ */}
      <section className="py-32 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-blue w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />
        </div>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6"
            >
              Your Privacy.<br />
              <span className="gradient-text-hero">Your Rules.</span>
            </motion.h2>

            <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-lg text-white/60 mb-10">
              Join thousands of travellers and businesses who trust Zoobicon VPN
              to keep their data safe across 60+ countries. Start protecting yourself today.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="group btn-gradient px-10 py-5 rounded-2xl text-lg font-bold text-white flex items-center gap-3 shadow-glow"
              >
                <Shield className="w-6 h-6" />
                <span>Get VPN &mdash; From $3.99/mo</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent-cyan" /> 30-day money back</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent-cyan" /> Cancel anytime</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent-cyan" /> No logs, ever</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER                                       */}
      {/* ============================================ */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-semibold">Zoobicon</span>
            </div>
            <div className="text-sm text-white/40 text-center">
              zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh
            </div>
            <div className="text-xs text-white/30">
              &copy; {new Date().getFullYear()} Zoobicon. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
