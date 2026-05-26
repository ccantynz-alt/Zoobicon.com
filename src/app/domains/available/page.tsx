"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Check,
  X,
  Loader2,
  Sparkles,
  Filter,
  ArrowRight,
  BadgeCheck,
  ShoppingCart,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Browse all available .coms — the pre-crawled catalog page.
//
// Filters: TLD, length, prefix, suffix, sort. Results come from
// /api/domains/available which is updated every 5 min by the crawler. Click a
// row to drop it into a localStorage cart that the existing /domains page
// reads when ?cart=true.
// ---------------------------------------------------------------------------

type Tld = "com" | "ai" | "io";
type SortKey = "alpha" | "length" | "recent";

interface Row {
  domain: string;
  label: string;
  length: number;
  premium: boolean;
  lastCheckedAt: string;
}

interface ApiResponse {
  rows: Row[];
  total: number;
  offset: number;
  limit: number;
}

// Mirrors TLD_PRICING in /api/domains/search/route.ts
const TLD_PRICES: Record<Tld, number> = {
  com: 12.99,
  ai: 69.99,
  io: 39.99,
};

const PAGE_SIZE = 50;
const INITIAL_LIMIT = 100;
const FILTER_DEBOUNCE_MS = 300;

// ---------------------------------------------------------------------------
// Cart helpers — share storage with the legacy /domains?cart=true UI.
// ---------------------------------------------------------------------------

interface CartItem {
  domain: string;
  price: number;
  addedAt: string;
}

const CART_KEY = "zoobicon_cart";

function getLocalCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item.domain === "string" &&
        typeof item.price === "number"
    );
  } catch {
    return [];
  }
}

