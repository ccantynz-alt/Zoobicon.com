"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw, ArrowRight } from "lucide-react";

type Status = "ok" | "missing" | "warn" | "fail";

interface Check {
  id: string;
  label: string;
  category: "ai" | "db" | "payments" | "domains" | "video" | "email" | "auth" | "infra";
  required: boolean;
  status: Status;
  detail?: string;
}

interface Summary {
  total: number;
  ok: number;
  warn: number;
  missing: number;
  fail: number;
  requiredOk: number;
  requiredTotal: number;
}

const CATEGORY_LABELS: Record<Check["category"], string> = {
  ai: "AI providers",
  db: "Database",
  payments: "Payments",
  domains: "Domain registration",
  video: "AI video pipeline",
  email: "Email",
  auth: "Authentication",
  infra: "Infrastructure",
};

const CATEGORY_ORDER: Check["category"][] = ["payments", "db", "ai", "domains", "video", "email", "auth", "infra"];

function StatusIcon({ status }: { status: Status }) {
  if (status === "ok") return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  if (status === "warn") return <AlertTriangle className="w-5 h-5 text-amber-300" />;
  if (status === "missing") return <XCircle className="w-5 h-5 text-rose-400" />;
  return <XCircle className="w-5 h-5 text-rose-500" />;
}

export default function SetupPage() {
  const [data, setData] = useState<{ summary: Summary; checks: Check[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const grouped = data
    ? CATEGORY_ORDER.map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        checks: data.checks.filter((c) => c.category === cat),
      })).filter((g) => g.checks.length > 0)
    : [];

  const blockers = data?.checks.filter((c) => c.required && c.status !== "ok") || [];

  return (
    <div className="relative z-10 min-h-screen bg-[#0b1530] text-white pt-[72px] pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-12">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-1">Setup status</h1>
            <p className="text-white/55 text-sm">
              Every dependency the platform needs to take orders. Required items are revenue
              blockers — fix those first.
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg border border-white/[0.1] text-sm text-white/70 hover:bg-white/[0.05] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.07] text-rose-300 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Summary headline */}
            <div
              className="rounded-2xl border p-5 md:p-6 mb-6"
              style={{
                background:
                  blockers.length === 0
                    ? "linear-gradient(135deg, rgba(16,185,129,0.10) 0%, rgba(16,24,40,0.7) 100%)"
                    : "linear-gradient(135deg, rgba(232,212,176,0.07) 0%, rgba(16,24,40,0.7) 100%)",
                borderColor: blockers.length === 0 ? "rgba(16,185,129,0.30)" : "rgba(232,212,176,0.20)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                {blockers.length === 0 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-[#E8D4B0]" />
                )}
                <h2 className="text-xl font-semibold">
                  {blockers.length === 0
                    ? "All revenue paths are configured"
                    : `${blockers.length} required item${blockers.length === 1 ? "" : "s"} blocking revenue`}
                </h2>
              </div>
              <p className="text-sm text-white/65 mb-3">
                {data.summary.requiredOk} of {data.summary.requiredTotal} required ·{" "}
                {data.summary.ok} of {data.summary.total} total dependencies green.
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300">
                  {data.summary.ok} ok
                </span>
                {data.summary.warn > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300">
                    {data.summary.warn} optional
                  </span>
                )}
                {data.summary.missing > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300">
                    {data.summary.missing} missing
                  </span>
                )}
                {data.summary.fail > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200">
                    {data.summary.fail} failing
                  </span>
                )}
              </div>
            </div>

            {/* Quick action: db init link if any DB tables missing */}
            {blockers.some((b) => b.id === "db.tables") && (
              <div className="mb-6 p-4 rounded-xl border border-violet-400/30 bg-violet-500/[0.06] flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-violet-200">Database tables missing</p>
                  <p className="text-xs text-violet-200/70">
                    Run the schema initialiser once — it&apos;s safe to re-run.
                  </p>
                </div>
                <a
                  href="/api/db/init"
                  className="px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  Initialise DB <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Per-category checks */}
            <div className="space-y-6">
              {grouped.map((group) => (
                <div key={group.category}>
                  <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#E8D4B0]/85 mb-3">
                    {group.label}
                  </h3>
                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] divide-y divide-white/[0.05] overflow-hidden">
                    {group.checks.map((c) => (
                      <div key={c.id} className="px-4 py-3 flex items-start gap-3">
                        <StatusIcon status={c.status} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-white/85">{c.label}</span>
                            {c.required && (
                              <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-400/30 text-rose-300">
                                Required
                              </span>
                            )}
                          </div>
                          {c.detail && (
                            <p className="text-xs text-white/45 mt-0.5">{c.detail}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer reminders */}
            <div className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white/45 mb-3">
                Manual steps Vercel can&apos;t do for you
              </h3>
              <ul className="text-sm text-white/65 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#E8D4B0]">·</span>
                  Create the 4 Stripe products at{" "}
                  <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-[#E8D4B0] underline">
                    dashboard.stripe.com/products
                  </a>{" "}
                  and paste the price IDs as STRIPE_PRICE_STARTER / _PRO / _AGENCY / _WHITE_LABEL.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E8D4B0]">·</span>
                  Point the Stripe webhook at{" "}
                  <code className="text-white/85 bg-white/[0.06] px-1.5 py-0.5 rounded text-[12px]">
                    https://zoobicon.com/api/stripe/webhook
                  </code>{" "}
                  and copy the signing secret to STRIPE_WEBHOOK_SECRET.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E8D4B0]">·</span>
                  Set OPENSRS_ENV=live once you&apos;re ready to take real domain registrations.
                </li>
              </ul>
            </div>

            <p className="mt-6 text-xs text-white/35">
              Generated {data ? new Date().toLocaleString() : ""} · refresh after every env-var change.
              <Link href="/admin" className="ml-3 text-white/55 hover:text-white">
                ← Back to admin
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
