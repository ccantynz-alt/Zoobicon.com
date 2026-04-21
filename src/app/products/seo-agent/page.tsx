"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  TrendingUp,
  FileText,
  Link2,
  BarChart3,
  Target,
  Brain,
  Clock,
  Shield,
  Globe,
  BadgeCheck,
} from "lucide-react";

const CAPABILITIES = [
  { icon: Brain, title: "Keyword Discovery", desc: "AI analyzes your niche, competitors, and market gaps to find the highest-value keywords you should own." },
  { icon: FileText, title: "Content Generation", desc: "Autonomously writes and publishes SEO-optimized articles, blog posts, and landing pages that rank." },
  { icon: Link2, title: "Backlink Outreach", desc: "Identifies high-authority link opportunities and sends personalized outreach — all automated." },
  { icon: Target, title: "Technical SEO Audit", desc: "Crawls your entire site. Finds broken links, slow pages, missing meta tags, schema errors, and fixes them." },
  { icon: BarChart3, title: "Rank Tracking", desc: "Daily rank monitoring across Google, Bing, and YouTube. Alerts when positions change." },
  { icon: TrendingUp, title: "Competitor Intelligence", desc: "Monitors competitor rankings, backlinks, content strategy, and ad spend. Find their gaps, exploit them." },
  { icon: Clock, title: "24/7 Autonomous", desc: "The agent never sleeps. It continuously optimizes, publishes, outreaches, and reports — every single day." },
  { icon: Shield, title: "White-Hat Only", desc: "100% Google-compliant strategies. No black hat, no PBNs, no risk. Sustainable growth that lasts." },
  { icon: Globe, title: "Multi-Language", desc: "SEO campaigns in 30+ languages. Localized content, hreflang tags, and geo-targeting built in." },
];

const AGENT_WORKFLOW = [
  { phase: "Discovery", desc: "Agent analyzes your domain, identifies top competitors, maps keyword landscape, finds content gaps.", time: "Hour 1" },
  { phase: "Strategy", desc: "Creates a ranked priority list of keywords, content plan with titles and outlines, technical fixes needed.", time: "Hour 2" },
  { phase: "Execution", desc: "Writes content, fixes technical issues, starts backlink outreach, optimizes existing pages.", time: "Day 1-7" },
  { phase: "Monitoring", desc: "Tracks rankings daily, adjusts strategy based on results, sends weekly performance reports.", time: "Ongoing" },
  { phase: "Scaling", desc: "Expands keyword targets, scales content production, increases backlink velocity as authority grows.", time: "Month 2+" },
];

const STATS = [
  { value: "24/7", label: "Autonomous operation" },
  { value: "300%", label: "Avg. traffic increase" },
  { value: "30+", label: "Languages supported" },
  { value: "0", label: "Manual work required" },
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

export default function SEOAgentPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Zoobicon AI SEO Agent",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": { "@type": "AggregateOffer", "lowPrice": "0", "highPrice": "99", "priceCurrency": "USD", "offerCount": "4" },
    "description": "Autonomous AI SEO agent that discovers keywords, writes content, builds backlinks, and tracks rankings 24/7.",
    "url": "https://zoobicon.com/products/seo-agent",
    "screenshot": "https://zoobicon.com/og-image.png"
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://zoobicon.com/products" },
      { "@type": "ListItem", "position": 3, "name": "SEO Agent", "item": "https://zoobicon.com/products/seo-agent" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#060e1f] text-white fs-grain pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

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
            <Bot className="w-3 h-3" />
            Autonomous AI agent · Runs 24/7
          </div>

          <h1 className="fs-display-xl mb-6">
            SEO on{" "}
            <span style={SERIF}>autopilot.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            An autonomous AI agent that researches, plans, and executes your entire SEO strategy
            24/7. Content creation, backlink outreach, technical audits — all handled while you sleep.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <Link
              href="/seo"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              Launch SEO dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              See pricing
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[20px] border border-white/[0.08] p-5 text-center"
                style={{ background: CARD_BG }}
              >
                <div className="text-[28px] font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>{stat.value}</div>
                <div className="text-[12px] text-white/55 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              The loop
            </div>
            <h2 className="fs-display-lg mb-4">
              How the agent{" "}
              <span style={SERIF}>works.</span>
            </h2>
            <p className="text-[15px] text-white/55">Set it and forget it. The agent handles everything.</p>
          </div>

          <div className="space-y-4">
            {AGENT_WORKFLOW.map((step) => (
              <div
                key={step.phase}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.06), transparent 70%)" }} />
                <div className="relative flex items-start gap-6">
                  <div
                    className="flex-shrink-0 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05] px-3 py-1.5 text-[10px] uppercase tracking-[0.15em] font-semibold"
                    style={{ color: "#E8D4B0" }}
                  >
                    {step.time}
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-1.5">{step.phase}</h3>
                    <p className="text-[14px] text-white/55 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Full capabilities
            </div>
            <h2 className="fs-display-lg mb-4">
              Nine disciplines.{" "}
              <span style={SERIF}>One agent.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CAPABILITIES.map((c) => (
              <div
                key={c.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <c.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-2">{c.title}</h3>
                  <p className="text-[14px] text-white/55 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.1), transparent 70%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
            <BadgeCheck className="w-3 h-3" />
            2 minutes to launch
          </div>
          <h2 className="fs-display-lg mb-5">
            Stop doing SEO.{" "}
            <span style={SERIF}>Let AI do it.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            Launch your first autonomous SEO campaign in under two minutes.
          </p>
          <Link
            href="/seo"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={PRIMARY_CTA}
          >
            Launch SEO dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
