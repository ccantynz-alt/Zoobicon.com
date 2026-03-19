"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import BuilderDemo from "@/components/BuilderDemo";
import VideoShowcase from "@/components/VideoShowcase";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroDemo from "@/components/HeroDemo";
import ActivityFeed from "@/components/ActivityFeed";
import LiveCounter from "@/components/LiveCounter";
import ShowcaseGallery from "@/components/ShowcaseGallery";
import BeforeAfter from "@/components/BeforeAfter";
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
  Eye,
  Film,
  Building2,
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
  { name: "Multi-Agent Pipeline", zoobicon: true, wix: false, framer: false, durable: false, emergent: true },
  { name: "Industry-Aware Design AI", zoobicon: true, wix: false, framer: false, durable: false, emergent: false },
  { name: "No Credit System", zoobicon: true, wix: true, framer: true, durable: true, emergent: false },
  { name: "SEO Agent & Auto-Fix", zoobicon: true, wix: true, framer: false, durable: true, emergent: false },
  { name: "AI Video Creator", zoobicon: false, wix: false, framer: false, durable: false, emergent: false },
  { name: "GitHub & WP Export", zoobicon: true, wix: false, framer: false, durable: false, emergent: true },
  { name: "Figma Import", zoobicon: true, wix: false, framer: true, durable: false, emergent: false },
  { name: "i18n Translation (30+)", zoobicon: true, wix: true, framer: false, durable: false, emergent: false },
  { name: "E-commerce Builder", zoobicon: true, wix: true, framer: false, durable: false, emergent: true },
  { name: "Animation Editor", zoobicon: true, wix: false, framer: true, durable: false, emergent: false },
  { name: "White-Label Platform", zoobicon: true, wix: false, framer: false, durable: false, emergent: false },
  { name: "Domain Registration", zoobicon: false, wix: true, framer: false, durable: false, emergent: false },
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
    icon: Eye,
    title: "Competitor Crawler",
    description: "Analyze any site's tech stack, features, and strategy",
    color: "from-violet-500 to-purple-600",
    glowColor: "shadow-violet-500/20",
  },
  {
    icon: Film,
    title: "Video Storyboards",
    description: "AI storyboard scripts for any platform",
    color: "from-pink-500 to-rose-600",
    glowColor: "shadow-pink-500/20",
  },
  {
    icon: Building2,
    title: "Agency White-Label",
    description: "Your brand, your clients, your platform",
    color: "from-amber-500 to-orange-600",
    glowColor: "shadow-amber-500/20",
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
    description: "Built for scale with security-first architecture. Reliable infrastructure designed for production workloads.",
  },
  {
    icon: TrendingUp,
    title: "Market Domination Tools",
    description: "SEO agents, competitor intelligence, and trend analysis that give you an unfair advantage in any market.",
  },
  {
    icon: Layers,
    title: "Full Ecosystem",
    description: "Four domains, one unified platform. Everything you need to build, grow, and dominate online.",
  },
  {
    icon: Globe,
    title: "Multi-Platform Publishing",
    description: "One-click deploy to the web. Export to WordPress, GitHub, or host on zoobicon.sh with a custom domain.",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Founder & CEO",
    company: "TechFlow",
    quote: "We replaced our entire frontend team's prototyping workflow. What took days now takes 90 seconds. The quality is indistinguishable from hand-coded sites.",
    stars: 5,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Marcus Rodriguez",
    role: "Head of Growth",
    company: "ScaleUp",
    quote: "The multi-agent pipeline is genuinely different from anything else. It doesn't just generate HTML — it thinks about strategy, copy, SEO, and animations separately. The output quality shows.",
    stars: 5,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Emma Larsson",
    role: "Creative Director",
    company: "NovaStar",
    quote: "I was skeptical about AI-generated design. Then I saw the Opus output. Dark mode, responsive, micro-interactions — all in one prompt. Now my agency uses Zoobicon for every client pitch.",
    stars: 5,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    name: "David Park",
    role: "CTO",
    company: "BuildPro",
    quote: "The white-label agency platform let us launch our own branded AI builder in a week. Our clients think we built it from scratch. Revenue up 340% in Q1.",
    stars: 5,
    gradient: "from-emerald-500 to-teal-500",
  },
];

