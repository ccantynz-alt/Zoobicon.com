import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Code, Key, Zap, Shield, ArrowRight, Check } from "lucide-react";

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export const metadata = {
  title: "Developers — Zoobicon API",
  description:
    "Real domains. Real video. Real websites. One API key. Build production apps on the Zoobicon platform API.",
};

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  description: string;
  snippet: string;
  icon: typeof Code;
};

const endpoints: Endpoint[] = [
  { method: "POST", path: "/api/v1/sites", description: "Generate a complete React site from a single prompt.", snippet: `{ "prompt": "saas landing for a dog walking app" }`, icon: Rocket },
  { method: "POST", path: "/api/v1/generate", description: "Lower-level generation endpoint with model + agent control.", snippet: `{ "prompt": "...", "model": "claude-opus-4-6" }`, icon: Code },
  { method: "POST", path: "/api/v1/deploy", description: "Deploy a generated site to a live zoobicon.sh subdomain.", snippet: `{ "siteId": "abc123", "slug": "my-site" }`, icon: Rocket },
  { method: "POST", path: "/api/v1/video/generate", description: "Produce a talking-avatar video from a script. Fish Speech + OmniHuman.", snippet: `{ "script": "Hello world" }`, icon: Video },
  { method: "POST", path: "/api/v1/transcribe", description: "Speech-to-text transcription with speaker diarization.", snippet: `{ "audioUrl": "https://..." }`, icon: Activity },
  { method: "GET", path: "/api/v1/status", description: "Health check, quota usage and rate-limit headers.", snippet: `// returns { ok, plan, used, limit }`, icon: Activity },
  { method: "POST", path: "/api/v1/storage/upload", description: "Upload a file to managed object storage.", snippet: `multipart/form-data: file=@image.png`, icon: Database },
  { method: "GET", path: "/api/v1/storage/buckets", description: "List your project's storage buckets and usage.", snippet: `// returns Bucket[]`, icon: Database },
  { method: "GET", path: "/api/v1/esim/plans", description: "List available eSIM data plans across 190+ countries.", snippet: `?country=JP`, icon: Signal },
  { method: "POST", path: "/api/v1/esim/purchase", description: "Purchase and provision an eSIM for a customer.", snippet: `{ "planId": "jp-5gb" }`, icon: Signal },
  { method: "GET", path: "/api/v1/esim/usage", description: "Real-time data usage for an active eSIM.", snippet: `?iccid=89014...`, icon: Signal },
  { method: "POST", path: "/api/v1/esim/topup", description: "Add data to an existing active eSIM.", snippet: `{ "iccid": "...", "gb": 5 }`, icon: Signal },
  { method: "GET", path: "/api/v1/vpn/plans", description: "List WireGuard VPN plans and regions.", snippet: `// returns Plan[]`, icon: Wifi },
  { method: "POST", path: "/api/v1/vpn/provision", description: "Provision a WireGuard VPN config for a customer.", snippet: `{ "region": "us-west" }`, icon: Wifi },
  { method: "GET", path: "/api/v1/vpn/status", description: "Connection status and bandwidth usage.", snippet: `?sessionId=...`, icon: Wifi },
  { method: "GET", path: "/api/v1/booking/services", description: "List bookable services for a calendar account.", snippet: `// returns Service[]`, icon: Calendar },
  { method: "GET", path: "/api/v1/booking/availability", description: "Open time slots for a service over a date range.", snippet: `?serviceId=...&from=2026-04-10`, icon: Calendar },
  { method: "POST", path: "/api/v1/booking/appointments", description: "Create a booking and trigger confirmation email.", snippet: `{ "serviceId": "...", "start": "..." }`, icon: Calendar },
  { method: "POST", path: "/api/v1/wordpress/generate", description: "Generate WordPress post content from a brief.", snippet: `{ "topic": "...", "tone": "expert" }`, icon: FileText },
  { method: "POST", path: "/api/v1/wordpress/seo", description: "Audit and rewrite a page for on-page SEO.", snippet: `{ "url": "..." }`, icon: FileText },
  { method: "POST", path: "/api/v1/wordpress/site-audit", description: "Full crawl-based site audit with prioritized fixes.", snippet: `{ "domain": "example.com" }`, icon: FileText },
  { method: "POST", path: "/api/v1/wordpress/translate", description: "Translate content into 50+ languages with tone preservation.", snippet: `{ "text": "...", "to": "ja" }`, icon: Globe },
];

const limits = [
  { plan: "Free", quota: "100 requests / day", price: "$0" },
  { plan: "Pro", quota: "10,000 requests / day", price: "$49 / mo" },
  { plan: "Agency", quota: "100,000 requests / day", price: "$299 / mo" },
  { plan: "Enterprise", quota: "Unlimited + dedicated capacity", price: "Custom" },
];

