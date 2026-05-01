"use client";

import { useState, useRef } from "react";
import {
  Search,
  Check,
  X,
  Loader2,
  Sparkles,
  Globe,
  Copy,
  ChevronDown,
  Zap,
  ArrowRight,
  Crown,
} from "lucide-react";

interface GeneratedName {
  name: string;
  slug: string;
  tagline: string;
}

interface TldResult {
  domain: string;
  available: boolean | null;
  price: number;
}

interface DomainResult {
  name: string;
  slug: string;
  tagline: string;
  comAvailable: boolean | null;
  comChecked: boolean;
  price: number | null;
  otherTlds: TldResult[];
  expandedTlds: boolean;
  checkingTlds: boolean;
}

type CountChoice = 25 | 50 | 100;
type WordCountChoice = 1 | 2 | "either";
type LengthChoice = "short" | "any";
type WordTypeChoice = "real" | "invented" | "either";

const COUNT_OPTIONS: CountChoice[] = [25, 50, 100];

// TLDs we automatically check in the background for every available .com so
// the user sees a complete picture without clicking expand. Kept short to
// avoid hammering RDAP — additional TLDs still available behind the dropdown.
const AUTO_TLDS = ["io", "ai", "dev", "app", "co"];

const EXAMPLES = [
  "AI scheduling tool for dentists",
  "sustainable fashion marketplace",
  "dog training app",
  "remote team analytics platform",
];

