"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Store,
  Search,
  ArrowRight,
  Star,
  Download,
  Check,
  RefreshCw,
  Zap,
  Globe,
  Palette,
  Shield,
  Code2,
  BarChart3,
  Mail,
  MessageSquare,
  Video,
  Bot,
  FileText,
  Layers,
  Image,
  Type,
  Layout,
  Megaphone,
  CreditCard,
  Users,
  Clock,
  TrendingUp,
  Filter,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";

/* ---------- animation helpers ---------- */
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

/* ---------- icon map (API returns iconName as string) ---------- */
const ICON_MAP: Record<string, React.ElementType> = {
  Layout, Search, Video, Mail, CreditCard, BarChart3, MessageSquare,
  Palette, Bot, Code2, FileText, Image, Type, Globe, Users, Clock,
  TrendingUp, Megaphone, Shield, Layers,
};

/* ---------- categories ---------- */
const CATEGORIES = [
  "All",
  "Templates",
  "AI Agents",
  "Integrations",
  "Analytics",
  "E-Commerce",
  "Marketing",
  "Design",
  "Developer Tools",
];

/* ---------- types ---------- */
interface MarketplaceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  priceLabel: string;
  priceType: "free" | "one-time" | "monthly";
  rating: number;
  installs: string;
  iconName: string;
  gradient: string;
  featured?: boolean;
  tag?: string | null;
}