const QUICKSTART_FEATURES = [
  "HMAC bearer auth — no OAuth dance",
  "JSON in, JSON out — no SDK required",
  "Streaming SSE available on every endpoint",
  "99.95% uptime SLA on Pro and above",
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Try every endpoint. No credit card.",
    rate: "10 requests / min",
    features: ["Standard tier generation", "Deploy to zoobicon.sh", "Community support", "1 API key"],
    cta: "Get started",
    href: "/auth/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$79",
    period: "/mo",
    description: "For production apps at scale.",
    rate: "60 requests / min",
    features: ["Premium tier generation", "43 specialized generators", "White-label branding", "Webhook callbacks", "Priority support"],
    cta: "Start Pro",
    href: "/pricing",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Dedicated capacity and SLA.",
    rate: "600 requests / min",
    features: ["Dedicated rate limits", "Custom model routing", "SLA guarantee", "Agency bulk generation", "24/7 support"],
    cta: "Contact sales",
    href: "mailto:sales@zoobicon.com?subject=Enterprise API Inquiry",
    highlighted: false,
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

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold"
      style={{
        borderColor: "rgba(232,212,176,0.25)",
        background: "rgba(232,212,176,0.06)",
        color: "#E8D4B0",
      }}
    >
      {method}
    </span>
  );
}

