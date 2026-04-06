"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap,
  Globe,
  ArrowRight,
  Sparkles,
  Code2,
  Smartphone,
  Palette,
  Layers,
  RefreshCw,
  Download,
  MessageSquare,
  Layout,
  Check,
  Monitor,
  Search,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
  { icon: Sparkles, title: "Prompt to Website", desc: "Describe any website in plain English and watch it materialize in seconds. No coding required." },
  { icon: Code2, title: "Multi-Framework Export", desc: "Export as HTML, React, Next.js, Vue, or Svelte. Production-ready code, not templates." },
  { icon: Smartphone, title: "Responsive by Default", desc: "Every site is mobile-first with responsive breakpoints. Preview on desktop, tablet, and mobile." },
  { icon: MessageSquare, title: "AI Chat Editor", desc: "Say 'make the header blue' or 'add a contact form' — AI edits your live site in real-time." },
  { icon: Layout, title: "12+ Templates", desc: "Start from SaaS, portfolio, e-commerce, restaurant, agency, blog, and more. All customizable." },
  { icon: RefreshCw, title: "Streaming Generation", desc: "Watch your code appear in real-time. See the site building itself character by character." },
  { icon: Palette, title: "Style Presets", desc: "Modern dark, clean minimal, bold colorful, corporate — choose a style or let AI decide." },
  { icon: Download, title: "One-Click Export", desc: "Download as HTML, copy to clipboard, or deploy directly to a zoobicon.sh subdomain." },
  { icon: Search, title: "Built-in SEO", desc: "Auto-generated meta tags, semantic HTML5, structured data, and accessibility compliance." },
];

const STEPS = [
  { num: "01", title: "Describe", desc: "Tell AI what you want. 'A photography portfolio with dark theme and gallery grid.'" },
  { num: "02", title: "Generate", desc: "AI streams your website in real-time. Full HTML, CSS, JavaScript — production-ready." },
  { num: "03", title: "Refine", desc: "Use the AI Chat Editor to make changes. 'Add a contact form' — done instantly." },
  { num: "04", title: "Ship", desc: "Export, download, or deploy to a live URL with one click." },
];

