"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Check,
  X,
  Loader2,
  ShoppingCart,
  Lock,
  Sparkles,
  ArrowRight,
  Globe,
  BadgeCheck,
  Shield,
  Zap,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Star,
  Lock,
  Clock,
  Server,
  BadgeCheck,
  Sparkles,
  Wand2,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean | null; // true = available, false = taken, null = uncertain
  price: number;
  checking: boolean;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

// Must match TLD_PRICING in /api/domains/search/route.ts
const TLD_PRICES: Record<string, number> = {
  com: 12.99, ai: 69.99, io: 39.99, sh: 24.99, co: 29.99,
  dev: 14.99, app: 14.99, net: 13.99, org: 12.99, tech: 6.99,
  xyz: 2.99, me: 19.99, us: 9.99,
};

const TLD_BEST_FOR: Record<string, string> = {
  com: "Everyone", ai: "AI & tech", io: "Startups", sh: "Infrastructure",
  co: "Companies", dev: "Developers", app: "Mobile apps", net: "Networks",
  org: "Nonprofits", tech: "Tech brands", xyz: "Creative", me: "Personal",
  us: "US businesses",
};

const ALL_TLDS = Object.keys(TLD_PRICES);

interface GeneratedName {
  name: string;
  tagline: string;
  score?: number;
  recommendedTlds?: Array<{ tld: string; reason: string }>;
}

