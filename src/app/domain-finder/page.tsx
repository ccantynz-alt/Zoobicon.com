"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Heart,
  Wand2,
  ExternalLink,
  ShoppingCart,
  Shield,
  Download,
} from "lucide-react";

interface GeneratedName {
  name: string;
  slug: string;
  tagline: string;
  // 0-100 brand quality score from Claude. Optional because older clients +
  // fallback paths may omit it.
  score?: number;
  // ISO codes of languages where the name has a known unfortunate meaning.
  flags?: string[];
}

interface TldResult {
  domain: string;
  available: boolean | null;
  price: number;
}

// Auto-checked alternative when .com is taken: things like getX.com, tryX.com,
// Xai.com, Xapp.com. Same shape as TldResult but with a label for the prefix
// or suffix used so the UI can render "get + slug" naturally.
interface VariantResult {
  slug: string;            // the variant slug (e.g. "getmercury")
  domain: string;          // "getmercury.com"
  pattern: string;         // "get + name"
  available: boolean | null;
  price: number | null;
}

// Per-row social handle availability — null = unknown / rate-limited.
interface HandleResults {
  github: boolean | null;
  x: boolean | null;
  instagram: boolean | null;
  tiktok: boolean | null;
}

interface DomainResult {
  name: string;
  slug: string;
  tagline: string;
  score?: number;
  flags?: string[];
  comAvailable: boolean | null;
  comChecked: boolean;
  price: number | null;
  otherTlds: TldResult[];
  expandedTlds: boolean;
  checkingTlds: boolean;
  variants: VariantResult[];
  variantsChecked: boolean;
  handles: HandleResults | null;
  handlesChecked: boolean;
}

type CountChoice = 25 | 50 | 100;
type WordCountChoice = 1 | 2 | "either";
type LengthChoice = "short" | "any";
type WordTypeChoice = "real" | "invented" | "either";
type FilterChoice = "available" | "all" | "saved";

const COUNT_OPTIONS: CountChoice[] = [25, 50, 100];

// TLDs we automatically check in the background for every available .com so
// the user sees a complete picture without clicking expand. Kept short to
// avoid hammering RDAP — additional TLDs still available behind the dropdown.
const AUTO_TLDS = ["io", "ai", "dev", "app", "co"];

// Common naming-pattern variants we auto-check when the user's first-choice
// .com is taken. These are the patterns most commonly used by funded startups
// when their preferred bare name is already registered.
const VARIANT_PATTERNS: Array<{ pattern: string; build: (slug: string) => string }> = [
  { pattern: "get + name", build: (s) => `get${s}` },
  { pattern: "try + name", build: (s) => `try${s}` },
  { pattern: "name + ai", build: (s) => `${s}ai` },
  { pattern: "name + app", build: (s) => `${s}app` },
];

const FAVORITES_KEY = "zoobicon_domain_favorites";
const HISTORY_KEY = "zoobicon_domain_history";

const EXAMPLES = [
  "AI scheduling tool for dentists",
  "sustainable fashion marketplace",
  "dog training app",
  "remote team analytics platform",
];

// Industry preset prompts — one tap to seed a category-specific search.
// Designed to cover the most common verticals founders search for and to
// surface naming territory the user might not have thought of (e.g. someone
// vaguely "in AI" gets directed to a more specific bucket).
interface IndustryPreset {
  id: string;
  label: string;
  emoji: string;
  prompt: string;
  recommendedWordType: WordTypeChoice;
  recommendedLength: LengthChoice;
}

