"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap, Globe, Wifi, Smartphone, Shield, Clock, MapPin,
  ChevronRight, Check, ArrowRight, Loader2, Plane,
  Signal, CreditCard, LayoutDashboard, LogOut,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } };
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const REGIONS = [
  { name: "Pacific Islands", countries: "Fiji, Samoa, Tonga, Vanuatu, Cook Islands", flag: "🌊", soon: true },
  { name: "Southeast Asia", countries: "Philippines, Indonesia, Vietnam, Thailand, Malaysia", flag: "🌏", soon: true },
  { name: "Australia & NZ", countries: "Australia, New Zealand", flag: "🦘", soon: true },
  { name: "Europe", countries: "UK, France, Germany, Spain, Italy + 25 more", flag: "🇪🇺", soon: true },
  { name: "North America", countries: "USA, Canada, Mexico", flag: "🌎", soon: true },
  { name: "Global", countries: "190+ countries, one eSIM", flag: "🌍", soon: true },
];

const FEATURES = [
  {
    icon: Clock,
    title: "Instant Activation",
    desc: "QR code delivered in seconds. No physical SIM card, no waiting, no store visits.",
  },
  {
    icon: Globe,
    title: "190+ Countries",
    desc: "One eSIM, worldwide coverage. Switch plans as you travel — no roaming surprises.",
  },
  {
    icon: Shield,
    title: "Keep Your Number",
    desc: "Your existing number stays active. eSIM runs as a second line for data.",
  },
  {
    icon: CreditCard,
    title: "Pay What You Use",
    desc: "Transparent per-GB pricing. No contracts, no hidden fees, cancel anytime.",
  },
  {
    icon: Signal,
    title: "Premium Networks",
    desc: "We connect to top-tier local carriers in every country. Fast, reliable, real 4G/5G.",
  },
  {
    icon: Smartphone,
    title: "Works on Your Phone",
    desc: "iPhone XS+, Samsung S20+, Google Pixel 3+, and most modern Android devices.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Choose Your Plan", desc: "Pick a country or region, select your data amount." },
  { step: "2", title: "Scan the QR Code", desc: "We email you a QR code. Scan it with your phone's camera." },
  { step: "3", title: "You're Connected", desc: "eSIM activates instantly. Start using data immediately." },
];

export default function EsimPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [user, setUser] = useState<{ email?: string; name?: string; role?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "esim-waitlist", message: "eSIM waitlist signup" }),
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Zoobicon eSIM",
    "description": "Instant eSIM data plans for 190+ countries. No physical SIM needed — activate in seconds via QR code.",
    "url": "https://zoobicon.com/esim",
    "brand": { "@type": "Brand", "name": "Zoobicon" },
    "category": "Telecommunications",
    "offers": {
      "@type": "AggregateOffer",
      "availability": "https://schema.org/PreOrder",
      "lowPrice": "4.99",
      "highPrice": "49.99",
      "priceCurrency": "USD",
    },
  };

  return (
    <div className="relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
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
                <Link href="/auth/signup" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={30} aurora />
        <CursorGlowTracker />
        <motion.div
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
            <Plane className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-medium text-cyan-300">Coming Soon</span>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Travel data,{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              instantly
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10">
            eSIM data plans for 190+ countries. No physical SIM. No store visits.
            Scan a QR code and you&apos;re connected in seconds.
          </motion.p>

          {/* Waitlist Form */}
          <motion.div variants={fadeInUp} className="max-w-md mx-auto">
            {status === "success" ? (
              <div className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-emerald-300">You&apos;re on the list! We&apos;ll notify you at launch.</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm
                             placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-sm
                             hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 whitespace-nowrap
                             flex items-center gap-2"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Join Waitlist <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="text-xs text-red-400 mt-2">Something went wrong. Please try again.</p>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Three steps. That&apos;s it.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/40 max-w-lg mx-auto">
              No store visits. No SIM card swaps. No waiting for delivery.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {HOW_IT_WORKS.map((item) => (
              <motion.div
                key={item.step}
                variants={fadeInUp}
                className="relative rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-cyan-400">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-white/40">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Why Zoobicon eSIM?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/40 max-w-lg mx-auto">
              Built for travellers, digital nomads, and remote workers who need reliable data everywhere.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-all"
              >
                <f.icon className="w-6 h-6 text-cyan-400 mb-4" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Coverage Regions */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Coverage that goes where you go
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/40 max-w-lg mx-auto">
              Regional and global plans. Pick what fits your trip.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {REGIONS.map((r) => (
              <motion.div
                key={r.name}
                variants={fadeInUp}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5 flex items-start gap-4"
              >
                <span className="text-2xl">{r.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{r.name}</h3>
                    <span className="text-[9px] text-cyan-400/60 bg-cyan-500/10 px-1.5 py-0.5 rounded-full">Soon</span>
                  </div>
                  <p className="text-xs text-white/35 leading-relaxed">{r.countries}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={fadeInUp} className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-8 flex items-center justify-center">
              <Wifi className="w-8 h-8 text-white" />
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Be first in line
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/40 mb-8 max-w-lg mx-auto">
              We&apos;re building the simplest way to stay connected anywhere in the world.
              Join the waitlist and we&apos;ll let you know the moment it&apos;s live.
            </motion.p>

            {status === "success" ? (
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">You&apos;re on the waitlist!</span>
              </motion.div>
            ) : (
              <motion.form variants={fadeInUp} onSubmit={handleWaitlist} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm
                             placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-sm
                             hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Waitlist"}
                </button>
              </motion.form>
            )}
          </motion.div>
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
            <Link href="/support" className="text-xs text-white/30 hover:text-white/50 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
