"use client";

import { useState } from "react";
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
  BarChart3,
  Star,
} from "lucide-react";
import { BUSINESS_KITS, type BusinessKit } from "@/lib/business-kits";

const ICON_MAP: Record<string, React.ReactNode> = {
  Camera: <Camera size={24} />,
  UtensilsCrossed: <UtensilsCrossed size={24} />,
  Code: <Code size={24} />,
  Dumbbell: <Dumbbell size={24} />,
  Home: <Home size={24} />,
  Heart: <Heart size={24} />,
  ShoppingBag: <ShoppingBag size={24} />,
  Briefcase: <Briefcase size={24} />,
  HandHeart: <HandHeart size={24} />,
  Building2: <Building2 size={24} />,
};

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  website: <Globe size={14} />,
  booking: <Calendar size={14} />,
  invoicing: <FileText size={14} />,
  "email-marketing": <Mail size={14} />,
  store: <ShoppingBag size={14} />,
  blog: <FileText size={14} />,
  "brand-kit": <Palette size={14} />,
  "content-calendar": <Share2 size={14} />,
  social: <Star size={14} />,
};

const WHAT_YOU_GET = [
  { icon: <Globe size={20} />, title: "AI Website", description: "Custom-designed site built by 7 AI agents in seconds" },
  { icon: <Calendar size={20} />, title: "Booking System", description: "Appointment scheduling with calendar sync and reminders" },
  { icon: <FileText size={20} />, title: "Invoicing", description: "Professional invoices, proposals, and payment tracking" },
  { icon: <Mail size={20} />, title: "Email Marketing", description: "Subscriber lists, campaigns, and automated sequences" },
  { icon: <Share2 size={20} />, title: "Social Publisher", description: "Content calendar across TikTok, Camera, LinkedIn, and more" },
  { icon: <Palette size={20} />, title: "Brand Kit", description: "Colors, fonts, voice, and visual identity — all consistent" },
];

const REPLACED_TOOLS = [
  { name: "Squarespace", price: "$33/mo", category: "Website" },
  { name: "Calendly", price: "$16/mo", category: "Booking" },
  { name: "FreshBooks", price: "$17/mo", category: "Invoicing" },
  { name: "ConvertKit", price: "$29/mo", category: "Email" },
  { name: "Buffer", price: "$18/mo", category: "Social" },
  { name: "Canva Pro", price: "$15/mo", category: "Brand" },
];

export default function StarterKitsPage() {
  const [hoveredKit, setHoveredKit] = useState<string | null>(null);

  const totalReplaced = REPLACED_TOOLS.reduce((sum, t) => sum + parseInt(t.price), 0);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-stone-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-stone-500/10 rounded-full blur-[128px]" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-500/10 border border-stone-500/20 text-stone-400 text-sm mb-8">
            <Zap size={14} />
            One click. Everything configured.
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Launch Your Business
            <span className="block bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
              in 5 Minutes
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Pick your business type. We&apos;ll set up everything — website, booking,
            invoicing, email marketing, and social media — all configured and ready to go.
          </p>
        </div>
      </section>

      {/* Kit Grid */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-sm uppercase tracking-[3px] text-stone-400/60 mb-8 text-center">
            Choose Your Business
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BUSINESS_KITS.map((kit) => (
              <div
                key={kit.id}
                onMouseEnter={() => setHoveredKit(kit.id)}
                onMouseLeave={() => setHoveredKit(null)}
                className={`relative group p-6 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-stone-500/30 hover:bg-white/[0.05] ${
                  hoveredKit === kit.id ? "shadow-lg shadow-stone-500/10" : ""
                }`}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-500/20 to-stone-500/20 flex items-center justify-center text-stone-400 mb-4">
                  {ICON_MAP[kit.icon] || <Rocket size={24} />}
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold mb-1">{kit.name}</h3>
                <p className="text-sm text-stone-400/80 mb-3">{kit.tagline}</p>

                {/* Services */}
                <div className="space-y-2 mb-6">
                  {kit.services.map((service) => (
                    <div key={service.name} className="flex items-center gap-2 text-sm text-gray-400">
                      <Check size={14} className="text-stone-400 shrink-0" />
                      <span>{service.name}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={`/builder?kit=${kit.id}`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 text-white text-sm font-semibold hover:from-stone-500 hover:to-stone-500 transition-all group-hover:shadow-lg group-hover:shadow-stone-500/20"
                >
                  Get Started
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need,{" "}
              <span className="bg-gradient-to-r from-stone-400 to-stone-400 bg-clip-text text-transparent">
                Already Set Up
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Each starter kit comes with 5-6 fully configured services. No setup, no integrations, no headaches.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHAT_YOU_GET.map((item) => (
              <div
                key={item.title}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-stone-500/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-stone-500/10 flex items-center justify-center text-stone-400 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Replace Your Stack */}
      <section className="py-16 md:py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stop Paying for 6 Different Tools
            </h2>
            <p className="text-gray-400">
              Replace ${totalReplaced}/month in subscriptions with one platform.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10">
            <div className="space-y-4 mb-8">
              {REPLACED_TOOLS.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-stone-400/60 line-through text-sm">{tool.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                      {tool.category}
                    </span>
                  </div>
                  <span className="text-stone-400/60 line-through text-sm">{tool.price}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <div className="text-sm text-white/50">Total replaced</div>
                <div className="text-2xl font-bold text-stone-400 line-through">${totalReplaced}/mo</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-stone-400">Zoobicon Pro</div>
                <div className="text-2xl font-bold text-stone-400">$49/mo</div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-stone-500/10 border border-stone-500/20 text-center">
              <span className="text-stone-400 font-semibold">
                Save ${totalReplaced - 49}/month — that&apos;s ${(totalReplaced - 49) * 12}/year
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Sparkles size={32} className="text-stone-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Launch?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Pick a starter kit above, or build from scratch in the builder.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/builder"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 text-white font-semibold hover:from-stone-500 hover:to-stone-500 transition-all shadow-lg shadow-stone-500/20"
            >
              Open Builder
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
