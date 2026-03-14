"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  BarChart3,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  User,
  ArrowRight,
  Code2,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Sparkles,
  Tag,
  TrendingUp,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

// ─── Types ───

interface SeoCheck {
  name: string;
  passed: boolean;
  message: string;
  impact: "high" | "medium" | "low";
}

interface SeoCategory {
  name: string;
  score: number;
  maxScore: number;
  checks: SeoCheck[];
}

interface SeoResult {
  score: number;
  categories: SeoCategory[];
  suggestions: Array<{
    priority: "high" | "medium" | "low";
    message: string;
    category: string;
  }>;
}

interface AnalysisRecord {
  id: string;
  timestamp: number;
  label: string;
  score: number;
  targetKeyword: string;
  inputType: "url" | "html";
  result: SeoResult;
  html?: string;
}

interface KeywordSuggestion {
  keyword: string;
  difficulty: "Low" | "Medium" | "High";
  relevance: "High" | "Medium" | "Low";
  searchVolume: string;
  intent: string;
}

// ─── Constants ───

type NavView = "dashboard" | "analyze" | "keywords" | "history";

const NAV_ITEMS: { id: NavView; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analyze", label: "Analyze", icon: BarChart3 },
  { id: "keywords", label: "Keywords", icon: Tag },
  { id: "history", label: "History", icon: History },
];

const STORAGE_KEY = "zoobicon_seo_history";

// ─── Helpers ───

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-emerald-400";
  if (score >= 50) return "stroke-yellow-400";
  return "stroke-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-400/10 border-emerald-400/20";
  if (score >= 50) return "bg-yellow-400/10 border-yellow-400/20";
  return "bg-red-400/10 border-red-400/20";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs Work";
  if (score >= 40) return "Poor";
  return "Critical";
}

function loadHistory(): AnalysisRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: AnalysisRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)));
  } catch { /* storage full or unavailable */ }
}

// ─── Score Circle Component ───

