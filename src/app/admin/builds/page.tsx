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
import {
  getFlywheelStats,
} from "@/lib/flywheel/successful-builds";
import {
  getLatestSessionFunnel,
  getCostTrendSeries,
  getTopQualityPatterns,
} from "@/lib/flywheel/consolidate";
import {
  getNeedsImprovementIndustries,
} from "@/lib/flywheel/self-healing";
import {
  getPoolSnapshot,
  getProviderCapacity,
} from "@/lib/api-bank-pool";

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
  const [summary, recent, topFailing, flywheelStats, funnel, costTrend, topPatterns, needsImprovement] =
    await Promise.all([
      getBuildMetricsSummary(24),
      getRecentBuilds(50),
      getTopFailingComponents(24),
      getFlywheelStats(),
      getLatestSessionFunnel(),
      getCostTrendSeries(),
      getTopQualityPatterns(10),
      getNeedsImprovementIndustries(),
    ]);

  // Pool snapshot is in-process state, sync read.
  const poolSnapshot = getPoolSnapshot();
  const claudeCapacity = getProviderCapacity("claude");
  const openaiCapacity = getProviderCapacity("openai");
  const geminiCapacity = getProviderCapacity("gemini");

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

        {/* API capacity strip — the API bank pool (B22 extended) */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--ink)" }}>
            API capacity (current)
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <CapacityCard
              label="Anthropic"
              keys={claudeCapacity.keyCount}
              tokensPerMin={claudeCapacity.tokensPerMin}
              requestsPerMin={claudeCapacity.requestsPerMin}
            />
            <CapacityCard
              label="OpenAI"
              keys={openaiCapacity.keyCount}
              tokensPerMin={openaiCapacity.tokensPerMin}
              requestsPerMin={openaiCapacity.requestsPerMin}
            />
            <CapacityCard
              label="Gemini"
              keys={geminiCapacity.keyCount}
              tokensPerMin={geminiCapacity.tokensPerMin}
              requestsPerMin={geminiCapacity.requestsPerMin}
            />
          </div>
          {poolSnapshot.length > 0 && (
            <div className="mt-3 text-xs" style={{ color: "var(--ink-muted)" }}>
              Pool: {poolSnapshot.map((p) => `${p.name} (${(p.headroom * 100).toFixed(0)}% headroom${p.sidelined ? " — SIDELINED" : ""})`).join(" · ")}
            </div>
          )}
          <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
            To add more Anthropic capacity: open a new Anthropic org, get its API key, set <code>ANTHROPIC_API_KEY_2</code> (or _3, _4, …) in Vercel env vars. Each org adds 400k tokens/min and 4k RPM.
          </p>
        </section>

        {/* Flywheel — the compounding intelligence layer */}
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--ink)" }}>
            Flywheel
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="Successful builds banked" value={flywheelStats.totalBuilds.toLocaleString()} />
            <StatCard label="Avg quality" value={`${flywheelStats.avgQuality}/100`} tone={flywheelStats.avgQuality >= 85 ? "good" : flywheelStats.avgQuality >= 70 ? "warn" : "bad"} />
            <StatCard
              label="Submit → Deploy"
              value={funnel ? `${funnel.submitToDeployRate}%` : "—"}
              tone={funnel && funnel.submitToDeployRate >= 40 ? "good" : "warn"}
            />
            <StatCard
              label="Regen rate"
              value={funnel ? `${funnel.regenerateRate}%` : "—"}
              tone={funnel && funnel.regenerateRate <= 30 ? "good" : "warn"}
            />
            <StatCard label="Builds / session" value={funnel ? funnel.avgBuildsPerSession.toString() : "—"} />
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--ink-muted)" }}>
            Every successful build adds to the few-shot example bank, making the next build cheaper + better. Funnel + regen rate are the proof. Consolidation runs nightly at 03:00 UTC.
          </p>
        </section>

        {/* Industry needs improvement (B29 self-healing alerts) */}
        {needsImprovement.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--ink)" }}>
              Industries needing improvement
            </h2>
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--rule)", background: "var(--paper-elevated)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>Industry</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>Reason</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>Sample</th>
                  </tr>
                </thead>
                <tbody>
                  {needsImprovement.map((row) => (
                    <tr key={row.industry} style={{ borderBottom: "1px solid var(--rule)" }}>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--ink)" }}>{row.industry}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--ink-secondary)" }}>{row.reason}</td>
                      <td className="px-4 py-3 text-right text-sm" style={{ color: "var(--ink-muted)" }}>{row.sampleSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
              These industries show high regeneration rates — opportunity to ship better defaults / industry variants for them. Auto-updated hourly by self-heal cron.
            </p>
          </section>
        )}

        {/* Top quality patterns */}
        {topPatterns.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--ink)" }}>
              Prompt patterns that score highest
            </h2>
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--rule)", background: "var(--paper-elevated)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>Pattern</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>Avg score</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-muted)" }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topPatterns.map((row) => (
                    <tr key={row.pattern} style={{ borderBottom: "1px solid var(--rule)" }}>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--ink)" }}>{row.pattern}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: "var(--ink)" }}>{row.avgQuality}/100</td>
                      <td className="px-4 py-3 text-right text-sm" style={{ color: "var(--ink-muted)" }}>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
              Bigrams + trigrams from normalised prompts that correlated with quality ≥85. The customiser system prompt can use these as priors.
            </p>
          </section>
        )}

        {/* Cost trend chart (ASCII for now) */}
        {costTrend.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--ink)" }}>
              Build duration trend (last 60 days)
            </h2>
            <div className="overflow-hidden rounded-xl border p-4" style={{ borderColor: "var(--rule)", background: "var(--paper-elevated)" }}>
              <pre className="overflow-x-auto text-[11px] leading-tight" style={{ color: "var(--ink-secondary)" }}>
{renderAsciiTrend(costTrend)}
              </pre>
              <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                The line should trend DOWN over time as the flywheel matures (cache hits + few-shot context shrinkage). If it trends up, something regressed.
              </p>
            </div>
          </section>
        )}

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

