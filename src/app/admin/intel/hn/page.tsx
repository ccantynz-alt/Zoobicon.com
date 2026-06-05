"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Loader2,
  RefreshCw,
  Filter,
  TrendingUp,
  Heart,
  Zap,
  Target,
  Sparkles,
  Mail,
  ListChecks,
  ClipboardCopy,
  Check,
} from "lucide-react";

type PainkillerType = "pain" | "feature" | "competitor_weakness" | "viral_demo";
type Status = "new" | "triaged" | "building" | "shipped" | "dismissed";

interface Painkiller {
  id: string;
  thread_hn_id: number;
  type: PainkillerType;
  competitor: string | null;
  summary: string;
  evidence: string;
  mentions: number;
  sentiment: number;
  confidence: number;
  status: Status;
  created_at: string;
  thread_title: string;
  thread_url: string;
}

interface Digest {
  digest_date: string;
  thread_count: number;
  painkiller_count: number;
  summary_md: string;
  created_at: string;
}

const TYPE_META: Record<PainkillerType, { label: string; icon: typeof Heart; color: string }> = {
  pain: { label: "Pain", icon: Heart, color: "rose" },
  feature: { label: "Feature gap", icon: Sparkles, color: "amber" },
  competitor_weakness: { label: "Competitor weakness", icon: Target, color: "emerald" },
  viral_demo: { label: "Viral demo", icon: Zap, color: "violet" },
};

const STATUSES: Status[] = ["new", "triaged", "building", "shipped", "dismissed"];

