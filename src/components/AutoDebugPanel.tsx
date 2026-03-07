"use client";

import { useState } from "react";
import {
  Bug,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";

interface DebugIssue {
  type: string;
  severity: "error" | "warning" | "info";
  message: string;
  line?: number;
  fix: string;
}

interface DebugResult {
  fixed_code: string;
  issues: DebugIssue[];
  score: number;
}

interface AutoDebugPanelProps {
  code: string;
  onApplyFix: (fixedCode: string) => void;
}

export default function AutoDebugPanel({ code, onApplyFix }: AutoDebugPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [applied, setApplied] = useState(false);

  const handleDebug = async () => {
    if (!code.trim()) {
      setError("No code to debug");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setApplied(false);

    try {
      const response = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Debug request failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFix = () => {
    if (result?.fixed_code) {
      onApplyFix(result.fixed_code);
      setApplied(true);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-400/10 border-emerald-400/30";
    if (score >= 50) return "bg-yellow-400/10 border-yellow-400/30";
    return "bg-red-400/10 border-red-400/30";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-gray-400 shrink-0" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "info":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const errorCount = result?.issues.filter((i) => i.severity === "error").length || 0;
  const warningCount = result?.issues.filter((i) => i.severity === "warning").length || 0;
  const infoCount = result?.issues.filter((i) => i.severity === "info").length || 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Debug Button */}
      <button
        onClick={handleDebug}
        disabled={isLoading || !code.trim()}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Bug className="w-4 h-4" />
            Debug &amp; Fix
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results Panel */}
      {result && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0f] overflow-hidden">
          {/* Header with score */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium text-white">Debug Results</span>

              {/* Issue count badges */}
              <div className="flex items-center gap-1.5">
                {errorCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getSeverityBadgeColor("error")}`}>
                    {errorCount}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getSeverityBadgeColor("warning")}`}>
                    {warningCount}
                  </span>
                )}
                {infoCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getSeverityBadgeColor("info")}`}>
                    {infoCount}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Score */}
              <div
                className={`px-3 py-1 rounded-full border text-sm font-bold ${getScoreBgColor(result.score)} ${getScoreColor(result.score)}`}
              >
                {result.score}/100
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </button>

          {isExpanded && (
            <div className="border-t border-white/10">
              {/* Issues List */}
              {result.issues.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  {result.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex gap-3 p-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                    >
                      {getSeverityIcon(issue.severity)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-gray-400 uppercase">
                            {issue.type}
                          </span>
                          {issue.line && (
                            <span className="text-xs text-gray-500">
                              Line {issue.line}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/90">{issue.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Fix: {issue.fix}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-4 text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">No issues found! Code looks great.</span>
                </div>
              )}

              {/* Apply Fixes Button */}
              {result.issues.length > 0 && (
                <div className="p-3 border-t border-white/10">
                  <button
                    onClick={handleApplyFix}
                    disabled={applied}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium transition-colors"
                  >
                    {applied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Fixes Applied
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Apply Fixes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
