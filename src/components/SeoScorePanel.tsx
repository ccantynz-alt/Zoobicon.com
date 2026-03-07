"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  FileText,
  Heading,
  AlignLeft,
  ImageIcon,
  Link,
  Smartphone,
  Zap,
  Share2,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

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

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Title & Meta": <FileText className="w-4 h-4" />,
  Headings: <Heading className="w-4 h-4" />,
  Content: <AlignLeft className="w-4 h-4" />,
  Images: <ImageIcon className="w-4 h-4" />,
  Links: <Link className="w-4 h-4" />,
  Mobile: <Smartphone className="w-4 h-4" />,
  Performance: <Zap className="w-4 h-4" />,
  Social: <Share2 className="w-4 h-4" />,
};

function getScoreColor(score: number): string {
  if (score < 50) return "#ef4444"; // red
  if (score < 70) return "#f97316"; // orange
  if (score < 80) return "#eab308"; // yellow
  return "#22c55e"; // green
}

function getScoreLabel(score: number): string {
  if (score < 50) return "Poor";
  if (score < 70) return "Needs Work";
  if (score < 80) return "Good";
  return "Excellent";
}

function CircularScore({ score, size = 120 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = getScoreColor(animatedScore);

  useEffect(() => {
    setAnimatedScore(0);
    const timer = setTimeout(() => {
      let current = 0;
      const step = score / 30;
      const interval = setInterval(() => {
        current += step;
        if (current >= score) {
          current = score;
          clearInterval(interval);
        }
        setAnimatedScore(Math.round(current));
      }, 16);
      return () => clearInterval(interval);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-zinc-700"
        />
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
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{animatedScore}</span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color }}>
          {getScoreLabel(animatedScore)}
        </span>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const styles = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function CategorySection({ category }: { category: SeoCategory }) {
  const [expanded, setExpanded] = useState(false);
  const icon = CATEGORY_ICONS[category.name] || <Search className="w-4 h-4" />;
  const percentage = category.maxScore > 0 ? Math.round((category.score / category.maxScore) * 100) : 0;
  const color = getScoreColor(percentage);

  return (
    <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800/50 transition-colors"
      >
        <span className="text-zinc-400">{icon}</span>
        <span className="text-sm font-medium text-zinc-200 flex-1 text-left">{category.name}</span>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs font-mono w-8 text-right" style={{ color }}>
            {percentage}
          </span>
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-zinc-700/50 pt-2">
          {category.checks.map((check, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {check.passed ? (
                <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
              ) : (
                <X className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
              )}
              <span className={check.passed ? "text-zinc-400" : "text-zinc-300"}>
                {check.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SeoScorePanel({ code, onFixRequest }: SeoScorePanelProps) {
  const [result, setResult] = useState<SeoResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const prevCodeRef = useRef<string>("");

  const analyze = useCallback(
    async (codeToAnalyze: string) => {
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
          body: JSON.stringify({ code: codeToAnalyze, targetKeyword: keyword || undefined }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Analysis failed");
        }

        const data: SeoResult = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
      } finally {
        setLoading(false);
      }
    },
    [keyword]
  );

  // Debounced re-analysis when code changes
  useEffect(() => {
    if (code === prevCodeRef.current) return;
    prevCodeRef.current = code;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      analyze(code);
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [code, analyze]);

  // Re-analyze when keyword changes
  useEffect(() => {
    if (code.trim()) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        analyze(code);
      }, 500);
    }
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  const handleAutoFix = () => {
    if (!result || !result.suggestions.length) return;

    const highPriority = result.suggestions
      .filter((s) => s.priority === "high")
      .map((s) => `- ${s.message}`)
      .join("\n");

    const mediumPriority = result.suggestions
      .filter((s) => s.priority === "medium")
      .slice(0, 5)
      .map((s) => `- ${s.message}`)
      .join("\n");

    const instruction = `Fix the following SEO issues in this HTML:\n\nHigh Priority:\n${highPriority || "None"}\n\nMedium Priority:\n${mediumPriority || "None"}\n\nApply all fixes while preserving the existing design and functionality. Add any missing meta tags, fix heading hierarchy, add alt text to images, and improve any other SEO elements.`;

    onFixRequest(instruction);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold">SEO Score</span>
        </div>
        <button
          onClick={() => analyze(code)}
          disabled={loading}
          className="p-1.5 rounded hover:bg-zinc-800 transition-colors disabled:opacity-50"
          title="Re-analyze"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Keyword input */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Target Keyword (optional)</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., web design agency"
            className="w-full px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-md text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Loading state */}
        {loading && !result && (
          <div className="flex flex-col items-center py-8 gap-3">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
            <span className="text-sm text-zinc-500">Analyzing SEO...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-300">{error}</span>
          </div>
        )}

        {/* No code state */}
        {!code.trim() && !loading && (
          <div className="flex flex-col items-center py-8 gap-2 text-zinc-600">
            <Search className="w-8 h-8" />
            <span className="text-sm">Generate or paste code to analyze SEO</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Overall score */}
            <div className="flex flex-col items-center py-2">
              <CircularScore score={result.score} />
              <span className="text-xs text-zinc-500 mt-2">Overall SEO Score</span>
            </div>

            {/* Top suggestions */}
            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Top Suggestions
                </h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {result.suggestions.slice(0, 6).map((suggestion, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 px-2.5 py-2 bg-zinc-800/50 rounded-md border border-zinc-700/30"
                    >
                      <PriorityBadge priority={suggestion.priority} />
                      <span className="text-xs text-zinc-300 leading-relaxed">{suggestion.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-fix button */}
            {result.suggestions.length > 0 && (
              <button
                onClick={handleAutoFix}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Auto-Fix SEO Issues
              </button>
            )}

            {/* Category breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
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
