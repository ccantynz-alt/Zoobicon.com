"use client";

import { useState } from "react";
import {
  Search,
  Check,
  X,
  Loader2,
  Sparkles,
  Globe,
  Copy,
} from "lucide-react";

interface DomainResult {
  domain: string;
  available: boolean | null;
  checking: boolean;
  error?: string;
}

// AI-generated name suggestions for accounting/automation/AI software
const ACCOUNTING_AI_KEYWORDS = [
  // Core concepts
  "ledger", "audit", "fiscal", "tally", "debit", "credit", "balance",
  "margin", "equity", "asset", "capital", "yield", "profit", "revenue",
  // AI/Tech modifiers
  "auto", "smart", "neural", "quantum", "flux", "sync", "pulse", "wave",
  "bolt", "spark", "apex", "peak", "prime", "core", "nexus", "vertex",
  // Combinations
  "autoledger", "smartaudit", "ailedger", "neuralbooks", "fiscalai",
  "tallybot", "debitflow", "creditpulse", "balanceai", "marginsync",
  "equityflux", "assetprime", "capitalwave", "yieldai", "profitpulse",
  "revenuebolt", "auditbot", "ledgerspark", "bookkeeperai", "taxflow",
  "financecore", "accountai", "numbersai", "booksync", "payrollpulse",
  "invoiceai", "expensebot", "budgetai", "cashflowai", "finbolt",
  "quickledger", "autobooks", "smarttally", "aicounting", "countbot",
  "pennypulse", "centflow", "dollarwave", "fundflux", "wealthsync",
  "vaultai", "safekeep", "trustledger", "clearbooks", "truecount",
];

const TLDS = [".ai", ".com", ".io", ".app", ".co", ".sh", ".dev", ".tech"];

