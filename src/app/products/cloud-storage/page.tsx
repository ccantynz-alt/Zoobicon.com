"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Lock,
  HardDrive,
  Clock,
  Share2,
  Users,
  Code,
  FolderSync,
  Globe,
  Check,
  Minus,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Briefcase,
  Database,
} from "lucide-react";

const STORAGE_STATS = [
  { value: "AES-256", label: "End-to-end encryption" },
  { value: "99.99%", label: "Data durability" },
  { value: "$1.99", label: "Starting from /mo" },
  { value: "Auto", label: "Scheduled backups" },
];

const STORAGE_FEATURES = [
  { icon: Lock, title: "AES-256 Encryption", desc: "Military-grade encryption at rest and in transit. Your files are unreadable without your key." },
  { icon: Clock, title: "Version History", desc: "Every file change saved automatically. Restore any version from the last 90 days." },
  { icon: FolderSync, title: "Auto-Backup", desc: "Scheduled backups for your websites, databases, and local folders. Set it and forget it." },
  { icon: Share2, title: "File Sharing Links", desc: "Generate secure, expiring share links. Password-protect sensitive files." },
  { icon: Users, title: "Team Sharing", desc: "Invite team members with granular permissions. Read, write, or admin access per folder." },
  { icon: Code, title: "API Access", desc: "S3-compatible REST API. Integrate storage into any app with a few lines of code." },
];

