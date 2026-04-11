"use client";

import Link from "next/link";
import {
  Globe,
  ArrowRight,
  Shield,
  Lock,
  Image as ImageIcon,
  BarChart3,
  GitBranch,
  Terminal,
  Upload,
  Sparkles,
  RefreshCw,
  Clock,
  Gauge,
  Network,
  FileCode,
  Check,
  Minus,
  Cpu,
  Workflow,
  Layers,
  BadgeCheck,
} from "lucide-react";

const SPEED_STATS = [
  { value: "50ms", label: "Global edge latency" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "300+", label: "Edge locations" },
  { value: "0s", label: "Auto-scaling" },
];

const COMPETITOR_FEATURES = [
  { name: "AI Website Generation", zoobicon: true, siteground: false, cloudflare: false, vercel: false, netlify: false },
  { name: "Auto-Debugging", zoobicon: true, siteground: false, cloudflare: false, vercel: false, netlify: false },
  { name: "Global CDN", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "Automatic SSL", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "Custom Domains", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "Edge Functions", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
  { name: "DDoS Protection", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: false },
  { name: "Image Optimization", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: false },
  { name: "Analytics Dashboard", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "DNS Management", zoobicon: true, siteground: true, cloudflare: true, vercel: true, netlify: true },
  { name: "WordPress Export", zoobicon: true, siteground: true, cloudflare: false, vercel: false, netlify: false },
  { name: "Staging Environments", zoobicon: true, siteground: true, cloudflare: false, vercel: true, netlify: true },
  { name: "Instant Rollbacks", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
  { name: "CLI Deployment", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
  { name: "GitHub Integration", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
  { name: "Free Tier", zoobicon: true, siteground: false, cloudflare: true, vercel: true, netlify: true },
];

const HOSTING_FEATURES = [
  { icon: Globe, title: "Global CDN", desc: "300+ edge locations. Your site loads in under 50ms worldwide." },
  { icon: Lock, title: "Automatic SSL", desc: "Free SSL certificates, auto-renewed. HTTPS everywhere." },
  { icon: Shield, title: "DDoS Protection", desc: "Enterprise-grade protection included on every plan." },
  { icon: RefreshCw, title: "Smart Caching", desc: "Intelligent cache invalidation. Always fresh content." },
  { icon: ImageIcon, title: "Image Optimization", desc: "Auto WebP/AVIF conversion. 60% smaller images." },
  { icon: FileCode, title: "Brotli Compression", desc: "Next-gen compression. 20% smaller than gzip." },
  { icon: Cpu, title: "Edge Computing", desc: "Run serverless functions at the edge. Zero cold starts." },
  { icon: Layers, title: "Staging Environments", desc: "Test before you deploy. Preview URLs for every change." },
  { icon: Clock, title: "Instant Rollbacks", desc: "One-click rollback to any previous deployment." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time visitors, bandwidth, performance scores." },
  { icon: Network, title: "DNS Management", desc: "Full DNS zone editor with proxied records." },
  { icon: Workflow, title: "WAF & Security", desc: "Web Application Firewall with managed rulesets." },
];

const DEPLOY_METHODS = [
  { icon: Sparkles, title: "AI Builder", desc: "Describe → Generate → Deploy. Your site goes live in 60 seconds." },
  { icon: Terminal, title: "CLI", desc: "Deploy from your terminal in one command." },
  { icon: GitBranch, title: "GitHub", desc: "Push to main, auto-deploy. Zero-config CI/CD." },
  { icon: Upload, title: "Drag & Drop", desc: "Upload your HTML / CSS / JS files directly." },
];

const LIGHTHOUSE_SCORES = [
  { label: "Performance", score: 100 },
  { label: "Accessibility", score: 100 },
  { label: "Best Practices", score: 100 },
  { label: "SEO", score: 100 },
];

const CORE_VITALS = [
  { metric: "LCP", value: "< 1s", label: "Largest Contentful Paint" },
  { metric: "FID", value: "< 50ms", label: "First Input Delay" },
  { metric: "CLS", value: "< 0.05", label: "Cumulative Layout Shift" },
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for personal projects and experiments.",
    features: ["1 site", "1GB storage", "10GB/mo bandwidth", ".zoobicon.sh subdomain", "Shared SSL", "Community support"],
    cta: "Get started free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    description: "For professionals and growing businesses.",
    features: ["10 sites", "25GB storage", "100GB/mo bandwidth", "Custom domains", "Dedicated SSL", "Global CDN", "Analytics dashboard", "Email support"],
    cta: "Start Pro trial",
    highlighted: false,
  },
  {
    name: "Business",
    price: "$49",
    period: "/mo",
    description: "For teams that need advanced features.",
    features: ["50 sites", "100GB storage", "500GB/mo bandwidth", "WAF protection", "Staging environments", "Priority support", "Advanced analytics", "Team collaboration"],
    cta: "Start Business trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "/mo",
    description: "Unlimited everything. White-glove service.",
    features: ["Unlimited sites", "Unlimited storage", "Unlimited bandwidth", "99.99% SLA", "Dedicated infrastructure", "24/7 phone support", "Custom edge rules", "SOC 2 compliance"],
    cta: "Contact sales",
    highlighted: false,
  },
];

const MIGRATION_FEATURES = [
  { icon: Upload, title: "One-Click Import", desc: "Import your existing site from any provider with a single click." },
  { icon: Network, title: "Automatic DNS Transfer", desc: "We handle the DNS migration seamlessly. Zero manual config." },
  { icon: Clock, title: "Zero-Downtime Migration", desc: "Your site stays live throughout the entire migration process." },
  { icon: Sparkles, title: "Free Migration Assistance", desc: "Our team handles the migration for you, free of charge." },
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

export default function HostingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Zoobicon Hosting",
    "applicationCategory": "WebApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "149",
      "priceCurrency": "USD",
      "offerCount": "4"
    },
    "description": "Deploy AI-generated websites instantly to zoobicon.sh with global CDN, automatic SSL, custom domains, DDoS protection, and 99.99% uptime.",
    "url": "https://zoobicon.com/products/hosting",
    "screenshot": "https://zoobicon.com/og-image.png"
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://zoobicon.com/products" },
      { "@type": "ListItem", "position": 3, "name": "Hosting", "item": "https://zoobicon.com/products/hosting" }
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
            <BadgeCheck className="w-3 h-3" />
            300+ edge locations · 99.99% SLA · Auto-scaling
          </div>

          <h1 className="fs-display-xl mb-6">
            Web hosting that{" "}
            <span style={SERIF}>keeps up.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            AI-powered hosting with global CDN, automatic SSL, edge caching, and a 99.99% uptime
            guarantee. Deploy in seconds. Scale to millions.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["Global CDN", "Auto SSL", "Edge Functions", "DDoS Protection", "Smart Caching", "Instant Rollbacks"].map((pill) => (
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
              Deploy your first site free
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

      {/* Speed stats */}
      <section className="relative py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {SPEED_STATS.map((stat) => (
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

      {/* Competitor comparison */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
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
              The only hosting platform with AI generation, auto-debugging, and a full suite of infrastructure tools.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-white/[0.08]" style={{ background: CARD_BG }}>
            <div className="min-w-[820px]">
              <div className="grid grid-cols-6 px-6 py-4 border-b border-white/[0.08] text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55">
                <div>Feature</div>
                <div className="text-center" style={{ color: "#E8D4B0" }}>Zoobicon</div>
                <div className="text-center">SiteGround</div>
                <div className="text-center">Cloudflare</div>
                <div className="text-center">Vercel</div>
                <div className="text-center">Netlify</div>
              </div>
              {COMPETITOR_FEATURES.map((feature, i) => (
                <div
                  key={feature.name}
                  className={`grid grid-cols-6 px-6 py-4 text-[13px] ${
                    i !== COMPETITOR_FEATURES.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <div className="text-white/75 font-medium">{feature.name}</div>
                  <div className="text-center">
                    {feature.zoobicon ? <Check className="w-4 h-4 mx-auto" style={{ color: "#E8D4B0" }} /> : <Minus className="w-4 h-4 mx-auto text-white/25" />}
                  </div>
                  {[feature.siteground, feature.cloudflare, feature.vercel, feature.netlify].map((has, j) => (
                    <div key={j} className="text-center">
                      {has ? <Check className="w-4 h-4 mx-auto text-white/55" /> : <Minus className="w-4 h-4 mx-auto text-white/25" />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-white/30 mt-4 text-center">
            Comparison based on publicly available information. Features and pricing may change.
            All trademarks belong to their respective owners. See our{" "}
            <Link href="/disclaimers" className="underline hover:text-white/55">disclaimers</Link>.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Infrastructure
            </div>
            <h2 className="fs-display-lg mb-4">
              Infrastructure that{" "}
              <span style={SERIF}>just works.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Enterprise-grade hosting features on every plan. No surprises, no hidden limits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {HOSTING_FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
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

      {/* Deploy methods */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="fs-display-lg mb-4">
              Deploy{" "}
              <span style={SERIF}>your way.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Four ways to go live. Pick the one that fits your workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {DEPLOY_METHODS.map((m) => (
              <div
                key={m.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05] flex-shrink-0">
                    <m.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-1.5">{m.title}</h3>
                    <p className="text-[14px] text-white/55 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance showcase */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="fs-display-lg mb-4">
              Performance that{" "}
              <span style={SERIF}>speaks for itself.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Faster than 99% of websites. Every metric, green.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-[28px] border border-white/[0.08] p-8" style={{ background: CARD_BG }}>
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-6" style={{ color: "rgba(232,212,176,0.75)" }}>
                Lighthouse scores
              </div>
              <div className="grid grid-cols-2 gap-6">
                {LIGHTHOUSE_SCORES.map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/[0.05]" />
                        <circle cx="50" cy="50" r="42" stroke="#E8D4B0" strokeWidth="6" fill="none"
                          strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset="0" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-semibold" style={{ color: "#E8D4B0" }}>{item.score}</span>
                      </div>
                    </div>
                    <span className="text-[13px] text-white/65">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.08] p-8" style={{ background: CARD_BG }}>
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-6" style={{ color: "rgba(232,212,176,0.75)" }}>
                Core Web Vitals
              </div>
              <div className="space-y-4">
                {CORE_VITALS.map((v) => (
                  <div key={v.metric} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[15px] font-semibold text-white">{v.metric}</span>
                        <span className="text-[10px] uppercase tracking-wide rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05] px-2 py-0.5 font-semibold" style={{ color: "#E8D4B0" }}>Good</span>
                      </div>
                      <span className="text-[12px] text-white/55">{v.label}</span>
                    </div>
                    <div className="text-xl font-semibold" style={{ color: "#E8D4B0" }}>{v.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] p-4 text-center">
                <Gauge className="w-5 h-5 mx-auto mb-2" style={{ color: "#E8D4B0" }} />
                <p className="text-[13px] font-semibold" style={{ color: "#E8D4B0" }}>Faster than 99% of websites</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Pricing
            </div>
            <h2 className="fs-display-lg mb-4">
              Simple, transparent{" "}
              <span style={SERIF}>pricing.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Start free. Scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
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
                  <span className="text-4xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>{tier.price}</span>
                  {tier.period && <span className="text-[13px] text-white/50">{tier.period}</span>}
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
                  href={tier.price === "Free" ? "/builder" : "/auth/signup"}
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

      {/* Migration */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Easy migration
            </div>
            <h2 className="fs-display-lg mb-4">
              Moving from SiteGround{" "}
              <span style={SERIF}>or Cloudflare?</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Switch to Zoobicon Hosting in minutes. We handle everything.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {MIGRATION_FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 text-center transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                  <f.icon className="h-5 w-5 text-[#E8D4B0]" />
                </div>
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{f.title}</h3>
                <p className="text-[13px] text-white/55 leading-relaxed">{f.desc}</p>
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
            Deploy your first site{" "}
            <span style={SERIF}>free.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            No credit card required. Zero to live in under 60 seconds.
          </p>
          <Link
            href="/builder"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={PRIMARY_CTA}
          >
            Deploy now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Free subdomain</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Deploy in seconds</span>
          </div>
        </div>
      </section>
    </div>
  );
}
