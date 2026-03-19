"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Sparkles, ArrowRight } from "lucide-react";

interface ShowcaseItem {
  id: number;
  name: string;
  category: string;
  buildTime: string;
  prompt: string;
  gradientFrom: string;
  gradientTo: string;
  accentColor: string;
  layout: "saas" | "ecommerce" | "portfolio" | "agency" | "restaurant";
}

const showcaseItems: ShowcaseItem[] = [
  {
    id: 1,
    name: "NovaTech Analytics",
    category: "SaaS",
    buildTime: "47s",
    prompt: "A modern SaaS analytics dashboard landing page with dark theme, real-time metrics, and interactive charts",
    gradientFrom: "#1e1b4b",
    gradientTo: "#7c3aed",
    accentColor: "#a78bfa",
    layout: "saas",
  },
  {
    id: 2,
    name: "Luxe & Thread",
    category: "E-commerce",
    buildTime: "52s",
    prompt: "Premium fashion e-commerce store with minimalist design, product filtering, and wishlist functionality",
    gradientFrom: "#78350f",
    gradientTo: "#e11d48",
    accentColor: "#fbbf24",
    layout: "ecommerce",
  },
  {
    id: 3,
    name: "DevPortfolio Pro",
    category: "Portfolio",
    buildTime: "38s",
    prompt: "Developer portfolio with dark mode, terminal-inspired hero, project showcase with GitHub stats",
    gradientFrom: "#0f172a",
    gradientTo: "#155e75",
    accentColor: "#22d3ee",
    layout: "portfolio",
  },
  {
    id: 4,
    name: "Catalyst Creative",
    category: "Agency",
    buildTime: "61s",
    prompt: "Bold creative agency site with large typography, case studies grid, and animated transitions",
    gradientFrom: "#581c87",
    gradientTo: "#db2777",
    accentColor: "#f472b6",
    layout: "agency",
  },
  {
    id: 5,
    name: "Artisan Bakery",
    category: "Restaurant",
    buildTime: "43s",
    prompt: "Warm artisan bakery website with menu sections, online ordering, and location map",
    gradientFrom: "#451a03",
    gradientTo: "#92400e",
    accentColor: "#d97706",
    layout: "restaurant",
  },
  {
    id: 6,
    name: "CloudSync Pro",
    category: "SaaS",
    buildTime: "55s",
    prompt: "Cloud storage SaaS with pricing tiers, feature comparison table, and integration logos",
    gradientFrom: "#0c4a6e",
    gradientTo: "#6d28d9",
    accentColor: "#818cf8",
    layout: "saas",
  },
  {
    id: 7,
    name: "Verde Botanics",
    category: "E-commerce",
    buildTime: "49s",
    prompt: "Organic plant shop with product cards, care guides, and subscription box feature",
    gradientFrom: "#14532d",
    gradientTo: "#065f46",
    accentColor: "#34d399",
    layout: "ecommerce",
  },
  {
    id: 8,
    name: "Sarah Chen Design",
    category: "Portfolio",
    buildTime: "35s",
    prompt: "Minimal portfolio for a UX designer with case study layouts, process diagrams, and testimonials",
    gradientFrom: "#1c1917",
    gradientTo: "#292524",
    accentColor: "#f97316",
    layout: "portfolio",
  },
  {
    id: 9,
    name: "Momentum Digital",
    category: "Agency",
    buildTime: "58s",
    prompt: "Performance marketing agency with results dashboard, client logos, and ROI calculator",
    gradientFrom: "#312e81",
    gradientTo: "#be185d",
    accentColor: "#e879f9",
    layout: "agency",
  },
  {
    id: 10,
    name: "Sakura Ramen House",
    category: "Restaurant",
    buildTime: "41s",
    prompt: "Japanese ramen restaurant with photo menu, reservation system, and chef's story section",
    gradientFrom: "#7f1d1d",
    gradientTo: "#9a3412",
    accentColor: "#fb923c",
    layout: "restaurant",
  },
  {
    id: 11,
    name: "QuantumLeap AI",
    category: "SaaS",
    buildTime: "63s",
    prompt: "AI-powered business intelligence platform with demo video, use cases, and enterprise pricing",
    gradientFrom: "#020617",
    gradientTo: "#4338ca",
    accentColor: "#6366f1",
    layout: "saas",
  },
  {
    id: 12,
    name: "Atlas & Co Studio",
    category: "Agency",
    buildTime: "56s",
    prompt: "Branding studio with fullscreen portfolio, team section, and interactive brand process timeline",
    gradientFrom: "#1e1b4b",
    gradientTo: "#9f1239",
    accentColor: "#fb7185",
    layout: "agency",
  },
];

const categories = ["All", "SaaS", "E-commerce", "Portfolio", "Agency", "Restaurant"];

