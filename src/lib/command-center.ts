/**
 * Command Center — single-snapshot platform telemetry for Craig.
 * Never throws. Every probe is wrapped, timed, and time-bounded.
 */
import { sql } from "@/lib/db";

export type AlertSeverity = "info" | "warn" | "crit";

export interface ModelHealth {
  model: string;
  ok: boolean;
  latencyMs: number;
}

export interface CommandCenterSnapshot {
  revenue: {
    mrrCents: number;
    todayCents: number;
    last7dCents: number;
    activeSubscriptions: number;
  };
  customers: {
    total: number;
    signupsToday: number;
    signupsLast7d: number;
    churned30d: number;
  };
  builder: {
    generationsToday: number;
    successRate: number;
    avgDurationMs: number;
    lastFailureAt: string | null;
  };
  video: {
    rendersToday: number;
    modelHealthChain: ModelHealth[];
  };
  support: {
    openThreads: number;
    aiHandledRatio: number;
    avgResponseMs: number;
  };
  infra: {
    dbLatencyMs: number;
    replicateOk: boolean;
    anthropicOk: boolean;
    stripeOk: boolean;
    mailgunOk: boolean;
  };
  alerts: Array<{ severity: AlertSeverity; message: string; ts: string }>;
  generatedAt: string;
}

type Row = Record<string, unknown>;

const num = (v: unknown, d = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
  return d;
};

const str = (v: unknown): string | null =>
  typeof v === "string" ? v : v instanceof Date ? v.toISOString() : null;

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function timedFetch(
  url: string,
  init?: RequestInit,
  timeoutMs = 3000
): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    return { ok: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  } finally {
    clearTimeout(t);
  }
}

async function probeReplicateModel(model: string): Promise<ModelHealth> {
  const token = process.env.REPLICATE_API_TOKEN;
  const url = `https://api.replicate.com/v1/models/${model}`;
  const r = await timedFetch(
    url,
    token ? { headers: { Authorization: `Token ${token}` } } : undefined,
    3000
  );
  return { model, ok: r.ok, latencyMs: r.latencyMs };
}

async function getRevenue(): Promise<CommandCenterSnapshot["revenue"]> {
  return safe(async () => {
    const rows = (await sql`
      SELECT
        COALESCE(SUM(CASE WHEN status='active' THEN amount_cents ELSE 0 END),0) AS mrr,
        COALESCE(SUM(CASE WHEN created_at::date = CURRENT_DATE THEN amount_cents ELSE 0 END),0) AS today,
        COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN amount_cents ELSE 0 END),0) AS last7d,
        COUNT(*) FILTER (WHERE status='active') AS active
      FROM subscriptions
    `) as Row[];
    const r = rows[0] ?? {};
    return {
      mrrCents: num(r.mrr),
      todayCents: num(r.today),
      last7dCents: num(r.last7d),
      activeSubscriptions: num(r.active),
    };
  }, { mrrCents: 0, todayCents: 0, last7dCents: 0, activeSubscriptions: 0 });
}

async function getCustomers(): Promise<CommandCenterSnapshot["customers"]> {
  return safe(async () => {
    const rows = (await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS today,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last7d,
        COUNT(*) FILTER (WHERE churned_at >= NOW() - INTERVAL '30 days') AS churned30d
      FROM users
    `) as Row[];
    const r = rows[0] ?? {};
    return {
      total: num(r.total),
      signupsToday: num(r.today),
      signupsLast7d: num(r.last7d),
      churned30d: num(r.churned30d),
    };
  }, { total: 0, signupsToday: 0, signupsLast7d: 0, churned30d: 0 });
}

async function getBuilder(): Promise<CommandCenterSnapshot["builder"]> {
  return safe(async () => {
    const rows = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE created_at::date = CURRENT_DATE) AS today,
        COALESCE(AVG(duration_ms),0) AS avg_ms,
        COALESCE(
          COUNT(*) FILTER (WHERE status='success')::float
          / NULLIF(COUNT(*),0),
          0
        ) AS success_rate,
        MAX(created_at) FILTER (WHERE status='failure') AS last_failure
      FROM builder_generations
    `) as Row[];
    const r = rows[0] ?? {};
    return {
      generationsToday: num(r.today),
      successRate: num(r.success_rate),
      avgDurationMs: Math.round(num(r.avg_ms)),
      lastFailureAt: str(r.last_failure),
    };
  }, { generationsToday: 0, successRate: 0, avgDurationMs: 0, lastFailureAt: null });
}

