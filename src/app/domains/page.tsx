"use client";

import { useState } from "react";
import { Search, Check, X, Loader2, Globe, ShoppingCart, Plus, Minus } from "lucide-react";

interface DomainResult {
  domain: string;
  tld: string;
  available: boolean | null;
  price: number;
  checking: boolean;
}

const TLD_PRICES: Record<string, number> = {
  com: 12.99, ai: 79.99, io: 39.99, sh: 24.99, co: 29.99,
  dev: 14.99, app: 14.99, net: 13.99, org: 11.99, tech: 6.99,
  xyz: 2.99, me: 8.99, us: 8.99,
};

const DEFAULT_TLDS = ["com", "ai", "io", "sh", "co"];

export default function DomainsPage() {
  const [name, setName] = useState("");
  const [selectedTlds, setSelectedTlds] = useState<Set<string>>(new Set(DEFAULT_TLDS));
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<DomainResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const allTlds = Object.keys(TLD_PRICES);

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

    // Initialize results
    const initial: DomainResult[] = tlds.map(tld => ({
      domain: `${cleanName}.${tld}`,
      tld,
      available: null,
      price: TLD_PRICES[tld] || 9.99,
      checking: true,
    }));
    setResults(initial);

    // Track search history
    if (!searchHistory.includes(cleanName)) {
      setSearchHistory(prev => [cleanName, ...prev].slice(0, 10));
    }

    // Call the API
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

  const availableResults = results.filter(r => r.available === true);
  const takenResults = results.filter(r => r.available === false);
  const unknownResults = results.filter(r => r.available === null && !r.checking);
  const cartTotal = cart.reduce((sum, c) => sum + c.price, 0);

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Find Your Domain</h1>
          <p className="text-lg text-slate-400">Enter a name and select your extensions — we check real availability instantly</p>
        </div>

        {/* Search Input */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-2">Domain name</label>
          <div className="flex gap-3 mb-5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.replace(/\s/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. mycompany"
              className="flex-1 px-5 py-4 bg-[#0a0a14] border border-white/10 rounded-xl text-white text-lg placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleSearch}
              disabled={searching || !name.trim() || selectedTlds.size === 0}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-lg flex items-center gap-2 disabled:opacity-40 transition-colors"
            >
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Search
            </button>
          </div>

          {/* Extension Selector */}
          <label className="block text-sm font-medium text-slate-400 mb-3">Select extensions to check</label>
          <div className="flex flex-wrap gap-2">
            {allTlds.map(tld => (
              <button
                key={tld}
                onClick={() => toggleTld(tld)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTlds.has(tld)
                    ? "bg-indigo-600 text-white"
                    : "bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] hover:text-slate-300"
                }`}
              >
                .{tld}
                <span className="ml-1.5 text-xs opacity-60">${TLD_PRICES[tld]}/yr</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Searches */}
        {searchHistory.length > 0 && results.length === 0 && (
          <div className="mb-6">
            <span className="text-xs text-slate-600">Recent:</span>
            {searchHistory.map(h => (
              <button
                key={h}
                onClick={() => setName(h)}
                className="ml-2 text-xs text-slate-500 hover:text-indigo-400 transition-colors"
              >
                {h}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">
                {searching ? "Checking availability..." :
                  `${availableResults.length} available, ${takenResults.length} taken`}
              </h2>
              {name && <span className="text-sm text-slate-500">Results for &ldquo;{name.trim().toLowerCase()}&rdquo;</span>}
            </div>

            {/* Available first — green */}
            {availableResults.map(r => (
              <div key={r.domain} className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span className="text-lg font-semibold text-emerald-300">{r.domain}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base text-emerald-400 font-medium">${r.price}/yr</span>
                  {cart.some(c => c.domain === r.domain) ? (
                    <button onClick={() => removeFromCart(r.domain)} className="px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-300 text-sm font-medium flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Added
                    </button>
                  ) : (
                    <button onClick={() => addToCart(r)} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center gap-1.5 transition-colors">
                      <Plus className="w-4 h-4" /> Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Taken — faded */}
            {takenResults.map(r => (
              <div key={r.domain} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400/40" />
                  <span className="text-lg text-slate-600 line-through">{r.domain}</span>
                </div>
                <span className="text-sm text-slate-600">Taken</span>
              </div>
            ))}

            {/* Checking */}
            {results.filter(r => r.checking).map(r => (
              <div key={r.domain} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                  <span className="text-lg text-slate-500">{r.domain}</span>
                </div>
                <span className="text-sm text-slate-600">Checking...</span>
              </div>
            ))}

            {/* Unknown */}
            {unknownResults.map(r => (
              <div key={r.domain} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-yellow-400/40" />
                  <span className="text-lg text-slate-500">{r.domain}</span>
                </div>
                <span className="text-sm text-slate-600">Unable to check</span>
              </div>
            ))}
          </div>
        )}

        {/* Cart */}
        {cart.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-400" />
                Cart ({cart.length})
              </h2>
              <span className="text-xl font-bold text-indigo-400">${cartTotal.toFixed(2)}/yr</span>
            </div>
            <div className="space-y-2 mb-4">
              {cart.map(item => (
                <div key={item.domain} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-base">{item.domain}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">${item.price}/yr</span>
                    <button onClick={() => removeFromCart(item.domain)} className="text-red-400/60 hover:text-red-400 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-base transition-colors">
              Proceed to Registration
            </button>
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">Type a name and select your extensions to search</p>
            <p className="text-slate-600 text-base mt-2">Powered by OpenSRS — real registry availability checks</p>
          </div>
        )}
      </div>
    </div>
  );
}
