"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Search,
  Code2,
  BarChart3,
  Zap,
  Download,
  Clock,
  Trash2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Image,
  Link2,
  Smartphone,
  Gauge,
  Share2,
  Heading,
  LogOut,
  LayoutDashboard,
  Hammer,
  Globe,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

/* ─── types matching /api/seo/analyze response ─── */

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

interface HistoryEntry {
  id: string;
  label: string;
  url?: string;
  score: number;
  timestamp: number;
  result: SeoResult;
  html: string;
  keyword?: string;
}

/* ─── constants ─── */

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Title & Meta": <FileText className="w-5 h-5" />,
  Headings: <Heading className="w-5 h-5" />,
  Content: <Code2 className="w-5 h-5" />,
  Images: <Image className="w-5 h-5" />,
  Links: <Link2 className="w-5 h-5" />,
  Mobile: <Smartphone className="w-5 h-5" />,
  Performance: <Gauge className="w-5 h-5" />,
  Social: <Share2 className="w-5 h-5" />,
};

const STORAGE_KEY = "zoobicon_seo_history";

function scoreColor(score: number): string {
  if (score >= 80) return "text-stone-400";
  if (score >= 50) return "text-stone-400";
  return "text-stone-400";
}

function scoreRingColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 50) return "#facc15";
  return "#f87171";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-stone-500/10 border-stone-500/30";
  if (score >= 50) return "bg-stone-500/10 border-stone-500/30";
  return "bg-stone-500/10 border-stone-500/30";
}

