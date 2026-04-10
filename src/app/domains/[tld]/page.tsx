"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Check,
  X,
  Loader2,
  Globe,
  Plus,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  BadgeCheck,
  Building2,
  Rocket,
  Code2,
  Brain,
  Smartphone,
  Server,
  Sparkles,
} from "lucide-react";

/* ── TLD Data ── */

interface TldInfo {
  tld: string;
  price: number;
  tagline: string;
  description: string;
  idealFor: string[];
  keywords: string[];
  color: string;
  gradient: string;
  icon: typeof Globe;
  facts: string[];
  examples: string[];
}

const TLD_DATA: Record<string, TldInfo> = {
  ai: {
    tld: "ai",
    price: 79.99,
    tagline: "The domain for artificial intelligence and tech innovation",
    description: "The .ai domain has become the gold standard for AI companies, machine learning startups, and tech innovators. Originally the country code for Anguilla, .ai is now synonymous with artificial intelligence worldwide. Companies like stability.ai, character.ai, and perplexity.ai have made .ai the most prestigious tech domain extension.",
    idealFor: ["AI startups & ML companies", "SaaS platforms", "Tech consultancies", "Research labs", "Developer tools", "Data science firms"],
    keywords: ["buy .ai domain", "register .ai domain", ".ai domain price", "ai domain name", "artificial intelligence domain"],
    color: "text-stone-400",
    gradient: "from-stone-500 to-stone-600",
    icon: Brain,
    facts: [
      "Over 300,000 .ai domains registered globally",
      "Average .ai domain resale value: $5,000+",
      ".ai is the fastest-growing premium TLD since 2023",
      "Used by 80% of top-funded AI startups",
    ],
    examples: ["stability.ai", "character.ai", "perplexity.ai", "jasper.ai", "copy.ai", "notion.ai"],
  },
  io: {
    tld: "io",
    price: 39.99,
    tagline: "The developer-favorite domain for startups and SaaS",
    description: "The .io domain is the unofficial standard for startups, developer tools, and SaaS products. Originally the country code for British Indian Ocean Territory, .io caught on because developers associate 'I/O' with input/output. It signals 'tech company' instantly and has been adopted by some of the biggest names in tech.",
    idealFor: ["SaaS products", "Developer tools", "Open-source projects", "Tech startups", "APIs & platforms", "Gaming companies"],
    keywords: ["buy .io domain", "register .io domain", ".io domain price", "io domain for startups", "tech domain name"],
    color: "text-stone-400",
    gradient: "from-stone-500 to-stone-600",
    icon: Code2,
    facts: [
      "Over 2 million .io domains registered",
      "Most popular TLD for Y Combinator startups",
      ".io domains rank well in Google — treated as generic TLD",
      "Average startup .io domain: 3-5x cheaper than equivalent .com",
    ],
    examples: ["github.io", "notion.io", "figma.io", "linear.io", "replit.io", "deno.io"],
  },
  com: {
    tld: "com",
    price: 12.99,
    tagline: "The world's most trusted domain extension",
    description: "The .com domain remains the gold standard of the internet. With over 150 million registrations, .com is the most recognized and trusted domain extension globally. If you're building a business, .com gives you instant credibility. Customers expect it, investors value it, and search engines trust it.",
    idealFor: ["Any business", "E-commerce stores", "Professional services", "Global brands", "Portfolio sites", "Blogs & media"],
    keywords: ["buy .com domain", "cheap .com domain", "register .com domain", "domain registration", ".com domain price"],
    color: "text-stone-400",
    gradient: "from-stone-500 to-stone-600",
    icon: Globe,
    facts: [
      "Over 150 million .com domains registered worldwide",
      "The most trusted TLD — 46% of all websites use .com",
      "Average .com premium resale: $10,000+",
      "Registered since 1985 — 40+ years of trust",
    ],
    examples: ["google.com", "amazon.com", "stripe.com", "shopify.com", "vercel.com", "zoobicon.com"],
  },
  sh: {
    tld: "sh",
    price: 24.99,
    tagline: "The domain for developers, DevOps, and hosting platforms",
    description: "The .sh domain is a favorite among developers because 'sh' is the file extension for shell scripts. It signals technical credibility instantly. DevOps tools, hosting platforms, and CLI utilities use .sh to communicate 'this is for developers.' It's short, memorable, and technically cool.",
    idealFor: ["DevOps tools", "Hosting platforms", "CLI utilities", "Developer tools", "Shell scripting resources", "Tech infrastructure"],
    keywords: ["buy .sh domain", "register .sh domain", ".sh domain price", "developer domain", "devops domain name"],
    color: "text-stone-400",
    gradient: "from-stone-500 to-stone-600",
    icon: Server,
    facts: [
      "Originally the country code for Saint Helena",
      "Adopted by developers because .sh = shell script",
      "Used by major platforms like deno.sh, bun.sh, and zoobicon.sh",
      "Short URLs make great CLI tool names",
    ],
    examples: ["deno.sh", "bun.sh", "warp.sh", "zoobicon.sh", "railway.sh", "render.sh"],
  },
  dev: {
    tld: "dev",
    price: 14.99,
    tagline: "Google's domain for developers and development projects",
    description: "The .dev domain was created by Google specifically for developers and technology. Every .dev domain comes with HTTPS required by default (HSTS preloaded), making it one of the most secure TLDs available. If you're a developer, .dev is your natural home on the internet.",
    idealFor: ["Personal developer portfolios", "Open-source projects", "Developer blogs", "API documentation", "Development agencies", "Code tutorials"],
    keywords: ["buy .dev domain", "register .dev domain", ".dev domain price", "developer portfolio domain", "coding domain name"],
    color: "text-stone-400",
    gradient: "from-stone-500 to-stone-600",
    icon: Code2,
    facts: [
      "Created and managed by Google Registry",
      "HTTPS required by default — built-in security",
      "Over 500,000 .dev domains registered",
      "web.dev is Google's own developer resource site",
    ],
    examples: ["web.dev", "opensource.dev", "flutter.dev", "thirdweb.dev", "glitch.dev", "hack.dev"],
  },
  app: {
    tld: "app",
    price: 14.99,
    tagline: "The secure domain for mobile and web applications",
    description: "The .app domain was created by Google for mobile and web applications. Like .dev, it requires HTTPS by default. It's the natural choice for any app — mobile, web, desktop, or SaaS. Short, clear, and instantly communicates 'this is an application.'",
    idealFor: ["Mobile apps", "Web applications", "SaaS products", "App landing pages", "Progressive web apps", "Productivity tools"],
    keywords: ["buy .app domain", "register .app domain", ".app domain price", "mobile app domain", "application domain name"],
    color: "text-stone-400",
    gradient: "from-stone-500 to-stone-600",
    icon: Smartphone,
    facts: [
      "Created and managed by Google Registry",
      "HTTPS required by default — most secure TLD",
      "Perfect for App Store and Play Store landing pages",
      "Used by cash.app, notion.app, and zoobicon.app",
    ],
    examples: ["cash.app", "notion.app", "zoobicon.app", "day.app", "collected.app", "sticker.app"],
  },
};

