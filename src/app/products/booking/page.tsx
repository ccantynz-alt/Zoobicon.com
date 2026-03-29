"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap, ArrowRight, Check, Minus, ChevronDown, ChevronRight,
  Calendar, Clock, Users, Brain, Smartphone, Bell,
  Scissors, Stethoscope, Dumbbell, UtensilsCrossed, Wrench, Briefcase,
  MessageSquare, Phone, BarChart3, CreditCard, Globe, Palette,
  LayoutDashboard, LogOut,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const STATS = [
  { value: "Free", label: "Starter plan" },
  { value: "AI", label: "Smart scheduling" },
  { value: "24/7", label: "Online booking" },
  { value: "0%", label: "No-show reduction" },
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
  { name: "Feature", zoobicon: "Zoobicon", calendly: "Calendly", acuity: "Acuity", simplybook: "SimplyBook", fresha: "Fresha" },
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
                <Link href="/auth/signup" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white">Get Started Free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <HeroEffects variant="green" cursorGlow particles particleCount={25} aurora />
        <CursorGlowTracker />
        <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs font-medium text-emerald-300">AI-Powered Booking</span>
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Your calendar,{" "}<span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">fully booked</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10">
            AI scheduling that fills every gap. Voice receptionist that books while you sleep. No-show prediction that saves your revenue. Free to start.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup" className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-semibold hover:from-emerald-400 hover:to-green-500 transition-all flex items-center gap-2">Start Free <ArrowRight className="w-4 h-4" /></Link>
            <Link href="#pricing" className="px-8 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] font-semibold hover:bg-white/[0.08] transition-all">View Plans</Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div className="text-center mb-16" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">Not just booking. AI booking.</motion.h2>
            <motion.p variants={fadeInUp} className="text-white/40 max-w-lg mx-auto">Every competitor offers a calendar. We offer an AI that fills it.</motion.p>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeInUp} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 hover:border-emerald-500/20 transition-all">
                <f.icon className="w-6 h-6 text-emerald-400 mb-4" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">Built for every business that takes appointments</motion.h2>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {INDUSTRIES.map(ind => (
              <motion.div key={ind.name} variants={fadeInUp} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
                <ind.icon className="w-5 h-5 text-emerald-400 mb-3" />
                <h3 className="font-semibold text-sm mb-1">{ind.name}</h3>
                <p className="text-xs text-white/40">{ind.examples}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-4">How Zoobicon Booking compares</motion.h2>
          <motion.p variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-white/40 text-center mb-12 max-w-lg mx-auto">We&apos;re the only booking platform with real AI at an SMB price point.</motion.p>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {["Feature", "Zoobicon", "Calendly", "Acuity", "SimplyBook", "Fresha"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-left text-xs uppercase tracking-wider ${i === 1 ? "text-emerald-400 bg-emerald-500/5" : "text-white/40"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {COMPETITORS.slice(1).map(row => (
                  <tr key={row.name} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/60 text-sm">{row.name}</td>
                    <td className="px-4 py-3 bg-emerald-500/5"><Cell val={row.zoobicon} /></td>
                    <td className="px-4 py-3"><Cell val={row.calendly} /></td>
                    <td className="px-4 py-3"><Cell val={row.acuity} /></td>
                    <td className="px-4 py-3"><Cell val={row.simplybook} /></td>
                    <td className="px-4 py-3"><Cell val={row.fresha} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-white/20 mt-3 text-center">Comparison based on publicly available information as of March 2026. Features and pricing may change. All trademarks belong to their respective owners. See our <a href="/disclaimers" className="underline hover:text-white/30">disclaimers</a>.</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">Start free. Upgrade when you need AI.</motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`rounded-2xl p-6 border ${p.featured ? "bg-emerald-500/5 border-emerald-500/20 ring-1 ring-emerald-500/10" : "bg-white/[0.02] border-white/[0.08]"}`}>
                {p.featured && <div className="text-[10px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full inline-block mb-3 font-semibold uppercase tracking-wider">Most Popular</div>}
                <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                <p className="text-xs text-white/40 mb-4">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-6"><span className="text-3xl font-bold">{p.price}</span>{p.period && <span className="text-sm text-white/30">{p.period}</span>}</div>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/50"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{f}</li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${p.featured ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500" : "bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08]"}`}>
                  {p.price === "Free" ? "Start Free" : "Start Free Trial"}
                </Link>
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
          <Calendar className="w-12 h-12 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Stop losing bookings. Start today.</h2>
          <p className="text-white/40 mb-8 max-w-lg mx-auto">Free forever for solo professionals. AI features from $6.99/mo. No credit card required.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 font-semibold hover:from-emerald-400 hover:to-green-500 transition-all">Start Free <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

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
