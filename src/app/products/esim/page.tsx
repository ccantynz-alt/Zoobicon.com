"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap, Globe, ArrowRight, Shield, Check, Minus, ChevronDown,
  Smartphone, Wifi, Signal, Clock, CreditCard, MapPin,
  Plane, QrCode, Sparkles, ChevronRight, LayoutDashboard, LogOut,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

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
  { name: "Feature", zoobicon: "Zoobicon", airalo: "Airalo", holafly: "Holafly", nomad: "Nomad", alosim: "aloSIM" },
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

const FAQS = [
  { q: "Is my phone compatible with eSIM?", a: "Most modern phones support eSIM: iPhone XS and later, Samsung Galaxy S20 and later, Google Pixel 3 and later, and most flagship Android devices from 2020 onwards. Check your phone settings — if you see 'Add eSIM' or 'Add Cellular Plan', you're good to go." },
  { q: "Will I lose my existing phone number?", a: "No. The eSIM runs as a second line on your phone, used only for data. Your existing SIM card and phone number remain active for calls and texts. You choose which line to use for data in your phone settings." },
  { q: "How fast is the activation?", a: "Under 60 seconds. Purchase a plan, scan the QR code (or tap the deep link on newer phones), and your eSIM is active. No store visits, no waiting for physical SIM delivery, no PIN codes." },
  { q: "Does unused data roll over?", a: "Data is valid for the plan period (7 or 30 days from activation). Unused data does not roll over, but you can top up anytime if you need more. We recommend our AI plan recommender to help you pick the right amount." },
  { q: "Can I use eSIM for calls and texts?", a: "Our eSIM plans are data-only, which is what most travelers need. For calls and texts, use your existing SIM or apps like WhatsApp, FaceTime, or Telegram over the eSIM data connection — this is usually cheaper than international calling anyway." },
];

export default function EsimProductPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

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
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zoobicon.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://zoobicon.com/products" },
      { "@type": "ListItem", position: 3, name: "eSIM", item: "https://zoobicon.com/products/esim" },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const Cell = ({ val }: { val: unknown }) => {
    if (val === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
    if (val === false) return <Minus className="w-4 h-4 text-white/20 mx-auto" />;
    return <span className="text-sm text-white/70">{String(val)}</span>;
  };

  return (
    <div className="relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</Link>
                <button onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} setUser(null); }} className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2">Sign in</Link>
                <Link href="/auth/signup" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={25} aurora />
        <CursorGlowTracker />
        <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
            <Plane className="w-3.5 h-3.5 text-cyan-400" /><span className="text-xs font-medium text-cyan-300">Travel Data, Instantly</span>
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Stay connected in{" "}<span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">190+ countries</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10">
            Instant eSIM data plans. No physical SIM card. No store visits. Scan a QR code and you&apos;re online in seconds.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup" className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2">Get eSIM <ArrowRight className="w-4 h-4" /></Link>
            <Link href="#pricing" className="px-8 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] font-semibold hover:bg-white/[0.08] transition-all">View Plans</Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div className="text-center mb-16" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">Why Zoobicon eSIM?</motion.h2>
            <motion.p variants={fadeInUp} className="text-white/40 max-w-lg mx-auto">Built for travelers, digital nomads, and remote workers who need reliable data everywhere.</motion.p>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeInUp} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 hover:border-cyan-500/20 transition-all">
                <f.icon className="w-6 h-6 text-cyan-400 mb-4" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">Coverage that goes where you go</motion.h2>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {REGIONS.map(r => (
              <motion.div key={r.name} variants={fadeInUp} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 flex items-start gap-4">
                <span className="text-2xl">{r.emoji}</span>
                <div><h3 className="font-semibold text-sm mb-1">{r.name}</h3><p className="text-xs text-white/35">{r.countries}</p></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">Three steps. That&apos;s it.</motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", icon: Globe, title: "Choose Your Plan", desc: "Pick a country or region and select your data amount." },
              { step: "2", icon: QrCode, title: "Scan the QR Code", desc: "We email you a QR code. Scan it with your phone camera." },
              { step: "3", icon: Wifi, title: "You're Connected", desc: "eSIM activates instantly. Start using data immediately." },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-white/40">{s.desc}</p>
                {i < 2 && <ChevronRight className="hidden md:block absolute top-7 -right-3 w-5 h-5 text-white/15" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">How Zoobicon eSIM compares</motion.h2>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {["Feature", "Zoobicon", "Airalo", "Holafly", "Nomad", "aloSIM"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-left text-xs uppercase tracking-wider ${i === 1 ? "text-cyan-400 bg-cyan-500/5" : "text-white/40"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {COMPETITORS.slice(1).map(row => (
                  <tr key={row.name} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/60 text-sm">{row.name}</td>
                    <td className="px-4 py-3 bg-cyan-500/5"><Cell val={row.zoobicon} /></td>
                    <td className="px-4 py-3"><Cell val={row.airalo} /></td>
                    <td className="px-4 py-3"><Cell val={row.holafly} /></td>
                    <td className="px-4 py-3"><Cell val={row.nomad} /></td>
                    <td className="px-4 py-3"><Cell val={row.alosim} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">Simple, transparent pricing</motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`rounded-2xl p-6 border ${p.featured ? "bg-cyan-500/5 border-cyan-500/20 ring-1 ring-cyan-500/10" : "bg-white/[0.02] border-white/[0.08]"}`}>
                {p.featured && <div className="text-[10px] text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full inline-block mb-3 font-semibold uppercase tracking-wider">Most Popular</div>}
                <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                <p className="text-xs text-white/40 mb-4">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold">{p.price}</span></div>
                <p className="text-xs text-white/30 mb-6">{p.data} · {p.validity}</p>
                <Link href="/auth/signup" className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${p.featured ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500" : "bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08]"}`}>Get eSIM</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">Frequently asked questions</motion.h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/[0.08] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-medium pr-4">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-white/30 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-white/50 leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Wifi className="w-12 h-12 text-cyan-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Travel connected. Always.</h2>
          <p className="text-white/40 mb-8 max-w-lg mx-auto">190+ countries. Instant activation. No roaming surprises. Get your eSIM in under 60 seconds.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all">Get eSIM <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/30">&copy; 2026 Zoobicon. All rights reserved.</div>
          <div className="text-xs text-white/20">zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/50 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