function priorityBadge(priority: "high" | "medium" | "low") {
  const styles = {
    high: "bg-stone-500/20 text-stone-300 border-stone-500/30",
    medium: "bg-stone-500/20 text-stone-300 border-stone-500/30",
    low: "bg-stone-500/20 text-stone-300 border-stone-500/30",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

/* ─── circular score ring ─── */

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreRingColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`text-4xl font-bold ${scoreColor(score)}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-gray-400 mt-1">/ 100</span>
      </div>
    </div>
  );
}

/* ─── main page ─── */

export default function SeoAgentPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [inputMode, setInputMode] = useState<"url" | "html">("url");
  const [url, setUrl] = useState("");
  const [htmlInput, setHtmlInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<SeoResult | null>(null);
  const [currentHtml, setCurrentHtml] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [fixChanges, setFixChanges] = useState<string[] | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth check
  useEffect(() => {
    const user = localStorage.getItem("zoobicon_user");
    if (!user) {
      window.location.href = "/auth/login";
    } else {
      setAuthed(true);
    }
  }, []);

  // Load history
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  // Save history
  const saveHistory = useCallback((entries: HistoryEntry[]) => {
    const trimmed = entries.slice(0, 50);
    setHistory(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }, []);

  const handleAnalyze = useCallback(async () => {
    setError("");
    setResult(null);
    setFixChanges(null);
    setSelectedHistory(null);

    let html = "";

    if (inputMode === "url") {
      if (!url.trim()) {
        setError("Enter a URL to analyze.");
        return;
      }
      setAnalyzing(true);
      try {
        let targetUrl = url.trim();
        if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
          targetUrl = "https://" + targetUrl;
        }

        const fetchRes = await fetch(targetUrl);
        if (!fetchRes.ok) {
          setError(
            `Failed to fetch URL (${fetchRes.status}). Try pasting the HTML directly instead.`
          );
          setAnalyzing(false);
          return;
        }
        html = await fetchRes.text();
      } catch {
        setError(
          "Could not fetch URL. The site may block cross-origin requests. Try pasting the HTML directly instead."
        );
        setAnalyzing(false);
        return;
      }
    } else {
      html = htmlInput.trim();
      if (!html) {
        setError("Paste your HTML to analyze.");
        return;
      }
      setAnalyzing(true);
    }

    setCurrentHtml(html);

    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: html,
          targetKeyword: keyword.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Analysis failed. Please try again.");
        setAnalyzing(false);
        return;
      }

      const data: SeoResult = await res.json();
      setResult(data);

      const entry: HistoryEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        label: inputMode === "url" ? url.trim() : `HTML snippet (${html.length} chars)`,
        url: inputMode === "url" ? url.trim() : undefined,
        score: data.score,
        timestamp: Date.now(),
        result: data,
        html,
        keyword: keyword.trim() || undefined,
      };
      saveHistory([entry, ...history]);
    } catch {
      setError("An unexpected error occurred during analysis.");
    } finally {
      setAnalyzing(false);
    }
  }, [inputMode, url, htmlInput, keyword, history, saveHistory]);

  const handleAutoFix = useCallback(async () => {
    if (!result || !currentHtml) return;

    setFixing(true);
    setError("");
    setFixChanges(null);

    const suggestions = result.suggestions.map((s) => s.message);

    try {
      const res = await fetch("/api/seo/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: currentHtml,
          suggestions,
          keyword: keyword.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Auto-fix failed. Please try again.");
        setFixing(false);
        return;
      }

      const data = await res.json();
      setCurrentHtml(data.html);
      setFixChanges(data.changes);

      // Re-analyze the fixed HTML
      const analyzeRes = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: data.html,
          targetKeyword: keyword.trim() || undefined,
        }),
      });

      if (analyzeRes.ok) {
        const newResult: SeoResult = await analyzeRes.json();
        setResult(newResult);

        const entry: HistoryEntry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          label: `[Fixed] ${inputMode === "url" ? url.trim() : "HTML snippet"}`,
          url: inputMode === "url" ? url.trim() : undefined,
          score: newResult.score,
          timestamp: Date.now(),
          result: newResult,
          html: data.html,
          keyword: keyword.trim() || undefined,
        };
        saveHistory([entry, ...history]);
      }
    } catch {
      setError("Auto-fix encountered an error. Please try again.");
    } finally {
      setFixing(false);
    }
  }, [result, currentHtml, keyword, inputMode, url, history, saveHistory]);

  const loadHistoryEntry = useCallback((entry: HistoryEntry) => {
    setResult(entry.result);
    setCurrentHtml(entry.html);
    setSelectedHistory(entry.id);
    setFixChanges(null);
    setError("");
    if (entry.url) {
      setUrl(entry.url);
      setInputMode("url");
    } else {
      setHtmlInput(entry.html);
      setInputMode("html");
    }
    if (entry.keyword) setKeyword(entry.keyword);
    setShowHistory(false);
  }, []);

  const deleteHistoryEntry = useCallback(
    (id: string) => {
      const filtered = history.filter((h) => h.id !== id);
      saveHistory(filtered);
      if (selectedHistory === id) {
        setSelectedHistory(null);
      }
    },
    [history, saveHistory, selectedHistory]
  );

  const exportReport = useCallback(() => {
    if (!result) return;
    const report = {
      generatedAt: new Date().toISOString(),
      url: inputMode === "url" ? url : null,
      keyword: keyword || null,
      overallScore: result.score,
      categories: result.categories.map((c) => ({
        name: c.name,
        score: c.score,
        maxScore: c.maxScore,
        checks: c.checks,
      })),
      suggestions: result.suggestions,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `seo-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [result, inputMode, url, keyword]);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem("zoobicon_user");
    window.location.href = "/";
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <BackgroundEffects preset="technical" />
      {/* ─── navbar ─── */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-500 to-stone-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">Zoobicon</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="px-3 py-2 rounded-lg text-sm text-white bg-white/10 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-stone-400" />
                  SEO Agent
                </div>
                <Link
                  href="/builder"
                  className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Hammer className="w-4 h-4" />
                  Builder
                </Link>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <CursorGlowTracker />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HeroEffects variant="cyan" cursorGlow particles particleCount={35} interactiveGrid aurora beams />
        <div className="flex gap-8">
          {/* ─── history sidebar (desktop) ─── */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  History
                </h2>
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      saveHistory([]);
                      setSelectedHistory(null);
                    }}
                    className="text-xs text-gray-500 hover:text-stone-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-gray-600">No analyses yet.</p>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                  {history.map((entry) => (
                    <motion.button
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => loadHistoryEntry(entry)}
                      className={`w-full text-left p-3 rounded-xl border transition-all group ${
                        selectedHistory === entry.id
                          ? "bg-stone-500/10 border-stone-500/30"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-gray-200">
                            {entry.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(entry.timestamp).toLocaleDateString()} &middot;{" "}
                            {new Date(entry.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm font-bold ${scoreColor(entry.score)}`}
                          >
                            {entry.score}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHistoryEntry(entry.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-stone-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* ─── main content ─── */}
          <main className="flex-1 min-w-0">
            {/* header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-500 to-stone-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">SEO Agent</h1>
                  <p className="text-sm text-gray-400">
                    Analyze, score, and auto-fix SEO issues on any webpage
                  </p>
                </div>
              </div>

              {/* mobile history toggle */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="lg:hidden mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Clock className="w-4 h-4" />
                History ({history.length})
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    showHistory ? "rotate-90" : ""
                  }`}
                />
              </button>
            </div>

            {/* mobile history panel */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="lg:hidden overflow-hidden mb-6"
                >
                  <div className="bg-white/[0.02] rounded-xl border border-white/5 p-4 space-y-2">
                    {history.length === 0 ? (
                      <p className="text-sm text-gray-600">No analyses yet.</p>
                    ) : (
                      history.slice(0, 10).map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => loadHistoryEntry(entry)}
                          className="w-full text-left p-3 rounded-lg bg-white/[0.02] hover:bg-white/5 flex items-center justify-between"
                        >
                          <span className="text-sm truncate mr-4">
                            {entry.label}
                          </span>
                          <span
                            className={`text-sm font-bold shrink-0 ${scoreColor(
                              entry.score
                            )}`}
                          >
                            {entry.score}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── input section ─── */}
            <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6 mb-8">
              {/* mode tabs */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setInputMode("url")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    inputMode === "url"
                      ? "bg-stone-500/20 text-stone-300 border border-stone-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Analyze URL
                </button>
                <button
                  onClick={() => setInputMode("html")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    inputMode === "html"
                      ? "bg-stone-500/20 text-stone-300 border border-stone-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  Paste HTML
                </button>
              </div>

              {/* input area */}
              {inputMode === "url" ? (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-500/50 focus:border-stone-500/50 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !analyzing) handleAnalyze();
                    }}
                  />
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={htmlInput}
                  onChange={(e) => setHtmlInput(e.target.value)}
                  placeholder="Paste your HTML code here..."
                  rows={6}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/50 focus:border-stone-500/50 transition-all resize-y"
                />
              )}

              {/* keyword + analyze button */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Target keyword (optional)"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-500/50 focus:border-stone-500/50 transition-all"
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Analyze SEO
                    </>
                  )}
                </button>
              </div>

              {/* error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 flex items-start gap-3 p-4 bg-stone-500/10 border border-stone-500/20 rounded-xl"
                  >
                    <AlertTriangle className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-stone-300">{error}</p>
                    </div>
                    <button
                      onClick={() => setError("")}
                      className="text-stone-400 hover:text-stone-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── results ─── */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* score + actions */}
                  <div className="flex flex-col md:flex-row items-center gap-8 mb-8 bg-white/[0.02] rounded-2xl border border-white/5 p-8">
                    <ScoreRing score={result.score} />
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl font-bold mb-2">
                        {result.score >= 80
                          ? "Great SEO Health"
                          : result.score >= 50
                          ? "Needs Improvement"
                          : "Critical Issues Found"}
                      </h2>
                      <p className="text-gray-400 mb-4">
                        {
                          result.suggestions.filter(
                            (s) => s.priority === "high"
                          ).length
                        }{" "}
                        high-priority issue
                        {result.suggestions.filter(
                          (s) => s.priority === "high"
                        ).length !== 1
                          ? "s"
                          : ""}
                        ,{" "}
                        {
                          result.suggestions.filter(
                            (s) => s.priority === "medium"
                          ).length
                        }{" "}
                        medium,{" "}
                        {
                          result.suggestions.filter(
                            (s) => s.priority === "low"
                          ).length
                        }{" "}
                        low
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <button
                          onClick={handleAutoFix}
                          disabled={fixing || result.suggestions.length === 0}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {fixing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Fixing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Auto-Fix Issues
                            </>
                          )}
                        </button>
                        <button
                          onClick={exportReport}
                          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Export Report
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* fix changes banner */}
                  <AnimatePresence>
                    {fixChanges && fixChanges.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-8 overflow-hidden"
                      >
                        <div className="bg-stone-500/10 border border-stone-500/20 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-stone-300 flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-5 h-5" />
                            Auto-Fix Applied
                          </h3>
                          <ul className="space-y-2">
                            {fixChanges.map((change, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-stone-200"
                              >
                                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-stone-400" />
                                {change}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-stone-400/60 mt-3">
                            The scores above reflect the fixed HTML. You can
                            download it via Export Report.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* category grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {result.categories.map((cat) => {
                      const pct =
                        cat.maxScore > 0
                          ? Math.round((cat.score / cat.maxScore) * 100)
                          : 0;
                      const isExpanded = expandedCategory === cat.name;
                      return (
                        <motion.button
                          key={cat.name}
                          onClick={() =>
                            setExpandedCategory(isExpanded ? null : cat.name)
                          }
                          className={`text-left p-4 rounded-xl border transition-all ${
                            isExpanded
                              ? "bg-stone-500/10 border-stone-500/30 col-span-1 sm:col-span-2 lg:col-span-4"
                              : `${scoreBg(pct)} hover:scale-[1.02]`
                          }`}
                          layout
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={scoreColor(pct)}>
                                {CATEGORY_ICONS[cat.name] || (
                                  <BarChart3 className="w-5 h-5" />
                                )}
                              </span>
                              <span className="font-medium text-sm">
                                {cat.name}
                              </span>
                            </div>
                            <span
                              className={`text-lg font-bold ${scoreColor(pct)}`}
                            >
                              {pct}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: scoreRingColor(pct),
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>

                          {/* expanded checks */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-2 overflow-hidden"
                              >
                                {cat.checks.map((check, i) => (
                                  <div
                                    key={i}
                                    className={`flex items-start gap-3 p-3 rounded-lg ${
                                      check.passed
                                        ? "bg-stone-500/5"
                                        : "bg-stone-500/5"
                                    }`}
                                  >
                                    {check.passed ? (
                                      <CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-200">
                                        {check.name}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {check.message}
                                      </p>
                                    </div>
                                    {priorityBadge(check.impact)}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* suggestions list */}
                  {result.suggestions.length > 0 && (
                    <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-stone-400" />
                        Actionable Suggestions
                        <span className="text-sm font-normal text-gray-500">
                          ({result.suggestions.length})
                        </span>
                      </h3>
                      <div className="space-y-3">
                        {result.suggestions.map((suggestion, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                          >
                            <div className="mt-0.5">
                              {priorityBadge(suggestion.priority)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200">
                                {suggestion.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {suggestion.category}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.suggestions.length === 0 && (
                    <div className="bg-stone-500/10 border border-stone-500/20 rounded-2xl p-8 text-center">
                      <CheckCircle2 className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-stone-300">
                        No Issues Found
                      </h3>
                      <p className="text-sm text-stone-400/70 mt-1">
                        This page passes all SEO checks. Great work!
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* empty state */}
            {!result && !analyzing && (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-500/20 to-stone-500/20 border border-stone-500/10 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-stone-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Analyze Your First Page
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Enter a URL or paste HTML above to get a comprehensive SEO
                  audit with actionable fixes powered by AI.
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                  {[
                    "Meta tags & title optimization",
                    "Heading hierarchy",
                    "Content quality",
                    "Image alt text",
                    "Mobile responsiveness",
                    "Social sharing tags",
                    "Structured data",
                    "Performance hints",
                  ].map((feature) => (
                    <span
                      key={feature}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-gray-400"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* analyzing spinner */}
            {analyzing && (
              <div className="text-center py-20">
                <Loader2 className="w-12 h-12 text-stone-400 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Analyzing SEO...</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Checking 8 categories across 30+ signals
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