export default function DomainsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // AI name generator
  const [aiDesc, setAiDesc] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  // Cart
  const [cart, setCart] = useState<DomainResult[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", zip: "", country: "NZ",
  });

  const resultsRef = useRef<HTMLDivElement>(null);

  const searchName = useCallback(async (rawName: string) => {
    const cleanName = rawName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanName || cleanName.length < 2) return;

    setSearching(true);
    setSearchError(null);
    setHasSearched(true);

    const initial: DomainResult[] = ALL_TLDS.map(tld => ({
      domain: `${cleanName}.${tld}`,
      tld,
      available: null,
      price: TLD_PRICES[tld],
      checking: true,
    }));
    setResults(initial);

    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    try {
      const url = `/api/domains/search?q=${encodeURIComponent(cleanName)}&tlds=${ALL_TLDS.join(",")}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(14000) });
      if (res.ok) {
        const data = await res.json();
        const apiResults: Array<{ domain: string; available: boolean | null; price?: number }> = data.results || [];
        setResults(ALL_TLDS.map(tld => {
          const match = apiResults.find(r => r.domain === `${cleanName}.${tld}`);
          return {
            domain: `${cleanName}.${tld}`,
            tld,
            available: match ? match.available : null,
            price: match?.price ?? TLD_PRICES[tld],
            checking: false,
          };
        }));
      } else {
        const errBody = await res.json().catch(() => ({}));
        setSearchError(errBody.error || `Search failed (HTTP ${res.status}). Please try again.`);
        setResults(initial.map(r => ({ ...r, checking: false })));
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Network error. Please try again.");
      setResults(initial.map(r => ({ ...r, checking: false })));
    }

    setSearching(false);
  }, []);

  const handleSearch = () => {
    if (query.trim().length >= 2) searchName(query);
  };

  const handleGenerateNames = async () => {
    if (!aiDesc.trim() || generating) return;
    setGenerating(true);
    setGenError(null);
    setGeneratedNames([]);
    try {
      const res = await fetch("/api/tools/business-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDesc.trim(), count: 12 }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedNames((data.names || []).slice(0, 12));
      } else {
        const errBody = await res.json().catch(() => ({}));
        setGenError(errBody.error || "Could not generate names. Please try again.");
      }
    } catch {
      setGenError("Request timed out. Please try again.");
    }
    setGenerating(false);
  };

  const addToCart = (result: DomainResult) => {
    if (!cart.some(c => c.domain === result.domain)) {
      setCart(prev => [...prev, result]);
    }
  };

  const removeFromCart = (domain: string) => {
    setCart(prev => prev.filter(c => c.domain !== domain));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price, 0);

  const handleSubmitRegistration = async () => {
    if (!contactInfo.firstName || !contactInfo.lastName || !contactInfo.email) {
      alert("Please fill in your name and email.");
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch("/api/domains/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domains: cart.map(c => {
            const parts = c.domain.split(".");
            const tld = parts.pop() || c.tld;
            return { name: parts.join("."), tld };
          }),
          registrant: contactInfo,
          years: 1,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.success) {
        alert("Domains registered! Redirecting to your dashboard...");
        setCart([]);
        setShowCheckout(false);
        window.location.href = "/my-domains";
      } else {
        alert(data.error || "Registration failed. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const availableResults = results.filter(r => r.available === true).sort((a, b) => {
    if (a.tld === "com") return -1;
    if (b.tld === "com") return 1;
    return a.price - b.price;
  });
  const uncertainResults = results.filter(r => !r.checking && r.available === null);
  const takenResults = results.filter(r => r.available === false);
  const isChecking = results.some(r => r.checking);
  const cleanQuery = query.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

  return (
    <div className="min-h-screen bg-[#0b1530] text-white">

      {/* ── CHECKOUT MODAL ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="rounded-[28px] border border-white/[0.08] w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 sm:p-8 backdrop-blur-xl"
            style={{
              background: "linear-gradient(135deg, rgba(20,40,95,0.97) 0%, rgba(10,10,15,0.95) 100%)",
              boxShadow: "0 50px 120px -40px rgba(0,0,0,0.8), 0 30px 80px -30px rgba(232,212,176,0.15)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/75 mb-1">Checkout</div>
                <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">Domain registration</h2>
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-white/40 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="mb-6 p-5 rounded-[20px] border border-[#E8D4B0]/15" style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(38,70,140,0.6) 100%)" }}>
              <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#E8D4B0]/75 mb-2">{cart.length} domain{cart.length > 1 ? "s" : ""}</p>
              {cart.map(c => (
                <div key={c.domain} className="flex justify-between items-center text-[13px] py-1">
                  <span className="text-white font-medium">{c.domain}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/60 font-mono">${c.price.toFixed(2)}/yr</span>
                    <button onClick={() => removeFromCart(c.domain)} className="text-white/30 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.06] text-[14px]">
                <span className="text-white/60">Total</span>
                <span className="text-[#E8D4B0] font-semibold">${cartTotal.toFixed(2)}/yr</span>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[12px] text-white/45">Required for domain registration (ICANN policy).</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">First name *</label>
                  <input type="text" value={contactInfo.firstName} onChange={e => setContactInfo(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 transition-all" placeholder="Craig" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Last name *</label>
                  <input type="text" value={contactInfo.lastName} onChange={e => setContactInfo(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 transition-all" placeholder="Smith" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Email *</label>
                <input type="email" value={contactInfo.email} onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 transition-all" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Phone</label>
                <input type="tel" value={contactInfo.phone} onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 transition-all" placeholder="+64.211234567" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Street address</label>
                <input type="text" value={contactInfo.address} onChange={e => setContactInfo(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 transition-all" placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">City</label>
                  <input type="text" value={contactInfo.city} onChange={e => setContactInfo(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 transition-all" placeholder="Auckland" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Postal code</label>
                  <input type="text" value={contactInfo.zip} onChange={e => setContactInfo(p => ({ ...p, zip: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 transition-all" placeholder="1010" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Country</label>
                <select value={contactInfo.country} onChange={e => setContactInfo(p => ({ ...p, country: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b1530] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#E8D4B0]/40 transition-all">
                  <option value="NZ">New Zealand</option>
                  <option value="AU">Australia</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="SG">Singapore</option>
                  <option value="IN">India</option>
                </select>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-white/40 mt-2">
                <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#E8D4B0]/80" />
                <span>WHOIS privacy protection included free. Your contact details stay private.</span>
              </div>
              <button
                onClick={handleSubmitRegistration}
                disabled={registering || !contactInfo.firstName || !contactInfo.lastName || !contactInfo.email}
                className="w-full py-3.5 mt-3 rounded-2xl font-semibold text-[14px] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)", color: "#0a1628", boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)" }}
              >
                {registering ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</> : <>Pay ${cartTotal.toFixed(2)} &amp; register</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[700px] w-[1200px] -translate-x-1/2 -translate-y-1/4 rounded-full blur-[180px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
          <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.08), transparent 70%)" }} />
          <div className="absolute left-0 top-1/2 h-[300px] w-[300px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(closest-side, rgba(59,130,246,0.06), transparent 70%)" }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.05] px-4 py-1.5 text-[11px] font-semibold text-[#E8D4B0] tracking-widest uppercase mb-8">
            <BadgeCheck className="w-3 h-3" />
            Real-time registry · Tucows / OpenSRS · 25M+ domains registered
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.03em] leading-[1.05] mb-6">
            Find your perfect{" "}
            <span style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif", fontStyle: "italic", fontWeight: 400, color: "#E8D4B0" }}>
              domain.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/50 mb-3 max-w-2xl mx-auto leading-relaxed">
            Type a name and we check all 13 extensions live against the real registry.
            No cached data. No guessing. Just the truth.
          </p>
          <p className="text-[13px] text-white/30 mb-12 font-mono">
            From <span className="text-white/60">$2.99/yr</span> · .com <span className="text-white/60">$12.99</span> · .ai <span className="text-white/60">$69.99</span> · .io <span className="text-white/60">$39.99</span> · Free SSL &amp; WHOIS privacy
          </p>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto">
            <div
              className="flex items-center gap-0 rounded-2xl border overflow-hidden transition-all focus-within:shadow-[0_0_0_2px_rgba(232,212,176,0.3)]"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
            >
              <Search className="ml-5 w-5 h-5 text-white/35 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                placeholder="yourbrand"
                className="flex-1 px-4 py-5 bg-transparent text-white text-[17px] placeholder-white/25 focus:outline-none"
                autoFocus
              />
              <div className="relative">
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Type your domain name..."
                      className="w-full pl-12 pr-5 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white text-lg placeholder-white/30 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={searching || !name.trim() || (!comOnly && selectedTlds.size === 0)}
                    className="px-8 py-4 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-40 transition-all duration-500 hover:-translate-y-0.5 shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                      color: "#0a1628",
                      boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                    }}
                  >
                    {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    Search
                  </button>
                </div>

                {/* ── Unified search-scope toggle ──
                    One pill group, three choices. Replaces the old combo of a
                    .com-only checkbox + three quick-pick buttons + 13 extension
                    pills. Follows Craig's direction: "we want one search engine
                    to complete everything but we still want [an option] to
                    search per extension or all domain extensions." */}
                <ScopeToggle
                  scope={searchScope}
                  onChange={(s) => {
                    setSearchScope(s);
                    setAutoExpandedTlds(true);
                    if (s !== "custom") setCustomPopoverOpen(false);
                    else setCustomPopoverOpen(true);
                  }}
                  customOpen={customPopoverOpen}
                  setCustomOpen={setCustomPopoverOpen}
                  selectedTlds={selectedTlds}
                  toggleTld={toggleTld}
                  allTlds={allTlds}
                  popularTlds={DEFAULT_TLDS}
                />

                {/* Recent Searches */}
                {searchHistory.length > 0 && results.length === 0 && (
                  <div className="mt-5 pt-4 border-t border-white/[0.06]">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-white/30 mr-3">Recent</span>
                    {searchHistory.map(h => (
                      <button
                        key={h}
                        onClick={() => { setName(h); }}
                        className="mr-3 text-[13px] text-[#E8D4B0]/70 hover:text-[#E8D4B0] transition-colors"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── INLINE SEARCH RESULTS — show right here, no scrolling ── */}
                {results.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/50">
                        {searching ? "Checking availability..." : `Results for "${name}"`}
                      </span>
                      {searching && <Loader2 className="w-4 h-4 animate-spin text-[#E8D4B0]/60" />}
                    </div>
                    <div className="space-y-2">
                      {results.map((r) => (
                        <div
                          key={r.domain}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                            r.checking
                              ? "border-white/[0.06] bg-white/[0.02]"
                              : r.available === true
                              ? "border-emerald-500/30 bg-emerald-500/[0.06]"
                              : r.available === false
                              ? "border-white/[0.06] bg-white/[0.02] opacity-50"
                              : "border-amber-500/20 bg-amber-500/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {r.checking ? (
                              <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                            ) : r.available === true ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : r.available === false ? (
                              <XCircle className="w-4 h-4 text-white/30" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-400/60" />
                            )}
                            <span className={`text-[15px] font-medium ${r.available === true ? "text-white" : "text-white/50"}`}>
                              {r.domain}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {r.available === true && (
                              <>
                                <span className="text-[13px] font-semibold text-emerald-400">${r.price}/yr</span>
                                <button
                                  onClick={() => {
                                    if (!cart.some(c => c.domain === r.domain)) {
                                      setCart(prev => [...prev, r]);
                                    }
                                  }}
                                  disabled={cart.some(c => c.domain === r.domain)}
                                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-40"
                                  style={{
                                    background: cart.some(c => c.domain === r.domain) ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #E8D4B0, #F0DCB8)",
                                    color: cart.some(c => c.domain === r.domain) ? "rgba(255,255,255,0.5)" : "#0a1628",
                                  }}
                                >
                                  {cart.some(c => c.domain === r.domain) ? "In cart" : "Add to cart"}
                                </button>
                              </>
                            )}
                            {r.available === false && (
                              <span className="text-[12px] text-white/30">Taken</span>
                            )}
                            {r.checking && (
                              <span className="text-[12px] text-white/30">Checking...</span>
                            )}
                            {!r.checking && r.available === null && (
                              <span className="text-[12px] text-amber-400/60">Unknown</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── GENERATE MODE ── */}
          {mode === "generate" && (
            <div
              className="relative rounded-[28px] border border-[#E8D4B0]/15 p-6 md:p-8 text-left max-w-3xl mx-auto backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, rgba(20,40,95,0.85) 0%, rgba(10,10,15,0.7) 100%)",
                boxShadow: "0 1px 0 rgba(232,212,176,0.08) inset, 0 40px 120px -40px rgba(232,212,176,0.2)",
              }}
            >
              <div
                className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[260px] w-[520px] rounded-full blur-[110px]"
                style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.18), transparent 70%)" }}
                aria-hidden
              />
              <div className="relative">
                <div className="mb-5">
                  <label className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/75 mb-3">Describe your business</label>
                  <textarea
                    value={genDescription}
                    onChange={(e) => setGenDescription(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                    placeholder="e.g. AI-powered accounting software for freelancers, sustainable fashion brand for millennials, premium coffee subscription service..."
                    rows={3}
                    className="w-full px-5 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white text-base placeholder-white/30 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all resize-none"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/75 mb-3">Name style</label>
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
                        className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-300 ${
                          genStyle === s.id
                            ? "text-[#0a1628]"
                            : "border border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-[#E8D4B0]/30 hover:text-[#E8D4B0]"
                        }`}
                        style={genStyle === s.id ? {
                          background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                          boxShadow: "0 8px 24px -12px rgba(232,212,176,0.4)",
                        } : undefined}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Unified scope toggle — same control as exact-search mode.
                    Generator inherits the scope; 24 names × scope = search set. */}
                <div className="mb-6">
                  <label className="block text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/75 mb-3">Check availability on</label>
                  <ScopeToggle
                    scope={searchScope}
                    onChange={(s) => {
                      setSearchScope(s);
                      if (s !== "custom") setCustomPopoverOpen(false);
                      else setCustomPopoverOpen(true);
                    }}
                    customOpen={customPopoverOpen}
                    setCustomOpen={setCustomPopoverOpen}
                    selectedTlds={selectedTlds}
                    toggleTld={toggleTld}
                    allTlds={allTlds}
                    popularTlds={DEFAULT_TLDS}
                  />
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || genDescription.trim().length < 3 || (!comOnly && selectedTlds.size === 0)}
                  className="w-full py-4 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-40 transition-all duration-500 hover:-translate-y-0.5"
                  style={{
                    background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                    color: "#0a1628",
                    boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                  }}
                >
                  {generating ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Generating names...</>
                  ) : (
                    <><Wand2 className="w-5 h-5" /> Generate {GEN_NAME_COUNT} Name Ideas</>
                  )}
                </button>

                {generatorError && (
                  <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/[0.05] text-sm text-red-300">
                    {generatorError}
                  </div>
                )}

                {/* ── INLINE GENERATION PROGRESS — show names as they arrive ── */}
                {(generating || generatedNames.length > 0) && (
                  <div className="mt-6 pt-5 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/50 flex items-center gap-2">
                        {generating && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E8D4B0]/60" />}
                        {generating
                          ? `Found ${generatedNames.length} names — checking availability...`
                          : `${generatedNames.filter(gn => gn.domains.some(d => d.available === true)).length} of ${generatedNames.length} names have available domains`}
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                      {generatedNames
                        .sort((a, b) => {
                          const aAvail = a.domains.some(d => d.available === true) ? 1 : 0;
                          const bAvail = b.domains.some(d => d.available === true) ? 1 : 0;
                          return bAvail - aAvail;
                        })
                        .map((gn) => {
                          const hasAvailable = gn.domains.some(d => d.available === true);
                          const stillChecking = gn.domains.some(d => d.checking);
                          return (
                            <div
                              key={gn.name}
                              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                                hasAvailable
                                  ? "border-emerald-500/25 bg-emerald-500/[0.05]"
                                  : stillChecking
                                  ? "border-white/[0.06] bg-white/[0.02]"
                                  : "border-white/[0.04] bg-white/[0.01] opacity-40"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {stillChecking ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30 shrink-0" />
                                ) : hasAvailable ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-white/20 shrink-0" />
                                )}
                                <span className={`text-[14px] font-medium truncate ${hasAvailable ? "text-white" : "text-white/40"}`}>
                                  {gn.name}
                                </span>
                                {gn.tagline && (
                                  <span className="text-[11px] text-white/25 truncate hidden sm:inline">
                                    — {gn.tagline}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {gn.domains
                                  .filter(d => d.available === true)
                                  .map(d => (
                                    <button
                                      key={d.domain}
                                      onClick={() => {
                                        if (!cart.some(c => c.domain === d.domain)) {
                                          setCart(prev => [...prev, d]);
                                        }
                                      }}
                                      disabled={cart.some(c => c.domain === d.domain)}
                                      className={`text-[11px] px-2 py-1 rounded-lg font-medium transition-all ${
                                        cart.some(c => c.domain === d.domain)
                                          ? "bg-white/10 text-white/30"
                                          : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                                      }`}
                                    >
                                      .{d.tld}
                                    </button>
                                  ))}
                                {!stillChecking && !hasAvailable && (
                                  <span className="text-[11px] text-white/20">all taken</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {!generating && generatedNames.length > 0 && (
                      <div className="mt-3 text-center">
                        <button
                          onClick={() => {
                            const el = document.getElementById("full-gen-results");
                            el?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                          className="text-[12px] text-[#E8D4B0]/60 hover:text-[#E8D4B0] transition-colors inline-flex items-center gap-1"
                        >
                          See full results with details <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick suggestion chips */}
            {!hasSearched && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {["zoobicon", "launchpad", "stardust", "vaultly"].map(s => (
                  <button key={s} onClick={() => { setQuery(s); searchName(s); }}
                    className="text-[12px] text-white/35 hover:text-white/70 transition-colors px-3 py-1 rounded-full border border-white/[0.06] hover:border-white/20">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <div ref={resultsRef} className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">

        {searchError && (
          <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/[0.08] text-red-300 text-[14px] flex items-start gap-3">
            <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{searchError}</span>
          </div>
        )}

        {hasSearched && (
          <>
            {isChecking && (
              <div className="flex items-center gap-3 text-[13px] text-white/45 mb-5">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking all 13 extensions against the live registry...
              </div>
            )}

            {/* Available */}
            {availableResults.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-emerald-400/80 mb-3 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  {availableResults.length} available
                </p>
                <div className="space-y-2">
                  {availableResults.map(r => {
                    const inCart = cart.some(c => c.domain === r.domain);
                    const isComRec = r.tld === "com";
                    return (
                      <div
                        key={r.domain}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all hover:border-white/15"
                        style={{
                          background: isComRec
                            ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(16,34,80,0.7) 100%)"
                            : "rgba(255,255,255,0.03)",
                          borderColor: isComRec ? "rgba(232,212,176,0.22)" : "rgba(255,255,255,0.07)",
                        }}
                      >
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-[15px]">{r.domain}</span>
                            {isComRec && (
                              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#E8D4B0]/12 text-[#E8D4B0] border border-[#E8D4B0]/20">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-white/40 font-mono mt-0.5">${r.price.toFixed(2)}/yr · {TLD_BEST_FOR[r.tld] || r.tld}</div>
                        </div>
                        <button
                          onClick={() => inCart ? removeFromCart(r.domain) : addToCart(r)}
                          className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap ${
                            inCart
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/25"
                              : "bg-white/[0.06] text-white/80 border border-white/[0.1] hover:bg-white/[0.12] hover:text-white"
                          }`}
                        >
                          {inCart ? "✓ Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

      {/* ═══════════════════════════════════════════ */}
      {/* AI GENERATED NAMES RESULTS                   */}
      {/* ═══════════════════════════════════════════ */}
      <div ref={genResultsRef} id="full-gen-results" />
      {generatedNames.length > 0 && (
        <section className="pb-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-[#E8D4B0]" />
                {(() => {
                  const withAvailable = generatedNames.filter(gn => gn.domains.some(d => d.available === true)).length;
                  const stillChecking = generatedNames.some(gn => gn.domains.some(d => d.checking));
                  const allUnknown = !stillChecking && generatedNames.every(gn => gn.domains.every(d => d.available === null));
                  if (stillChecking) return `Checking ${generatedNames.length} names...`;
                  if (allUnknown) return "Availability check failed";
                  return withAvailable > 0
                    ? `${withAvailable} name${withAvailable > 1 ? "s" : ""} with available domains`
                    : "No available domains found";
                })()}
              </h2>
              <button
                onClick={() => handleGenerate()}
                disabled={generating}
                className="text-[12px] text-[#E8D4B0]/75 hover:text-[#E8D4B0] flex items-center gap-1 transition-colors uppercase tracking-[0.15em] font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} /> Regenerate
              </button>
            </div>

            {/* Per-TLD availability breakdown. Craig's exact feedback: "should
                be millions of .com names available" — if all 24 .com slots come
                back taken, show that explicitly so he can SEE it's the AI's
                suggestions that are saturated, not a bug in the search. */}
            {(() => {
              const stillChecking = generatedNames.some(gn => gn.domains.some(d => d.checking));
              if (stillChecking || generatedNames.length === 0) return null;
              const tldsInPlay = Array.from(
                new Set(generatedNames.flatMap(gn => gn.domains.map(d => d.tld))),
              );
              if (tldsInPlay.length === 0) return null;
              const breakdown = tldsInPlay.map(tld => {
                let available = 0;
                let taken = 0;
                let unknown = 0;
                for (const gn of generatedNames) {
                  for (const d of gn.domains) {
                    if (d.tld !== tld) continue;
                    if (d.available === true) available++;
                    else if (d.available === false) taken++;
                    else unknown++;
                  }
                }
                return { tld, available, taken, unknown };
              });
              return (
                <div className="mb-6 flex flex-wrap gap-2">
                  {breakdown.map(b => (
                    <div
                      key={b.tld}
                      className={`text-[11px] px-3 py-1.5 rounded-full border font-mono tracking-tight flex items-center gap-2 ${
                        b.available > 0
                          ? "border-[#E8D4B0]/30 bg-[#E8D4B0]/[0.06] text-[#E8D4B0]"
                          : "border-white/[0.08] bg-white/[0.02] text-white/45"
                      }`}
                      title={`.${b.tld}: ${b.available} available · ${b.taken} taken${b.unknown > 0 ? ` · ${b.unknown} unknown` : ""}`}
                    >
                      <span className="font-semibold">.{b.tld}</span>
                      <span>{b.available}/{generatedNames.length} available</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Industry + recommended TLD intelligence panel.
                This is the "AI actually thinks" layer — tells the user what
                category their prompt landed in and which TLDs matter for it. */}
            {(genIndustry || genRecommendedTlds.length > 0) && (
              <div
                className="rounded-[20px] border border-[#E8D4B0]/15 p-5 mb-5 backdrop-blur-xl"
                style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.03) 0%, rgba(20,40,95,0.65) 100%)" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E8D4B0]/[0.08] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-[#E8D4B0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-white/50">
                        AI categorised this as
                      </span>
                      {genIndustry && (
                        <span className="text-[13px] font-semibold text-white">{genIndustry}</span>
                      )}
                    </div>
                    {genRecommendedTlds.length > 0 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="text-[11px] uppercase tracking-[0.15em] font-semibold text-white/40">
                          Suggested TLDs — tap to add to your search
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {genRecommendedTlds.slice(0, 4).map((r) => {
                            const active = selectedTlds.has(r.tld);
                            return (
                              <button
                                key={r.tld}
                                type="button"
                                onClick={() => toggleTld(r.tld)}
                                title={`${r.reason} — click to ${active ? "remove" : "add"}`}
                                className={`group px-3 py-1.5 rounded-full text-[12px] flex items-center gap-2 transition-all ${
                                  active
                                    ? "border border-[#E8D4B0]/60 bg-[#E8D4B0]/[0.12] text-white"
                                    : "border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.04] text-white/80 hover:border-[#E8D4B0]/50 hover:bg-[#E8D4B0]/[0.08]"
                                }`}
                              >
                                <span className="text-[#E8D4B0] font-semibold">.{r.tld}</span>
                                <span className="text-white/45 hidden sm:inline">— {r.reason}</span>
                                <span className="text-white/45 inline sm:hidden text-[11px]">— {r.reason.slice(0, 30)}…</span>
                                {active && <Check className="w-3 h-3 text-[#E8D4B0]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-white/30 text-[12px]">Try a different name, or use the AI generator below to find alternatives.</p>
              </div>
            )}

            {/* Uncertain — check manually */}
            {!isChecking && uncertainResults.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-amber-400/70 mb-3 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {uncertainResults.length} unable to verify — check manually
                </p>
                <div className="space-y-2">
                  {uncertainResults.map(r => (
                    <div
                      key={r.domain}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02]"
                    >
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-white/60 text-[14px]">{r.domain}</span>
                        <div className="text-[11px] text-white/30 font-mono mt-0.5">${r.price.toFixed(2)}/yr · Registry unreachable</div>
                      </div>
                      <a
                        href={`https://lookup.icann.org/en/lookup?name=${encodeURIComponent(r.domain)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 text-[12px] transition-colors flex items-center gap-1"
                      >
                        WHOIS <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Taken */}
            {!isChecking && takenResults.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-white/25 mb-3 flex items-center gap-2">
                  <X className="w-3.5 h-3.5" />
                  {takenResults.length} taken
                </p>
                <div className="space-y-1.5">
                  {takenResults.map(r => (
                    <div key={r.domain} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-white/[0.04] opacity-50">
                      <X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" />
                      <span className="text-white/50 text-[14px] line-through decoration-white/20">{r.domain}</span>
                      <span className="ml-auto text-white/25 text-[12px] font-mono">${r.price.toFixed(2)}/yr</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── AI NAME GENERATOR ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <div
          className="rounded-3xl border border-white/[0.08] p-7 sm:p-9 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(16,24,40,0.95) 100%)",
          }}
        >
          {/* Background glow */}
          <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px]" aria-hidden
            style={{ background: "radial-gradient(closest-side, rgba(139,92,246,0.12), transparent)" }} />

          <div className="relative">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold text-white leading-tight">AI Name Generator</h2>
                <p className="text-[13px] text-white/45 mt-1">
                  Describe your business — AI creates brandable names and checks what&apos;s available
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              <input
                type="text"
                value={aiDesc}
                onChange={e => setAiDesc(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleGenerateNames(); }}
                placeholder="e.g. a sustainable clothing brand for outdoor adventurers"
                className="flex-1 px-4 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-white text-[14px] placeholder-white/25 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.06] transition-all"
              />
              <button
                onClick={handleGenerateNames}
                disabled={generating || aiDesc.trim().length < 5}
                className="px-6 py-3.5 rounded-xl font-semibold text-[14px] transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 24px -8px rgba(99,102,241,0.4)" }}
              >
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate names</>}
              </button>
            </div>
            <p className="text-[11px] text-white/25 mb-5">Powered by Claude — names are screened for .com availability before being shown</p>

            {genError && (
              <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/[0.07] text-red-300 text-[13px] flex items-start gap-2">
                <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{genError}</span>
              </div>
            )}

            {generating && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] animate-pulse">
                    <div className="h-4 bg-white/[0.08] rounded w-2/3 mb-2" />
                    <div className="h-3 bg-white/[0.05] rounded w-full" />
                  </div>
                ))}
              </div>
            )}

            {generatedNames.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold text-white/35 mb-3">
                  {generatedNames.length} name ideas — click any to check availability
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {generatedNames.map((gn, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const slug = gn.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        setQuery(slug);
                        searchName(slug);
                        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="text-left p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] hover:border-violet-500/30 transition-all group"
                    >
                      <div className="font-semibold text-white text-[14px] group-hover:text-violet-300 transition-colors">{gn.name}</div>
                      {gn.tagline && <div className="text-[11px] text-white/35 mt-1 leading-snug line-clamp-2">{gn.tagline}</div>}
                      {gn.recommendedTlds && gn.recommendedTlds.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {gn.recommendedTlds.slice(0, 2).map(rt => (
                            <span key={rt.tld} className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
                              .{rt.tld}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── TLD GRID ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/35 mb-5 text-center">
          13 extensions · All include free SSL &amp; WHOIS privacy
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {Object.entries(TLD_PRICES).map(([tld, price]) => (
            <button
              key={tld}
              onClick={() => {
                if (cleanQuery.length >= 2) {
                  searchName(cleanQuery);
                  resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all text-left group"
            >
              <div className="font-bold text-white text-[14px] group-hover:text-[#E8D4B0] transition-colors">.{tld}</div>
              <div className="text-[11px] text-white/35 font-mono mt-0.5">${price}/yr</div>
              <div className="text-[10px] text-white/25 mt-0.5 truncate">{TLD_BEST_FOR[tld]}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Lock, label: "Free WHOIS privacy", desc: "Your identity stays protected" },
            { icon: Shield, label: "Free SSL certificate", desc: "HTTPS on every domain" },
            { icon: BadgeCheck, label: "Real registry checks", desc: "Powered by Tucows/OpenSRS" },
            { icon: Zap, label: "Instant activation", desc: "Live within minutes" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              <div className="w-8 h-8 rounded-xl bg-[#E8D4B0]/10 flex items-center justify-center mb-3">
                <Icon className="w-4 h-4 text-[#E8D4B0]/80" />
              </div>
              <div className="font-semibold text-white text-[13px] mb-1">{label}</div>
              <div className="text-[11px] text-white/35">{desc}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-[13px] text-white/30">
          Need a website too?{" "}
          <Link href="/builder" className="text-[#E8D4B0]/70 hover:text-[#E8D4B0] underline underline-offset-2 transition-colors">
            Build one free with our AI builder →
          </Link>
        </p>
      </section>

      {/* ── CART BAR ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <div
            className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl border border-white/[0.12] backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(20,40,95,0.96) 0%, rgba(10,15,30,0.96) 100%)", boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)" }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-[#E8D4B0]" />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#E8D4B0] text-[#0a1628] text-[9px] font-bold flex items-center justify-center">
                  {cart.length}
                </span>
              </div>
              <div>
                <div className="text-white font-semibold text-[13px]">{cart.length} domain{cart.length > 1 ? "s" : ""} selected</div>
                <div className="text-[#E8D4B0]/75 text-[12px] font-mono">${cartTotal.toFixed(2)}/yr</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCart([])} className="text-white/35 hover:text-white/65 text-[12px] transition-colors">Clear</button>
              <button
                onClick={() => setShowCheckout(true)}
                className="px-4 py-2 rounded-xl font-semibold text-[13px] text-[#0a1628] flex items-center gap-1.5 transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)" }}
              >
                Register <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
