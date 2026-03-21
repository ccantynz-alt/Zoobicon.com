"use client";

import { useState } from "react";
import Link from "next/link";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Sparkles, Globe, Layout, Calendar, BarChart3, Palette, Search, Moon,
  FileText, Link2, Briefcase, BookOpen, MapPin, Ticket, Store, Smartphone,
  Settings, FormInput, Mail, Presentation, PenTool, Code2, Boxes, UtensilsCrossed,
  Home, FileBarChart, Chrome, PaintBucket, Users, FolderKanban, GraduationCap,
  Package, Workflow, ArrowRight, Zap, Bot, Layers, Star, Menu, X, ShoppingCart,
  MessageCircle, Newspaper, Share2, FileSearch, Mic, Heart, Dumbbell, PartyPopper,
} from "lucide-react";
import { endpointToGeneratorId } from "@/lib/generator-prompts";

const GENERATOR_CATEGORIES = [
  {
    name: "Websites",
    color: "from-blue-500 to-cyan-500",
    generators: [
      { name: "Landing Page", description: "High-converting pages with 12 optimized sections, pricing tables, FAQ accordions", endpoint: "/api/generate/landing", icon: Layout, tag: "Popular" },
      { name: "Portfolio & Case Studies", description: "Awwwards-quality creative portfolios with filterable projects and lightbox galleries", endpoint: "/api/generate/portfolio", icon: Briefcase },
      { name: "Blog & Magazine", description: "Content sites with article management, categories, search, comments, and dark mode", endpoint: "/api/generate/blog", icon: BookOpen },
      { name: "Business Directory", description: "Yelp-style directories with search, filters, reviews, ratings, and detail views", endpoint: "/api/generate/directory", icon: MapPin },
      { name: "Event & Conference", description: "Conference sites with countdown timers, speaker grids, schedules, and ticket tiers", endpoint: "/api/generate/event", icon: Ticket },
      { name: "Restaurant", description: "Premium restaurant sites with interactive menus, reservations, gallery, and online ordering", endpoint: "/api/generate/restaurant", icon: UtensilsCrossed },
      { name: "Real Estate", description: "Property listing sites with search, mortgage calculator, agent profiles, and saved listings", endpoint: "/api/generate/realestate", icon: Home },
      { name: "Marketplace", description: "Two-sided marketplace platforms with listings, profiles, messaging, reviews, and search", endpoint: "/api/generate/marketplace", icon: Store },
      { name: "E-Commerce Store", description: "Complete storefronts with product grids, shopping cart, checkout, reviews, wishlists, and discount codes", endpoint: "/api/generate/ecommerce", icon: ShoppingCart, tag: "Popular" },
      { name: "Podcast Website", description: "Audio-first sites with episode player, guest spotlights, subscription badges, and newsletter signup", endpoint: "/api/generate/podcast", icon: Mic },
      { name: "Nonprofit & Charity", description: "Donation-focused sites with impact stats, beneficiary stories, volunteer signup, and fundraiser events", endpoint: "/api/generate/nonprofit", icon: Heart },
      { name: "Fitness & Wellness", description: "Class schedules, trainer profiles, membership tiers, transformation galleries, and trial booking", endpoint: "/api/generate/fitness", icon: Dumbbell },
      { name: "Wedding & Events", description: "Elegant sites with countdown, RSVP form, wedding party, registry links, travel info, and photo gallery", endpoint: "/api/generate/wedding", icon: PartyPopper },
    ],
  },
  {
    name: "Business Applications",
    color: "from-blue-500 to-blue-500",
    generators: [
      { name: "SaaS Dashboard", description: "Full SaaS apps with user management, analytics, billing, settings, and team features", endpoint: "/api/generate/saas", icon: Layout, tag: "Popular" },
      { name: "Booking System", description: "Appointment booking with calendar, time slots, services, staff selection, and confirmations", endpoint: "/api/generate/booking", icon: Calendar },
      { name: "Admin Panel / CMS", description: "Content management with WYSIWYG editor, media library, navigation editor, and theme customizer", endpoint: "/api/generate/admin", icon: Settings },
      { name: "HR Management", description: "Employee directory, leave management, attendance, org chart, payroll, and performance reviews", endpoint: "/api/generate/hrm", icon: Users },
      { name: "Project Management", description: "Kanban boards, task lists, timelines, team workload, time tracking, and milestones", endpoint: "/api/generate/project-mgmt", icon: FolderKanban },
      { name: "Learning Platform (LMS)", description: "Course catalog, lesson player, progress tracking, quizzes, certificates, and student dashboard", endpoint: "/api/generate/lms", icon: GraduationCap },
      { name: "Inventory Management", description: "Stock tracking, order management, supplier directory, low-stock alerts, and analytics reports", endpoint: "/api/generate/inventory", icon: Package },
      { name: "Data Dashboard", description: "Analytics dashboards with KPI cards, SVG charts, heatmaps, tables, and date range pickers", endpoint: "/api/generate/dashboard", icon: BarChart3 },
      { name: "Mobile App UI", description: "Native-feeling app interfaces with bottom tabs, onboarding flow, profile page, and empty states", endpoint: "/api/generate/mobile-app", icon: Smartphone, tag: "New" },
      { name: "Chatbot Interface", description: "AI chatbot UIs with message bubbles, quick replies, typing indicators, and conversation history", endpoint: "/api/generate/chatbot-ui", icon: MessageCircle, tag: "New" },
    ],
  },
  {
    name: "Enhancement Agents",
    color: "from-emerald-500 to-teal-500",
    generators: [
      { name: "Animation Agent", description: "Inject scroll reveals, parallax, animated counters, text animations, and micro-interactions", endpoint: "/api/generate/animations", icon: Sparkles, tag: "Agent" },
      { name: "SEO Markup Agent", description: "Add Open Graph, Twitter Cards, JSON-LD schema, heading fixes, image alt text, and performance hints", endpoint: "/api/generate/seo-markup", icon: Search, tag: "Agent" },
      { name: "Dark Mode Agent", description: "Add complete theme system with toggle, CSS variables, system preference detection, and persistence", endpoint: "/api/generate/dark-mode", icon: Moon, tag: "Agent" },
      { name: "Forms Backend Agent", description: "Make forms functional with validation, submission handling, spam protection, and email templates", endpoint: "/api/generate/forms-backend", icon: FileText, tag: "Agent" },
      { name: "Integrations Agent", description: "Inject GA4, Facebook Pixel, Calendly, Google Maps, WhatsApp, Intercom, cookie consent, and more", endpoint: "/api/generate/integrations", icon: Link2, tag: "Agent" },
    ],
  },
  {
    name: "Marketing & Content",
    color: "from-orange-500 to-red-500",
    generators: [
      { name: "Email Sequence", description: "Multi-email campaigns with HTML templates, send timing, segmentation rules, and KPI benchmarks", endpoint: "/api/generate/email-sequence", icon: Mail },
      { name: "Pitch Deck", description: "Interactive HTML slide decks with SVG charts, keyboard navigation, and print-to-PDF support", endpoint: "/api/generate/pitch-deck", icon: Presentation },
      { name: "Copywriter Agent", description: "Professional copy with A/B headline alternates, benefit-focused writing, and SEO meta content", endpoint: "/api/generate/copy", icon: PenTool, tag: "Agent" },
      { name: "Form Builder", description: "Multi-step forms with conditional logic, real-time validation, auto-save, and admin submissions view", endpoint: "/api/generate/form-builder", icon: FormInput },
      { name: "Newsletter Template", description: "Email-client-compatible newsletter templates with hero article, content grid, and curated links", endpoint: "/api/generate/newsletter", icon: Newspaper },
      { name: "Social Media Pack", description: "Multi-platform post templates: quote cards, product announcements, testimonials, and infographics", endpoint: "/api/generate/social-media", icon: Share2 },
      { name: "Case Study / Whitepaper", description: "Long-form case studies with challenge/solution/results, metrics charts, and client testimonials", endpoint: "/api/generate/case-study", icon: FileSearch },
      { name: "Product Documentation", description: "Technical docs with sidebar navigation, API reference, code examples, and changelog", endpoint: "/api/generate/documentation", icon: BookOpen, tag: "New" },
    ],
  },
  {
    name: "Developer Tools",
    color: "from-cyan-500 to-blue-500",
    generators: [
      { name: "REST API Generator", description: "Complete APIs with database schema, endpoint handlers, auth, rate limiting, and interactive docs", endpoint: "/api/generate/api-gen", icon: Code2 },
      { name: "Chrome Extension", description: "Manifest V3 extensions with popup UI, content scripts, background workers, and options page", endpoint: "/api/generate/chrome-ext", icon: Chrome },
      { name: "Component Library", description: "UI component libraries with live demos, all states, dark mode toggle, and usage code snippets", endpoint: "/api/generate/component-lib", icon: Boxes },
      { name: "Progressive Web App", description: "Installable PWAs with service worker, offline support, install prompt, and native-app feel", endpoint: "/api/generate/pwa", icon: Smartphone },
    ],
  },
  {
    name: "Design Systems",
    color: "from-cyan-500 to-rose-500",
    generators: [
      { name: "Brand Kit", description: "Complete design systems with colors, typography, spacing, components, voice, and style guide page", endpoint: "/api/generate/brand-kit", icon: Palette },
      { name: "Style Guide Extractor", description: "Analyze existing sites to extract and document every color, font, spacing value, and component", endpoint: "/api/generate/style-guide", icon: PaintBucket },
      { name: "Business Report", description: "Print-ready reports with cover page, SVG charts, professional tables, and table of contents", endpoint: "/api/generate/report", icon: FileBarChart },
    ],
  },
];

