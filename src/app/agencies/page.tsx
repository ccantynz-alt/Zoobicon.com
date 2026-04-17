"use client";

import Link from "next/link";
import {
  Users,
  Palette,
  ArrowRight,
  Layers,
  Crown,
  Briefcase,
  Check,
  Star,
  Workflow,
  FolderOpen,
  PaintBucket,
  UserPlus,
  FileText,
  TrendingUp,
  Lock,
  BadgeCheck,
  Building2,
} from "lucide-react";

const WHITE_LABEL_FEATURES = [
  { icon: PaintBucket, title: "Your Brand, Everywhere", desc: "Custom logo, colors, domain, emails — your clients never see Zoobicon. It's 100% your platform." },
  { icon: Users, title: "Unlimited Client Seats", desc: "Invite every client to their own workspace. Each gets their own dashboard, projects, and analytics." },
  { icon: Crown, title: "Resell at Your Price", desc: "Set your own pricing. Charge $99, $299, or $999/month per client. Keep 100% of the markup." },
  { icon: Lock, title: "Client Isolation", desc: "Complete data isolation between clients. Each workspace is a sandboxed environment." },
  { icon: FileText, title: "Custom Proposals", desc: "AI generates client proposals with your branding. Project scopes, timelines, and pricing — all automated." },
  { icon: Workflow, title: "Approval Workflows", desc: "Built-in approval flows. Clients review, comment, and approve designs before publishing." },
];

const AGENCY_TOOLS = [
  {
    title: "Bulk Website Generation",
    desc: "Generate 50+ client websites simultaneously. Upload a CSV with client details and let AI handle the rest.",
    stat: "50x faster",
    icon: Layers,
  },
  {
    title: "Client Dashboard",
    desc: "Each client gets their own branded portal to view their sites, SEO reports, and video content.",
    stat: "∞ clients",
    icon: FolderOpen,
  },
  {
    title: "Team Collaboration",
    desc: "Assign designers, developers, and managers to projects. Role-based access control with audit logs.",
    stat: "Unlimited seats",
    icon: UserPlus,
  },
  {
    title: "SEO Campaign Management",
    desc: "Run SEO campaigns across all clients from one dashboard. AI agents work 24/7 on every account.",
    stat: "Autonomous",
    icon: TrendingUp,
  },
];

const TESTIMONIALS = [
  { name: "Sarah K.", role: "Agency Owner", text: "We went from 5 websites a month to 50. Zoobicon literally 10x'd our output.", stars: 5 },
  { name: "Marcus T.", role: "Digital Director", text: "The white-label platform let us launch our own SaaS without writing a line of code.", stars: 5 },
  { name: "Lisa M.", role: "Freelance Designer", text: "I use Zoobicon for every client project now. The AI editor saves me hours of revision time.", stars: 5 },
];

