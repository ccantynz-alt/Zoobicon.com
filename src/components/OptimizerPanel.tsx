"use client";

import { useState, useCallback } from "react";
import {
  Gauge,
  Search,
  Accessibility,
  Shield,
  Smartphone,
  Loader2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  History,
  ChevronDown,
  ChevronUp,
  Zap,
  RotateCw,
} from "lucide-react";

interface OptimizationIssue {
  severity: "error" | "warning" | "info";
  message: string;
  fix?: string;
}

interface CheckResult {
  category: string;
  score: number;
  issues: OptimizationIssue[];
  suggestions: string[];
}

interface OptimizationResult {
  score: number;
  checks: CheckResult[];
  optimized_html?: string;
  timestamp: string;
}

interface OptimizerPanelProps {
  code: string;
  onApplyFix: (code: string) => void;
  siteId?: string;
}

const CATEGORY_META: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  performance: {
    icon: <Gauge size={16} />,
    label: "Performance",
    color: "text-blue-400",
  },
  seo: {
    icon: <Search size={16} />,
    label: "SEO",
    color: "text-emerald-400",
  },
  accessibility: {
    icon: <Accessibility size={16} />,
    label: "Accessibility",
    color: "text-purple-400",
  },
  security: {
    icon: <Shield size={16} />,
    label: "Security",
    color: "text-orange-400",
  },
  mobile: {
    icon: <Smartphone size={16} />,
    label: "Mobile",
    color: "text-cyan-400",
  },
};

const ALL_CATEGORIES = ["performance", "seo", "accessibility", "security", "mobile"];

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
}

function scoreBgColor(score: number): string {
  if (score >= 90) return "bg-emerald-500/20 border-emerald-500/30";
  if (score >= 70) return "bg-yellow-500/20 border-yellow-500/30";
  if (score >= 50) return "bg-orange-500/20 border-orange-500/30";
  return "bg-red-500/20 border-red-500/30";
}

function scoreBarColor(score: number): string {
  if (score >= 90) return "bg-emerald-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function severityIcon(severity: string) {
  switch (severity) {
    case "error":
      return <AlertCircle size={12} className="text-red-400 shrink-0" />;
    case "warning":
      return <AlertTriangle size={12} className="text-yellow-400 shrink-0" />;
    default:
      return <Info size={12} className="text-blue-400 shrink-0" />;
  }
}

