"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
  /** Per-TLD availability returned by /api/domains/ai-find */
  availability?: Record<
    string,
    { domain: string; available: boolean | null; price: number }
  >;
  /** TLDs confirmed available — populated by /api/domains/ai-find */
  buyableTlds?: string[];
  recommendedTlds?: Array<{ tld: string; reason: string }>;
}

// One smart finder, one input. We classify whether the user is asking
// us to look up a literal name (single short alphanumeric word like
// "stardust") or describe what they want ("a sustainable clothing brand
// for outdoor adventurers"). The classifier is conservative — anything
// that has a space, punctuation other than a hyphen, or runs longer than
// a typical brand stem routes to AI mode so users don't end up searching
// for "a sustainable clothing brand" as if it were a domain label.
function classifyIntent(raw: string): "empty" | "literal" | "ai" {
  const trimmed = raw.trim();
  if (trimmed.length < 2) return "empty";
  // Has a space or any punctuation beyond a single hyphen → description
  if (/\s/.test(trimmed)) return "ai";
  if (/[^a-z0-9-]/i.test(trimmed)) return "ai";
  // Single token: 2-20 chars, alphanumeric (with optional hyphen) → literal
  if (trimmed.length <= 20) return "literal";
  return "ai";
}

type FinderMode = "literal" | "ai";

