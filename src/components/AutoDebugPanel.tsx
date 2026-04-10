"use client";

import { useState, useRef, useCallback } from "react";
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
  RotateCw,
  Zap,
  Target,
  ArrowUp,
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
  model?: string;
}

interface IterationRecord {
  pass: number;
  model: string;
  score: number;
  issueCount: number;
  duration: number;
  reachedTarget: boolean;
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

  // Autonomous mode state
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);
  const [targetScore, setTargetScore] = useState(85);
  const [iterations, setIterations] = useState<IterationRecord[]>([]);
  const [currentPass, setCurrentPass] = useState(0);
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const abortRef = useRef(false);

  const runSingleDebug = useCallback(
    async (codeToDebug: string, model: string): Promise<DebugResult> => {
      const response = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToDebug, model }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Debug request failed");
      }

      return data;
    },
    []
  );

  const handleDebug = async () => {
    if (!code.trim()) {
      setError("No code to debug");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setApplied(false);
    setIterations([]);
    setCurrentPass(0);
    abortRef.current = false;

    if (autoFixEnabled) {
      // Autonomous loop
      setIsAutoRunning(true);
      let currentCode = code;
      const maxIterations = 3;
      const records: IterationRecord[] = [];

      try {
        for (let i = 1; i <= maxIterations; i++) {
          if (abortRef.current) break;

          setCurrentPass(i);

          // Determine model: Sonnet first, escalate to Opus if score < 60 after pass 1
          let model = "claude-sonnet-4-6";
          if (i > 1 && records.length > 0 && records[records.length - 1].score < 60) {
            model = "claude-opus-4-6";
          }

          const startTime = Date.now();
          const passResult = await runSingleDebug(currentCode, model);
          const duration = Date.now() - startTime;

          const reachedTarget = passResult.score >= targetScore;

          const record: IterationRecord = {
            pass: i,
            model,
            score: passResult.score,
            issueCount: passResult.issues.length,
            duration,
            reachedTarget,
          };

          records.push(record);
          setIterations([...records]);
          setResult(passResult);

          if (reachedTarget) {
            // Target reached, stop
            break;
          }

          if (i < maxIterations) {
            // Auto-apply fix for next pass
            currentCode = passResult.fixed_code;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
        setIsAutoRunning(false);
        setCurrentPass(0);
      }
    } else {
      // Manual single-shot mode (original behavior)
      try {
        const data = await runSingleDebug(code, "claude-sonnet-4-6");
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStop = () => {
    abortRef.current = true;
  };

  const handleApplyFix = () => {
    if (result?.fixed_code) {
      onApplyFix(result.fixed_code);
      setApplied(true);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-stone-400";
    if (score >= 50) return "text-stone-400";
    return "text-stone-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-stone-400/10 border-stone-400/30";
    if (score >= 50) return "bg-stone-400/10 border-stone-400/30";
    return "bg-stone-400/10 border-stone-400/30";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="w-4 h-4 text-stone-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-stone-400 shrink-0" />;
      case "info":
        return <Info className="w-4 h-4 text-stone-400 shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-gray-400 shrink-0" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-stone-500/20 text-stone-400 border-stone-500/30";
      case "warning":
        return "bg-stone-500/20 text-stone-400 border-stone-500/30";
      case "info":
        return "bg-stone-500/20 text-stone-400 border-stone-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getModelLabel = (model: string) => {
    if (model === "claude-opus-4-6") return "Opus";
    return "Sonnet";
  };

  const errorCount = result?.issues.filter((i: DebugIssue) => i.severity === "error").length || 0;
  const warningCount = result?.issues.filter((i: DebugIssue) => i.severity === "warning").length || 0;
  const infoCount = result?.issues.filter((i: DebugIssue) => i.severity === "info").length || 0;

  const lastIteration = iterations.length > 0 ? iterations[iterations.length - 1] : null;
  const targetReached = lastIteration?.reachedTarget ?? false;
  const maxIterationsHit = iterations.length >= 3 && !targetReached;

  return (
    <div className="flex flex-col gap-3">
      {/* Auto-Fix Toggle & Target Score */}
      <div className="flex flex-col gap-2 p-3 rounded-lg border border-white/10 bg-[#0a0a0f]">
        {/* Auto-Fix Toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-medium text-white">Auto-Fix Mode</span>
          </div>
          <button
            onClick={() => setAutoFixEnabled(!autoFixEnabled)}
            disabled={isLoading}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              autoFixEnabled ? "bg-stone-600" : "bg-gray-600"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                autoFixEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        {/* Description */}
        <p className="text-xs text-gray-500 pl-6">
          {autoFixEnabled
            ? "Loops up to 3 passes, auto-applies fixes, escalates model if needed"
            : "Single debug pass with manual fix application"}
        </p>

        {/* Target Score Slider (only visible when auto-fix is on) */}
        {autoFixEnabled && (
          <div className="flex items-center gap-3 mt-1 pl-6">
            <Target className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="text-xs text-gray-400 shrink-0">Target:</span>
            <input
              type="range"
              min={60}
              max={100}
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              disabled={isLoading}
              className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-stone-500 disabled:opacity-50"
            />
            <span className="text-xs font-mono font-bold text-stone-300 w-8 text-right">
              {targetScore}
            </span>
          </div>
        )}
      </div>

      {/* Debug Button */}
      {isAutoRunning ? (
        <button
          onClick={handleStop}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-stone-600 hover:bg-stone-500 text-white text-sm font-medium transition-colors"
        >
          <AlertCircle className="w-4 h-4" />
          Stop Auto-Fix
        </button>
      ) : (
        <button
          onClick={handleDebug}
          disabled={isLoading || !code.trim()}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-stone-600 hover:bg-stone-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {autoFixEnabled ? `Pass ${currentPass} — Analyzing...` : "Analyzing..."}
            </>
          ) : (
            <>
              {autoFixEnabled ? (
                <>
                  <Zap className="w-4 h-4" />
                  Auto Debug &amp; Fix
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4" />
                  Debug &amp; Fix
                </>
              )}
            </>
          )}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-stone-500/10 border border-stone-500/30 text-stone-400 text-sm">
          {error}
        </div>
      )}

      {/* Iteration History (autonomous mode) */}
      {iterations.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0f] overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b border-white/5">
            <RotateCw className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-medium text-white">Iteration History</span>
            {targetReached && (
              <span className="ml-auto flex items-center gap-1 text-xs text-stone-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Target reached
              </span>
            )}
            {maxIterationsHit && (
              <span className="ml-auto flex items-center gap-1 text-xs text-stone-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                Max iterations
              </span>
            )}
          </div>

          {/* Score progression summary */}
          <div className="px-3 py-2 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              {iterations.map((iter, idx) => (
                <span key={iter.pass} className="flex items-center gap-1.5">
                  {idx > 0 && <span className="text-gray-600">→</span>}
                  <span className={`font-bold ${getScoreColor(iter.score)}`}>
                    {iter.score}
                  </span>
                </span>
              ))}
              {targetReached && (
                <CheckCircle className="w-3.5 h-3.5 text-stone-400 ml-1" />
              )}
            </div>
          </div>

          {/* Detailed iteration rows */}
          <div className="divide-y divide-white/5">
            {iterations.map((iter) => (
              <div
                key={iter.pass}
                className="flex items-center gap-3 px-3 py-2.5 text-xs"
              >
                {/* Pass indicator */}
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                    iter.reachedTarget
                      ? "bg-stone-500/20 text-stone-400 ring-1 ring-stone-500/30"
                      : "bg-white/5 text-gray-400 ring-1 ring-white/10"
                  }`}
                >
                  {iter.pass}
                </div>

                {/* Model badge */}
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
                    iter.model === "claude-opus-4-6"
                      ? "bg-stone-500/20 text-stone-400 border border-stone-500/30"
                      : "bg-stone-500/20 text-stone-400 border border-stone-500/30"
                  }`}
                >
                  {getModelLabel(iter.model)}
                </span>

                {/* Escalation indicator */}
                {iter.model === "claude-opus-4-6" && iter.pass > 1 && (
                  <ArrowUp className="w-3 h-3 text-stone-400 shrink-0 -ml-1.5" />
                )}

                {/* Score */}
                <span className={`font-mono font-bold ${getScoreColor(iter.score)}`}>
                  {iter.score}/100
                </span>

                {/* Issues */}
                <span className="text-gray-500">
                  {iter.issueCount} issue{iter.issueCount !== 1 ? "s" : ""}
                </span>

                {/* Duration */}
                <span className="text-gray-600 ml-auto">{formatDuration(iter.duration)}</span>

                {/* Status icon */}
                {iter.reachedTarget ? (
                  <CheckCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                )}
              </div>
            ))}

            {/* Loading row for current pass */}
            {isAutoRunning && (
              <div className="flex items-center gap-3 px-3 py-2.5 text-xs animate-pulse">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-500/20 text-stone-400 ring-1 ring-stone-500/30 shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin" />
                </div>
                <span className="text-gray-400">Pass {currentPass} in progress...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Panel */}
      {result && !isAutoRunning && (
        <div className="rounded-lg border border-white/10 bg-[#0a0a0f] overflow-hidden">
          {/* Header with score */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-stone-400" />
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
                <div className="flex items-center gap-2 p-4 text-stone-400">
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
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-stone-600 hover:bg-stone-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium transition-colors"
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
