"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Globe2,
  Loader2,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Send,
} from "lucide-react";

interface IndexNowEndpoint {
  url: string;
  ok: boolean;
  status: number;
}

interface SubmitResult {
  ok?: boolean;
  submitted?: number;
  reason?: string;
  endpoints?: IndexNowEndpoint[];
  timestamp?: string;
  sitemapUrl?: string;
  totalUrlsInSitemap?: number;
}

export default function SeoAdminPage() {
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmit, setLastSubmit] = useState<SubmitResult | null>(null);
  const [sitemapUrls, setSitemapUrls] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "compare" | "niche" | "region">("all");
  const [loading, setLoading] = useState(true);

  // ─── Counts by surface ─────────────────────────────────────────
  const counts = {
    all: sitemapUrls.length,
    compare: sitemapUrls.filter((u) => u.includes("/compare/")).length,
    niche: sitemapUrls.filter((u) => u.includes("/ai-website-builder-for/")).length,
    region: sitemapUrls.filter((u) => u.includes("/ai-website-builder-in/")).length,
  };

  const filtered =
    filter === "all"
      ? sitemapUrls
      : filter === "compare"
      ? sitemapUrls.filter((u) => u.includes("/compare/"))
      : filter === "niche"
      ? sitemapUrls.filter((u) => u.includes("/ai-website-builder-for/"))
      : sitemapUrls.filter((u) => u.includes("/ai-website-builder-in/"));

  const fetchSitemap = useCallback(async () => {
    try {
      const res = await fetch("/sitemap.xml", { cache: "no-store" });
      const xml = await res.text();
      const matches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g));
      setSitemapUrls(matches.map((m) => m[1].trim()));
    } catch {
      setSitemapUrls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSitemap();
  }, [fetchSitemap]);

  const submit = async (only?: string) => {
    setSubmitting(true);
    setLastSubmit(null);
    try {
      const url = only ? `/api/seo/submit-sitemap?only=${encodeURIComponent(only)}` : "/api/seo/submit-sitemap";
      const res = await fetch(url, { cache: "no-store" });
      const data = (await res.json()) as SubmitResult;
      setLastSubmit(data);
    } catch (err) {
      setLastSubmit({
        ok: false,
        reason: err instanceof Error ? err.message : "Submit failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto" style={{ color: "var(--ink)" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div
            className="inline-flex items-center gap-1.5 mb-3 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <TrendingUp className="w-3 h-3" />
            Global SEO campaign
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em]">SEO control room</h1>
          <p className="mt-2 text-[14px]" style={{ color: "var(--ink-secondary)" }}>
            Sitemap state + IndexNow submission. Pushes all programmatic URLs to Bing, Yandex, and the IndexNow relay in one call.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchSitemap()}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
            style={{
              background: "var(--paper-elevated)",
              color: "var(--ink)",
              border: "1px solid var(--rule-strong)",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh sitemap
          </button>
          <button
            onClick={() => void submit()}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
            }}
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {submitting ? "Submitting…" : "Submit to IndexNow"}
          </button>
        </div>
      </div>

      {/* Counts by surface */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { id: "all" as const, label: "Total URLs", value: counts.all },
          { id: "compare" as const, label: "Comparison pages", value: counts.compare },
          { id: "niche" as const, label: "Niche pages", value: counts.niche },
          { id: "region" as const, label: "Country pages", value: counts.region },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className="text-left rounded-xl p-4 transition-all"
            style={{
              background: filter === item.id ? "var(--gold-soft)" : "var(--paper-elevated)",
              border: `1px solid ${filter === item.id ? "var(--gold)" : "var(--rule)"}`,
            }}
          >
            <div
              className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-1.5"
              style={{ color: "var(--gold-deep)" }}
            >
              {item.label}
            </div>
            <div className="text-2xl font-semibold tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
              {loading ? "—" : item.value}
            </div>
          </button>
        ))}
      </div>

      {/* Last submission result */}
      {lastSubmit && (
        <div
          className="mb-8 rounded-xl p-5"
          style={{
            background: lastSubmit.ok ? "var(--gold-soft)" : "rgba(239,68,68,0.06)",
            border: `1px solid ${lastSubmit.ok ? "var(--gold)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            {lastSubmit.ok ? (
              <CheckCircle2 className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
            ) : (
              <AlertCircle className="w-4 h-4" style={{ color: "rgb(220, 38, 38)" }} />
            )}
            <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
              {lastSubmit.ok
                ? `Submitted ${lastSubmit.submitted} URLs at ${new Date(lastSubmit.timestamp || "").toLocaleString()}`
                : `Submission failed: ${lastSubmit.reason}`}
            </span>
          </div>

          {lastSubmit.endpoints && lastSubmit.endpoints.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <div
                className="text-[10px] uppercase tracking-[0.18em] font-semibold mb-2"
                style={{ color: "var(--gold-deep)" }}
              >
                Per-endpoint result
              </div>
              {lastSubmit.endpoints.map((ep) => (
                <div key={ep.url} className="flex items-center gap-2 text-[12px]">
                  {ep.ok ? (
                    <CheckCircle2 className="w-3 h-3" style={{ color: "var(--gold-deep)" }} />
                  ) : (
                    <AlertCircle className="w-3 h-3" style={{ color: "rgb(220, 38, 38)" }} />
                  )}
                  <span className="font-mono" style={{ color: "var(--ink-secondary)" }}>
                    {ep.url}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--ink-muted)" }}>
                    HTTP {ep.status || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick submit by surface */}
      <div className="mb-8 rounded-xl p-5" style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Send className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
          <span className="text-[13px] font-semibold">Submit only a slice</span>
        </div>
        <p className="text-[12px] mb-4" style={{ color: "var(--ink-secondary)" }}>
          After shipping a batch of new pages, push just that surface so the IndexNow allowance isn&apos;t spent on URLs you haven&apos;t changed.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void submit("/compare/")}
            disabled={submitting}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors disabled:opacity-50"
            style={{ border: "1px solid var(--rule)", background: "var(--paper)" }}
          >
            Only /compare/* ({counts.compare})
          </button>
          <button
            onClick={() => void submit("/ai-website-builder-for/")}
            disabled={submitting}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors disabled:opacity-50"
            style={{ border: "1px solid var(--rule)", background: "var(--paper)" }}
          >
            Only /ai-website-builder-for/* ({counts.niche})
          </button>
          <button
            onClick={() => void submit("/ai-website-builder-in/")}
            disabled={submitting}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors disabled:opacity-50"
            style={{ border: "1px solid var(--rule)", background: "var(--paper)" }}
          >
            Only /ai-website-builder-in/* ({counts.region})
          </button>
        </div>
      </div>

      {/* Setup checklist */}
      <div className="mb-8 rounded-xl p-5" style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}>
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
          <span className="text-[13px] font-semibold">Setup checklist</span>
        </div>
        <ol className="text-[12px] space-y-2.5" style={{ color: "var(--ink-secondary)" }}>
          <li>
            <strong>1.</strong> Generate any random UUID. Set <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}>INDEXNOW_KEY</code> in Vercel.
          </li>
          <li>
            <strong>2.</strong> Visit <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}>https://zoobicon.com/&lt;that-key&gt;.txt</code> — must return the key (200 OK).
          </li>
          <li>
            <strong>3.</strong> Set <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}>CRON_SECRET</code> in Vercel.
          </li>
          <li>
            <strong>4.</strong> Point Crontech scheduler at <code className="font-mono text-[11px] px-1 py-0.5 rounded" style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}>/api/seo/submit-sitemap?secret=$CRON_SECRET</code> — daily cadence.
          </li>
        </ol>
      </div>

      {/* URL list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--gold-deep)" }}>
            Sitemap URLs ({filtered.length})
          </h2>
          <Link
            href="/sitemap.xml"
            className="inline-flex items-center gap-1 text-[12px]"
            style={{ color: "var(--ink-secondary)" }}
            target="_blank"
          >
            View raw sitemap.xml
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="text-[13px] flex items-center gap-2" style={{ color: "var(--ink-muted)" }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}>
            <div className="max-h-96 overflow-y-auto">
              {filtered.map((url, i) => (
                <a
                  key={url}
                  href={url.startsWith("http") ? url : `https://zoobicon.com${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-black/[0.02] text-[12px] font-mono"
                  style={{
                    borderTop: i === 0 ? "none" : "1px solid var(--rule)",
                    color: "var(--ink)",
                  }}
                >
                  <Globe2 className="w-3 h-3 flex-shrink-0" style={{ color: "var(--ink-muted)" }} />
                  <span className="truncate">{url}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 flex-shrink-0 ml-auto" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
