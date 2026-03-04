"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import BuilderDemo from "@/components/BuilderDemo";
import VideoShowcase from "@/components/VideoShowcase";
import {
  Zap,
  Globe,
  Video,
  Search,
  BarChart3,
  Sparkles,
  Palette,
  Mail,
  MessageSquare,
  Shield,
  Cpu,
  ArrowRight,
  ChevronRight,
  Code2,
  Layers,
  Bot,
  TrendingUp,
  Play,
  Star,
  Menu,
  X,
  Store,
  Headphones,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const PRODUCTS = [
  {
    icon: Globe,
    name: "AI Website Builder",
    description: "Describe any website and watch it materialize in seconds. Full-stack, responsive, production-ready.",
    color: "from-brand-500 to-brand-700",
    glowColor: "shadow-glow",
    domain: "zoobicon.ai",
    tag: "Core Product",
    href: "/products/website-builder",
  },
  {
    icon: Search,
    name: "SEO Campaigns Agent",
    description: "Autonomous AI agent that researches, plans, and executes SEO campaigns that dominate search rankings.",
    color: "from-accent-cyan to-emerald-600",
    glowColor: "shadow-glow-cyan",
    domain: "zoobicon.com",
    tag: "Agent",
    href: "/products/seo-agent",
  },
  {
    icon: Video,
    name: "AI Video Creator",
    description: "Generate high-end videos for TikTok, Facebook, Instagram & YouTube. No scripts needed - just pure AI magic.",
    color: "from-accent-purple to-pink-600",
    glowColor: "shadow-glow-purple",
    domain: "zoobicon.com",
    tag: "Creator",
    href: "/products/video-creator",
  },
  {
    icon: Palette,
    name: "AI Brand Kit",
    description: "Complete brand identity in minutes. Logos, color palettes, typography, style guides - all AI-generated.",
    color: "from-pink-500 to-rose-600",
    glowColor: "shadow-glow-purple",
    domain: "zoobicon.ai",
    tag: "Designer",
  },
  {
    icon: Headphones,
    name: "AI Email Support",
    description: "World-class AI customer support. Auto-replies in <30s, sentiment analysis, smart routing — 24/7.",
    color: "from-amber-500 to-orange-600",
    glowColor: "shadow-glow",
    domain: "zoobicon.com",
    tag: "Agent",
    href: "/products/email-support",
  },
  {
    icon: Globe,
    name: "Domain Registration",
    description: "Register premium domains from $2.99/yr. Free WHOIS privacy, DNS management, and AI website builder included.",
    color: "from-cyan-500 to-blue-600",
    glowColor: "shadow-glow-cyan",
    domain: "zoobicon.com",
    tag: "Revenue",
    href: "/domains",
  },
  {
    icon: Store,
    name: "Add-ons Marketplace",
    description: "Discover premium templates, AI agents, integrations, and tools. Install with one click. Build & sell your own.",
    color: "from-accent-purple to-pink-600",
    glowColor: "shadow-glow-purple",
    domain: "zoobicon.com",
    tag: "Marketplace",
    href: "/marketplace",
  },
  {
    icon: Mail,
    name: "AI Email Marketing",
    description: "Craft and automate email campaigns that convert. AI writes, designs, segments, and optimizes delivery.",
    color: "from-rose-500 to-red-600",
    glowColor: "shadow-glow",
    domain: "zoobicon.com",
    tag: "Agent",
  },
  {
    icon: BarChart3,
    name: "AI Analytics & Insights",
    description: "Real-time intelligence on your digital presence. Competitor tracking, trend analysis, actionable insights.",
    color: "from-emerald-500 to-teal-600",
    glowColor: "shadow-glow-cyan",
    domain: "zoobicon.io",
    tag: "Intelligence",
  },
  {
    icon: Bot,
    name: "AI Chatbot Builder",
    description: "Deploy custom AI chatbots on any website. Trained on your content, branded to your style.",
    color: "from-violet-500 to-indigo-600",
    glowColor: "shadow-glow-purple",
    domain: "zoobicon.ai",
    tag: "Builder",
  },
];

const DOMAINS = [
  {
    domain: "zoobicon.com",
    label: "Brand Hub",
    description: "Main platform & marketing engine",
    icon: Zap,
    color: "text-brand-400",
    borderColor: "border-brand-500/30",
    href: "/",
  },
  {
    domain: "zoobicon.ai",
    label: "AI Builder",
    description: "Website builder & AI creation tools",
    icon: Sparkles,
    color: "text-accent-purple",
    borderColor: "border-accent-purple/30",
    href: "/products/website-builder",
  },
  {
    domain: "zoobicon.io",
    label: "Developer API",
    description: "API platform & integrations",
    icon: Code2,
    color: "text-accent-cyan",
    borderColor: "border-accent-cyan/30",
    href: "/developers",
  },
  {
    domain: "zoobicon.sh",
    label: "CLI & DevOps",
    description: "Command-line tools & automation",
    icon: Layers,
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    href: "/cli",
  },
];

const STATS = [
  { value: "10x", label: "Faster than manual coding" },
  { value: "4", label: "Domain ecosystem" },
  { value: "10+", label: "AI-powered products" },
  { value: "24/7", label: "Autonomous agents" },
];

const FEATURES = [
  {
    icon: Cpu,
    title: "Most Advanced AI Agents",
    description: "Our agents don't just assist - they execute. Autonomous AI that handles your entire digital workflow end-to-end.",
  },
  {
    icon: Zap,
    title: "Instant Generation",
    description: "From idea to production-ready output in seconds. Websites, videos, campaigns - all generated at lightning speed.",
  },
  {
    icon: Shield,
    title: "Enterprise-Grade",
    description: "Built for scale with security-first architecture. SOC 2 compliant infrastructure with 99.9% uptime guarantee.",
  },
  {
    icon: TrendingUp,
    title: "Market Domination Tools",
    description: "SEO agents, competitor intelligence, and trend analysis that give you an unfair advantage in any market.",
  },
  {
    icon: Layers,
    title: "Full Ecosystem",
    description: "Four domains, eight products, one unified platform. Everything you need to build, grow, and dominate online.",
  },
  {
    icon: Globe,
    title: "Multi-Platform Publishing",
    description: "One-click deploy to any platform. Generate content optimized for TikTok, Facebook, Instagram, YouTube, and the web.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="glow-orb glow-orb-blue w-[600px] h-[600px] -top-[200px] -left-[200px] animate-pulse-glow" />
        <div className="glow-orb glow-orb-purple w-[500px] h-[500px] top-[30%] -right-[150px] animate-pulse-glow" style={{ animationDelay: "2s" }} />
        <div className="glow-orb glow-orb-cyan w-[400px] h-[400px] bottom-[20%] left-[10%] animate-pulse-glow" style={{ animationDelay: "4s" }} />
        <div className="grid-pattern fixed inset-0 opacity-100" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">Zoobicon</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <a href="#products" className="text-sm text-white/50 hover:text-white transition-colors">Products</a>
                <Link href="/marketplace" className="text-sm text-white/50 hover:text-white transition-colors">Marketplace</Link>
                <Link href="/domains" className="text-sm text-white/50 hover:text-white transition-colors">Domains</Link>
                <Link href="/developers" className="text-sm text-white/50 hover:text-white transition-colors">Developers</Link>
                <a href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</a>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/login" className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2">
                Sign in
              </Link>
              <Link
                href="/builder"
                className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              >
                <span>Start Building</span>
              </Link>
            </div>
            <button
              className="md:hidden text-white/60"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/[0.06] bg-[#050507]/95 backdrop-blur-2xl px-6 py-6 space-y-4">
            <a href="#products" className="block text-sm text-white/60 hover:text-white">Products</a>
            <Link href="/marketplace" className="block text-sm text-white/60 hover:text-white">Marketplace</Link>
            <Link href="/domains" className="block text-sm text-white/60 hover:text-white">Domains</Link>
            <Link href="/developers" className="block text-sm text-white/60 hover:text-white">Developers</Link>
            <Link href="/agencies" className="block text-sm text-white/60 hover:text-white">Agencies</Link>
            <a href="#pricing" className="block text-sm text-white/60 hover:text-white">Pricing</a>
            <Link href="/builder" className="block btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold text-white text-center mt-4">
              <span>Start Building</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                <span className="text-xs font-medium text-white/60">The Future of Digital Creation is Here</span>
                <ChevronRight className="w-3 h-3 text-white/40" />
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-8"
            >
              <span className="block">Build the Future</span>
              <span className="block gradient-text-hero mt-2">With AI That Dominates</span>
            </motion.h1>

            {/* Sub headline */}
            <motion.p
              variants={fadeInUp}
              className="max-w-3xl mx-auto text-lg md:text-xl text-white/40 leading-relaxed mb-12"
            >
              The most advanced AI platform on the planet. Build stunning websites, crush SEO rankings,
              create viral videos, and automate your entire digital empire — all powered by autonomous AI agents.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/builder"
                className="group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white flex items-center gap-3 shadow-glow"
              >
                <span>Start Building Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="group px-8 py-4 rounded-2xl text-base font-medium text-white/60 border border-white/[0.08] hover:border-white/20 hover:text-white/80 transition-all flex items-center gap-3 bg-white/[0.02]">
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </motion.div>

            {/* Hero Visual - Live Animated Builder Demo */}
            <motion.div
              variants={fadeInUp}
              className="relative max-w-5xl mx-auto"
            >
              <BuilderDemo />
              {/* Glow under the preview */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-brand-500/10 blur-[100px] rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-16 border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {STATS.map((stat, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center">
                <div className="text-4xl md:text-5xl font-black gradient-text-static mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/40">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-purple/20 bg-accent-purple/5 mb-6">
                <Sparkles className="w-3 h-3 text-accent-purple" />
                <span className="text-xs font-medium text-accent-purple">Product Suite</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                Everything You Need to<br />
                <span className="gradient-text">Dominate Online</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/40">
                Ten AI-powered products working in harmony. Each one best-in-class.
                Together, an unstoppable digital powerhouse.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRODUCTS.map((product, i) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center shadow-lg`}>
                        <product.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30 bg-white/[0.04] px-2.5 py-1 rounded-full">
                        {product.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-white/40 leading-relaxed mb-4">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/20">
                      <Globe className="w-3 h-3" />
                      <span>{product.domain}</span>
                    </div>
                  </>
                );
                return (
                  <motion.div key={i} variants={fadeInUp}>
                    {product.href ? (
                      <Link href={product.href} className="block gradient-border card-hover p-6 rounded-2xl group cursor-pointer">
                        {content}
                      </Link>
                    ) : (
                      <div className="gradient-border card-hover p-6 rounded-2xl group cursor-pointer">
                        {content}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Domain Ecosystem */}
      <section id="ecosystem" className="relative py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-cyan/20 bg-accent-cyan/5 mb-6">
                <Globe className="w-3 h-3 text-accent-cyan" />
                <span className="text-xs font-medium text-accent-cyan">Domain Ecosystem</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                Four Domains.<br />
                <span className="gradient-text">One Empire.</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/40">
                We own every extension. Complete market presence across .com, .ai, .io, and .sh — an impenetrable brand fortress.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DOMAINS.map((d, i) => (
                <motion.div key={i} variants={fadeInUp}>
                  <Link
                    href={d.href}
                    className={`block relative p-6 rounded-2xl border ${d.borderColor} bg-white/[0.02] hover:bg-white/[0.04] transition-all group`}
                  >
                    <d.icon className={`w-8 h-8 ${d.color} mb-4`} />
                    <div className="text-xl font-bold mb-1 group-hover:text-white transition-colors">
                      {d.domain}
                    </div>
                    <div className={`text-sm font-semibold ${d.color} mb-2`}>
                      {d.label}
                    </div>
                    <p className="text-sm text-white/40">
                      {d.description}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Connection visualization */}
            <motion.div variants={fadeInUp} className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/[0.06] bg-white/[0.02]">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/30 border border-brand-500/40" />
                  <div className="w-6 h-6 rounded-full bg-accent-purple/30 border border-accent-purple/40" />
                  <div className="w-6 h-6 rounded-full bg-accent-cyan/30 border border-accent-cyan/40" />
                  <div className="w-6 h-6 rounded-full bg-amber-500/30 border border-amber-500/40" />
                </div>
                <span className="text-sm text-white/50">All domains. One unified platform. Total market coverage.</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 mb-6">
                <Zap className="w-3 h-3 text-brand-400" />
                <span className="text-xs font-medium text-brand-400">Why Zoobicon</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                Built Different.<br />
                <span className="gradient-text">Built to Win.</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/40">
                We didn&apos;t build another tool. We built the platform that makes every other tool obsolete.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="gradient-border card-hover p-8 rounded-2xl group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:border-brand-500/30 transition-colors">
                    <feature.icon className="w-6 h-6 text-white/60 group-hover:text-brand-400 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Creator Showcase Section */}
      <section className="relative py-24 lg:py-32 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-purple w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-pink/20 bg-accent-pink/5 mb-6">
                <Video className="w-3 h-3 text-accent-pink" />
                <span className="text-xs font-medium text-accent-pink">AI Video Creator</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                High-End Videos.<br />
                <span className="gradient-text">Zero Scripts.</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/40 mb-4">
                Describe what you want. AI creates scroll-stopping, production-quality videos
                optimized for every platform. Click any video to preview.
              </p>
              <Link href="/products/video-creator" className="inline-flex items-center gap-2 text-sm text-accent-pink hover:text-accent-pink/80 transition-colors">
                Learn more about Video Creator <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <VideoShowcase />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                Ready to<br />
                <span className="gradient-text">Dominate?</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/40">
                Start free. Scale when you&apos;re ready. No credit card required.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Free */}
              <motion.div variants={fadeInUp} className="gradient-border p-8 rounded-2xl">
                <div className="text-sm font-semibold text-white/50 mb-2">Starter</div>
                <div className="text-4xl font-black mb-1">Free</div>
                <div className="text-sm text-white/30 mb-6">Forever</div>
                <ul className="space-y-3 mb-8">
                  {["5 websites/month", "Basic SEO tools", "Community support", "1 AI agent"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/builder"
                  className="block w-full py-3 text-center rounded-xl border border-white/[0.1] text-sm font-semibold text-white/70 hover:text-white hover:border-white/20 transition-all"
                >
                  Get Started
                </Link>
              </motion.div>

              {/* Pro - Featured */}
              <motion.div variants={fadeInUp} className="relative p-8 rounded-2xl border border-brand-500/30 bg-brand-500/[0.03] shadow-glow">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-accent-purple text-xs font-bold text-white">
                  Most Popular
                </div>
                <div className="text-sm font-semibold text-brand-400 mb-2">Pro</div>
                <div className="text-4xl font-black mb-1">$49<span className="text-lg font-normal text-white/30">/mo</span></div>
                <div className="text-sm text-white/30 mb-6">Everything you need</div>
                <ul className="space-y-3 mb-8">
                  {["Unlimited websites", "AI Video Creator", "SEO Campaign Agent", "All 8 AI products", "Priority support"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full btn-gradient py-3 rounded-xl text-sm font-bold text-white shadow-glow">
                  <span>Start Pro Trial</span>
                </button>
              </motion.div>

              {/* Enterprise */}
              <motion.div variants={fadeInUp} className="gradient-border p-8 rounded-2xl">
                <div className="text-sm font-semibold text-white/50 mb-2">Enterprise</div>
                <div className="text-4xl font-black mb-1">Custom</div>
                <div className="text-sm text-white/30 mb-6">For teams & agencies</div>
                <ul className="space-y-3 mb-8">
                  {["White-label platform", "Custom AI training", "Dedicated agents", "API access (zoobicon.io)", "24/7 premium support"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 rounded-xl border border-white/[0.1] text-sm font-semibold text-white/70 hover:text-white hover:border-white/20 transition-all">
                  Contact Sales
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 lg:py-32 border-t border-white/[0.04] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-blue w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
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
              className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tight mb-6"
            >
              Stop Building Websites.<br />
              <span className="gradient-text-hero">Start Building Empires.</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="max-w-2xl mx-auto text-lg text-white/40 mb-10"
            >
              Join the next generation of creators, marketers, and entrepreneurs
              who refuse to settle for ordinary tools.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/builder"
                className="group btn-gradient px-10 py-5 rounded-2xl text-lg font-bold text-white flex items-center gap-3 shadow-glow-lg"
              >
                <span>Launch Your Empire</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold">Zoobicon</span>
              </div>
              <p className="text-sm text-white/30 max-w-xs leading-relaxed mb-6">
                The most advanced AI platform for building, marketing, and dominating the digital landscape.
              </p>
              <div className="flex gap-3">
                {DOMAINS.map((d) => (
                  <span key={d.domain} className="text-xs text-white/20 bg-white/[0.03] px-2.5 py-1 rounded-full border border-white/[0.04]">
                    {d.domain}
                  </span>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Products</div>
              <ul className="space-y-2.5">
                <li><Link href="/products/website-builder" className="text-sm text-white/30 hover:text-white/60 transition-colors">Website Builder</Link></li>
                <li><Link href="/products/seo-agent" className="text-sm text-white/30 hover:text-white/60 transition-colors">SEO Agent</Link></li>
                <li><Link href="/products/video-creator" className="text-sm text-white/30 hover:text-white/60 transition-colors">Video Creator</Link></li>
                <li><Link href="/products/email-support" className="text-sm text-white/30 hover:text-white/60 transition-colors">AI Email Support</Link></li>
                <li><Link href="/domains" className="text-sm text-white/30 hover:text-white/60 transition-colors">Domains</Link></li>
                <li><Link href="/marketplace" className="text-sm text-white/30 hover:text-white/60 transition-colors">Marketplace</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Platform</div>
              <ul className="space-y-2.5">
                <li><Link href="/developers" className="text-sm text-white/30 hover:text-white/60 transition-colors">API Docs</Link></li>
                <li><Link href="/cli" className="text-sm text-white/30 hover:text-white/60 transition-colors">CLI Tools</Link></li>
                <li><Link href="/developers#sdks" className="text-sm text-white/30 hover:text-white/60 transition-colors">SDKs</Link></li>
                <li><Link href="/developers#endpoints" className="text-sm text-white/30 hover:text-white/60 transition-colors">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">For Teams</div>
              <ul className="space-y-2.5">
                <li><Link href="/agencies" className="text-sm text-white/30 hover:text-white/60 transition-colors">Agencies</Link></li>
                <li><Link href="/agencies#white-label" className="text-sm text-white/30 hover:text-white/60 transition-colors">White Label</Link></li>
                <li><Link href="/agencies#pricing" className="text-sm text-white/30 hover:text-white/60 transition-colors">Agency Pricing</Link></li>
                <li><Link href="/auth/signup" className="text-sm text-white/30 hover:text-white/60 transition-colors">Sign Up</Link></li>
              </ul>
            </div>
          </div>

          <div className="section-divider mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/20">
              &copy; 2026 Zoobicon. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-white/20 hover:text-white/40 transition-colors">Privacy</a>
              <a href="#" className="text-xs text-white/20 hover:text-white/40 transition-colors">Terms</a>
              <a href="#" className="text-xs text-white/20 hover:text-white/40 transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
