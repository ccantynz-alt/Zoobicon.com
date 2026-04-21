"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Search,
  Check,
  X,
  Loader2,
  Globe,
  ArrowRight,
  Zap,
  ChevronDown,
  ShoppingCart,
  RefreshCw,
  Copy,
  Briefcase,
  Coffee,
  Scissors,
  Code2,
  Heart,
  Truck,
  Palette,
  Camera,
  Dumbbell,
  Scale,
  GraduationCap,
  UtensilsCrossed,
} from "lucide-react";

const INDUSTRIES = [
  { id: "tech", label: "Tech / SaaS", icon: Code2 },
  { id: "food", label: "Restaurant / Cafe", icon: UtensilsCrossed },
  { id: "beauty", label: "Beauty / Salon", icon: Scissors },
  { id: "fitness", label: "Fitness / Health", icon: Dumbbell },
  { id: "creative", label: "Creative / Design", icon: Palette },
  { id: "consulting", label: "Consulting", icon: Briefcase },
  { id: "ecommerce", label: "E-Commerce", icon: ShoppingCart },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "legal", label: "Legal", icon: Scale },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "medical", label: "Medical / Wellness", icon: Heart },
  { id: "trades", label: "Trades / Services", icon: Truck },
];

const TLD_LIST = ["com", "ai", "io", "sh", "co", "dev", "app", "net", "org", "tech", "xyz", "me", "us"];
const TLD_PRICES: Record<string, number> = {
  com: 12.99, ai: 79.99, io: 39.99, sh: 24.99, co: 29.99,
  dev: 14.99, app: 14.99, net: 13.99, org: 11.99, tech: 6.99,
  xyz: 2.99, me: 8.99, us: 8.99,
};

interface GeneratedName {
  name: string;
  slug: string;
  tagline: string;
  domains: Record<string, { available: boolean | null; checking: boolean }>;
  expanded: boolean;
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon AI Business Name Generator",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/business-name-generator",
      description: "Free AI business name generator with instant domain availability checking across 13 extensions.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: "Zoobicon", url: "https://zoobicon.com" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "How does the AI business name generator work?", acceptedAnswer: { "@type": "Answer", text: "Enter your industry and a brief description of your business. Our AI generates 20 creative, brandable names. Each name is instantly checked for domain availability across 13 extensions (.com, .ai, .io, and more)." } },
        { "@type": "Question", name: "Is the business name generator free?", acceptedAnswer: { "@type": "Answer", text: "Yes, completely free with no signup required. Generate as many names as you like. Domain registration is available if you find a name you love." } },
        { "@type": "Question", name: "Can I register domains directly?", acceptedAnswer: { "@type": "Answer", text: "Yes. When you find an available domain, click Register and complete the purchase through our secure checkout. Domains are registered instantly." } },
      ],
    },
  ],
};