function MockupPreview({ item }: { item: ShowcaseItem }) {
  const { layout, gradientFrom, gradientTo, accentColor } = item;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        aspectRatio: layout === "portfolio" ? "4/3" : layout === "agency" ? "3/4" : "4/3.5",
      }}
    >
      {/* Mock browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="w-2 h-2 rounded-full bg-red-400/80" />
        <div className="w-2 h-2 rounded-full bg-yellow-400/80" />
        <div className="w-2 h-2 rounded-full bg-green-400/80" />
        <div
          className="ml-3 h-4 rounded-full flex-1 max-w-[140px]"
          style={{ background: "rgba(255,255,255,0.1)" }}
        />
      </div>

      {/* Mock navigation */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="w-16 h-3 rounded" style={{ background: accentColor, opacity: 0.9 }} />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-2 rounded"
              style={{ width: `${20 + i * 5}px`, background: "rgba(255,255,255,0.3)" }}
            />
          ))}
        </div>
        <div
          className="h-5 w-14 rounded-md"
          style={{ background: accentColor, opacity: 0.8 }}
        />
      </div>

      {/* Layout-specific content */}
      <div className="px-4 pt-2 pb-4">
        {layout === "saas" && <SaaSMockup accent={accentColor} />}
        {layout === "ecommerce" && <EcommerceMockup accent={accentColor} />}
        {layout === "portfolio" && <PortfolioMockup accent={accentColor} />}
        {layout === "agency" && <AgencyMockup accent={accentColor} />}
        {layout === "restaurant" && <RestaurantMockup accent={accentColor} />}
      </div>
    </div>
  );
}

function SaaSMockup({ accent }: { accent: string }) {
  return (
    <>
      {/* Hero */}
      <div className="text-center mb-3">
        <div className="h-4 w-3/4 mx-auto rounded mb-2" style={{ background: "rgba(255,255,255,0.85)" }} />
        <div className="h-2.5 w-1/2 mx-auto rounded mb-3" style={{ background: "rgba(255,255,255,0.35)" }} />
        <div className="flex gap-2 justify-center">
          <div className="h-6 w-20 rounded-lg" style={{ background: accent }} />
          <div className="h-6 w-20 rounded-lg border" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
        </div>
      </div>
      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg p-2" style={{ background: "rgba(0,0,0,0.25)" }}>
            <div className="h-4 w-8 rounded mb-1" style={{ background: accent, opacity: 0.8 }} />
            <div className="h-1.5 w-full rounded" style={{ background: "rgba(255,255,255,0.2)" }} />
          </div>
        ))}
      </div>
      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="w-4 h-4 rounded mb-1.5" style={{ background: accent, opacity: 0.6 }} />
            <div className="h-1.5 w-full rounded mb-1" style={{ background: "rgba(255,255,255,0.25)" }} />
            <div className="h-1 w-2/3 rounded" style={{ background: "rgba(255,255,255,0.12)" }} />
          </div>
        ))}
      </div>
    </>
  );
}

