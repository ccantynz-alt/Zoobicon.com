"use client";

/**
 * EnrichmentPanel — rich-data slots for an available domain result.
 *
 * Lazy-fires five parallel fetches to optional enrichment endpoints and
 * renders placeholders while they're loading. Any endpoint that 404s or
 * errors is silently dashed out — enrichment is additive, never blocking.
 *
 *   • /api/domains/trademark-global?domain=...  → TM status badge
 *   • /api/domains/handles?name=...             → social handle row
 *   • /api/domains/app-stores?name=...          → iOS / Android row
 *   • /api/domains/history?domain=...           → "previously used 2015–2020"
 *   • /api/domains/valuation?domain=...         → estimated value chip
 *
 * Only the first endpoint currently exists in the codebase (the other four
 * land as 404 and render as "—"). This is intentional — the integration
 * work later is purely mechanical: ship the endpoint with the documented
 * JSON shape and the panel lights up for every result row.
 */

import { useEffect, useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AtSign,
  Smartphone,
  Clock,
  TrendingUp,
  Loader2,
} from "lucide-react";

// ── JSON contracts (match the CLAUDE.md spec for the future endpoints) ────

export interface TrademarkGlobalPayload {
  status: "clear" | "conflict" | "unknown";
  registries?: string[];
  registries_checked?: string[];
  conflicts: Array<{
    registry: string;
    mark: string;
    class: string | null;
    owner: string | null;
  }>;
}

export interface HandlesPayload {
  x: boolean | null;
  instagram: boolean | null;
  github: boolean | null;
  tiktok: boolean | null;
  youtube: boolean | null;
}

export interface AppStoresPayload {
  ios: { available: boolean; conflicts: string[] };
  android: { available: boolean; conflicts: string[] };
}

export interface HistoryPayload {
  firstSeen: string | null;
  lastSeen: string | null;
  snapshots: number;
  flaggedCategories: string[] | null;
}

export interface ValuationPayload {
  low: number;
  high: number;
  midpoint: number;
  factors: string[];
}

// ── Hook: fires all five enrichment fetches in parallel, abortable ────────

export interface Enrichment {
  trademark: TrademarkGlobalPayload | null;
  handles: HandlesPayload | null;
  apps: AppStoresPayload | null;
  history: HistoryPayload | null;
  valuation: ValuationPayload | null;
  loading: {
    trademark: boolean;
    handles: boolean;
    apps: boolean;
    history: boolean;
    valuation: boolean;
  };
}

export function useDomainEnrichment(domain: string | null): Enrichment {
  const [state, setState] = useState<Enrichment>(() => ({
    trademark: null,
    handles: null,
    apps: null,
    history: null,
    valuation: null,
    loading: {
      trademark: false,
      handles: false,
      apps: false,
      history: false,
      valuation: false,
    },
  }));

  useEffect(() => {
    if (!domain) return;
    const ac = new AbortController();

    // Parse domain → name (for social / app-store lookups)
    const name = domain.split(".")[0] || "";

    // Seed all five as loading so skeletons render immediately.
    setState({
      trademark: null,
      handles: null,
      apps: null,
      history: null,
      valuation: null,
      loading: {
        trademark: true,
        handles: true,
        apps: true,
        history: true,
        valuation: true,
      },
    });

    const fetchJson = async <T,>(
      url: string,
      key: keyof Enrichment["loading"],
    ): Promise<T | null> => {
      try {
        const r = await fetch(url, { signal: ac.signal, cache: "no-store" });
        if (!r.ok) return null;
        const data = await r.json().catch(() => null);
        return data as T;
      } catch {
        return null;
      } finally {
        // Flip the individual loading flag the moment this one resolves.
        // Using a functional update guards against stale state when all
        // five land within the same microtask.
        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, [key]: false },
        }));
      }
    };

    void (async () => {
      const [tm, handles, apps, history, valuation] = await Promise.all([
        fetchJson<TrademarkGlobalPayload>(
          `/api/domains/trademark-global?domain=${encodeURIComponent(domain)}`,
          "trademark",
        ),
        fetchJson<HandlesPayload>(
          `/api/domains/handles?name=${encodeURIComponent(name)}`,
          "handles",
        ),
        fetchJson<AppStoresPayload>(
          `/api/domains/app-stores?name=${encodeURIComponent(name)}`,
          "apps",
        ),
        fetchJson<HistoryPayload>(
          `/api/domains/history?domain=${encodeURIComponent(domain)}`,
          "history",
        ),
        fetchJson<ValuationPayload>(
          `/api/domains/valuation?domain=${encodeURIComponent(domain)}`,
          "valuation",
        ),
      ]);

      if (ac.signal.aborted) return;
      setState((prev) => ({
        ...prev,
        trademark: tm,
        handles,
        apps,
        history,
        valuation,
      }));
    })();

    return () => ac.abort();
  }, [domain]);

  return state;
}

