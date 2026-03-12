"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  HelpCircle,
  Check,
  Minus,
  Bug,
  GitBranch,
  FileCode,
  Figma,
  Languages,
  ShoppingCart,
  Receipt,
  Lock,
  Wand2,
  Download,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

const ROTATING_WORDS = ["websites", "landing pages", "portfolios", "SaaS apps", "e-commerce stores", "dashboards"];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
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
    color: "from-blue-500 to-indigo-600",
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
  { value: "12+", label: "AI-Powered Tools" },
  { value: "30+", label: "Languages Supported" },
  { value: "WP", label: "WordPress Ready" },
  { value: "4", label: "Domain Ecosystem" },
];

const COMPETITOR_FEATURES = [
  { name: "AI Website Generation", zoobicon: true, wix: true, framer: false, durable: true, emergent: true },
  { name: "10-Agent Pipeline", zoobicon: true, wix: false, framer: false, durable: false, emergent: true },
  { name: "Industry-Aware Design AI", zoobicon: true, wix: false, framer: false, durable: false, emergent: false },
  { name: "No Credit System", zoobicon: true, wix: true, framer: true, durable: true, emergent: false },
  { name: "SEO Agent & Auto-Fix", zoobicon: true, wix: true, framer: false, durable: true, emergent: false },
  { name: "AI Video Creator", zoobicon: true, wix: false, framer: false, durable: false, emergent: false },
  { name: "GitHub & WP Export", zoobicon: true, wix: false, framer: false, durable: false, emergent: true },
  { name: "Figma Import", zoobicon: true, wix: false, framer: true, durable: false, emergent: false },
  { name: "i18n Translation (30+)", zoobicon: true, wix: true, framer: false, durable: false, emergent: false },
  { name: "E-commerce Builder", zoobicon: true, wix: true, framer: false, durable: false, emergent: true },
  { name: "Animation Editor", zoobicon: true, wix: false, framer: true, durable: false, emergent: false },
  { name: "White-Label Platform", zoobicon: true, wix: false, framer: false, durable: false, emergent: false },
  { name: "Domain Registration", zoobicon: true, wix: true, framer: false, durable: false, emergent: false },
  { name: "Flat Pricing from $19/mo", zoobicon: true, wix: true, framer: true, durable: true, emergent: false },
];