function EcommerceMockup({ accent }: { accent: string }) {
  return (
    <>
      {/* Hero banner */}
      <div className="rounded-xl mb-3 p-3 relative overflow-hidden" style={{ background: "rgba(0,0,0,0.2)" }}>
        <div className="h-3 w-2/3 rounded mb-1.5" style={{ background: "rgba(255,255,255,0.8)" }} />
        <div className="h-2 w-1/3 rounded mb-2" style={{ background: "rgba(255,255,255,0.3)" }} />
        <div className="h-5 w-16 rounded-md" style={{ background: accent }} />
      </div>
      {/* Product grid */}
      <div className="grid grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.2)" }}>
            <div
              className="w-full aspect-square"
              style={{
                background: `linear-gradient(${135 + i * 20}deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
              }}
            />
            <div className="p-1.5">
              <div className="h-1.5 w-full rounded mb-1" style={{ background: "rgba(255,255,255,0.3)" }} />
              <div className="h-2 w-8 rounded" style={{ background: accent, opacity: 0.7 }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PortfolioMockup({ accent }: { accent: string }) {
  return (
    <>
      {/* Minimal hero */}
      <div className="mb-4 mt-2">
        <div className="h-5 w-1/2 rounded mb-2" style={{ background: "rgba(255,255,255,0.9)" }} />
        <div className="h-2 w-3/4 rounded mb-1" style={{ background: "rgba(255,255,255,0.25)" }} />
        <div className="h-2 w-1/2 rounded mb-3" style={{ background: "rgba(255,255,255,0.15)" }} />
        <div className="h-0.5 w-12 rounded" style={{ background: accent }} />
      </div>
      {/* Project grid */}
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg aspect-video"
            style={{
              background: `linear-gradient(${i * 45}deg, rgba(255,255,255,0.04), rgba(255,255,255,0.1))`,
              border: `1px solid rgba(255,255,255,0.08)`,
            }}
          >
            <div className="p-2 flex flex-col justify-end h-full">
              <div className="h-1.5 w-3/4 rounded" style={{ background: "rgba(255,255,255,0.3)" }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AgencyMockup({ accent }: { accent: string }) {
  return (
    <>
      {/* Bold hero */}
      <div className="mb-3 mt-1">
        <div className="h-7 w-full rounded mb-1" style={{ background: "rgba(255,255,255,0.9)" }} />
        <div className="h-7 w-2/3 rounded mb-2" style={{ background: "rgba(255,255,255,0.9)" }} />
        <div className="h-2.5 w-1/2 rounded mb-3" style={{ background: "rgba(255,255,255,0.3)" }} />
        <div className="flex gap-2">
          <div className="h-7 w-24 rounded-full" style={{ background: accent }} />
          <div className="h-7 w-24 rounded-full" style={{ border: `1px solid ${accent}` }} />
        </div>
      </div>
      {/* Case study cards */}
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-2.5 flex items-center gap-3"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="w-10 h-10 rounded-lg shrink-0"
              style={{
                background: `linear-gradient(${135 + i * 40}deg, ${accent}44, ${accent}22)`,
              }}
            />
            <div className="flex-1">
              <div className="h-2 w-3/4 rounded mb-1" style={{ background: "rgba(255,255,255,0.4)" }} />
              <div className="h-1.5 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.15)" }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RestaurantMockup({ accent }: { accent: string }) {
  return (
    <>
      {/* Hero with overlay */}
      <div className="rounded-xl mb-3 p-3 relative" style={{ background: "rgba(0,0,0,0.3)" }}>
        <div className="h-3.5 w-2/3 rounded mb-1" style={{ background: "rgba(255,255,255,0.85)" }} />
        <div className="h-2 w-1/3 rounded mb-2" style={{ background: accent, opacity: 0.7 }} />
        <div className="flex gap-2">
          <div className="h-5 w-20 rounded-full" style={{ background: accent }} />
          <div className="h-5 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
      </div>
      {/* Menu grid */}
      <div className="grid grid-cols-2 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg overflow-hidden" style={{ background: "rgba(0,0,0,0.25)" }}>
            <div
              className="w-full aspect-[4/3]"
              style={{
                background: `linear-gradient(${180 + i * 30}deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))`,
              }}
            />
            <div className="p-1.5">
              <div className="h-1.5 w-3/4 rounded mb-1" style={{ background: "rgba(255,255,255,0.35)" }} />
              <div className="flex justify-between items-center">
                <div className="h-1 w-1/2 rounded" style={{ background: "rgba(255,255,255,0.15)" }} />
                <div className="h-2 w-6 rounded" style={{ background: accent, opacity: 0.6 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function ShowcaseGallery() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const filteredItems =
    activeFilter === "All"
      ? showcaseItems
      : showcaseItems.filter((item) => item.category === activeFilter);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Showcase
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            See What&apos;s Possible
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Real sites. Built in seconds. Powered by AI.
          </p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeFilter === cat
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Masonry grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 space-y-5">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.06,
                  layout: { duration: 0.3 },
                }}
                className="break-inside-avoid"
              >
                <motion.div
                  className="group relative rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.25 }}
                  onMouseEnter={() => setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Gradient border on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${item.gradientFrom}, ${item.gradientTo})`,
                      padding: "1px",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "exclude",
                      WebkitMaskComposite: "xor",
                    }}
                  />

                  {/* Mockup preview */}
                  <MockupPreview item={item} />

                  {/* Info overlay */}
                  <div
                    className="p-4 relative"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-semibold text-base">{item.name}</h3>
                      <div className="flex gap-1.5">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: `${item.accentColor}22`,
                            color: item.accentColor,
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                        Built in {item.buildTime}
                      </span>
                      <Sparkles className="w-3 h-3 text-purple-400" />
                    </div>

                    <p className="text-xs text-gray-500 italic line-clamp-2 leading-relaxed">
                      &ldquo;{item.prompt}&rdquo;
                    </p>

                    {/* Hover CTA */}
                    <motion.div
                      initial={false}
                      animate={{
                        opacity: hoveredCard === item.id ? 1 : 0,
                        y: hoveredCard === item.id ? 0 : 8,
                      }}
                      transition={{ duration: 0.2 }}
                      className="mt-3"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: item.accentColor, color: "#000" }}
                        >
                          View Live
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
                          Build similar
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-gray-500 text-sm mb-4">
            These sites were generated in under 60 seconds with a single prompt.
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-purple-500/20">
            Start Building for Free
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