// ── Presentational helpers ────────────────────────────────────────────────

function Dash() {
  return <span className="text-white/30">—</span>;
}

function BadgeSkel({ width = 60 }: { width?: number }) {
  return (
    <span
      className="inline-block h-5 rounded-full bg-white/[0.05] animate-pulse"
      style={{ width }}
    />
  );
}

function TrademarkBadge({
  tm,
  loading,
}: {
  tm: TrademarkGlobalPayload | null;
  loading: boolean;
}) {
  if (loading) return <BadgeSkel width={84} />;
  if (!tm) return null;
  const status = tm.status;
  const registries =
    tm.registries ?? tm.registries_checked ?? ["USPTO", "EUIPO", "UKIPO"];
  const count = registries.length || 3;

  if (status === "clear") {
    return (
      <span
        title={`Cleared against ${registries.join(", ")} — no known conflicts`}
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      >
        <ShieldCheck className="w-3 h-3" /> TM CLEAR · {count}
      </span>
    );
  }
  if (status === "conflict") {
    const first = tm.conflicts[0];
    return (
      <span
        title={
          first
            ? `${first.mark} (${first.registry}${first.owner ? " — " + first.owner : ""})`
            : "Potential trademark conflict found"
        }
        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-red-500/40 bg-red-500/10 text-red-300"
      >
        <ShieldAlert className="w-3 h-3" /> TM CONFLICT
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-white/10 bg-white/[0.03] text-white/45">
      <Shield className="w-3 h-3" /> TM —
    </span>
  );
}

function HandleDot({
  label,
  value,
}: {
  label: string;
  value: boolean | null;
}) {
  // true → available (good), false → taken, null → unknown / loading
  const available = value === true;
  const taken = value === false;
  return (
    <span
      title={`${label}: ${available ? "available" : taken ? "taken" : "unknown"}`}
      className={`inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-md font-mono ${
        available
          ? "text-emerald-300/90"
          : taken
            ? "text-white/30 line-through"
            : "text-white/35"
      }`}
    >
      {label}
      <span
        className={`w-1 h-1 rounded-full ${
          available
            ? "bg-emerald-400"
            : taken
              ? "bg-white/25"
              : "bg-white/20 animate-pulse"
        }`}
      />
    </span>
  );
}

function HandleRow({
  handles,
  loading,
}: {
  handles: HandlesPayload | null;
  loading: boolean;
}) {
  if (loading && !handles) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <AtSign className="w-3 h-3 text-white/30 shrink-0" />
        <BadgeSkel width={30} />
        <BadgeSkel width={40} />
        <BadgeSkel width={40} />
        <BadgeSkel width={36} />
        <BadgeSkel width={44} />
      </div>
    );
  }
  if (!handles) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/30">
        <AtSign className="w-3 h-3" /> handles <Dash />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <AtSign className="w-3 h-3 text-white/45 shrink-0" />
      <HandleDot label="x" value={handles.x} />
      <HandleDot label="ig" value={handles.instagram} />
      <HandleDot label="gh" value={handles.github} />
      <HandleDot label="tt" value={handles.tiktok} />
      <HandleDot label="yt" value={handles.youtube} />
    </div>
  );
}

function AppStoreRow({
  apps,
  loading,
}: {
  apps: AppStoresPayload | null;
  loading: boolean;
}) {
  if (loading && !apps) {
    return (
      <div className="flex items-center gap-1.5">
        <Smartphone className="w-3 h-3 text-white/30" />
        <BadgeSkel width={50} />
        <BadgeSkel width={60} />
      </div>
    );
  }
  if (!apps) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-white/30">
        <Smartphone className="w-3 h-3" /> app stores <Dash />
      </div>
    );
  }
  const chip = (label: string, free: boolean, conflicts: string[]) => (
    <span
      title={
        free
          ? `${label} name available`
          : `Conflict${conflicts.length ? `: ${conflicts.slice(0, 2).join(", ")}` : ""}`
      }
      className={`text-[10.5px] px-2 py-0.5 rounded-md font-mono ${
        free
          ? "border border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300"
          : "border border-white/10 bg-white/[0.02] text-white/35 line-through"
      }`}
    >
      {label}
    </span>
  );
  return (
    <div className="flex items-center gap-1.5">
      <Smartphone className="w-3 h-3 text-white/45" />
      {chip("iOS", apps.ios.available, apps.ios.conflicts)}
      {chip("Android", apps.android.available, apps.android.conflicts)}
    </div>
  );
}