/* ---------- hardcoded fallback (matches API catalog) ---------- */
const FALLBACK_ITEMS: MarketplaceItem[] = [
  { id: "premium-template-pack", name: "Premium Template Pack", category: "Templates", description: "50 hand-crafted, conversion-optimized website templates for SaaS, e-commerce, portfolios, and more.", price: 2900, priceLabel: "$29", priceType: "one-time", rating: 4.9, installs: "12.4K", iconName: "Layout", gradient: "from-brand-500 to-brand-700", featured: true, tag: "Best Seller" },
  { id: "seo-campaign-agent", name: "SEO Campaign Agent", category: "AI Agents", description: "Autonomous SEO agent that researches keywords, writes content, builds backlinks, and tracks rankings 24/7.", price: 2900, priceLabel: "$29/mo", priceType: "monthly", rating: 4.8, installs: "8.2K", iconName: "Search", gradient: "from-accent-cyan to-emerald-600", featured: true, tag: "Top Rated" },
  { id: "ai-video-creator", name: "AI Video Creator", category: "AI Agents", description: "Generate scroll-stopping videos for TikTok, Instagram, YouTube, and Facebook. No scripts needed.", price: 1900, priceLabel: "$19/mo", priceType: "monthly", rating: 4.7, installs: "6.8K", iconName: "Video", gradient: "from-accent-purple to-pink-600", featured: true },
  { id: "ai-email-support", name: "AI Email Support", category: "AI Agents", description: "World-class AI customer support. Auto-replies, sentiment analysis, smart routing, 24/7 operation.", price: 2400, priceLabel: "$24/mo", priceType: "monthly", rating: 4.9, installs: "4.5K", iconName: "Mail", gradient: "from-amber-500 to-orange-600", tag: "New" },
  { id: "stripe-payments", name: "Stripe Payments", category: "E-Commerce", description: "Accept payments instantly. Stripe integration with checkout pages, subscriptions, and invoicing.", price: 0, priceLabel: "Free", priceType: "free", rating: 4.8, installs: "15.1K", iconName: "CreditCard", gradient: "from-indigo-500 to-blue-600" },
  { id: "google-analytics", name: "Google Analytics", category: "Analytics", description: "Full Google Analytics 4 integration. Track visitors, conversions, and user behavior automatically.", price: 0, priceLabel: "Free", priceType: "free", rating: 4.6, installs: "18.3K", iconName: "BarChart3", gradient: "from-emerald-500 to-teal-600" },
  { id: "social-media-manager", name: "Social Media Manager", category: "Marketing", description: "AI auto-creates, schedules, and publishes social media posts across all platforms. Hashtag optimization.", price: 1400, priceLabel: "$14/mo", priceType: "monthly", rating: 4.5, installs: "5.1K", iconName: "MessageSquare", gradient: "from-cyan-500 to-blue-600" },
  { id: "ai-brand-kit", name: "AI Brand Kit", category: "Design", description: "Complete brand identity: logo, colors, typography, style guide — all AI-generated from your description.", price: 1900, priceLabel: "$19", priceType: "one-time", rating: 4.7, installs: "7.9K", iconName: "Palette", gradient: "from-pink-500 to-rose-600" },
  { id: "ai-chatbot-builder", name: "AI Chatbot Builder", category: "AI Agents", description: "Deploy custom AI chatbots on any website. Trained on your content, branded to your style. 24/7 support bot.", price: 1400, priceLabel: "$14/mo", priceType: "monthly", rating: 4.6, installs: "3.8K", iconName: "Bot", gradient: "from-blue-500 to-indigo-600" },
  { id: "custom-code-injection", name: "Custom Code Injection", category: "Developer Tools", description: "Add custom HTML, CSS, and JavaScript to any page. Header/footer injection, Google Tag Manager, pixels.", price: 0, priceLabel: "Free", priceType: "free", rating: 4.4, installs: "9.2K", iconName: "Code2", gradient: "from-slate-500 to-zinc-600" },
  { id: "blog-cms-engine", name: "Blog & CMS Engine", category: "Templates", description: "Full-featured blog with AI writing assistant, categories, tags, RSS feed, and SEO optimization built in.", price: 900, priceLabel: "$9/mo", priceType: "monthly", rating: 4.7, installs: "6.3K", iconName: "FileText", gradient: "from-amber-600 to-yellow-500" },
  { id: "image-optimizer", name: "Image Optimizer", category: "Developer Tools", description: "Auto-compress, resize, and convert images to WebP/AVIF. Lazy loading and responsive images built in.", price: 0, priceLabel: "Free", priceType: "free", rating: 4.5, installs: "11.7K", iconName: "Image", gradient: "from-green-500 to-emerald-600" },
  { id: "custom-fonts-pack", name: "Custom Fonts Pack", category: "Design", description: "1,000+ premium web fonts. Google Fonts integration plus exclusive custom typefaces for your brand.", price: 900, priceLabel: "$9", priceType: "one-time", rating: 4.3, installs: "8.6K", iconName: "Type", gradient: "from-rose-500 to-pink-600" },
  { id: "multi-language-i18n", name: "Multi-Language (i18n)", category: "Integrations", description: "Auto-translate your website into 30+ languages. AI-powered translations with locale-specific SEO.", price: 1400, priceLabel: "$14/mo", priceType: "monthly", rating: 4.6, installs: "3.2K", iconName: "Globe", gradient: "from-blue-500 to-indigo-600" },
  { id: "lead-gen-forms", name: "Lead Gen & Forms", category: "Marketing", description: "Smart forms with conditional logic, file uploads, and CRM integrations. Captures and scores leads with AI.", price: 900, priceLabel: "$9/mo", priceType: "monthly", rating: 4.7, installs: "7.4K", iconName: "Users", gradient: "from-orange-500 to-red-500" },
  { id: "uptime-monitor", name: "Uptime Monitor", category: "Analytics", description: "24/7 website monitoring with instant alerts via email, Slack, and SMS. 1-minute check intervals.", price: 0, priceLabel: "Free", priceType: "free", rating: 4.4, installs: "5.6K", iconName: "Clock", gradient: "from-teal-500 to-cyan-600" },
  { id: "ab-testing-engine", name: "A/B Testing Engine", category: "Analytics", description: "Test headlines, layouts, CTAs, and more. AI-powered statistical analysis picks the winner for you.", price: 1900, priceLabel: "$19/mo", priceType: "monthly", rating: 4.8, installs: "2.9K", iconName: "TrendingUp", gradient: "from-blue-500 to-blue-600", tag: "New" },
  { id: "email-marketing-suite", name: "Email Marketing Suite", category: "Marketing", description: "AI writes and designs email campaigns. Auto-segment audiences, drip sequences, analytics, and A/B testing.", price: 1400, priceLabel: "$14/mo", priceType: "monthly", rating: 4.6, installs: "4.8K", iconName: "Megaphone", gradient: "from-red-500 to-orange-500" },
  { id: "ssl-security-suite", name: "SSL & Security Suite", category: "Integrations", description: "Wildcard SSL, DDoS protection, WAF, malware scanning, and automatic security patching. Enterprise-grade.", price: 900, priceLabel: "$9/mo", priceType: "monthly", rating: 4.9, installs: "10.2K", iconName: "Shield", gradient: "from-emerald-600 to-green-500" },
  { id: "component-library", name: "Component Library", category: "Developer Tools", description: "200+ pre-built UI components: navbars, hero sections, pricing tables, footers, testimonials, and more.", price: 1900, priceLabel: "$19", priceType: "one-time", rating: 4.5, installs: "6.1K", iconName: "Layers", gradient: "from-sky-500 to-blue-600" },
];