export default function HnFlywheelPage() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [painkillers, setPainkillers] = useState<Painkiller[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const loadDigest = useCallback(async () => {
    try {
      const res = await fetch("/api/intel/hn/digest", { cache: "no-store" });
      const data = (await res.json()) as { digest: Digest | null };
      setDigest(data.digest);
    } catch {
      // ignore
    }
  }, []);

  const loadPainkillers = useCallback(async () => {
    try {
      const url = statusFilter === "all"
        ? "/api/intel/hn/painkillers?limit=100"
        : `/api/intel/hn/painkillers?limit=100&status=${statusFilter}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as { painkillers: Painkiller[] };
      setPainkillers(data.painkillers || []);
    } catch {
      setPainkillers([]);
    }
  }, [statusFilter]);

  useEffect(() => {
    void Promise.all([loadDigest(), loadPainkillers()]).finally(() => setLoading(false));
  }, [loadDigest, loadPainkillers]);

  const runNow = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      // Note: in production this needs ?secret=... — for admin manual
      // trigger, the route honours requests without secret when
      // CRON_SECRET isn't set, and admin auth covers the rest.
      const res = await fetch("/api/intel/hn/run", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setRunResult(
        `✓ Polled ${data.poll?.scanned || 0} stories (${data.poll?.inserted || 0} new) · harvested ${data.harvest?.harvested || 0} · extracted ${data.extract?.extracted || 0} painkillers · digest written: ${data.digest ? "yes" : "no"}`
      );
      await Promise.all([loadDigest(), loadPainkillers()]);
    } catch (err) {
      setRunResult(`✗ ${err instanceof Error ? err.message : "Run failed"}`);
    } finally {
      setRunning(false);
    }
  };

  const emailDigest = async () => {
    setEmailing(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/intel/hn/email", { cache: "no-store" });
      const data = (await res.json()) as { ok: boolean; sent: boolean; reason?: string };
      if (!res.ok || !data.ok) throw new Error(data.reason || `HTTP ${res.status}`);
      setEmailResult(`✓ Digest emailed`);
    } catch (err) {
      setEmailResult(`✗ ${err instanceof Error ? err.message : "Email failed"}`);
    } finally {
      setEmailing(false);
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    // optimistic
    setPainkillers((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    try {
      await fetch("/api/intel/hn/painkillers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch {
      // rollback would be nice but the next reload will fix it
    }
  };

  const promote = async (id: string) => {
    setPromotingId(id);
    try {
      await updateStatus(id, "triaged");
    } finally {
      setPromotingId(null);
    }
  };

  const exportRoadmap = async () => {
    setExporting(true);
    setExportResult(null);
    try {
      const res = await fetch("/api/intel/hn/roadmap-md?as=json", { cache: "no-store" });
      const data = (await res.json()) as { markdown: string; count: number };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await navigator.clipboard.writeText(data.markdown);
      setExportResult(`✓ Copied ${data.count} roadmap item${data.count === 1 ? "" : "s"} to clipboard — paste into CLAUDE.md`);
    } catch (err) {
      setExportResult(`✗ ${err instanceof Error ? err.message : "Export failed"}`);
    } finally {
      setExporting(false);
    }
  };

  const roadmapCount = painkillers.filter(
    (p) => p.status === "triaged" || p.status === "building"
  ).length;

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto" style={{ color: "var(--ink)" }}>
      {/* Source toggle — HN | Reddit cross-link */}
      <div className="flex items-center gap-1 mb-6">
        <span
          className="px-3 py-1 rounded-full text-[11px] font-medium"
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
            border: "1px solid var(--ink)",
          }}
        >
          Hacker News
        </span>
        <Link
          href="/admin/intel/reddit"
          className="px-3 py-1 rounded-full text-[11px] font-medium transition-colors"
          style={{
            background: "transparent",
            color: "var(--ink-secondary)",
            border: "1px solid var(--rule)",
          }}
        >
          Reddit
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div
            className="inline-flex items-center gap-1.5 mb-3 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <TrendingUp className="w-3 h-3" />
            Intel Flywheel
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">Hacker News</h1>
          <p className="mt-2 text-[14px]" style={{ color: "var(--ink-secondary)" }}>
            Painkillers extracted from HN comment threads on AI builders.{" "}
            <span style={{ color: "var(--ink)" }}>What developers complain about → what we build next.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportRoadmap}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--paper-elevated)",
              color: "var(--ink)",
              border: "1px solid var(--rule-strong)",
            }}
            title="Copy triaged + building items as markdown for CLAUDE.md"
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
            {exporting ? "Copying…" : "Export roadmap"}
          </button>
          <button
            onClick={emailDigest}
            disabled={emailing || !digest}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--paper-elevated)",
              color: "var(--ink)",
              border: "1px solid var(--rule-strong)",
            }}
          >
            {emailing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            {emailing ? "Sending…" : "Email digest"}
          </button>
          <button
            onClick={runNow}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
            }}
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {running ? "Running…" : "Run pipeline now"}
          </button>
        </div>
      </div>

      {runResult && (
        <div
          className="mb-3 px-4 py-3 rounded-xl text-[13px]"
          style={{
            background: "var(--paper-elevated)",
            border: "1px solid var(--rule)",
            color: "var(--ink-secondary)",
          }}
        >
          {runResult}
        </div>
      )}

      {emailResult && (
        <div
          className="mb-3 px-4 py-3 rounded-xl text-[13px]"
          style={{
            background: "var(--paper-elevated)",
            border: "1px solid var(--rule)",
            color: "var(--ink-secondary)",
          }}
        >
          {emailResult}
        </div>
      )}

      {exportResult && (
        <div
          className="mb-6 px-4 py-3 rounded-xl text-[13px]"
          style={{
            background: "var(--paper-elevated)",
            border: "1px solid var(--rule)",
            color: "var(--ink-secondary)",
          }}
        >
          {exportResult}
        </div>
      )}

      {/* Roadmap strip — shows count of items already promoted */}
      {roadmapCount > 0 && (
        <div
          className="mb-6 flex items-center justify-between rounded-xl px-5 py-3"
          style={{
            background: "var(--gold-soft)",
            border: "1px solid var(--gold)",
            color: "var(--ink)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <ListChecks className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
            <span className="text-[13px]">
              <strong>{roadmapCount}</strong> painkiller{roadmapCount === 1 ? "" : "s"} promoted to roadmap
              <span className="ml-1.5" style={{ color: "var(--ink-secondary)" }}>
                (triaged + building)
              </span>
            </span>
          </div>
          <button
            onClick={() => setStatusFilter("triaged")}
            className="text-[12px] underline"
            style={{ color: "var(--gold-deep)" }}
          >
            View triaged →
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--ink-muted)" }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}

      {/* Digest summary */}
      {!loading && digest && (
        <section
          className="mb-10 rounded-2xl p-6"
          style={{
            background: "var(--paper-elevated)",
            border: "1px solid var(--rule)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--gold-deep)" }}>
                Today&apos;s digest · {digest.digest_date}
              </div>
              <div className="mt-2 flex items-baseline gap-4">
                <div>
                  <span className="text-3xl font-semibold">{digest.thread_count}</span>
                  <span className="ml-1 text-[12px]" style={{ color: "var(--ink-muted)" }}>
                    threads
                  </span>
                </div>
                <div>
                  <span className="text-3xl font-semibold">{digest.painkiller_count}</span>
                  <span className="ml-1 text-[12px]" style={{ color: "var(--ink-muted)" }}>
                    painkillers
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              Updated {new Date(digest.created_at).toLocaleString()}
            </span>
          </div>
          <pre
            className="text-[12px] whitespace-pre-wrap font-mono leading-relaxed"
            style={{ color: "var(--ink-secondary)" }}
          >
            {digest.summary_md}
          </pre>
        </section>
      )}

      {!loading && !digest && (
        <div
          className="mb-10 rounded-2xl p-6 text-[13px]"
          style={{
            background: "var(--paper-elevated)",
            border: "1px solid var(--rule)",
            color: "var(--ink-secondary)",
          }}
        >
          No digest yet. Click <strong>Run pipeline now</strong> above to seed the first one.
        </div>
      )}

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-5">
        <Filter className="w-4 h-4" style={{ color: "var(--ink-muted)" }} />
        <span className="text-[12px]" style={{ color: "var(--ink-muted)" }}>
          Filter:
        </span>
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1 rounded-full text-[11px] font-medium transition-colors"
            style={{
              background: statusFilter === s ? "var(--ink)" : "transparent",
              color: statusFilter === s ? "var(--paper)" : "var(--ink-secondary)",
              border: `1px solid ${statusFilter === s ? "var(--ink)" : "var(--rule)"}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Painkiller list */}
      <div className="space-y-3">
        {painkillers.length === 0 && !loading && (
          <div
            className="rounded-xl p-6 text-[13px] text-center"
            style={{
              background: "var(--paper-elevated)",
              border: "1px solid var(--rule)",
              color: "var(--ink-muted)",
            }}
          >
            No painkillers in this view.
          </div>
        )}

        {painkillers.map((p) => {
          const meta = TYPE_META[p.type] || TYPE_META.pain;
          const Icon = meta.icon;
          const score = (p.mentions * p.confidence).toFixed(2);
          return (
            <article
              key={p.id}
              className="rounded-xl p-5 transition-colors"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: `var(--paper)`,
                        border: "1px solid var(--rule)",
                        color: "var(--ink)",
                      }}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {meta.label}
                    </span>
                    {p.competitor && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: "var(--gold-soft)",
                          color: "var(--gold-deep)",
                          border: "1px solid var(--gold)",
                        }}
                      >
                        {p.competitor}
                      </span>
                    )}
                    <span className="text-[10px] font-mono" style={{ color: "var(--ink-muted)" }}>
                      score {score} · conf {p.confidence.toFixed(2)} · {p.mentions}× mentions
                    </span>
                  </div>
                  <h3 className="text-[15px] font-semibold mb-2 tracking-[-0.01em]">{p.summary}</h3>
                  {p.evidence && (
                    <blockquote
                      className="text-[13px] leading-relaxed italic mb-3 pl-3"
                      style={{
                        borderLeft: "2px solid var(--gold)",
                        color: "var(--ink-secondary)",
                      }}
                    >
                      &ldquo;{p.evidence}&rdquo;
                    </blockquote>
                  )}
                  <a
                    href={p.thread_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px]"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {p.thread_title}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Right-side action column: one-click promote + status dropdown */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {p.status === "new" ? (
                    <button
                      onClick={() => void promote(p.id)}
                      disabled={promotingId === p.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all disabled:opacity-50"
                      style={{
                        background: "var(--ink)",
                        color: "var(--paper)",
                      }}
                      title="Mark as triaged — adds to the export-able roadmap"
                    >
                      {promotingId === p.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ListChecks className="w-3 h-3" />
                      )}
                      Promote
                    </button>
                  ) : p.status === "triaged" || p.status === "building" ? (
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: "var(--gold-soft)",
                        color: "var(--gold-deep)",
                        border: "1px solid var(--gold)",
                      }}
                    >
                      <Check className="w-2.5 h-2.5" />
                      On roadmap
                    </span>
                  ) : null}
                  <select
                    value={p.status}
                    onChange={(e) => void updateStatus(p.id, e.target.value as Status)}
                    className="text-[11px] px-2 py-1 rounded-md"
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--rule)",
                      color: "var(--ink)",
                    }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
