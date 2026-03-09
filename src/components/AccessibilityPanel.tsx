"use client";

import { useState } from "react";
import { Accessibility, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface A11yCheck {
  rule: string;
  wcagLevel: "A" | "AA" | "AAA";
  status: "pass" | "fail" | "warning";
  message: string;
  impact: "critical" | "serious" | "moderate" | "minor";
}

interface A11yResult {
  score: number;
  level: string;
  checks: A11yCheck[];
  summary: { passed: number; failed: number; warnings: number };
}

export default function AccessibilityPanel({ code }: { code: string }) {
  const [result, setResult] = useState<A11yResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    if (!code) return;
    setLoading(true);
    try {
      const res = await fetch("/api/accessibility/check", {
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

  const levelColor = (level: string) => {
    if (level === "AAA") return "text-emerald-400";
    if (level === "AA") return "text-blue-400";
    if (level === "A") return "text-yellow-400";
    return "text-red-400";
  };

  const statusIcon = (s: string) => {
    if (s === "pass") return <CheckCircle size={14} className="text-emerald-400 shrink-0" />;
    if (s === "fail") return <XCircle size={14} className="text-red-400 shrink-0" />;
    return <AlertTriangle size={14} className="text-yellow-400 shrink-0" />;
  };

  const impactBadge = (impact: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500/20 text-red-400",
      serious: "bg-orange-500/20 text-orange-400",
      moderate: "bg-yellow-500/20 text-yellow-400",
      minor: "bg-blue-500/20 text-blue-400",
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${colors[impact] || colors.minor}`}>
        {impact}
      </span>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-white/40">
        Check WCAG 2.1 accessibility compliance. Ensures your site is usable by everyone.
      </p>

      <button
        onClick={runCheck}
        disabled={!code || loading}
        className="w-full py-2.5 rounded-lg text-sm font-medium bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Checking...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Accessibility size={16} /> Check Accessibility
          </span>
        )}
      </button>

      {result && (
        <>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
            <div>
              <div className="text-xs text-white/40">WCAG Level</div>
              <div className={`text-2xl font-bold ${levelColor(result.level)}`}>{result.level}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40">Score</div>
              <div className="text-2xl font-bold text-white">{result.score}</div>
            </div>
          </div>

          <div className="flex gap-3 text-xs">
            <span className="text-emerald-400">{result.summary.passed} passed</span>
            <span className="text-red-400">{result.summary.failed} failed</span>
            <span className="text-yellow-400">{result.summary.warnings} warnings</span>
          </div>

          <div className="space-y-1.5">
            {result.checks.map((check, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded bg-white/5 text-xs">
                {statusIcon(check.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/80 font-medium">{check.rule}</span>
                    <span className="text-white/30 text-[10px]">WCAG {check.wcagLevel}</span>
                    {check.status !== "pass" && impactBadge(check.impact)}
                  </div>
                  <div className="text-white/50 mt-0.5">{check.message}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
