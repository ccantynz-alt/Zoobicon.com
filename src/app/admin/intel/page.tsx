"use client";

import { useState, useEffect } from "react";
import {
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
  Bell,
  BarChart3,
  Zap,
  Eye,
  DollarSign,
  Layers,
  Activity,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Check,
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

interface IntelAlert {
  id: number;
  created_at: string;
  competitor_name: string;
  alert_type: string;
  severity: string;
  title: string;
  details: string;
  acknowledged: boolean;
}

interface MarketTrend {
  id: number;
  detected_at: string;
  source: string;
  title: string;
  url: string;
  relevance_score: number;
  summary: string;
  category: string;
}

const ADMIN_KEY = typeof window !== "undefined"
  ? (localStorage.getItem("zoobicon_admin_key") || "")
  : "";

// Feature comparison matrix — what we track vs competitors
const FEATURE_MATRIX = [
  { feature: "AI Website Generation", zoobicon: true, lovable: true, bolt: true, v0: true, emergent: true },
  { feature: "Multi-Page Sites", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: true },
  { feature: "Full-Stack Apps (DB+API)", zoobicon: true, lovable: true, bolt: false, v0: false, emergent: true },
  { feature: "E-commerce Generation", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "43+ Specialized Generators", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "Agency White-Label", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "Visual Editor", zoobicon: true, lovable: true, bolt: true, v0: true, emergent: true },
  { feature: "In-Browser Runtime", zoobicon: false, lovable: true, bolt: true, v0: true, emergent: false },
  { feature: "React Output", zoobicon: true, lovable: true, bolt: true, v0: true, emergent: true },
  { feature: "Instant Scaffold (<3s)", zoobicon: true, lovable: false, bolt: true, v0: true, emergent: false },
  { feature: "100+ Templates", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "Email Marketing", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "Booking/Scheduling", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "Invoicing", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "Blog Engine", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "Social Publisher", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "Public API", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: true },
  { feature: "Multi-LLM Support", zoobicon: true, lovable: false, bolt: true, v0: false, emergent: true },
  { feature: "Auto-Pilot (SEO/Perf)", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
  { feature: "Competitive Intel Engine", zoobicon: true, lovable: false, bolt: false, v0: false, emergent: false },
];

const PRICING_MATRIX = [
  { tier: "Free", zoobicon: "$0", lovable: "$0", bolt: "$0", v0: "$0", emergent: "$0" },
  { tier: "Starter/Creator", zoobicon: "$19/mo", lovable: "$20/mo", bolt: "$20/mo", v0: "$20/mo", emergent: "$25/mo" },
  { tier: "Pro", zoobicon: "$49/mo", lovable: "$50/mo", bolt: "$50/mo", v0: "$30/mo", emergent: "$50/mo" },
  { tier: "Agency/Team", zoobicon: "$99/mo", lovable: "$200/mo", bolt: "-", v0: "-", emergent: "$100/mo" },
  { tier: "Enterprise", zoobicon: "$299/mo", lovable: "Custom", bolt: "-", v0: "Custom", emergent: "Custom" },
];

type TabId = "overview" | "matrix" | "alerts" | "trends" | "crawl";

export default function IntelPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [report, setReport] = useState<IntelReport | null>(null);
  const [alerts, setAlerts] = useState<IntelAlert[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [error, setError] = useState("");
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [lastCrawlTime, setLastCrawlTime] = useState<string | null>(null);

  useEffect(() => {
    // Load competitors list
    fetch("/api/intel/crawl", { headers: { "x-admin-key": ADMIN_KEY } })
      .then((res) => res.json())
      .then((data) => setCompetitors(data.competitors || []))
      .catch(() => {});

    // Load alerts from intel API
    fetch("/api/intel?type=alerts&limit=20")
      .then((res) => res.json())
      .then((data) => setAlerts(data.alerts || []))
      .catch(() => {});

    // Load market trends
    fetch("/api/intel?type=trends&days=7")
      .then((res) => res.json())
      .then((data) => setTrends(data.trends || []))
      .catch(() => {});
  }, []);

  const runCrawl = async (competitor?: string) => {
    setIsCrawling(true);
    setError("");
    try {
      const res = await fetch("/api/intel/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": ADMIN_KEY },
        body: JSON.stringify(competitor ? { competitor } : {}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Crawl failed");
      }

      const data = await res.json();
      if (competitor) {
        setReport((prev) => ({
          generatedAt: new Date().toISOString(),
          competitors: [...(prev?.competitors || []).filter((r) => r.competitor !== competitor), ...data.results],
          insights: prev?.insights || [],
          alerts: prev?.alerts || [],
        }));
      } else {
        setReport(data);
      }
      setLastCrawlTime(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crawl failed");
    } finally {
      setIsCrawling(false);
    }
  };

  const triggerFullIntel = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/intel/cron");
      const data = await res.json();
      setLastCrawlTime(new Date().toISOString());
      // Refresh alerts and trends
      const [alertRes, trendRes] = await Promise.all([
        fetch("/api/intel?type=alerts&limit=20"),
        fetch("/api/intel?type=trends&days=7"),
      ]);
      const alertData = await alertRes.json();
      const trendData = await trendRes.json();
      setAlerts(alertData.alerts || []);
      setTrends(trendData.trends || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Intel sweep failed");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "blocked": return <Shield className="w-4 h-4 text-amber-500" />;
      case "error": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "warning": return "text-amber-600 bg-amber-50 border-amber-200";
      case "info": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  const filteredResults = report?.competitors.filter(
    (r) => !selectedCompetitor || r.competitor === selectedCompetitor
  ) || [];

  const competitorNames = ["Zoobicon", "Lovable", "Bolt", "v0", "Emergent"];
  const zoobiconFeatureCount = FEATURE_MATRIX.filter((f) => f.zoobicon).length;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
    { id: "matrix", label: "Feature Matrix", icon: <Layers size={16} /> },
    { id: "alerts", label: "Alerts", icon: <Bell size={16} />, badge: alerts.filter((a) => !a.acknowledged).length },
    { id: "trends", label: "Market Trends", icon: <TrendingUp size={16} /> },
    { id: "crawl", label: "Live Crawl", icon: <Radar size={16} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
            <Radar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Competitive Intelligence</h1>
            <p className="text-xs text-slate-500">
              Always-on monitoring. {lastCrawlTime ? `Last crawl: ${new Date(lastCrawlTime).toLocaleString()}` : "Auto-crawl: daily at midnight UTC"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerFullIntel}
            disabled={isLoading || isCrawling}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors disabled:opacity-40 text-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Full Intel Sweep
          </button>
          <button
            onClick={() => runCrawl()}
            disabled={isCrawling}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors disabled:opacity-40 text-sm"
          >
            {isCrawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isCrawling ? "Crawling..." : "Crawl All"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-indigo-500 text-slate-800"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge ? (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-50 text-red-600 rounded-full">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === "overview" && (
          <>
            {/* Score Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <div className="text-2xl font-bold text-indigo-600">{zoobiconFeatureCount}/{FEATURE_MATRIX.length}</div>
                <div className="text-xs text-slate-500 mt-1">Features (leading)</div>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <div className="text-2xl font-bold text-blue-600">7</div>
                <div className="text-xs text-slate-500 mt-1">Competitors tracked</div>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <div className="text-2xl font-bold text-amber-600">{alerts.filter((a) => !a.acknowledged).length}</div>
                <div className="text-xs text-slate-500 mt-1">Unread alerts</div>
              </div>
              <div className="p-5 rounded-xl bg-white border border-slate-200">
                <div className="text-2xl font-bold text-emerald-600">{trends.length}</div>
                <div className="text-xs text-slate-500 mt-1">Market trends (7d)</div>
              </div>
            </div>

            {/* Competitive Position Summary */}
            <div className="p-6 rounded-xl bg-white border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" />
                Competitive Position
              </h3>
              <div className="grid grid-cols-5 gap-4">
                {competitorNames.map((name) => {
                  const count = FEATURE_MATRIX.filter((f) => {
                    const key = name.toLowerCase() as keyof typeof f;
                    return f[key];
                  }).length;
                  const isUs = name === "Zoobicon";
                  return (
                    <div
                      key={name}
                      className={`p-4 rounded-xl text-center ${
                        isUs ? "bg-indigo-50 border border-indigo-200" : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-700 mb-2">{name}</div>
                      <div className={`text-3xl font-bold mb-1 ${isUs ? "text-indigo-600" : "text-slate-500"}`}>
                        {count}
                      </div>
                      <div className="text-[10px] text-slate-400">features</div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3">
                        <div
                          className={`h-1.5 rounded-full ${isUs ? "bg-indigo-500" : "bg-slate-400"}`}
                          style={{ width: `${(count / FEATURE_MATRIX.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unique Advantages */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200">
              <h3 className="text-sm font-semibold mb-3 text-emerald-700">Unique to Zoobicon (No Competitor Has)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {FEATURE_MATRIX.filter(
                  (f) => f.zoobicon && !f.lovable && !f.bolt && !f.v0 && !f.emergent
                ).map((f) => (
                  <div key={f.feature} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    {f.feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Matrix */}
            <div className="p-6 rounded-xl bg-white border border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-500" />
                Pricing Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-slate-500 font-medium">Tier</th>
                      {competitorNames.map((name) => (
                        <th key={name} className={`text-center py-3 px-4 font-medium ${name === "Zoobicon" ? "text-indigo-600" : "text-slate-500"}`}>
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PRICING_MATRIX.map((row) => (
                      <tr key={row.tier} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-slate-700">{row.tier}</td>
                        <td className="py-3 px-4 text-center text-indigo-600 font-semibold">{row.zoobicon}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{row.lovable}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{row.bolt}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{row.v0}</td>
                        <td className="py-3 px-4 text-center text-slate-500">{row.emergent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Competitor Cards */}
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-4 flex items-center gap-2">
                <Globe size={16} />
                Tracked Competitors ({competitors.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {competitors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setSelectedCompetitor(selectedCompetitor === c.name ? null : c.name);
                      setActiveTab("crawl");
                    }}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      selectedCompetitor === c.name
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-700 mb-1">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.domain}</div>
                    <div className={`text-[9px] mt-2 px-2 py-0.5 rounded-full inline-block ${
                      c.category === "direct" ? "text-red-600 bg-red-50"
                        : c.category === "emerging" ? "text-amber-600 bg-amber-50"
                        : "text-slate-500 bg-slate-100"
                    }`}>
                      {c.category}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); runCrawl(c.name); }}
                      disabled={isCrawling}
                      className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-600 transition-colors block"
                    >
                      Crawl now
                    </button>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── FEATURE MATRIX TAB ── */}
        {activeTab === "matrix" && (
          <div className="p-6 rounded-xl bg-white border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Layers size={16} className="text-indigo-500" />
              Full Feature Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-slate-500 font-medium">Feature</th>
                    {competitorNames.map((name) => (
                      <th key={name} className={`text-center py-3 px-4 font-medium ${name === "Zoobicon" ? "text-indigo-600" : "text-slate-500"}`}>
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_MATRIX.map((row) => (
                    <tr key={row.feature} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 px-4 text-slate-700">{row.feature}</td>
                      {competitorNames.map((name) => {
                        const key = name.toLowerCase() as keyof typeof row;
                        const has = row[key];
                        return (
                          <td key={name} className="py-2.5 px-4 text-center">
                            {has ? (
                              <Check size={16} className={name === "Zoobicon" ? "text-emerald-500 mx-auto" : "text-slate-400 mx-auto"} />
                            ) : (
                              <span className="text-slate-200">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200">
                    <td className="py-3 px-4 font-semibold text-slate-700">Total</td>
                    {competitorNames.map((name) => {
                      const count = FEATURE_MATRIX.filter((f) => {
                        const key = name.toLowerCase() as keyof typeof f;
                        return f[key];
                      }).length;
                      return (
                        <td key={name} className={`py-3 px-4 text-center font-bold ${name === "Zoobicon" ? "text-indigo-600" : "text-slate-500"}`}>
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── ALERTS TAB ── */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Bell size={16} />
                Intelligence Alerts
              </h3>
              <span className="text-xs text-slate-400">
                {alerts.filter((a) => !a.acknowledged).length} unread
              </span>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">No alerts yet</p>
                <p className="text-xs text-slate-400">
                  Run an intel sweep to detect competitor changes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border ${getSeverityColor(alert.severity)} ${
                      alert.acknowledged ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            alert.severity === "critical" ? "bg-red-50 text-red-600"
                              : alert.severity === "warning" ? "bg-amber-50 text-amber-600"
                              : "bg-blue-50 text-blue-600"
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-slate-500">{alert.competitor_name}</span>
                          <span className="text-xs text-slate-400">
                            {alert.alert_type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800">{alert.title}</h4>
                        {alert.details && (
                          <p className="text-xs text-slate-500 mt-1">{alert.details}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-4">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TRENDS TAB ── */}
        {activeTab === "trends" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <TrendingUp size={16} />
                Market Trends (Last 7 Days)
              </h3>
            </div>

            {trends.length === 0 ? (
              <div className="text-center py-16">
                <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">No trends detected yet</p>
                <p className="text-xs text-slate-400">
                  The intel engine scans Product Hunt and Hacker News daily for relevant AI builder trends.
                </p>
                <button
                  onClick={triggerFullIntel}
                  disabled={isLoading}
                  className="mt-4 px-6 py-2.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors text-sm font-medium"
                >
                  Scan Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {trends.map((trend) => (
                  <div
                    key={trend.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                            {trend.source}
                          </span>
                          {trend.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                              {trend.category}
                            </span>
                          )}
                          {trend.relevance_score > 0.7 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                              High relevance
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800">{trend.title}</h4>
                        {trend.summary && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{trend.summary}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <span className="text-[10px] text-slate-400">
                          {new Date(trend.detected_at).toLocaleDateString()}
                        </span>
                        {trend.url && (
                          <a
                            href={trend.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-600"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CRAWL TAB ── */}
        {activeTab === "crawl" && (
          <>
            {/* Competitor Filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setSelectedCompetitor(null)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  !selectedCompetitor ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
              >
                All
              </button>
              {competitors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCompetitor(selectedCompetitor === c.name ? null : c.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedCompetitor === c.name
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                      : "bg-slate-100 text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Crawl Results */}
            {filteredResults.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                    <Clock size={16} />
                    Crawl Results ({filteredResults.length})
                  </h3>
                  {report?.generatedAt && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(report.generatedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Insights */}
                {report?.insights && report.insights.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {report.insights.map((insight, i) => (
                      <div key={i} className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
                        {insight}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {filteredResults.map((result, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white border border-slate-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(result.status)}
                            <span className="font-semibold text-sm text-slate-800">{result.competitor}</span>
                          </div>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                          >
                            {result.url}
                            <ExternalLink size={10} />
                          </a>
                        </div>
                        {result.rawTextLength && (
                          <span className="text-[10px] text-slate-400">
                            {result.rawTextLength.toLocaleString()} chars
                          </span>
                        )}
                      </div>

                      {result.title && (
                        <div className="mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">Title</span>
                          <p className="text-sm text-slate-700">{result.title}</p>
                        </div>
                      )}

                      {result.pricing && (
                        <div className="mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">Pricing</span>
                          <p className="text-sm text-slate-700">{result.pricing}</p>
                        </div>
                      )}

                      {result.features && result.features.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">Features</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.features.map((f, j) => (
                              <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{f}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.techStack && result.techStack.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">Tech</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {result.techStack.map((t, j) => (
                              <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.keyChanges && result.keyChanges.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">Key Changes</span>
                          <ul className="mt-1 space-y-1">
                            {result.keyChanges.map((change, j) => (
                              <li key={j} className="text-xs text-slate-600 flex items-start gap-2">
                                <span className="text-amber-500 mt-0.5">*</span>
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.errorMessage && (
                        <p className="text-xs text-red-500 mt-2">{result.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Radar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">No crawl data yet</p>
                <p className="text-xs text-slate-400 mb-6">
                  Click &quot;Crawl All&quot; to run a competitive intelligence sweep.
                </p>
                <button
                  onClick={() => runCrawl()}
                  className="px-6 py-2.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 transition-colors text-sm font-medium"
                >
                  Start First Crawl
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
