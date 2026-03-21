"use client";

import { useState } from "react";
import { Shield, AlertTriangle, Info, CheckCircle, Loader2 } from "lucide-react";

interface QAIssue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  line?: number;
}

interface QAResult {
  score: number;
  grade: string;
  issues: QAIssue[];
  passed: string[];
}

export default function QAPanel({ code }: { code: string }) {
  const [result, setResult] = useState<QAResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runQA = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch("/api/qa/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: code }),
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const gradeColor = (grade: string) => {
    if (grade === "A") return "text-emerald-400";
    if (grade === "B") return "text-blue-400";
    if (grade === "C") return "text-yellow-400";
    if (grade === "D") return "text-orange-400";
    return "text-red-400";
  };

  const severityIcon = (s: string) => {
    if (s === "error") return <AlertTriangle size={14} className="text-red-400" />;
    if (s === "warning") return <AlertTriangle size={14} className="text-yellow-400" />;
    return <Info size={14} className="text-blue-400" />;
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-white/50">
        Validate your generated code for HTML structure, accessibility, SEO, performance, and security issues.
      </p>

      <button
        onClick={runQA}
        disabled={!code || loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Analyzing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Shield size={16} /> Run QA Check
          </span>
        )}
      </button>

      {result && (
        <>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div>
              <div className="text-xs text-white/50">Quality Score</div>
              <div className="text-2xl font-bold text-white">{result.score}/100</div>
            </div>
            <div className={`text-4xl font-black ${gradeColor(result.grade)}`}>
              {result.grade}
            </div>
          </div>

          {result.issues.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-white/50 uppercase tracking-wider">Issues ({result.issues.length})</div>
              {result.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-white/5 text-xs">
                  {severityIcon(issue.severity)}
                  <div>
                    <span className="text-white/60">[{issue.category}]</span>{" "}
                    <span className="text-white/80">{issue.message}</span>
                    {issue.line && <span className="text-white/50 ml-1">L{issue.line}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.passed.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-white/50 uppercase tracking-wider">Passed ({result.passed.length})</div>
              {result.passed.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-emerald-400/70">
                  <CheckCircle size={12} /> {p}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
