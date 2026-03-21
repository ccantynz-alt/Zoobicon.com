"use client";

import { useState } from "react";
import { Gauge, Loader2, Zap } from "lucide-react";

interface PerfIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  suggestion: string;
}

interface PerfResult {
  score: number;
  grade: string;
  metrics: {
    cssSize: number;
    jsSize: number;
    imageCount: number;
    externalRequests: number;
    domDepth: number;
    totalSize: number;
  };
  issues: PerfIssue[];
  optimizations: string[];
}

export default function PerformancePanel({ code }: { code: string }) {
  const [result, setResult] = useState<PerfResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch("/api/performance/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: code }),
      });
      if (res.ok) setResult(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-emerald-400";
    if (grade === "B") return "text-blue-400";
    if (grade === "C") return "text-yellow-400";
    return "text-red-400";
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const severityColor = (s: string) => {
    if (s === "critical") return "text-red-400";
    if (s === "warning") return "text-yellow-400";
    return "text-blue-400";
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-white/50">
        Lighthouse-style performance analysis. Check CSS/JS size, DOM depth, and optimization opportunities.
      </p>

      <button
        onClick={runAnalysis}
        disabled={!code || loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Analyzing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Gauge size={16} /> Analyze Performance
          </span>
        )}
      </button>

      {result && (
        <>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div>
              <div className="text-xs text-white/50">Performance Score</div>
              <div className="text-2xl font-bold text-white">{result.score}/100</div>
            </div>
            <div className={`text-4xl font-black ${gradeColor(result.grade)}`}>
              {result.grade}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "CSS", value: formatBytes(result.metrics.cssSize) },
              { label: "JS", value: formatBytes(result.metrics.jsSize) },
              { label: "Images", value: String(result.metrics.imageCount) },
              { label: "Total Size", value: formatBytes(result.metrics.totalSize) },
              { label: "DOM Depth", value: String(result.metrics.domDepth) },
              { label: "Ext. Requests", value: String(result.metrics.externalRequests) },
            ].map((m) => (
              <div key={m.label} className="p-2 rounded bg-white/5 text-xs">
                <div className="text-white/50">{m.label}</div>
                <div className="text-white font-medium">{m.value}</div>
              </div>
            ))}
          </div>

          {result.issues.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-white/50 uppercase tracking-wider">Issues</div>
              {result.issues.map((issue, i) => (
                <div key={i} className="p-2 rounded bg-white/5 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap size={12} className={severityColor(issue.severity)} />
                    <span className="text-white/80">{issue.message}</span>
                  </div>
                  <div className="text-white/50 pl-5">{issue.suggestion}</div>
                </div>
              ))}
            </div>
          )}

          {result.optimizations.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wider">Optimizations</div>
              {result.optimizations.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-emerald-400/70">
                  <Zap size={12} /> {opt}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