const SOCIAL_PROOF_LOGOS = [
  "Acme Corp", "TechFlow", "NovaStar", "BuildPro", "ScaleUp", "DataWave",
  "Meridian", "Axiom", "Luminary", "Vertex", "Catalyst", "Orbit",
];

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, inView: boolean) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return count;
}

// Hero code animation lines
const CODE_LINES = [
  { text: '<!-- AI Agent: Building your site -->', cls: 'syn-comment' },
  { text: '<div class="hero-section">', cls: 'syn-tag' },
  { text: '  <h1 class="gradient-text">', cls: 'syn-tag' },
  { text: '    Welcome to the Future', cls: '' },
  { text: '  </h1>', cls: 'syn-tag' },
  { text: '  <p class="subtitle">', cls: 'syn-tag' },
  { text: '    AI-powered everything.', cls: '' },
  { text: '  </p>', cls: 'syn-tag' },
  { text: '  <button class="cta-btn">', cls: 'syn-tag' },
  { text: '    Get Started Free', cls: '' },
  { text: '  </button>', cls: 'syn-tag' },
  { text: '</div>', cls: 'syn-tag' },
  { text: '<section class="features">', cls: 'syn-tag' },
  { text: '  <div class="grid-3">', cls: 'syn-tag' },
  { text: '    <!-- 7 agents working... -->', cls: 'syn-comment' },
];

