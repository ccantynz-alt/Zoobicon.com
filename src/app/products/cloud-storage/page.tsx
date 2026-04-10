"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap,
  ArrowRight,
  Shield,
  Lock,
  HardDrive,
  Clock,
  Share2,
  Users,
  Code,
  FolderSync,
  Upload,
  Globe,
  Check,
  Minus,
  ChevronDown,
  ChevronRight,
  Cloud,
  FileText,
  Image,
  Briefcase,
  MonitorSmartphone,
  Database,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

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
  { icon: Image, title: "Media Assets", desc: "Store images, videos, and design files with CDN delivery. Serve assets globally at edge speed." },
  { icon: Briefcase, title: "Business Documents", desc: "Invoices, contracts, and records stored securely with audit trails and compliance-ready encryption." },
  { icon: Users, title: "Team Collaboration", desc: "Shared folders with real-time sync. Everyone works from the same source of truth." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Create a Bucket", desc: "Name your storage bucket and choose your region. Takes 10 seconds." },
  { step: "02", title: "Upload Files", desc: "Drag and drop, CLI, or API. Upload files of any size with resumable transfers." },
  { step: "03", title: "Access Anywhere", desc: "Your files available on any device, any browser. Encrypted end-to-end." },
];

const COMPETITOR_FEATURES = [
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
    cta: "Start Storing",
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
    cta: "Start Pro Trial",
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
    cta: "Start Business Trial",
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

export default function CloudStoragePage() {
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

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
    <div className="relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <BackgroundEffects preset="technical" />

      {/* Navigation — Auth-aware */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/60">/</span>
            <span className="text-sm text-white/65">Cloud Storage</span>
          </div>
          {user ? (
            <Link href="/dashboard" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              <span>Dashboard</span>
            </Link>
          ) : (
            <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
              <span>Get Started</span>
            </Link>
          )}
        </div>
      </nav>
      <CursorGlowTracker />

      {/* ============================================ */}
      {/* 1. HERO SECTION                              */}
      {/* ============================================ */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 mb-6">
              <Cloud className="w-3 h-3 text-accent-cyan" />
              <span className="text-xs font-medium text-accent-cyan">Zoobicon Cloud Storage</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              Your Files. Everywhere.<br />
              <span className="gradient-text-hero">Encrypted.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-3xl text-lg md:text-xl text-white/60 leading-relaxed mb-10">
              Secure cloud storage with AES-256 encryption, automatic backups, and instant access
              from any device. Your data stays yours — always encrypted, always available.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-12 max-w-3xl">
              {["AES-256 Encrypted", "Auto-Backup", "Version History", "Team Sharing", "S3-Compatible API", "CDN Delivery"].map((pill) => (
                <span
                  key={pill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.06] text-xs font-medium text-white/65"
                >
                  <Check className="w-3 h-3 text-accent-cyan" />
                  {pill}
                </span>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link href="/auth/signup" className="group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center gap-3 shadow-glow">
                <span>Start Storing Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#pricing" className="px-8 py-4 rounded-2xl text-base font-medium text-white/65 border border-white/[0.12] hover:border-white/20 transition-all flex items-center gap-3">
                <HardDrive className="w-5 h-5" />
                <span>View Plans</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 2. STATS BAR                                 */}
      {/* ============================================ */}
      <section className="relative py-16 border-y border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {STORAGE_STATS.map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="text-4xl md:text-5xl font-black gradient-text-static mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 3. FEATURES GRID                             */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Storage That<br /><span className="gradient-text">Protects Everything</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Enterprise-grade security and features on every plan. No compromises on your data.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {STORAGE_FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <f.icon className="w-8 h-8 text-accent-cyan/50 mb-4 group-hover:text-accent-cyan transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 4. USE CASES                                 */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 mb-6">
                <Database className="w-3 h-3 text-brand-400" />
                <span className="text-xs font-medium text-brand-400">Use Cases</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Built for How<br /><span className="gradient-text">You Actually Work</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                From website backups to team collaboration, secure storage for every workflow.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {USE_CASES.map((uc, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group text-center">
                  <div className="w-12 h-12 rounded-xl bg-accent-cyan/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-cyan/20 transition-colors">
                    <uc.icon className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{uc.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{uc.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 5. HOW IT WORKS                              */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Three Steps to<br /><span className="gradient-text">Secure Storage</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                From signup to storing files in under a minute.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((step, i) => (
                <motion.div key={i} variants={fadeInUp} className="relative gradient-border p-8 rounded-2xl text-center">
                  <div className="text-6xl font-black gradient-text-static opacity-20 mb-4">{step.step}</div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 -translate-y-1/2 z-10">
                      <ChevronRight className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 6. COMPETITOR COMPARISON                      */}
      {/* ============================================ */}
      <section className="relative py-24 lg:py-32 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-blue w-[700px] h-[700px] top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-5" />
          <div className="glow-orb glow-orb-purple w-[500px] h-[500px] top-1/3 right-0 opacity-5" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 mb-6">
                <Shield className="w-3 h-3 text-brand-400" />
                <span className="text-xs font-medium text-brand-400">Industry Comparison</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                See How We<br />
                <span className="gradient-text">Stack Up</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                More features, better encryption, lower price. The only cloud storage bundled with your website and VPN.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp} className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-0 mb-2">
                  <div className="p-4" />
                  <div className="p-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-500/20 to-accent-purple/20 border border-brand-500/30">
                      <Zap className="w-4 h-4 text-brand-400" />
                      <span className="text-sm font-bold text-white">Zoobicon</span>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm text-white/60">Dropbox</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm text-white/60">Google Drive</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm text-white/60">iCloud</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm text-white/60">Backblaze</span>
                  </div>
                </div>

                {/* Feature Rows */}
                {COMPETITOR_FEATURES.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className={`grid grid-cols-6 gap-0 ${i % 2 === 0 ? "bg-white/[0.05]" : ""} rounded-lg`}
                  >
                    <div className="p-4 flex items-center">
                      <span className="text-sm text-white/60">{feature.name}</span>
                    </div>
                    <div className="p-4 flex items-center justify-center">
                      {typeof feature.zoobicon === "string" ? (
                        <span className="text-sm font-bold text-stone-400">{feature.zoobicon}</span>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-stone-500/20 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-stone-400" />
                        </div>
                      )}
                    </div>
                    {[feature.dropbox, feature.google, feature.icloud, feature.backblaze].map((val, j) => (
                      <div key={j} className="p-4 flex items-center justify-center">
                        {typeof val === "string" ? (
                          <span className="text-sm text-white/60">{val}</span>
                        ) : val ? (
                          <Check className="w-4 h-4 text-white/60" />
                        ) : (
                          <Minus className="w-4 h-4 text-white/50" />
                        )}
                      </div>
                    ))}
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <p className="text-[10px] text-white/20 mt-3 text-center">Comparison based on publicly available information as of March 2026. Features and pricing may change. All trademarks belong to their respective owners. See our <a href="/disclaimers" className="underline hover:text-white/30">disclaimers</a>.</p>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 7. PRICING SECTION                           */}
      {/* ============================================ */}
      <section id="pricing" className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Simple, Transparent<br /><span className="gradient-text">Storage Pricing</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                No hidden fees. No surprise overages. Pick your plan and start storing.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {PRICING_TIERS.map((tier, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className={`relative p-6 rounded-2xl ${
                    tier.highlighted
                      ? "bg-gradient-to-b from-brand-500/10 to-accent-purple/10 border-2 border-brand-500/30"
                      : "gradient-border"
                  }`}
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-purple text-xs font-semibold text-white">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-black">{tier.price}</span>
                    <span className="text-sm text-white/60">{tier.period}</span>
                  </div>
                  <div className="text-sm font-medium text-accent-cyan mb-3">{tier.storage}</div>
                  <p className="text-sm text-white/60 mb-6">{tier.description}</p>
                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                        <Check className="w-4 h-4 text-accent-cyan flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/signup"
                    className={`block text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                      tier.highlighted
                        ? "btn-gradient text-white shadow-glow"
                        : "border border-white/[0.12] text-white/60 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 8. FAQ SECTION                               */}
      {/* ============================================ */}
      <section className="py-24 lg:py-32 border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Frequently Asked<br /><span className="gradient-text">Questions</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60">
                Everything you need to know about Zoobicon Cloud Storage.
              </p>
            </motion.div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <span className="text-base font-semibold">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-white/60 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6">
                      <p className="text-sm text-white/60 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 9. FINAL CTA                                 */}
      {/* ============================================ */}
      <section className="py-32 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-blue w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />
        </div>
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6"
            >
              Your Files Deserve<br />
              <span className="gradient-text-hero">Better Storage</span>
            </motion.h2>

            <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-lg text-white/60 mb-10">
              AES-256 encrypted. Auto-backed up. Accessible anywhere.
              Start with 10 GB for just $1.99/mo.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/signup"
                className="group btn-gradient px-10 py-5 rounded-2xl text-lg font-bold text-white flex items-center gap-3 shadow-glow"
              >
                <span>Start Storing Securely</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent-cyan" /> AES-256 encrypted</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent-cyan" /> Auto-backup</span>
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-accent-cyan" /> S3-compatible API</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* 10. 4-DOMAIN FOOTER                          */}
      {/* ============================================ */}
      <footer className="border-t border-white/[0.06] py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-bold">Zoobicon</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/50">
              <a href="https://zoobicon.com" className="hover:text-white/80 transition-colors">zoobicon.com</a>
              <span className="text-white/25">&middot;</span>
              <a href="https://zoobicon.ai" className="hover:text-white/80 transition-colors">zoobicon.ai</a>
              <span className="text-white/25">&middot;</span>
              <a href="https://zoobicon.io" className="hover:text-white/80 transition-colors">zoobicon.io</a>
              <span className="text-white/25">&middot;</span>
              <a href="https://zoobicon.sh" className="hover:text-white/80 transition-colors">zoobicon.sh</a>
            </div>
            <p className="text-xs text-white/30">&copy; {new Date().getFullYear()} Zoobicon. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
