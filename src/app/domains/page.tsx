"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Check,
  X,
  Loader2,
  Globe,
  ShoppingCart,
  Plus,
  Minus,
  Shield,
  Zap,
  RefreshCw,
  ArrowRight,
  Star,
  Lock,
  Clock,
  Server,
  BadgeCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean | null;
  price: number;
  checking: boolean;
}

interface GeneratedName {
  name: string;
  tagline: string;
  domains: DomainResult[];
  checkingDomains: boolean;
}

const TLD_PRICES: Record<string, number> = {
  com: 12.99, ai: 79.99, io: 39.99, sh: 24.99, co: 29.99,
  dev: 14.99, app: 14.99, net: 13.99, org: 11.99, tech: 6.99,
  xyz: 2.99, me: 8.99, us: 8.99,
};

const DEFAULT_TLDS = ["com", "ai", "io", "sh", "co"];

/* ── Popular TLD showcase cards ── */
const FEATURED_TLDS = [
  { tld: "com", price: 12.99, desc: "The gold standard", color: "from-blue-500 to-blue-600", popular: true },
  { tld: "ai", price: 79.99, desc: "AI & tech brands", color: "from-purple-500 to-violet-600", popular: true },
  { tld: "io", price: 39.99, desc: "Startups & SaaS", color: "from-emerald-500 to-teal-600", popular: true },
  { tld: "sh", price: 24.99, desc: "Dev tools & hosting", color: "from-amber-500 to-orange-600", popular: false },
  { tld: "dev", price: 14.99, desc: "Developer projects", color: "from-cyan-500 to-blue-600", popular: false },
  { tld: "app", price: 14.99, desc: "Mobile & web apps", color: "from-pink-500 to-rose-600", popular: false },
];

const TRUST_FEATURES = [
  { icon: BadgeCheck, title: "Real Registry Data", desc: "Live availability from Tucows/OpenSRS — not cached guesses" },
  { icon: Lock, title: "WHOIS Privacy Free", desc: "Your personal details stay hidden at no extra cost" },
  { icon: Zap, title: "Instant Activation", desc: "Domain goes live in seconds, not hours" },
  { icon: Shield, title: "Free SSL Certificate", desc: "HTTPS secured via Cloudflare — included with every domain" },
  { icon: RefreshCw, title: "Easy DNS Management", desc: "Point anywhere or deploy to zoobicon.sh in one click" },
  { icon: Clock, title: "Auto-Renewal", desc: "Never lose your domain — we handle renewals automatically" },
];

const COMPARISON = [
  { feature: ".com registration", zoobicon: "$12.99/yr", godaddy: "$22.99/yr", namecheap: "$15.98/yr" },
  { feature: ".ai registration", zoobicon: "$79.99/yr", godaddy: "$99.99/yr", namecheap: "$89.98/yr" },
  { feature: "WHOIS privacy", zoobicon: "Free", godaddy: "$9.99/yr", namecheap: "Free" },
  { feature: "SSL certificate", zoobicon: "Free", godaddy: "$79.99/yr", namecheap: "Free" },
  { feature: "DNS management", zoobicon: "Free", godaddy: "Free", namecheap: "Free" },
  { feature: "Website hosting", zoobicon: "Included", godaddy: "$11.99/mo extra", namecheap: "$2.88/mo extra" },
  { feature: "AI website builder", zoobicon: "Included", godaddy: "No", namecheap: "No" },
];