const PIPELINE_TIERS = [
  { name: "Standard", agents: 6, description: "Strategist → Brand + Copy → Architect → Developer → QA", speed: "~60s" },
  { name: "Premium", agents: 6, description: "Enhanced prompts for agency-quality output", speed: "~90s" },
  { name: "Ultra", agents: 10, description: "Full pipeline + Animation, SEO, and Forms agents in parallel", speed: "~120s", tag: "Best Quality" },
];

export default function GeneratorsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allGenerators = GENERATOR_CATEGORIES.flatMap((cat) =>
    cat.generators.map((gen) => ({ ...gen, category: cat.name, color: cat.color }))
  );

  const filteredGenerators = selectedCategory
    ? allGenerators.filter((g) => g.category === selectedCategory)
    : searchQuery
      ? allGenerators.filter(
          (g) =>
            g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allGenerators;

  const totalGenerators = allGenerators.length;

  return (
    <div className="min-h-screen text-white relative">
      <BackgroundEffects preset="technical" />
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.10] bg-[#0a0a12]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/builder" className="text-sm text-white/65 hover:text-white transition-colors">Builder</Link>
            <Link href="/pricing" className="text-sm text-white/65 hover:text-white transition-colors">Pricing</Link>
            <Link href="/generators" className="text-sm text-brand-400">Generators</Link>
            <Link href="/developers" className="text-sm text-white/65 hover:text-white transition-colors">API</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/builder"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-500/20 text-brand-400 rounded-lg text-sm font-medium hover:bg-brand-500/30 transition-colors"
            >
              Open Builder
              <ArrowRight size={14} />
            </Link>
            <button className="md:hidden text-white/65" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>
      <CursorGlowTracker />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-6">
            <Bot size={14} />
            {totalGenerators} AI Generators + 10-Agent Pipeline
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Generate{" "}
            <span className="bg-gradient-to-r from-brand-400 to-blue-400 bg-clip-text text-transparent">
              anything
            </span>
          </h1>
          <p className="text-lg text-white/65 max-w-2xl mx-auto mb-10">
            {totalGenerators} specialized AI generators for websites, dashboards, apps, marketing campaigns,
            APIs, and design systems. Each one produces production-quality output in seconds.
          </p>

          {/* Search */}
          <div className="max-w-lg mx-auto relative mb-8">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/65" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory(null);
              }}
              placeholder="Search generators..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/[0.07] border border-white/[0.12] text-white placeholder:text-white/65 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 text-sm"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button
              onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                !selectedCategory && !searchQuery
                  ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                  : "bg-white/[0.07] text-white/65 border border-white/[0.10] hover:bg-white/[0.08] hover:text-white/80"
              }`}
            >
              All ({totalGenerators})
            </button>
            {GENERATOR_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => { setSelectedCategory(cat.name); setSearchQuery(""); }}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === cat.name
                    ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                    : "bg-white/[0.07] text-white/65 border border-white/[0.10] hover:bg-white/[0.08] hover:text-white/80"
                }`}
              >
                {cat.name} ({cat.generators.length})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline Section */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.08] p-8 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center">
              <Workflow size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Multi-Agent Pipeline</h2>
              <p className="text-sm text-white/60">Orchestrate specialized AI agents for superior output</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {PIPELINE_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-xl border p-5 transition-all hover:border-brand-500/30 ${
                  tier.tag ? "border-brand-500/20 bg-brand-500/[0.03]" : "border-white/[0.10] bg-white/[0.08]"
                }`}
              >
                {tier.tag && (
                  <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                    {tier.tag}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold">{tier.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.09] text-[10px] font-medium text-white/65">
                    {tier.agents} agents
                  </span>
                </div>
                <p className="text-xs text-white/60 mb-3">{tier.description}</p>
                <div className="flex items-center gap-2 text-xs text-white/65">
                  <Zap size={12} />
                  <span>{tier.speed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Generator Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {selectedCategory || searchQuery ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredGenerators.map((gen) => (
              <GeneratorCard key={gen.name} gen={gen} />
            ))}
            {filteredGenerators.length === 0 && (
              <div className="col-span-full text-center py-20">
                <Search size={40} className="mx-auto text-white/50 mb-4" />
                <p className="text-white/65">No generators match your search.</p>
              </div>
            )}
          </div>
        ) : (
          GENERATOR_CATEGORIES.map((cat) => (
            <div key={cat.name} className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                  <Layers size={16} />
                </div>
                <h2 className="text-xl font-bold">{cat.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-white/[0.09] text-[10px] font-medium text-white/60">
                  {cat.generators.length}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cat.generators.map((gen) => (
                  <GeneratorCard key={gen.name} gen={{ ...gen, category: cat.name, color: cat.color }} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-white/[0.10] bg-white/[0.07]">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to build?</h2>
          <p className="text-white/60 mb-8">
            All {totalGenerators} generators are available in the builder. Start with a prompt or pick a generator.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              Open Builder
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.09] text-white/80 font-medium hover:bg-white/[0.1] transition-colors"
            >
              API Docs
              <Code2 size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function GeneratorCard({ gen }: { gen: { name: string; description: string; endpoint: string; icon: React.ElementType; tag?: string; category: string; color: string } }) {
  const Icon = gen.icon;
  const generatorId = endpointToGeneratorId(gen.endpoint);
  return (
    <Link
      href={`/generators/${generatorId}`}
      className="group relative rounded-xl border border-white/[0.10] bg-white/[0.08] p-5 hover:border-brand-500/30 hover:bg-brand-500/[0.03] transition-all duration-200"
    >
      {gen.tag && (
        <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
          gen.tag === "Popular"
            ? "bg-amber-500/20 text-amber-400"
            : gen.tag === "Agent"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-brand-500/20 text-brand-400"
        }`}>
          {gen.tag}
        </span>
      )}
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gen.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon size={18} className="text-white" />
      </div>
      <h3 className="font-semibold text-sm mb-2 text-white/90 group-hover:text-white transition-colors">
        {gen.name}
      </h3>
      <p className="text-xs text-white/65 leading-relaxed line-clamp-3">
        {gen.description}
      </p>
      <div className="mt-3 flex items-center gap-1 text-[10px] text-brand-400/60 group-hover:text-brand-400 transition-colors">
        <span>Configure & Generate</span>
        <ArrowRight size={10} />
      </div>
    </Link>
  );
}
