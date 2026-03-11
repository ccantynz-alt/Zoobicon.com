"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Radar,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Globe,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react";

interface Competitor {
  name: string;
  domain: string;
  category: string;
  urlCount: number;
}

interface CrawlResult {
  competitor: string;
  url: string;
  timestamp: string;
  status: "success" | "error" | "blocked";
  title?: string;
  description?: string;
  pricing?: string;
  features?: string[];
  techStack?: string[];
  keyChanges?: string[];
  rawTextLength?: number;
  errorMessage?: string;
}

interface IntelReport {
  generatedAt: string;
  competitors: CrawlResult[];
  insights: string[];
  alerts: string[];
}

const ADMIN_KEY = "zoobicon-admin-2024";

export default function IntelPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [report, setReport] = useState<IntelReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [error, setError] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/intel/crawl", {
      headers: { "x-admin-key": ADMIN_KEY },
    })
      .then((res) => res.json())
      .then((data) => setCompetitors(data.competitors || []))
      .catch(() => {});
  }, []);

  const runCrawl = async (competitor?: string) => {
    setIsCrawling(true);
    setError("");
    try {
      const res = await fetch("/api/intel/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": ADMIN_KEY,
        },
        body: JSON.stringify(competitor ? { competitor } : {}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Crawl failed");
      }

      const data = await res.json();
      if (competitor) {
        // Single competitor crawl — show results inline
        setReport((prev) => ({
          generatedAt: new Date().toISOString(),
          competitors: [...(prev?.competitors || []).filter(r => r.competitor !== competitor), ...data.results],
          insights: prev?.insights || [],
          alerts: prev?.alerts || [],
        }));
      } else {
        setReport(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crawl failed");
    } finally {
      setIsCrawling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "blocked":
        return <Shield className="w-4 h-4 text-amber-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  const filteredResults = report?.competitors.filter(
    (r) => !selectedCompetitor || r.competitor === selectedCompetitor
  ) || [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-white/30 hover:text-white/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                <Radar className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Competitive Intelligence</h1>
                <p className="text-xs text-white/30">
                  Monitor competitors. Stay ahead.
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => runCrawl()}
            disabled={isCrawling}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40"
          >
            {isCrawling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isCrawling ? "Crawling..." : "Crawl All"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Alerts */}
        {report?.alerts && report.alerts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alerts ({report.alerts.length})
            </h2>
            <div className="grid gap-2">
              {report.alerts.map((alert, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm text-amber-200/80"
                >
                  {alert}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitor Grid */}
        <div>
          <h2 className="text-sm font-semibold text-white/50 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Tracked Competitors ({competitors.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {competitors.map((c) => (
              <button
                key={c.name}
                onClick={() => {
                  setSelectedCompetitor(
                    selectedCompetitor === c.name ? null : c.name
                  );
                }}
                className={`p-4 rounded-xl border transition-all text-left ${
                  selectedCompetitor === c.name
                    ? "bg-brand-500/10 border-brand-500/30"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/10"
                }`}
              >
                <div className="text-sm font-semibold mb-1">{c.name}</div>
                <div className="text-[10px] text-white/30">{c.domain}</div>
                <div
                  className={`text-[9px] mt-2 px-2 py-0.5 rounded-full inline-block ${
                    c.category === "direct"
                      ? "bg-red-500/10 text-red-400"
                      : c.category === "emerging"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {c.category}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    runCrawl(c.name);
                  }}
                  disabled={isCrawling}
                  className="mt-2 text-[10px] text-brand-400/60 hover:text-brand-400 transition-colors block"
                >
                  Crawl now
                </button>
              </button>
            ))}
          </div>
        </div>

        {/* Insights */}
        {report?.insights && report.insights.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Insights
            </h2>
            <div className="grid gap-2">
              {report.insights.map((insight, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-sm text-emerald-200/80"
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crawl Results */}
        {filteredResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/50 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Crawl Results ({filteredResults.length})
              </h2>
              {report?.generatedAt && (
                <span className="text-[10px] text-white/20">
                  {new Date(report.generatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {filteredResults.map((result, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(result.status)}
                        <span className="font-semibold text-sm">
                          {result.competitor}
                        </span>
                      </div>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-400/60 hover:text-brand-400 transition-colors"
                      >
                        {result.url}
                      </a>
                    </div>
                    {result.rawTextLength && (
                      <span className="text-[10px] text-white/20">
                        {result.rawTextLength.toLocaleString()} chars
                      </span>
                    )}
                  </div>

                  {result.title && (
                    <div className="mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-white/20">
                        Title
                      </span>
                      <p className="text-sm text-white/70">{result.title}</p>
                    </div>
                  )}

                  {result.pricing && (
                    <div className="mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-amber-400/60">
                        Pricing
                      </span>
                      <p className="text-sm text-white/70">{result.pricing}</p>
                    </div>
                  )}

                  {result.features && result.features.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400/60">
                        Features
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.features.map((f, j) => (
                          <span
                            key={j}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400/80"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.techStack && result.techStack.length > 0 && (
                    <div className="mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-blue-400/60">
                        Tech
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.techStack.map((t, j) => (
                          <span
                            key={j}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400/80"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.keyChanges && result.keyChanges.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-red-400/60">
                        Key Changes
                      </span>
                      <ul className="mt-1 space-y-1">
                        {result.keyChanges.map((change, j) => (
                          <li
                            key={j}
                            className="text-xs text-white/60 flex items-start gap-2"
                          >
                            <span className="text-red-400 mt-0.5">*</span>
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.errorMessage && (
                    <p className="text-xs text-red-400/60 mt-2">
                      {result.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!report && !isCrawling && (
          <div className="text-center py-16">
            <Radar className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 mb-2">No crawl data yet</p>
            <p className="text-xs text-white/15 mb-6">
              Click &quot;Crawl All&quot; to run your first competitive intelligence sweep.
            </p>
            <button
              onClick={() => runCrawl()}
              className="px-6 py-2.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors text-sm font-medium"
            >
              Start First Crawl
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
