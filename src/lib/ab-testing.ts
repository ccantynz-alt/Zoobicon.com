import { sql } from "@/lib/db";

export interface Variant {
  key: string;
  weight: number;
  config: Record<string, unknown>;
}

export interface ExperimentRow {
  id: string;
  site_id: string;
  name: string;
  variants: Variant[];
  goal_event: string;
  status: string;
  created_at: string;
}

export interface VariantResult {
  key: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
  valueSum: number;
  probabilityBest: number;
}

export interface ExperimentResults {
  variants: VariantResult[];
  leader: string | null;
  confidence: number;
}

let tablesReady = false;

export async function ensureExperimentTables(): Promise<void> {
  if (tablesReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      site_id TEXT NOT NULL,
      name TEXT NOT NULL,
      variants JSONB NOT NULL,
      goal_event TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS experiment_assignments (
      id BIGSERIAL PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      variant_key TEXT NOT NULL,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(experiment_id, visitor_hash)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS experiment_conversions (
      id BIGSERIAL PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      variant_key TEXT NOT NULL,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      value DOUBLE PRECISION NOT NULL DEFAULT 0
    )
  `;
  tablesReady = true;
}

function normalizeVariants(variants: Variant[]): Variant[] {
  if (variants.length === 0) throw new Error("At least one variant required");
  const total = variants.reduce((s, v) => s + (v.weight || 0), 0);
  if (total <= 0) {
    const eq = 1 / variants.length;
    return variants.map((v) => ({ ...v, weight: eq }));
  }
  if (Math.abs(total - 1) < 1e-6) return variants;
  return variants.map((v) => ({ ...v, weight: v.weight / total }));
}

function genId(): string {
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createExperiment(
  siteId: string,
  name: string,
  variants: Variant[],
  goalEvent: string
): Promise<ExperimentRow> {
  await ensureExperimentTables();
  const normalized = normalizeVariants(variants);
  const id = genId();
  const rows = (await sql`
    INSERT INTO experiments (id, site_id, name, variants, goal_event, status)
    VALUES (${id}, ${siteId}, ${name}, ${JSON.stringify(normalized)}::jsonb, ${goalEvent}, 'running')
    RETURNING id, site_id, name, variants, goal_event, status, created_at
  `) as ExperimentRow[];
  return rows[0];
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

function pickVariant(variants: Variant[], visitorHash: string, expId: string): Variant {
  const r = hashString(`${expId}:${visitorHash}`);
  let acc = 0;
  for (const v of variants) {
    acc += v.weight;
    if (r <= acc) return v;
  }
  return variants[variants.length - 1];
}

export async function assignVariant(
  experimentId: string,
  visitorHash: string
): Promise<{ variantKey: string; config: Record<string, unknown> } | null> {
  await ensureExperimentTables();
  const rows = (await sql`
    SELECT id, site_id, name, variants, goal_event, status, created_at
    FROM experiments WHERE id = ${experimentId}
  `) as ExperimentRow[];
  if (rows.length === 0) return null;
  const exp = rows[0];
  const variants = exp.variants;
  const existing = (await sql`
    SELECT variant_key FROM experiment_assignments
    WHERE experiment_id = ${experimentId} AND visitor_hash = ${visitorHash}
    LIMIT 1
  `) as { variant_key: string }[];
  if (existing.length > 0) {
    const found = variants.find((v) => v.key === existing[0].variant_key);
    return {
      variantKey: existing[0].variant_key,
      config: found ? found.config : {},
    };
  }
  const chosen = pickVariant(variants, visitorHash, experimentId);
  await sql`
    INSERT INTO experiment_assignments (experiment_id, visitor_hash, variant_key)
    VALUES (${experimentId}, ${visitorHash}, ${chosen.key})
    ON CONFLICT (experiment_id, visitor_hash) DO NOTHING
  `;
  return { variantKey: chosen.key, config: chosen.config };
}

export async function recordConversion(
  experimentId: string,
  visitorHash: string,
  value = 0
): Promise<boolean> {
  await ensureExperimentTables();
  const assigned = (await sql`
    SELECT variant_key FROM experiment_assignments
    WHERE experiment_id = ${experimentId} AND visitor_hash = ${visitorHash}
    LIMIT 1
  `) as { variant_key: string }[];
  if (assigned.length === 0) return false;
  await sql`
    INSERT INTO experiment_conversions (experiment_id, visitor_hash, variant_key, value)
    VALUES (${experimentId}, ${visitorHash}, ${assigned[0].variant_key}, ${value})
  `;
  return true;
}

// Standard normal CDF via erf approximation
function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-x * x / 2);
  const p =
    d *
    t *
    (0.31938153 +
      t *
        (-0.356563782 +
          t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x > 0 ? 1 - p : p;
}

export function chiSquare(a: number, b: number, c: number, d: number): number {
  const n = a + b + c + d;
  if (n === 0) return 0;
  const num = n * Math.pow(a * d - b * c, 2);
  const den = (a + b) * (c + d) * (a + c) * (b + d);
  if (den === 0) return 0;
  return num / den;
}

function probBestVsControl(
  pA: number,
  nA: number,
  pB: number,
  nB: number
): number {
  // z-test of two proportions; returns P(B > A)
  if (nA === 0 || nB === 0) return 0.5;
  const pPool = (pA * nA + pB * nB) / (nA + nB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));
  if (se === 0) return pB > pA ? 1 : pB < pA ? 0 : 0.5;
  const z = (pB - pA) / se;
  return normCdf(z);
}

export async function getResults(experimentId: string): Promise<ExperimentResults | null> {
  await ensureExperimentTables();
  const rows = (await sql`
    SELECT id, site_id, name, variants, goal_event, status, created_at
    FROM experiments WHERE id = ${experimentId}
  `) as ExperimentRow[];
  if (rows.length === 0) return null;
  const exp = rows[0];

  const exposures = (await sql`
    SELECT variant_key, COUNT(*)::int AS n
    FROM experiment_assignments
    WHERE experiment_id = ${experimentId}
    GROUP BY variant_key
  `) as { variant_key: string; n: number }[];

  const conversions = (await sql`
    SELECT variant_key, COUNT(*)::int AS n, COALESCE(SUM(value), 0)::float8 AS v
    FROM experiment_conversions
    WHERE experiment_id = ${experimentId}
    GROUP BY variant_key
  `) as { variant_key: string; n: number; v: number }[];

  const expMap = new Map(exposures.map((r) => [r.variant_key, r.n]));
  const convMap = new Map(conversions.map((r) => [r.variant_key, r]));

  const variantResults: VariantResult[] = exp.variants.map((v) => {
    const e = expMap.get(v.key) ?? 0;
    const c = convMap.get(v.key);
    const conv = c ? c.n : 0;
    const valSum = c ? c.v : 0;
    return {
      key: v.key,
      exposures: e,
      conversions: conv,
      conversionRate: e > 0 ? conv / e : 0,
      valueSum: valSum,
      probabilityBest: 0,
    };
  });

  const control = variantResults[0];
  let leader: string | null = null;
  let leaderRate = -1;
  let confidence = 0;

  for (const v of variantResults) {
    if (v.conversionRate > leaderRate) {
      leaderRate = v.conversionRate;
      leader = v.key;
    }
    if (v.key === control.key) {
      v.probabilityBest = 0.5;
    } else {
      v.probabilityBest = probBestVsControl(
        control.conversionRate,
        control.exposures,
        v.conversionRate,
        v.exposures
      );
    }
  }

  if (leader && leader !== control.key) {
    const leaderVar = variantResults.find((v) => v.key === leader);
    if (leaderVar) confidence = leaderVar.probabilityBest;
  } else if (leader === control.key) {
    const best = variantResults
      .filter((v) => v.key !== control.key)
      .reduce<number>((m, v) => Math.max(m, v.probabilityBest), 0);
    confidence = 1 - best;
  }

  return { variants: variantResults, leader, confidence };
}
