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
// The AI is asked for this many names. 24 gives enough headroom that a
// handful will land on a free .com even when most are taken — .com is
// saturated, so 12 names meant ~zero available results for common themes.
const GEN_NAME_COUNT = 24;

/* ── Popular TLD showcase cards ── */
const FEATURED_TLDS = [
  { tld: "com", price: 12.99, desc: "The gold standard", color: "from-blue-500 to-blue-600", popular: true },
  { tld: "ai", price: 69.99, desc: "AI & tech brands", color: "from-purple-500 to-violet-600", popular: true },
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
  const [registering, setRegistering] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<Array<{ name: string; tagline: string; domains: Array<{ domain: string; tld: string; available: boolean | null; price: number; checking: boolean }> }>>([]);
  const [autoExpandedTlds, setAutoExpandedTlds] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [genDescription, setGenDescription] = useState("");
  const [genStyle, setGenStyle] = useState<string>("modern");
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [generatorError, setGeneratorError] = useState<string | null>(null);
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
      const res = await fetch(
        `/api/domains/search?q=${encodeURIComponent(searchName)}&tlds=${encodeURIComponent(tlds.join(","))}`,
        { signal: AbortSignal.timeout(12000) },
      );
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

  // Reset AI-generator context (themes, exclusions, refinement) when the user
  // edits the description — those only make sense for the current prompt.
  useEffect(() => {
    setGenThemes([]);
    setGenExclusions([]);
    setGenRefinement("");
    setGenIndustry(null);
    setGenRecommendedTlds([]);
  }, [genDescription]);

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
  const handleGenerate = useCallback(async (opts?: { refinement?: string; addToExclusions?: string[] }) => {
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
    let apiError: string | null = null;
    try {
      const res = await fetch("/api/tools/business-names", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, style: genStyle, count: GEN_NAME_COUNT }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        apiError = (data && typeof data.error === "string" ? data.error : `Name generator returned ${res.status}.`);
      } else {
        names = Array.isArray(data?.names) ? data.names : [];
        if (data?.meta?.themesDetected) setGenThemes(data.meta.themesDetected);
        if (typeof data?.meta?.industryDetected === "string") setGenIndustry(data.meta.industryDetected);
        else setGenIndustry(null);
        if (Array.isArray(data?.meta?.recommendedTlds)) setGenRecommendedTlds(data.meta.recommendedTlds);
        else setGenRecommendedTlds([]);
      }
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
  }, [genDescription, genStyle, selectedTlds, generating, genExclusions, genRefinement]);

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
      const res = await fetch(
        `/api/domains/search?q=${encodeURIComponent(cleanName)}&tlds=${encodeURIComponent(tlds.join(","))}`,
        { signal: AbortSignal.timeout(12000) },
      );
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
    <div className="min-h-screen bg-[#050508] text-white fs-grain pt-[72px]">

      {/* ═══════════════════════════════════════════ */}
      {/* CHECKOUT FORM MODAL                        */}
      {/* ═══════════════════════════════════════════ */}
      {showCheckoutForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div
            className="rounded-[28px] border border-white/[0.08] w-full max-w-lg max-h-[90vh] overflow-y-auto p-7 sm:p-8 backdrop-blur-xl"
            style={{
              background: "linear-gradient(135deg, rgba(17,17,24,0.95) 0%, rgba(10,10,15,0.92) 100%)",
              boxShadow: "0 1px 0 rgba(255,255,255,0.05) inset, 0 50px 120px -40px rgba(0,0,0,0.8), 0 30px 80px -30px rgba(232,212,176,0.2)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/75 mb-1">Checkout</div>
                <h2 className="text-[22px] font-semibold text-white tracking-[-0.02em]">Domain registration</h2>
              </div>
              <button
                onClick={() => setShowCheckoutForm(false)}
                className="text-white/40 hover:text-white text-2xl leading-none transition-colors"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Cart summary */}
            <div
              className="mb-6 p-5 rounded-[20px] border border-[#E8D4B0]/15"
              style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.04) 0%, rgba(17,17,24,0.6) 100%)" }}
            >
              <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#E8D4B0]/75 mb-2">{cart.length} domain{cart.length > 1 ? "s" : ""}</p>
              {cart.map(c => (
                <div key={c.domain} className="flex justify-between text-[13px] py-1">
                  <span className="text-white font-medium">{c.domain}</span>
                  <span className="text-white/60 font-mono">${c.price.toFixed(2)}/yr</span>
                </div>
              ))}
              <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.06] text-[14px]">
                <span className="text-white/60">Total</span>
                <span className="text-[#E8D4B0] font-semibold">${cartTotal.toFixed(2)}/yr</span>
              </div>
            </div>

            {/* Contact info form */}
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
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Phone *</label>
                <input type="tel" value={contactInfo.phone} onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="+64.211234567" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Street address *</label>
                <input type="text" value={contactInfo.address} onChange={e => setContactInfo(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="123 Main Street" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">City *</label>
                  <input type="text" value={contactInfo.city} onChange={e => setContactInfo(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="Auckland" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">State / Region</label>
                  <input type="text" value={contactInfo.state} onChange={e => setContactInfo(p => ({ ...p, state: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="Auckland" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Postal code *</label>
                  <input type="text" value={contactInfo.zip} onChange={e => setContactInfo(p => ({ ...p, zip: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] placeholder-white/25 focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all" placeholder="1010" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55 mb-1.5">Country *</label>
                  <select value={contactInfo.country} onChange={e => setContactInfo(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white text-[13px] focus:outline-none focus:border-[#E8D4B0]/40 focus:bg-white/[0.05] transition-all">
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

              <div className="flex items-start gap-2 text-[11px] text-white/40 mt-2">
                <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[#E8D4B0]/80" />
                <span>WHOIS privacy protection is included free. Your contact details are kept private.</span>
              </div>

              <button
                onClick={handleSubmitRegistration}
                disabled={registering || !contactInfo.firstName || !contactInfo.lastName || !contactInfo.email}
                className="w-full py-3.5 mt-3 rounded-2xl font-semibold text-[14px] transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                  color: "#0a0a0f",
                  boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                }}
              >
                {registering ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <>Pay ${cartTotal.toFixed(2)} &amp; register</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* HERO — Cinematic, editorial, Filmora-tier  */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        {/* Cinematic ambient glow — warm cream + pink orbs */}
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
          {/* Advanced AI Search announcement — flagship feature surface */}
          <Link
            href="/domains/ai-search"
            className="group inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/30 bg-gradient-to-r from-[#E8D4B0]/[0.06] via-[#E08BB0]/[0.05] to-[#E8D4B0]/[0.06] px-4 py-1.5 text-[11px] font-medium text-white/90 mb-5 hover:border-[#E8D4B0]/60 hover:text-white transition-all"
          >
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#E8D4B0] shadow-[0_0_12px_2px_rgba(232,212,176,0.6)]" />
            <span className="font-semibold tracking-widest uppercase text-[#E8D4B0]">New</span>
            <span className="text-white/60">·</span>
            <span>Advanced AI Search — trademark &amp; language checks built in</span>
            <ArrowRight className="w-3 h-3 text-[#E8D4B0] transition group-hover:translate-x-0.5" />
          </Link>

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-8">
            <BadgeCheck className="w-3 h-3" />
            Real-time registry checks · Tucows / OpenSRS
          </div>

          <h1 className="fs-display-xl mb-6">
            Find your perfect{" "}
            <span
              style={{
                fontFamily: "Fraunces, ui-serif, Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#E8D4B0",
              }}
            >
              domain name.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-4 leading-relaxed">
            Thirteen extensions at wholesale prices. Real registry availability.
            Free SSL, WHOIS privacy and DNS management included on every domain.
          </p>

          <p className="text-[13px] text-white/40 mb-12 font-mono">
            From <span className="text-white/80 font-semibold">$2.99/yr</span> · .com <span className="text-white/80 font-semibold">$12.99/yr</span> · .ai <span className="text-white/80 font-semibold">$79.99/yr</span>
          </p>

          {/* ── TABS: Search / Generate ── */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setMode("search")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-500 ${
                mode === "search"
                  ? "text-[#0a0a0f]"
                  : "border border-white/[0.12] bg-white/[0.03] text-white/70 backdrop-blur hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
              }`}
              style={mode === "search" ? {
                background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
              } : undefined}
            >
              <Search className="w-4 h-4" /> Search exact name
            </button>
            <button
              onClick={() => {
                setMode("generate");
                if (name.trim() && !genDescription.trim()) {
                  setGenDescription(name.trim());
                }
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-500 ${
                mode === "generate"
                  ? "text-[#0a0a0f]"
                  : "border border-white/[0.12] bg-white/[0.03] text-white/70 backdrop-blur hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
              }`}
              style={mode === "generate" ? {
                background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
              } : undefined}
            >
              <Wand2 className="w-4 h-4" /> AI name generator
            </button>
            <Link
              href="/domains/ai-search"
              className="group flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold border border-[#E8D4B0]/35 bg-gradient-to-r from-[#E8D4B0]/[0.06] via-[#E08BB0]/[0.05] to-[#E8D4B0]/[0.06] text-[#E8D4B0] backdrop-blur hover:border-[#E8D4B0]/70 hover:text-white transition-all"
              title="The flagship engine — invents original brand names, screens trademarks, checks 18 languages for bad meanings, and verifies live availability"
            >
              <Sparkles className="w-4 h-4" />
              Advanced AI Search
              <span className="inline-flex items-center rounded-full bg-[#E8D4B0]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#E8D4B0]">New</span>
            </Link>
          </div>

          {/* Plain-English explainer for whichever tab is active. Stops people
              from staring at three buttons wondering which one to press. */}
          <p className="text-[12.5px] text-white/45 mb-6 max-w-2xl mx-auto leading-relaxed">
            {mode === "search" && (
              <>
                <span className="text-white/70 font-semibold">Search exact name:</span>{" "}
                you type the name, we check registry availability across the extensions you select. Fastest path if you already know what you want.
              </>
            )}
            {mode === "generate" && (
              <>
                <span className="text-white/70 font-semibold">AI name generator:</span>{" "}
                describe your business, the AI invents {GEN_NAME_COUNT} brandable names, then checks each one against your selected extensions in real time. Best when you need ideas.
              </>
            )}
          </p>
          <p className="text-[12px] text-[#E8D4B0]/55 mb-10 max-w-2xl mx-auto leading-relaxed">
            <Sparkles className="inline w-3 h-3 -mt-0.5 mr-1" />
            <span className="text-[#E8D4B0]/75 font-semibold">Advanced AI Search</span> (the third button) runs a deeper 6-phase pipeline — trademark screening, 18-language meaning check, and availability — for a pre-vetted shortlist. Slower but pro-grade.
          </p>

          {/* ── SEARCH MODE ── */}
          {mode === "search" && (
            <div
              className="relative rounded-[28px] border border-white/[0.08] p-6 md:p-8 text-left max-w-3xl mx-auto backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 40px 120px -40px rgba(232,212,176,0.15)",
              }}
            >
              <div
                className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[260px] w-[520px] rounded-full blur-[110px]"
                style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.15), transparent 70%)" }}
                aria-hidden
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
                    disabled={searching || !name.trim() || selectedTlds.size === 0}
                    className="px-8 py-4 rounded-2xl font-semibold text-[14px] flex items-center justify-center gap-2 disabled:opacity-40 transition-all duration-500 hover:-translate-y-0.5 shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                      color: "#0a0a0f",
                      boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                    }}
                  >
                    {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    Search
                  </button>
                </div>

                {/* Extension quick-picks */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedTlds(new Set(allTlds)); setAutoExpandedTlds(true); }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest border border-[#E8D4B0]/30 bg-[#E8D4B0]/[0.04] text-[#E8D4B0] hover:border-[#E8D4B0]/60 hover:bg-[#E8D4B0]/[0.08] transition"
                  >
                    All {allTlds.length} extensions
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedTlds(new Set(["com"])); setAutoExpandedTlds(true); }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest border border-white/[0.10] bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white transition"
                  >
                    .com only
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedTlds(new Set(DEFAULT_TLDS)); setAutoExpandedTlds(true); }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest border border-white/[0.10] bg-white/[0.03] text-white/70 hover:border-white/25 hover:text-white transition"
                  >
                    Popular {DEFAULT_TLDS.length}
                  </button>
                </div>

                {/* Extension pills */}
                <div className="flex flex-wrap gap-2">
                  {allTlds.map(tld => (
                    <button
                      key={tld}
                      onClick={() => toggleTld(tld)}
                      className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-300 ${
                        selectedTlds.has(tld)
                          ? "text-[#0a0a0f]"
                          : "border border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-[#E8D4B0]/30 hover:text-[#E8D4B0]"
                      }`}
                      style={selectedTlds.has(tld) ? {
                        background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                        boxShadow: "0 8px 24px -12px rgba(232,212,176,0.4)",
                      } : undefined}
                    >
                      .{tld}
                      <span className="ml-1.5 text-[11px] opacity-70">${TLD_PRICES[tld]}</span>
                    </button>
                  ))}
                </div>

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
              </div>
            </div>
          )}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating || genDescription.trim().length < 3 || selectedTlds.size === 0}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-purple-500/20"
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
            </div>
          )}

          {/* Quick trust stats */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mt-12 text-[13px] text-white/55">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#E8D4B0]" />
              <span>13 extensions</span>
            </div>
            <span className="text-white/15">·</span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#E8D4B0]" />
              <span>Free WHOIS privacy</span>
            </div>
            <span className="text-white/15">·</span>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#E8D4B0]" />
              <span>Free SSL</span>
            </div>
            <span className="text-white/15">·</span>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#E8D4B0]" />
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
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {searchError || checkoutError}
          </div>
        </div>
      )}
      {results.length > 0 && (
        <section className="pb-20 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
                {searching ? "Checking availability..." :
                  results.some(r => r.checking)
                    ? "Checking availability..."
                    : availableResults.length > 0
                    ? `${availableResults.length} domain${availableResults.length > 1 ? "s" : ""} available`
                    : "No exact matches found"}
              </h2>
              {name && <span className="text-[12px] text-white/40 font-mono">&ldquo;{name.trim().toLowerCase()}&rdquo;</span>}
            </div>

            <div className="space-y-3 mb-8">
              {/* Checking — show while still loading */}
              {results.filter(r => r.checking).map(r => (
                <div key={r.domain} className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.05] bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                    </div>
                    <span className="text-[15px] text-white/50">{r.domain}</span>
                  </div>
                  <span className="text-[12px] text-white/30">Checking...</span>
                </div>
              ))}

              {/* No available results — suggest alternatives */}
              {!searching && !results.some(r => r.checking) && availableResults.length === 0 && results.length > 0 && !autoGenerating && (
                <div
                  className="rounded-[24px] border border-[#E8D4B0]/15 p-8 text-center backdrop-blur-xl"
                  style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.04) 0%, rgba(17,17,24,0.8) 100%)" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(232,212,176,0.12) 0%, rgba(224,139,176,0.08) 100%)",
                      boxShadow: "0 12px 30px -14px rgba(232,212,176,0.35)",
                    }}
                  >
                    <Sparkles className="w-7 h-7 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[18px] font-semibold text-white mb-2 tracking-[-0.01em]">
                    {autoExpandedTlds
                      ? `"${name.trim().toLowerCase()}" is taken across all 13 extensions`
                      : `"${name.trim().toLowerCase()}" isn't available on selected extensions`}
                  </h3>
                  <p className="text-[14px] text-white/55 mb-6 max-w-md mx-auto leading-relaxed">
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
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[14px] transition-all duration-500 hover:-translate-y-0.5"
                      style={{
                        background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                        color: "#0a0a0f",
                        boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                      }}
                    >
                      <Wand2 className="w-4 h-4" /> Generate available alternatives
                    </button>
                  )}
                </div>
              )}

              {/* Auto-generating alternatives */}
              {autoGenerating && (
                <div
                  className="rounded-[24px] border border-[#E8D4B0]/15 p-8 text-center backdrop-blur-xl"
                  style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.04) 0%, rgba(17,17,24,0.8) 100%)" }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(232,212,176,0.12) 0%, rgba(224,139,176,0.08) 100%)",
                      boxShadow: "0 12px 30px -14px rgba(232,212,176,0.35)",
                    }}
                  >
                    <Wand2 className="w-7 h-7 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[18px] font-semibold text-white mb-2 tracking-[-0.01em]">
                    &ldquo;{name.trim().toLowerCase()}&rdquo; is taken everywhere
                  </h3>
                  <p className="text-[14px] text-white/55 mb-6 max-w-md mx-auto leading-relaxed">
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
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[14px] transition-all duration-500 hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                      color: "#0a0a0f",
                      boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                    }}
                  >
                    <Wand2 className="w-4 h-4" /> Find available alternatives
                  </button>
                </div>
              )}

              {/* Available — cream accent */}
              {availableResults.map(r => (
                <div
                  key={r.domain}
                  className="group flex items-center justify-between p-5 rounded-2xl border border-[#E8D4B0]/15 transition-all duration-500 hover:border-[#E8D4B0]/30 hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.04) 0%, rgba(17,17,24,0.6) 100%)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, rgba(232,212,176,0.18) 0%, rgba(224,139,176,0.1) 100%)",
                        boxShadow: "0 8px 20px -10px rgba(232,212,176,0.4)",
                      }}
                    >
                      <Check className="w-5 h-5 text-[#E8D4B0]" />
                    </div>
                    <div>
                      <span className="text-[16px] font-semibold text-white">{r.domain}</span>
                      <span className="block text-[11px] uppercase tracking-[0.2em] text-[#E8D4B0]/75">Available</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[20px] font-semibold text-white">${r.price}</span>
                      <span className="text-[12px] text-white/40">/yr</span>
                    </div>
                    {cart.some(c => c.domain === r.domain) ? (
                      <button
                        onClick={() => removeFromCart(r.domain)}
                        className="px-5 py-2.5 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] text-[#E8D4B0] text-[13px] font-semibold flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Added
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(r)}
                        className="px-5 py-2.5 rounded-full text-[13px] font-semibold flex items-center gap-1.5 transition-all duration-500 hover:-translate-y-0.5"
                        style={{
                          background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                          color: "#0a0a0f",
                          boxShadow: "0 14px 30px -16px rgba(232,212,176,0.5)",
                        }}
                      >
                        <Plus className="w-4 h-4" /> Add to cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div
                className="rounded-[28px] border border-[#E8D4B0]/20 p-7 mb-8 backdrop-blur-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(232,212,176,0.06) 0%, rgba(17,17,24,0.85) 100%)",
                  boxShadow: "0 1px 0 rgba(232,212,176,0.1) inset, 0 32px 80px -32px rgba(232,212,176,0.3)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[18px] font-semibold text-white flex items-center gap-2 tracking-[-0.01em]">
                    <ShoppingCart className="w-5 h-5 text-[#E8D4B0]" />
                    Your domains ({cart.length})
                  </h2>
                  <span className="text-[26px] font-semibold text-white tracking-[-0.02em]">
                    ${cartTotal.toFixed(2)}
                    <span className="text-[12px] font-normal text-white/40">/yr</span>
                  </span>
                </div>
                <div className="space-y-2 mb-6">
                  {cart.map(item => (
                    <div key={item.domain} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                      <span className="text-[14px] font-medium text-white/90">{item.domain}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[13px] text-white/50 font-mono">${item.price}/yr</span>
                        <button onClick={() => removeFromCart(item.domain)} className="text-white/30 hover:text-[#E8D4B0] transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-4 rounded-2xl font-semibold text-[15px] transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                    color: "#0a0a0f",
                    boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                  }}
                >
                  {registering ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Proceed to registration"}
                </button>
                {checkoutError && <p className="text-center text-[12px] text-[#E8D4B0]/80 mt-3">{checkoutError}</p>}
                <p className="text-center text-[11px] text-white/35 mt-3">Includes free WHOIS privacy, SSL and DNS management</p>
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
                style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.03) 0%, rgba(17,17,24,0.65) 100%)" }}
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
              </div>
            )}

            {/* Detected themes + active exclusions chips */}
            {(genThemes.length > 0 || genExclusions.length > 0 || genRefinement) && (
              <div className="flex flex-wrap items-center gap-2 mb-5 text-[11px]">
                {genThemes.length > 0 && (
                  <>
                    <span className="text-white/40 uppercase tracking-[0.15em] font-semibold">AI detected</span>
                    {genThemes.map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-full border border-[#E8D4B0]/30 bg-[#E8D4B0]/[0.08] text-[#E8D4B0]">
                        {t}
                      </span>
                    ))}
                  </>
                )}
                {genRefinement && (
                  <>
                    <span className="text-white/40 uppercase tracking-[0.15em] font-semibold ml-2">refinement</span>
                    <span className="px-2.5 py-1 rounded-full border border-white/15 bg-white/[0.04] text-white/70 flex items-center gap-1.5">
                      {genRefinement}
                      <button
                        onClick={() => { setGenRefinement(""); handleGenerate({ refinement: "" }); }}
                        className="text-white/40 hover:text-white"
                        aria-label="Clear refinement"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </>
                )}
                {genExclusions.length > 0 && (
                  <>
                    <span className="text-white/40 uppercase tracking-[0.15em] font-semibold ml-2">excluding {genExclusions.length}</span>
                    <button
                      onClick={() => { setGenExclusions([]); handleGenerate(); }}
                      className="text-white/50 hover:text-white underline-offset-2 hover:underline"
                    >
                      reset exclusions
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Rate-limited / network failure banner */}
            {(() => {
              const stillChecking = generatedNames.some((gn) => gn.domains.some((d) => d.checking));
              const allUnknown = !stillChecking && generatedNames.every((gn) => gn.domains.every((d) => d.available === null));
              if (!allUnknown || generating) return null;
              return (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white mb-1">Couldn&apos;t check availability</h3>
                      <p className="text-sm text-slate-400 mb-3">
                        The registry rate-limited or timed out for every name. This usually clears in a few seconds.
                      </p>
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-sm font-semibold transition-colors"
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
                const allTaken = !stillChecking && !hasAvailable && gn.domains.every((d) => d.available === false);

                return (
                  <div
                    key={gn.name}
                    className={`rounded-[24px] border p-6 transition-all duration-500 backdrop-blur-xl ${
                      hasAvailable
                        ? "border-[#E8D4B0]/15 hover:border-[#E8D4B0]/25 hover:-translate-y-0.5"
                        : "border-white/[0.06]"
                    } ${allTaken ? "opacity-55" : ""}`}
                    style={{
                      background: hasAvailable
                        ? "linear-gradient(135deg, rgba(232,212,176,0.04) 0%, rgba(17,17,24,0.7) 100%)"
                        : "rgba(255,255,255,0.02)",
                    }}
                  >
                    {/* Name header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-[18px] font-semibold text-white tracking-[-0.01em]">{gn.name}</h3>
                        <p className="text-[13px] text-white/45 mt-0.5">{gn.tagline}</p>
                      </div>
                      {hasAvailable && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] text-[#E8D4B0] font-semibold shrink-0 uppercase tracking-[0.1em]">
                          {availableDomains.length} available
                        </span>
                      )}
                      {stillChecking && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/50 font-semibold shrink-0 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking
                        </span>
                      )}
                      {allTaken && (
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-white/45 font-semibold shrink-0 uppercase tracking-[0.1em]">
                          All TLDs taken
                        </span>
                      )}
                    </div>

                    {/* Domain results — show available + checking always.
                        For taken-only cards, show the taken TLDs too so the
                        user can SEE the registry result instead of staring at
                        an empty card (Law 8 — never hide failures silently). */}
                    <div className="space-y-2 mb-3">
                      {gn.domains
                        .filter((d) => d.checking || d.available === true || allTaken)
                        .map((d) => (
                        <div
                          key={d.domain}
                          className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                            d.checking
                              ? "bg-white/[0.02]"
                              : d.available === true
                                ? "border border-[#E8D4B0]/10 bg-[#E8D4B0]/[0.03]"
                                : "bg-white/[0.02] border border-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {d.checking ? (
                              <Loader2 className="w-4 h-4 text-white/40 animate-spin" />
                            ) : d.available === true ? (
                              <Check className="w-4 h-4 text-[#E8D4B0]" />
                            ) : (
                              <X className="w-4 h-4 text-white/30" />
                            )}
                            <span className={`text-[14px] font-medium ${d.checking || d.available === false ? "text-white/45" : "text-white"}`}>
                              {d.domain}
                            </span>
                            {d.available === false && (
                              <span className="text-[10px] uppercase tracking-[0.12em] text-white/30 font-semibold">taken</span>
                            )}
                          </div>
                          {d.available && (
                            <div className="flex items-center gap-3">
                              <span className="text-[14px] font-semibold text-white">${d.price}<span className="text-[11px] text-white/40 font-normal">/yr</span></span>
                              {cart.some((c) => c.domain === d.domain) ? (
                                <button
                                  onClick={() => removeFromCart(d.domain)}
                                  className="px-4 py-2 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] text-[#E8D4B0] text-[12px] font-semibold flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5" /> In cart
                                </button>
                              ) : (
                                <button
                                  onClick={() => addToCart(d)}
                                  className="px-4 py-2 rounded-full text-[12px] font-semibold flex items-center gap-1.5 transition-all duration-500 hover:-translate-y-0.5"
                                  style={{
                                    background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                                    color: "#0a0a0f",
                                    boxShadow: "0 10px 24px -12px rgba(232,212,176,0.5)",
                                  }}
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" /> Register
                                </button>
                              )}
                            </div>
                          )}
                          {d.checking && (
                            <span className="text-[11px] text-white/35">Checking...</span>
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
                        className="w-full py-2.5 rounded-xl border border-[#E8D4B0]/20 text-[#E8D4B0] text-[12px] font-semibold hover:bg-[#E8D4B0]/[0.04] hover:border-[#E8D4B0]/35 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add all {availableDomains.length} to cart
                      </button>
                    )}
                  </div>
                );
              })}

              {/* If all generated names are checked and none have available domains */}
              {generatedNames.length > 0 &&
                generatedNames.every((gn) => gn.domains.every((d) => !d.checking)) &&
                !generatedNames.some((gn) => gn.domains.some((d) => d.available === true)) && (
                <div
                  className="rounded-[24px] border border-[#E8D4B0]/15 p-8 text-center backdrop-blur-xl"
                  style={{ background: "linear-gradient(135deg, rgba(232,212,176,0.04) 0%, rgba(17,17,24,0.7) 100%)" }}
                >
                  <Sparkles className="w-8 h-8 text-[#E8D4B0] mx-auto mb-3" />
                  <h3 className="text-[18px] font-semibold text-white mb-2 tracking-[-0.01em]">All names are taken</h3>
                  <p className="text-[13px] text-white/55 mb-5">Try a different description or style to find more options.</p>
                  <button
                    onClick={() => handleGenerate()}
                    disabled={generating}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-[14px] transition-all duration-500 hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                      color: "#0a0a0f",
                      boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                    }}
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} /> Generate more names
                  </button>
                </div>
              )}
            </div>

            {/* Cart (shared with search results) */}
            {cart.length > 0 && (
              <div
                className="rounded-[28px] border border-[#E8D4B0]/20 p-7 mt-8 backdrop-blur-xl"
                style={{
                  background: "linear-gradient(135deg, rgba(232,212,176,0.06) 0%, rgba(17,17,24,0.85) 100%)",
                  boxShadow: "0 1px 0 rgba(232,212,176,0.1) inset, 0 32px 80px -32px rgba(232,212,176,0.3)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[18px] font-semibold text-white flex items-center gap-2 tracking-[-0.01em]">
                    <ShoppingCart className="w-5 h-5 text-[#E8D4B0]" />
                    Your domains ({cart.length})
                  </h2>
                  <span className="text-[26px] font-semibold text-white tracking-[-0.02em]">
                    ${cartTotal.toFixed(2)}
                    <span className="text-[12px] font-normal text-white/40">/yr</span>
                  </span>
                </div>
                <div className="space-y-2 mb-6">
                  {cart.map(item => (
                    <div key={item.domain} className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0">
                      <span className="text-[14px] font-medium text-white/90">{item.domain}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-[13px] text-white/50 font-mono">${item.price}/yr</span>
                        <button onClick={() => removeFromCart(item.domain)} className="text-white/30 hover:text-[#E8D4B0] transition-colors">
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-4 rounded-2xl font-semibold text-[15px] transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                    color: "#0a0a0f",
                    boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                  }}
                >
                  {registering ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Proceed to registration"}
                </button>
                {checkoutError && <p className="text-center text-[12px] text-[#E8D4B0]/80 mt-3">{checkoutError}</p>}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* FEATURED TLDs — Browse by extension         */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90">
              Wholesale pricing
            </div>
            <h2 className="fs-display-md mb-5">
              Every extension,{" "}
              <span
                style={{
                  fontFamily: "Fraunces, ui-serif, Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#E8D4B0",
                }}
              >
                at cost.
              </span>
            </h2>
            <p className="text-[15px] text-white/55 max-w-xl mx-auto leading-relaxed">
              No markup games, no bait-and-switch renewal pricing. What you see is what you pay — this year and every year.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURED_TLDS.map((t) => (
              <button
                key={t.tld}
                onClick={() => { setSelectedTlds(new Set([t.tld])); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="group relative rounded-[24px] border border-white/[0.08] p-7 text-left transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/30 backdrop-blur-xl"
                style={{ background: "linear-gradient(135deg, rgba(17,17,24,0.65) 0%, rgba(10,10,15,0.45) 100%)" }}
              >
                {t.popular && (
                  <span className="absolute top-4 right-4 text-[10px] px-2.5 py-0.5 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] text-[#E8D4B0] font-semibold uppercase tracking-[0.1em]">
                    Popular
                  </span>
                )}
                <div
                  className="text-[40px] font-semibold mb-2 tracking-[-0.03em]"
                  style={{
                    fontFamily: "Fraunces, ui-serif, Georgia, serif",
                    fontStyle: "italic",
                    fontWeight: 500,
                    color: "#E8D4B0",
                  }}
                >
                  .{t.tld}
                </div>
                <div className="text-[13px] text-white/50 mb-4">{t.desc}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[24px] font-semibold text-white tracking-[-0.02em]">${t.price}</span>
                  <span className="text-[12px] text-white/40">/year</span>
                </div>
                <div className="mt-4 text-[11px] text-[#E8D4B0]/80 uppercase tracking-[0.15em] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center gap-1 -translate-x-1 group-hover:translate-x-0">
                  Search .{t.tld} <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => { setSelectedTlds(new Set(allTlds)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-[12px] text-[#E8D4B0]/75 hover:text-[#E8D4B0] transition-colors uppercase tracking-[0.2em] font-semibold"
            >
              Search all 13 extensions at once &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* WHY ZOOBICON — Trust features                */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 px-4 sm:px-6 border-t border-white/[0.04] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div
            className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.05), transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90">
              Why Zoobicon
            </div>
            <h2 className="fs-display-md mb-5">
              Not another{" "}
              <span
                style={{
                  fontFamily: "Fraunces, ui-serif, Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#E8D4B0",
                }}
              >
                reseller.
              </span>
            </h2>
            <p className="text-[15px] text-white/55 max-w-xl mx-auto leading-relaxed">
              We connect directly to the Tucows/OpenSRS registry. Real availability, wholesale prices, everything included that others charge extra for.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRUST_FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25 backdrop-blur-xl"
                  style={{ background: "linear-gradient(135deg, rgba(17,17,24,0.65) 0%, rgba(10,10,15,0.45) 100%)" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                    style={{
                      background: "linear-gradient(135deg, rgba(232,212,176,0.12) 0%, rgba(224,139,176,0.08) 100%)",
                      boxShadow: "0 10px 24px -12px rgba(232,212,176,0.4)",
                    }}
                  >
                    <Icon className="w-5 h-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[17px] font-semibold text-white mb-2 tracking-[-0.01em]">{f.title}</h3>
                  <p className="text-[14px] text-white/55 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* PRICE COMPARISON                            */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-4 sm:px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90">
              Head-to-head
            </div>
            <h2 className="fs-display-md mb-5">
              Compare{" "}
              <span
                style={{
                  fontFamily: "Fraunces, ui-serif, Georgia, serif",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "#E8D4B0",
                }}
              >
                and save.
              </span>
            </h2>
            <p className="text-[15px] text-white/55 max-w-xl mx-auto leading-relaxed">
              We include SSL, privacy and a website builder — for free. Others charge $90+/year for the same thing.
            </p>
          </div>

          <div
            className="rounded-[28px] border border-white/[0.08] overflow-hidden backdrop-blur-xl"
            style={{ background: "linear-gradient(135deg, rgba(17,17,24,0.75) 0%, rgba(10,10,15,0.55) 100%)" }}
          >
            <div className="grid grid-cols-4 px-6 py-5 border-b border-white/[0.06]" style={{ background: "rgba(232,212,176,0.03)" }}>
              <div className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.15em]">Feature</div>
              <div className="text-[11px] font-semibold text-[#E8D4B0] text-center uppercase tracking-[0.15em]">Zoobicon</div>
              <div className="text-[11px] font-semibold text-white/40 text-center uppercase tracking-[0.15em]">GoDaddy</div>
              <div className="text-[11px] font-semibold text-white/40 text-center uppercase tracking-[0.15em]">Namecheap</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 px-6 py-4 text-[13px] ${i !== COMPARISON.length - 1 ? "border-b border-white/[0.04]" : ""}`}
              >
                <div className="text-white/75 font-medium">{row.feature}</div>
                <div className="text-center text-[#E8D4B0] font-semibold">{row.zoobicon}</div>
                <div className="text-center text-white/40">{row.godaddy}</div>
                <div className="text-center text-white/40">{row.namecheap}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
            <button
              onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                color: "#0a0a0f",
                boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
              }}
            >
              Search a domain <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              Try the AI builder
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOOTER TRUST BAR                            */}
      {/* ═══════════════════════════════════════════ */}
      <section className="border-t border-white/[0.04] py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[12px] text-white/40">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#E8D4B0]/70" />
            <span>Powered by Tucows/OpenSRS</span>
          </div>
          <span className="text-white/15">·</span>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#E8D4B0]/70" />
            <span>ICANN Accredited</span>
          </div>
          <span className="text-white/15">·</span>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#E8D4B0]/70" />
            <span>256-bit SSL</span>
          </div>
          <span className="text-white/15">·</span>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#E8D4B0]/70" />
            <span className="font-mono">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* STICKY CART BAR — always visible at bottom  */}
      {/* ═══════════════════════════════════════════ */}
      {cart.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-[#E8D4B0]/20"
          style={{
            background: "linear-gradient(180deg, rgba(10,10,15,0.92) 0%, rgba(5,5,8,0.98) 100%)",
            boxShadow: "0 -24px 60px -20px rgba(0,0,0,0.6), 0 -1px 0 rgba(232,212,176,0.12) inset",
          }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(232,212,176,0.15) 0%, rgba(224,139,176,0.08) 100%)",
                  boxShadow: "0 10px 24px -12px rgba(232,212,176,0.45)",
                }}
              >
                <ShoppingCart className="w-5 h-5 text-[#E8D4B0]" />
              </div>
              <div className="min-w-0">
                <span className="text-[14px] font-semibold text-white">{cart.length} domain{cart.length > 1 ? "s" : ""}</span>
                <span className="text-[11px] text-white/45 block truncate font-mono">
                  {cart.map(c => c.domain).join(", ")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-[22px] font-semibold text-white tracking-[-0.02em]">
                ${cartTotal.toFixed(2)}
                <span className="text-[11px] font-normal text-white/40">/yr</span>
              </span>
              <button
                onClick={handleRegister}
                disabled={registering}
                className="px-6 py-3 rounded-full font-semibold text-[14px] transition-all duration-500 hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                  color: "#0a0a0f",
                  boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                }}
              >
                {registering ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><Lock className="w-4 h-4" /> Register now</>
                )}
              </button>
            </div>
          </div>
          {checkoutError && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-2">
              <p className="text-center text-[12px] text-[#E8D4B0]/85">{checkoutError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
