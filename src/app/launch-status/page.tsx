"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Zap,
  ArrowRight,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Timer,
} from "lucide-react";

/**
 * Launch Readiness Tracker
 *
 * A live dashboard showing green/yellow/red ticks for every critical
 * capability. Craig sees at a glance what works, what's degraded, what's
 * broken — without having to poke around the site himself.
 *
 * This page is also a preview of where the Zoobicon design is heading:
 * glossy, AI-native, high-tech. Less "bright colours on black" and more
 * "$6.6B platform".
 */

type Status = "checking" | "pass" | "warn" | "fail";

interface Check {
  id: string;
  label: string;
  group: string;
  status: Status;
  message: string;
  detail?: string;
  latencyMs?: number;
  revenueCritical?: boolean;
}

interface SpeedRow {
  label: string;
  us: string;
  bolt: string;
  lovable: string;
  v0: string;
  weLead: boolean;
}

const SPEED_TARGETS: SpeedRow[] = [
  { label: "First preview", us: "<3s (target)", bolt: "3-5s", lovable: "30-90s", v0: "5-15s", weLead: true },
  { label: "Diff edit (one change)", us: "2-5s", bolt: "2-5s", lovable: "30-90s", v0: "5-15s", weLead: true },
  { label: "Full custom build", us: "<30s", bolt: "~30s", lovable: "30-90s", v0: "5-15s", weLead: false },
  { label: "Deploy to live URL", us: "<5s", bolt: "~10s", lovable: "~20s", v0: "~10s", weLead: true },
  { label: "Components in registry", us: "60+", bolt: "0 (from scratch)", lovable: "0 (from scratch)", v0: "shadcn only", weLead: true },
  { label: "Full-stack (DB + auth)", us: "Supabase auto", bolt: "yes", lovable: "yes", v0: "yes (new)", weLead: false },
  { label: "Domain purchase built in", us: "yes (OpenSRS)", bolt: "no", lovable: "no", v0: "no", weLead: true },
  { label: "AI video in same tool", us: "yes", bolt: "no", lovable: "no", v0: "no", weLead: true },
];

const INITIAL_CHECKS: Check[] = [
  // Tier 0 — revenue-critical
  { id: "builder", label: "AI Website Builder", group: "Revenue (Tier 0)", status: "checking", message: "Checking…", revenueCritical: true },
  { id: "video", label: "AI Video Creator", group: "Revenue (Tier 0)", status: "checking", message: "Checking…", revenueCritical: true },
  { id: "domains", label: "Domain Search + Purchase", group: "Revenue (Tier 0)", status: "checking", message: "Checking…", revenueCritical: true },
  { id: "auth", label: "Admin + User Login", group: "Revenue (Tier 0)", status: "checking", message: "Checking…", revenueCritical: true },

  // Infrastructure
  { id: "anthropic", label: "Anthropic (Claude)", group: "AI Providers", status: "checking", message: "Checking…" },
  { id: "openai", label: "OpenAI (failover)", group: "AI Providers", status: "checking", message: "Checking…" },
  { id: "gemini", label: "Google Gemini (failover)", group: "AI Providers", status: "checking", message: "Checking…" },
  { id: "replicate", label: "Replicate (video models)", group: "AI Providers", status: "checking", message: "Checking…" },

  // Platform
  { id: "database", label: "Neon Database", group: "Platform", status: "checking", message: "Checking…" },
  { id: "stripe", label: "Stripe Payments", group: "Platform", status: "checking", message: "Checking…" },
  { id: "registry", label: "Component Registry (60+)", group: "Platform", status: "checking", message: "Checking…" },
  { id: "supabase", label: "Supabase Auto-Provisioning", group: "Platform", status: "checking", message: "Checking…" },
];