function CapacityCard({
  label,
  keys,
  tokensPerMin,
  requestsPerMin,
}: {
  label: string;
  keys: number;
  tokensPerMin: number;
  requestsPerMin: number;
}) {
  const fmtTokens = tokensPerMin >= 1_000_000
    ? `${(tokensPerMin / 1_000_000).toFixed(1)}M`
    : `${(tokensPerMin / 1000).toFixed(0)}k`;
  const fmtReq = requestsPerMin >= 1000 ? `${(requestsPerMin / 1000).toFixed(1)}k` : String(requestsPerMin);
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--paper-elevated)", borderColor: "var(--rule)" }}
    >
      <div className="flex items-baseline justify-between">
        <div className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{label}</div>
        <div className="text-xs" style={{ color: "var(--ink-muted)" }}>{keys} key{keys === 1 ? "" : "s"}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--ink-muted)" }}>tokens/min</div>
          <div className="text-xl font-bold tabular-nums" style={{ color: "var(--ink)" }}>{fmtTokens}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "var(--ink-muted)" }}>requests/min</div>
          <div className="text-xl font-bold tabular-nums" style={{ color: "var(--ink)" }}>{fmtReq}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tiny ASCII chart renderer — keeps the admin page dependency-free.
 * If we later add a real chart lib, swap this for it.
 */
function renderAsciiTrend(series: Array<{ day: string; avgDurationMs: number; buildCount: number }>): string {
  if (series.length === 0) return "(no data)";
  const max = Math.max(...series.map((s) => s.avgDurationMs));
  const min = Math.min(...series.map((s) => s.avgDurationMs));
  const range = Math.max(1, max - min);
  const height = 8;
  const lines: string[] = [];
  for (let row = height; row >= 0; row--) {
    const threshold = min + (range * row) / height;
    const line = series.map((s) => (s.avgDurationMs >= threshold ? "█" : " ")).join("");
    const label = row === height ? max.toFixed(0).padStart(6) + "ms " : row === 0 ? min.toFixed(0).padStart(6) + "ms " : "       ";
    lines.push(label + "│ " + line);
  }
  lines.push("       └" + "─".repeat(series.length));
  lines.push("        " + series[0].day.slice(0, 10) + "  →  " + series[series.length - 1].day.slice(0, 10));
  return lines.join("\n");
}
