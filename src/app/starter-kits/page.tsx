"use client";

import Link from "next/link";
import {
  Camera,
  UtensilsCrossed,
  Code,
  Dumbbell,
  Home,
  Heart,
  ShoppingBag,
  Briefcase,
  HandHeart,
  Building2,
  Rocket,
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Globe,
  Mail,
  Calendar,
  FileText,
  Palette,
  Share2,
} from "lucide-react";
import { BUSINESS_KITS, type BusinessKit } from "@/lib/business-kits";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Camera,
  UtensilsCrossed,
  Code,
  Dumbbell,
  Home,
  Heart,
  ShoppingBag,
  Briefcase,
  HandHeart,
  Building2,
};

const WHAT_YOU_GET = [
  { icon: Globe, title: "AI Website", desc: "Custom-designed site built by 7 AI agents in seconds." },
  { icon: Calendar, title: "Booking System", desc: "Appointment scheduling with calendar sync and reminders." },
  { icon: FileText, title: "Invoicing", desc: "Professional invoices, proposals, and payment tracking." },
  { icon: Mail, title: "Email Marketing", desc: "Subscriber lists, campaigns, and automated sequences." },
  { icon: Share2, title: "Social Publisher", desc: "Content calendar across TikTok, Instagram, LinkedIn and more." },
  { icon: Palette, title: "Brand Kit", desc: "Colors, fonts, voice, and visual identity — all consistent." },
];

const REPLACED_TOOLS = [
  { name: "Squarespace", price: "$33/mo", category: "Website" },
  { name: "Calendly", price: "$16/mo", category: "Booking" },
  { name: "FreshBooks", price: "$17/mo", category: "Invoicing" },
  { name: "ConvertKit", price: "$29/mo", category: "Email" },
  { name: "Buffer", price: "$18/mo", category: "Social" },
  { name: "Canva Pro", price: "$15/mo", category: "Brand" },
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

export default function StarterKitsPage() {
  const totalReplaced = REPLACED_TOOLS.reduce((sum, t) => sum + parseInt(t.price), 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Zoobicon Starter Kits",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description":
      "One-click business starter kits. Pick your industry and Zoobicon configures website, booking, invoicing, email marketing, and social publishing automatically.",
    "url": "https://zoobicon.com/starter-kits",
    "offers": {
      "@type": "Offer",
      "price": "49",
      "priceCurrency": "USD",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Starter Kits", "item": "https://zoobicon.com/starter-kits" },
    ],
  };

  return (
    <div className="min-h-screen bg-[#060e1f] text-white fs-grain pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

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
            <Zap className="w-3 h-3" />
            One click. Everything configured.
          </div>

          <h1 className="fs-display-xl mb-6">
            Launch your business{" "}
            <span style={SERIF}>in five minutes.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            Pick your business type. We&apos;ll set up everything — website, booking, invoicing,
            email marketing, and social media — all configured and ready to go.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["AI Website", "Booking", "Invoicing", "Email Marketing", "Brand Kit", "Social Publisher"].map((pill) => (
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
              href="/builder"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              Open the builder
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#kits"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Rocket className="w-4 h-4" />
              Browse kits
            </Link>
          </div>
        </div>
      </section>

      {/* Kit Grid */}
      <section id="kits" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Choose your business
            </div>
            <h2 className="fs-display-lg mb-4">
              A starter kit for{" "}
              <span style={SERIF}>every craft.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Ten industry-tuned kits. Each one loads a complete stack — website, booking, invoicing, email
              and more — styled, connected, and ready for your first customer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {BUSINESS_KITS.map((kit: BusinessKit) => {
              const Icon = ICON_MAP[kit.icon] || Rocket;
              return (
                <div
                  key={kit.id}
                  className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                  style={{ background: CARD_BG }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
                  />
                  <div className="relative">
                    <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                      <Icon className="h-5 w-5 text-[#E8D4B0]" />
                    </div>

                    <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-1.5">{kit.name}</h3>
                    <p className="text-[13px] text-white/55 leading-relaxed mb-5">{kit.tagline}</p>

                    <ul className="space-y-2 mb-7">
                      {kit.services.map((service) => (
                        <li key={service.name} className="flex items-center gap-2 text-[13px] text-white/65">
                          <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#E8D4B0" }} />
                          {service.name}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={`/builder?kit=${kit.id}`}
                      className="group/cta inline-flex items-center justify-center gap-2 w-full rounded-full py-3 text-[13px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
                      style={PRIMARY_CTA}
                    >
                      Launch this kit
                      <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              What&apos;s inside
            </div>
            <h2 className="fs-display-lg mb-4">
              Everything you need,{" "}
              <span style={SERIF}>already set up.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Each starter kit ships with five to six fully configured services. No setup, no integrations,
              no headaches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHAT_YOU_GET.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
                />
                <div className="relative">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <item.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{item.title}</h3>
                  <p className="text-[13px] text-white/55 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Replace Your Stack */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Replace your stack
            </div>
            <h2 className="fs-display-lg mb-4">
              Stop paying for six{" "}
              <span style={SERIF}>different tools.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Replace ${totalReplaced}/month in subscriptions with one platform that does it all — and talks
              to itself out of the box.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/[0.08] p-8" style={{ background: CARD_BG }}>
            <div className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-6" style={{ color: "rgba(232,212,176,0.75)" }}>
              What you&apos;re paying today
            </div>

            <div className="space-y-3 mb-8">
              {REPLACED_TOOLS.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white/70 line-through text-[14px]">{tool.name}</span>
                    <span className="text-[10px] uppercase tracking-wide rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-white/50">
                      {tool.category}
                    </span>
                  </div>
                  <span className="text-white/40 line-through text-[13px]">{tool.price}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/[0.08]">
              <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-white/45 mb-1">Total replaced</div>
                <div className="text-2xl font-semibold text-white/40 line-through">${totalReplaced}/mo</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.15em] mb-1" style={{ color: "rgba(232,212,176,0.75)" }}>
                  Zoobicon Pro
                </div>
                <div className="text-3xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>$49/mo</div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] p-4 text-center">
              <Sparkles className="w-4 h-4 mx-auto mb-2" style={{ color: "#E8D4B0" }} />
              <p className="text-[13px] font-semibold" style={{ color: "#E8D4B0" }}>
                Save ${totalReplaced - 49}/month — that&apos;s ${(totalReplaced - 49) * 12}/year back in your pocket.
              </p>
            </div>
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
            Ready to{" "}
            <span style={SERIF}>launch?</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            Pick a starter kit above, or open the builder and describe your business from scratch.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/builder"
              className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              Open the builder
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-8 py-4 text-[15px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              View pricing
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Ready in minutes</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Ten industry kits</span>
          </div>
        </div>
      </section>
    </div>
  );
}
