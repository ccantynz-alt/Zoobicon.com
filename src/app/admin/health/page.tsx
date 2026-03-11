"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, AlertTriangle, Activity } from "lucide-react";

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  durationMs: number;
}

interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;
  totalDurationMs: number;
  checks: CheckResult[];
}

export default function AdminHealthPage() {
  const [quickResult, setQuickResult] = useState<HealthResponse | null>(null);
  const [deepResult, setDeepResult] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<"quick" | "deep" | null>(null);

  const runQuickCheck = useCallback(async () => {
    setLoading("quick");
    try {
      const res = await fetch("/api/health?deep=true");
      const data = await res.json();
      setQuickResult(data);
    } catch (err) {
      setQuickResult({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        totalDurationMs: 0,
        checks: [{ name: "fetch", status: "fail", message: err instanceof Error ? err.message : "Request failed", durationMs: 0 }],
      });
    }
    setLoading(null);
  }, []);

  const runDeepCheck = useCallback(async () => {
    setLoading("deep");
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setDeepResult(data);
    } catch (err) {
      setDeepResult({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        totalDurationMs: 0,
        checks: [{ name: "fetch", status: "fail", message: err instanceof Error ? err.message : "Request failed", durationMs: 0 }],
      });
    }
    setLoading(null);
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "pass") return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    if (status === "fail") return <XCircle className="w-5 h-5 text-red-400" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
  };

  const ResultCard = ({ title, result, isLoading }: { title: string; result: HealthResponse | null; isLoading: boolean }) => (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {result && (
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            result.status === "healthy"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
              : "bg-red-500/15 text-red-400 border border-red-500/25"
          }`}>
            {result.status.toUpperCase()}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-8 justify-center text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Running checks...</span>
        </div>
      )}

      {!isLoading && result && (
        <>
          <div className="space-y-3 mb-4">
            {result.checks.map((check, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
                <StatusIcon status={check.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{check.name}</span>
                    {check.durationMs > 0 && (
                      <span className="text-[10px] text-slate-500">{(check.durationMs / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 break-words">{check.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-between">
            <span>Total: {(result.totalDurationMs / 1000).toFixed(1)}s</span>
            <span>{new Date(result.timestamp).toLocaleString()}</span>
          </div>
        </>
      )}

      {!isLoading && !result && (
        <p className="text-sm text-slate-500 py-4 text-center">Click a button below to run</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0b11] text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">System Health</h1>
            <p className="text-sm text-slate-400">Monitor builder health, generation status, and API connectivity</p>
          </div>
        </div>

        {/* Auto-monitoring info */}
        <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-4 mb-8">
          <p className="text-sm text-blue-200/80">
            <strong>Auto-monitoring active.</strong> Vercel Cron runs a deep health check every 2 hours at <code className="text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">/api/health?deep=true</code>.
            Add <code className="text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">?webhook=YOUR_SLACK_URL</code> to get Slack alerts on failures.
          </p>
        </div>

        <div className="grid gap-6 mb-8">
          <ResultCard
            title="Quick Check (API Keys + Auth + Generation Test)"
            result={quickResult}
            isLoading={loading === "quick"}
          />
          <ResultCard
            title="Deep Check (Full Generation via /api/generate and /api/generate/stream)"
            result={deepResult}
            isLoading={loading === "deep"}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={runQuickCheck}
            disabled={loading !== null}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading === "quick" ? "Running..." : "Run Quick Check (~5s)"}
          </button>
          <button
            onClick={runDeepCheck}
            disabled={loading !== null}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading === "deep" ? "Running..." : "Run Deep Check (~60-120s)"}
          </button>
        </div>

        {/* External monitoring setup guide */}
        <div className="mt-12 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-3">External Monitoring Setup</h3>
          <p className="text-sm text-slate-400 mb-4">For continuous monitoring while you&apos;re away, use any of these free services to ping your health endpoint:</p>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="font-medium text-white mb-1">UptimeRobot (free, 5-min intervals)</p>
              <p className="text-xs text-slate-400">Add HTTP monitor: <code className="text-blue-300">GET https://zoobicon.com/api/health</code></p>
              <p className="text-xs text-slate-400">Alert on non-200 status. Gets you email/SMS on failures.</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="font-medium text-white mb-1">Slack Webhook Alerts</p>
              <p className="text-xs text-slate-400">Create a Slack webhook, then set the cron URL to:</p>
              <code className="text-xs text-blue-300 break-all">/api/health?deep=true&webhook=https://hooks.slack.com/services/YOUR/WEBHOOK/URL</code>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3">
              <p className="font-medium text-white mb-1">Vercel Cron (already configured)</p>
              <p className="text-xs text-slate-400">Runs every 2 hours automatically. Check Vercel dashboard &gt; Cron Jobs for logs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