export default function LaunchStatusPage() {
  const [checks, setChecks] = useState<Check[]>(INITIAL_CHECKS);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const updateCheck = useCallback((id: string, patch: Partial<Check>) => {
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const runChecks = useCallback(async () => {
    setRunning(true);

    // Reset all to checking
    setChecks((prev) => prev.map((c) => ({ ...c, status: "checking" as Status, message: "Checking…" })));

    // 1. /api/health — covers Anthropic, OpenAI, Gemini, Replicate, Stripe, Database
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json();
      const byName = new Map<string, { status: string; message: string; durationMs: number }>();
      for (const c of data.checks || []) byName.set(c.name, c);

      const mapPass = (s: string): Status =>
        s === "pass" ? "pass" : s === "warn" ? "warn" : "fail";

      if (byName.has("anthropic_api_key")) {
        const a = byName.get("anthropic_auth") || byName.get("anthropic_api_key")!;
        updateCheck("anthropic", {
          status: mapPass(a.status),
          message: a.message,
          latencyMs: a.durationMs,
        });
      }
      if (byName.has("openai_api_key")) {
        const o = byName.get("openai_api_key")!;
        updateCheck("openai", {
          status: mapPass(o.status),
          message: o.message,
          latencyMs: o.durationMs,
        });
      } else {
        updateCheck("openai", {
          status: "warn",
          message: "Not configured (builder will not failover)",
        });
      }
      if (byName.has("google_ai_key") || byName.has("gemini_api_key")) {
        const g = byName.get("google_ai_key") || byName.get("gemini_api_key")!;
        updateCheck("gemini", {
          status: mapPass(g.status),
          message: g.message,
          latencyMs: g.durationMs,
        });
      } else {
        updateCheck("gemini", {
          status: "warn",
          message: "Not configured (builder will not failover)",
        });
      }
      if (byName.has("replicate")) {
        const r = byName.get("replicate")!;
        updateCheck("replicate", {
          status: mapPass(r.status),
          message: r.message,
          latencyMs: r.durationMs,
        });
      }
      if (byName.has("database")) {
        const d = byName.get("database")!;
        updateCheck("database", {
          status: mapPass(d.status),
          message: d.message,
          latencyMs: d.durationMs,
        });
      }
      if (byName.has("stripe")) {
        const s = byName.get("stripe")!;
        updateCheck("stripe", {
          status: mapPass(s.status),
          message: s.message,
          latencyMs: s.durationMs,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      updateCheck("anthropic", { status: "fail", message: msg });
      updateCheck("openai", { status: "fail", message: msg });
      updateCheck("gemini", { status: "fail", message: msg });
      updateCheck("replicate", { status: "fail", message: msg });
      updateCheck("database", { status: "fail", message: msg });
      updateCheck("stripe", { status: "fail", message: msg });
    }

    // 2. Builder-specific health
    try {
      const res = await fetch("/api/health/builder", { cache: "no-store" });
      const data = await res.json();
      const registryOk = data.registry?.available;
      const registryCount = data.registry?.componentCount || 0;
      updateCheck("registry", {
        status: registryOk && registryCount >= 50 ? "pass" : registryOk ? "warn" : "fail",
        message: registryOk
          ? `${registryCount} components loaded`
          : data.registry?.hint || "Registry failed to load",
      });
      updateCheck("builder", {
        status: data.ok ? "pass" : "fail",
        message: data.ok
          ? `Ready (Anthropic ${data.anthropic?.latencyMs ?? "?"}ms)`
          : data.hint || "Builder not ready",
        latencyMs: data.anthropic?.latencyMs,
      });
    } catch (err) {
      updateCheck("builder", {
        status: "fail",
        message: err instanceof Error ? err.message : "Network error",
      });
      updateCheck("registry", { status: "fail", message: "Could not reach /api/health/builder" });
    }

    // 3. Video-specific health
    try {
      const res = await fetch("/api/health/video", { cache: "no-store" });
      const data = await res.json();
      const healthy = data.summary?.healthyModels || 0;
      const total = data.summary?.totalModels || 0;
      updateCheck("video", {
        status: data.ok && healthy > 0 ? "pass" : data.ok ? "warn" : "fail",
        message: data.ok
          ? `${healthy}/${total} models healthy`
          : data.hint || "Video pipeline not ready",
        detail: data.summary?.missingEnvCount
          ? `${data.summary.missingEnvCount} env vars missing`
          : undefined,
      });
    } catch (err) {
      updateCheck("video", {
        status: "fail",
        message: err instanceof Error ? err.message : "Network error",
      });
    }

    // 4. Auth readiness
    try {
      const res = await fetch("/api/auth/diagnose", { cache: "no-store" });
      const data = await res.json();
      const ready = data.adminLoginReady;
      const issues = (data.issues || []).length;
      updateCheck("auth", {
        status: ready ? "pass" : issues > 0 ? "warn" : "fail",
        message: ready
          ? "Admin login configured"
          : `${issues} config issue${issues === 1 ? "" : "s"}`,
        detail: !ready ? data.issues?.[0]?.hint : undefined,
      });
    } catch (err) {
      updateCheck("auth", {
        status: "fail",
        message: err instanceof Error ? err.message : "Network error",
      });
    }

    // 5. Domain search (we can probe the search endpoint with a known name)
    try {
      const res = await fetch("/api/domains/search?q=zoobicon-launch-probe&tlds=com", {
        cache: "no-store",
      });
      if (res.ok) {
        updateCheck("domains", {
          status: "pass",
          message: "OpenSRS lookup responding",
        });
      } else {
        updateCheck("domains", {
          status: "warn",
          message: `Search returned ${res.status}`,
        });
      }
    } catch (err) {
      updateCheck("domains", {
        status: "fail",
        message: err instanceof Error ? err.message : "Network error",
      });
    }

    // Supabase is configured-or-not, no live probe
    updateCheck("supabase", {
      status: "warn",
      message: "Set SUPABASE_ACCESS_TOKEN to enable auto-provisioning",
    });

    setLastRun(new Date());
    setRunning(false);
  }, [updateCheck]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  // Group checks by category
  const groups = Array.from(new Set(checks.map((c) => c.group)));

  // Tally
  const passCount = checks.filter((c) => c.status === "pass").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const revenueReady = checks
    .filter((c) => c.revenueCritical)
    .every((c) => c.status === "pass");

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-stone-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-stone-600/10 blur-[120px]" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-stone-500/5 blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link
            href="/"
            className="text-xs tracking-widest text-white/40 hover:text-white/80 uppercase transition-colors"
          >
            ← Zoobicon
          </Link>
          <button
            onClick={runChecks}
            disabled={running}
            className="group flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-xs font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            {running ? "Running checks…" : "Re-run checks"}
          </button>
        </div>

        {/* Hero */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] mb-5">
            <Sparkles className="w-3 h-3 text-stone-400" />
            <span className="text-[10px] tracking-widest text-white/60 uppercase">Live Launch Tracker</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
            Launch readiness
          </h1>
          <p className="text-lg text-white/50 max-w-2xl">
            Every critical system, checked live, every time you open this page. Green means
            revenue is flowing. Yellow means it&apos;ll work but degraded. Red means we lose money.
          </p>
          {lastRun && (
            <p className="text-xs text-white/30 mt-4 flex items-center gap-2">
              <Timer className="w-3 h-3" />
              Last checked {lastRun.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <SummaryCard
            label="Revenue ready"
            value={revenueReady ? "YES" : "NO"}
            accent={revenueReady ? "green" : "red"}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <SummaryCard label="Passing" value={String(passCount)} accent="green" icon={<CheckCircle2 className="w-4 h-4" />} />
          <SummaryCard label="Degraded" value={String(warnCount)} accent="yellow" icon={<AlertCircle className="w-4 h-4" />} />
          <SummaryCard label="Failing" value={String(failCount)} accent="red" icon={<XCircle className="w-4 h-4" />} />
        </div>

        {/* Check groups */}
        <div className="space-y-10 mb-16">
          {groups.map((group) => (
            <section key={group}>
              <h2 className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-4 font-medium">
                {group}
              </h2>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
                {checks
                  .filter((c) => c.group === group)
                  .map((check, idx, arr) => (
                    <CheckRow key={check.id} check={check} isLast={idx === arr.length - 1} />
                  ))}
              </div>
            </section>
          ))}
        </div>

        {/* Speed vs competitors */}
        <section className="mb-16">
          <h2 className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-4 font-medium">
            Speed vs the market
          </h2>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl overflow-hidden">
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] px-5 py-3 border-b border-white/[0.05] text-[10px] tracking-widest text-white/40 uppercase font-medium">
              <div>Metric</div>
              <div className="text-stone-300">Zoobicon</div>
              <div>Bolt.new</div>
              <div>Lovable</div>
              <div>v0.app</div>
            </div>
            {SPEED_TARGETS.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] px-5 py-4 border-b border-white/[0.03] last:border-b-0 text-sm items-center hover:bg-white/[0.02] transition-colors"
              >
                <div className="text-white/80">{row.label}</div>
                <div
                  className={`font-medium ${
                    row.weLead ? "text-stone-400" : "text-stone-400"
                  } flex items-center gap-2`}
                >
                  {row.weLead && <Zap className="w-3 h-3" />}
                  {row.us}
                </div>
                <div className="text-white/50">{row.bolt}</div>
                <div className="text-white/50">{row.lovable}</div>
                <div className="text-white/50">{row.v0}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-3 px-1">
            Green = Zoobicon leads. Amber = parity or behind — queued for fix in the next sprint.
          </p>
        </section>

        {/* Quick links */}
        <section className="mb-8">
          <h2 className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-4 font-medium">
            Jump to
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <QuickLink href="/builder" label="Try the builder" />
            <QuickLink href="/video-creator" label="Try the video creator" />
            <QuickLink href="/domains" label="Try domain search" />
            <QuickLink href="/auth/login" label="Admin login" />
            <QuickLink href="/admin-recover" label="Recovery (break glass)" />
            <QuickLink href="/admin" label="Admin dashboard" />
          </div>
        </section>
      </div>
    </div>
  );
}

function CheckRow({ check, isLast }: { check: Check; isLast: boolean }) {
  const icon =
    check.status === "checking" ? (
      <Loader2 className="w-4 h-4 animate-spin text-white/40" />
    ) : check.status === "pass" ? (
      <CheckCircle2 className="w-4 h-4 text-stone-400" />
    ) : check.status === "warn" ? (
      <AlertCircle className="w-4 h-4 text-stone-400" />
    ) : (
      <XCircle className="w-4 h-4 text-stone-400" />
    );

  const statusDot =
    check.status === "pass"
      ? "bg-stone-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
      : check.status === "warn"
      ? "bg-stone-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
      : check.status === "fail"
      ? "bg-stone-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]"
      : "bg-white/20";

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 ${
        isLast ? "" : "border-b border-white/[0.04]"
      } hover:bg-white/[0.02] transition-colors`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/90">{check.label}</span>
          {check.revenueCritical && (
            <span className="text-[9px] tracking-widest text-stone-300 uppercase px-1.5 py-0.5 rounded border border-stone-500/20 bg-stone-500/10">
              Revenue
            </span>
          )}
        </div>
        <div className="text-xs text-white/50 mt-0.5 truncate">{check.message}</div>
        {check.detail && <div className="text-[11px] text-white/30 mt-0.5">{check.detail}</div>}
      </div>
      {check.latencyMs != null && check.status === "pass" && (
        <div className="text-[10px] text-white/30 tabular-nums">{check.latencyMs}ms</div>
      )}
      {icon}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: "green" | "yellow" | "red";
  icon: React.ReactNode;
}) {
  const accentMap = {
    green: "from-stone-500/20 to-stone-500/0 border-stone-500/20 text-stone-300",
    yellow: "from-stone-500/20 to-stone-500/0 border-stone-500/20 text-stone-300",
    red: "from-stone-500/20 to-stone-500/0 border-stone-500/20 text-stone-300",
  };
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${accentMap[accent]} bg-gradient-to-br backdrop-blur-xl p-5`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-widest uppercase text-white/50">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-semibold mt-2 text-white">{value}</div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between px-5 py-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05] transition-all"
    >
      <span className="text-sm text-white/80 group-hover:text-white">{label}</span>
      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-1 transition-all" />
    </Link>
  );
}
