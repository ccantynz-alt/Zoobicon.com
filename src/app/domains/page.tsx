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
} from "lucide-react";

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean | null;
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

const ALL_TLDS = Object.keys(TLD_PRICES);

interface GeneratedName {
  name: string;
  tagline: string;
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

    // Show all TLDs as checking immediately
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
        const apiResults: Array<{ domain: string; available: boolean; price?: number }> = data.results || [];
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
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedNames((data.names || []).slice(0, 12));
      } else {
        const errBody = await res.json().catch(() => ({}));
        setGenError(errBody.error || "Could not generate names. Please try again.");
      }
    } catch {
      setGenError("Network error. Please try again.");
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

  // Sorted results: available first, .com pinned to top among available
  const availableResults = results
    .filter(r => r.available === true)
    .sort((a, b) => {
      if (a.tld === "com") return -1;
      if (b.tld === "com") return 1;
      return a.price - b.price;
    });

  const comResult = results.find(r => r.tld === "com");
  const comTaken = comResult && !comResult.checking && comResult.available === false;
  const isChecking = results.some(r => r.checking);
  const cleanQuery = query.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");

  return (
    <div className="min-h-screen bg-[#0b1530] text-white pt-[72px]">

      {/* ── CHECKOUT MODAL ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="rounded-[28px] border border-white/[0.08] w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 sm:p-8 backdrop-blur-xl"
            style={{
              background: "linear-gradient(135deg, rgba(20,40,95,0.95) 0%, rgba(10,10,15,0.92) 100%)",
              boxShadow: "0 50px 120px -40px rgba(0,0,0,0.8), 0 30px 80px -30px rgba(232,212,176,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/75 mb-1">Checkout</div>
                <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">Domain registration</h2>
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-white/40 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            {/* Cart summary */}
            <div className="mb-6 p-5 rounded-[20px] border border-[#E8D4B0]/15" style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.10) 0%, rgba(38,70,140,0.92) 100%)" }}>
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="Craig" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Last name *</label>
                  <input type="text" value={contactInfo.lastName} onChange={e => setContactInfo(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="Smith" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Email *</label>
                <input type="email" value={contactInfo.email} onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Phone</label>
                <input type="tel" value={contactInfo.phone} onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="+64.211234567" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Street address</label>
                <input type="text" value={contactInfo.address} onChange={e => setContactInfo(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">City</label>
                  <input type="text" value={contactInfo.city} onChange={e => setContactInfo(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="Auckland" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Postal code</label>
                  <input type="text" value={contactInfo.zip} onChange={e => setContactInfo(p => ({ ...p, zip: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="1010" />
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
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full blur-[150px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.08), transparent 70%)" }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-7">
            <BadgeCheck className="w-3 h-3" />
            Real-time registry checks · Tucows / OpenSRS
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-5">
            Find your perfect{" "}
            <span style={{ fontFamily: "Fraunces, ui-serif, Georgia, serif", fontStyle: "italic", fontWeight: 400, color: "#E8D4B0" }}>
              domain.
            </span>
          </h1>

          <p className="text-lg text-white/55 mb-3">
            Type a name — we check all 13 extensions instantly and show you only what&apos;s available.
          </p>
          <p className="text-[13px] text-white/35 mb-10 font-mono">
            From <span className="text-white/70">$2.99/yr</span> · .com <span className="text-white/70">$12.99/yr</span> · .ai <span className="text-white/70">$69.99/yr</span> · Free SSL &amp; WHOIS privacy
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <div className="flex items-center gap-0 rounded-2xl border border-white/[0.12] bg-white/[0.04] backdrop-blur-sm overflow-hidden focus-within:border-[#E8D4B0]/40 transition-colors">
              <Search className="ml-4 w-5 h-5 text-white/40 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
                placeholder="yourbrand"
                className="flex-1 px-3 py-4 bg-transparent text-white text-[16px] placeholder-white/30 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={searching || query.trim().length < 2}
                className="m-1.5 px-5 py-2.5 rounded-xl font-semibold text-[14px] text-[#0a1628] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)" }}
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <div ref={resultsRef} className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">

        {searchError && (
          <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-[14px]">
            {searchError}
          </div>
        )}

        {hasSearched && (
          <div className="mb-4">
            {/* .com status banner */}
            {comTaken && !isChecking && (
              <div className="mb-5 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white/60">
                <span className="text-white font-medium">{cleanQuery}.com</span> is taken —
                but the extensions below are available for your brand.
              </div>
            )}

            {isChecking && (
              <div className="flex items-center gap-2 text-[13px] text-white/50 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking all 13 extensions...
              </div>
            )}

            {!isChecking && availableResults.length === 0 && results.length > 0 && (
              <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-center text-white/60 text-[14px]">
                No available extensions found for <span className="text-white font-medium">{cleanQuery}</span>. Try a different name.
              </div>
            )}

            {availableResults.length > 0 && (
              <>
                <p className="text-[12px] uppercase tracking-widest font-semibold text-white/40 mb-3">
                  {availableResults.length} available extension{availableResults.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-2">
                  {availableResults.map(r => {
                    const inCart = cart.some(c => c.domain === r.domain);
                    const isComRec = r.tld === "com";
                    return (
                      <div
                        key={r.domain}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all"
                        style={{
                          background: isComRec
                            ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(20,40,95,0.6) 100%)"
                            : "rgba(255,255,255,0.03)",
                          borderColor: isComRec ? "rgba(232,212,176,0.25)" : "rgba(255,255,255,0.07)",
                        }}
                      >
                        <Check className={`w-4 h-4 flex-shrink-0 ${isComRec ? "text-[#E8D4B0]" : "text-emerald-400"}`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-[15px]">{r.domain}</span>
                            {isComRec && (
                              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#E8D4B0]/15 text-[#E8D4B0] border border-[#E8D4B0]/25">
                                Recommended
                              </span>
                            )}
                          </div>
                          <div className="text-[13px] text-white/45 font-mono mt-0.5">${r.price.toFixed(2)}/yr</div>
                        </div>

                        <button
                          onClick={() => inCart ? removeFromCart(r.domain) : addToCart(r)}
                          className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                            inCart
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30"
                              : "bg-white/[0.06] text-white/80 border border-white/[0.1] hover:bg-white/[0.12] hover:text-white"
                          }`}
                        >
                          {inCart ? "✓ Added" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── AI NAME GENERATOR ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-white">AI Name Generator</h2>
              <p className="text-[12px] text-white/45">Describe your business — AI generates name ideas and checks availability</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={aiDesc}
              onChange={e => setAiDesc(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleGenerateNames(); }}
              placeholder="e.g. a sustainable clothing brand for outdoor adventurers"
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[14px] placeholder-white/30 focus:outline-none focus:border-purple-500/40 transition-colors"
            />
            <button
              onClick={handleGenerateNames}
              disabled={generating || aiDesc.trim().length < 5}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-[14px] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate</>}
            </button>
          </div>

          {genError && (
            <div className="mt-4 p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13px]">
              {genError}
            </div>
          )}

          {generatedNames.length > 0 && (
            <div className="mt-5">
              <p className="text-[12px] uppercase tracking-widest font-semibold text-white/40 mb-3">
                {generatedNames.length} name ideas — click any to check availability
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {generatedNames.map((gn, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(gn.name.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      searchName(gn.name);
                      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="text-left p-3 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all group"
                  >
                    <div className="font-semibold text-white text-[14px] group-hover:text-[#E8D4B0] transition-colors">{gn.name}</div>
                    {gn.tagline && <div className="text-[11px] text-white/40 mt-0.5 truncate">{gn.tagline}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pricing strip */}
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(TLD_PRICES).slice(0, 6).map(([tld, price]) => (
            <div key={tld} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="font-bold text-white text-[13px]">.{tld}</div>
              <div className="text-[11px] text-white/40 font-mono mt-0.5">${price}/yr</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-[12px] text-white/40 justify-center">
          <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" />Free WHOIS privacy</span>
          <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />Free SSL</span>
          <span className="flex items-center gap-1.5"><BadgeCheck className="w-3 h-3" />Real registry checks</span>
        </div>

        <p className="mt-4 text-center text-[12px] text-white/30">
          Need a website too? <Link href="/builder" className="text-[#E8D4B0]/80 hover:text-[#E8D4B0] underline underline-offset-2">Build one free with our AI builder →</Link>
        </p>
      </section>

      {/* ── CART BAR ── */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
          <div
            className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl border border-white/[0.12] backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(20,40,95,0.95) 0%, rgba(10,15,30,0.95) 100%)", boxShadow: "0 25px 60px -15px rgba(0,0,0,0.7)" }}
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
                <div className="text-[#E8D4B0]/80 text-[12px] font-mono">${cartTotal.toFixed(2)}/yr</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCart([])} className="text-white/40 hover:text-white/70 text-[12px] transition-colors">Clear</button>
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