const INDUSTRY_PRESETS: IndustryPreset[] = [
  { id: "ai-saas", label: "AI / SaaS", emoji: "✨", prompt: "AI-native SaaS product for modern teams — fast, focused, premium feel", recommendedWordType: "either", recommendedLength: "short" },
  { id: "ai-email", label: "AI email client", emoji: "✉️", prompt: "AI email client that drafts replies, summarises threads, and triages inboxes", recommendedWordType: "real", recommendedLength: "short" },
  { id: "fintech", label: "Fintech", emoji: "💳", prompt: "modern fintech app for payments, banking, and personal finance — trustworthy, premium", recommendedWordType: "real", recommendedLength: "short" },
  { id: "health", label: "Health / wellness", emoji: "🩺", prompt: "digital health and wellness platform — calm, trustworthy, human", recommendedWordType: "real", recommendedLength: "any" },
  { id: "ecommerce", label: "E-commerce", emoji: "🛍️", prompt: "direct-to-consumer e-commerce brand with a distinctive personality", recommendedWordType: "either", recommendedLength: "any" },
  { id: "creator", label: "Creator tools", emoji: "🎬", prompt: "creator-economy tools for video, audio, and writing — playful but premium", recommendedWordType: "either", recommendedLength: "short" },
  { id: "developer", label: "Developer tools", emoji: "⚡", prompt: "developer tooling and infrastructure — technical, fast, terminal-first", recommendedWordType: "invented", recommendedLength: "short" },
  { id: "agency", label: "Agency / studio", emoji: "🏛️", prompt: "creative agency, design studio, or consultancy — distinctive, editorial, timeless", recommendedWordType: "real", recommendedLength: "any" },
];