const NEW_FEATURES = [
  {
    icon: Bug,
    title: "Auto-Debugging",
    description: "AI catches and fixes errors before you see them",
    color: "from-red-500 to-orange-500",
    glowColor: "shadow-red-500/20",
  },
  {
    icon: GitBranch,
    title: "GitHub Import",
    description: "Paste any repo URL. Get a modernized website.",
    color: "from-gray-400 to-gray-600",
    glowColor: "shadow-gray-500/20",
  },
  {
    icon: Download,
    title: "WordPress Export",
    description: "One click to a full WordPress theme",
    color: "from-blue-500 to-indigo-600",
    glowColor: "shadow-blue-500/20",
  },
  {
    icon: Figma,
    title: "Figma Import",
    description: "Design in Figma, deploy with Zoobicon",
    color: "from-blue-500 to-pink-500",
    glowColor: "shadow-blue-500/20",
  },
  {
    icon: Languages,
    title: "i18n Translation",
    description: "30+ languages, one click",
    color: "from-emerald-500 to-teal-500",
    glowColor: "shadow-emerald-500/20",
  },
  {
    icon: ShoppingCart,
    title: "E-commerce Generator",
    description: "Complete stores with cart & checkout",
    color: "from-amber-500 to-yellow-500",
    glowColor: "shadow-amber-500/20",
  },
  {
    icon: Receipt,
    title: "CRM & Invoicing",
    description: "Business tools built in",
    color: "from-cyan-500 to-blue-500",
    glowColor: "shadow-cyan-500/20",
  },
  {
    icon: Lock,
    title: "Auth Scaffolding",
    description: "Login, database, admin — generated",
    color: "from-green-500 to-emerald-600",
    glowColor: "shadow-green-500/20",
  },
  {
    icon: Search,
    title: "SEO Scoring",
    description: "Real-time SEO analysis with auto-fix",
    color: "from-brand-500 to-brand-700",
    glowColor: "shadow-brand-500/20",
  },
  {
    icon: Wand2,
    title: "Animation Editor",
    description: "Professional animations, no code",
    color: "from-blue-500 to-fuchsia-500",
    glowColor: "shadow-blue-500/20",
  },
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
  const [user, setUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [liveCount, setLiveCount] = useState(127);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* Safari private mode / storage unavailable */ }
  }, []);

  // Rotating words animation
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Simulated live builder count
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((prev) => prev + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    setUser(null);
  };

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
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">Zoobicon</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <a href="#products" className="text-sm text-white/50 hover:text-white transition-colors">Products</a>
                <Link href="/marketplace" className="text-sm text-white/50 hover:text-white transition-colors">Marketplace</Link>
                <Link href="/domains" className="text-sm text-white/50 hover:text-white transition-colors">Domains</Link>
                <Link href="/developers" className="text-sm text-white/50 hover:text-white transition-colors">Developers</Link>
                <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/support" className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Support
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign out
                  </button>
                  <Link
                    href="/builder"
                    className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{user.name || user.email.split("@")[0]}</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2">
                    Sign in
                  </Link>
                  <Link
                    href="/builder"
                    className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  >
                    <span>Start Building</span>
                  </Link>
                </>
              )}
            </div>
            <button
              className="md:hidden text-white/60"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-white/[0.06] bg-[#050507]/95 backdrop-blur-2xl px-6 py-6 space-y-4" aria-label="Mobile navigation">
            <a href="#products" className="block text-sm text-white/60 hover:text-white">Products</a>
            <Link href="/marketplace" className="block text-sm text-white/60 hover:text-white">Marketplace</Link>
            <Link href="/domains" className="block text-sm text-white/60 hover:text-white">Domains</Link>
            <Link href="/developers" className="block text-sm text-white/60 hover:text-white">Developers</Link>
            <Link href="/agencies" className="block text-sm text-white/60 hover:text-white">Agencies</Link>
            <Link href="/support" className="block text-sm text-white/60 hover:text-white">Support</Link>
            <Link href="/pricing" className="block text-sm text-white/60 hover:text-white">Pricing</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="block text-sm text-white/60 hover:text-white flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <button onClick={handleLogout} className="block text-sm text-white/60 hover:text-white flex items-center gap-2 w-full text-left">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
                <Link href="/builder" className="block btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold text-white text-center mt-4">
                  <span>{user.name || user.email.split("@")[0]}&apos;s Builder</span>
                </Link>
              </>
            ) : (
              <Link href="/builder" className="block btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold text-white text-center mt-4">
                <span>Start Building</span>
              </Link>
            )}
          </nav>
        )}
      </nav>

      {/* Hero Section — Sci-Fi Portal */}
      <section className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden min-h-screen flex items-center">
        {/* Deep space background layers */}
        <div className="aurora-hero" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-grid" />
        <div className="hero-spotlight" />
        <div className="hero-scanlines" />
        {/* Portal rings */}
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />
        <div className="hero-ring hero-ring-3" />
        {/* Energy lines */}
        <div className="hero-light-line" style={{ top: "25%" }} />
        <div className="hero-light-line" style={{ top: "75%", animationDelay: "2.5s" }} />
        {/* Warp speed streaks */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="hero-warp-line" />
          <div className="hero-warp-line" />
          <div className="hero-warp-line" />
          <div className="hero-warp-line" />
          <div className="hero-warp-line" />
          <div className="hero-warp-line" />
        </div>
        {/* Floating energy particles */}
        <div className="hero-particles">
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
          <div className="hero-particle" />
        </div>
        {/* Radial vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050510]/40 via-transparent to-[#050510] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#050510_100%)] pointer-events-none" />
        {/* Top neon edge */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />
        {/* Energy beams */}
        <div className="hero-beam hero-beam-1" />
        <div className="hero-beam hero-beam-2" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Holographic Status Badge */}
            <motion.div variants={fadeInUp} className="flex justify-center mb-10">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-[#00f0ff]/20 bg-gradient-to-r from-[#00f0ff]/[0.06] via-purple-500/[0.04] to-[#00f0ff]/[0.06] backdrop-blur-2xl shadow-[0_0_40px_rgba(0,240,255,0.08),inset_0_0_20px_rgba(0,240,255,0.03)]">
                <div className="relative flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.9)]" />
                  <div className="absolute w-2 h-2 rounded-full bg-[#00f0ff] animate-ping opacity-60" />
                </div>
                <span className="text-xs font-semibold text-[#00f0ff]/90 tracking-wider uppercase">{liveCount} Agents Online</span>
                <span className="text-[#00f0ff]/20">|</span>
                <span className="text-xs font-medium text-white/40 tracking-wide">10,000+ sites materialized</span>
              </div>
            </motion.div>

            {/* Main Headline — Sci-Fi Dramatic */}
            <motion.h1
              variants={fadeInUp}
              className="hero-shimmer mb-8"
            >
              <span className="block text-[3rem] sm:text-[4rem] md:text-[5rem] lg:text-[6.5rem] font-black tracking-[-0.04em] leading-[0.85] text-white/95 drop-shadow-[0_0_80px_rgba(0,240,255,0.12)]">
                Conjure
              </span>
              <span className="block text-[3.2rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[7rem] font-black tracking-[-0.04em] leading-[0.85] mt-3">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 50, filter: "blur(12px)", scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                    exit={{ opacity: 0, y: -50, filter: "blur(12px)", scale: 1.1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="inline-block gradient-text-hero"
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="block text-[2.8rem] sm:text-[3.8rem] md:text-[4.5rem] lg:text-[5.5rem] font-black tracking-[-0.03em] leading-[0.9] text-white/60 mt-3">
                from thin air.
              </span>
            </motion.h1>

            {/* Sub headline — mystical tone */}
            <motion.p
              variants={fadeInUp}
              className="max-w-2xl mx-auto text-lg md:text-xl lg:text-2xl text-slate-400/90 leading-relaxed mb-10 font-light"
            >
              Speak your vision into existence. <span className="text-[#00f0ff]/80 font-medium">10 AI agents</span> materialize it
              in real-time — designed, coded, and deployed{" "}
              <span className="text-purple-300/80 font-medium">before your eyes</span>.
            </motion.p>

            {/* Social proof with holographic feel */}
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center items-center gap-6 mb-10">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050510] bg-gradient-to-br from-[#00f0ff] to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_8px_rgba(0,240,255,0.3)]">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#00f0ff] text-[#00f0ff]" />
                ))}
                <span className="text-sm text-white/40 ml-1.5">4.9/5 from 2,400+ builders</span>
              </div>
            </motion.div>

            {/* CTAs — Neon sci-fi */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/builder"
                className="cta-glow group relative px-12 py-5 rounded-2xl text-lg font-bold text-white flex items-center gap-3 bg-gradient-to-r from-[#00c8ff] via-purple-600 to-[#00f0ff] hover:shadow-[0_0_80px_rgba(0,240,255,0.4),0_0_120px_rgba(168,85,247,0.2)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <Wand2 className="w-5 h-5" />
                <span>Summon Your Website</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link href="/pricing" className="group px-10 py-5 rounded-2xl text-base font-medium text-slate-300 hover:text-white transition-all flex items-center gap-3 border border-[#00f0ff]/15 hover:border-[#00f0ff]/30 bg-[#00f0ff]/[0.03] hover:bg-[#00f0ff]/[0.07] backdrop-blur-sm">
                <Play className="w-4 h-4 text-[#00f0ff]" />
                <span>See Pricing</span>
              </Link>
            </motion.div>

            {/* Subtext */}
            <motion.p variants={fadeInUp} className="text-xs text-white/25 mb-20 tracking-wide">
              No credit card required. Unlimited builds on the free tier.
            </motion.p>

            {/* Hero Visual - Builder Demo with sci-fi frame */}
            <motion.div
              variants={fadeInUp}
              className="relative max-w-5xl mx-auto"
            >
              {/* Multi-layered neon glow behind the demo */}
              <div className="absolute -inset-8 bg-gradient-to-r from-[#00f0ff]/10 via-purple-600/5 to-[#00f0ff]/10 rounded-3xl blur-3xl pointer-events-none" />
              <div className="absolute -inset-1 rounded-2xl pointer-events-none bg-gradient-to-r from-[#00f0ff]/15 via-transparent to-purple-500/15" />
              {/* Sci-fi frame */}
              <div className="relative rounded-2xl overflow-hidden ring-1 ring-[#00f0ff]/[0.15] shadow-[0_25px_100px_rgba(0,240,255,0.12),0_0_60px_rgba(168,85,247,0.08),0_10px_40px_rgba(0,0,0,0.5)]">
                <BuilderDemo />
              </div>
              {/* Portal glow underneath */}
              <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[90%] h-80 bg-gradient-to-r from-[#00f0ff]/6 via-purple-500/10 to-[#00f0ff]/6 blur-[140px] rounded-full pointer-events-none" />
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

      {/* Competitor Comparison Banner */}
      <section className="relative py-24 lg:py-32 border-b border-white/[0.04] overflow-hidden">
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
                <Star className="w-3 h-3 text-brand-400" />
                <span className="text-xs font-medium text-brand-400">Industry Comparison</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                See Why Builders<br />
                <span className="gradient-text">Switch to Zoobicon</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/40">
                The only platform that does it all. No more juggling tools, plugins, or workarounds.
              </p>
            </motion.div>

            {/* Comparison Table */}
            <motion.div variants={fadeInUp} className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header Row */}
                <div className="grid grid-cols-6 gap-0 mb-2">
                  <div className="p-4" />
                  <div className="p-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-500/20 to-brand-400/10 border border-brand-500/30">
                      <Zap className="w-4 h-4 text-brand-400" />
                      <span className="text-sm font-bold text-white">Zoobicon</span>
                    </div>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm font-medium text-white/40">Wix</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm font-medium text-white/40">Framer</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm font-medium text-white/40">Durable</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm font-medium text-white/40">Emergent</span>
                  </div>
                </div>

                {/* Feature Rows */}
                {COMPETITOR_FEATURES.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className={`grid grid-cols-6 gap-0 ${
                      i % 2 === 0 ? "bg-white/[0.02]" : ""
                    } rounded-lg`}
                  >
                    <div className="p-4 flex items-center">
                      <span className="text-sm text-white/60 font-medium">{feature.name}</span>
                    </div>
                    <div className="p-4 flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    {[feature.wix, feature.framer, feature.durable, feature.emergent].map((has, j) => (
                      <div key={j} className="p-4 flex items-center justify-center">
                        {has ? (
                          <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white/30" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                            <Minus className="w-4 h-4 text-white/10" />
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                ))}

                {/* Score Row */}
                <div className="grid grid-cols-6 gap-0 mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="p-4">
                    <span className="text-sm font-bold text-white/60">Total Features</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black gradient-text">14/14</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black text-white/20">6/14</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black text-white/20">3/14</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black text-white/20">3/14</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black text-white/20">4/14</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA under comparison */}
            <motion.div variants={fadeInUp} className="text-center mt-12">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white shadow-glow"
              >
                <span>Try the Most Complete Builder</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* New Features Showcase */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-cyan w-[500px] h-[500px] top-0 right-1/4 opacity-5" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-6">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">New in 2026</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
                10 Game-Changing<br />
                <span className="gradient-text">Features Just Dropped</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/40">
                Every feature our competitors wish they had. Built, tested, and shipping today.
              </p>
            </motion.div>

            <motion.div
              variants={staggerFast}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid md:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              {NEW_FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={scaleIn}
                  whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" as const } }}
                  className="group relative p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all cursor-pointer"
                >
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${feature.color} blur-xl -z-10`} style={{ opacity: 0 }} />

                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold mb-2 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* NEW badge */}
                  <div className="absolute top-4 right-4">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      New
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="relative py-24 lg:py-32 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/20 bg-brand-500/5 mb-6">
                <Sparkles className="w-3 h-3 text-brand-400" />
                <span className="text-xs font-medium text-brand-400">Product Suite</span>
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

            {/* No credits banner */}
            <motion.div variants={fadeInUp} className="text-center mb-10">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.04]">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300/80">No credits. No tokens. No usage traps. Flat pricing you can actually understand.</span>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {/* Free */}
              <motion.div variants={fadeInUp} className="gradient-border p-7 rounded-2xl">
                <div className="text-sm font-semibold text-white/50 mb-2">Starter</div>
                <div className="text-4xl font-black mb-1">Free</div>
                <div className="text-sm text-white/30 mb-5">Forever</div>
                <ul className="space-y-2.5 mb-7">
                  {["5 websites/month", "Industry-aware AI", "Basic SEO tools", "Export HTML"].map((f) => (
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

              {/* Creator */}
              <motion.div variants={fadeInUp} className="relative p-7 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.03]">
                <div className="text-sm font-semibold text-emerald-400 mb-2">Creator</div>
                <div className="text-4xl font-black mb-1">$19<span className="text-lg font-normal text-white/30">/mo</span></div>
                <div className="text-sm text-white/30 mb-5">Unlimited quality</div>
                <ul className="space-y-2.5 mb-7">
                  {["Unlimited websites", "10-agent pipeline", "Custom domains", "GitHub & WP export", "Basic SEO agent"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block w-full py-3 rounded-xl text-sm font-bold text-center bg-emerald-600 hover:bg-emerald-500 text-white transition-all">
                  Start Creator Trial
                </Link>
              </motion.div>

              {/* Pro - Featured */}
              <motion.div variants={fadeInUp} className="relative p-7 rounded-2xl border border-brand-500/30 bg-brand-500/[0.03] shadow-glow">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-400 text-xs font-bold text-white">
                  Most Popular
                </div>
                <div className="text-sm font-semibold text-brand-400 mb-2">Pro</div>
                <div className="text-4xl font-black mb-1">$49<span className="text-lg font-normal text-white/30">/mo</span></div>
                <div className="text-sm text-white/30 mb-5">Full arsenal</div>
                <ul className="space-y-2.5 mb-7">
                  {["Everything in Creator", "AI Video Creator", "Full SEO Agent", "AI Brand Kit", "All 12+ AI tools"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="block w-full btn-gradient py-3 rounded-xl text-sm font-bold text-white shadow-glow text-center">
                  Start Pro Trial
                </Link>
              </motion.div>

              {/* Enterprise */}
              <motion.div variants={fadeInUp} className="gradient-border p-7 rounded-2xl">
                <div className="text-sm font-semibold text-white/50 mb-2">Enterprise</div>
                <div className="text-4xl font-black mb-1">Custom</div>
                <div className="text-sm text-white/30 mb-5">Teams & agencies</div>
                <ul className="space-y-2.5 mb-7">
                  {["White-label platform", "Custom AI training", "Dedicated agents", "Unlimited API", "24/7 support"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="mailto:sales@zoobicon.com?subject=Enterprise Inquiry" className="block w-full py-3 rounded-xl border border-white/[0.1] text-sm font-semibold text-white/70 hover:text-white hover:border-white/20 transition-all text-center">
                  Contact Sales
                </a>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Add-on Upsell Strip */}
      <section className="relative py-16 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-black tracking-tight mb-1">Clip the ticket on every service</h2>
                <p className="text-sm text-white/30">Domains, hosting, AI agents, templates — add what you need, skip what you don&apos;t.</p>
              </div>
              <Link href="/marketplace" className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                Explore the Marketplace <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

            <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: "Domains", price: "from $2.99/yr", href: "/domains", color: "text-brand-400 border-brand-500/15" },
                { label: "Hosting", price: "$12.99/mo", href: "/hosting", color: "text-accent-cyan border-accent-cyan/15" },
                { label: "SEO Agent", price: "$29/mo", href: "/marketplace", color: "text-emerald-400 border-emerald-500/15" },
                { label: "Video Creator", price: "$19/mo", href: "/marketplace", color: "text-purple-400 border-purple-500/15" },
                { label: "Email Marketing", price: "$14/mo", href: "/marketplace", color: "text-amber-400 border-amber-500/15" },
                { label: "Chatbot", price: "$14/mo", href: "/marketplace", color: "text-pink-400 border-pink-500/15" },
              ].map((item) => (
                <motion.div key={item.label} variants={fadeInUp}>
                  <Link href={item.href} className={`block text-center p-4 rounded-xl border ${item.color} bg-white/[0.01] hover:bg-white/[0.03] transition-all`}>
                    <div className="text-xs font-bold text-white/70 mb-1">{item.label}</div>
                    <div className="text-[10px] text-white/30">{item.price}</div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center">
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
                <li><Link href="/support" className="text-sm text-white/30 hover:text-white/60 transition-colors">AI Support</Link></li>
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
              <Link href="/privacy" className="text-xs text-white/20 hover:text-white/40 transition-colors">Privacy</Link>
              <Link href="/terms" className="text-xs text-white/20 hover:text-white/40 transition-colors">Terms</Link>
              <Link href="/privacy" className="text-xs text-white/20 hover:text-white/40 transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
