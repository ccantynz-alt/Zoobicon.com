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

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center pt-16">
        {/* Rich gradient mesh background */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Primary gradient blobs — layered for depth */}
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/[0.07] blur-[120px]" />
          <div className="absolute top-[10%] right-[-5%] w-[50%] h-[60%] rounded-full bg-indigo-600/[0.06] blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[50%] rounded-full bg-cyan-600/[0.04] blur-[120px]" />
          <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-blue-500/[0.05] blur-[80px]" />
          {/* Subtle dot pattern overlay with radial fade */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: "radial-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 70%)",
            }}
          />
          {/* Top edge highlight — subtle light bleed from above */}
          <div className="absolute top-0 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-8">
                AI-POWERED PLATFORM
              </div>

              <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.5rem] font-black tracking-[-0.03em] leading-[1.05] mb-6 text-white">
                Build, deploy, grow{" "}
                <span className="block text-white/50">your online presence</span>
              </h1>

              <p className="text-lg text-white/45 leading-relaxed mb-8 max-w-lg">
                Your all-in-one AI platform for building websites, marketing, and scaling online.
                10 AI agents work together to create production-ready sites in seconds.
              </p>

              <div className="flex flex-wrap items-center gap-4 mb-10">
                <Link
                  href="/builder"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-base font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-[0_0_30px_rgba(59,130,246,0.2),0_8px_24px_rgba(59,130,246,0.15)] hover:shadow-[0_0_40px_rgba(59,130,246,0.3),0_12px_32px_rgba(59,130,246,0.2)] hover:-translate-y-0.5 duration-300"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Building Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#products"
                  className="inline-flex items-center gap-2 px-6 py-4 text-white/60 text-sm font-semibold uppercase tracking-wider hover:text-white transition-colors border border-white/10 hover:border-white/20 rounded-xl"
                >
                  Explore Services
                </Link>
              </div>

              <p className="text-xs text-white/25">
                No credit card required. Build unlimited sites on the free plan.
              </p>
            </motion.div>

            {/* Right — Service cards (SiteGround style) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="space-y-3">
                {[
                  { icon: Globe, label: "Build a website", active: false },
                  { icon: Search, label: "Optimize for SEO", active: false },
                  { icon: Sparkles, label: "Generate with AI", active: true },
                  { icon: Video, label: "Create videos", active: false },
                  { icon: Mail, label: "Send email campaigns", active: false },
                  { icon: Globe, label: "Register a domain", active: false },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  >
                    <Link
                      href={i === 0 ? "/products/website-builder" : i === 1 ? "/products/seo-agent" : i === 2 ? "/builder" : i === 3 ? "/products/video-creator" : i === 5 ? "/domains" : "#products"}
                      className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-200 group ${
                        item.active
                          ? "bg-white/[0.08] border border-white/[0.12] shadow-[0_0_20px_rgba(59,130,246,0.06)]"
                          : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.active ? "bg-blue-500/15" : "bg-white/[0.04]"
                      }`}>
                        <item.icon className={`w-5 h-5 ${item.active ? "text-blue-400" : "text-white/40 group-hover:text-white/60"} transition-colors`} />
                      </div>
                      <span className={`text-sm font-medium ${item.active ? "text-white" : "text-white/50 group-hover:text-white/70"} transition-colors`}>
                        {item.label}
                      </span>
                      {item.active && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {!item.active && (
                        <ChevronRight className="ml-auto w-4 h-4 text-white/15 group-hover:text-white/30 transition-colors" />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Trust bar at bottom of hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 lg:mt-24 pt-8 border-t border-white/[0.06]"
          >
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                ))}
              </div>
              <span className="text-sm text-white/50">
                Top rated — <span className="text-white/70 font-semibold">4.9 out of 5 stars</span>. Trusted by the builders of 10,000+ websites.
              </span>
            </div>
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