function ScoreCircle({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={`${getScoreRingColor(score)} transition-all duration-1000`}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-black ${getScoreColor(score)}`}>{score}</span>
        <span className="text-xs text-white/40 mt-1">{getScoreLabel(score)}</span>
      </div>
    </div>
  );
}

// ─── Category Card ───

function CategoryCard({ category }: { category: SeoCategory }) {
  const [expanded, setExpanded] = useState(false);
  const pct = category.maxScore > 0 ? Math.round((category.score / category.maxScore) * 100) : 0;

  return (
    <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border ${getScoreBg(pct)}`}>
            <span className={getScoreColor(pct)}>{pct}</span>
          </div>
          <div>
            <span className="font-semibold text-sm">{category.name}</span>
            <div className="text-xs text-white/30 mt-0.5">
              {category.checks.filter(c => c.passed).length}/{category.checks.length} checks passed
            </div>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 text-white/30 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="border-t border-white/[0.04] p-4 space-y-2">
          {category.checks.map((check, i) => (
            <div key={i} className="flex items-start gap-2.5">
              {check.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <div className="text-sm font-medium">{check.name}</div>
                <div className="text-xs text-white/40 mt-0.5">{check.message}</div>
                <span className={`inline-block text-[10px] mt-1 px-1.5 py-0.5 rounded ${
                  check.impact === "high" ? "bg-red-500/10 text-red-400" :
                  check.impact === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-blue-500/10 text-blue-400"
                }`}>
                  {check.impact} impact
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───

export default function SEODashboard() {
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [activeView, setActiveView] = useState<NavView>("dashboard");
  const [history, setHistory] = useState<AnalysisRecord[]>([]);

  // Analysis state
  const [urlInput, setUrlInput] = useState("");
  const [htmlInput, setHtmlInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [currentResult, setCurrentResult] = useState<SeoResult | null>(null);
  const [currentHtml, setCurrentHtml] = useState("");
  const [currentLabel, setCurrentLabel] = useState("");

  // Keywords state
  const [keywordBusiness, setKeywordBusiness] = useState("");
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<KeywordSuggestion[]>([]);
  const [keywordError, setKeywordError] = useState("");

  // Load user + history
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zoobicon_user");
      if (stored) setUser(JSON.parse(stored));
    } catch { /* ignore */ }
    setHistory(loadHistory());
  }, []);

  const handleLogout = () => {
    try { localStorage.removeItem("zoobicon_user"); } catch { /* ignore */ }
    setUser(null);
  };

  // ─── Fetch HTML from URL ───
  const fetchHtmlFromUrl = async (url: string): Promise<string> => {
    // Try fetching through a CORS proxy approach — use our own API
    const res = await fetch(`/api/seo/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: `<!DOCTYPE html><html><head><title>Fetching ${url}</title></head><body><p>Placeholder</p></body></html>`,
        targetKeyword: "",
      }),
    });
    // For URL analysis, we'll fetch the URL content client-side
    // This may be blocked by CORS for some sites
    try {
      const proxyRes = await fetch(url, { mode: "no-cors" });
      const text = await proxyRes.text();
      if (text && text.includes("<")) return text;
    } catch { /* CORS blocked */ }

    // Fallback: use a simple approach — inform user to paste HTML
    throw new Error("Could not fetch this URL due to CORS restrictions. Please paste the HTML source code instead (right-click the page, View Page Source, copy all).");
  };

  // ─── Run Analysis ───
  const runAnalysis = useCallback(async (html: string, keyword: string, label: string, inputType: "url" | "html") => {
    setAnalyzing(true);
    setAnalysisError("");
    setCurrentResult(null);

    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: html, targetKeyword: keyword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Analysis failed" }));
        throw new Error(err.error || "Analysis failed");
      }

      const result: SeoResult = await res.json();
      setCurrentResult(result);
      setCurrentHtml(html);
      setCurrentLabel(label);

      // Save to history
      const record: AnalysisRecord = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        timestamp: Date.now(),
        label,
        score: result.score,
        targetKeyword: keyword,
        inputType,
        result,
        html: html.length < 200000 ? html : undefined, // Don't store huge HTML
      };

      const updated = [record, ...history.filter(h => h.id !== record.id)].slice(0, 50);
      setHistory(updated);
      saveHistory(updated);

      // Switch to analyze view to show results
      setActiveView("analyze");
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [history]);

  // ─── URL Analysis ───
  const handleUrlAnalysis = async () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim().startsWith("http") ? urlInput.trim() : `https://${urlInput.trim()}`;

    try {
      setAnalyzing(true);
      setAnalysisError("");
      const html = await fetchHtmlFromUrl(url);
      await runAnalysis(html, keywordInput.trim(), url, "url");
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Failed to fetch URL");
      setAnalyzing(false);
    }
  };

  // ─── HTML Analysis ───
  const handleHtmlAnalysis = async () => {
    if (!htmlInput.trim()) return;
    await runAnalysis(htmlInput.trim(), keywordInput.trim(), "Pasted HTML", "html");
  };

  // ─── Keyword Suggestions ───
  const handleKeywordSearch = async () => {
    if (!keywordBusiness.trim()) return;
    setKeywordLoading(true);
    setKeywordError("");
    setKeywordSuggestions([]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "<!-- keyword research -->",
          instruction: `You are an SEO keyword research expert. The user needs keyword suggestions for this business/industry: "${keywordBusiness.trim()}"

Generate exactly 12 keyword suggestions. For each keyword, provide:
- keyword: the search term
- difficulty: "Low", "Medium", or "High"
- relevance: "High", "Medium", or "Low"
- searchVolume: estimated monthly searches (e.g., "1.2K", "14K", "590")
- intent: "Informational", "Commercial", "Transactional", or "Navigational"

Output ONLY a valid JSON array of objects with these exact keys, no other text. Example:
[{"keyword":"best crm software","difficulty":"High","relevance":"High","searchVolume":"12K","intent":"Commercial"}]`,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate keywords");

      const text = await res.text();
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("Invalid response format");

      const suggestions = JSON.parse(jsonMatch[0]) as KeywordSuggestion[];
      setKeywordSuggestions(suggestions);
    } catch (err) {
      setKeywordError(err instanceof Error ? err.message : "Failed to generate keywords");
    } finally {
      setKeywordLoading(false);
    }
  };

  // ─── Delete history record ───
  const deleteRecord = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    saveHistory(updated);
  };

  // ─── View a history record ───
  const viewRecord = (record: AnalysisRecord) => {
    setCurrentResult(record.result);
    setCurrentLabel(record.label);
    setCurrentHtml(record.html || "");
    setActiveView("analyze");
  };

  // ─── Render ───
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#050507]/90 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500 flex items-center justify-center">
                <Search className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">Zoobicon</span>
            </Link>
            <span className="text-white/10">/</span>
            <span className="text-sm text-white/40 font-medium">SEO Agent</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 flex items-center gap-1.5">
                  <LayoutDashboard className="w-3 h-3" />
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5 flex items-center gap-1.5">
                  <LogOut className="w-3 h-3" />
                  Sign out
                </button>
                <div className="flex items-center gap-1.5 text-xs bg-white/[0.04] px-3 py-1.5 rounded-lg">
                  <User className="w-3 h-3 text-cyan-400" />
                  <span className="text-white/60">{user.name || user.email.split("@")[0]}</span>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-xs text-white/40 hover:text-white/70 transition-colors px-3 py-1.5">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="text-xs bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-1.5 rounded-lg font-semibold text-white">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="fixed left-0 top-14 bottom-0 w-56 border-r border-white/[0.04] bg-[#07070c]/80 backdrop-blur-xl hidden lg:block">
          <div className="p-4 space-y-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeView === item.id
                    ? "bg-cyan-500/10 text-cyan-400 font-medium"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/[0.04]">
            <Link
              href="/products/seo-agent"
              className="flex items-center gap-2 text-xs text-white/20 hover:text-white/40 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              About SEO Agent
            </Link>
          </div>
        </aside>

        {/* Mobile nav */}
        <div className="lg:hidden fixed top-14 left-0 right-0 z-40 border-b border-white/[0.04] bg-[#07070c]/90 backdrop-blur-xl">
          <div className="flex overflow-x-auto px-4 py-2 gap-1">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                  activeView === item.id
                    ? "bg-cyan-500/10 text-cyan-400 font-medium"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-56 min-h-[calc(100vh-56px)]">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8 lg:py-10 mt-12 lg:mt-0">

            {/* ─── DASHBOARD VIEW ─── */}
            {activeView === "dashboard" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl font-bold mb-1">SEO Agent Dashboard</h1>
                  <p className="text-white/40 text-sm">Analyze, optimize, and track your website SEO performance.</p>
                </div>

                {/* Quick action cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Analyze by URL */}
                  <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Analyze a Website</h3>
                        <p className="text-xs text-white/30">Enter a URL to scan</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={urlInput}
                        onChange={e => setUrlInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleUrlAnalysis()}
                        placeholder="https://example.com"
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30"
                      />
                      <button
                        onClick={handleUrlAnalysis}
                        disabled={analyzing || !urlInput.trim()}
                        className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-1.5"
                      >
                        {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        Scan
                      </button>
                    </div>
                  </div>

                  {/* Analyze by HTML */}
                  <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Paste HTML Code</h3>
                        <p className="text-xs text-white/30">Analyze raw HTML source</p>
                      </div>
                    </div>
                    <textarea
                      value={htmlInput}
                      onChange={e => setHtmlInput(e.target.value)}
                      placeholder="<!DOCTYPE html>&#10;<html>..."
                      rows={3}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/30 resize-none font-mono text-xs"
                    />
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        placeholder="Target keyword (optional)"
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/10"
                      />
                      <button
                        onClick={handleHtmlAnalysis}
                        disabled={analyzing || !htmlInput.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-1.5"
                      >
                        {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        Analyze
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error display */}
                {analysisError && (
                  <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-red-400">Analysis Error</div>
                      <div className="text-xs text-white/50 mt-1">{analysisError}</div>
                    </div>
                  </div>
                )}

                {/* Recent analyses */}
                {history.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-3">Recent Analyses</h2>
                    <div className="space-y-2">
                      {history.slice(0, 5).map(record => (
                        <button
                          key={record.id}
                          onClick={() => viewRecord(record)}
                          className="w-full flex items-center gap-4 border border-white/[0.06] bg-white/[0.02] rounded-xl p-4 hover:bg-white/[0.04] transition-colors text-left group"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold border ${getScoreBg(record.score)}`}>
                            <span className={getScoreColor(record.score)}>{record.score}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{record.label}</div>
                            <div className="text-xs text-white/30 mt-0.5">
                              {new Date(record.timestamp).toLocaleDateString()} &middot;
                              {record.targetKeyword ? ` Keyword: ${record.targetKeyword}` : " No keyword"}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                        </button>
                      ))}
                    </div>
                    {history.length > 5 && (
                      <button
                        onClick={() => setActiveView("history")}
                        className="text-xs text-cyan-400 hover:text-cyan-300 mt-3 flex items-center gap-1"
                      >
                        View all {history.length} analyses <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Links */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Keyword Research", icon: Tag, view: "keywords" as NavView },
                    { label: "Full History", icon: History, view: "history" as NavView },
                    { label: "Website Builder", icon: Sparkles, href: "/builder" },
                    { label: "Learn More", icon: FileText, href: "/products/seo-agent" },
                  ].map((item, i) => (
                    "href" in item ? (
                      <Link
                        key={i}
                        href={item.href!}
                        className="flex flex-col items-center gap-2 border border-white/[0.06] bg-white/[0.02] rounded-xl p-4 hover:bg-white/[0.04] transition-colors"
                      >
                        <item.icon className="w-5 h-5 text-white/30" />
                        <span className="text-xs text-white/40">{item.label}</span>
                      </Link>
                    ) : (
                      <button
                        key={i}
                        onClick={() => setActiveView(item.view!)}
                        className="flex flex-col items-center gap-2 border border-white/[0.06] bg-white/[0.02] rounded-xl p-4 hover:bg-white/[0.04] transition-colors"
                      >
                        <item.icon className="w-5 h-5 text-white/30" />
                        <span className="text-xs text-white/40">{item.label}</span>
                      </button>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* ─── ANALYZE VIEW ─── */}
            {activeView === "analyze" && (
              <div className="space-y-6">
                {/* Input area at top */}
                <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-5">
                  <h2 className="text-sm font-semibold mb-3">Analyze HTML</h2>
                  <textarea
                    value={htmlInput}
                    onChange={e => setHtmlInput(e.target.value)}
                    placeholder="Paste your full HTML source code here..."
                    rows={4}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-xs font-mono placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 resize-none"
                  />
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={e => setKeywordInput(e.target.value)}
                      placeholder="Target keyword (optional)"
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:border-white/10"
                    />
                    <button
                      onClick={handleHtmlAnalysis}
                      disabled={analyzing || !htmlInput.trim()}
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Analyze
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {analysisError && (
                  <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-400">{analysisError}</div>
                  </div>
                )}

                {/* Results */}
                {currentResult && (
                  <div className="space-y-6">
                    {/* Score header */}
                    <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <ScoreCircle score={currentResult.score} />
                        <div className="flex-1 text-center md:text-left">
                          <h2 className="text-xl font-bold mb-1">SEO Score: {currentResult.score}/100</h2>
                          <p className="text-sm text-white/40 mb-1">{currentLabel}</p>
                          <p className="text-sm text-white/30">
                            {currentResult.categories.reduce((sum, c) => sum + c.checks.filter(ch => ch.passed).length, 0)}/
                            {currentResult.categories.reduce((sum, c) => sum + c.checks.length, 0)} checks passed
                            {" "}&middot;{" "}
                            {currentResult.suggestions.length} recommendation{currentResult.suggestions.length !== 1 ? "s" : ""}
                          </p>
                          {keywordInput && (
                            <div className="inline-flex items-center gap-1.5 mt-2 bg-cyan-500/10 text-cyan-400 text-xs px-2.5 py-1 rounded-full">
                              <Tag className="w-3 h-3" />
                              {keywordInput}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    <div>
                      <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wide">Category Breakdown</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {currentResult.categories.map((cat, i) => (
                          <CategoryCard key={i} category={cat} />
                        ))}
                      </div>
                    </div>

                    {/* Suggestions */}
                    {currentResult.suggestions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wide">
                          Recommendations ({currentResult.suggestions.length})
                        </h3>
                        <div className="space-y-2">
                          {currentResult.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 border border-white/[0.06] bg-white/[0.02] rounded-lg p-3">
                              <span className={`flex-shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded mt-0.5 ${
                                s.priority === "high" ? "bg-red-500/10 text-red-400" :
                                s.priority === "medium" ? "bg-yellow-500/10 text-yellow-400" :
                                "bg-blue-500/10 text-blue-400"
                              }`}>
                                {s.priority}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm">{s.message}</p>
                                <span className="text-xs text-white/20 mt-0.5">{s.category}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Auto-fix button */}
                    {currentHtml && currentResult.suggestions.length > 0 && (
                      <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                          <Sparkles className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">Auto-Fix with AI</h3>
                            <p className="text-sm text-white/40 mb-3">
                              Let the AI agent automatically fix the SEO issues found in your HTML.
                              It will apply the high-priority recommendations and return improved code.
                            </p>
                            <AutoFixButton html={currentHtml} suggestions={currentResult.suggestions} onResult={(html) => {
                              setHtmlInput(html);
                              setCurrentHtml(html);
                              // Re-analyze with the fixed HTML
                              runAnalysis(html, keywordInput, currentLabel + " (fixed)", "html");
                            }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {!currentResult && !analyzing && !analysisError && (
                  <div className="text-center py-16 text-white/20">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Paste HTML code above and click Analyze to get your SEO score.</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── KEYWORDS VIEW ─── */}
            {activeView === "keywords" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Keyword Research</h1>
                  <p className="text-white/40 text-sm">Get AI-powered keyword suggestions for your business.</p>
                </div>

                <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Describe your business or industry</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keywordBusiness}
                      onChange={e => setKeywordBusiness(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleKeywordSearch()}
                      placeholder="e.g., online pet food store, SaaS project management tool, local dentist..."
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30"
                    />
                    <button
                      onClick={handleKeywordSearch}
                      disabled={keywordLoading || !keywordBusiness.trim()}
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      {keywordLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Researching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Get Keywords
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {keywordError && (
                  <div className="flex items-start gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-400">{keywordError}</div>
                  </div>
                )}

                {keywordSuggestions.length > 0 && (
                  <div className="border border-white/[0.06] bg-white/[0.02] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/[0.06]">
                            <th className="text-left py-3 px-4 text-xs text-white/40 font-medium uppercase tracking-wide">Keyword</th>
                            <th className="text-left py-3 px-4 text-xs text-white/40 font-medium uppercase tracking-wide">Volume</th>
                            <th className="text-left py-3 px-4 text-xs text-white/40 font-medium uppercase tracking-wide">Difficulty</th>
                            <th className="text-left py-3 px-4 text-xs text-white/40 font-medium uppercase tracking-wide">Relevance</th>
                            <th className="text-left py-3 px-4 text-xs text-white/40 font-medium uppercase tracking-wide">Intent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keywordSuggestions.map((kw, i) => (
                            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-4 font-medium">{kw.keyword}</td>
                              <td className="py-3 px-4 text-white/50">{kw.searchVolume}</td>
                              <td className="py-3 px-4">
                                <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                                  kw.difficulty === "Low" ? "bg-emerald-500/10 text-emerald-400" :
                                  kw.difficulty === "Medium" ? "bg-yellow-500/10 text-yellow-400" :
                                  "bg-red-500/10 text-red-400"
                                }`}>
                                  {kw.difficulty}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                                  kw.relevance === "High" ? "bg-cyan-500/10 text-cyan-400" :
                                  kw.relevance === "Medium" ? "bg-white/10 text-white/50" :
                                  "bg-white/5 text-white/30"
                                }`}>
                                  {kw.relevance}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-white/40 text-xs">{kw.intent}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!keywordLoading && keywordSuggestions.length === 0 && !keywordError && (
                  <div className="text-center py-16 text-white/20">
                    <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Enter your business type above to get keyword suggestions.</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── HISTORY VIEW ─── */}
            {activeView === "history" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-1">Analysis History</h1>
                    <p className="text-white/40 text-sm">{history.length} analysis record{history.length !== 1 ? "s" : ""} stored locally.</p>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm("Clear all analysis history?")) {
                          setHistory([]);
                          saveHistory([]);
                        }
                      }}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-16 text-white/20">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No analyses yet. Run your first analysis to see results here.</p>
                    <button
                      onClick={() => setActiveView("dashboard")}
                      className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mx-auto"
                    >
                      Go to Dashboard <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map(record => (
                      <div
                        key={record.id}
                        className="flex items-center gap-4 border border-white/[0.06] bg-white/[0.02] rounded-xl p-4 group"
                      >
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold border ${getScoreBg(record.score)}`}>
                          <span className={getScoreColor(record.score)}>{record.score}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{record.label}</div>
                          <div className="text-xs text-white/30 mt-0.5">
                            {new Date(record.timestamp).toLocaleString()} &middot;
                            {record.inputType === "url" ? " URL" : " HTML"} analysis
                            {record.targetKeyword ? ` &middot; Keyword: ${record.targetKeyword}` : ""}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewRecord(record)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="text-xs text-white/20 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/5 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Auto-Fix Button Component ───

function AutoFixButton({
  html,
  suggestions,
  onResult,
}: {
  html: string;
  suggestions: SeoResult["suggestions"];
  onResult: (html: string) => void;
}) {
  const [fixing, setFixing] = useState(false);
  const [error, setError] = useState("");

  const handleAutoFix = async () => {
    setFixing(true);
    setError("");

    // Build fix instructions from high and medium priority suggestions
    const fixes = suggestions
      .filter(s => s.priority === "high" || s.priority === "medium")
      .map(s => `- [${s.category}] ${s.message}`)
      .join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: html,
          instruction: `Fix the following SEO issues in this HTML. Apply all changes and return the complete fixed HTML document:\n\n${fixes}`,
        }),
      });

      if (!res.ok) throw new Error("Auto-fix failed");

      const text = await res.text();
      // The chat endpoint returns the full HTML
      // Extract the HTML from the response (it may contain the full document)
      const htmlMatch = text.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      if (htmlMatch) {
        onResult(htmlMatch[0]);
      } else if (text.includes("<html")) {
        const start = text.indexOf("<html");
        const htmlContent = text.slice(start);
        onResult(htmlContent);
      } else {
        throw new Error("Could not extract fixed HTML from AI response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auto-fix failed");
    } finally {
      setFixing(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleAutoFix}
        disabled={fixing}
        className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
      >
        {fixing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Fixing SEO Issues...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Auto-Fix Issues
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}