const SUPPORTED_TLDS = Object.keys(TLD_DATA);

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean | null;
  price: number;
  checking: boolean;
}

export default function TldPage() {
  const params = useParams();
  const tld = (params.tld as string)?.toLowerCase();
  const info = TLD_DATA[tld];

  const [name, setName] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);

  if (!info) {
    return (
      <div className="min-h-screen bg-[#0b0b16] text-white pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Extension not found</h1>
          <p className="text-slate-400 mb-8">We don&apos;t have information about .{tld} domains yet.</p>
          <Link href="/domains" className="text-stone-400 hover:text-stone-300">
            &larr; Search all domains
          </Link>
        </div>
      </div>
    );
  }

  const handleSearch = async () => {
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanName || cleanName.length < 2) return;

    setSearching(true);
    const initial: DomainResult = {
      domain: `${cleanName}.${tld}`,
      tld,
      available: null,
      price: info.price,
      checking: true,
    };
    setResults([initial]);

    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(cleanName)}&tlds=${encodeURIComponent(tld)}`);
      if (res.ok) {
        const data = await res.json();
        const apiResults = data.results || [];
        const match = apiResults.find((r: { domain: string }) => r.domain === `${cleanName}.${tld}`);
        setResults([{
          domain: `${cleanName}.${tld}`,
          tld,
          available: match ? match.available : null,
          price: match?.price || info.price,
          checking: false,
        }]);
      } else {
        setResults([{ ...initial, checking: false }]);
      }
    } catch {
      setResults([{ ...initial, checking: false }]);
    }
    setSearching(false);
  };

  const Icon = info.icon;

  return (
    <div className="min-h-screen bg-[#0b0b16] text-white">

      {/* Hero */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/30 via-[#0b0b16] to-[#0b0b16]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-stone-500/[0.06] rounded-full blur-[100px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Link href="/domains" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-400 mb-6 transition-colors">
              &larr; All domains
            </Link>

            <div className={`text-6xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br ${info.gradient} mb-6`}>
              .{info.tld}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {info.tagline}
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-3">
              Register your .{info.tld} domain from <span className="text-white font-bold">${info.price}/year</span>
            </p>
            <p className="text-base text-slate-500">
              Free WHOIS privacy &middot; Free SSL &middot; Instant activation &middot; AI website builder included
            </p>
          </div>

          {/* Search */}
          <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.10] rounded-3xl p-6 max-w-2xl mx-auto shadow-xl">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={`Search yourname.${tld}...`}
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.06] border border-white/[0.10] rounded-2xl text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-stone-500 transition-shadow"
                  autoFocus
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching || !name.trim()}
                className="px-8 py-4 bg-stone-600 hover:bg-stone-500 rounded-2xl font-bold text-lg flex items-center gap-2 disabled:opacity-40 transition-all shrink-0"
              >
                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Check
              </button>
            </div>

            {/* Result */}
            {results.length > 0 && (
              <div className="mt-4">
                {results.map((r) => (
                  <div key={r.domain} className={`flex items-center justify-between p-4 rounded-2xl ${
                    r.checking ? "bg-white/[0.03] border border-white/[0.06]" :
                    r.available ? "bg-stone-500/[0.08] border border-stone-500/20" :
                    r.available === false ? "bg-stone-500/[0.05] border border-stone-500/10" :
                    "bg-white/[0.03] border border-white/[0.06]"
                  }`}>
                    <div className="flex items-center gap-3">
                      {r.checking ? <Loader2 className="w-5 h-5 text-slate-500 animate-spin" /> :
                       r.available ? <Check className="w-5 h-5 text-stone-400" /> :
                       r.available === false ? <X className="w-5 h-5 text-stone-400/50" /> :
                       <Globe className="w-5 h-5 text-stone-400/50" />}
                      <span className={`text-lg font-bold ${r.available ? "text-white" : r.available === false ? "text-slate-500 line-through" : "text-slate-400"}`}>
                        {r.domain}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      {r.available && (
                        <>
                          <span className="text-xl font-bold text-white">${r.price}<span className="text-sm text-slate-400">/yr</span></span>
                          <Link
                            href={`/domains?search=${name}&tld=${tld}`}
                            className="px-5 py-2.5 rounded-xl bg-stone-600 hover:bg-stone-500 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Register
                          </Link>
                        </>
                      )}
                      {r.available === false && <span className="text-sm text-stone-400/60">Taken</span>}
                      {r.checking && <span className="text-sm text-slate-500">Checking...</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About this TLD */}
      <section className="py-16 md:py-24 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">What is a .{info.tld} domain?</h2>
              <p className="text-base text-slate-300 leading-relaxed mb-6">{info.description}</p>
              <h3 className="text-lg font-bold mb-3">Ideal for:</h3>
              <ul className="space-y-2">
                {info.idealFor.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-base text-slate-400">
                    <Check className="w-4 h-4 text-stone-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Key facts</h3>
              <div className="space-y-3 mb-8">
                {info.facts.map((fact) => (
                  <div key={fact} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <BadgeCheck className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                    <span className="text-base text-slate-300">{fact}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-bold mb-3">Who uses .{info.tld}?</h3>
              <div className="flex flex-wrap gap-2">
                {info.examples.map((ex) => (
                  <span key={ex} className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 md:py-24 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Everything included with your .{info.tld} domain
          </h2>
          <p className="text-lg text-slate-400 mb-12">No hidden fees. No upsells. One price, everything included.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Lock, title: "Free WHOIS Privacy", desc: "Your personal details stay hidden from public WHOIS lookups" },
              { icon: Shield, title: "Free SSL Certificate", desc: "HTTPS secured via Cloudflare — automatic, no configuration" },
              { icon: Zap, title: "Instant Activation", desc: "Your domain goes live in seconds, not hours or days" },
              { icon: Globe, title: "DNS Management", desc: "Full DNS control — A, CNAME, MX, TXT records and more" },
              { icon: Sparkles, title: "AI Website Builder", desc: "Build a full website for your domain in 60 seconds with AI" },
              { icon: Server, title: "Free Hosting", desc: "Deploy to zoobicon.sh — fast, reliable, included in the price" },
            ].map((f) => (
              <div key={f.title} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] text-left">
                <f.icon className="w-5 h-5 text-stone-400 mb-3" />
                <div className="text-base font-semibold mb-1">{f.title}</div>
                <div className="text-sm text-slate-400">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-6">
            Get your .{info.tld} domain today
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-8">
            Starting at <span className="text-white font-bold">${info.price}/year</span> with free privacy, SSL, and hosting included.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-stone-600 text-white text-lg font-bold hover:bg-stone-500 transition-all shadow-lg shadow-stone-500/20"
            >
              Search .{info.tld} Domains
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link href="/domains" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold text-white/70 bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.10] transition-all">
              Search All Extensions
            </Link>
          </div>

          {/* Other TLDs */}
          <div className="mt-12 pt-8 border-t border-white/[0.04]">
            <p className="text-sm text-slate-500 mb-4">Also available:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {SUPPORTED_TLDS.filter((t) => t !== tld).map((t) => (
                <Link
                  key={t}
                  href={`/domains/${t}`}
                  className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm text-slate-400 hover:text-white hover:border-white/[0.15] transition-all"
                >
                  .{t} — ${TLD_DATA[t].price}/yr
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
