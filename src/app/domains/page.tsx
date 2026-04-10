"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

// NOTE: must match TLD_PRICING in /api/domains/search/route.ts — source of truth is backend.
const TLD_PRICES: Record<string, number> = {
  com: 12.99, ai: 69.99, io: 39.99, sh: 24.99, co: 29.99,
  dev: 14.99, app: 14.99, net: 13.99, org: 12.99, tech: 6.99,
  xyz: 2.99, me: 19.99, us: 9.99,
};

const DEFAULT_TLDS = ["com", "ai", "io", "sh", "co"];
// Generator mode hits the TLD list for EVERY name — keep it small to stay
// inside RDAP rate limits. Users can tick more TLDs manually if they want.
const GENERATOR_DEFAULT_TLDS = ["com", "ai", "io"];
// Max concurrent /api/domains/search calls the client will make at once.
const GEN_CLIENT_CONCURRENCY = 4;
// Haiku is asked for this many names — smaller = faster + less RDAP pressure.
const GEN_NAME_COUNT = 12;

/* ── Popular TLD showcase cards ── */
const FEATURED_TLDS = [
  { tld: "com", price: 12.99, desc: "The gold standard", color: "from-stone-500 to-stone-600", popular: true },
  { tld: "ai", price: 69.99, desc: "AI & tech brands", color: "from-stone-500 to-stone-600", popular: true },
  { tld: "io", price: 39.99, desc: "Startups & SaaS", color: "from-stone-500 to-stone-600", popular: true },
  { tld: "sh", price: 24.99, desc: "Dev tools & hosting", color: "from-stone-500 to-stone-600", popular: false },
  { tld: "dev", price: 14.99, desc: "Developer projects", color: "from-stone-500 to-stone-600", popular: false },
  { tld: "app", price: 14.99, desc: "Mobile & web apps", color: "from-stone-500 to-stone-600", popular: false },
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
  const [registering, setRegistering] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [genDescription, setGenDescription] = useState("");
  const [genStyle, setGenStyle] = useState("modern");
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<Array<{ name: string; tagline: string; domains: Array<{ domain: string; tld: string; available: boolean | null; price: number; checking: boolean }> }>>([]);
  const [autoExpandedTlds, setAutoExpandedTlds] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "NZ",
  });
  const resultsRef = useRef<HTMLDivElement>(null);
  const genResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) {
        const user = JSON.parse(raw);
        setUserEmail(user.email || "");
      }
    } catch {}
  }, []);

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

  // ─── AI Name Generator ───────────────────────────────────────────────────
  // 1. Ask Claude for ~12 brandable names
  // 2. Check availability for every name × selected TLDs — BATCHED client-side
  //    (max 4 concurrent requests) so RDAP doesn't rate-limit us into oblivion
  // 3. Stream results into state as each name resolves
  // 4. Names with ZERO available TLDs are auto-filtered out at render time
  const handleGenerate = useCallback(async () => {
    const desc = genDescription.trim();
    if (desc.length < 3 || selectedTlds.size === 0 || generating) return;

    setGenerating(true);
    setGeneratedNames([]);
    setResults([]);
    setGeneratorError(null);

    // scroll to results
    setTimeout(() => genResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);

    // Use a small TLD set for the generator to keep us under RDAP rate limits.
    // If the user has manually ticked TLDs beyond the defaults, honour them;
    // otherwise use the smaller GENERATOR_DEFAULT_TLDS list.
    const userSelection = Array.from(selectedTlds);
    const tlds = userSelection.length > 0 && userSelection.length <= GENERATOR_DEFAULT_TLDS.length + 1
      ? userSelection
      : GENERATOR_DEFAULT_TLDS.filter((t) => selectedTlds.has(t) || selectedTlds.size === 0);
    const finalTlds = tlds.length > 0 ? tlds : GENERATOR_DEFAULT_TLDS;

    // Step 1 — get names from Claude
    let names: Array<{ name: string; tagline: string }> = [];
    try {
      const res = await fetch("/api/tools/business-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, style: genStyle, count: GEN_NAME_COUNT }),
      });
      const data = await res.json();
      names = Array.isArray(data?.names) ? data.names : [];
    } catch {
      setGeneratorError("Couldn't reach the name generator. Check your connection and try again.");
      setGenerating(false);
      return;
    }

    if (names.length === 0) {
      setGeneratorError("The name generator didn't return any suggestions. Try a more specific description.");
      setGenerating(false);
      return;
    }

    // Sanitize names → dns-safe strings
    const cleaned = names
      .map((n) => ({
        name: n.name,
        tagline: n.tagline || "",
        slug: n.name.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 63),
      }))
      .filter((n) => n.slug.length >= 2);

    // Seed the UI immediately with everything in "checking" state
    setGeneratedNames(
      cleaned.map((n) => ({
        name: n.name,
        tagline: n.tagline,
        domains: finalTlds.map((tld) => ({
          domain: `${n.slug}.${tld}`,
          tld,
          available: null,
          price: TLD_PRICES[tld] || 9.99,
          checking: true,
        })),
      })),
    );

    // Step 2 — check names in batches of GEN_CLIENT_CONCURRENCY so RDAP
    // doesn't rate-limit us into returning all-null.
    const checkOne = async (n: { name: string; tagline: string; slug: string }) => {
      try {
        const r = await fetch(
          `/api/domains/search?q=${encodeURIComponent(n.slug)}&tlds=${encodeURIComponent(finalTlds.join(","))}`,
        );
        if (!r.ok) throw new Error("search failed");
        const data = await r.json();
        const apiResults: Array<{ domain: string; available: boolean | null; price: number }> = data.results || [];

        setGeneratedNames((prev) =>
          prev.map((gn) =>
            gn.name !== n.name
              ? gn
              : {
                  ...gn,
                  domains: finalTlds.map((tld) => {
                    const match = apiResults.find((x) => x.domain === `${n.slug}.${tld}`);
                    return {
                      domain: `${n.slug}.${tld}`,
                      tld,
                      available: match ? match.available : null,
                      price: match?.price ?? TLD_PRICES[tld] ?? 9.99,
                      checking: false,
                    };
                  }),
                },
          ),
        );
      } catch {
        setGeneratedNames((prev) =>
          prev.map((gn) =>
            gn.name !== n.name
              ? gn
              : { ...gn, domains: gn.domains.map((d) => ({ ...d, checking: false, available: null })) },
          ),
        );
      }
    };

    // Run GEN_CLIENT_CONCURRENCY workers pulling from a shared queue
    const queue = [...cleaned];
    await Promise.all(
      Array.from({ length: Math.min(GEN_CLIENT_CONCURRENCY, queue.length) }, async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) return;
          await checkOne(next);
        }
      }),
    );

    setGenerating(false);
  }, [genDescription, genStyle, selectedTlds, generating]);

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

    setSearchError(null);
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
        const errBody = await res.json().catch(() => ({}));
        setSearchError(errBody.error || `Search failed (HTTP ${res.status}). Please try again.`);
        setResults(initial.map(r => ({ ...r, checking: false })));
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Network error. Check your connection and try again.");
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

  const handleRegister = () => {
    if (cart.length === 0) return;
    // Pre-fill email from logged-in user
    if (userEmail && !contactInfo.email) {
      setContactInfo(prev => ({ ...prev, email: userEmail }));
    }
    setShowCheckoutForm(true);
  };

  const handleSubmitRegistration = async () => {
    // Validate required fields
    if (!contactInfo.firstName || !contactInfo.lastName || !contactInfo.email) {
      alert("Please fill in at least your name and email.");
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
            const name = parts.join(".");
            return { name, tld };
          }),
          registrant: contactInfo,
          years: 1,
        }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.success) {
        alert("Domains registered successfully! View them in your dashboard.");
        setCart([]);
        setShowCheckoutForm(false);
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

  const availableResults = results.filter(r => r.available === true);
  const takenResults = results.filter(r => r.available === false);
  const unknownResults = results.filter(r => r.available === null && !r.checking);
  const cartTotal = cart.reduce((sum, c) => sum + c.price, 0);

  return (
    <div className="min-h-screen bg-[#0b0b16] text-white">

      {/* ═══════════════════════════════════════════ */}
      {/* CHECKOUT FORM MODAL                        */}
      {/* ═══════════════════════════════════════════ */}
      {showCheckoutForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131520] border border-slate-700/50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Domain Registration</h2>
              <button onClick={() => setShowCheckoutForm(false)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            {/* Cart summary */}
            <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
              <p className="text-sm text-slate-400 mb-2">{cart.length} domain{cart.length > 1 ? "s" : ""}</p>
              {cart.map(c => (
                <div key={c.domain} className="flex justify-between text-sm py-1">
                  <span className="text-white font-medium">{c.domain}</span>
                  <span className="text-stone-400">${c.price.toFixed(2)}/yr</span>
                </div>
              ))}
              <div className="flex justify-between mt-2 pt-2 border-t border-slate-700/30 font-bold">
                <span>Total</span>
                <span className="text-stone-400">${cartTotal.toFixed(2)}/yr</span>
              </div>
            </div>

            {/* Contact info form */}
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Required for domain registration (ICANN policy).</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">First Name *</label>
                  <input type="text" value={contactInfo.firstName} onChange={e => setContactInfo(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent" placeholder="Craig" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Last Name *</label>
                  <input type="text" value={contactInfo.lastName} onChange={e => setContactInfo(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent" placeholder="Smith" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email *</label>
                <input type="email" value={contactInfo.email} onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Phone *</label>
                <input type="tel" value={contactInfo.phone} onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent" placeholder="+64.211234567" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Street Address *</label>
                <input type="text" value={contactInfo.address} onChange={e => setContactInfo(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent" placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">City *</label>
                  <input type="text" value={contactInfo.city} onChange={e => setContactInfo(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent" placeholder="Auckland" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">State/Region</label>
                  <input type="text" value={contactInfo.state} onChange={e => setContactInfo(p => ({ ...p, state: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent" placeholder="Auckland" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Postal Code *</label>
                  <input type="text" value={contactInfo.zip} onChange={e => setContactInfo(p => ({ ...p, zip: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent" placeholder="1010" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Country *</label>
                  <select value={contactInfo.country} onChange={e => setContactInfo(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent">
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
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500 mt-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <span>WHOIS privacy protection is included free. Your contact details are kept private.</span>
              </div>

              <button
                onClick={handleSubmitRegistration}
                disabled={registering || !contactInfo.firstName || !contactInfo.lastName || !contactInfo.email}
                className="w-full py-3.5 mt-2 bg-stone-600 hover:bg-stone-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
              >
                {registering ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <>Pay ${cartTotal.toFixed(2)} &amp; Register</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* HERO — Big, bright, impossible to miss     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        {/* Gradient background — lighter than the rest of the site */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-[#0b0b16] to-[#0b0b16]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-stone-500/[0.07] rounded-full blur-[120px]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-500/10 border border-stone-500/20 text-stone-400 text-sm font-medium mb-8">
            <BadgeCheck className="w-4 h-4" />
            Real-time registry checks — powered by Tucows/OpenSRS
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Find your perfect{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-400 via-stone-400 to-stone-400">
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
                  ? "bg-stone-600 text-white shadow-lg shadow-stone-500/20"
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
                  ? "bg-gradient-to-r from-stone-600 to-stone-600 text-white shadow-lg shadow-stone-500/20"
                  : "bg-white/[0.06] text-slate-400 hover:text-white border border-white/[0.08]"
              }`}
            >
              <Wand2 className="w-4 h-4" /> AI Name Generator
            </button>
          </div>

          {/* ── SEARCH MODE ── */}
          {mode === "search" && (
            <div className="bg-white/[0.06] backdrop-blur-sm border border-white/[0.10] rounded-3xl p-6 md:p-8 text-left max-w-3xl mx-auto shadow-2xl shadow-stone-500/[0.05]">
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Type your domain name..."
                    className="w-full pl-12 pr-5 py-4 bg-white/[0.06] border border-white/[0.10] rounded-2xl text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-shadow"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching || !name.trim() || selectedTlds.size === 0}
                  className="px-8 py-4 bg-stone-600 hover:bg-stone-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-stone-500/25 shrink-0"
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
                        ? "bg-stone-600 text-white shadow-md shadow-stone-500/20"
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
                      className="mr-3 text-sm text-stone-400 hover:text-stone-300 transition-colors"
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
            <div className="bg-white/[0.06] backdrop-blur-sm border border-stone-500/[0.15] rounded-3xl p-6 md:p-8 text-left max-w-3xl mx-auto shadow-2xl shadow-stone-500/[0.05]">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-300 mb-2">Describe your business or idea</label>
                <textarea
                  value={genDescription}
                  onChange={(e) => setGenDescription(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerate(); } }}
                  placeholder="e.g. AI-powered accounting software for freelancers, sustainable fashion brand for millennials, premium coffee subscription service..."
                  rows={3}
                  className="w-full px-5 py-4 bg-white/[0.06] border border-white/[0.10] rounded-2xl text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-shadow resize-none"
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
                          ? "bg-stone-600 text-white shadow-md shadow-stone-500/20"
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
                          ? "bg-stone-600 text-white shadow-md shadow-stone-500/20"
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
                className="w-full py-4 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-stone-500/20"
              >
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Generating names...</>
                ) : (
                  <><Wand2 className="w-5 h-5" /> Generate {GEN_NAME_COUNT} Name Ideas</>
                )}
              </button>

              {generatorError && (
                <div className="mt-4 p-3 rounded-xl border border-stone-500/20 bg-stone-500/[0.05] text-sm text-stone-300">
                  {generatorError}
                </div>
              )}
            </div>
          )}

          {/* Quick trust stats */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 mt-10 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-stone-400" />
              <span>13 extensions</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-stone-400" />
              <span>Free WHOIS privacy</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-400" />
              <span>Free SSL included</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-stone-400" />
              <span>Instant activation</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* RESULTS SECTION                             */}
      {/* ═══════════════════════════════════════════ */}
      <div ref={resultsRef} />
      {(searchError || checkoutError) && (
        <div className="max-w-4xl mx-auto px-6 -mt-4 mb-6">
          <div className="rounded-xl border border-stone-500/30 bg-stone-500/10 px-4 py-3 text-sm text-stone-300">
            {searchError || checkoutError}
          </div>
        </div>
      )}
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
                <div className="rounded-2xl border border-stone-500/20 bg-stone-500/[0.05] p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-stone-500/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-7 h-7 text-stone-400" />
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
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-xl font-bold text-base transition-all shadow-lg shadow-stone-500/20"
                    >
                      <Wand2 className="w-5 h-5" /> Generate Available Alternatives
                    </button>
                  )}
                </div>
              )}

              {/* Auto-generating alternatives */}
              {autoGenerating && (
                <div className="rounded-2xl border border-stone-500/20 bg-stone-500/[0.05] p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-stone-500/10 flex items-center justify-center mx-auto mb-4">
                    <Wand2 className="w-7 h-7 text-stone-400" />
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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-xl font-bold text-base transition-all shadow-lg shadow-stone-500/20"
                  >
                    <Wand2 className="w-5 h-5" /> Find Available Alternatives
                  </button>
                </div>
              )}

              {/* Available — bright green — ONLY show available domains */}
              {availableResults.map(r => (
                <div key={r.domain} className="flex items-center justify-between p-5 rounded-2xl bg-stone-500/[0.08] border border-stone-500/20 hover:border-stone-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-stone-400" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-white">{r.domain}</span>
                      <span className="block text-sm text-stone-400">Available</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xl font-bold text-white">${r.price}</span>
                      <span className="text-sm text-slate-400">/yr</span>
                    </div>
                    {cart.some(c => c.domain === r.domain) ? (
                      <button onClick={() => removeFromCart(r.domain)} className="px-5 py-2.5 rounded-xl bg-stone-600/20 text-stone-300 text-sm font-semibold flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Added
                      </button>
                    ) : (
                      <button onClick={() => addToCart(r)} className="px-5 py-2.5 rounded-xl bg-stone-600 hover:bg-stone-500 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-stone-500/20">
                        <Plus className="w-4 h-4" /> Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="bg-stone-500/[0.06] border border-stone-500/20 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-stone-400" />
                    Your domains ({cart.length})
                  </h2>
                  <span className="text-2xl font-black text-stone-400">${cartTotal.toFixed(2)}<span className="text-sm font-normal text-slate-400">/yr</span></span>
                </div>
                <div className="space-y-2 mb-5">
                  {cart.map(item => (
                    <div key={item.domain} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                      <span className="text-base font-medium">{item.domain}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">${item.price}/yr</span>
                        <button onClick={() => removeFromCart(item.domain)} className="text-stone-400/60 hover:text-stone-400 transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-4 bg-stone-600 hover:bg-stone-500 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-stone-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registering ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Proceed to Registration"}
                </button>
                {checkoutError && <p className="text-center text-sm text-stone-400 mt-2">{checkoutError}</p>}
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
                <Wand2 className="w-5 h-5 text-stone-400" />
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
                onClick={handleGenerate}
                disabled={generating}
                className="text-sm text-stone-400 hover:text-stone-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} /> Regenerate
              </button>
            </div>

            {/* Rate-limited / network failure banner */}
            {(() => {
              const stillChecking = generatedNames.some((gn) => gn.domains.some((d) => d.checking));
              const allUnknown = !stillChecking && generatedNames.every((gn) => gn.domains.every((d) => d.available === null));
              if (!allUnknown || generating) return null;
              return (
                <div className="rounded-2xl border border-stone-500/20 bg-stone-500/[0.05] p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-500/10 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-stone-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white mb-1">Couldn&apos;t check availability</h3>
                      <p className="text-sm text-slate-400 mb-3">
                        The registry rate-limited or timed out for every name. This usually clears in a few seconds.
                      </p>
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-600/20 hover:bg-stone-600/30 border border-stone-500/30 text-stone-300 text-sm font-semibold transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Try again
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

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
                        ? "border-stone-500/20 bg-stone-500/[0.04]"
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
                        <span className="text-xs px-2.5 py-1 rounded-full bg-stone-500/20 text-stone-400 font-semibold shrink-0">
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
                              : "bg-stone-500/[0.06] border border-stone-500/15"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {d.checking ? (
                              <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 text-stone-400" />
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
                                  className="px-4 py-2 rounded-lg bg-stone-600/20 text-stone-300 text-sm font-semibold flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" /> In Cart
                                </button>
                              ) : (
                                <button
                                  onClick={() => addToCart(d)}
                                  className="px-4 py-2 rounded-lg bg-stone-600 hover:bg-stone-500 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-stone-500/20"
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
                        className="w-full py-2.5 rounded-xl border border-stone-500/20 text-stone-400 text-sm font-semibold hover:bg-stone-500/[0.06] transition-colors flex items-center justify-center gap-2"
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
                <div className="rounded-2xl border border-stone-500/20 bg-stone-500/[0.05] p-6 text-center">
                  <Sparkles className="w-8 h-8 text-stone-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold mb-2">All names are taken</h3>
                  <p className="text-sm text-slate-400 mb-4">Try a different description or style to find more options.</p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 rounded-xl font-bold transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} /> Generate More Names
                  </button>
                </div>
              )}
            </div>

            {/* Cart (shared with search results) */}
            {cart.length > 0 && (
              <div className="bg-stone-500/[0.06] border border-stone-500/20 rounded-2xl p-6 mt-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-stone-400" />
                    Your domains ({cart.length})
                  </h2>
                  <span className="text-2xl font-black text-stone-400">${cartTotal.toFixed(2)}<span className="text-sm font-normal text-slate-400">/yr</span></span>
                </div>
                <div className="space-y-2 mb-5">
                  {cart.map(item => (
                    <div key={item.domain} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                      <span className="text-base font-medium">{item.domain}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">${item.price}/yr</span>
                        <button onClick={() => removeFromCart(item.domain)} className="text-stone-400/60 hover:text-stone-400 transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-4 bg-stone-600 hover:bg-stone-500 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-stone-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registering ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Proceed to Registration"}
                </button>
                {checkoutError && <p className="text-center text-sm text-stone-400 mt-2">{checkoutError}</p>}
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
                  <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-stone-500/20 text-stone-300 font-semibold">
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
                <div className="mt-3 text-xs text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Search .{t.tld} domains <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => { setSelectedTlds(new Set(allTlds)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-sm text-stone-400 hover:text-stone-300 transition-colors"
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
                  <div className="w-11 h-11 rounded-xl bg-stone-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-stone-400" />
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
              <div className="text-sm font-bold text-stone-400 text-center">Zoobicon</div>
              <div className="text-sm font-semibold text-slate-500 text-center">GoDaddy</div>
              <div className="text-sm font-semibold text-slate-500 text-center">Namecheap</div>
            </div>
            <button
              onClick={handleRegister}
              disabled={registering}
              className="w-full py-3 bg-stone-600 hover:bg-stone-500 rounded-xl font-semibold text-base transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {registering ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : "Proceed to Registration"}
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d1a]/95 backdrop-blur-xl border-t border-stone-500/20 shadow-2xl shadow-black/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-stone-500/20 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-5 h-5 text-stone-400" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-white">{cart.length} domain{cart.length > 1 ? "s" : ""}</span>
                <span className="text-xs text-slate-400 block truncate">
                  {cart.map(c => c.domain).join(", ")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-xl font-black text-stone-400">
                ${cartTotal.toFixed(2)}<span className="text-xs font-normal text-slate-400">/yr</span>
              </span>
              <button
                onClick={handleRegister}
                disabled={registering}
                className="px-6 py-3 bg-stone-600 hover:bg-stone-500 rounded-xl font-bold text-base transition-colors shadow-lg shadow-stone-500/25 disabled:opacity-50 flex items-center gap-2"
              >
                {registering ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><Lock className="w-4 h-4" /> Register Now</>
                )}
              </button>
            </div>
          </div>
          {checkoutError && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-2">
              <p className="text-center text-sm text-stone-400">{checkoutError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