export default function DomainFinderPage() {
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<"idle" | "generating" | "checking" | "done">("idle");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<"available" | "all">("available");
  const [copied, setCopied] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Filters: count batch size, word count, length, real-vs-invented
  const [count, setCount] = useState<CountChoice>(25);
  const [wordCount, setWordCount] = useState<WordCountChoice>("either");
  const [length, setLength] = useState<LengthChoice>("any");
  const [wordType, setWordType] = useState<WordTypeChoice>("either");

  const abortRef = useRef<AbortController | null>(null);

  const copyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopied(domain);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleSearch = async () => {
    if (!description.trim() || phase === "generating" || phase === "checking") return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setResults([]);
    setCheckedCount(0);
    setTotalCount(0);
    setErrorMsg("");
    setFilter("available");
    setPhase("generating");

    // Step 1 — AI generates `count` brandable name ideas, shaped by filters
    let names: GeneratedName[] = [];
    try {
      // Bigger batches need longer timeout — Sonnet emits ~80 tok/sec and 100
      // names is roughly 9000 tokens of output.
      const generateTimeout = count >= 100 ? 50000 : count >= 50 ? 38000 : 28000;
      const generateSignal = abortRef.current
        ? AbortSignal.any([abortRef.current.signal, AbortSignal.timeout(generateTimeout)])
        : AbortSignal.timeout(generateTimeout);
      const res = await fetch("/api/domains/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          count,
          wordCount,
          length,
          wordType,
        }),
        signal: generateSignal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Name generation failed");
      }
      const data = await res.json();
      names = (data.names || []) as GeneratedName[];
    } catch (err) {
      const e = err as Error;
      if (e.name === "AbortError" && abortRef.current?.signal.aborted) return;
      const isTimeout = e.name === "TimeoutError" || e.name === "AbortError";
      setErrorMsg(
        isTimeout
          ? "Name generation timed out. The AI service is slow right now — please try again."
          : e.message || "Failed to generate names. Check ANTHROPIC_API_KEY.",
      );
      setPhase("idle");
      return;
    }

    if (names.length === 0) {
      setErrorMsg("No names were generated. Try a more detailed description.");
      setPhase("idle");
      return;
    }

    setTotalCount(names.length);
    setPhase("checking");

    // Seed the result list so the UI shows pending rows immediately
    setResults(
      names.map((n) => ({
        name: n.name,
        slug: n.slug,
        tagline: n.tagline,
        comAvailable: null,
        comChecked: false,
        price: null,
        otherTlds: [],
        expandedTlds: false,
        checkingTlds: false,
      })),
    );

    // Step 2 — Check .com availability for each name. Concurrency scales
    // gently with batch size so 100-name searches don't open 30 sockets at
    // once but still finish quickly.
    const CONCURRENCY = count >= 100 ? 8 : count >= 50 ? 6 : 5;
    let cursor = 0;

    const userAbortFired = () => abortRef.current?.signal.aborted === true;

    // Fire-and-forget: when a .com comes back available, kick off the
    // alt-TLD check in the background so the user gets a complete picture
    // without having to click "expand". We do NOT await this — main worker
    // continues and the row updates whenever the alt-TLD response lands.
    const fanOutAltTlds = (idx: number, slug: string) => {
      void (async () => {
        try {
          const userSignal = abortRef.current?.signal;
          const fetchSignal = userSignal
            ? AbortSignal.any([userSignal, AbortSignal.timeout(16000)])
            : AbortSignal.timeout(16000);
          const res = await fetch(
            `/api/domains/search?q=${encodeURIComponent(slug)}&tlds=${AUTO_TLDS.join(",")}`,
            { signal: fetchSignal },
          );
          if (!res.ok) return;
          const data = await res.json();
          const tlds: TldResult[] = (data.results || []).map(
            (r: { domain: string; available: boolean | null; price: number }) => ({
              domain: r.domain,
              available: r.available,
              price: r.price,
            }),
          );
          setResults((prev) =>
            prev.map((r, i) =>
              i === idx ? { ...r, otherTlds: tlds, expandedTlds: true, checkingTlds: false } : r,
            ),
          );
        } catch {
          // Silent — alt-TLD check is supplemental, not critical. The "Check
          // .io, .ai, ..." dropdown still works as a manual fallback.
        }
      })();
    };

    const worker = async () => {
      while (true) {
        const idx = cursor++;
        if (idx >= names.length) return;
        const n = names[idx];

        try {
          // Combine the user-cancellation signal with a 14s per-name timeout.
          // The /api/domains/search route caps itself at 7s of registry work
          // + Vercel maxDuration of 15s, so any fetch outliving 14s is a sign
          // the response was lost in transit and the row must be marked
          // unverified rather than spin forever.
          const userSignal = abortRef.current?.signal;
          const fetchSignal = userSignal
            ? AbortSignal.any([userSignal, AbortSignal.timeout(14000)])
            : AbortSignal.timeout(14000);
          const res = await fetch(
            `/api/domains/search?q=${encodeURIComponent(n.slug)}&tlds=com&mode=com-priority`,
            { signal: fetchSignal },
          );
          if (!res.ok) throw new Error("search failed");
          const data = await res.json();
          const comResult = (data.results || []).find(
            (r: { tld: string }) => r.tld === "com",
          ) as { available: boolean | null; price: number } | undefined;

          const comAvailable = comResult?.available ?? null;

          setResults((prev) =>
            prev.map((r, i) =>
              i === idx
                ? {
                    ...r,
                    comAvailable,
                    comChecked: true,
                    price: comResult?.price ?? null,
                    // Mark as already auto-expanding so the inline "Check more
                    // TLDs" link doesn't duplicate work.
                    checkingTlds: comAvailable === true,
                  }
                : r,
            ),
          );

          // Available .com → fan out alt-TLD check in the background.
          if (comAvailable === true) fanOutAltTlds(idx, n.slug);
        } catch (err) {
          // User cancelled the whole search — bail without flipping rows.
          if ((err as Error).name === "AbortError" && userAbortFired()) return;
          // Timeout or network error — mark row as checked-but-unverified
          // so the spinner clears and the UI shows the row in "uncertain"
          // state instead of hanging.
          setResults((prev) =>
            prev.map((r, i) => (i === idx ? { ...r, comChecked: true, comAvailable: null } : r)),
          );
        }

        setCheckedCount((prev) => prev + 1);
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, names.length) }, worker));
    setPhase("done");
  };

  const expandTlds = async (idx: number, slug: string) => {
    setResults((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, checkingTlds: true, expandedTlds: true } : r)),
    );
    try {
      const res = await fetch(
        `/api/domains/search?q=${encodeURIComponent(slug)}&tlds=io,ai,dev,app,co`,
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const tlds: TldResult[] = (data.results || []).map(
        (r: { domain: string; available: boolean | null; price: number }) => ({
          domain: r.domain,
          available: r.available,
          price: r.price,
        }),
      );
      setResults((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, checkingTlds: false, otherTlds: tlds } : r,
        ),
      );
    } catch {
      setResults((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, checkingTlds: false } : r)),
      );
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    const score = (r: DomainResult) =>
      r.comAvailable === true ? 0 : !r.comChecked ? 1 : 2;
    return score(a) - score(b);
  });

  const visibleResults =
    filter === "available"
      ? sortedResults.filter((r) => r.comAvailable === true || !r.comChecked)
      : sortedResults;

  const availableCount = results.filter((r) => r.comAvailable === true).length;
  const verifiedCount = results.filter((r) => r.comChecked && r.comAvailable !== null).length;
  const checkedAll = results.length > 0 && results.every((r) => r.comChecked);
  const isRunning = phase === "generating" || phase === "checking";
  // If we finished checking but every single .com came back null the
  // registry was unreachable — surface a clear retry path instead of an
  // empty "0 available" state that hides the real problem.
  const allUnverified = checkedAll && results.length > 0 && verifiedCount === 0;

  return (
    <div className="relative z-10 min-h-screen bg-[#0a0f1e] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden pb-12 pt-32 md:pt-36 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-600/15 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-violet-300 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Domain Discovery
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Find your perfect{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              .com domain
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Describe your business and AI generates up to 100 brandable names — then we
            instantly check which .com domains are actually available.
          </p>

          {/* Search input */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g., AI scheduling tool for dentists"
              className="flex-1 px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={!description.trim() || isRunning}
              className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all whitespace-nowrap"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Find Domains
                </>
              )}
            </button>
          </div>

          {/* Filter chips — count, word count, length, real vs invented */}
          <div className="mt-5 flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold pr-1">Show</span>
              {COUNT_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  disabled={isRunning}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    count === c
                      ? "bg-violet-500/20 border-violet-400/40 text-violet-200"
                      : "bg-white/[0.04] border-white/[0.08] text-slate-400 hover:border-violet-400/30 hover:text-slate-200"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {c} names
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl">
              <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold pr-1">Style</span>
              {([
                { v: "either" as WordCountChoice, label: "Any words" },
                { v: 1 as WordCountChoice, label: "1 word only" },
                { v: 2 as WordCountChoice, label: "2 words" },
              ]).map((opt) => (
                <button
                  key={String(opt.v)}
                  onClick={() => setWordCount(opt.v)}
                  disabled={isRunning}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    wordCount === opt.v
                      ? "bg-cyan-500/15 border-cyan-400/40 text-cyan-200"
                      : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-cyan-400/30 hover:text-slate-200"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {opt.label}
                </button>
              ))}
              <span className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={() => setLength(length === "short" ? "any" : "short")}
                disabled={isRunning}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  length === "short"
                    ? "bg-amber-500/15 border-amber-400/40 text-amber-200"
                    : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-amber-400/30 hover:text-slate-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Short ≤6 chars
              </button>
              <span className="w-px h-4 bg-white/10 mx-1" />
              {([
                { v: "either" as WordTypeChoice, label: "Any" },
                { v: "real" as WordTypeChoice, label: "Real words" },
                { v: "invented" as WordTypeChoice, label: "Invented" },
              ]).map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setWordType(opt.v)}
                  disabled={isRunning}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    wordType === opt.v
                      ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-200"
                      : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:border-emerald-400/30 hover:text-slate-200"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 max-w-2xl mx-auto text-left">
              {errorMsg}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="max-w-3xl mx-auto px-4 mb-8">
          <div className="bg-[#101a35]/85 backdrop-blur-sm border border-white/[0.12] rounded-xl p-4 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                {phase === "generating"
                  ? "AI is generating 25 brandable names..."
                  : `Checking .com availability — ${checkedCount} of ${totalCount} done`}
              </span>
              {phase === "checking" && checkedCount > 0 && (
                <span className="text-xs text-emerald-400 font-mono">
                  {availableCount} available so far
                </span>
              )}
            </div>
            {phase === "checking" && totalCount > 0 && (
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-300"
                  style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 pb-20">
          {/* Results header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-xl">
                {checkedAll
                  ? `${availableCount} available .com domain${availableCount !== 1 ? "s" : ""} found`
                  : "Checking availability…"}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {results.length} names generated for &ldquo;{description}&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setFilter("available")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === "available"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Available
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === "all"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All ({results.length})
              </button>
            </div>
          </div>

          {/* Domain cards */}
          <div className="space-y-3">
            {visibleResults.map((r) => {
              const idx = results.indexOf(r);
              const isAvailable = r.comAvailable === true;
              const isTaken = r.comAvailable === false;
              const isPending = !r.comChecked;
              // Premium = short, pronounceable, available. ≤6 chars is the
              // Notion/Stripe/Loom tier — these are the keepers.
              const isPremium = isAvailable && r.slug.length <= 6;

              return (
                <div
                  key={r.slug}
                  className={`rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                    isAvailable
                      ? "bg-gradient-to-r from-violet-500/20 to-cyan-500/15 border-violet-400/40 shadow-[0_8px_32px_-12px_rgba(139,92,246,0.35)]"
                      : isTaken
                      ? "bg-[#0f1830]/85 border-white/[0.08] opacity-70"
                      : "bg-[#101a35]/85 border-white/[0.12] shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: status icon + name + tagline */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAvailable
                              ? "bg-emerald-500/20"
                              : isTaken
                              ? "bg-red-500/10"
                              : "bg-white/5"
                          }`}
                        >
                          {isPending ? (
                            <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                          ) : isAvailable ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : isTaken ? (
                            <X className="w-3.5 h-3.5 text-slate-500" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span
                              className={`font-bold text-lg tracking-tight ${
                                isAvailable ? "text-white" : "text-slate-400"
                              }`}
                            >
                              {r.slug}.com
                            </span>
                            {isPremium && (
                              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-amber-500/20 to-amber-500/10 border border-amber-400/40 text-amber-300 inline-flex items-center gap-1">
                                <Crown className="w-3 h-3" />
                                Premium
                              </span>
                            )}
                            {isAvailable && r.price !== null && (
                              <span className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-medium">
                                ${r.price}/yr
                              </span>
                            )}
                            {isTaken && (
                              <span className="text-xs text-slate-600">taken</span>
                            )}
                            {isPending && (
                              <span className="text-xs text-slate-600">checking…</span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5 truncate">{r.tagline}</p>
                        </div>
                      </div>

                      {/* Right: copy + register */}
                      {isAvailable && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => copyDomain(`${r.slug}.com`)}
                            title="Copy domain"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            {copied === `${r.slug}.com` ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          <a
                            href={`/domains?q=${encodeURIComponent(r.slug)}`}
                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all"
                          >
                            Register <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Expand other TLDs */}
                    {(isAvailable || r.comAvailable === null) && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        {!r.expandedTlds ? (
                          <button
                            onClick={() => expandTlds(idx, r.slug)}
                            className="text-xs text-slate-500 hover:text-violet-400 flex items-center gap-1 transition-colors"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                            Check .io, .ai, .dev, .app, .co
                          </button>
                        ) : r.checkingTlds ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Checking other TLDs…
                          </div>
                        ) : r.otherTlds.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {r.otherTlds.map((t) => (
                              <span
                                key={t.domain}
                                className={`text-xs px-2.5 py-1 rounded-full border ${
                                  t.available === true
                                    ? "bg-violet-500/10 border-violet-500/20 text-violet-300"
                                    : "bg-white/5 border-white/10 text-slate-500"
                                }`}
                              >
                                {t.domain}
                                {t.available === true && (
                                  <span className="ml-1 opacity-60">${t.price}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Registry unreachable — every check returned null */}
          {allUnverified && (
            <div className="text-center py-12 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04]">
              <Globe className="w-12 h-12 mx-auto mb-4 text-amber-400/60" />
              <p className="font-semibold text-amber-200">Registry temporarily unreachable</p>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                We couldn&apos;t verify availability for any of these names — the .com registry
                rate-limited or is slow right now. Please try again in a few seconds.
              </p>
              <button
                onClick={handleSearch}
                className="mt-5 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
              >
                <Loader2 className="w-3.5 h-3.5" />
                Try again
              </button>
            </div>
          )}

          {/* No available .com state */}
          {checkedAll && !allUnverified && availableCount === 0 && filter === "available" && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <p className="font-semibold text-slate-300">No .com domains available</p>
              <p className="text-sm text-slate-500 mt-1">
                Every name was taken on .com — try a more specific or creative description, or
                check other TLDs below.
              </p>
              <button
                onClick={() => setFilter("all")}
                className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
              >
                Show all results with other TLDs
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty / example state */}
      {results.length === 0 && phase === "idle" && (
        <div className="max-w-3xl mx-auto px-4 pb-20">
          <p className="text-slate-500 text-sm text-center mb-4">Try an example:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setDescription(ex)}
                className="p-4 bg-[#101a35]/80 backdrop-blur-sm hover:bg-[#142046]/85 border border-white/[0.1] hover:border-violet-500/40 rounded-xl text-sm text-slate-300 hover:text-white text-left transition-all flex items-center gap-3"
              >
                <Search className="w-4 h-4 text-slate-600 flex-shrink-0" />
                {ex}
              </button>
            ))}
          </div>
          <p className="text-slate-600 text-xs text-center mt-6">
            AI generates 25 brand-name ideas, then checks each .com in real time
          </p>
        </div>
      )}
    </div>
  );
}
