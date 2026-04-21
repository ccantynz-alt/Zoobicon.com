"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BackgroundEffects from "@/components/BackgroundEffects";
import {
  ArrowLeft,
  Radar,
  Loader2,
  RefreshCw,
  Globe,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Monitor,
  Video,
  Code2,
  Filter,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Activity,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Snapshot {
  id: number;
  competitor_name: string;
  url: string;
  category: string;
  title: string;
  description: string;
  pricing: string;
  features: string[];
  crawled_at: string;
}

interface Change extends Snapshot {
  prev_title: string | null;
  prev_pricing: string | null;
  prev_features: string[] | null;
}

interface Stats {
  total_crawls: number;
  competitors_tracked: number;
  first_crawl: string | null;
  last_crawl: string | null;
}

interface CrawlResult {
  status: string;
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
  duration: number;
  findings: Array<{
    severity: string;
    category: string;
    title: string;
    description: string;
  }>;
}

type CategoryFilter = "all" | "website-builder" | "video-generator" | "code-tool";
type TabId = "dashboard" | "changes" | "competitors";

// ---------------------------------------------------------------------------
// Category meta
// ---------------------------------------------------------------------------

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof Globe; color: string }
> = {
  "website-builder": { label: "Website Builders", icon: Globe, color: "text-stone-400" },
  "video-generator": { label: "Video Generators", icon: Video, color: "text-stone-400" },
  "code-tool": { label: "Code Tools", icon: Code2, color: "text-stone-400" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-stone-500/20 text-stone-400 border-stone-500/30";
    case "error":
      return "bg-stone-500/15 text-stone-400 border-stone-500/20";
    case "warning":
      return "bg-stone-500/15 text-stone-400 border-stone-500/20";
    case "info":
      return "bg-stone-500/15 text-stone-400 border-stone-500/20";
    default:
      return "bg-gray-500/15 text-gray-400 border-gray-500/20";
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketIntelPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<CrawlResult | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);

  // Fetch data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const url =
        categoryFilter !== "all"
          ? `/api/market-intel?category=${categoryFilter}`
          : "/api/market-intel";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSnapshots(data.snapshots || []);
      setChanges(data.changes || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Trigger manual crawl
  const triggerCrawl = async () => {
    setIsCrawling(true);
    setCrawlResult(null);
    setError("");
    try {
      const res = await fetch("/api/market-intel", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Crawl failed");
      }
      const data: CrawlResult = await res.json();
      setCrawlResult(data);
      // Refresh data after crawl
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crawl failed");
    } finally {
      setIsCrawling(false);
    }
  };

  // Filter snapshots
  const filteredSnapshots =
    categoryFilter === "all"
      ? snapshots
      : snapshots.filter((s) => s.category === categoryFilter);

  // Group by category
  const byCategory = filteredSnapshots.reduce(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {} as Record<string, Snapshot[]>
  );

  // Count changes by severity
  const criticalFindings = crawlResult?.findings?.filter((f) => f.severity === "critical") || [];
  const warningFindings = crawlResult?.findings?.filter((f) => f.severity === "warning") || [];

  const tabs: { id: TabId; label: string; icon: typeof Radar }[] = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "changes", label: "Change Log", icon: TrendingUp },
    { id: "competitors", label: "Competitors", icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-[#0f2148] text-white">
      <BackgroundEffects />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-[#0f2148]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-stone-500 to-stone-600">
                  <Radar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Market Intelligence</h1>
                  <p className="text-xs text-gray-400">
                    Product features, pricing, and positioning tracker
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Category filter */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                  className="appearance-none rounded-lg border border-white/10 bg-white/5 px-4 py-2 pr-8 text-sm text-white focus:border-stone-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="website-builder">Website Builders</option>
                  <option value="video-generator">Video Generators</option>
                  <option value="code-tool">Code Tools</option>
                </select>
                <Filter className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Refresh */}
              <button
                onClick={loadData}
                disabled={isLoading}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>

              {/* Crawl Now */}
              <button
                onClick={triggerCrawl}
                disabled={isCrawling}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-stone-600 to-stone-600 px-4 py-2 text-sm font-medium text-white hover:from-stone-500 hover:to-stone-500 transition-colors disabled:opacity-50"
              >
                {isCrawling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <Radar className="h-4 w-4" />
                    Crawl Now
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-stone-500/20 bg-stone-500/10 px-4 py-3 text-stone-400">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Crawl result banner */}
        {crawlResult && (
          <div className="mb-6 rounded-lg border border-stone-500/20 bg-stone-500/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-stone-400" />
                <div>
                  <p className="text-sm font-medium text-stone-300">
                    Crawl Complete in {((crawlResult.duration || 0) / 1000).toFixed(1)}s
                  </p>
                  <p className="text-xs text-gray-400">
                    {crawlResult.tasksCompleted}/{crawlResult.tasksTotal} competitors crawled
                    {crawlResult.tasksFailed > 0 && ` (${crawlResult.tasksFailed} failed)`}
                  </p>
                </div>
              </div>
              {(criticalFindings.length > 0 || warningFindings.length > 0) && (
                <div className="flex items-center gap-2">
                  {criticalFindings.length > 0 && (
                    <span className="rounded-full bg-stone-500/20 px-3 py-1 text-xs font-medium text-stone-400">
                      {criticalFindings.length} critical
                    </span>
                  )}
                  {warningFindings.length > 0 && (
                    <span className="rounded-full bg-stone-500/20 px-3 py-1 text-xs font-medium text-stone-400">
                      {warningFindings.length} warnings
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Show findings */}
            {crawlResult.findings && crawlResult.findings.length > 0 && (
              <div className="mt-3 space-y-2">
                {crawlResult.findings.map((f, i) => (
                  <div
                    key={i}
                    className={`rounded-md border px-3 py-2 text-xs ${severityColor(f.severity)}`}
                  >
                    <span className="font-medium">{f.title}</span>
                    {f.description && (
                      <span className="ml-2 opacity-80">{f.description}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
          </div>
        )}

        {/* Dashboard Tab */}
        {!isLoading && activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Competitors Tracked"
                value={stats?.competitors_tracked || filteredSnapshots.length}
                icon={Monitor}
                color="violet"
              />
              <StatCard
                label="Total Crawls"
                value={stats?.total_crawls || 0}
                icon={Radar}
                color="blue"
              />
              <StatCard
                label="Changes Detected"
                value={changes.length}
                icon={TrendingUp}
                color="yellow"
              />
              <StatCard
                label="Last Crawl"
                value={stats?.last_crawl ? timeAgo(stats.last_crawl) : "Never"}
                icon={Clock}
                color="green"
                isText
              />
            </div>

            {/* Competitor cards by category */}
            {Object.entries(byCategory).map(([cat, items]) => {
              const meta = CATEGORY_META[cat] || {
                label: cat,
                icon: Globe,
                color: "text-gray-400",
              };
              const CatIcon = meta.icon;

              return (
                <div key={cat}>
                  <div className="mb-4 flex items-center gap-2">
                    <CatIcon className={`h-5 w-5 ${meta.color}`} />
                    <h2 className="text-lg font-semibold">{meta.label}</h2>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">
                      {items.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((snap) => (
                      <CompetitorCard
                        key={snap.id}
                        snapshot={snap}
                        expanded={expandedCompetitor === snap.competitor_name}
                        onToggle={() =>
                          setExpandedCompetitor(
                            expandedCompetitor === snap.competitor_name
                              ? null
                              : snap.competitor_name
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {filteredSnapshots.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 py-20">
                <Radar className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-lg font-medium text-gray-300">No data yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Click &quot;Crawl Now&quot; to start monitoring competitors
                </p>
              </div>
            )}
          </div>
        )}

        {/* Changes Tab */}
        {!isLoading && activeTab === "changes" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Change Log</h2>
            <p className="text-sm text-gray-400">
              Timeline of detected changes across all monitored competitors.
            </p>

            {changes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 py-16">
                <TrendingUp className="h-10 w-10 text-gray-500 mb-3" />
                <p className="text-gray-300">No changes detected yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Changes appear after at least two crawl snapshots exist
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {changes.map((change) => (
                  <ChangeCard key={`${change.id}-${change.competitor_name}`} change={change} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Competitors Tab */}
        {!isLoading && activeTab === "competitors" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">All Competitors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="pb-3 pr-4 font-medium">Competitor</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium">Pricing</th>
                    <th className="pb-3 pr-4 font-medium">Features</th>
                    <th className="pb-3 font-medium">Last Crawl</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSnapshots.map((snap) => (
                    <tr key={snap.id} className="hover:bg-white/5">
                      <td className="py-3 pr-4 font-medium">
                        <a
                          href={snap.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-stone-400 hover:text-stone-300"
                        >
                          {snap.competitor_name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            snap.category === "website-builder"
                              ? "bg-stone-500/20 text-stone-400"
                              : snap.category === "video-generator"
                                ? "bg-stone-500/20 text-stone-400"
                                : "bg-stone-500/20 text-stone-400"
                          }`}
                        >
                          {CATEGORY_META[snap.category]?.label || snap.category}
                        </span>
                      </td>
                      <td className="py-3 pr-4 max-w-[200px] truncate text-gray-300">
                        {snap.title || "-"}
                      </td>
                      <td className="py-3 pr-4">
                        {snap.pricing ? (
                          <span className="flex items-center gap-1 text-stone-400">
                            <DollarSign className="h-3 w-3" />
                            <span className="max-w-[180px] truncate">{snap.pricing}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-gray-300">{snap.features?.length || 0} detected</span>
                      </td>
                      <td className="py-3 text-gray-400">
                        {snap.crawled_at ? timeAgo(snap.crawled_at) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  isText,
}: {
  label: string;
  value: number | string;
  icon: typeof Globe;
  color: string;
  isText?: boolean;
}) {
  const colorMap: Record<string, string> = {
    violet: "from-stone-500/20 to-stone-600/10 border-stone-500/20",
    blue: "from-stone-500/20 to-stone-600/10 border-stone-500/20",
    yellow: "from-stone-500/20 to-stone-600/10 border-stone-500/20",
    green: "from-stone-500/20 to-stone-600/10 border-stone-500/20",
  };
  const iconColor: Record<string, string> = {
    violet: "text-stone-400",
    blue: "text-stone-400",
    yellow: "text-stone-400",
    green: "text-stone-400",
  };

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 ${colorMap[color] || colorMap.violet}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <Icon className={`h-5 w-5 ${iconColor[color] || "text-gray-400"}`} />
      </div>
      <p className={`mt-2 ${isText ? "text-lg" : "text-3xl"} font-bold`}>{value}</p>
    </div>
  );
}

function CompetitorCard({
  snapshot,
  expanded,
  onToggle,
}: {
  snapshot: Snapshot;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = CATEGORY_META[snapshot.category];

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/10`}
          >
            {meta ? <meta.icon className={`h-4 w-4 ${meta.color}`} /> : <Globe className="h-4 w-4 text-gray-400" />}
          </div>
          <div>
            <p className="font-medium">{snapshot.competitor_name}</p>
            <p className="text-xs text-gray-400">
              {snapshot.crawled_at ? timeAgo(snapshot.crawled_at) : "Not crawled"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {snapshot.features && snapshot.features.length > 0 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
              {snapshot.features.length} features
            </span>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 p-4 space-y-3">
          {snapshot.title && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Page Title</p>
              <p className="mt-0.5 text-sm text-gray-200">{snapshot.title}</p>
            </div>
          )}
          {snapshot.description && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Description</p>
              <p className="mt-0.5 text-sm text-gray-300">
                {snapshot.description.slice(0, 200)}
                {snapshot.description.length > 200 ? "..." : ""}
              </p>
            </div>
          )}
          {snapshot.pricing && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Pricing Detected</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-stone-400">
                <DollarSign className="h-3 w-3" />
                {snapshot.pricing}
              </p>
            </div>
          )}
          {snapshot.features && snapshot.features.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase">Features Detected</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {snapshot.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-gray-300"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
          <a
            href={snapshot.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-300"
          >
            Visit site
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function ChangeCard({ change }: { change: Change }) {
  const titleChanged = change.prev_title && change.prev_title !== change.title;
  const pricingChanged = change.prev_pricing && change.prev_pricing !== change.pricing;
  const featuresChanged =
    change.prev_features &&
    JSON.stringify(change.prev_features) !== JSON.stringify(change.features);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-500/20">
            <Zap className="h-4 w-4 text-stone-400" />
          </div>
          <div>
            <p className="font-medium">{change.competitor_name}</p>
            <p className="text-xs text-gray-400">{timeAgo(change.crawled_at)}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            change.category === "website-builder"
              ? "bg-stone-500/20 text-stone-400"
              : change.category === "video-generator"
                ? "bg-stone-500/20 text-stone-400"
                : "bg-stone-500/20 text-stone-400"
          }`}
        >
          {CATEGORY_META[change.category]?.label || change.category}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {titleChanged && (
          <div className="rounded-md bg-white/5 p-2 text-xs">
            <span className="font-medium text-gray-400">Title:</span>{" "}
            <span className="line-through text-stone-400/70">{change.prev_title}</span>
            {" -> "}
            <span className="text-stone-400">{change.title}</span>
          </div>
        )}
        {pricingChanged && (
          <div className="rounded-md bg-stone-500/10 border border-stone-500/20 p-2 text-xs">
            <span className="font-medium text-stone-400">Pricing Change:</span>{" "}
            <span className="line-through text-stone-400/70">{change.prev_pricing}</span>
            {" -> "}
            <span className="text-stone-400">{change.pricing}</span>
          </div>
        )}
        {featuresChanged && (
          <div className="rounded-md bg-stone-500/10 border border-stone-500/20 p-2 text-xs">
            <span className="font-medium text-stone-400">Feature Change:</span>{" "}
            <span className="text-gray-300">
              {change.features?.length || 0} features now (was{" "}
              {change.prev_features?.length || 0})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