export default function DomainsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  // Active result mode — set when the user submits, drives which result
  // section renders below. Default to literal so the empty-state TLD
  // grid at the bottom of the page still feels like the canonical one.
  const [mode, setMode] = useState<FinderMode>("literal");

  // AI generator state lives alongside literal-search state — both
  // populate from the same hero input via classifyIntent above.
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

  // Bulk-handoff from /domain-finder — when this page loads with
  // ?cart=name1,name2 we pre-populate the cart with each slug as a .com,
  // pop the checkout modal open, and remove the param from the URL so a
  // refresh doesn't re-add them.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const cartParam = params.get("cart");
    if (!cartParam) return;
    const slugs = cartParam
      .split(",")
      .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
      .filter(Boolean);
    if (slugs.length === 0) return;
    const items: DomainResult[] = slugs.map((slug) => ({
      domain: `${slug}.com`,
      tld: "com",
      available: true,
      price: TLD_PRICES.com ?? 12.99,
      checking: false,
    }));
    setCart(items);
    setShowCheckout(true);
    // Strip the ?cart= param so a back+forward navigation doesn't re-add
    const url = new URL(window.location.href);
    url.searchParams.delete("cart");
    window.history.replaceState({}, "", url.toString());
  }, []);

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
      // Backend caps itself at 7s of registry work and Vercel kills the
      // function at 15s — anything beyond that means the response was lost
      // in transit, which the catch block surfaces as a clear error.
      const res = await fetch(url, { signal: AbortSignal.timeout(16000) });
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

  // The single submit path. Classifies the query, runs the right
  // backend, and switches result rendering between literal and AI mode.
  // Everything in the hero — Enter key, Search button, suggestion chips —
  // funnels through here so the user never has to think about which mode
  // they're in.
  const handleSubmit = useCallback(
    async (rawQuery?: string) => {
      const next = (rawQuery ?? query).trim();
      if (!next) return;
      const intent = classifyIntent(next);
      if (intent === "empty") return;

      setHasSearched(true);
      setSearchError(null);
      setGenError(null);

      if (intent === "literal") {
        setMode("literal");
        setGeneratedNames([]);
        await searchName(next);
        return;
      }

      // AI mode
      setMode("ai");
      setResults([]);
      setGenerating(true);
      setGeneratedNames([]);
      setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100,
      );
      try {
        // /api/domains/ai-find generates names AND checks availability across
        // .com / .ai / .io in a single round-trip, so each card already knows
        // which TLDs are buyable.
        const res = await fetch("/api/domains/ai-find", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: next, count: 12, tlds: ["com", "ai", "io"] }),
          signal: AbortSignal.timeout(45_000),
        });
        if (res.ok) {
          const data = await res.json();
          setGeneratedNames((data.names || []).slice(0, 12));
        } else {
          const errBody = await res.json().catch(() => ({}));
          setGenError(errBody.error || "Could not generate names. Please try again.");
        }
      } catch (err) {
        setGenError(
          err instanceof Error && err.name === "AbortError"
            ? "Request timed out. The AI took too long to respond — please try again."
            : err instanceof Error
              ? err.message
              : "Network error while generating names.",
        );
      }
      setGenerating(false);
    },
    [query, searchName],
  );

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
    <div className="relative z-10 min-h-screen" style={{ background: "var(--paper)", color: "var(--ink)" }}>

      {/* ── CHECKOUT MODAL ── */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="rounded-[28px] border border-white/[0.08] w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 sm:p-8 backdrop-blur-xl"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              boxShadow: "0 50px 120px -40px rgba(10,10,11,0.18), var(--shadow-2)",
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--paper)] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#E8D4B0]/40 transition-all">
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
                style={{ background: "var(--ink)", color: "var(--paper)", boxShadow: "0 14px 40px -16px rgba(10,10,11,0.4)" }}
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
            style={{ background: "radial-gradient(closest-side, rgba(184,146,63,0.08), transparent 70%)" }} />
          <div className="absolute left-0 top-1/2 h-[300px] w-[300px] rounded-full blur-[100px]"
            style={{ background: "radial-gradient(closest-side, rgba(212,184,109,0.06), transparent 70%)" }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold tracking-widest uppercase mb-8"
            style={{
              border: "1px solid var(--rule)",
              background: "var(--paper-elevated)",
              color: "var(--gold-deep)",
            }}
          >
            <BadgeCheck className="w-3 h-3" />
            AI-powered · Real-time registry · Tucows / OpenSRS
          </div>

          {/* Headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-[-0.03em] leading-[1.05] mb-6"
            style={{ color: "var(--ink)" }}
          >
            Find your perfect{" "}
            <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
              domain.
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl mb-3 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "var(--ink-secondary)" }}
          >
            Type a name to check 13 extensions live, or describe your business
            and let AI generate brandable names with availability already verified.
            One input, one click.
          </p>
          <p className="text-[13px] mb-12 font-mono" style={{ color: "var(--ink-muted)" }}>
            From <span style={{ color: "var(--ink-secondary)" }}>$2.99/yr</span>
            {" · "}.com <span style={{ color: "var(--ink-secondary)" }}>$12.99</span>
            {" · "}.ai <span style={{ color: "var(--ink-secondary)" }}>$69.99</span>
            {" · "}.io <span style={{ color: "var(--ink-secondary)" }}>$39.99</span>
            {" · "}Free SSL &amp; WHOIS privacy
          </p>

          {/* Search bar — single AI-powered finder, classifies intent on submit */}
          <div className="relative max-w-2xl mx-auto">
            <div
              className="flex items-center gap-0 rounded-2xl overflow-hidden transition-all"
              style={{
                background: "var(--paper)",
                border: "1px solid var(--rule-strong)",
                boxShadow: "var(--shadow-1)",
              }}
            >
              <Search
                className="ml-5 w-5 h-5 flex-shrink-0"
                style={{ color: "var(--ink-muted)" }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="yourbrand   or   a sustainable clothing brand for outdoor adventurers"
                className="flex-1 px-4 py-5 bg-transparent text-[17px] focus:outline-none"
                style={{ color: "var(--ink)" }}
                autoFocus
              />
              <button
                onClick={() => handleSubmit()}
                disabled={(searching || generating) || query.trim().length < 2}
                className="m-2 px-6 py-3 rounded-xl font-semibold text-[15px] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                style={{
                  background: "var(--ink)",
                  color: "var(--paper)",
                  boxShadow: "0 8px 24px -8px rgba(10,10,11,0.35)",
                }}
              >
                {searching || generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : query.trim().length > 0 && classifyIntent(query) === "ai" ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {query.trim().length > 0 && classifyIntent(query) === "ai"
                    ? "Generate"
                    : "Search"}
                </span>
              </button>
            </div>

            {/* Smart-mode hint — tells the user which lane the input is in */}
            {query.trim().length >= 2 && !searching && !generating && (
              <div
                className="mt-3 text-[12px] flex items-center gap-1.5 justify-center"
                style={{ color: "var(--ink-muted)" }}
              >
                {classifyIntent(query) === "ai" ? (
                  <>
                    <Sparkles className="w-3 h-3" style={{ color: "var(--gold-deep)" }} />
                    Looks like a description — Claude will propose 12 brandable names
                  </>
                ) : (
                  <>
                    <Search className="w-3 h-3" />
                    Looks like a brand stem — we&apos;ll check all 13 extensions live
                  </>
                )}
              </div>
            )}

            {/* Quick suggestions — mix of literal stems and descriptions so the
                user discovers both modes without us labelling them */}
            {!hasSearched && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                {[
                  "zoobicon",
                  "stardust",
                  "ai for plumbers",
                  "minimalist coffee shop",
                  "luxury italian eyewear",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                      handleSubmit(s);
                    }}
                    className="text-[12px] transition-colors px-3 py-1 rounded-full"
                    style={{
                      color: "var(--ink-muted)",
                      border: "1px solid var(--rule)",
                      background: "var(--paper)",
                    }}
                  >
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

        {genError && (
          <div
            className="mb-6 p-4 rounded-2xl text-[14px] flex items-start gap-3"
            style={{
              border: "1px solid rgba(185,28,28,0.25)",
              background: "rgba(185,28,28,0.06)",
              color: "rgb(153, 27, 27)",
            }}
          >
            <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{genError}</span>
          </div>
        )}

        {hasSearched && mode === "literal" && (
          <>
            {isChecking && (
              <div
                className="flex items-center gap-3 text-[13px] mb-5"
                style={{ color: "var(--ink-muted)" }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking all 13 extensions against the live registry...
              </div>
            )}

            {/* Available */}
            {availableResults.length > 0 && (
              <div className="mb-6">
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-amber-400/80 mb-3 flex items-center gap-2">
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
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-amber-400" />
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
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/25"
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

            {/* No available results (but not checking) */}
            {!isChecking && availableResults.length === 0 && results.length > 0 && (
              <div className="mb-6 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] text-center">
                <div className="text-white/50 text-[14px] mb-2">
                  No available extensions found for <span className="text-white font-medium">{cleanQuery}</span>
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

        {hasSearched && mode === "ai" && (
          <>
            {generating && (
              <>
                <div
                  className="flex items-center gap-3 text-[13px] mb-5"
                  style={{ color: "var(--ink-muted)" }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating brandable names and checking availability live…
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl animate-pulse"
                      style={{
                        background: "var(--paper-elevated)",
                        border: "1px solid var(--rule)",
                      }}
                    >
                      <div
                        className="h-4 rounded w-2/3 mb-2"
                        style={{ background: "var(--rule-strong)" }}
                      />
                      <div
                        className="h-3 rounded w-full"
                        style={{ background: "var(--rule)" }}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            {!generating && generatedNames.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <p
                    className="text-[11px] uppercase tracking-widest font-semibold flex items-center gap-2"
                    style={{ color: "var(--gold-deep)" }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {generatedNames.length} ideas — availability verified live
                  </p>
                  <button
                    onClick={() => handleSubmit(query)}
                    className="text-[11px] uppercase tracking-widest font-semibold transition-colors flex items-center gap-1"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerate
                  </button>
                </div>
                <div className="space-y-2.5">
                  {generatedNames.map((gn, i) => {
                    const tldsToShow = gn.availability ? Object.keys(gn.availability) : [];
                    const anyBuyable = (gn.buyableTlds?.length ?? 0) > 0;
                    return (
                      <div
                        key={i}
                        className="p-4 rounded-2xl transition-colors"
                        style={{
                          background: "var(--paper-elevated)",
                          border: anyBuyable
                            ? "1px solid var(--gold)"
                            : "1px solid var(--rule)",
                          boxShadow: anyBuyable ? "var(--shadow-1)" : "none",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[15px]" style={{ color: "var(--ink)" }}>
                              {gn.name}
                            </div>
                            {gn.tagline && (
                              <div
                                className="text-[12px] mt-0.5 leading-snug"
                                style={{ color: "var(--ink-secondary)" }}
                              >
                                {gn.tagline}
                              </div>
                            )}
                          </div>
                          {!anyBuyable && tldsToShow.length > 0 && (
                            <button
                              onClick={() => {
                                const slug = gn.name.toLowerCase().replace(/[^a-z0-9-]/g, "");
                                setQuery(slug);
                                handleSubmit(slug);
                              }}
                              className="text-[11px] uppercase tracking-widest font-semibold underline underline-offset-2 transition-colors whitespace-nowrap"
                              style={{ color: "var(--ink-muted)" }}
                            >
                              Try other TLDs
                            </button>
                          )}
                        </div>

                        {tldsToShow.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {tldsToShow.map((tld) => {
                              const a = gn.availability![tld];
                              const result: DomainResult = {
                                domain: a.domain,
                                tld,
                                available: a.available,
                                price: a.price,
                                checking: false,
                              };
                              const inCart = cart.some((c) => c.domain === a.domain);
                              if (a.available === true) {
                                return (
                                  <button
                                    key={tld}
                                    onClick={() => (inCart ? removeFromCart(a.domain) : addToCart(result))}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                                    style={{
                                      background: inCart ? "var(--ink)" : "var(--paper-elevated)",
                                      color: inCart ? "var(--paper)" : "var(--ink)",
                                      border: `1px solid ${inCart ? "var(--ink)" : "var(--gold)"}`,
                                    }}
                                  >
                                    <Check className="w-3 h-3" />.{tld}
                                    <span className="font-mono ml-1">${a.price.toFixed(2)}</span>
                                    <span className="text-[9px] uppercase tracking-wider ml-1 opacity-80">
                                      {inCart ? "Added" : "Add"}
                                    </span>
                                  </button>
                                );
                              }
                              if (a.available === false) {
                                return (
                                  <span
                                    key={tld}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
                                    style={{
                                      border: "1px solid var(--rule)",
                                      color: "var(--ink-muted)",
                                    }}
                                  >
                                    <X className="w-3 h-3" />.{tld}
                                    <span className="line-through opacity-70 ml-0.5">taken</span>
                                  </span>
                                );
                              }
                              return (
                                <span
                                  key={tld}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium"
                                  style={{
                                    border: "1px solid rgba(184, 134, 11, 0.25)",
                                    background: "rgba(184, 134, 11, 0.05)",
                                    color: "rgb(146, 64, 14)",
                                  }}
                                  title="Registry unreachable — click 'Regenerate' to retry"
                                >
                                  <RefreshCw className="w-3 h-3" />.{tld}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!generating && generatedNames.length === 0 && !genError && (
              <div
                className="p-5 rounded-2xl text-center"
                style={{
                  border: "1px solid var(--rule)",
                  background: "var(--paper-elevated)",
                  color: "var(--ink-muted)",
                }}
              >
                No names returned. Try refining your description.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── BROWSE ALL CTA ── Pre-crawled available-list, alphabetical */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        <Link
          href="/domains/available"
          className="group block rounded-3xl p-6 sm:p-8 transition-all hover:-translate-y-0.5"
          style={{
            background: "var(--paper-elevated)",
            border: "1px solid var(--rule)",
            boxShadow: "var(--shadow-1)",
          }}
        >
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <div
                className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-2"
                style={{ color: "var(--gold-deep)" }}
              >
                Pre-crawled · alphabetical
              </div>
              <div
                className="text-[20px] sm:text-[24px] font-semibold leading-tight tracking-[-0.02em]"
                style={{ color: "var(--ink)" }}
              >
                Browse every available .com, .ai, and .io.
              </div>
              <p
                className="text-[13px] mt-1.5 leading-relaxed max-w-md"
                style={{ color: "var(--ink-secondary)" }}
              >
                Filter by length, starting letter, ending letter. The crawler
                walks the registry around the clock so the list serves
                instantly — no wait, no spinner.
              </p>
            </div>
            <div
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap transition-transform group-hover:translate-x-1"
              style={{ color: "var(--ink)" }}
            >
              Open the list
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </section>

      {/* ── TLD GRID ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <h3
          className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-5 text-center"
          style={{ color: "var(--ink-muted)" }}
        >
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
            style={{ background: "var(--paper)", border: "1px solid var(--rule-strong)", boxShadow: "0 25px 60px -15px rgba(10,10,11,0.2), var(--shadow-2)" }}
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