function ValuationChip({
  valuation,
  loading,
}: {
  valuation: ValuationPayload | null;
  loading: boolean;
}) {
  if (loading && !valuation) return <BadgeSkel width={68} />;
  if (!valuation) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-white/30">
        <TrendingUp className="w-3 h-3" /> <Dash />
      </span>
    );
  }
  const formatted = valuation.midpoint.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  return (
    <span
      title={
        valuation.factors.length
          ? `Estimate: ${valuation.factors.join(" · ")}`
          : `Low ${valuation.low} · High ${valuation.high}`
      }
      className="inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full border border-[#E8D4B0]/25 bg-[#E8D4B0]/[0.06] text-[#E8D4B0] font-semibold"
    >
      <TrendingUp className="w-3 h-3" /> ≈ {formatted}
    </span>
  );
}

function HistoryNote({
  history,
  loading,
}: {
  history: HistoryPayload | null;
  loading: boolean;
}) {
  if (loading && !history)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-white/35">
        <Clock className="w-3 h-3" /> <BadgeSkel width={110} />
      </span>
    );
  if (!history) return null;
  if (!history.firstSeen && !history.lastSeen) {
    return (
      <span
        title="No Wayback Machine / DNS history on record"
        className="inline-flex items-center gap-1 text-[11px] text-emerald-300/80"
      >
        <Clock className="w-3 h-3" /> never registered
      </span>
    );
  }
  const year = (iso: string | null) => (iso ? iso.slice(0, 4) : "?");
  const flagged = history.flaggedCategories && history.flaggedCategories.length > 0;
  return (
    <span
      title={
        flagged
          ? `Previously flagged: ${(history.flaggedCategories ?? []).join(", ")}`
          : `${history.snapshots} snapshot${history.snapshots === 1 ? "" : "s"} archived`
      }
      className={`inline-flex items-center gap-1 text-[11px] ${flagged ? "text-amber-300/85" : "text-white/50"}`}
    >
      <Clock className="w-3 h-3" /> used {year(history.firstSeen)}–
      {year(history.lastSeen)}
      {flagged && " · flagged"}
    </span>
  );
}

// ── Public component ──────────────────────────────────────────────────────

export interface EnrichmentPanelProps {
  domain: string;
  /** When false, renders in "skeleton frame" mode without firing any fetches.
   *  Useful if the parent wants to hide enrichment behind a disclosure. */
  active?: boolean;
  /** Compact variant renders everything on one line (for dense rows). */
  compact?: boolean;
}

/**
 * Renders the enrichment block for a single domain. Fires the enrichment
 * hook unless `active={false}`. Always safe to mount — failed fetches
 * degrade to dashes, never throw, never block the parent's availability UI.
 */
export default function EnrichmentPanel({
  domain,
  active = true,
  compact = false,
}: EnrichmentPanelProps) {
  const enrichment = useDomainEnrichment(active ? domain : null);
  const { trademark, handles, apps, history, valuation, loading } = enrichment;

  // Anything actively loading OR already resolved — show the row.
  const hasAnything =
    loading.trademark ||
    loading.handles ||
    loading.apps ||
    loading.history ||
    loading.valuation ||
    trademark !== null ||
    handles !== null ||
    apps !== null ||
    history !== null ||
    valuation !== null;

  if (!active || !hasAnything) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 flex-wrap text-white/60">
        <TrademarkBadge tm={trademark} loading={loading.trademark} />
        <ValuationChip valuation={valuation} loading={loading.valuation} />
        <HandleRow handles={handles} loading={loading.handles} />
        <AppStoreRow apps={apps} loading={loading.apps} />
        <HistoryNote history={history} loading={loading.history} />
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/[0.05]">
      <div className="flex items-start gap-4 flex-wrap">
        {/* Column 1: TM + valuation */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <TrademarkBadge tm={trademark} loading={loading.trademark} />
          <ValuationChip valuation={valuation} loading={loading.valuation} />
        </div>

        {/* Column 2: social handles + app stores */}
        <div className="flex flex-col gap-2 min-w-[220px]">
          <HandleRow handles={handles} loading={loading.handles} />
          <AppStoreRow apps={apps} loading={loading.apps} />
        </div>

        {/* Column 3: history note (flex grows to fill the rest) */}
        <div className="flex-1 min-w-[160px] flex items-start">
          {(loading.history || history) && (
            <div className="flex items-center">
              <HistoryNote history={history} loading={loading.history} />
            </div>
          )}
          {!loading.history && history === null && (
            <div className="flex items-center gap-1 text-[11px] text-white/30">
              <Clock className="w-3 h-3" /> history <Dash />
            </div>
          )}
        </div>
      </div>

      {/* Soft disclaimer — AI-sourced, not legal advice */}
      {(trademark?.status === "conflict" ||
        (trademark?.conflicts && trademark.conflicts.length > 0)) && (
        <p className="mt-2 text-[10.5px] text-white/35 leading-relaxed max-w-xl">
          Trademark signal is AI-sourced from global registry knowledge — verify
          with an attorney before filing.
        </p>
      )}
    </div>
  );
}
