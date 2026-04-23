"use client";

import { useState, useEffect, useCallback } from "react";
import {
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
  "website-builder": { label: "Website Builders", icon: Globe, color: "text-blue-600" },
  "video-generator": { label: "Video Generators", icon: Video, color: "text-purple-600" },
  "code-tool": { label: "Code Tools", icon: Code2, color: "text-slate-600" },
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
      return "bg-red-50 text-red-600 border-red-200";
    case "error":
      return "bg-orange-50 text-orange-600 border-orange-200";
    case "warning":
      return "bg-amber-50 text-amber-600 border-amber-200";
    case "info":
      return "bg-blue-50 text-blue-600 border-blue-200";
    default:
      return "bg-gray-50 text-gray-500 border-gray-200";
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-violet-200">
              <Radar className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Market Intelligence</h1>
              <p className="text-xs text-slate-700">
                Product features, pricing, and positioning tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Category filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="appearance-none rounded-lg border border-slate-200 bg-white px-4 py-2 pr-8 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="website-builder">Website Builders</option>
                <option value="video-generator">Video Generators</option>
                <option value="code-tool">Code Tools</option>
              </select>
              <Filter className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            </div>

            {/* Refresh */}
            <button
              onClick={loadData}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* Crawl Now */}
            <button
              onClick={triggerCrawl}
              disabled={isCrawling}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-600 hover:to-indigo-700 transition-colors disabled:opacity-50"
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
        <div className="mt-4 flex gap-1 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-indigo-500 text-slate-800"
                  : "border-transparent text-slate-600 hover:text-slate-600"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div>
        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Crawl result banner */}
        {crawlResult && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    Crawl Complete in {((crawlResult.duration || 0) / 1000).toFixed(1)}s
                  </p>
                  <p className="text-xs text-slate-700">
                    {crawlResult.tasksCompleted}/{crawlResult.tasksTotal} competitors crawled
                    {crawlResult.tasksFailed > 0 && ` (${crawlResult.tasksFailed} failed)`}
                  </p>
                </div>
              </div>
              {(criticalFindings.length > 0 || warningFindings.length > 0) && (
                <div className="flex items-center gap-2">
                  {criticalFindings.length > 0 && (
                    <span className="rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-medium text-red-600">
                      {criticalFindings.length} critical
                    </span>
                  )}
                  {warningFindings.length > 0 && (
                    <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-600">
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
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
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
                    <h2 className="text-lg font-semibold text-slate-800">{meta.label}</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
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
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-20">
                <Radar className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-lg font-medium text-slate-600">No data yet</p>
                <p className="mt-1 text-sm text-slate-600">
                  Click &quot;Crawl Now&quot; to start monitoring competitors
                </p>
              </div>
            )}
          </div>
        )}

        {/* Changes Tab */}
        {!isLoading && activeTab === "changes" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Change Log</h2>
            <p className="text-sm text-slate-700">
              Timeline of detected changes across all monitored competitors.
            </p>

            {changes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-16">
                <TrendingUp className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-600">No changes detected yet</p>
                <p className="mt-1 text-sm text-slate-600">
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
            <h2 className="text-lg font-semibold text-slate-800">All Competitors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-700">
                    <th className="pb-3 pr-4 font-medium">Competitor</th>
                    <th className="pb-3 pr-4 font-medium">Category</th>
                    <th className="pb-3 pr-4 font-medium">Title</th>
                    <th className="pb-3 pr-4 font-medium">Pricing</th>
                    <th className="pb-3 pr-4 font-medium">Features</th>
                    <th className="pb-3 font-medium">Last Crawl</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSnapshots.map((snap) => (
                    <tr key={snap.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-medium">
                        <a
                          href={snap.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700"
                        >
                          {snap.competitor_name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            snap.category === "website-builder"
                              ? "bg-blue-50 text-blue-600"
                              : snap.category === "video-generator"
                                ? "bg-purple-50 text-purple-600"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {CATEGORY_META[snap.category]?.label || snap.category}
                        </span>
                      </td>
                      <td className="py-3 pr-4 max-w-[200px] truncate text-slate-700">
                        {snap.title || "-"}
                      </td>
                      <td className="py-3 pr-4">
                        {snap.pricing ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <DollarSign className="h-3 w-3" />
                            <span className="max-w-[180px] truncate">{snap.pricing}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-slate-600">{snap.features?.length || 0} detected</span>
                      </td>
                      <td className="py-3 text-slate-600">
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
    violet: "from-violet-50 to-violet-100/50 border-violet-200",
    blue: "from-blue-50 to-blue-100/50 border-blue-200",
    yellow: "from-yellow-50 to-yellow-100/50 border-yellow-200",
    green: "from-green-50 to-green-100/50 border-green-200",
  };
  const iconColor: Record<string, string> = {
    violet: "text-violet-500",
    blue: "text-blue-500",
    yellow: "text-yellow-600",
    green: "text-green-500",
  };

  return (
    <div
      className={`rounded-xl border bg-gradient-to-br p-5 ${colorMap[color] || colorMap.violet}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-700">{label}</p>
        <Icon className={`h-5 w-5 ${iconColor[color] || "text-slate-600"}`} />
      </div>
      <p className={`mt-2 ${isText ? "text-lg" : "text-3xl"} font-bold text-slate-800`}>{value}</p>
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
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100`}
          >
            {meta ? <meta.icon className={`h-4 w-4 ${meta.color}`} /> : <Globe className="h-4 w-4 text-slate-600" />}
          </div>
          <div>
            <p className="font-medium text-slate-800">{snapshot.competitor_name}</p>
            <p className="text-xs text-slate-600">
              {snapshot.crawled_at ? timeAgo(snapshot.crawled_at) : "Not crawled"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {snapshot.features && snapshot.features.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {snapshot.features.length} features
            </span>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-600" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 p-4 space-y-3">
          {snapshot.title && (
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Page Title</p>
              <p className="mt-0.5 text-sm text-slate-700">{snapshot.title}</p>
            </div>
          )}
          {snapshot.description && (
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Description</p>
              <p className="mt-0.5 text-sm text-slate-600">
                {snapshot.description.slice(0, 200)}
                {snapshot.description.length > 200 ? "..." : ""}
              </p>
            </div>
          )}
          {snapshot.pricing && (
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Pricing Detected</p>
              <p className="mt-0.5 flex items-center gap-1 text-sm text-emerald-600">
                <DollarSign className="h-3 w-3" />
                {snapshot.pricing}
              </p>
            </div>
          )}
          {snapshot.features && snapshot.features.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase">Features Detected</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {snapshot.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
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
            className="inline-flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600"
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
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-slate-800">{change.competitor_name}</p>
            <p className="text-xs text-slate-600">{timeAgo(change.crawled_at)}</p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            change.category === "website-builder"
              ? "bg-blue-50 text-blue-600"
              : change.category === "video-generator"
                ? "bg-purple-50 text-purple-600"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {CATEGORY_META[change.category]?.label || change.category}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {titleChanged && (
          <div className="rounded-md bg-slate-50 p-2 text-xs">
            <span className="font-medium text-slate-700">Title:</span>{" "}
            <span className="line-through text-slate-600">{change.prev_title}</span>
            {" -> "}
            <span className="text-slate-700">{change.title}</span>
          </div>
        )}
        {pricingChanged && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs">
            <span className="font-medium text-amber-600">Pricing Change:</span>{" "}
            <span className="line-through text-amber-400">{change.prev_pricing}</span>
            {" -> "}
            <span className="text-amber-700">{change.pricing}</span>
          </div>
        )}
        {featuresChanged && (
          <div className="rounded-md bg-blue-50 border border-blue-200 p-2 text-xs">
            <span className="font-medium text-blue-600">Feature Change:</span>{" "}
            <span className="text-slate-700">
              {change.features?.length || 0} features now (was{" "}
              {change.prev_features?.length || 0})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
