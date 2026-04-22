"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Zap,
} from "lucide-react";

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

interface DeepCheck {
  name: string;
  category: string;
  status: "pass" | "fail" | "warn" | "skip";
  message: string;
  latencyMs: number;
  circuitState?: "closed" | "open" | "half-open";
  envVar?: string;
  required: boolean;
}

interface DeepHealthResponse {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  totalDurationMs: number;
  summary: {
    total: number;
    passing: number;
    warnings: number;
    failures: number;
    requiredFailures: number;
    openCircuits: string[];
  };
  byCategory: Record<string, DeepCheck[]>;
  checks: DeepCheck[];
}

const CATEGORY_LABELS: Record<string, string> = {
  ai: "AI Models",
  video: "Video",
  voice: "Voice & TTS",
  database: "Database",
  payment: "Payments",
  domain: "Domains",
  email: "Email",
  storage: "Storage",
  infra: "Infrastructure",
};

export default function AdminHealthPage() {
  const [quickResult, setQuickResult] = useState<HealthResponse | null>(null);
  const [deepResult, setDeepResult] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<"quick" | "deep" | null>(null);

  // Dependency dashboard (new /api/health/deep)
  const [depResult, setDepResult] = useState<DeepHealthResponse | null>(null);
  const [depLoading, setDepLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshRef = useRef<NodeJS.Timeout | null>(null);

  const runDependencyCheck = useCallback(async () => {
    setDepLoading(true);
    try {
      const res = await fetch("/api/health/deep", { cache: "no-store" });
      const data = await res.json();
      setDepResult(data);
    } catch (err) {
      setDepResult({
        status: "down",
        timestamp: new Date().toISOString(),
        totalDurationMs: 0,
        summary: { total: 0, passing: 0, warnings: 0, failures: 1, requiredFailures: 1, openCircuits: [] },
        byCategory: {},
        checks: [{
          name: "fetch",
          category: "infra",
          status: "fail",
          message: err instanceof Error ? err.message : "Fetch failed",
          latencyMs: 0,
          required: true,
        }],
      });
    }
    setDepLoading(false);
  }, []);

  // On mount, run the dependency check once
  useEffect(() => {
    runDependencyCheck();
  }, [runDependencyCheck]);

  // Optional auto-refresh every 30s
  useEffect(() => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    if (autoRefresh) {
      refreshRef.current = setInterval(runDependencyCheck, 30000);
    }
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [autoRefresh, runDependencyCheck]);

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
    if (status === "pass") return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === "fail") return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertTriangle className="w-5 h-5 text-amber-500" />;
  };

  const ResultCard = ({ title, result, isLoading }: { title: string; result: HealthResponse | null; isLoading: boolean }) => (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        {result && (
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            result.status === "healthy"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {result.status.toUpperCase()}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 py-8 justify-center text-slate-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Running checks...</span>
        </div>
      )}

      {!isLoading && result && (
        <>
          <div className="space-y-3 mb-4">
            {result.checks.map((check, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                <StatusIcon status={check.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{check.name}</span>
                    {check.durationMs > 0 && (
                      <span className="text-[10px] text-slate-400">{(check.durationMs / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 break-words">{check.message}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Total: {(result.totalDurationMs / 1000).toFixed(1)}s</span>
            <span>{new Date(result.timestamp).toLocaleString()}</span>
          </div>
        </>
      )}

      {!isLoading && !result && (
        <p className="text-sm text-slate-400 py-4 text-center">Click a button below to run</p>
      )}
    </div>
  );

  return (
    <div>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <Activity className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">System Health</h1>
            <p className="text-sm text-slate-600">Monitor builder health, generation status, and API connectivity</p>
          </div>
        </div>

        {/* Auto-monitoring info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-slate-700">
            <strong>Auto-monitoring active.</strong> Vercel Cron runs a deep health check every 2 hours at <code className="text-xs bg-blue-100 px-1.5 py-0.5 rounded">/api/health?deep=true</code>.
            Add <code className="text-xs bg-blue-100 px-1.5 py-0.5 rounded">?webhook=YOUR_SLACK_URL</code> to get Hash alerts on failures.
          </p>
        </div>

        {/* Dependency dashboard — real-time state of every external provider */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Live Dependency Status</h2>
                <p className="text-xs text-slate-500">Every external provider, pinged in parallel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {depResult && (
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  depResult.status === "healthy" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  depResult.status === "degraded" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-red-50 text-red-700 border-red-200"
                }`}>
                  {depResult.status.toUpperCase()}
                </span>
              )}
              <button
                onClick={() => setAutoRefresh((v) => !v)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  autoRefresh
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </button>
              <button
                onClick={runDependencyCheck}
                disabled={depLoading}
                className="text-xs px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
              >
                <RefreshCw className={`w-3 h-3 inline mr-1 ${depLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {depResult && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Total</div>
                  <div className="text-xl font-semibold text-slate-800">{depResult.summary.total}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <div className="text-xs text-emerald-600">Passing</div>
                  <div className="text-xl font-semibold text-emerald-700">{depResult.summary.passing}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="text-xs text-amber-600">Warnings</div>
                  <div className="text-xl font-semibold text-amber-700">{depResult.summary.warnings}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs text-red-600">Failures</div>
                  <div className="text-xl font-semibold text-red-700">{depResult.summary.failures}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Required fails</div>
                  <div className={`text-xl font-semibold ${depResult.summary.requiredFailures > 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {depResult.summary.requiredFailures}
                  </div>
                </div>
              </div>

              {depResult.summary.openCircuits.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
                  <div className="text-xs font-semibold text-red-700 mb-1">Open circuit breakers</div>
                  <div className="text-xs text-red-600">{depResult.summary.openCircuits.join(", ")}</div>
                </div>
              )}

              <div className="space-y-5">
                {Object.entries(depResult.byCategory).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      {CATEGORY_LABELS[cat] || cat}
                    </div>
                    <div className="grid gap-2">
                      {items.map((c) => (
                        <div
                          key={c.name}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            c.status === "pass" ? "bg-emerald-50 border-emerald-200" :
                            c.status === "fail" ? "bg-red-50 border-red-200" :
                            "bg-amber-50 border-amber-200"
                          }`}
                        >
                          <div className="mt-0.5">
                            {c.status === "pass" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                             c.status === "fail" ? <XCircle className="w-4 h-4 text-red-500" /> :
                             <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                              {c.required && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">REQUIRED</span>
                              )}
                              {c.circuitState && c.circuitState !== "closed" && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                  c.circuitState === "open"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>
                                  CIRCUIT {c.circuitState.toUpperCase()}
                                </span>
                              )}
                              {c.latencyMs > 0 && (
                                <span className="text-[10px] text-slate-400">{c.latencyMs}ms</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 break-words">{c.message}</p>
                            {c.envVar && c.status !== "pass" && (
                              <p className="text-[10px] text-slate-400 mt-1 font-mono">env: {c.envVar}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-400 mt-4 flex items-center justify-between">
                <span>Total: {(depResult.totalDurationMs / 1000).toFixed(1)}s</span>
                <span>{new Date(depResult.timestamp).toLocaleString()}</span>
              </div>
            </>
          )}

          {depLoading && !depResult && (
            <div className="flex items-center gap-3 py-8 justify-center text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Pinging every provider...</span>
            </div>
          )}
        </div>

        <div className="grid gap-6 mb-8">
          <ResultCard
            title="Quick Check (API Keys + Auth + Generation Test)"
            result={quickResult}
            isLoading={loading === "quick"}
          />
          <ResultCard
            title="Deep Check (Full Generation via /api/generate/react)"
            result={deepResult}
            isLoading={loading === "deep"}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={runQuickCheck}
            disabled={loading !== null}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading === "quick" ? "Running..." : "Run Quick Check (~5s)"}
          </button>
          <button
            onClick={runDeepCheck}
            disabled={loading !== null}
            className="flex-1 py-3 rounded-xl text-sm font-medium bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading === "deep" ? "Running..." : "Run Deep Check (~60-120s)"}
          </button>
        </div>

        {/* External monitoring setup guide */}
        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-3">External Monitoring Setup</h3>
          <p className="text-sm text-slate-600 mb-4">For continuous monitoring while you&apos;re away, use any of these free services to ping your health endpoint:</p>
          <div className="space-y-3 text-sm text-slate-700">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="font-medium text-slate-800 mb-1">UptimeRobot (free, 5-min intervals)</p>
              <p className="text-xs text-slate-600">Add HTTP monitor: <code className="text-indigo-600">GET https://zoobicon.com/api/health</code></p>
              <p className="text-xs text-slate-600">Alert on non-200 status. Gets you email/SMS on failures.</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="font-medium text-slate-800 mb-1">Hash Webhook Alerts</p>
              <p className="text-xs text-slate-600">Create a Hash webhook, then set the cron URL to:</p>
              <code className="text-xs text-indigo-600 break-all">/api/health?deep=true&webhook=https://hooks.slack.com/services/YOUR/WEBHOOK/URL</code>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="font-medium text-slate-800 mb-1">Vercel Cron (already configured)</p>
              <p className="text-xs text-slate-600">Runs every 2 hours automatically. Check Vercel dashboard &gt; Cron Jobs for logs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