/* ---------- helpers ---------- */
function getIcon(iconName: string): React.ElementType {
  return ICON_MAP[iconName] || Layers;
}

function getStoredInstalls(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = localStorage.getItem("zoobicon_installed_addons");
    return new Set(saved ? JSON.parse(saved) : []);
  } catch {
    return new Set();
  }
}

function persistInstalls(ids: Set<string>) {
  try {
    localStorage.setItem("zoobicon_installed_addons", JSON.stringify([...ids]));
  } catch { /* noop */ }
}

function getEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    const user = localStorage.getItem("zoobicon_user");
    if (user) {
      const parsed = JSON.parse(user);
      return parsed.email || "";
    }
  } catch { /* noop */ }
  return "";
}

/* ====================================================================== */
/*  Component                                                              */
/* ====================================================================== */

export default function MarketplacePage() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<MarketplaceItem[]>(FALLBACK_ITEMS);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [installed, setInstalled] = useState<Set<string>>(getStoredInstalls);
  const [installing, setInstalling] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* --- Fetch add-ons from API on mount --- */
  useEffect(() => {
    async function fetchAddons() {
      try {
        const res = await fetch("/api/marketplace/addons");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (data.success && Array.isArray(data.addons) && data.addons.length > 0) {
          setItems(data.addons);
        }
      } catch {
        // silently fall back to hardcoded data
      }
    }
    fetchAddons();
  }, []);

  /* --- Handle Stripe checkout return --- */
  useEffect(() => {
    const success = searchParams.get("success");
    const addonId = searchParams.get("addon");
    if (success === "true" && addonId) {
      // Mark as installed after successful payment
      setInstalled((prev) => {
        const next = new Set(prev);
        next.add(addonId);
        persistInstalls(next);
        return next;
      });
      // Find addon name for banner
      const addon = items.find((a) => a.id === addonId);
      setSuccessBanner(addon?.name || addonId);
      // Clean URL params without full page reload
      window.history.replaceState({}, "", "/marketplace");
    }
  }, [searchParams, items]);

  /* --- Install handler --- */
  const handleInstall = useCallback(async (item: MarketplaceItem) => {
    if (installing) return;
    if (installed.has(item.id)) return;

    const email = getEmail();

    // Free add-on: call install API then record locally
    if (item.priceType === "free") {
      setInstalling(item.id);
      setError(null);
      try {
        const res = await fetch("/api/marketplace/install", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addonId: item.id, email: email || "anonymous@zoobicon.com" }),
        });
        const data = await res.json();
        if (data.success && data.installed) {
          setInstalled((prev) => {
            const next = new Set(prev);
            next.add(item.id);
            persistInstalls(next);
            return next;
          });
        } else {
          throw new Error(data.error || "Install failed");
        }
      } catch (err) {
        // Fallback: install locally even if API fails
        setInstalled((prev) => {
          const next = new Set(prev);
          next.add(item.id);
          persistInstalls(next);
          return next;
        });
      }
      setInstalling(null);
      return;
    }

    // Paid add-on: call install API to get Stripe checkout URL
    if (!email) {
      // Redirect to signup if not logged in
      window.location.href = "/auth/signup?redirect=/marketplace";
      return;
    }

    setInstalling(item.id);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addonId: item.id, email }),
      });
      const data = await res.json();
      if (data.success && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error(data.error || "Checkout failed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setInstalling(null);
    }
  }, [installing, installed]);

  /* --- Filtering --- */
  const filteredItems = items.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice =
      priceFilter === "all" ||
      (priceFilter === "free" && item.priceType === "free") ||
      (priceFilter === "paid" && item.priceType !== "free");
    return matchesCategory && matchesSearch && matchesPrice;
  });

  const featuredItems = items.filter((item) => item.featured);

  /* --- Button rendering helper --- */
  const renderButton = (item: MarketplaceItem, size: "sm" | "lg") => {
    const isInstalled = installed.has(item.id);
    const isInstalling = installing === item.id;
    const Icon = getIcon(item.iconName);

    const sizeClasses = size === "lg"
      ? "px-4 py-2 rounded-lg text-xs"
      : "px-3 py-1.5 rounded-lg text-[10px]";
    const iconSize = size === "lg" ? "w-3.5 h-3.5" : "w-3 h-3";

    return (
      <button
        onClick={() => handleInstall(item)}
        className={`${sizeClasses} font-bold flex items-center gap-1.5 transition-all ${
          isInstalled
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "btn-gradient text-white"
        }`}
        disabled={isInstalled || isInstalling}
      >
        {isInstalled ? (
          <><Check className={iconSize} />Installed</>
        ) : isInstalling ? (
          <><RefreshCw className={`${iconSize} animate-spin`} />
            {item.priceType === "free" ? "Installing…" : "Redirecting…"}</>
        ) : item.priceType === "free" ? (
          <><Download className={iconSize} />Install</>
        ) : (
          <><CreditCard className={iconSize} />Buy {item.priceLabel}</>
        )}
      </button>
    );
  };

  return (
    <div className="relative min-h-screen">
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-pink-600 flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-xs text-white/60">/</span>
            <span className="text-sm text-white/65">Marketplace</span>
          </div>
          <Link href="/auth/signup" className="btn-gradient px-5 py-2 rounded-xl text-sm font-semibold text-white">
            <span>Get Started</span>
          </Link>
        </div>
      </nav>
      <CursorGlowTracker />

      {/* Success Banner */}
      {successBanner && (
        <div className="fixed top-16 left-0 right-0 z-40">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-medium text-emerald-300">
                  <strong>{successBanner}</strong> has been installed successfully!
                </span>
              </div>
              <button onClick={() => setSuccessBanner(null)} className="text-emerald-400/60 hover:text-emerald-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="fixed top-16 left-0 right-0 z-40">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20"
            >
              <span className="text-sm font-medium text-red-300">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-purple/20 bg-accent-purple/5">
                <Store className="w-3 h-3 text-accent-purple" />
                <span className="text-xs font-medium text-accent-purple">Add-ons Marketplace</span>
              </span>
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6">
              Supercharge<br />
              <span className="gradient-text-hero">Your Stack.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-2xl text-lg md:text-xl text-white/60 leading-relaxed mb-10">
              Discover premium templates, AI agents, integrations, and tools that extend the power
              of your Zoobicon platform. Install with one click.
            </motion.p>

            {/* Search */}
            <motion.div variants={fadeInUp} className="max-w-2xl flex items-center gap-3 mb-8">
              <div className="flex-1 flex items-center bg-white/[0.07] border border-white/[0.12] rounded-xl overflow-hidden focus-within:border-accent-purple/30 transition-colors">
                <Search className="w-4 h-4 text-white/60 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search add-ons, templates, agents..."
                  className="flex-1 bg-transparent px-3 py-3 text-white placeholder:text-white/60 outline-none text-sm"
                />
              </div>
              <div className="flex items-center gap-1 bg-white/[0.07] border border-white/[0.12] rounded-xl p-1">
                {(["all", "free", "paid"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setPriceFilter(filter)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      priceFilter === filter
                        ? "bg-accent-purple/20 text-accent-purple"
                        : "text-white/60 hover:text-white/65"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { value: "20+", label: "Add-ons available" },
                { value: "5", label: "Free add-ons" },
                { value: "50K+", label: "Total installs" },
                { value: "4.7", label: "Avg. rating" },
              ].map((stat) => (
                <div key={stat.label} className="gradient-border p-4 rounded-xl text-center">
                  <div className="text-2xl font-black gradient-text-static">{stat.value}</div>
                  <div className="text-xs text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured */}
      <section className="pb-16 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-accent-purple" />
              <h2 className="text-2xl font-black">Featured</h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-4">
              {featuredItems.map((item, i) => {
                const Icon = getIcon(item.iconName);
                return (
                  <motion.div key={item.id || i} variants={fadeInUp} className="relative gradient-border p-6 rounded-2xl group card-hover">
                    {item.tag && (
                      <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple text-[10px] font-bold border border-accent-purple/30">
                        {item.tag}
                      </div>
                    )}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold mb-0.5 group-hover:text-white transition-colors">{item.name}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-white/65">{item.rating}</span>
                          </div>
                          <span className="text-[10px] text-white/60">&bull;</span>
                          <span className="text-xs text-white/60">{item.installs} installs</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed mb-4">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold ${item.priceType === "free" ? "text-emerald-400" : "text-white/70"}`}>
                        {item.priceLabel}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.id === "ai-video-creator" && (
                          <Link href="/video-creator" className="px-3 py-1.5 rounded-lg text-xs font-bold text-accent-purple border border-accent-purple/20 hover:bg-accent-purple/10 transition-colors flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />Try It
                          </Link>
                        )}
                        {renderButton(item, "lg")}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* All Add-ons */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            {/* Category Filters */}
            <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-8">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-accent-purple/20 text-accent-purple border border-accent-purple/30"
                      : "border border-white/[0.10] bg-white/[0.05] text-white/60 hover:text-white/60 hover:border-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>

            {/* Results count */}
            <motion.div variants={fadeInUp} className="flex items-center gap-2 mb-6">
              <Filter className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">{filteredItems.length} add-ons</span>
            </motion.div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const Icon = getIcon(item.iconName);
                return (
                  <motion.div
                    key={item.id}
                    variants={fadeInUp}
                    className="relative gradient-border p-5 rounded-xl group card-hover"
                  >
                    {item.tag && (
                      <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple text-[9px] font-bold border border-accent-purple/20">
                        {item.tag}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate group-hover:text-white transition-colors">{item.name}</h3>
                        <span className="text-[10px] text-white/60">{item.category}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/60 leading-relaxed mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-[10px] text-white/65">{item.rating}</span>
                        </div>
                        <span className={`text-[10px] font-semibold ${item.priceType === "free" ? "text-emerald-400/70" : "text-white/60"}`}>
                          {item.priceLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.id === "ai-video-creator" && (
                          <Link href="/video-creator" className="px-2 py-1 rounded-lg text-[10px] font-bold text-accent-purple border border-accent-purple/20 hover:bg-accent-purple/10 transition-colors">
                            Try It
                          </Link>
                        )}
                        {renderButton(item, "sm")}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-white/30 mx-auto mb-4" />
                <div className="text-lg font-bold text-white/60 mb-2">No add-ons found</div>
                <div className="text-sm text-white/60">Try a different search or category</div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* For Developers */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}>
            <motion.div variants={fadeInUp} className="gradient-border p-10 md:p-16 rounded-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-brand-500/5" />
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-purple/20 bg-accent-purple/5 mb-4">
                    <Code2 className="w-3 h-3 text-accent-purple" />
                    <span className="text-xs font-medium text-accent-purple">Build Add-ons</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl font-black mb-4">
                    Build & Sell Your<br /><span className="gradient-text">Own Add-ons</span>
                  </h3>
                  <p className="text-base text-white/60 leading-relaxed mb-6">
                    Join our developer marketplace. Build custom templates, integrations, and tools — sell them to
                    thousands of Zoobicon users. Earn 80% revenue share on every sale.
                  </p>
                  <ul className="space-y-2 mb-8">
                    {[
                      "80% revenue share on all sales",
                      "Full SDK & developer documentation",
                      "Marketplace analytics dashboard",
                      "Featured placement opportunities",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/65">
                        <Zap className="w-4 h-4 text-accent-purple flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/developers"
                    className="inline-flex group btn-gradient px-8 py-4 rounded-2xl text-base font-bold text-white items-center gap-3 shadow-glow-purple"
                  >
                    <span>Start Building Add-ons</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="flex-shrink-0 hidden md:block">
                  <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-accent-purple/20 to-brand-500/20 border border-accent-purple/10 flex items-center justify-center">
                    <div className="text-center">
                      <Code2 className="w-16 h-16 text-accent-purple/40 mx-auto mb-4" />
                      <div className="text-3xl font-black gradient-text-static">80%</div>
                      <div className="text-xs text-white/60 mt-1">Revenue Share</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <Store className="w-12 h-12 text-accent-purple/30 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Everything You Need.<br /><span className="gradient-text">One Marketplace.</span>
          </h2>
          <p className="text-lg text-white/60 mb-8">Templates, AI agents, integrations, and tools — all designed to work perfectly with Zoobicon.</p>
          <Link href="/auth/signup" className="inline-flex group btn-gradient px-10 py-4 rounded-2xl text-lg font-bold text-white items-center gap-3 shadow-glow-lg">
            <span>Explore Marketplace</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.08] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <div className="text-xs text-white/60">&copy; 2026 Zoobicon</div>
          <div className="flex gap-4">
            <Link href="/" className="text-xs text-white/60 hover:text-white/60">Home</Link>
            <Link href="/domains" className="text-xs text-white/60 hover:text-white/60">Domains</Link>
            <Link href="/products/website-builder" className="text-xs text-white/60 hover:text-white/60">Builder</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