function HeroCodeAnimation() {
  const [phase, setPhase] = useState<'code' | 'preview'>('code');
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    // Type out code lines one by one
    const lineTimer = setInterval(() => {
      setVisibleLines(prev => {
        if (prev >= CODE_LINES.length) {
          clearInterval(lineTimer);
          // After all lines shown, switch to preview
          setTimeout(() => setPhase('preview'), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 200);

    // Full cycle: reset after showing preview
    const cycleTimer = setInterval(() => {
      setPhase('code');
      setVisibleLines(0);
    }, 10000);

    return () => {
      clearInterval(lineTimer);
      clearInterval(cycleTimer);
    };
  }, [phase]);

  return (
    <div className="relative w-full">
      {/* Animated gradient border container */}
      <div className="card-glow">
        <div className="code-window">
          <div className="code-window-header">
            <div className="code-window-dot" style={{ background: '#ff5f57' }} />
            <div className="code-window-dot" style={{ background: '#febc2e' }} />
            <div className="code-window-dot" style={{ background: '#28c840' }} />
            <span className="ml-3 text-[11px] text-white/30 font-mono">index.html — Zoobicon AI</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                LIVE
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {phase === 'code' ? (
              <motion.div
                key="code"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                transition={{ duration: 0.4 }}
                className="p-4 min-h-[320px] overflow-hidden"
              >
                {CODE_LINES.slice(0, visibleLines).map((line, i) => (
                  <div
                    key={i}
                    className="code-line"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <span className="text-white/20 mr-3 select-none text-[10px]">
                      {String(i + 1).padStart(2, ' ')}
                    </span>
                    <span className={line.cls}>{line.text}</span>
                  </div>
                ))}
                {visibleLines < CODE_LINES.length && (
                  <div className="inline-block w-[7px] h-[16px] bg-brand-400/80 animate-pulse ml-6 mt-1" />
                )}
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                className="preview-morph p-4 min-h-[320px]"
              >
                {/* Fake rendered website preview */}
                <div className="rounded-lg overflow-hidden border border-white/[0.06] bg-gradient-to-br from-[#0a0a1a] to-[#0f0f2a]">
                  {/* Mini nav */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06]">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-brand-500 to-purple-500" />
                    <div className="w-16 h-2 rounded bg-white/10" />
                    <div className="ml-auto flex gap-2">
                      <div className="w-10 h-2 rounded bg-white/8" />
                      <div className="w-10 h-2 rounded bg-white/8" />
                      <div className="w-12 h-2.5 rounded bg-brand-500/40" />
                    </div>
                  </div>
                  {/* Mini hero */}
                  <div className="p-4 text-center">
                    <div className="w-32 h-3 rounded bg-gradient-to-r from-brand-500/60 to-purple-500/60 mx-auto mb-2" />
                    <div className="w-48 h-2 rounded bg-white/10 mx-auto mb-1" />
                    <div className="w-40 h-2 rounded bg-white/8 mx-auto mb-3" />
                    <div className="w-20 h-5 rounded bg-brand-500/40 mx-auto mb-4" />
                  </div>
                  {/* Mini cards */}
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                    {[0,1,2].map(j => (
                      <div key={j} className="p-2 rounded border border-white/[0.06] bg-white/[0.02]">
                        <div className="w-5 h-5 rounded bg-gradient-to-br from-brand-500/30 to-purple-500/30 mb-1.5" />
                        <div className="w-full h-1.5 rounded bg-white/8 mb-1" />
                        <div className="w-3/4 h-1.5 rounded bg-white/5" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center mt-3">
                  <span className="text-[10px] text-emerald-400/80 font-semibold tracking-wider uppercase">
                    Build complete — deployed to zoobicon.sh
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Animated counter stat component
function AnimatedStat({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const count = useCountUp(value, 2000, isInView);
  return (
    <motion.div ref={ref} variants={fadeInUp} className="text-center">
      <div className="text-4xl md:text-5xl font-bold font-sharp text-white text-glow mb-2">
        {count}{suffix}
      </div>
      <div className="text-sm text-white/35 uppercase tracking-[0.15em] font-medium">{label}</div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name?: string; role?: string } | null>(null);
  const [wordIndex, setWordIndex] = useState(0);
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

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch {}
    setUser(null);
  };

  return (
    <div className="relative bg-void">
      {/* Background Effects */}
      <BackgroundEffects preset="technical" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-2xl" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zoo-500 to-zoo-400 flex items-center justify-center shadow-glow-zoo">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight font-display">Zoobicon</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <a href="#products" className="text-sm font-medium text-white/50 hover:text-white transition-colors tracking-wide">Products</a>
                <Link href="/marketplace" className="text-sm font-medium text-white/50 hover:text-white transition-colors tracking-wide">Marketplace</Link>
                <Link href="/domains" className="text-sm font-medium text-white/50 hover:text-white transition-colors tracking-wide">Domains</Link>
                <Link href="/developers" className="text-sm font-medium text-white/50 hover:text-white transition-colors tracking-wide">Developers</Link>
                <Link href="/pricing" className="text-sm font-medium text-white/50 hover:text-white transition-colors tracking-wide">Pricing</Link>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link href="/support" className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Support
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2 flex items-center gap-1.5"
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
                  <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-4 py-2">
                    Sign in
                  </Link>
                  <Link
                    href="/builder"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-zoo-500 to-zoo-400 shadow-glow-zoo hover:shadow-glow-zoo-lg hover:-translate-y-0.5 transition-all duration-300"
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
          <nav className="md:hidden border-t border-white/[0.06] bg-black/95 backdrop-blur-2xl px-6 py-6 space-y-4" aria-label="Mobile navigation">
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

      {/* Cursor glow tracker — enables CSS-based cursor following */}
      <CursorGlowTracker />

      {/* ================================================================
          HERO SECTION — The "holy shit" moment
          ================================================================ */}
      <section className="relative overflow-hidden min-h-screen flex items-center pt-16">
        <HeroEffects
          variant="cyan"
          cursorGlow
          particles
          particleCount={35}
          interactiveGrid
          aurora
          beams
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative z-10 py-16 lg:py-24">
          {/* Hero headline — centered, massive */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12 lg:mb-16"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/70 text-xs font-bold uppercase tracking-[0.2em] mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zoo-400" />
              </span>
              7 AI AGENTS. ONE PROMPT. INFINITE POSSIBILITIES.
            </motion.div>

            <h1 className="font-display text-[3.5rem] sm:text-[5rem] lg:text-[7rem] xl:text-8xl font-extrabold tracking-[-0.04em] leading-[0.9] mb-6 text-white">
              <span className="gradient-text-zoo-animated">Describe it.</span>
              <br />
              <span className="relative inline-block">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -40, filter: "blur(8px)" }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-white/90 inline-block"
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="text-white/30 block mt-2 text-[0.35em] tracking-normal font-semibold">
                materialize in seconds.
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-white/50 leading-relaxed max-w-2xl mx-auto mb-10 font-light">
              7 AI agents collaborate to build production-ready websites, SaaS apps,
              and e-commerce stores from a single prompt. No templates. No code. No limits.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
              <Link
                href="/builder"
                className="btn-zoo group inline-flex items-center gap-3 text-base font-bold px-10 py-4 rounded-2xl"
              >
                Start Building Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#showcase"
                className="btn-zoo-outline inline-flex items-center gap-2 text-base px-8 py-4 rounded-2xl"
              >
                See Examples
                <Eye className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-white/40 font-medium">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zoo-400" /> No credit card
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zoo-400" /> Unlimited builds
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zoo-400" /> Free hosting
              </span>
            </div>
          </motion.div>

          {/* Live builder demo — the product IS the hero */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-5xl mx-auto"
          >
            <HeroDemo />
            {/* Activity feed — positioned absolutely on desktop */}
            <div className="hidden xl:block absolute -right-[340px] top-8">
              <ActivityFeed />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          LIVE STATS — Real numbers, not fake logos
          ================================================================ */}
      <section className="relative py-16 lg:py-20 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <LiveCounter />
        </div>
      </section>

      {/* Competitor Comparison Banner */}
      <section className="relative py-24 lg:py-32 border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-blue w-[700px] h-[700px] top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 opacity-15" />
          <div className="glow-orb glow-orb-purple w-[500px] h-[500px] top-1/3 right-0 opacity-15" />
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
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-6 text-white text-glow">
                See Why Builders<br />
                <span className="text-white/60">Switch to Zoobicon</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60 tracking-wide">
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
                    <span className="text-sm font-medium text-white/60">Wix</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm font-medium text-white/60">Framer</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm font-medium text-white/60">Durable</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-sm font-medium text-white/60">Emergent</span>
                  </div>
                </div>

                {/* Feature Rows */}
                {COMPETITOR_FEATURES.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className={`grid grid-cols-6 gap-0 ${
                      i % 2 === 0 ? "bg-white/[0.08]" : ""
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
                          <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/[0.06] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white/65" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/[0.06] flex items-center justify-center">
                            <Minus className="w-4 h-4 text-white/30" />
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                ))}

                {/* Score Row */}
                <div className="grid grid-cols-6 gap-0 mt-4 pt-4 border-t border-white/[0.10]">
                  <div className="p-4">
                    <span className="text-sm font-bold text-white/60">Total Features</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black gradient-text">12/14</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black text-white/60">6/14</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black text-white/60">3/14</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black text-white/60">3/14</span>
                  </div>
                  <div className="p-4 text-center">
                    <span className="text-2xl font-black text-white/60">4/14</span>
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
          <div className="glow-orb glow-orb-cyan w-[500px] h-[500px] top-0 right-1/4 opacity-15" />
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
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-6 text-white text-glow">
                10 Game-Changing<br />
                <span className="text-white/60">Features Just Dropped</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60 tracking-wide">
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
                  className="group relative p-6 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.10] transition-all cursor-pointer"
                >
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${feature.color} blur-xl -z-10`} style={{ opacity: 0 }} />

                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-bold mb-2 group-hover:text-white transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed">
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
      <section id="products" className="relative py-24 lg:py-32 border-t border-white/[0.06]">
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
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-6 text-white text-glow">
                Everything You Need to<br />
                <span className="text-white/60">Dominate Online</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60 tracking-wide">
                AI-powered products working in harmony. Each one best-in-class.
                Together, an unstoppable digital powerhouse.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRODUCTS.map((product, i) => {
                const content = (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`icon-glow w-12 h-12 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center shadow-lg`}>
                        <product.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/65 bg-white/[0.07] px-2.5 py-1 rounded-full">
                        {product.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed mb-4">
                      {product.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Globe className="w-3 h-3" />
                      <span>{product.domain}</span>
                    </div>
                  </>
                );
                return (
                  <motion.div key={i} variants={fadeInUp}>
                    {product.href ? (
                      <Link href={product.href} className="block card-glow card-tilt p-6 rounded-2xl group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                        {content}
                      </Link>
                    ) : (
                      <div className="card-glow card-tilt p-6 rounded-2xl group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
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
      <section id="ecosystem" className="relative py-24 lg:py-32 border-t border-white/[0.06]">
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
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-6 text-white text-glow">
                Four Domains.<br />
                <span className="text-white/60">One Empire.</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60 tracking-wide">
                We own every extension. Complete market presence across .com, .ai, .io, and .sh — an impenetrable brand fortress.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DOMAINS.map((d, i) => (
                <motion.div key={i} variants={fadeInUp}>
                  <Link
                    href={d.href}
                    className={`block relative p-6 rounded-2xl border ${d.borderColor} bg-white/[0.08] hover:bg-white/[0.07] transition-all group`}
                  >
                    <d.icon className={`w-8 h-8 ${d.color} mb-4`} />
                    <div className="text-xl font-bold mb-1 group-hover:text-white transition-colors">
                      {d.domain}
                    </div>
                    <div className={`text-sm font-semibold ${d.color} mb-2`}>
                      {d.label}
                    </div>
                    <p className="text-sm text-white/60">
                      {d.description}
                    </p>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Connection visualization */}
            <motion.div variants={fadeInUp} className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/[0.10] bg-white/[0.08]">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-brand-500/30 border border-brand-500/40" />
                  <div className="w-6 h-6 rounded-full bg-accent-purple/30 border border-accent-purple/40" />
                  <div className="w-6 h-6 rounded-full bg-accent-cyan/30 border border-accent-cyan/40" />
                  <div className="w-6 h-6 rounded-full bg-amber-500/30 border border-amber-500/40" />
                </div>
                <span className="text-sm text-white/65">All domains. One unified platform. Total market coverage.</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 lg:py-32 border-t border-white/[0.06]">
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
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-6 text-white text-glow">
                Built Different.<br />
                <span className="text-white/60">Built to Win.</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60 tracking-wide">
                We didn&apos;t build another tool. We built the platform that makes every other tool obsolete.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" as const } }}
                  className="card-glow card-tilt p-8 rounded-2xl group"
                >
                  <div className="icon-glow w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-400/10 border border-brand-500/20 flex items-center justify-center mb-5 group-hover:border-brand-500/40 transition-colors">
                    <feature.icon className="w-6 h-6 text-brand-400/80 group-hover:text-brand-300 transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold font-sharp mb-3">{feature.title}</h3>
                  <p className="text-sm text-white/35 leading-relaxed tracking-wide">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 lg:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-purple w-[600px] h-[600px] top-1/4 left-1/4 opacity-10" />
          <div className="glow-orb glow-orb-cyan w-[400px] h-[400px] bottom-1/4 right-1/4 opacity-10" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 mb-6">
                <Star className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-medium text-amber-400">What Builders Say</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-6 text-white text-glow">
                Loved by Teams<br />
                <span className="text-white/60">Who Ship Fast</span>
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="card-glow p-6 rounded-2xl relative testimonial-quote"
                >
                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-4">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-sm text-white/55 leading-relaxed mb-6">
                    &ldquo;{t.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 mt-auto">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/80">{t.name}</div>
                      <div className="text-xs text-white/40">{t.role}, {t.company}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Video Creator Showcase Section */}
      <section className="relative py-24 lg:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-purple w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />
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
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-6 text-white text-glow">
                High-End Videos.<br />
                <span className="text-white/60">Zero Scripts.</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60 tracking-wide mb-4">
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
      <section id="pricing" className="relative py-24 lg:py-32 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] mb-6 text-white text-glow">
                Ready to<br />
                <span className="text-white/60">Dominate?</span>
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-white/60 tracking-wide">
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
                <div className="text-sm font-semibold text-white/65 mb-2">Starter</div>
                <div className="text-4xl font-black mb-1">Free</div>
                <div className="text-sm text-white/65 mb-5">Forever</div>
                <ul className="space-y-2.5 mb-7">
                  {["3 websites/month", "Full 7-agent AI pipeline", "Opus-powered builds", "7-day hosting preview"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/65">
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
                <div className="text-4xl font-black mb-1">$19<span className="text-lg font-normal text-white/65">/mo</span></div>
                <div className="text-sm text-white/65 mb-5">Unlimited quality</div>
                <ul className="space-y-2.5 mb-7">
                  {["Unlimited websites", "7-agent AI pipeline", "Custom domains", "GitHub & WP export", "Basic SEO agent"].map((f) => (
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
                <div className="text-4xl font-black mb-1">$49<span className="text-lg font-normal text-white/65">/mo</span></div>
                <div className="text-sm text-white/65 mb-5">Full arsenal</div>
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
                <div className="text-sm font-semibold text-white/65 mb-2">Enterprise</div>
                <div className="text-4xl font-black mb-1">Custom</div>
                <div className="text-sm text-white/65 mb-5">Teams & agencies</div>
                <ul className="space-y-2.5 mb-7">
                  {["White-label platform", "Custom AI training", "Dedicated agents", "Unlimited API", "24/7 support"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/65">
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
      <section className="relative py-16 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold font-sharp tracking-[-0.03em] mb-1">Clip the ticket on every service</h2>
                <p className="text-sm text-white/65">Domains, hosting, AI agents, templates — add what you need, skip what you don&apos;t.</p>
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
                  <Link href={item.href} className={`block text-center p-4 rounded-xl border ${item.color} bg-white/[0.06] hover:bg-white/[0.06] transition-all`}>
                    <div className="text-xs font-bold text-white/70 mb-1">{item.label}</div>
                    <div className="text-[10px] text-white/65">{item.price}</div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          SHOWCASE GALLERY — Prove the quality
          ================================================================ */}
      <section id="showcase" className="relative py-24 lg:py-32 border-t border-white/[0.06]">
        <ShowcaseGallery />
      </section>

      {/* ================================================================
          BEFORE / AFTER — The magic moment
          ================================================================ */}
      <section className="relative py-24 lg:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb glow-orb-purple w-[600px] h-[600px] top-1/3 left-1/4 opacity-10" />
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zoo-400/20 bg-zoo-400/5 mb-6">
                <Sparkles className="w-3 h-3 text-zoo-400" />
                <span className="text-xs font-medium text-zoo-400">The Magic</span>
              </div>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="font-display text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-[-0.04em] mb-6 text-white">
              From Words to<br />
              <span className="gradient-text-zoo">Websites</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="max-w-2xl mx-auto text-lg text-white/50">
              Drag the slider to see the transformation. One prompt. One click. A complete website.
            </motion.p>
          </motion.div>
          <BeforeAfter />
        </div>
      </section>

      {/* ================================================================
          FINAL CTA — Cinematic close
          ================================================================ */}
      <section className="relative py-24 lg:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0">
          <div className="glow-orb w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" style={{ background: "radial-gradient(circle, rgba(124, 90, 255, 0.4), transparent 60%)" }} />
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
              className="font-display text-4xl md:text-6xl lg:text-8xl font-extrabold tracking-[-0.04em] mb-6 text-white"
            >
              Stop Dreaming.<br />
              <span className="gradient-text-zoo">Start Building.</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="max-w-2xl mx-auto text-lg text-white/50 mb-10"
            >
              Join thousands of creators, agencies, and entrepreneurs
              who build production-ready websites in seconds, not weeks.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/builder"
                className="btn-zoo group inline-flex items-center gap-3 text-lg font-bold px-12 py-5 rounded-2xl"
              >
                <span>Start Building Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.10] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white/70" />
                </div>
                <span className="text-lg font-bold font-sharp">Zoobicon</span>
              </div>
              <p className="text-sm text-white/35 max-w-xs leading-relaxed mb-6 tracking-wide">
                The most advanced AI platform for building, marketing, and dominating the digital landscape.
              </p>
              <div className="flex gap-3">
                {DOMAINS.map((d) => (
                  <span key={d.domain} className="text-xs text-white/60 bg-white/[0.06] px-2.5 py-1 rounded-full border border-white/[0.06]">
                    {d.domain}
                  </span>
                ))}
              </div>
            </div>

            {/* Links */}
            <div>
              <div className="text-xs font-semibold text-white/65 uppercase tracking-wider mb-4">Products</div>
              <ul className="space-y-2.5">
                <li><Link href="/products/website-builder" className="text-sm text-white/65 hover:text-white/60 transition-colors">Website Builder</Link></li>
                <li><Link href="/products/seo-agent" className="text-sm text-white/65 hover:text-white/60 transition-colors">SEO Agent</Link></li>
                <li><Link href="/products/video-creator" className="text-sm text-white/65 hover:text-white/60 transition-colors">Video Creator</Link></li>
                <li><Link href="/products/email-support" className="text-sm text-white/65 hover:text-white/60 transition-colors">AI Email Support</Link></li>
                <li><Link href="/domains" className="text-sm text-white/65 hover:text-white/60 transition-colors">Domains</Link></li>
                <li><Link href="/marketplace" className="text-sm text-white/65 hover:text-white/60 transition-colors">Marketplace</Link></li>
                <li><Link href="/generators" className="text-sm text-white/65 hover:text-white/60 transition-colors">32 Generators</Link></li>
                <li><Link href="/crawl" className="text-sm text-white/65 hover:text-white/60 transition-colors">Competitor Crawler</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/65 uppercase tracking-wider mb-4">Platform</div>
              <ul className="space-y-2.5">
                <li><Link href="/developers" className="text-sm text-white/65 hover:text-white/60 transition-colors">API Docs</Link></li>
                <li><Link href="/cli" className="text-sm text-white/65 hover:text-white/60 transition-colors">CLI Tools</Link></li>
                <li><Link href="/developers#sdks" className="text-sm text-white/65 hover:text-white/60 transition-colors">SDKs</Link></li>
                <li><Link href="/developers#endpoints" className="text-sm text-white/65 hover:text-white/60 transition-colors">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/65 uppercase tracking-wider mb-4">For Teams</div>
              <ul className="space-y-2.5">
                <li><Link href="/agencies" className="text-sm text-white/65 hover:text-white/60 transition-colors">Agencies</Link></li>
                <li><Link href="/agencies#white-label" className="text-sm text-white/65 hover:text-white/60 transition-colors">White Label</Link></li>
                <li><Link href="/agencies/portal" className="text-sm text-white/65 hover:text-white/60 transition-colors">Client Portal</Link></li>
                <li><Link href="/support" className="text-sm text-white/65 hover:text-white/60 transition-colors">AI Support</Link></li>
                <li><Link href="/auth/signup" className="text-sm text-white/65 hover:text-white/60 transition-colors">Sign Up</Link></li>
              </ul>
            </div>
          </div>

          <div className="section-divider mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/60">
              &copy; 2026 Zoobicon. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-white/60 hover:text-white/60 transition-colors">Privacy</Link>
              <Link href="/terms" className="text-xs text-white/60 hover:text-white/60 transition-colors">Terms</Link>
              <Link href="/privacy" className="text-xs text-white/60 hover:text-white/60 transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