export default function DevelopersPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebAPI",
    "name": "Zoobicon Platform API",
    "description":
      "Real domains. Real video. Real websites. One API key. Build production apps on the Zoobicon platform API.",
    "url": "https://zoobicon.com/developers",
    "provider": {
      "@type": "Organization",
      "name": "Zoobicon",
      "url": "https://zoobicon.com",
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "299",
      "priceCurrency": "USD",
      "offerCount": "4",
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Developers", "item": "https://zoobicon.com/developers" },
    ],
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white fs-grain pt-[72px]">
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
            <ShieldCheck className="w-3 h-3" />
            Public API v1 — production ready
          </div>

          <h1 className="fs-display-xl mb-6">
            Build with{" "}
            <span style={SERIF}>Zoobicon.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            Real domains. Real video. Real websites. One API key. The same infrastructure that powers
            Zoobicon.com — exposed to your code in a single REST surface.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["Sites", "Video", "Domains", "eSIM", "VPN", "Storage", "Booking", "WordPress"].map((pill) => (
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
              href="/pricing"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              <Key className="w-4 h-4" />
              Get API key
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#quickstart"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Code className="w-4 h-4" />
              Read docs
            </a>
          </div>
        </div>
      </section>

      {/* Quick start */}
      <section id="quickstart" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
                Quick start
              </div>
              <h2 className="fs-display-lg mb-5">
                Generate a site{" "}
                <span style={SERIF}>in one curl.</span>
              </h2>
              <p className="text-[15px] text-white/60 leading-relaxed max-w-md mb-8">
                Send a prompt, get back a fully-built React site object with files, dependencies and a
                deploy URL. Average response: 28 seconds end-to-end.
              </p>
              <ul className="space-y-3">
                {QUICKSTART_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-start gap-3 text-[14px] text-white/70">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#E8D4B0" }} />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="relative overflow-hidden rounded-[24px] border border-white/[0.08]"
              style={{ background: CARD_BG }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(232,212,176,0.5)" }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(232,212,176,0.3)" }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "rgba(232,212,176,0.2)" }} />
                </div>
                <span className="font-mono text-[11px] text-white/45">POST /api/v1/sites</span>
              </div>
              <pre className="overflow-x-auto px-5 py-5 font-mono text-[12px] leading-relaxed text-white/80 bg-black/40">
                <code>
                  <span className="text-white/35">{"# Generate a complete React site\n"}</span>
                  <span style={{ color: "#E8D4B0" }}>curl</span>
                  {" -X "}
                  <span style={{ color: "#E8D4B0" }}>POST</span>
                  {" https://zoobicon.com/api/v1/sites \\\n"}
                  {"  -H "}
                  <span className="text-white/90">{'"Authorization: Bearer zbk_live_••••••"'}</span>
                  {" \\\n"}
                  {"  -H "}
                  <span className="text-white/90">{'"Content-Type: application/json"'}</span>
                  {" \\\n"}
                  {"  -d "}
                  <span className="text-white/90">{"'{\n"}</span>
                  <span style={{ color: "#E8D4B0" }}>{'    "prompt"'}</span>
                  <span className="text-white/90">{': "saas landing for a dog walking app",\n'}</span>
                  <span style={{ color: "#E8D4B0" }}>{'    "deploy"'}</span>
                  <span className="text-white/90">{": true\n  }'"}</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section id="endpoints" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Endpoints
            </div>
            <h2 className="fs-display-lg mb-4">
              {endpoints.length} production endpoints.{" "}
              <span style={SERIF}>Live today.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Each endpoint is rate-limited per key, signed with HMAC-SHA256 and returns standard JSON.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {endpoints.map((ep) => (
              <div
                key={ep.path}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
                />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                      <ep.icon className="h-5 w-5 text-[#E8D4B0]" />
                    </div>
                    <MethodBadge method={ep.method} />
                  </div>
                  <code className="block font-mono text-[12px] text-white/85 mb-3 truncate">{ep.path}</code>
                  <p className="text-[13px] text-white/55 leading-relaxed mb-4">{ep.description}</p>
                  <pre className="rounded-[12px] border border-white/[0.06] bg-black/40 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-white/70 overflow-x-auto">
                    {ep.snippet}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Usage pricing strip */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            className="relative overflow-hidden rounded-[32px] border border-white/[0.08] p-10 md:p-14"
            style={{ background: CARD_BG }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(circle at top right, rgba(232,212,176,0.1), transparent 55%)" }}
            />
            <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-5">
                  Usage pricing
                </div>
                <h2 className="fs-display-lg mb-4">
                  Pay only for{" "}
                  <span style={SERIF}>what you call.</span>
                </h2>
                <p className="max-w-lg text-[15px] text-white/60 leading-relaxed">
                  Bulk pricing kicks in at scale. Annual contracts get up to 60% off list. No idle
                  minimums.
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-4 lg:w-auto lg:grid-cols-4">
                {[
                  { label: "per site", price: "$0.10" },
                  { label: "per video", price: "$0.50" },
                  { label: "per domain check", price: "$0.05" },
                  { label: "per email send", price: "$0.01" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[16px] border border-white/[0.08] p-4 transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/25"
                    style={{ background: "rgba(10,10,15,0.6)" }}
                  >
                    <div className="font-mono text-2xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>
                      {item.price}
                    </div>
                    <div className="mt-1 text-[12px] text-white/55">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans + auth header */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Pricing
            </div>
            <h2 className="fs-display-lg mb-4">
              API pricing,{" "}
              <span style={SERIF}>simply put.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Start free. Pay only for what you use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-[24px] p-7 transition-all duration-500 hover:-translate-y-1 ${
                  tier.highlighted
                    ? "border-2 border-[#E8D4B0]/35"
                    : "border border-white/[0.08] hover:border-[#E8D4B0]/25"
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
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>
                    {tier.price}
                  </span>
                  {tier.period && <span className="text-[13px] text-white/50">{tier.period}</span>}
                </div>
                <div className="text-[12px] text-white/50 mb-4">{tier.rate}</div>
                <p className="text-[13px] text-white/55 mb-6">{tier.description}</p>
                <ul className="space-y-2.5 mb-7">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/65">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#E8D4B0" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {tier.href.startsWith("mailto:") ? (
                  <a
                    href={tier.href}
                    className="block text-center rounded-full py-3 text-[13px] font-semibold border border-white/[0.12] bg-white/[0.03] text-white/80 backdrop-blur transition-all hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <Link
                    href={tier.href}
                    className={`block text-center rounded-full py-3 text-[13px] font-semibold transition-all ${
                      tier.highlighted
                        ? ""
                        : "border border-white/[0.12] bg-white/[0.03] text-white/80 backdrop-blur hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                    }`}
                    style={tier.highlighted ? PRIMARY_CTA : undefined}
                  >
                    {tier.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Auth header example */}
          <div
            className="relative overflow-hidden rounded-[24px] border border-white/[0.08] max-w-3xl mx-auto"
            style={{ background: CARD_BG }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <div className="flex items-center gap-2 text-[11px] text-white/55">
                <Terminal className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} />
                Authorization header
              </div>
              <span className="font-mono text-[11px] text-white/45">HMAC-SHA256</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rate limits table */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              <Zap className="w-3 h-3" />
              Rate limits
            </div>
            <h2 className="fs-display-lg mb-4">
              Built for scale{" "}
              <span style={SERIF}>from request one.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Quotas that grow with your app. Upgrade any time — no contract resets.
            </p>
          </div>

          <div
            className="overflow-hidden rounded-[24px] border border-white/[0.08]"
            style={{ background: CARD_BG }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55">
                    <th className="px-7 py-5 font-medium">Plan</th>
                    <th className="px-7 py-5 font-medium">Rate limit</th>
                    <th className="px-7 py-5 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {limits.map((row, i) => (
                    <tr
                      key={row.plan}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        i !== limits.length - 1 ? "border-b border-white/[0.04]" : ""
                      }`}
                    >
                      <td className="px-7 py-5 text-[14px] font-semibold text-white">{row.plan}</td>
                      <td className="px-7 py-5 text-[13px] text-white/65">{row.quota}</td>
                      <td className="px-7 py-5 text-right font-mono text-[13px]" style={{ color: "#E8D4B0" }}>
                        {row.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            Start building{" "}
            <span style={SERIF}>today.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            Free key, 100 requests a day, no credit card. Upgrade when your traffic does.
          </p>
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={PRIMARY_CTA}
          >
            <Key className="w-4 h-4" />
            Get your API key
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} />
              100 free requests / day
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} />
              Streaming SSE
            </span>
          </div>
          <p className="mt-10 font-mono text-[11px] text-white/30">
            zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
          </p>
        </div>
      </section>
    </div>
  );
}