function addToLocalCart(domain: string, price: number): boolean {
  if (typeof window === "undefined") return false;
  const cart = getLocalCart();
  if (cart.some((item) => item.domain === domain)) return false;
  cart.push({ domain, price, addedAt: new Date().toISOString() });
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AvailableDomainsPage() {
  const [tld, setTld] = useState<Tld>("com");
  const [length, setLength] = useState<number | null>(null);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [sort, setSort] = useState<SortKey>("alpha");

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refresh cart count from localStorage on mount and after each add
  const refreshCartCount = useCallback(() => {
    setCartCount(getLocalCart().length);
  }, []);

  useEffect(() => {
    refreshCartCount();
  }, [refreshCartCount]);

  // ---- Sanitize filter inputs (alphanumeric only, max 5 chars) -----------
  const handlePrefixChange = useCallback((value: string) => {
    setPrefix(value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5));
  }, []);

  const handleSuffixChange = useCallback((value: string) => {
    setSuffix(value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5));
  }, []);

  // ---- Build query string -------------------------------------------------
  const buildQuery = useCallback(
    (nextOffset: number, limit: number) => {
      const params = new URLSearchParams();
      params.set("tld", tld);
      if (length !== null) params.set("length", String(length));
      if (prefix) params.set("prefix", prefix);
      if (suffix) params.set("suffix", suffix);
      params.set("sort", sort);
      params.set("offset", String(nextOffset));
      params.set("limit", String(limit));
      return params.toString();
    },
    [tld, length, prefix, suffix, sort]
  );

  // ---- Fetch (debounced when filters change) ------------------------------
  const fetchRows = useCallback(
    async (mode: "replace" | "append", nextOffset: number) => {
      const limit = mode === "replace" ? INITIAL_LIMIT : PAGE_SIZE;
      const qs = buildQuery(nextOffset, limit);
      if (mode === "replace") {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await fetch(`/api/domains/available?${qs}`, {
          signal: AbortSignal.timeout(15000),
        });

        if (res.status >= 500) {
          throw new Error(
            `Catalog service is offline (${res.status}). The pre-crawled list updates every 5 minutes — try again shortly.`
          );
        }
        if (!res.ok) {
          throw new Error(
            `Couldn't load the available list (HTTP ${res.status}). Adjust your filters or try again.`
          );
        }

        const data = (await res.json()) as ApiResponse;
        const incoming = Array.isArray(data.rows) ? data.rows : [];

        if (mode === "replace") {
          setRows(incoming);
          setOffset(incoming.length);
        } else {
          setRows((prev) => [...prev, ...incoming]);
          setOffset(nextOffset + incoming.length);
        }
        setTotal(typeof data.total === "number" ? data.total : incoming.length);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Network error reaching the catalog. Check your connection and retry.";
        setError(message);
        if (mode === "replace") {
          setRows([]);
          setTotal(0);
          setOffset(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildQuery]
  );

  // ---- Debounce filter changes -------------------------------------------
  useEffect(() => {
    const handle = setTimeout(() => {
      fetchRows("replace", 0);
    }, FILTER_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // We deliberately depend on the filter values (not fetchRows) so a
    // referential change to fetchRows from a non-filter source doesn't
    // re-trigger; fetchRows already closes over the current filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tld, length, prefix, suffix, sort]);

  // ---- Cart actions -------------------------------------------------------
  const handleAddToCart = useCallback(
    (domain: string, price: number) => {
      const added = addToLocalCart(domain, price);
      refreshCartCount();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast(
        added
          ? `Added ${domain} to cart`
          : `${domain} is already in your cart`
      );
      toastTimerRef.current = setTimeout(() => setToast(null), 2000);
    },
    [refreshCartCount]
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // ---- Active filter pills -----------------------------------------------
  const activePills: Array<{ key: string; label: string; clear: () => void }> = [];
  if (length !== null) {
    activePills.push({
      key: "length",
      label: `${length} characters`,
      clear: () => setLength(null),
    });
  }
  if (prefix) {
    activePills.push({
      key: "prefix",
      label: `Starts with "${prefix}"`,
      clear: () => setPrefix(""),
    });
  }
  if (suffix) {
    activePills.push({
      key: "suffix",
      label: `Ends with "${suffix}"`,
      clear: () => setSuffix(""),
    });
  }
  if (sort !== "alpha") {
    activePills.push({
      key: "sort",
      label: sort === "length" ? "Shortest first" : "Recently checked",
      clear: () => setSort("alpha"),
    });
  }

  const price = TLD_PRICES[tld];
  const showLoadMore = !loading && rows.length > 0 && rows.length < total;

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ----------------------------------------------------------------- */}
      <section className="border-b" style={{ borderColor: "var(--rule)" }}>
        <div className="mx-auto max-w-6xl px-6 pt-16 pb-10 md:pt-24 md:pb-14">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] rounded-full border"
              style={{
                borderColor: "var(--rule)",
                background: "var(--paper-elevated)",
                color: "var(--ink-secondary)",
              }}
            >
              <BadgeCheck className="w-3.5 h-3.5" style={{ color: "var(--gold-deep)" }} />
              <span>
                Pre-crawled · Updates every 5 min · {total.toLocaleString()} available
              </span>
            </div>

            <Link
              href="/domains?cart=true"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border transition-colors"
              style={{
                borderColor: "var(--rule)",
                background: "var(--paper-elevated)",
                color: "var(--ink)",
              }}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>View cart</span>
              {cartCount > 0 && (
                <span
                  className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-semibold rounded-full"
                  style={{ background: "var(--ink)", color: "var(--paper)" }}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          <h1
            className="text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight mb-5"
            style={{ color: "var(--ink)" }}
          >
            Browse every available{" "}
            <span className="display-italic" style={{ color: "var(--gold-deep)" }}>
              .{tld}
            </span>
            .
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl leading-relaxed"
            style={{ color: "var(--ink-secondary)" }}
          >
            Pre-crawled from the registry, updated every five minutes. Click any
            name to add it to your cart.
          </p>

          {/* ------------------- Filter chips strip --------------------- */}
          <div className="mt-10 space-y-5">
            {/* Row 1: TLD / Length / Sort */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <FilterGroup label="TLD">
                {(["com", "ai", "io"] as Tld[]).map((t) => (
                  <Chip
                    key={t}
                    active={tld === t}
                    onClick={() => setTld(t)}
                    label={`.${t}`}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label="Length">
                <Chip
                  active={length === null}
                  onClick={() => setLength(null)}
                  label="Any"
                />
                {[3, 4, 5].map((n) => (
                  <Chip
                    key={n}
                    active={length === n}
                    onClick={() => setLength(n)}
                    label={String(n)}
                  />
                ))}
              </FilterGroup>

              <FilterGroup label="Sort">
                <Chip
                  active={sort === "alpha"}
                  onClick={() => setSort("alpha")}
                  label="Alphabetical"
                />
                <Chip
                  active={sort === "length"}
                  onClick={() => setSort("length")}
                  label="Shortest first"
                />
                <Chip
                  active={sort === "recent"}
                  onClick={() => setSort("recent")}
                  label="Recently checked"
                />
              </FilterGroup>
            </div>

            {/* Row 2: Prefix / Suffix inputs */}
            <div className="flex flex-wrap items-center gap-4">
              <TextInput
                icon={<Search className="w-4 h-4" />}
                placeholder="Starts with…"
                value={prefix}
                onChange={handlePrefixChange}
                ariaLabel="Filter domains that start with"
              />
              <TextInput
                icon={<ArrowRight className="w-4 h-4" />}
                placeholder="Ends with…"
                value={suffix}
                onChange={handleSuffixChange}
                ariaLabel="Filter domains that end with"
              />
            </div>

            {/* Row 3: Active pills */}
            {activePills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]"
                  style={{ color: "var(--ink-muted)" }}
                >
                  <Filter className="w-3 h-3" />
                  Active
                </span>
                {activePills.map((pill) => (
                  <button
                    key={pill.key}
                    onClick={pill.clear}
                    className="inline-flex items-center gap-2 pl-3 pr-2 py-1 text-xs rounded-full border transition-colors"
                    style={{
                      borderColor: "var(--rule)",
                      background: "var(--paper-elevated)",
                      color: "var(--ink-secondary)",
                    }}
                  >
                    <span>{pill.label}</span>
                    <span
                      className="inline-flex items-center justify-center w-4 h-4 rounded-full"
                      style={{ background: "var(--rule)", color: "var(--ink)" }}
                    >
                      <X className="w-2.5 h-2.5" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Results                                                           */}
      {/* ----------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {/* Results header */}
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h2
              className="text-2xl md:text-3xl font-semibold tracking-tight"
              style={{ color: "var(--ink)" }}
            >
              Available <span className="display-italic" style={{ color: "var(--gold-deep)" }}>now</span>
            </h2>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--ink-muted)" }}
            >
              {loading
                ? "Loading the latest crawl…"
                : `Showing ${rows.length.toLocaleString()} of ${total.toLocaleString()}`}
            </p>
          </div>
          <div
            className="text-sm"
            style={{ color: "var(--ink-secondary)" }}
          >
            Registration{" "}
            <span style={{ color: "var(--ink)" }} className="font-semibold">
              ${price.toFixed(2)}/yr
            </span>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div
            className="mb-8 p-5 rounded-lg border flex items-start gap-3"
            style={{
              borderColor: "var(--gold-deep)",
              background: "var(--paper-elevated)",
            }}
          >
            <X
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: "var(--gold-deep)" }}
            />
            <div className="flex-1">
              <div
                className="font-semibold mb-1"
                style={{ color: "var(--ink)" }}
              >
                Couldn&apos;t load the available list
              </div>
              <div
                className="text-sm"
                style={{ color: "var(--ink-secondary)" }}
              >
                {error}
              </div>
              <button
                onClick={() => fetchRows("replace", 0)}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full"
                style={{ background: "var(--ink)", color: "var(--paper)" }}
              >
                <Loader2 className="w-3.5 h-3.5" />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && rows.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="p-5 rounded-lg border animate-pulse"
                style={{
                  borderColor: "var(--rule)",
                  background: "var(--paper-elevated)",
                }}
              >
                <div
                  className="h-5 w-3/4 rounded mb-3"
                  style={{ background: "var(--rule-strong, var(--rule))" }}
                />
                <div
                  className="h-3 w-1/3 rounded"
                  style={{ background: "var(--rule-strong, var(--rule))" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && rows.length === 0 && (
          <div
            className="p-10 rounded-lg border text-center"
            style={{
              borderColor: "var(--rule)",
              background: "var(--paper-elevated)",
            }}
          >
            <Sparkles
              className="w-8 h-8 mx-auto mb-3"
              style={{ color: "var(--gold-deep)" }}
            />
            <div
              className="text-lg font-semibold mb-1"
              style={{ color: "var(--ink)" }}
            >
              No matches in this slice of the catalog
            </div>
            <div
              className="text-sm max-w-md mx-auto"
              style={{ color: "var(--ink-secondary)" }}
            >
              Try a different starting letter, lengthen or shorten the filter,
              or pick another TLD. The full crawl runs every five minutes.
            </div>
          </div>
        )}

        {/* Results grid */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rows.map((row) => (
              <ResultCard
                key={row.domain}
                row={row}
                price={price}
                onAdd={() => handleAddToCart(row.domain, price)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {showLoadMore && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              onClick={() => fetchRows("append", offset)}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-full border transition-colors disabled:opacity-60"
              style={{
                borderColor: "var(--rule)",
                background: "var(--paper-elevated)",
                color: "var(--ink)",
              }}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  Load 50 more
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <div className="text-xs" style={{ color: "var(--ink-muted)" }}>
              {rows.length.toLocaleString()} of {total.toLocaleString()} loaded
            </div>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Toast                                                             */}
      {/* ----------------------------------------------------------------- */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full border shadow-sm flex items-center gap-2 text-sm font-medium z-50"
          style={{
            borderColor: "var(--rule)",
            background: "var(--paper-elevated)",
            color: "var(--ink)",
          }}
        >
          <Check
            className="w-4 h-4"
            style={{ color: "var(--gold-deep)" }}
          />
          {toast}
        </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[11px] uppercase tracking-[0.18em] font-medium"
        style={{ color: "var(--ink-muted)" }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-sm font-medium rounded-full border transition-colors"
      style={
        active
          ? {
              borderColor: "var(--ink)",
              background: "var(--ink)",
              color: "var(--paper)",
            }
          : {
              borderColor: "var(--rule)",
              background: "var(--paper)",
              color: "var(--ink-secondary)",
            }
      }
    >
      {label}
    </button>
  );
}

function TextInput({
  icon,
  placeholder,
  value,
  onChange,
  ariaLabel,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 rounded-full border w-full sm:w-64"
      style={{
        borderColor: "var(--rule)",
        background: "var(--paper)",
      }}
    >
      <span style={{ color: "var(--ink-muted)" }}>{icon}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        maxLength={5}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--ink-muted)]"
        style={{ color: "var(--ink)" }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label={`Clear ${ariaLabel}`}
          className="inline-flex items-center justify-center w-5 h-5 rounded-full"
          style={{ background: "var(--rule)", color: "var(--ink)" }}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function ResultCard({
  row,
  price,
  onAdd,
}: {
  row: Row;
  price: number;
  onAdd: () => void;
}) {
  return (
    <div
      className="group relative p-5 rounded-lg border transition-colors"
      style={{
        borderColor: "var(--rule)",
        background: "var(--paper-elevated)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--gold-deep)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--rule)";
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span
              className="text-[10px] uppercase tracking-[0.16em] font-medium px-2 py-0.5 rounded-full border"
              style={{
                borderColor: "var(--rule)",
                color: "var(--ink-muted)",
              }}
            >
              {row.length} chars
            </span>
            {row.premium && (
              <span
                className="text-[10px] uppercase tracking-[0.16em] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--paper)",
                  color: "var(--gold-deep)",
                  border: "1px solid var(--gold)",
                }}
              >
                Premium
              </span>
            )}
          </div>
          <div
            className="text-xl font-semibold tracking-tight truncate"
            style={{ color: "var(--ink)" }}
          >
            {row.domain}
          </div>
          <div
            className="mt-1 text-xs"
            style={{ color: "var(--ink-muted)" }}
          >
            ${price.toFixed(2)}/yr
          </div>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-transform active:scale-95 flex-shrink-0"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          Add
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