const TIERS = [
  {
    name: "Agency Starter",
    price: "$149",
    period: "/mo",
    desc: "Perfect for freelancers and small agencies",
    features: [
      "Up to 10 client workspaces",
      "White-label branding",
      "100 sites/month",
      "SEO Agent (5 campaigns)",
      "Priority email support",
      "Custom domain",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Agency Pro",
    price: "$399",
    period: "/mo",
    desc: "For growing agencies that need scale",
    features: [
      "Unlimited client workspaces",
      "Full white-label platform",
      "Unlimited site generation",
      "Unlimited SEO campaigns",
      "AI Video Creator",
      "Bulk generation (CSV upload)",
      "Team roles & permissions",
      "Priority chat support",
      "API access",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large agencies and franchises",
    features: [
      "Everything in Agency Pro",
      "Custom AI model training",
      "Dedicated infrastructure",
      "99.99% SLA guarantee",
      "Custom integrations",
      "Dedicated account manager",
      "On-boarding & training",
      "Invoiced billing",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const HERO_STATS = [
  { value: "50x", label: "Faster delivery" },
  { value: "100%", label: "Your branding" },
  { value: "$0", label: "Per client seat" },
  { value: "24/7", label: "AI agents working" },
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

export default function AgenciesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Zoobicon for Agencies",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "149",
      "highPrice": "399",
      "priceCurrency": "USD",
      "offerCount": "3"
    },
    "description": "White-label AI platform for agencies. Generate client websites in bulk, run autonomous SEO campaigns, and scale to 100+ clients without hiring.",
    "url": "https://zoobicon.com/agencies",
    "screenshot": "https://zoobicon.com/og-image.png"
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Agencies", "item": "https://zoobicon.com/agencies" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white fs-grain pt-[72px]">
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
            <Building2 className="w-3 h-3" />
            Built for agencies · White-label platform · Unlimited seats
          </div>

          <h1 className="fs-display-xl mb-6">
            Your agency.{" "}
            <span style={SERIF}>supercharged by AI.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            White-label the most advanced AI platform under your brand. Generate client websites in bulk,
            run autonomous SEO campaigns, and scale your agency to 100+ clients without hiring.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["White-label", "Unlimited clients", "Bulk generation", "SEO agents", "Team roles", "Priority support"].map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/60"
              >
                <Check className="w-3 h-3" style={{ color: "#E8D4B0" }} />
                {pill}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              Start 14-Day Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="mailto:sales@zoobicon.com?subject=Agency Demo Request"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Briefcase className="w-4 h-4" />
              Book a Demo
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {HERO_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[20px] border border-white/[0.08] p-5 text-center"
                style={{ background: CARD_BG }}
              >
                <div className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-1" style={{ color: "#E8D4B0" }}>
                  {stat.value}
                </div>
                <div className="text-[12px] text-white/55">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* White Label */}
      <section id="white-label" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              <Palette className="w-3 h-3" />
              White label platform
            </div>
            <h2 className="fs-display-lg mb-4">
              Your platform.{" "}
              <span style={SERIF}>your rules.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Rebrand Zoobicon as your own AI platform. Your logo, your colors, your domain. Clients will think you built it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WHITE_LABEL_FEATURES.map((f) => (
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

      {/* Agency Tools */}
      <section id="tools" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Agency tools
            </div>
            <h2 className="fs-display-lg mb-4">
              Scale without{" "}
              <span style={SERIF}>hiring.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Run a 100-client agency with a team of three. Automation handles everything the senior staff used to burn hours on.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {AGENCY_TOOLS.map((tool) => (
              <div
                key={tool.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                      <tool.icon className="h-5 w-5 text-[#E8D4B0]" />
                    </div>
                    <span
                      className="rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: "#E8D4B0" }}
                    >
                      {tool.stat}
                    </span>
                  </div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-2">{tool.title}</h3>
                  <p className="text-[14px] text-white/55 leading-relaxed">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[480px] w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.06), transparent 70%)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              <BadgeCheck className="w-3 h-3" />
              Loved by agencies
            </div>
            <h2 className="fs-display-lg mb-4">
              Agencies{" "}
              <span style={SERIF}>love us.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4" style={{ color: "#E8D4B0", fill: "#E8D4B0" }} />
                  ))}
                </div>
                <p className="text-[14px] text-white/70 leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="pt-4 border-t border-white/[0.06]">
                  <div className="text-[14px] font-semibold text-white">{t.name}</div>
                  <div className="text-[12px] text-white/50">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
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
              Agency{" "}
              <span style={SERIF}>pricing.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              14-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-[24px] p-7 transition-all duration-500 hover:-translate-y-1 ${
                  tier.featured ? "border-2 border-[#E8D4B0]/35" : "border border-white/[0.08] hover:border-[#E8D4B0]/25"
                }`}
                style={{
                  background: tier.featured
                    ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(17,17,24,0.85) 100%)"
                    : CARD_BG,
                }}
              >
                {tier.featured && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)", color: "#0a0a0f" }}
                  >
                    Most popular
                  </div>
                )}
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>{tier.price}</span>
                  {tier.period && <span className="text-[13px] text-white/50">{tier.period}</span>}
                </div>
                <p className="text-[13px] text-white/55 mb-6">{tier.desc}</p>
                <ul className="space-y-2.5 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-white/65">
                      <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#E8D4B0" }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {tier.cta === "Contact Sales" ? (
                  <a
                    href="mailto:sales@zoobicon.com?subject=Agency Enterprise Inquiry"
                    className="block text-center rounded-full py-3 text-[13px] font-semibold transition-all border border-white/[0.12] bg-white/[0.03] text-white/80 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <Link
                    href="/auth/signup"
                    className={`block text-center rounded-full py-3 text-[13px] font-semibold transition-all ${
                      tier.featured ? "" : "border border-white/[0.12] bg-white/[0.03] text-white/80 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                    }`}
                    style={tier.featured ? PRIMARY_CTA : undefined}
                  >
                    {tier.cta}
                  </Link>
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
          <h2 className="fs-display-lg mb-5">
            Ready to scale{" "}
            <span style={SERIF}>your agency?</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            Join hundreds of agencies using Zoobicon to 10x their output.
          </p>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={PRIMARY_CTA}
          >
            Start 14-Day Free Trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Cancel anytime</span>
          </div>
        </div>
      </section>
    </div>
  );
}