export default function DomainFinderPage() {
  const [keyword, setKeyword] = useState("accounting ai automation");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState("");

  const generateDomainIdeas = (input: string): string[] => {
    const words = input.toLowerCase().split(/\s+/).filter(Boolean);
    const ideas: string[] = [];

    // Direct combinations
    for (const tld of TLDS) {
      // Full phrase joined
      ideas.push(words.join("") + tld);
      ideas.push(words.join("-") + tld);
      // First + last word
      if (words.length > 1) {
        ideas.push(words[0] + words[words.length - 1] + tld);
      }
      // Each word solo
      for (const w of words) {
        if (w.length >= 3) ideas.push(w + tld);
      }
    }

    // AI-powered combinations from keyword bank
    const relevantKeywords = ACCOUNTING_AI_KEYWORDS.filter(kw =>
      words.some(w => kw.includes(w) || w.includes(kw.slice(0, 4)))
    );

    for (const kw of relevantKeywords.slice(0, 15)) {
      for (const tld of TLDS.slice(0, 3)) { // .ai, .com, .io
        ideas.push(kw + tld);
      }
    }

    // Creative combinations
    const prefixes = ["get", "use", "try", "go", "my", "the", "hey", "run"];
    const suffixes = ["hq", "app", "hub", "lab", "pro", "now", "io"];

    for (const w of words.slice(0, 2)) {
      for (const p of prefixes.slice(0, 3)) {
        ideas.push(p + w + ".ai");
        ideas.push(p + w + ".com");
      }
      for (const s of suffixes.slice(0, 3)) {
        ideas.push(w + s + ".ai");
        ideas.push(w + s + ".com");
      }
    }

    // Deduplicate and limit
    return [...new Set(ideas)].slice(0, 50);
  };

  const checkAvailability = async (domain: string): Promise<boolean | null> => {
    try {
      // Extract name and tld from full domain string (e.g. "mybiz.ai" -> q=mybiz, tlds=ai)
      const dotIdx = domain.lastIndexOf(".");
      if (dotIdx < 1) return null;
      const name = domain.slice(0, dotIdx);
      const tld = domain.slice(dotIdx + 1);

      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(name)}&tlds=${encodeURIComponent(tld)}`);
      if (!res.ok) return null;
      const data = await res.json();

      // The API returns { results: [{ domain, available, ... }] }
      const match = data.results?.find((r: { domain: string }) => r.domain === domain);
      if (match) return match.available;
      return null;
    } catch {
      return null; // Can't determine
    }
  };

  const handleSearch = async () => {
    setChecking(true);
    const domains = generateDomainIdeas(keyword);

    // Initialize all as checking
    setResults(domains.map(d => ({ domain: d, available: null, checking: true })));

    // Group domains by base name so we can batch TLDs into a single API call
    // e.g. { "mybiz": ["ai", "com", "io"], "getmybiz": ["ai", "com"] }
    const grouped = new Map<string, string[]>();
    for (const d of domains) {
      const dotIdx = d.lastIndexOf(".");
      if (dotIdx < 1) continue;
      const name = d.slice(0, dotIdx);
      const tld = d.slice(dotIdx + 1);
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name)!.push(tld);
    }

    // Process groups in batches of 3 (each group can have multiple TLDs)
    const groups = Array.from(grouped.entries());
    for (let i = 0; i < groups.length; i += 3) {
      const batch = groups.slice(i, i + 3);
      const batchPromises = batch.map(async ([name, tlds]) => {
        try {
          const res = await fetch(
            `/api/domains/search?q=${encodeURIComponent(name)}&tlds=${encodeURIComponent(tlds.join(","))}`,
          );
          if (!res.ok) return tlds.map(tld => ({ domain: `${name}.${tld}`, available: null as boolean | null, checking: false }));
          const data = await res.json();
          return (data.results || []).map((r: { domain: string; available: boolean | null }) => ({
            domain: r.domain,
            available: r.available,
            checking: false,
          }));
        } catch {
          return tlds.map(tld => ({ domain: `${name}.${tld}`, available: null as boolean | null, checking: false }));
        }
      });

      const batchResults = (await Promise.all(batchPromises)).flat();

      setResults(prev =>
        prev.map(r => {
          const updated = batchResults.find((br: { domain: string }) => br.domain === r.domain);
          return updated || r;
        })
      );
    }

    setChecking(false);
  };

  const copyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopied(domain);
    setTimeout(() => setCopied(""), 2000);
  };

  const availableCount = results.filter(r => r.available === true).length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-indigo-400" />
            AI Domain Finder
          </h1>
          <p className="text-slate-400">Describe your business and find available domains instantly.</p>
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., accounting ai automation software"
            className="flex-1 px-4 py-3 bg-[#1e293b] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={checking || !keyword.trim()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Find Domains
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {checking ? "Checking..." : `${availableCount} available domains found`}
              </h2>
              <span className="text-sm text-slate-400">{results.length} checked</span>
            </div>

            {/* Available first */}
            <div className="space-y-2">
              {results
                .sort((a, b) => {
                  if (a.available === true && b.available !== true) return -1;
                  if (a.available !== true && b.available === true) return 1;
                  return 0;
                })
                .map((r) => (
                  <div
                    key={r.domain}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      r.available === true
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : r.available === false
                        ? "bg-white/[0.02] border-white/5 opacity-50"
                        : "bg-white/[0.02] border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {r.checking ? (
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      ) : r.available === true ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : r.available === false ? (
                        <X className="w-4 h-4 text-red-400/50" />
                      ) : (
                        <Globe className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className={`font-mono text-sm ${r.available === true ? "text-emerald-300 font-semibold" : "text-slate-400"}`}>
                        {r.domain}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {r.checking ? "checking..." : r.available === true ? "AVAILABLE" : r.available === false ? "taken" : "unknown"}
                      </span>
                      {r.available === true && (
                        <button
                          onClick={() => copyDomain(r.domain)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          title="Copy domain"
                        >
                          {copied === r.domain ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* Help text */}
        {results.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Enter keywords describing your business to find available .ai, .com, .io domains</p>
            <p className="text-sm mt-2">Checks 50 domain combinations across 8 TLDs</p>
          </div>
        )}
      </div>
    </div>
  );
}