export default function WebsiteBuilderPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Zoobicon AI Website Builder",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "99",
      "priceCurrency": "USD",
      "offerCount": "4"
    },
    "description": "Build production-ready websites in 60 seconds with 7 AI agents. No coding required.",
    "url": "https://zoobicon.com/products/website-builder",
    "screenshot": "https://zoobicon.com/og-image.png"
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://zoobicon.com/products" },
      { "@type": "ListItem", "position": 3, "name": "Website Builder", "item": "https://zoobicon.com/products/website-builder" }
    ]
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How long does it take to build a website with Zoobicon?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zoobicon generates a complete, production-ready website in 60-95 seconds. The 7-agent AI pipeline handles strategy, design, copywriting, architecture, development, SEO, and animations automatically."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need coding experience to use Zoobicon?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No coding experience is required. You describe your website in plain English, and Zoobicon's AI generates the complete HTML, CSS, and JavaScript. You can also edit using natural language chat commands like 'make the header blue' or 'add a contact form'."
        }
      },
      {
        "@type": "Question",
        "name": "What AI models power Zoobicon's website builder?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zoobicon uses Claude Opus 4.6 for the core Developer agent (HTML generation), Claude Haiku for fast planning agents (strategy, brand design, copywriting, architecture), and Claude Sonnet for enhancement agents (SEO, animations). Users can also select GPT-4o or Gemini 2.5 Pro as alternatives."
        }
      },
      {
        "@type": "Question",
        "name": "Can I export or self-host the websites Zoobicon generates?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. You can deploy to zoobicon.sh with one click (free hosting included), download as standalone HTML, export as a React/Next.js project, push to GitHub, or export as a WordPress theme. The generated code is yours with no lock-in."
        }
      },
      {
        "@type": "Question",
        "name": "What types of websites can Zoobicon build?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zoobicon supports 43 specialized generators covering landing pages, SaaS apps, e-commerce stores, portfolios, blogs, restaurant sites, real estate listings, healthcare sites, law firm pages, fitness sites, and more. It also generates multi-page sites (3-6 pages) and full-stack applications with databases and APIs."
        }
      }
    ]
  };

  return (
    <div className="relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <BackgroundEffects preset="technical" />

      {/* Nav */}
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
            <span className="text-sm text-white/65">AI Website Builder</span>
          </div>
          <Link href="/builder" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
            <span>Start Building</span>
          </Link>
        </div>
      </nav>
      <CursorGlowTracker />

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 mb-6">
              <Globe className="w-3 h-3 text-brand-400" />
              <span className="text-xs font-medium text-brand-400">zoobicon.ai</span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              Describe It.<br />
              <span className="gradient-text-hero">Build It.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg md:text-xl text-white/60 leading-relaxed mb-10">
              The most advanced AI website builder on the planet. Generate production-ready websites
              from a simple description. Edit with natural language. Deploy in one click.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link href="/builder" className="group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center gap-3 shadow-glow">
                <span>Try the Builder Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/developers" className="px-8 py-4 rounded-2xl text-base font-medium text-white/65 border border-white/[0.12] hover:border-white/20 transition-all flex items-center gap-3">
                <Code2 className="w-5 h-5" />
                <span>Use the API</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Four Steps to <span className="gradient-text">Launch</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {STEPS.map((step, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border p-6 rounded-xl relative">
                  <div className="text-5xl font-black text-white/[0.03] absolute top-2 right-4">{step.num}</div>
                  <div className="text-sm font-bold text-brand-400 mb-1">{step.num}</div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Every Feature<br /><span className="gradient-text">You Need</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <motion.div key={i} variants={fadeInUp} className="gradient-border card-hover p-6 rounded-xl group">
                  <f.icon className="w-8 h-8 text-brand-400/50 mb-4 group-hover:text-brand-400 transition-colors" />
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                Why <span className="gradient-text">Zoobicon?</span>
              </h2>
            </motion.div>

            <motion.div variants={fadeInUp} className="gradient-border rounded-2xl overflow-hidden">
              <div className="bg-dark-300/60">
                <div className="grid grid-cols-4 px-6 py-3 border-b border-white/[0.10] text-xs font-semibold text-white/60">
                  <div>Feature</div>
                  <div className="text-center">Zoobicon</div>
                  <div className="text-center">Wix/Squarespace</div>
                  <div className="text-center">Manual Coding</div>
                </div>
                {[
                  ["AI Generation", true, false, false],
                  ["AI Editing (Chat)", true, false, false],
                  ["Code Export", true, false, true],
                  ["Multi-Framework", true, false, true],
                  ["Responsive", true, true, "manual"],
                  ["SEO Optimized", true, "partial", "manual"],
                  ["Streaming Preview", true, false, false],
                  ["Time to Launch", "Seconds", "Hours", "Days/Weeks"],
                  ["Price", "Free tier", "$16+/mo", "$0 + time"],
                ].map((row, i) => (
                  <div key={i} className={`grid grid-cols-4 px-6 py-3 text-sm ${i % 2 === 0 ? "bg-white/[0.04]" : ""}`}>
                    <div className="text-white/60">{row[0] as string}</div>
                    {[1, 2, 3].map((col) => (
                      <div key={col} className="text-center">
                        {row[col] === true ? (
                          <Check className="w-4 h-4 text-accent-cyan mx-auto" />
                        ) : row[col] === false ? (
                          <span className="text-white/60">—</span>
                        ) : (
                          <span className="text-white/60 text-xs">{row[col] as string}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Monitor className="w-12 h-12 text-brand-400/30 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Your Next Website<br /><span className="gradient-text">Is One Prompt Away</span>
          </h2>
          <p className="text-lg text-white/60 mb-8">Free. No credit card. No sign up required to try.</p>
          <Link href="/builder" className="inline-flex group btn-gradient px-10 py-4 rounded-2xl text-lg font-bold text-white items-center gap-3 shadow-glow-lg">
            <span>Start Building Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/30">&copy; 2026 Zoobicon. All rights reserved.</div>
          <div className="text-xs text-white/20">zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/50 transition-colors">Terms</Link>
            <Link href="/disclaimers" className="text-xs text-white/30 hover:text-white/50 transition-colors">Disclaimers</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