const USE_CASES = [
  { icon: Globe, title: "Website Backups", desc: "Automatic nightly snapshots of your Zoobicon sites. One-click restore if anything goes wrong." },
  { icon: ImageIcon, title: "Media Assets", desc: "Store images, videos, and design files with CDN delivery. Serve assets globally at edge speed." },
  { icon: Briefcase, title: "Business Documents", desc: "Invoices, contracts, and records stored securely with audit trails and compliance-ready encryption." },
  { icon: Users, title: "Team Collaboration", desc: "Shared folders with real-time sync. Everyone works from the same source of truth." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create a Bucket", desc: "Name your storage bucket and choose your region. Takes 10 seconds." },
  { step: "02", title: "Upload Files", desc: "Drag and drop, CLI, or API. Upload files of any size with resumable transfers." },
  { step: "03", title: "Access Anywhere", desc: "Your files available on any device, any browser. Encrypted end-to-end." },
];

const COMPETITOR_FEATURES: Array<{
  name: string;
  zoobicon: boolean | string;
  dropbox: boolean | string;
  google: boolean | string;
  icloud: boolean | string;
  backblaze: boolean | string;
}> = [
  { name: "Price per GB/mo", zoobicon: "$0.20", dropbox: "$0.42", google: "$0.33", icloud: "$0.33", backblaze: "$0.50" },
  { name: "End-to-End Encryption", zoobicon: true, dropbox: false, google: false, icloud: true, backblaze: false },
  { name: "S3-Compatible API", zoobicon: true, dropbox: false, google: false, icloud: false, backblaze: true },
  { name: "Version History", zoobicon: true, dropbox: true, google: true, icloud: false, backblaze: true },
  { name: "File Sharing Links", zoobicon: true, dropbox: true, google: true, icloud: true, backblaze: false },
  { name: "Team Permissions", zoobicon: true, dropbox: true, google: true, icloud: false, backblaze: false },
  { name: "Auto Website Backup", zoobicon: true, dropbox: false, google: false, icloud: false, backblaze: true },
  { name: "Bundled with Website Builder", zoobicon: true, dropbox: false, google: false, icloud: false, backblaze: false },
  { name: "Bundled with VPN", zoobicon: true, dropbox: false, google: true, icloud: true, backblaze: false },
  { name: "CDN File Delivery", zoobicon: true, dropbox: false, google: false, icloud: false, backblaze: true },
];

const PRICING_TIERS = [
  {
    name: "Starter",
    price: "$1.99",
    period: "/mo",
    storage: "10 GB",
    description: "For personal projects, documents, and small backups.",
    features: [
      "10 GB encrypted storage",
      "AES-256 encryption",
      "5 shared links/mo",
      "30-day version history",
      "Web & mobile access",
      "Email support",
    ],
    cta: "Start storing",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/mo",
    storage: "100 GB",
    description: "For freelancers, creators, and growing businesses.",
    features: [
      "100 GB encrypted storage",
      "AES-256 encryption",
      "Unlimited shared links",
      "90-day version history",
      "Auto website backup",
      "S3-compatible API",
      "Team sharing (3 members)",
      "Priority support",
    ],
    cta: "Start Pro trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$9.99",
    period: "/mo",
    storage: "1 TB",
    description: "For teams and businesses that need serious storage.",
    features: [
      "1 TB encrypted storage",
      "AES-256 encryption",
      "Unlimited shared links",
      "Unlimited version history",
      "Auto website + DB backup",
      "S3-compatible API",
      "Team sharing (unlimited)",
      "CDN file delivery",
      "Audit logs",
      "24/7 priority support",
    ],
    cta: "Start Business trial",
    highlighted: false,
  },
];

const FAQ_ITEMS = [
  {
    q: "How secure is Zoobicon Cloud Storage?",
    a: "Every file is encrypted with AES-256 encryption both at rest and in transit. We use TLS 1.3 for all transfers and zero-knowledge encryption for sensitive buckets, meaning even Zoobicon staff cannot read your files. Our infrastructure meets SOC 2 Type II and GDPR compliance standards.",
  },
  {
    q: "What is the maximum file size I can upload?",
    a: "Starter plans support files up to 5 GB each. Pro plans support up to 25 GB per file with resumable uploads. Business plans support files up to 100 GB each with multipart uploads and automatic resume on interruption.",
  },
  {
    q: "How does file sharing work?",
    a: "Generate a secure link for any file or folder. You can set expiration dates (1 hour to 30 days), require a password, limit downloads, and restrict access by email domain. Shared links use the same AES-256 encryption in transit.",
  },
  {
    q: "How often do automatic backups run?",
    a: "Website backups run nightly by default, but you can configure hourly, every 6 hours, or custom schedules. Database backups can run as frequently as every 15 minutes on Business plans. All backups are incremental, so they only transfer changed data.",
  },
  {
    q: "Can I use Zoobicon Cloud Storage with my existing tools?",
    a: "Yes. Our S3-compatible API works with any tool that supports Amazon S3, including Cyberduck, rclone, AWS CLI, and most backup software. We also provide native SDKs for JavaScript, Python, Go, and PHP.",
  },
];

const CARD_BG = "linear-gradient(135deg, rgba(20,40,95,0.85) 0%, rgba(10,10,15,0.7) 100%)";
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

export default function CloudStoragePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Zoobicon Cloud Storage",
    "applicationCategory": "UtilitiesApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "1.99",
      "highPrice": "9.99",
      "priceCurrency": "USD",
      "offerCount": "3"
    },
    "description": "Secure encrypted cloud storage and backup. AES-256 encryption, auto-backup, version history, team sharing, and S3-compatible API. From $1.99/mo.",
    "url": "https://zoobicon.com/products/cloud-storage",
    "screenshot": "https://zoobicon.com/og-image.png",
    "featureList": "AES-256 Encryption, Version History, Auto-Backup, File Sharing, Team Sharing, S3-Compatible API",
    "keywords": "cheap cloud storage, encrypted cloud storage, business file backup, secure file storage"
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://zoobicon.com/products" },
      { "@type": "ListItem", "position": 3, "name": "Cloud Storage", "item": "https://zoobicon.com/products/cloud-storage" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0b1530] text-white fs-grain pt-[72px]">
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
            <Lock className="w-3 h-3" />
            AES-256 · 99.99% durability · Zero-knowledge buckets
          </div>

          <h1 className="fs-display-xl mb-6">
            Your files, everywhere,{" "}
            <span style={SERIF}>encrypted.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            Secure cloud storage with AES-256 encryption, automatic backups, and instant access
            from any device. Your data stays yours — always encrypted, always available.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["AES-256 Encrypted", "Auto-Backup", "Version History", "Team Sharing", "S3-Compatible API", "CDN Delivery"].map((pill) => (
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
              href="/auth/signup"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              Start storing free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <HardDrive className="w-4 h-4" />
              View plans
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STORAGE_STATS.map((stat) => (
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

      {/* Features grid */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Storage features
            </div>
            <h2 className="fs-display-lg mb-4">
              Storage that protects{" "}
              <span style={SERIF}>everything.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Enterprise-grade security and features on every plan. No compromises on your data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STORAGE_FEATURES.map((f) => (
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

      {/* Use cases */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              <Database className="w-3 h-3" />
              Use cases
            </div>
            <h2 className="fs-display-lg mb-4">
              Built for how{" "}
              <span style={SERIF}>you actually work.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              From website backups to team collaboration, secure storage for every workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 text-center transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <uc.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{uc.title}</h3>
                  <p className="text-[13px] text-white/55 leading-relaxed">{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="fs-display-lg mb-4">
              Three steps to{" "}
              <span style={SERIF}>secure storage.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              From signup to storing files in under a minute.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-8 text-center transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="text-5xl font-semibold tracking-[-0.02em] mb-4 opacity-80" style={{ color: "#E8D4B0" }}>{step.step}</div>
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em] mb-2">{step.title}</h3>
                  <p className="text-[13px] text-white/55 leading-relaxed">{step.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-white/15" />
                  </div>
                )}
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
              <Shield className="w-3 h-3" />
              Industry comparison
            </div>
            <h2 className="fs-display-lg mb-4">
              See how we{" "}
              <span style={SERIF}>stack up.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              More features, better encryption, lower price. The only cloud storage bundled with your website and VPN.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-white/[0.08]" style={{ background: CARD_BG }}>
            <div className="min-w-[820px]">
              <div className="grid grid-cols-6 px-6 py-4 border-b border-white/[0.08] text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55">
                <div>Feature</div>
                <div className="text-center" style={{ color: "#E8D4B0" }}>Zoobicon</div>
                <div className="text-center">Dropbox</div>
                <div className="text-center">Google Drive</div>
                <div className="text-center">iCloud</div>
                <div className="text-center">Backblaze</div>
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
                    {typeof feature.zoobicon === "string" ? (
                      <span className="font-semibold" style={{ color: "#E8D4B0" }}>{feature.zoobicon}</span>
                    ) : feature.zoobicon ? (
                      <Check className="w-4 h-4 mx-auto" style={{ color: "#E8D4B0" }} />
                    ) : (
                      <Minus className="w-4 h-4 mx-auto text-white/25" />
                    )}
                  </div>
                  {[feature.dropbox, feature.google, feature.icloud, feature.backblaze].map((val, j) => (
                    <div key={j} className="text-center">
                      {typeof val === "string" ? (
                        <span className="text-white/55">{val}</span>
                      ) : val ? (
                        <Check className="w-4 h-4 mx-auto text-white/55" />
                      ) : (
                        <Minus className="w-4 h-4 mx-auto text-white/25" />
                      )}
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

      {/* Pricing */}
      <section id="pricing" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Pricing
            </div>
            <h2 className="fs-display-lg mb-4">
              Simple, transparent storage{" "}
              <span style={SERIF}>pricing.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              No hidden fees. No surprise overages. Pick your plan and start storing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-[24px] p-7 transition-all duration-500 hover:-translate-y-1 ${
                  tier.highlighted ? "border-2 border-[#E8D4B0]/35" : "border border-white/[0.08] hover:border-[#E8D4B0]/25"
                }`}
                style={{
                  background: tier.highlighted
                    ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(20,40,95,0.85) 100%)"
                    : CARD_BG,
                }}
              >
                {tier.highlighted && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)", color: "#0a1628" }}
                  >
                    Most popular
                  </div>
                )}
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>{tier.price}</span>
                  <span className="text-[13px] text-white/50">{tier.period}</span>
                </div>
                <div className="text-[12px] uppercase tracking-[0.12em] font-semibold mb-3" style={{ color: "rgba(232,212,176,0.75)" }}>{tier.storage}</div>
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
                  href="/auth/signup"
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

      {/* FAQ */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="fs-display-lg mb-4">
              Frequently asked{" "}
              <span style={SERIF}>questions.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Everything you need to know about Zoobicon Cloud Storage.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, i) => (
              <div
                key={faq.q}
                className="overflow-hidden rounded-[20px] border border-white/[0.08]"
                style={{ background: CARD_BG }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-[15px] font-semibold text-white/85">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    style={{ color: "#E8D4B0" }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6">
                    <p className="text-[13px] text-white/55 leading-relaxed">{faq.a}</p>
                  </div>
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
            Your files deserve{" "}
            <span style={SERIF}>better storage.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            AES-256 encrypted. Auto-backed up. Accessible anywhere. Start with 10 GB for just $1.99/mo.
          </p>
          <Link
            href="/auth/signup"
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={PRIMARY_CTA}
          >
            Start storing securely
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> AES-256 encrypted</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Auto-backup</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> S3-compatible API</span>
          </div>
        </div>
      </section>
    </div>
  );
}