export default function OptimizerPanel({
  code,
  onApplyFix,
  siteId,
}: OptimizerPanelProps) {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixingCategory, setFixingCategory] = useState<string | null>(null);
  const [autoFixing, setAutoFixing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [history, setHistory] = useState<OptimizationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(
    new Set()
  );
  const [error, setError] = useState<string | null>(null);

  const runOptimize = useCallback(
    async (autoFix = false, checks?: string[]) => {
      if (!code) return;

      if (autoFix) {
        setAutoFixing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Simulate per-category loading
      const categoriesToRun = checks || ALL_CATEGORIES;
      setLoadingCategories(new Set(categoriesToRun));

      try {
        const res = await fetch("/api/hosting/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId: siteId || "preview",
            html: code,
            checks,
            autoFix,
          }),
        });

        if (res.status === 429) {
          setError("Rate limit exceeded. Please wait a minute before trying again.");
          return;
        }

        if (res.status === 413) {
          setError("HTML is too large to optimize (max 200KB).");
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || "Optimization failed");
          return;
        }

        const data: OptimizationResult = await res.json();
        setResult(data);

        // Add to history (keep last 3)
        setHistory((prev) => [data, ...prev.slice(0, 2)]);

        // Auto-expand categories with errors
        const withErrors = new Set<string>();
        for (const check of data.checks) {
          if (check.issues.some((i) => i.severity === "error")) {
            withErrors.add(check.category);
          }
        }
        setExpandedCategories(withErrors);

        // Apply auto-fixed HTML if available
        if (autoFix && data.optimized_html) {
          onApplyFix(data.optimized_html);
        }
      } catch {
        setError("Failed to connect to optimization service.");
      } finally {
        setLoading(false);
        setAutoFixing(false);
        setLoadingCategories(new Set());
      }
    },
    [code, siteId, onApplyFix]
  );

  const fixCategory = useCallback(
    async (category: string) => {
      setFixingCategory(category);
      await runOptimize(true, [category]);
      setFixingCategory(null);
    },
    [runOptimize]
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const issueCount = (check: CheckResult, severity?: string) => {
    if (!severity) return check.issues.length;
    return check.issues.filter((i) => i.severity === severity).length;
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-white/40">
        Analyze your site for performance, SEO, accessibility, security, and
        mobile issues. Auto-fix applies AI-suggested improvements.
      </p>

      {/* Main action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => runOptimize(false)}
          disabled={!code || loading || autoFixing}
          className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Analyzing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Zap size={16} /> Optimize
            </span>
          )}
        </button>

        {result && (
          <button
            onClick={() => runOptimize(true)}
            disabled={!code || loading || autoFixing}
            className="py-2.5 px-3 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
            title="Auto-Fix All"
          >
            {autoFixing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
          </button>
        )}

        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
              showHistory
                ? "bg-white/10 text-white"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
            title="History"
          >
            <History size={16} />
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Loading state with per-category progress */}
      {loading && loadingCategories.size > 0 && (
        <div className="space-y-2">
          {ALL_CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const isLoading = loadingCategories.has(cat);
            return (
              <div
                key={cat}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-xs"
              >
                <span className={meta.color}>{meta.icon}</span>
                <span className="text-white/60">{meta.label}</span>
                <span className="ml-auto">
                  {isLoading ? (
                    <Loader2
                      size={12}
                      className="animate-spin text-white/40"
                    />
                  ) : (
                    <CheckCircle size={12} className="text-emerald-400" />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-white/50 font-medium">
            Recent Runs
          </div>
          {history.map((run, idx) => (
            <button
              key={run.timestamp}
              onClick={() => {
                setResult(run);
                setShowHistory(false);
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
            >
              <span
                className={`text-lg font-bold ${scoreColor(run.score)}`}
              >
                {run.score}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/60">
                  {new Date(run.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-[10px] text-white/30">
                  {run.checks.length} checks &middot;{" "}
                  {run.checks.reduce((sum, c) => sum + c.issues.length, 0)}{" "}
                  issues
                </div>
              </div>
              {idx === 0 && (
                <span className="text-[10px] text-white/30 px-1.5 py-0.5 rounded bg-white/5">
                  Latest
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Overall score */}
      {result && !loading && (
        <>
          <div
            className={`p-4 rounded-xl border text-center ${scoreBgColor(result.score)}`}
          >
            <div className={`text-4xl font-black ${scoreColor(result.score)}`}>
              {result.score}
            </div>
            <div className="text-xs text-white/50 mt-1">
              Overall Optimization Score
            </div>
            <div className="flex justify-center gap-3 mt-2">
              {result.checks.map((check) => {
                const meta = CATEGORY_META[check.category];
                return (
                  <div
                    key={check.category}
                    className="flex items-center gap-1 text-[10px]"
                    title={`${meta?.label}: ${check.score}`}
                  >
                    <span className={meta?.color}>{meta?.icon}</span>
                    <span className={scoreColor(check.score)}>
                      {check.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category cards */}
          <div className="space-y-2">
            {result.checks.map((check) => {
              const meta = CATEGORY_META[check.category];
              const isExpanded = expandedCategories.has(check.category);
              const errors = issueCount(check, "error");
              const warnings = issueCount(check, "warning");
              const isFixing = fixingCategory === check.category;

              return (
                <div
                  key={check.category}
                  className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden"
                >
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(check.category)}
                    className="w-full flex items-center gap-2 p-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className={meta?.color}>{meta?.icon}</span>
                    <span className="text-sm font-medium text-white/80 flex-1">
                      {meta?.label}
                    </span>

                    {/* Issue badges */}
                    <div className="flex items-center gap-1.5">
                      {errors > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                          {errors}
                        </span>
                      )}
                      {warnings > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                          {warnings}
                        </span>
                      )}
                    </div>

                    {/* Score */}
                    <span
                      className={`text-sm font-bold ${scoreColor(check.score)}`}
                    >
                      {check.score}
                    </span>

                    {isExpanded ? (
                      <ChevronUp size={14} className="text-white/30" />
                    ) : (
                      <ChevronDown size={14} className="text-white/30" />
                    )}
                  </button>

                  {/* Score bar */}
                  <div className="px-3 pb-1">
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(check.score)}`}
                        style={{ width: `${check.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 space-y-2">
                      {/* Issues */}
                      {check.issues.length > 0 ? (
                        <div className="space-y-1.5">
                          {check.issues.map((issue, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-xs p-2 rounded bg-white/[0.03]"
                            >
                              {severityIcon(issue.severity)}
                              <div className="flex-1 min-w-0">
                                <div className="text-white/70">
                                  {issue.message}
                                </div>
                                {issue.fix && (
                                  <div className="text-white/40 mt-0.5 text-[10px]">
                                    Fix: {issue.fix}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 p-2">
                          <CheckCircle size={12} />
                          No issues found
                        </div>
                      )}

                      {/* Suggestions */}
                      {check.suggestions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">
                            Suggestions
                          </div>
                          {check.suggestions.map((s, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-white/40 py-0.5 flex items-start gap-1.5"
                            >
                              <Sparkles
                                size={10}
                                className="text-white/20 mt-0.5 shrink-0"
                              />
                              {s}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Fix button per category */}
                      {check.issues.some((i) => i.fix) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fixCategory(check.category);
                          }}
                          disabled={isFixing}
                          className="w-full mt-1 py-1.5 rounded text-[11px] font-medium bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                        >
                          {isFixing ? (
                            <>
                              <Loader2 size={12} className="animate-spin" />
                              Fixing...
                            </>
                          ) : (
                            <>
                              <RotateCw size={12} />
                              Fix {meta?.label} Issues
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Auto-fix all button */}
          {result.checks.some((c) => c.issues.some((i) => i.fix)) && (
            <button
              onClick={() => runOptimize(true)}
              disabled={autoFixing || loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-40"
            >
              {autoFixing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Applying
                  Fixes...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles size={16} /> Auto-Fix All Issues
                </span>
              )}
            </button>
          )}

          {/* Timestamp */}
          <div className="text-[10px] text-white/20 text-center">
            Last run: {new Date(result.timestamp).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