export default function DomainFinderPage() {
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<"idle" | "generating" | "checking" | "done">("idle");
  const [results, setResults] = useState<DomainResult[]>([]);
  const [checkedCount, setCheckedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<FilterChoice>("available");
  const [copied, setCopied] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Filters: count batch size, word count, length, real-vs-invented
  const [count, setCount] = useState<CountChoice>(25);
  const [wordCount, setWordCount] = useState<WordCountChoice>("either");
  const [length, setLength] = useState<LengthChoice>("any");
  const [wordType, setWordType] = useState<WordTypeChoice>("either");

  // Saved favorites (persisted) + per-search bulk selection (transient)
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  // Recent searches — surfaces at idle so a return user can rerun a query
  const [history, setHistory] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  // Load favorites + history from localStorage on mount. Wrapped in try/catch
  // because Safari private mode throws on localStorage access.
  useEffect(() => {
    try {
      const f = localStorage.getItem(FAVORITES_KEY);
      if (f) setFavorites(new Set(JSON.parse(f) as string[]));
      const h = localStorage.getItem(HISTORY_KEY);
      if (h) setHistory(JSON.parse(h) as string[]);
    } catch {
      // storage unavailable — favorites/history just don't persist this session
    }
  }, []);

  const persistFavorites = useCallback((next: Set<string>) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]));
    } catch {
      /* ignore */
    }
  }, []);

  const persistHistory = useCallback((next: string[]) => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFavorite = (slug: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      persistFavorites(next);
      return next;
    });
  };

  const toggleSelected = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const copyDomain = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopied(domain);
    setTimeout(() => setCopied(""), 2000);
  };

  // Industry preset — seeds the description and snaps the filter chips to
  // the recommended values for that vertical. Doesn't auto-fire the search;
  // user can still tweak before hitting "Find Domains".
  const applyPreset = (preset: IndustryPreset) => {
    setDescription(preset.prompt);
    setWordType(preset.recommendedWordType);
    setLength(preset.recommendedLength);
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
    setSelected(new Set());

    // Persist this search to history (deduped, max 8 entries)
    const trimmed = description.trim();
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 8);
      persistHistory(next);
      return next;
    });

    // Seed the result list so the UI shows pending rows immediately
    setResults(
      names.map((n) => ({
        name: n.name,
        slug: n.slug,
        tagline: n.tagline,
        score: n.score,
        flags: n.flags,
        comAvailable: null,
        comChecked: false,
        price: null,
        otherTlds: [],
        expandedTlds: false,
        checkingTlds: false,
        variants: [],
        variantsChecked: false,
        handles: null,
        handlesChecked: false,
      })),
    );

    // Step 2 — Check .com availability for each name. Concurrency scales
    // gently with batch size so 100-name searches don't open 30 sockets at
    // once but still finish quickly.
    const CONCURRENCY = count >= 100 ? 8 : count >= 50 ? 6 : 5;
    let cursor = 0;

    const userAbortFired = () => abortRef.current?.signal.aborted === true;

    // Fire-and-forget: when a .com comes back available, kick off the
    // social-handle check too. Independent of TLD fan-out so a slow social
    // platform never blocks the alt-TLD chips from rendering.
    const fanOutHandles = (idx: number, slug: string) => {
      void (async () => {
        try {
          const userSignal = abortRef.current?.signal;
          const fetchSignal = userSignal
            ? AbortSignal.any([userSignal, AbortSignal.timeout(12000)])
            : AbortSignal.timeout(12000);
          const res = await fetch(`/api/handles/check?slug=${encodeURIComponent(slug)}`, {
            signal: fetchSignal,
          });
          if (!res.ok) return;
          const data = (await res.json()) as HandleResults;
          setResults((prev) =>
            prev.map((r, i) =>
              i === idx
                ? {
                    ...r,
                    handles: {
                      github: data.github ?? null,
                      x: data.x ?? null,
                      instagram: data.instagram ?? null,
                      tiktok: data.tiktok ?? null,
                    },
                    handlesChecked: true,
                  }
                : r,
            ),
          );
        } catch {
          // Silent — handles are supplemental and the row still renders fine
          // without them.
        }
      })();
    };

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

          // Available .com → fan out alt-TLD + social handle checks in the
          // background. Both are fire-and-forget so the main sweep keeps
          // moving even if a social platform challenges or rate-limits us.
          if (comAvailable === true) {
            fanOutAltTlds(idx, n.slug);
            fanOutHandles(idx, n.slug);
          }
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

    // Step 3 — Variant sweep. For every row whose .com came back TAKEN, check
    // get/try/+ai/+app variants in the background so the user always sees a
    // path forward. Runs at low concurrency so it won't choke RDAP, and we
    // pull the latest results inside the worker (rather than closing over the
    // stale `names` array) so favorited rows still get their variant check.
    void runVariantSweep(names);
  };

  // Background variant sweep — independent of the main worker pool. Reads
  // current results to find taken rows, fires 4 variant checks per row at
  // concurrency 2. Aborts on user cancel.
  const runVariantSweep = useCallback(async (names: GeneratedName[]) => {
    const VARIANT_CONCURRENCY = 2;
    let cursor = 0;

    const userAbortFired = () => abortRef.current?.signal.aborted === true;

    const checkVariantsFor = async (idx: number, slug: string) => {
      const checks: VariantResult[] = await Promise.all(
        VARIANT_PATTERNS.map(async (vp) => {
          const variantSlug = vp.build(slug).toLowerCase().replace(/[^a-z0-9]/g, "");
          if (!variantSlug) {
            return {
              slug: variantSlug,
              domain: `${variantSlug}.com`,
              pattern: vp.pattern,
              available: null,
              price: null,
            };
          }
          try {
            const userSignal = abortRef.current?.signal;
            const fetchSignal = userSignal
              ? AbortSignal.any([userSignal, AbortSignal.timeout(14000)])
              : AbortSignal.timeout(14000);
            const res = await fetch(
              `/api/domains/search?q=${encodeURIComponent(variantSlug)}&tlds=com&mode=com-priority`,
              { signal: fetchSignal },
            );
            if (!res.ok) throw new Error();
            const data = await res.json();
            const com = (data.results || []).find(
              (r: { tld: string }) => r.tld === "com",
            ) as { available: boolean | null; price: number } | undefined;
            return {
              slug: variantSlug,
              domain: `${variantSlug}.com`,
              pattern: vp.pattern,
              available: com?.available ?? null,
              price: com?.price ?? null,
            };
          } catch {
            return {
              slug: variantSlug,
              domain: `${variantSlug}.com`,
              pattern: vp.pattern,
              available: null,
              price: null,
            };
          }
        }),
      );
      if (userAbortFired()) return;
      setResults((prev) =>
        prev.map((r, i) =>
          i === idx ? { ...r, variants: checks, variantsChecked: true } : r,
        ),
      );
    };

    // Build a static list of taken-row indices to process. We snapshot from
    // the closure's `names` order (which matches results' index ordering).
    // Workers read the latest comAvailable from a ref-style getter to avoid
    // stale-closure issues, falling back to skip if the row isn't taken yet.
    const getTakenIndex = (): number => {
      // We just walk indices and check the live results state via setResults
      // callback below — but for simplicity we re-read from a snapshot the
      // main sweep has already populated by this point.
      return -1;
    };
    // unused — kept for future filter; the worker below uses cursor directly
    void getTakenIndex;

    // Snapshot taken indices once at variant-sweep start (all .com checks are
    // done by here). We use a functional setResults to peek at current state.
    let takenIndices: number[] = [];
    setResults((prev) => {
      takenIndices = prev
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.comAvailable === false)
        .map(({ i }) => i);
      return prev;
    });
    // Allow React to flush before reading takenIndices on the next tick
    await new Promise((r) => setTimeout(r, 0));

    if (takenIndices.length === 0) return;

    const variantWorker = async () => {
      while (true) {
        const localIdx = cursor++;
        if (localIdx >= takenIndices.length) return;
        if (userAbortFired()) return;
        const rowIdx = takenIndices[localIdx];
        const slug = names[rowIdx]?.slug;
        if (!slug) continue;
        await checkVariantsFor(rowIdx, slug);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(VARIANT_CONCURRENCY, takenIndices.length) }, variantWorker),
    );
  }, []);

  // "Find similar" — seed a new search shaped after a name the user liked.
  // We feed Claude both the original brief and the seed name so the new
  // batch keeps the same vibe but explores fresh territory.
  const findSimilar = (seed: GeneratedName) => {
    const newDescription = `${description.trim()} — names similar in style and feel to "${seed.name}"`;
    setDescription(newDescription);
    // Use a microtask so state flushes before search reads description
    setTimeout(() => {
      // re-run with the new seeded description; handleSearch reads from state
      handleSearch();
    }, 0);
  };

  // Bulk register — collects every selected slug and ships the user to
  // /domains with the cart pre-populated. /domains supports a ?cart= query
  // param that appends each domain into its own cart on mount.
  const bulkRegister = () => {
    if (selected.size === 0) return;
    const list = [...selected].join(",");
    window.location.href = `/domains?cart=${encodeURIComponent(list)}`;
  };

  // CSV export — power-user feature for agencies vetting hundreds of
  // candidate names at once. Dumps every row in the current sort+filter view
  // with score, status, price, language flags, alt-TLD availability, social
  // handles, and variant suggestions. Generated client-side so there's no
  // round-trip and no privacy concern.
  const exportCsv = () => {
    if (results.length === 0) return;
    const escape = (v: unknown): string => {
      const s = v === null || v === undefined ? "" : String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const headers = [
      "domain", "status", "score", "price_usd", "tagline", "language_flags",
      "alt_tlds_available", "variants_available",
      "github", "x", "instagram", "tiktok",
    ];
    const rows = visibleResults.map((r) => {
      const status =
        r.comAvailable === true ? "available"
        : r.comAvailable === false ? "taken"
        : !r.comChecked ? "checking" : "unverified";
      const altTlds = r.otherTlds
        .filter((t) => t.available === true)
        .map((t) => t.domain)
        .join(" ");
      const variantsAvail = r.variants
        .filter((v) => v.available === true)
        .map((v) => v.domain)
        .join(" ");
      const h = r.handles;
      return [
        `${r.slug}.com`,
        status,
        r.score ?? "",
        r.price ?? "",
        r.tagline,
        (r.flags || []).join(" "),
        altTlds,
        variantsAvail,
        h ? (h.github === true ? "available" : h.github === false ? "taken" : "unknown") : "",
        h ? (h.x === true ? "available" : h.x === false ? "taken" : "unknown") : "",
        h ? (h.instagram === true ? "available" : h.instagram === false ? "taken" : "unknown") : "",
        h ? (h.tiktok === true ? "available" : h.tiktok === false ? "taken" : "unknown") : "",
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const safeFile = description.trim().slice(0, 40).replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "domains";
    const a = document.createElement("a");
    a.href = url;
    a.download = `zoobicon-${safeFile}-${Date.now()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    const status = (r: DomainResult) =>
      r.comAvailable === true ? 0 : !r.comChecked ? 1 : 2;
    const sa = status(a);
    const sb = status(b);
    if (sa !== sb) return sa - sb;
    // Within the same status group, prefer higher AI brand score, then
    // shorter slugs — both proxies for "the keepers."
    const scoreA = typeof a.score === "number" ? a.score : -1;
    const scoreB = typeof b.score === "number" ? b.score : -1;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.slug.length - b.slug.length;
  });

  const visibleResults =
    filter === "available"
      ? sortedResults.filter((r) => r.comAvailable === true || !r.comChecked)
      : filter === "saved"
      ? sortedResults.filter((r) => favorites.has(r.slug))
      : sortedResults;

  const savedCount = sortedResults.filter((r) => favorites.has(r.slug)).length;

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
          <p className="text-slate-400 text-lg mb-6 max-w-xl mx-auto">
            Describe your business and AI generates up to 100 brandable names — then we
            instantly check which .com domains are actually available.
          </p>

          {/* Industry presets — one tap to seed prompt + best filter combo */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {INDUSTRY_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                disabled={isRunning}
                className="px-3 py-1.5 rounded-full text-xs font-medium border bg-white/[0.03] border-white/[0.08] text-slate-300 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                title={p.prompt}
              >
                <span className="text-sm">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>

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
            <div className="flex items-center gap-2">
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
                  onClick={() => setFilter("saved")}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                    filter === "saved"
                      ? "bg-violet-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${savedCount > 0 ? "fill-current" : ""}`} />
                  Saved ({savedCount})
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
              <button
                onClick={exportCsv}
                title="Export the current view to CSV"
                className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:border-cyan-400/30 hover:text-cyan-200 transition-colors"
              >
                <Download className="w-4 h-4" />
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
                            {/* Brand-quality score meter — only render when
                                Claude actually scored this row. Colour ramps
                                from slate → cyan → violet → amber as score
                                rises so winners catch the eye. */}
                            {typeof r.score === "number" && isAvailable && (
                              <span
                                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${
                                  r.score >= 90
                                    ? "bg-amber-500/15 border-amber-400/40 text-amber-200"
                                    : r.score >= 75
                                    ? "bg-violet-500/15 border-violet-400/40 text-violet-200"
                                    : r.score >= 60
                                    ? "bg-cyan-500/15 border-cyan-400/30 text-cyan-200"
                                    : "bg-slate-500/15 border-slate-400/20 text-slate-300"
                                }`}
                                title={`AI brand-quality score (memorability + distinctiveness + pronounceability)`}
                              >
                                {r.score}
                              </span>
                            )}
                            {/* Language-safety flag — taken or available, if
                                Claude flagged this name in any language we
                                surface it as a small warning chip with the
                                language codes in the title. */}
                            {r.flags && r.flags.length > 0 && (
                              <span
                                className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold bg-rose-500/10 border border-rose-400/30 text-rose-300 inline-flex items-center gap-1"
                                title={`Possible negative meaning in: ${r.flags.join(", ").toUpperCase()}`}
                              >
                                ⚠ {r.flags.length}{r.flags.length === 1 ? " lang" : " langs"}
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

                      {/* Right: bulk-select + favorite + find-similar + copy + register */}
                      {isAvailable && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Bulk select checkbox */}
                          <button
                            onClick={() => toggleSelected(r.slug)}
                            title={selected.has(r.slug) ? "Deselect" : "Select for bulk register"}
                            className={`p-2 rounded-lg border transition-all ${
                              selected.has(r.slug)
                                ? "bg-violet-500/20 border-violet-400/40 text-violet-200"
                                : "bg-white/[0.03] border-white/[0.08] hover:border-violet-400/30 text-slate-400"
                            }`}
                          >
                            <Check className={`w-4 h-4 ${selected.has(r.slug) ? "" : "opacity-40"}`} />
                          </button>
                          {/* Favorite */}
                          <button
                            onClick={() => toggleFavorite(r.slug)}
                            title={favorites.has(r.slug) ? "Remove from saved" : "Save"}
                            className={`p-2 rounded-lg border transition-all ${
                              favorites.has(r.slug)
                                ? "bg-rose-500/15 border-rose-400/40 text-rose-300"
                                : "bg-white/[0.03] border-white/[0.08] hover:border-rose-400/30 text-slate-400"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${favorites.has(r.slug) ? "fill-current" : ""}`} />
                          </button>
                          {/* Find similar — seed a new search */}
                          <button
                            onClick={() => findSimilar(r)}
                            title="Find more names like this one"
                            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-cyan-400/30 hover:text-cyan-200 text-slate-400 transition-all"
                          >
                            <Wand2 className="w-4 h-4" />
                          </button>
                          {/* Copy */}
                          <button
                            onClick={() => copyDomain(`${r.slug}.com`)}
                            title="Copy domain"
                            className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-white/20 text-slate-400 transition-colors"
                          >
                            {copied === `${r.slug}.com` ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          {/* Register */}
                          <a
                            href={`/domains?q=${encodeURIComponent(r.slug)}`}
                            className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all"
                          >
                            Register <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Expand other TLDs (available rows) */}
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
                              <a
                                key={t.domain}
                                href={
                                  t.available === true
                                    ? `/domains?q=${encodeURIComponent(r.slug)}`
                                    : undefined
                                }
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                  t.available === true
                                    ? "bg-violet-500/15 border-violet-400/30 text-violet-200 hover:bg-violet-500/25"
                                    : "bg-white/5 border-white/10 text-slate-500"
                                }`}
                              >
                                {t.domain}
                                {t.available === true && (
                                  <span className="ml-1 opacity-60">${t.price}</span>
                                )}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Social-handle availability — only on rows where .com
                        was found available. ✓ = handle is free, • = taken,
                        ? = couldn't tell (rate-limit / anti-bot challenge).
                        Each chip is a deep link so the user can instantly
                        verify or claim. */}
                    {isAvailable && (
                      r.handlesChecked && r.handles ? (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-1.5">
                            Social handles
                          </p>
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {(
                              [
                                { key: "github" as const, label: "GitHub", href: `https://github.com/${r.slug}` },
                                { key: "x" as const, label: "X", href: `https://x.com/${r.slug}` },
                                { key: "instagram" as const, label: "Instagram", href: `https://instagram.com/${r.slug}` },
                                { key: "tiktok" as const, label: "TikTok", href: `https://tiktok.com/@${r.slug}` },
                              ]
                            ).map((p) => {
                              const v = r.handles?.[p.key] ?? null;
                              const cls =
                                v === true
                                  ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20"
                                  : v === false
                                  ? "bg-white/[0.03] border-white/[0.08] text-slate-500"
                                  : "bg-white/[0.03] border-white/[0.08] text-slate-500";
                              const symbol = v === true ? "✓" : v === false ? "•" : "?";
                              return (
                                <a
                                  key={p.key}
                                  href={p.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`px-2 py-0.5 rounded-full border inline-flex items-center gap-1 transition-colors ${cls}`}
                                  title={
                                    v === true
                                      ? `@${r.slug} appears available on ${p.label}`
                                      : v === false
                                      ? `@${r.slug} is taken on ${p.label}`
                                      : `Couldn't verify on ${p.label} — click to check manually`
                                  }
                                >
                                  <span className="font-mono text-[10px] opacity-80">{symbol}</span>
                                  {p.label}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-600">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Checking GitHub / X / Instagram / TikTok…
                        </div>
                      )
                    )}

                    {/* Taken row — show variants + marketplace + trademark */}
                    {isTaken && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-2.5">
                        {/* Variant suggestions */}
                        {r.variantsChecked ? (
                          (() => {
                            const availableVariants = r.variants.filter((v) => v.available === true);
                            return availableVariants.length > 0 ? (
                              <div>
                                <p className="text-[10px] uppercase tracking-widest font-semibold text-emerald-400/70 mb-1.5 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" />
                                  Available alternatives
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {availableVariants.map((v) => (
                                    <a
                                      key={v.domain}
                                      href={`/domains?q=${encodeURIComponent(v.slug)}`}
                                      className="text-xs px-2.5 py-1 rounded-full border bg-emerald-500/10 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/20 transition-colors inline-flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      {v.domain}
                                      {v.price !== null && <span className="opacity-60">${v.price}</span>}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            ) : null;
                          })()
                        ) : (
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Checking get/try/+ai/+app variants…
                          </div>
                        )}

                        {/* Marketplace + trademark links */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <a
                            href={`https://sedo.com/search/?keyword=${encodeURIComponent(r.slug + ".com")}&trackingId=&partnerid=&language=us`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Sedo <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                          <a
                            href={`https://www.afternic.com/forsale/${encodeURIComponent(r.slug + ".com")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Afternic <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                          <a
                            href={`https://tmsearch.uspto.gov/bin/showfield?f=toc&state=4807%3Aci0d4l.1.1&p_search=searchss&p_L=50&BackReference=&p_plural=yes&p_s_PARA1=&p_tagrepl%7E%3A=PARA1%24LD&expr=PARA1+AND+PARA2&p_s_PARA2=${encodeURIComponent(r.slug)}&p_tagrepl%7E%3A=PARA2%24COMB&p_op_ALL=AND&a_default=search&a_search=Submit+Query&a_search=Submit+Query`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-amber-300 inline-flex items-center gap-1 transition-colors"
                          >
                            <Shield className="w-3 h-3" />
                            USPTO trademark <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </a>
                        </div>
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
          {/* Recent searches */}
          {history.length > 0 && (
            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-slate-500 text-center mb-3">
                Recent searches
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {history.map((h) => (
                  <button
                    key={h}
                    onClick={() => setDescription(h)}
                    className="px-3 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.03] border border-white/[0.08] hover:border-violet-400/30 hover:text-white transition-colors max-w-xs truncate"
                    title={h}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sticky bulk-action bar — only renders when domains are selected */}
      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-6 max-w-3xl w-[calc(100%-2rem)]">
          <div
            className="rounded-2xl border border-violet-400/40 bg-gradient-to-r from-[#1a1340]/95 to-[#0f1f3d]/95 backdrop-blur-xl shadow-[0_20px_48px_-16px_rgba(139,92,246,0.5)] px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-400/40 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-4 h-4 text-violet-200" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {selected.size} domain{selected.size > 1 ? "s" : ""} selected
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {[...selected].slice(0, 4).map((s) => `${s}.com`).join(" · ")}
                  {selected.size > 4 ? ` +${selected.size - 4} more` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setSelected(new Set())}
                className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Clear
              </button>
              <button
                onClick={bulkRegister}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-all"
              >
                Register {selected.size} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
