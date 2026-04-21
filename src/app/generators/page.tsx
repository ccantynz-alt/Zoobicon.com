"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layout,
  Calendar,
  BarChart3,
  Palette,
  Search,
  Moon,
  FileText,
  Link2,
  Briefcase,
  BookOpen,
  MapPin,
  Ticket,
  Store,
  Smartphone,
  Settings,
  FormInput,
  Mail,
  Presentation,
  PenTool,
  Code2,
  Boxes,
  UtensilsCrossed,
  Home,
  FileBarChart,
  Globe2,
  PaintBucket,
  Users,
  FolderKanban,
  GraduationCap,
  Package,
  Workflow,
  ArrowRight,
  Zap,
  Bot,
  ShoppingCart,
  MessageCircle,
  Newspaper,
  Share2,
  FileSearch,
  Mic,
  Heart,
  Dumbbell,
  PartyPopper,
  BadgeCheck,
} from "lucide-react";
import { endpointToGeneratorId } from "@/lib/generator-prompts";

const CARD_BG = "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)";
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

const GENERATOR_CATEGORIES = [
  {
    name: "Websites",
    tagline: "Every kind of site, production-ready.",
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
    tagline: "Full-stack apps with real logic and state.",
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
      { name: "React Native/Expo App", description: "Multi-file React Native/Expo apps with tab navigation, typed screens, Context state, and native UI", endpoint: "/api/generate/react", icon: Smartphone, tag: "New" },
      { name: "Chatbot Interface", description: "AI chatbot UIs with message bubbles, quick replies, typing indicators, and conversation history", endpoint: "/api/generate/chatbot-ui", icon: MessageCircle, tag: "New" },
    ],
  },
  {
    name: "Enhancement Agents",
    tagline: "Specialised agents that upgrade any site in place.",
    generators: [
      { name: "Animation Agent", description: "Inject scroll reveals, parallax, animated counters, text animations, and micro-interactions", endpoint: "/api/generate/animations", icon: Sparkles, tag: "Agent" },
      { name: "SEO Markup Agent", description: "Add Open Graph, MessageCircle Cards, JSON-LD schema, heading fixes, image alt text, and performance hints", endpoint: "/api/generate/seo-markup", icon: Search, tag: "Agent" },
      { name: "Dark Mode Agent", description: "Add complete theme system with toggle, CSS variables, system preference detection, and persistence", endpoint: "/api/generate/dark-mode", icon: Moon, tag: "Agent" },
      { name: "Forms Backend Agent", description: "Make forms functional with validation, submission handling, spam protection, and email templates", endpoint: "/api/generate/forms-backend", icon: FileText, tag: "Agent" },
      { name: "Integrations Agent", description: "Inject GA4, ThumbsUp Pixel, Calendly, Google Maps, WhatsApp, Intercom, cookie consent, and more", endpoint: "/api/generate/integrations", icon: Link2, tag: "Agent" },
    ],
  },
  {
    name: "Marketing & Content",
    tagline: "Campaigns, copy and collateral in a single pass.",
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
    tagline: "Ship complete developer-grade artefacts.",
    generators: [
      { name: "REST API Generator", description: "Complete APIs with database schema, endpoint handlers, auth, rate limiting, and interactive docs", endpoint: "/api/generate/api-gen", icon: Code2 },
      { name: "Globe2 Extension", description: "Manifest V3 extensions with popup UI, content scripts, background workers, and options page", endpoint: "/api/generate/chrome-ext", icon: Globe2 },
      { name: "Component Library", description: "UI component libraries with live demos, all states, dark mode toggle, and usage code snippets", endpoint: "/api/generate/component-lib", icon: Boxes },
      { name: "Progressive Web App", description: "Installable PWAs with service worker, offline support, install prompt, and native-app feel", endpoint: "/api/generate/pwa", icon: Smartphone },
    ],
  },
  {
    name: "Design Systems",
    tagline: "Colour, type and brand, codified.",
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

type GeneratorItem = {
  name: string;
  description: string;
  endpoint: string;
  icon: React.ElementType;
  tag?: string;
};

export default function GeneratorsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const allGenerators = GENERATOR_CATEGORIES.flatMap((cat) =>
    cat.generators.map((gen) => ({ ...gen, category: cat.name }))
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

  const generatorsJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Zoobicon AI Generators",
    "description": "43+ specialized AI generators for websites, business applications, marketing content, developer tools, and design systems.",
    "url": "https://zoobicon.com/generators",
    "numberOfItems": totalGenerators,
    "itemListElement": allGenerators.map((gen, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": gen.name,
      "description": gen.description,
      "url": `https://zoobicon.com/generators/${gen.endpoint.replace('/api/generate/', '')}`
    }))
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zoobicon.com" },
      { "@type": "ListItem", "position": 2, "name": "Generators", "item": "https://zoobicon.com/generators" }
    ]
  };

  const isFiltering = Boolean(selectedCategory || searchQuery);

  return (
    <div className="min-h-screen bg-[#060e1f] text-white fs-grain pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generatorsJsonLd) }} />
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
            <Bot className="w-3 h-3" />
            {totalGenerators} AI generators · 10-agent pipeline
          </div>

          <h1 className="fs-display-xl mb-6">
            Generate{" "}
            <span style={SERIF}>anything.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            {totalGenerators} specialised AI generators for websites, dashboards, apps, marketing campaigns,
            APIs and design systems. Each one produces production-quality output in seconds.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto relative mb-8">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/45" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedCategory(null);
              }}
              placeholder="Search generators..."
              className="w-full rounded-full border border-white/[0.12] bg-white/[0.03] pl-12 pr-5 py-3.5 text-[14px] text-white placeholder:text-white/40 backdrop-blur transition-all focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05]"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
              className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all duration-500 ${
                !isFiltering
                  ? "border border-[#E8D4B0]/35 bg-[#E8D4B0]/[0.08] text-[#E8D4B0]"
                  : "border border-white/[0.10] bg-white/[0.03] text-white/60 hover:border-[#E8D4B0]/25 hover:text-[#E8D4B0]"
              }`}
            >
              All ({totalGenerators})
            </button>
            {GENERATOR_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => { setSelectedCategory(cat.name); setSearchQuery(""); }}
                className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all duration-500 ${
                  selectedCategory === cat.name
                    ? "border border-[#E8D4B0]/35 bg-[#E8D4B0]/[0.08] text-[#E8D4B0]"
                    : "border border-white/[0.10] bg-white/[0.03] text-white/60 hover:border-[#E8D4B0]/25 hover:text-[#E8D4B0]"
                }`}
              >
                {cat.name} ({cat.generators.length})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/builder"
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              Open the builder
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Code2 className="w-4 h-4" />
              API docs
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: String(totalGenerators), label: "Specialised generators" },
              { value: String(GENERATOR_CATEGORIES.length), label: "Categories" },
              { value: "10", label: "Agents in the pipeline" },
              { value: "~60s", label: "Average build time" },
            ].map((stat) => (
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

      {/* Pipeline */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              <Workflow className="w-3 h-3" />
              Multi-agent pipeline
            </div>
            <h2 className="fs-display-lg mb-4">
              Specialised agents, in{" "}
              <span style={SERIF}>orchestration.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Pick the pipeline tier that matches your quality bar. Every tier runs the same 10-agent core — deeper tiers simply think harder.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {PIPELINE_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative overflow-hidden rounded-[24px] p-7 transition-all duration-500 hover:-translate-y-1 ${
                  tier.tag ? "border-2 border-[#E8D4B0]/35" : "border border-white/[0.08] hover:border-[#E8D4B0]/25"
                }`}
                style={{
                  background: tier.tag
                    ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(17,17,24,0.85) 100%)"
                    : CARD_BG,
                }}
              >
                {tier.tag && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)", color: "#0a1628" }}
                  >
                    {tier.tag}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[18px] font-semibold tracking-[-0.01em]">{tier.name}</h3>
                  <span className="rounded-full border border-white/[0.10] bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-medium text-white/60">
                    {tier.agents} agents
                  </span>
                </div>
                <p className="text-[13px] text-white/55 leading-relaxed mb-6">{tier.description}</p>
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "#E8D4B0" }}>
                  <Zap className="w-3.5 h-3.5" />
                  <span className="font-semibold">{tier.speed}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Generators — filtered view or category stack */}
      {isFiltering ? (
        <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
                {selectedCategory || "Search results"}
              </div>
              <h2 className="fs-display-lg mb-4">
                {filteredGenerators.length} matching{" "}
                <span style={SERIF}>generators.</span>
              </h2>
            </div>

            {filteredGenerators.length === 0 ? (
              <div
                className="mx-auto max-w-lg rounded-[24px] border border-white/[0.08] p-10 text-center"
                style={{ background: CARD_BG }}
              >
                <Search className="w-8 h-8 mx-auto mb-4 text-[#E8D4B0]/60" />
                <p className="text-[14px] text-white/60">
                  No generators match your search. Try a different keyword or clear the filter.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredGenerators.map((gen) => (
                  <GeneratorCard key={gen.name} gen={gen} />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        GENERATOR_CATEGORIES.map((cat, idx) => (
          <section key={cat.name} className="relative py-20 md:py-24 border-t border-white/[0.06]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
                  {String(idx + 1).padStart(2, "0")} · {cat.generators.length} generators
                </div>
                <h2 className="fs-display-lg mb-4">
                  {cat.name.split(" ").slice(0, -1).join(" ")}{" "}
                  <span style={SERIF}>
                    {cat.name.split(" ").slice(-1).join(" ")}.
                  </span>
                </h2>
                <p className="max-w-2xl mx-auto text-[15px] text-white/55">{cat.tagline}</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {cat.generators.map((gen) => (
                  <GeneratorCard key={gen.name} gen={gen} />
                ))}
              </div>
            </div>
          </section>
        ))
      )}

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.11), transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-8">
            <BadgeCheck className="w-3 h-3" />
            All {totalGenerators} generators live in the builder
          </div>
          <h2 className="fs-display-lg mb-5">
            Ready to{" "}
            <span style={SERIF}>build?</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10">
            Start with a prompt or pick a generator. Production-quality output in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/builder"
              className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              Open the builder
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-8 py-4 text-[15px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              <Code2 className="w-4 h-4" />
              API docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function GeneratorCard({ gen }: { gen: GeneratorItem }) {
  const Icon = gen.icon;
  const generatorId = endpointToGeneratorId(gen.endpoint);
  return (
    <Link
      href={`/generators/${generatorId}`}
      className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
      style={{ background: CARD_BG }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }}
      />
      {gen.tag && (
        <span
          className="absolute top-5 right-5 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: "#E8D4B0" }}
        >
          {gen.tag}
        </span>
      )}
      <div className="relative">
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
          <Icon className="h-5 w-5 text-[#E8D4B0]" />
        </div>
        <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2 text-white">
          {gen.name}
        </h3>
        <p className="text-[13px] text-white/55 leading-relaxed mb-5">
          {gen.description}
        </p>
        <div className="flex items-center gap-1.5 text-[12px] font-semibold transition-all" style={{ color: "#E8D4B0" }}>
          <span>Generate</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
