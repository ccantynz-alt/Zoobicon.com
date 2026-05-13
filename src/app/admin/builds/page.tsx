/**
 * /admin/builds — telemetry dashboard.
 *
 * KILLER-MOVES-BUILDER.md #5. Surfaces the data the build-telemetry
 * library writes on every AI builder request. Failure heatmap, p99
 * latency, top failure kinds, recent builds.
 *
 * Server component — pulls from Neon directly, no client fetch.
 */

import Link from "next/link";
import { sql } from "@/lib/db";
import { getBuildMetricsSummary } from "@/lib/build-telemetry";

export const dynamic = "force-dynamic";

interface RecentBuild {
  build_id: string;
  user_email: string | null;
  endpoint: string;
  mode: string | null;
  theme: string | null;
  total_duration_ms: number;
  ok: boolean;
  error_kind: string | null;
  error_message: string | null;
  quality_score: number | null;
  created_at: string;
}

async function getRecentBuilds(limit = 50): Promise<RecentBuild[]> {
  try {
    return await sql<RecentBuild>`
      SELECT build_id, user_email, endpoint, mode, theme, total_duration_ms,
             ok, error_kind, error_message, quality_score, created_at::text
      FROM builds
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
  } catch {
    return [];
  }
}

interface TopFailingComponent {
  component: string;
  failures: number;
}

async function getTopFailingComponents(sinceHours = 24): Promise<TopFailingComponent[]> {
  try {
    const sinceTs = new Date(Date.now() - sinceHours * 3600_000).toISOString();
    const rows = await sql<{ component: string; failures: string }>`
      SELECT (section->>'id') AS component, COUNT(*)::text AS failures
      FROM builds, jsonb_array_elements(failed_sections) AS section
      WHERE created_at >= ${sinceTs}
      GROUP BY component
      ORDER BY failures DESC
      LIMIT 10
    `;
    return rows.map((r) => ({ component: r.component, failures: Number(r.failures) }));
  } catch {
    return [];
  }
}

function formatDuration(ms: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function BuildsAdminPage() {
  const [summary, recent, topFailing] = await Promise.all([
    getBuildMetricsSummary(24),
    getRecentBuilds(50),
    getTopFailingComponents(24),
  ]);

  const noData = summary.totalBuilds === 0;

  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "var(--paper)", color: "var(--ink)" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--ink)" }}>
              Build telemetry
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--ink-muted)" }}>
              Last 24 hours · Auto-refresh on reload · Source: <code>builds</code> table in Neon
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)", color: "var(--ink)" }}
          >
            ← Admin home
          </Link>
        </div>

        {noData && (
          <div
            className="mb-8 rounded-xl border p-6"
            style={{ background: "var(--paper-elevated)", borderColor: "var(--rule)", color: "var(--ink-muted)" }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--ink)" }}>
              No build data yet
            </h2>
            <p className="mt-1 text-sm">
              The <code>builds</code> table is empty. After the next AI builder request lands, this page
              will start showing failure patterns, p99 latency, and cost. If you haven&apos;t already, visit{" "}
              <Link href="/api/db/init" className="underline" style={{ color: "var(--gold-deep)" }}>
                /api/db/init
              </Link>{" "}
              to ensure the schema exists.
            </p>
          </div>
        )}

        {/* Summary stat strip */}
        <section className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Builds (24h)" value={summary.totalBuilds.toLocaleString()} />
          <StatCard
            label="Success rate"
            value={summary.totalBuilds > 0 ? formatPercent(summary.successRate) : "—"}
            tone={summary.successRate >= 0.97 ? "good" : summary.successRate >= 0.9 ? "warn" : "bad"}
          />
          <StatCard
            label="Failures"
            value={summary.failureCount.toLocaleString()}
            tone={summary.failureCount === 0 ? "good" : summary.failureCount < 5 ? "warn" : "bad"}
          />
          <StatCard label="p50 duration" value={formatDuration(summary.p50DurationMs)} />
          <StatCard label="p95 duration" value={formatDuration(summary.p95DurationMs)} />
          <StatCard label="p99 duration" value={formatDuration(summary.p99DurationMs)} />
        </section>

        {/* Top failure kinds */}
        {summary.topFailureKinds.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--ink)" }}>
              Failure kinds (24h)
            </h2>
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--rule)", background: "var(--paper-elevated)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
                      Kind
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topFailureKinds.map((row) => (
                    <tr key={row.kind} style={{ borderBottom: "1px solid var(--rule)" }}>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--ink)" }}>{row.kind}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: "var(--ink)" }}>
                        {row.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Top failing components */}
        {topFailing.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--ink)" }}>
              Components that fell back to base template (24h)
            </h2>
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--rule)", background: "var(--paper-elevated)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
                      Component
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
                      Fallbacks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topFailing.map((row) => (
                    <tr key={row.component} style={{ borderBottom: "1px solid var(--rule)" }}>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--ink)" }}>{row.component}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: "var(--ink)" }}>
                        {row.failures}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
              These components are top candidates for the next quality pass (Move B7 — registry expansion with industry variants).
            </p>
          </section>
        )}

        {/* Recent builds */}
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--ink)" }}>
            Recent builds
          </h2>
          {recent.length === 0 ? (
            <div className="rounded-xl border p-6 text-sm" style={{ background: "var(--paper-elevated)", borderColor: "var(--rule)", color: "var(--ink-muted)" }}>
              No builds recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--rule)", background: "var(--paper-elevated)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                    {["Time", "User", "Endpoint", "Mode", "Theme", "Duration", "Quality", "Result"].map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((b) => {
                    const when = new Date(b.created_at).toLocaleString();
                    return (
                      <tr key={b.build_id} style={{ borderBottom: "1px solid var(--rule)" }}>
                        <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--ink-muted)" }}>{when}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--ink)" }}>{b.user_email || "(anon)"}</td>
                        <td className="px-3 py-2 text-xs font-mono" style={{ color: "var(--ink)" }}>{b.endpoint}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--ink-muted)" }}>{b.mode || "—"}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--ink-muted)" }}>{b.theme || "—"}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap" style={{ color: "var(--ink)" }}>{formatDuration(b.total_duration_ms)}</td>
                        <td className="px-3 py-2 text-xs" style={{ color: "var(--ink)" }}>{b.quality_score ?? "—"}</td>
                        <td className="px-3 py-2 text-xs whitespace-nowrap">
                          {b.ok ? (
                            <span className="rounded-md px-2 py-0.5" style={{ background: "var(--gold-soft)", color: "var(--gold-deep)" }}>
                              ok
                            </span>
                          ) : (
                            <span title={b.error_message || ""} className="rounded-md px-2 py-0.5" style={{ background: "var(--paper)", border: "1px solid var(--rule)", color: "var(--ink-muted)" }}>
                              {b.error_kind || "fail"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="mt-12 text-xs" style={{ color: "var(--ink-muted)" }}>
          Source files: <code>src/lib/build-telemetry.ts</code>, <code>src/lib/build-quota.ts</code>.
          Spec: <code>KILLER-MOVES-BUILDER.md</code> §B5.
        </footer>
      </div>
    </main>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" | "bad" }) {
  const accent =
    tone === "good" ? "var(--gold-deep)" :
    tone === "warn" ? "var(--gold)" :
    tone === "bad"  ? "var(--ink)"  :
    "var(--ink)";
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--paper-elevated)", borderColor: "var(--rule)" }}
    >
      <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "var(--ink-muted)" }}>
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