export default function BusinessNameGeneratorPage() {
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [style, setStyle] = useState<"modern" | "classic" | "playful" | "minimal">("modern");
  const [names, setNames] = useState<GeneratedName[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [selectedTlds, setSelectedTlds] = useState<Set<string>>(new Set(["com", "ai", "io", "co"]));

  const generateNames = async () => {
    if (!description.trim()) return;
    setGenerating(true);
    setError("");
    setNames([]);

    try {
      const res = await fetch("/api/tools/business-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          industry,
          style,
          count: 20,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate names");
      }

      const data = await res.json();
      const generated: GeneratedName[] = (data.names || []).map((n: { name: string; tagline: string }) => ({
        name: n.name,
        slug: n.name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 63),
        tagline: n.tagline,
        domains: {},
        expanded: false,
      }));

      setNames(generated);

      // Auto-check domains for all names
      for (const name of generated) {
        checkDomains(name.slug, generated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  const checkDomains = async (slug: string, currentNames: GeneratedName[]) => {
    const tlds = Array.from(selectedTlds);

    // Mark as checking
    setNames(prev => prev.map(n =>
      n.slug === slug
        ? { ...n, domains: Object.fromEntries(tlds.map(t => [t, { available: null, checking: true }])) }
        : n
    ));

    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(slug)}&tlds=${encodeURIComponent(tlds.join(","))}`);
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];

        setNames(prev => prev.map(n => {
          if (n.slug !== slug) return n;
          const domains: Record<string, { available: boolean | null; checking: boolean }> = {};
          for (const tld of tlds) {
            const match = results.find((r: { domain: string }) => r.domain === `${slug}.${tld}`);
            domains[tld] = { available: match?.available ?? null, checking: false };
          }
          return { ...n, domains };
        }));
      } else {
        setNames(prev => prev.map(n =>
          n.slug === slug
            ? { ...n, domains: Object.fromEntries(tlds.map(t => [t, { available: null, checking: false }])) }
            : n
        ));
      }
    } catch {
      setNames(prev => prev.map(n =>
        n.slug === slug
          ? { ...n, domains: Object.fromEntries(tlds.map(t => [t, { available: null, checking: false }])) }
          : n
      ));
    }
  };

  const toggleExpand = (slug: string) => {
    setNames(prev => prev.map(n => n.slug === slug ? { ...n, expanded: !n.expanded } : n));
  };

  const copyName = (name: string) => {
    navigator.clipboard.writeText(name).catch(() => {});
    setCopied(name);
    setTimeout(() => setCopied(""), 2000);
  };

  const availableCount = (n: GeneratedName) =>
    Object.values(n.domains).filter(d => d.available === true).length;

  return (
    <div className="min-h-screen bg-[#0b1530] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">Zoobicon</span>
          </Link>
          <div className="flex gap-3 text-xs text-white/40">
            <Link href="/domains" className="hover:text-white/60">Domain Search</Link>
            <Link href="/builder" className="hover:text-white/60">Website Builder</Link>
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-500/10 border border-stone-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-xs font-medium text-stone-300">Free — No Signup Required</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
            AI Business Name{" "}
            <span className="bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400 bg-clip-text text-transparent">Generator</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Describe your business. AI generates 20 creative names. Each one instantly checked for domain availability across 13 extensions.
          </p>
        </div>

        {/* Canonical banner — point power users to the unified search */}
        <div
          className="mb-8 rounded-2xl border border-[#E8D4B0]/20 p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 flex-wrap"
          style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.06) 0%, rgba(20,40,95,0.7) 100%)" }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.14) 0%, rgba(232,212,176,0.06) 100%)" }}
            >
              <Sparkles className="w-5 h-5 text-[#E8D4B0]" />
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-white tracking-[-0.01em]">
                Looking for the full search experience?
              </div>
              <p className="text-[12.5px] text-white/55 leading-relaxed mt-0.5">
                Our unified domain search handles exact names, AI-generated names, fragment ideas,
                trademark screening, social handle checks and App Store availability — all in one place.
              </p>
            </div>
          </div>
          <Link
            href="/domains"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-semibold transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
              color: "#0a1628",
              boxShadow: "0 12px 28px -14px rgba(232,212,176,0.5)",
            }}
          >
            Open unified search <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Input Form */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">

          {/* Description */}
          <label className="block text-sm font-medium text-white/50 mb-2">Describe your business</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. A modern coffee roastery in Auckland that delivers fresh beans nationwide..."
            rows={3}
            className="w-full px-4 py-3 bg-[#0b1530] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-stone-500/30 focus:border-stone-500/30 mb-4 resize-none"
          />

          {/* Industry */}
          <label className="block text-sm font-medium text-white/50 mb-2">Industry (optional)</label>
          <div className="flex flex-wrap gap-2 mb-4">
            {INDUSTRIES.map(ind => (
              <button
                key={ind.id}
                onClick={() => setIndustry(industry === ind.id ? "" : ind.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  industry === ind.id
                    ? "bg-stone-600 text-white"
                    : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60"
                }`}
              >
                <ind.icon className="w-3 h-3" />
                {ind.label}
              </button>
            ))}
          </div>

          {/* Style */}
          <label className="block text-sm font-medium text-white/50 mb-2">Name style</label>
          <div className="flex gap-2 mb-5">
            {(["modern", "classic", "playful", "minimal"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                  style === s
                    ? "bg-stone-600 text-white"
                    : "bg-white/[0.04] text-white/40 hover:bg-white/[0.08]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Domain extensions to check */}
          <label className="block text-sm font-medium text-white/50 mb-2">Check domains for</label>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {TLD_LIST.map(tld => (
              <button
                key={tld}
                onClick={() => {
                  setSelectedTlds(prev => {
                    const next = new Set(prev);
                    if (next.has(tld)) next.delete(tld); else next.add(tld);
                    return next;
                  });
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  selectedTlds.has(tld)
                    ? "bg-stone-600/80 text-white"
                    : "bg-white/[0.04] text-white/30 hover:bg-white/[0.08]"
                }`}
              >
                .{tld}
              </button>
            ))}
          </div>

          {/* Generate */}
          <button
            onClick={generateNames}
            disabled={generating || !description.trim()}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-stone-600 to-stone-600 font-semibold text-base hover:from-stone-500 hover:to-stone-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating names &amp; checking domains...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generate 20 Business Names</>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-stone-500/10 border border-stone-500/20 text-stone-400 text-sm">{error}</div>
        )}

        {/* Results */}
        {names.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">{names.length} names generated</h2>
              <button onClick={generateNames} disabled={generating} className="text-xs text-stone-400 hover:text-stone-300 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Regenerate
              </button>
            </div>

            {names.map(n => {
              const avail = availableCount(n);
              const anyChecking = Object.values(n.domains).some(d => d.checking);
              const hasResults = Object.keys(n.domains).length > 0;

              return (
                <div key={n.slug} className="rounded-xl border border-white/[0.08] overflow-hidden">
                  {/* Name header */}
                  <button
                    onClick={() => toggleExpand(n.slug)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg font-semibold truncate">{n.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyName(n.name); }}
                        className="text-white/20 hover:text-white/40 shrink-0"
                      >
                        {copied === n.name ? <Check className="w-3.5 h-3.5 text-stone-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {anyChecking ? (
                        <span className="text-xs text-white/30 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Checking...</span>
                      ) : hasResults ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          avail > 0 ? "bg-stone-500/10 text-stone-400" : "bg-white/[0.05] text-white/30"
                        }`}>
                          {avail} domain{avail !== 1 ? "s" : ""} available
                        </span>
                      ) : null}
                      <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${n.expanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Expanded: tagline + domains */}
                  {n.expanded && (
                    <div className="px-5 pb-4 border-t border-white/[0.04]">
                      <p className="text-sm text-white/40 mt-3 mb-4 italic">&ldquo;{n.tagline}&rdquo;</p>

                      {/* Domain grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {Array.from(selectedTlds).map(tld => {
                          const d = n.domains[tld];
                          const domain = `${n.slug}.${tld}`;
                          return (
                            <div
                              key={tld}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                                d?.available === true
                                  ? "bg-stone-500/10 border border-stone-500/20"
                                  : d?.available === false
                                  ? "bg-white/[0.02] border border-white/[0.04]"
                                  : "bg-white/[0.02] border border-white/[0.04]"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {d?.checking ? (
                                  <Loader2 className="w-3 h-3 text-white/30 animate-spin shrink-0" />
                                ) : d?.available === true ? (
                                  <Check className="w-3 h-3 text-stone-400 shrink-0" />
                                ) : d?.available === false ? (
                                  <X className="w-3 h-3 text-stone-400/40 shrink-0" />
                                ) : (
                                  <Globe className="w-3 h-3 text-white/20 shrink-0" />
                                )}
                                <span className={`text-xs truncate ${d?.available === true ? "text-stone-300 font-medium" : d?.available === false ? "text-white/25 line-through" : "text-white/40"}`}>
                                  .{tld}
                                </span>
                              </div>
                              {d?.available === true && (
                                <Link
                                  href={`/domains?name=${n.slug}&tld=${tld}`}
                                  className="text-[10px] text-stone-400 hover:text-stone-300 font-medium shrink-0 ml-1"
                                >
                                  ${TLD_PRICES[tld]}/yr
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* CTA for available domains */}
                      {avail > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/domains?name=${n.slug}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-600 hover:bg-stone-500 text-sm font-medium transition-colors"
                          >
                            <Globe className="w-3.5 h-3.5" /> Register Domain
                          </Link>
                          <Link
                            href={`/builder?prompt=${encodeURIComponent(`Build a website for ${n.name}: ${n.tagline}`)}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-600 hover:bg-stone-500 text-sm font-medium transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" /> Build Website
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-16 text-center border-t border-white/[0.06] pt-16">
          <h2 className="text-2xl font-bold mb-3">Found the perfect name?</h2>
          <p className="text-white/40 mb-6 max-w-lg mx-auto">Register your domain, build a website, set up business email, and launch — all from one platform.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/domains" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-600 hover:bg-stone-500 font-semibold text-sm transition-colors">
              <Globe className="w-4 h-4" /> Register Domain
            </Link>
            <Link href="/builder" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-600 hover:bg-stone-500 font-semibold text-sm transition-colors">
              <Zap className="w-4 h-4" /> Build Website
            </Link>
            <Link href="/products/booking" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08] font-semibold text-sm transition-colors">
              <ArrowRight className="w-4 h-4" /> Set Up Booking
            </Link>
          </div>
        </div>

        {/* SEO FAQ */}
        <div className="mt-16 border-t border-white/[0.06] pt-12">
          <h2 className="text-xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6 max-w-2xl mx-auto text-sm">
            <div>
              <h3 className="font-semibold mb-1">How does the AI business name generator work?</h3>
              <p className="text-white/40">Enter your industry and a brief description. Our AI generates 20 creative, brandable names tailored to your business. Each name is instantly checked for domain availability across .com, .ai, .io, and 10 more extensions.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Is it really free?</h3>
              <p className="text-white/40">Yes, completely free with no signup required. Generate as many names as you want. We only charge if you decide to register a domain or use our other tools like website builder or booking system.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">What makes this better than other name generators?</h3>
              <p className="text-white/40">Most generators give you random word combinations. Ours uses AI to understand your actual business, industry, and desired style — then generates names that are creative, memorable, and brandable. Plus, instant domain checking across 13 extensions saves you hours of manual searching.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Can I register the domain right away?</h3>
              <p className="text-white/40">Yes. Click any available domain and you&apos;ll go directly to our domain registration page. Domains are registered instantly through our Tucows/OpenSRS registry integration.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-white/15">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
        </div>
      </div>
    </div>
  );
}