async function getVideoCount(): Promise<number> {
  return safe(async () => {
    const rows = (await sql`
      SELECT COUNT(*) AS c
      FROM video_renders
      WHERE created_at::date = CURRENT_DATE
    `) as Row[];
    return num(rows[0]?.c);
  }, 0);
}

async function getSupport(): Promise<CommandCenterSnapshot["support"]> {
  return safe(async () => {
    const rows = (await sql`
      SELECT
        COUNT(*) FILTER (WHERE status='open') AS open_threads,
        COALESCE(
          COUNT(*) FILTER (WHERE handled_by='ai')::float
          / NULLIF(COUNT(*),0),
          0
        ) AS ai_ratio,
        COALESCE(AVG(response_ms),0) AS avg_resp
      FROM support_threads
    `) as Row[];
    const r = rows[0] ?? {};
    return {
      openThreads: num(r.open_threads),
      aiHandledRatio: num(r.ai_ratio),
      avgResponseMs: Math.round(num(r.avg_resp)),
    };
  }, { openThreads: 0, aiHandledRatio: 0, avgResponseMs: 0 });
}

async function getDbLatency(): Promise<number> {
  const start = Date.now();
  const ok = await safe(async () => {
    await sql`SELECT 1`;
    return true;
  }, false);
  return ok ? Date.now() - start : -1;
}

export async function getCommandCenterSnapshot(): Promise<CommandCenterSnapshot> {
  const replicateChain = [
    "anthropic/claude-3.5-haiku",
    "black-forest-labs/flux-schnell",
    "jaaari/kokoro-82m",
    "cjwbw/sadtalker",
  ];

  const [
    revenue,
    customers,
    builder,
    rendersToday,
    support,
    dbLatencyMs,
    modelHealth,
    anthropicProbe,
    stripeProbe,
    mailgunProbe,
    replicateApiProbe,
  ] = await Promise.all([
    getRevenue(),
    getCustomers(),
    getBuilder(),
    getVideoCount(),
    getSupport(),
    getDbLatency(),
    Promise.allSettled(replicateChain.map((m) => probeReplicateModel(m))).then(
      (results) =>
        results.map((r, i) =>
          r.status === "fulfilled"
            ? r.value
            : { model: replicateChain[i] ?? "unknown", ok: false, latencyMs: 0 }
        )
    ),
    timedFetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: process.env.ANTHROPIC_API_KEY
        ? {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          }
        : {},
    }),
    timedFetch("https://api.stripe.com/v1", { method: "GET" }),
    timedFetch("https://api.mailgun.net/v3", { method: "GET" }),
    timedFetch("https://api.replicate.com/v1", { method: "GET" }),
  ]);

  const replicateOk = replicateApiProbe.ok || modelHealth.some((m) => m.ok);

  const alerts: CommandCenterSnapshot["alerts"] = [];
  const ts = new Date().toISOString();
  if (dbLatencyMs < 0) alerts.push({ severity: "crit", message: "Database unreachable", ts });
  else if (dbLatencyMs > 1500)
    alerts.push({ severity: "warn", message: `DB slow: ${dbLatencyMs}ms`, ts });
  if (!replicateOk) alerts.push({ severity: "crit", message: "Replicate API down", ts });
  if (!anthropicProbe.ok)
    alerts.push({ severity: "crit", message: "Anthropic API unreachable", ts });
  if (!stripeProbe.ok) alerts.push({ severity: "warn", message: "Stripe API probe failed", ts });
  if (!mailgunProbe.ok) alerts.push({ severity: "warn", message: "Mailgun API probe failed", ts });
  if (builder.successRate > 0 && builder.successRate < 0.85)
    alerts.push({
      severity: "warn",
      message: `Builder success rate ${(builder.successRate * 100).toFixed(0)}%`,
      ts,
    });
  const downModels = modelHealth.filter((m) => !m.ok).map((m) => m.model);
  if (downModels.length > 0)
    alerts.push({
      severity: downModels.length === modelHealth.length ? "crit" : "info",
      message: `Replicate models down: ${downModels.join(", ")}`,
      ts,
    });

  return {
    revenue,
    customers,
    builder,
    video: { rendersToday, modelHealthChain: modelHealth },
    support,
    infra: {
      dbLatencyMs,
      replicateOk,
      anthropicOk: anthropicProbe.ok,
      stripeOk: stripeProbe.ok,
      mailgunOk: mailgunProbe.ok,
    },
    alerts,
    generatedAt: ts,
  };
}
