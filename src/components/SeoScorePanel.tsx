"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  FileText,
  Heading,
  AlignLeft,
  Image as ImageIcon,
  Link2,
  Smartphone,
  Zap,
  Share2,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Loader2,
  Wrench,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface SeoScorePanelProps {
  code: string;
  onFixRequest: (instruction: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Title & Meta": <FileText className="w-4 h-4" />,
  Headings: <Heading className="w-4 h-4" />,
  Content: <AlignLeft className="w-4 h-4" />,
  Images: <ImageIcon className="w-4 h-4" />,
  Links: <Link2 className="w-4 h-4" />,
  Mobile: <Smartphone className="w-4 h-4" />,
  Performance: <Zap className="w-4 h-4" />,
  Social: <Share2 className="w-4 h-4" />,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getScoreColor(score: number): string {
  if (score < 50) return "#ef4444";
  if (score < 70) return "#f97316";
  if (score < 80) return "#eab308";
  return "#22c55e";
}

function getScoreColorClass(score: number): string {
  if (score < 50) return "text-stone-400";
  if (score < 70) return "text-stone-400";
  if (score < 80) return "text-stone-400";
  return "text-stone-400";
}

function getScoreLabel(score: number): string {
  if (score < 50) return "Poor";
  if (score < 70) return "Needs Work";
  if (score < 80) return "Good";
  return "Excellent";
}

/* ------------------------------------------------------------------ */
/*  CircularScore                                                      */
/* ------------------------------------------------------------------ */

function CircularScore({
  score,
  size = 128,
}: {
  score: number;
  size?: number;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const rafRef = useRef<number | null>(null);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = getScoreColor(animatedScore);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const from = 0;
    const to = score;
    const duration = 800;

    setAnimatedScore(0);

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [score]);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke 0.4s ease",
            filter: `drop-shadow(0 0 6px ${color}50)`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center select-none">
        <span className="text-3xl font-bold tabular-nums text-white">
          {animatedScore}
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-widest mt-0.5"
          style={{ color }}
        >
          {getScoreLabel(animatedScore)}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PriorityBadge                                                      */
/* ------------------------------------------------------------------ */

function PriorityBadge({
  priority,
}: {
  priority: "high" | "medium" | "low";
}) {
  const styles: Record<string, string> = {
    high: "bg-stone-500/15 text-stone-400 border-stone-500/25",
    medium: "bg-stone-500/15 text-stone-400 border-stone-500/25",
    low: "bg-stone-500/15 text-stone-400 border-stone-500/25",
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] leading-none px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wide shrink-0 ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  CategorySection                                                    */
/* ------------------------------------------------------------------ */

function CategorySection({ category }: { category: SeoCategory }) {
  const [expanded, setExpanded] = useState(false);
  const icon = CATEGORY_ICONS[category.name] || <Search className="w-4 h-4" />;
  const percentage =
    category.maxScore > 0
      ? Math.round((category.score / category.maxScore) * 100)
      : 0;
  const color = getScoreColor(percentage);
  const passedCount = category.checks.filter((c) => c.passed).length;
  const totalCount = category.checks.length;

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden transition-colors hover:border-white/15">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03] transition-colors group"
      >
        <span className="text-white/50 group-hover:text-white/60 transition-colors">
          {icon}
        </span>
        <span className="text-sm font-medium text-white/90 flex-1 text-left">
          {category.name}
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-white/50 tabular-nums">
            {passedCount}/{totalCount}
          </span>
          <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </div>
          <span
            className="text-xs font-mono w-8 text-right font-semibold tabular-nums"
            style={{ color }}
          >
            {percentage}
          </span>
          <span className="text-white/50 transition-transform duration-200">
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        </div>
      </button>

      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: expanded ? "1fr" : "0fr",
        }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-white/[0.06]">
            {category.checks.map((check, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs py-0.5"
              >
                {check.passed ? (
                  <Check className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                )}
                <span
                  className={
                    check.passed
                      ? "text-white/50 leading-relaxed"
                      : "text-white/70 leading-relaxed"
                  }
                >
                  {check.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SeoScorePanel (main)                                               */
/* ------------------------------------------------------------------ */

export default function SeoScorePanel({
  code,
  onFixRequest,
}: SeoScorePanelProps) {
  const [result, setResult] = useState<SeoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCodeRef = useRef<string>("");

  /* ---- analyse helper ---- */
  const analyze = useCallback(async (codeToAnalyze: string) => {
    if (!codeToAnalyze.trim()) {
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToAnalyze }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Analysis failed"
        );
      }

      const data: SeoResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---- debounced re-analysis on code change (1 s) ---- */
  useEffect(() => {
    if (code === prevCodeRef.current) return;
    prevCodeRef.current = code;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      analyze(code);
    }, 1000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [code, analyze]);

  /* ---- auto-fix handler ---- */
  const handleAutoFix = () => {
    if (!result) return;

    const highPriority = result.suggestions
      .filter((s) => s.priority === "high")
      .map((s) => `- [${s.category}] ${s.message}`);

    if (highPriority.length === 0) return;

    const instruction = [
      "Fix the following high-priority SEO issues in this code:\n",
      ...highPriority,
      "\nApply all fixes while preserving the existing design and functionality.",
      "Add any missing meta tags, fix heading hierarchy, add alt text to images, and improve any other SEO elements.",
    ].join("\n");

    onFixRequest(instruction);
  };

  const highCount = result
    ? result.suggestions.filter((s) => s.priority === "high").length
    : 0;

  return (
    <div className="flex flex-col h-full bg-[#0a1628] text-white">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-stone-400" />
          <span className="text-sm font-semibold tracking-tight">
            SEO Score
          </span>
          {loading && (
            <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin ml-1" />
          )}
        </div>
        <button
          onClick={() => analyze(code)}
          disabled={loading || !code.trim()}
          className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Re-analyze"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-white/50 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* ---- Scrollable body ---- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
        {/* Loading – first load */}
        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-7 h-7 text-stone-400 animate-spin" />
            <span className="text-sm text-white/50">Analyzing SEO...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 bg-stone-500/10 border border-stone-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
            <span className="text-xs text-stone-300 leading-relaxed">
              {error}
            </span>
          </div>
        )}

        {/* Empty state */}
        {!code.trim() && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/50">
            <Search className="w-10 h-10" />
            <span className="text-sm text-center leading-relaxed">
              Generate or paste code
              <br />
              to analyze SEO
            </span>
          </div>
        )}

        {/* ---- Results ---- */}
        {result && (
          <>
            {/* Overall circular score */}
            <div className="flex flex-col items-center pt-1 pb-2">
              <CircularScore score={result.score} />
              <span className="text-[11px] text-white/50 mt-2.5 uppercase tracking-widest font-medium">
                Overall SEO Score
              </span>
            </div>

            {/* Top suggestions */}
            {result.suggestions.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">
                  Top Suggestions
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {result.suggestions.slice(0, 8).map((suggestion, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.06] hover:border-white/10 transition-colors"
                    >
                      <PriorityBadge priority={suggestion.priority} />
                      <span className="text-xs text-white/60 leading-relaxed">
                        {suggestion.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-fix button */}
            {highCount > 0 && (
              <button
                onClick={handleAutoFix}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-stone-600 to-stone-500 hover:from-stone-500 hover:to-stone-400 active:from-stone-700 active:to-stone-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-stone-500/20 hover:shadow-stone-500/30"
              >
                <Wrench className="w-4 h-4" />
                Auto-Fix SEO Issues
                <span className="ml-1 text-[10px] bg-white/20 rounded-full px-1.5 py-0.5 tabular-nums">
                  {highCount}
                </span>
              </button>
            )}

            {/* Category breakdown */}
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">
                Category Breakdown
              </h3>
              <div className="space-y-1.5">
                {result.categories.map((category) => (
                  <CategorySection key={category.name} category={category} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