export default function DomainsPage() {
  const [mode, setMode] = useState<"search" | "generate">("search");
  const [name, setName] = useState("");
  const [selectedTlds, setSelectedTlds] = useState<Set<string>>(new Set(DEFAULT_TLDS));
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<DomainResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // AI Name Generator state
  const [genDescription, setGenDescription] = useState("");
  const [genStyle, setGenStyle] = useState("modern");
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [generating, setGenerating] = useState(false);
  const genResultsRef = useRef<HTMLDivElement>(null);

  // Checkout state
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  // Track whether we've already tried expanding TLDs for this search
  const [autoExpandedTlds, setAutoExpandedTlds] = useState(false);
  // Track whether we're auto-generating alternatives
  const [autoGenerating, setAutoGenerating] = useState(false);
  // Flag to trigger generation after state updates
  const [pendingGenerate, setPendingGenerate] = useState(false);

  const allTlds = Object.keys(TLD_PRICES);

  // Auto-expand: when all selected TLDs are taken, try ALL TLDs automatically
  const handleAutoExpand = useCallback(async (searchName: string) => {
    const tlds: string[] = Object.keys(TLD_PRICES);
    setAutoExpandedTlds(true);
    setSearching(true);

    const initial: DomainResult[] = tlds.map(tld => ({
      domain: `${searchName}.${tld}`,
      tld,
      available: null,
      price: TLD_PRICES[tld] || 9.99,
      checking: true,
    }));
    setResults(initial);

    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(searchName)}&tlds=${encodeURIComponent(tlds.join(","))}`);
      if (res.ok) {
        const data = await res.json();
        const apiResults = data.results || [];
        setResults(tlds.map(tld => {
          const match = apiResults.find((r: { domain: string }) => r.domain === `${searchName}.${tld}`);
          return {
            domain: `${searchName}.${tld}`,
            tld,
            available: match ? match.available : null,
            price: match?.price || TLD_PRICES[tld] || 9.99,
            checking: false,
          };
        }));
      } else {
        setResults(initial.map(r => ({ ...r, checking: false })));
      }
    } catch {
      setResults(initial.map(r => ({ ...r, checking: false })));
    }
    setSearching(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When results finish loading and nothing is available — auto-expand or auto-suggest
  useEffect(() => {
    if (results.length === 0 || searching) return;
    const allDone = results.every(r => !r.checking);
    if (!allDone) return;

    const anyAvailable = results.some(r => r.available === true);
    if (anyAvailable) return;

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanName) return;

    // Step 1: If we haven't tried all TLDs yet, expand the search
    if (!autoExpandedTlds && selectedTlds.size < allTlds.length) {
      handleAutoExpand(cleanName);
      return;
    }

    // Step 2: All TLDs checked, still nothing — auto-switch to AI generator
    if (!autoGenerating) {
      setAutoGenerating(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, searching]);

  // Reset auto-expand state when search term changes
  useEffect(() => {
    setAutoExpandedTlds(false);
    setAutoGenerating(false);
  }, [name]);

  // Trigger generation after genDescription state has been set
  useEffect(() => {
    if (pendingGenerate && genDescription.trim().length >= 3) {
      setPendingGenerate(false);
      handleGenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingGenerate, genDescription]);

  const toggleTld = (tld: string) => {
    setSelectedTlds(prev => {
      const next = new Set(prev);
      if (next.has(tld)) next.delete(tld); else next.add(tld);
      return next;
    });
  };

  const handleSearch = async () => {
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanName || cleanName.length < 2) return;
    if (selectedTlds.size === 0) return;

    setSearching(true);
    const tlds = Array.from(selectedTlds);

    const initial: DomainResult[] = tlds.map(tld => ({
      domain: `${cleanName}.${tld}`,
      tld,
      available: null,
      price: TLD_PRICES[tld] || 9.99,
      checking: true,
    }));
    setResults(initial);

    // Scroll to results
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    if (!searchHistory.includes(cleanName)) {
      setSearchHistory(prev => [cleanName, ...prev].slice(0, 10));
    }

    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(cleanName)}&tlds=${encodeURIComponent(tlds.join(","))}`);
      if (res.ok) {
        const data = await res.json();
        const apiResults = data.results || [];

        setResults(tlds.map(tld => {
          const match = apiResults.find((r: { domain: string }) => r.domain === `${cleanName}.${tld}`);
          return {
            domain: `${cleanName}.${tld}`,
            tld,
            available: match ? match.available : null,
            price: match?.price || TLD_PRICES[tld] || 9.99,
            checking: false,
          };
        }));
      } else {
        setResults(initial.map(r => ({ ...r, checking: false })));
      }
    } catch {
      setResults(initial.map(r => ({ ...r, checking: false })));
    }

    setSearching(false);
  };

  const addToCart = (result: DomainResult) => {
    if (!cart.some(c => c.domain === result.domain)) {
      setCart(prev => [...prev, result]);
    }
  };

  const removeFromCart = (domain: string) => {
    setCart(prev => prev.filter(c => c.domain !== domain));
  };

  // --- Checkout ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    setCheckoutError("");

    // Get user email from localStorage
    let userEmail = "";
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) {
        const parsed = JSON.parse(raw);
        userEmail = parsed.email || "";
      }
    } catch { /* no user */ }

    try {
      const res = await fetch("/api/domains/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domains: cart.map((d) => ({ domain: d.domain, tld: d.tld, price: d.price })),
          email: userEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || "Checkout failed. Please try again.");
        setCheckingOut(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError("Failed to create checkout session.");
        setCheckingOut(false);
      }
    } catch {
      setCheckoutError("Connection error. Please try again.");
      setCheckingOut(false);
    }
  };

  // --- AI Name Generator ---
  const handleGenerate = async () => {
    if (!genDescription.trim() || genDescription.trim().length < 3) return;
    if (selectedTlds.size === 0) return;

    setGenerating(true);
    setGeneratedNames([]);
    setTimeout(() => genResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    try {
      // Step 1: Generate names via AI
      const nameRes = await fetch("/api/tools/business-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: genDescription.trim(),
          style: genStyle,
          count: 20,
        }),
      });

      if (!nameRes.ok) {
        setGenerating(false);
        return;
      }

      const nameData = await nameRes.json();
      const names: Array<{ name: string; tagline: string }> = nameData.names || [];

      if (names.length === 0) {
        setGenerating(false);
        return;
      }

      // Step 2: Initialize generated names with empty domain results
      const tlds = Array.from(selectedTlds);
      const initial: GeneratedName[] = names.map((n) => ({
        name: n.name,
        tagline: n.tagline,
        domains: tlds.map((tld) => ({
          domain: `${n.name.toLowerCase().replace(/[^a-z0-9-]/g, "")}.${tld}`,
          tld,
          available: null,
          price: TLD_PRICES[tld] || 9.99,
          checking: true,
        })),
        checkingDomains: true,
      }));
      setGeneratedNames(initial);
      setGenerating(false);

      // Step 3: Batch check availability for each name (3 at a time to not overwhelm API)
      const batchSize = 3;
      for (let i = 0; i < names.length; i += batchSize) {
        const batch = names.slice(i, i + batchSize);
        const checks = batch.map(async (n, batchIdx) => {
          const cleanName = n.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
          if (cleanName.length < 2) return;

          try {
            const res = await fetch(`/api/domains/search?q=${encodeURIComponent(cleanName)}&tlds=${encodeURIComponent(tlds.join(","))}`);
            if (res.ok) {
              const data = await res.json();
              const apiResults = data.results || [];

              setGeneratedNames((prev) =>
                prev.map((gn) => {
                  if (gn.name !== n.name) return gn;
                  return {
                    ...gn,
                    checkingDomains: false,
                    domains: tlds.map((tld) => {
                      const match = apiResults.find((r: { domain: string }) => r.domain === `${cleanName}.${tld}`);
                      return {
                        domain: `${cleanName}.${tld}`,
                        tld,
                        available: match ? match.available : null,
                        price: match?.price || TLD_PRICES[tld] || 9.99,
                        checking: false,
                      };
                    }),
                  };
                })
              );
            } else {
              setGeneratedNames((prev) =>
                prev.map((gn) => gn.name === n.name ? { ...gn, checkingDomains: false, domains: gn.domains.map((d) => ({ ...d, checking: false })) } : gn)
              );
            }
          } catch {
            setGeneratedNames((prev) =>
              prev.map((gn) => gn.name === n.name ? { ...gn, checkingDomains: false, domains: gn.domains.map((d) => ({ ...d, checking: false })) } : gn)
            );
          }
        });
        await Promise.all(checks);
      }
    } catch {
      setGenerating(false);
    }
  };

  const availableResults = results.filter(r => r.available === true);
  const takenResults = results.filter(r => r.available === false);
  const unknownResults = results.filter(r => r.available === null && !r.checking);
  const cartTotal = cart.reduce((sum, c) => sum + c.price, 0);

  return (
    <div className="min-h-screen bg-[#0b0b16] text-white">

      {/* ═══════════════════════════════════════════ */}
      {/* HERO — Big, bright, impossible to miss     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        {/* Gradient background — lighter than the rest of the site */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-[#0b0b16] to-[#0b0b16]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/[0.07] rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
            <BadgeCheck className="w-4 h-4" />
            Real-time registry checks — powered by Tucows/OpenSRS
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Find your perfect{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              domain name
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-4 leading-relaxed">
            Search 13 extensions at wholesale prices. Real availability — not cached guesses.
            Includes free SSL, privacy protection, and DNS management.
          </p>

          <p className="text-base text-slate-400 mb-10">
            Domains from <span className="text-white font-bold">$2.99/year</span> &middot; .com from <span className="text-white font-bold">$12.99/year</span> &middot; .ai from <span className="text-white font-bold">$79.99/year</span>
          </p>

          {/* ── TABS: Search / Generate ── */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setMode("search")}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                mode === "search"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-white/[0.06] text-slate-400 hover:text-white border border-white/[0.08]"
              }`}
            >
              <Search className="w-4 h-4" /> Search Exact Name
            </button>
            <button
              onClick={() => {
                setMode("generate");
                // Carry over search term to AI generator if it has a value and generator is empty
                if (name.trim() && !genDescription.trim()) {
                  setGenDescription(name.trim());
                }
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                mode === "generate"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/[0.06] text-slate-400 hover:text-white border border-white/[0.08]"
              }`}
            >
              <Wand2 className="w-4 h-4" /> AI Name Generator
            </button>
          </div>

          {/* ── SEARCH MODE ── */}
          {mode === "search" && (
            <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.10] rounded-3xl p-6 md:p-8 text-left max-w-3xl mx-auto shadow-2xl shadow-indigo-500/[0.05]">
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Type your domain name..."
                    className="w-full pl-12 pr-5 py-4 bg-white/[0.06] border border-white/[0.10] rounded-2xl text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !name.trim() || selectedTlds.size === 0}
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-indigo-500/25 shrink-0"
                >
                  {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Search
                </button>
              </div>

              {/* Extension pills */}
              <div className="flex flex-wrap gap-2">
                {allTlds.map(tld => (
                  <button
                    key={tld}
                    onClick={() => toggleTld(tld)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedTlds.has(tld)
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                    }`}
                  >
                    .{tld}
                    <span className="ml-1.5 text-xs opacity-70">${TLD_PRICES[tld]}</span>
                  </button>
                ))}
              </div>

              {/* Recent Searches */}
              {searchHistory.length > 0 && results.length === 0 && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <span className="text-xs text-slate-500 mr-2">Recent:</span>
                  {searchHistory.map(h => (
                    <button
                      key={h}
                      onClick={() => { setName(h); }}
                      className="mr-3 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── GENERATE MODE — AI Name Generator ── */}
          {mode === "generate" && (
            <div className="bg-white/[0.06] backdrop-blur-sm border border-purple-500/[0.15] rounded-3xl p-6 md:p-8 text-left max-w-3xl mx-auto shadow-2xl shadow-purple-500/[0.05]">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-2">Describe your business or idea</label>
                <textarea
                  value={genDescription}
                  onChange={(e) => setGenDescription(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                  placeholder="e.g. AI-powered accounting software for freelancers, sustainable fashion brand for millennials, premium coffee subscription service..."
                  rows={3}
                  className="w-full px-5 py-4 bg-white/[0.06] border border-white/[0.10] rounded-2xl text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none"
                />
              </div>

              {/* Style selector */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-2">Name style</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "modern", label: "Modern & Tech" },
                    { id: "classic", label: "Classic & Professional" },
                    { id: "playful", label: "Fun & Playful" },
                    { id: "minimal", label: "Short & Minimal" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setGenStyle(s.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        genStyle === s.id
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                          : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extension pills (shared) */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-2">Check availability on</label>
                <div className="flex flex-wrap gap-2">
                  {allTlds.map(tld => (
                    <button
                      key={tld}
                      onClick={() => toggleTld(tld)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedTlds.has(tld)
                          ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                          : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]"
                      }`}
                    >
                      .{tld}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating || genDescription.trim().length < 3 || selectedTlds.size === 0}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-purple-500/20"
              >
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating names...</>
                ) : (
                  <><Wand2 className="w-5 h-5" /> Generate 20 Name Ideas</>
                )}
              </button>
            </div>
          )}

          {/* Quick trust stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-10 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>13 extensions</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Free WHOIS privacy</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Free SSL included</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Instant activation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* RESULTS SECTION                             */}
      {/* ═══════════════════════════════════════════ */}
      <div ref={resultsRef} />
      {results.length > 0 && (
        <section className="pb-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {searching ? "Checking availability..." :
                  results.some(r => r.checking)
                    ? "Checking availability..."
                    : availableResults.length > 0
                    ? `${availableResults.length} domain${availableResults.length > 1 ? "s" : ""} available`
                    : "No exact matches found"}
              </h2>
              {name && <span className="text-sm text-slate-500">Results for &ldquo;{name.trim().toLowerCase()}&rdquo;</span>}
            </div>

            <div className="space-y-3 mb-8">
              {/* Checking — show while still loading */}
              {results.filter(r => r.checking).map(r => (
                <div key={r.domain} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                    </div>
                    <span className="text-lg text-slate-400">{r.domain}</span>
                  </div>
                  <span className="text-sm text-slate-600">Checking...</span>
                </div>
              ))}

              {/* No available results — suggest alternatives */}
              {!searching && !results.some(r => r.checking) && availableResults.length === 0 && results.length > 0 && !autoGenerating && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    {autoExpandedTlds
                      ? `"${name.trim().toLowerCase()}" is taken across all 13 extensions`
                      : `"${name.trim().toLowerCase()}" isn't available on selected extensions`}
                  </h3>
                  <p className="text-sm text-slate-400 mb-5">
                    {autoExpandedTlds
                      ? "We checked every extension. Let our AI find similar names that ARE available."
                      : "We're searching all 13 extensions now..."}
                  </p>
                  {autoExpandedTlds && (
                    <button
                      onClick={() => {
                        setGenDescription(name.trim());
                        setMode("generate");
                        setResults([]);
                        setPendingGenerate(true);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-base transition-all shadow-lg shadow-purple-500/20"
                    >
                      <Wand2 className="w-5 h-5" /> Generate Available Alternatives
                    </button>
                  )}
                </div>
              )}

              {/* Auto-generating alternatives */}
              {autoGenerating && (
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-7 h-7 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    &ldquo;{name.trim().toLowerCase()}&rdquo; is taken everywhere
                  </h3>
                  <p className="text-sm text-slate-400 mb-5">
                    Let our AI generate similar names with available domains.
                  </p>
                  <button
                    onClick={() => {
                      setGenDescription(name.trim());
                      setMode("generate");
                      setResults([]);
                      setAutoGenerating(false);
                      setPendingGenerate(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-base transition-all shadow-lg shadow-purple-500/20"
                  >
                    <Wand2 className="w-5 h-5" /> Find Available Alternatives
                  </button>
                </div>
              )}

              {/* Available — bright green — ONLY show available domains */}
              {availableResults.map(r => (
                <div key={r.domain} className="flex items-center justify-between p-5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/20 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-white">{r.domain}</span>
                      <span className="block text-sm text-emerald-400">Available</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xl font-bold text-white">${r.price}</span>
                      <span className="text-sm text-slate-400">/yr</span>
                    </div>
                    {cart.some(c => c.domain === r.domain) ? (
                      <button onClick={() => removeFromCart(r.domain)} className="px-5 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-300 text-sm font-semibold flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Added
                      </button>
                    ) : (
                      <button onClick={() => addToCart(r)} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-500/20">
                        <Plus className="w-4 h-4" /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-400" />
                    Your domains ({cart.length})
                  </h2>
                  <span className="text-2xl font-black text-indigo-400">${cartTotal.toFixed(2)}<span className="text-sm font-normal text-slate-400">/yr</span></span>
                </div>
                <div className="space-y-2 mb-5">
                  {cart.map(item => (
                    <div key={item.domain} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                      <span className="text-base font-medium">{item.domain}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">${item.price}/yr</span>
                        <button onClick={() => removeFromCart(item.domain)} className="text-red-400/60 hover:text-red-400 transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checkingOut ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Proceed to Registration"}
                </button>
                {checkoutError && <p className="text-center text-sm text-red-400 mt-2">{checkoutError}</p>}
                <p className="text-center text-xs text-slate-500 mt-3">Includes free WHOIS privacy, SSL, and DNS management</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* AI GENERATED NAMES RESULTS                   */}
      {/* ═══════════════════════════════════════════ */}
      <div ref={genResultsRef} />
      {generatedNames.length > 0 && (
        <section className="pb-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-400" />
                {(() => {
                  const withAvailable = generatedNames.filter(gn => gn.domains.some(d => d.available === true)).length;
                  const stillChecking = generatedNames.some(gn => gn.domains.some(d => d.checking));
                  if (stillChecking) return `Checking ${generatedNames.length} names...`;
                  return withAvailable > 0
                    ? `${withAvailable} name${withAvailable > 1 ? "s" : ""} with available domains`
                    : "No available domains found";
                })()}
              </h2>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} /> Regenerate
              </button>
            </div>

            <div className="space-y-4">
              {generatedNames.map((gn) => {
                const availableDomains = gn.domains.filter((d) => d.available === true);
                const hasAvailable = availableDomains.length > 0;
                const stillChecking = gn.domains.some((d) => d.checking);

                // Hide names with zero available domains (unless still checking)
                if (!hasAvailable && !stillChecking) return null;

                return (
                  <div
                    key={gn.name}
                    className={`rounded-2xl border p-5 transition-all ${
                      hasAvailable
                        ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                        : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    {/* Name header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{gn.name}</h3>
                        <p className="text-sm text-slate-500">{gn.tagline}</p>
                      </div>
                      {hasAvailable && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold shrink-0">
                          {availableDomains.length} available
                        </span>
                      )}
                      {stillChecking && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                        </span>
                      )}
                    </div>

                    {/* Domain results — proper register buttons */}
                    <div className="space-y-2 mb-3">
                      {gn.domains
                        .filter((d) => d.checking || d.available === true)
                        .map((d) => (
                        <div
                          key={d.domain}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                            d.checking
                              ? "bg-white/[0.03]"
                              : "bg-emerald-500/[0.06] border border-emerald-500/15"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {d.checking ? (
                              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 text-emerald-400" />
                            )}
                            <span className={`font-semibold ${d.checking ? "text-slate-400" : "text-white"}`}>
                              {d.domain}
                            </span>
                          </div>
                          {d.available && (
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-white">${d.price}<span className="text-xs text-slate-400 font-normal">/yr</span></span>
                              {cart.some((c) => c.domain === d.domain) ? (
                                <button
                                  onClick={() => removeFromCart(d.domain)}
                                  className="px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 text-sm font-semibold flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" /> In Cart
                                </button>
                              ) : (
                                <button
                                  onClick={() => addToCart(d)}
                                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-indigo-500/20"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" /> Register
                                </button>
                              )}
                            </div>
                          )}
                          {d.checking && (
                            <span className="text-xs text-slate-500">Checking...</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add All button */}
                    {hasAvailable && availableDomains.length > 1 && (
                      <button
                        onClick={() => {
                          availableDomains.forEach((d) => {
                            if (!cart.some((c) => c.domain === d.domain)) {
                              addToCart(d);
                            }
                          });
                        }}
                        className="w-full py-2.5 rounded-xl border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/[0.06] transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add All {availableDomains.length} Domains to Cart
                      </button>
                    )}
                  </div>
                );
              })}

              {/* If all generated names are checked and none have available domains */}
              {generatedNames.length > 0 &&
                generatedNames.every((gn) => gn.domains.every((d) => !d.checking)) &&
                !generatedNames.some((gn) => gn.domains.some((d) => d.available === true)) && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6 text-center">
                  <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold mb-2">All names are taken</h3>
                  <p className="text-sm text-slate-400 mb-4">Try a different description or style to find more options.</p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} /> Generate More Names
                  </button>
                </div>
              )}
            </div>

            {/* Cart (shared with search results) */}
            {cart.length > 0 && (
              <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl p-6 mt-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-indigo-400" />
                    Your domains ({cart.length})
                  </h2>
                  <span className="text-2xl font-black text-indigo-400">${cartTotal.toFixed(2)}<span className="text-sm font-normal text-slate-400">/yr</span></span>
                </div>
                <div className="space-y-2 mb-5">
                  {cart.map(item => (
                    <div key={item.domain} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                      <span className="text-base font-medium">{item.domain}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">${item.price}/yr</span>
                        <button onClick={() => removeFromCart(item.domain)} className="text-red-400/60 hover:text-red-400 transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checkingOut ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Proceed to Registration"}
                </button>
                {checkoutError && <p className="text-center text-sm text-red-400 mt-2">{checkoutError}</p>}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* FEATURED TLDs — Browse by extension         */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Wholesale prices on every extension
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              No markup games, no bait-and-switch renewal pricing.
              What you see is what you pay — this year and every year.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURED_TLDS.map((t) => (
              <button
                key={t.tld}
                onClick={() => { setSelectedTlds(new Set([t.tld])); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-left hover:bg-white/[0.06] hover:border-white/[0.15] transition-all"
              >
                {t.popular && (
                  <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                    Popular
                  </span>
                )}
                <div className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br ${t.color} mb-2`}>
                  .{t.tld}
                </div>
                <div className="text-sm text-slate-400 mb-3">{t.desc}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">${t.price}</span>
                  <span className="text-sm text-slate-500">/year</span>
                </div>
                <div className="mt-3 text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Search .{t.tld} domains <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => { setSelectedTlds(new Set(allTlds)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Search all 13 extensions at once &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* WHY ZOOBICON — Trust features                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Not another domain reseller
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              We connect directly to the Tucows/OpenSRS registry. Real availability checks,
              wholesale prices, and everything included that others charge extra for.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRUST_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:bg-white/[0.05] transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-base text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PRICE COMPARISON                            */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Compare and save
            </h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">
              We include SSL, privacy, and a website builder — for free.
              Others charge $90+/year for the same thing.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="grid grid-cols-4 bg-white/[0.04] px-6 py-4 border-b border-white/[0.06]">
              <div className="text-sm font-semibold text-slate-400">Feature</div>
              <div className="text-sm font-bold text-indigo-400 text-center">Zoobicon</div>
              <div className="text-sm font-semibold text-slate-500 text-center">GoDaddy</div>
              <div className="text-sm font-semibold text-slate-500 text-center">Namecheap</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-4 px-6 py-4 ${i < COMPARISON.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                <div className="text-sm text-slate-300">{row.feature}</div>
                <div className="text-sm font-semibold text-center">
                  {row.zoobicon === "Free" || row.zoobicon === "Included" ? (
                    <span className="text-emerald-400">{row.zoobicon}</span>
                  ) : (
                    <span className="text-white">{row.zoobicon}</span>
                  )}
                </div>
                <div className="text-sm text-slate-500 text-center">{row.godaddy}</div>
                <div className="text-sm text-slate-500 text-center">{row.namecheap}</div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-600 mt-4">
            Prices as of March 2026. Competitor prices may vary. See our{" "}
            <Link href="/disclaimers" className="text-slate-500 underline underline-offset-2 hover:text-slate-400">disclaimers</Link>.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* BUNDLE CTA                                  */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-8">
            <Star className="w-4 h-4" />
            Domain + Website + Hosting — all included
          </div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
            Get your domain.<br />
            Build your site.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Go live in minutes.
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            Every domain includes free hosting on zoobicon.sh, a free SSL certificate,
            and access to our AI website builder. No extra charges. No gotchas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-indigo-600 text-white text-lg font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              Search Domains
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-semibold text-white/70 bg-white/[0.06] border border-white/[0.10] hover:bg-white/[0.10] transition-all"
            >
              Try the AI Builder
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER TRUST BAR                            */}
      {/* ═══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.04] py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span>Powered by Tucows/OpenSRS</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>ICANN Accredited Registrar</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>256-bit SSL Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* STICKY CART BAR — always visible at bottom  */}
      {/* ═══════════════════════════════════════════ */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d1a]/95 backdrop-blur-xl border-t border-indigo-500/20 shadow-2xl shadow-black/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-white">{cart.length} domain{cart.length > 1 ? "s" : ""}</span>
                <span className="text-xs text-slate-400 block truncate">
                  {cart.map(c => c.domain).join(", ")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-xl font-black text-indigo-400">
                ${cartTotal.toFixed(2)}<span className="text-xs font-normal text-slate-400">/yr</span>
              </span>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-base transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center gap-2"
              >
                {checkingOut ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><Lock className="w-4 h-4" /> Register Now</>
                )}
              </button>
            </div>
          </div>
          {checkoutError && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-2">
              <p className="text-center text-sm text-red-400">{checkoutError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
