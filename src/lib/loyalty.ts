import { getSQL } from "./db";

export interface LoyaltyTier {
  name: string;
  minPoints: number;
}

export interface LoyaltyProgram {
  id: string;
  site_id: string;
  name: string;
  points_per_dollar: number;
  tiers: LoyaltyTier[];
  created_at: string;
}

export interface LoyaltyBalance {
  id: string;
  user_id: string;
  program_id: string;
  points: number;
  lifetime_points: number;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  program_id: string;
  delta: number;
  reason: string;
  created_at: string;
}

export interface LoyaltyReward {
  name: string;
  cost: number;
}

let initialized = false;

async function ensureSchema(): Promise<void> {
  if (initialized) return;
  const sql = getSQL();
  await sql`CREATE TABLE IF NOT EXISTS loyalty_programs (
    id text PRIMARY KEY,
    site_id text NOT NULL,
    name text NOT NULL,
    points_per_dollar numeric NOT NULL DEFAULT 1,
    tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS loyalty_balances (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    program_id text NOT NULL,
    points int NOT NULL DEFAULT 0,
    lifetime_points int NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    program_id text NOT NULL,
    delta int NOT NULL,
    reason text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  initialized = true;
}

function rid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function assertDb(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
}

export async function createProgram(input: {
  siteId: string;
  name: string;
  pointsPerDollar: number;
  tiers: LoyaltyTier[];
}): Promise<LoyaltyProgram> {
  assertDb();
  await ensureSchema();
  const sql = getSQL();
  const id = rid("lprog");
  const rows = (await sql`INSERT INTO loyalty_programs (id, site_id, name, points_per_dollar, tiers)
    VALUES (${id}, ${input.siteId}, ${input.name}, ${input.pointsPerDollar}, ${JSON.stringify(input.tiers)}::jsonb)
    RETURNING *`) as LoyaltyProgram[];
  return rows[0];
}

async function getOrCreateBalance(userId: string, programId: string): Promise<LoyaltyBalance> {
  const sql = getSQL();
  const existing = (await sql`SELECT * FROM loyalty_balances WHERE user_id = ${userId} AND program_id = ${programId} LIMIT 1`) as LoyaltyBalance[];
  if (existing.length > 0) return existing[0];
  const id = rid("lbal");
  const created = (await sql`INSERT INTO loyalty_balances (id, user_id, program_id) VALUES (${id}, ${userId}, ${programId}) RETURNING *`) as LoyaltyBalance[];
  return created[0];
}

export async function awardPoints(input: {
  userId: string;
  programId: string;
  points: number;
  reason: string;
}): Promise<LoyaltyBalance> {
  assertDb();
  await ensureSchema();
  if (input.points <= 0) throw new Error("points must be positive");
  const sql = getSQL();
  await getOrCreateBalance(input.userId, input.programId);
  const updated = (await sql`UPDATE loyalty_balances
    SET points = points + ${input.points},
        lifetime_points = lifetime_points + ${input.points},
        updated_at = now()
    WHERE user_id = ${input.userId} AND program_id = ${input.programId}
    RETURNING *`) as LoyaltyBalance[];
  await sql`INSERT INTO loyalty_transactions (id, user_id, program_id, delta, reason)
    VALUES (${rid("ltx")}, ${input.userId}, ${input.programId}, ${input.points}, ${input.reason})`;
  return updated[0];
}

export async function redeemPoints(input: {
  userId: string;
  programId: string;
  points: number;
  reward: string;
}): Promise<LoyaltyBalance> {
  assertDb();
  await ensureSchema();
  if (input.points <= 0) throw new Error("points must be positive");
  const sql = getSQL();
  const bal = await getOrCreateBalance(input.userId, input.programId);
  if (bal.points < input.points) throw new Error("insufficient points");
  const updated = (await sql`UPDATE loyalty_balances
    SET points = points - ${input.points}, updated_at = now()
    WHERE user_id = ${input.userId} AND program_id = ${input.programId}
    RETURNING *`) as LoyaltyBalance[];
  await sql`INSERT INTO loyalty_transactions (id, user_id, program_id, delta, reason)
    VALUES (${rid("ltx")}, ${input.userId}, ${input.programId}, ${-input.points}, ${`redeem:${input.reward}`})`;
  return updated[0];
}

export async function getBalance(userId: string, programId: string): Promise<LoyaltyBalance> {
  assertDb();
  await ensureSchema();
  return getOrCreateBalance(userId, programId);
}

export async function currentTier(userId: string, programId: string): Promise<LoyaltyTier | null> {
  assertDb();
  await ensureSchema();
  const sql = getSQL();
  const progRows = (await sql`SELECT * FROM loyalty_programs WHERE id = ${programId} LIMIT 1`) as LoyaltyProgram[];
  if (progRows.length === 0) return null;
  const bal = await getOrCreateBalance(userId, programId);
  const tiers = [...progRows[0].tiers].sort((a, b) => b.minPoints - a.minPoints);
  for (const t of tiers) {
    if (bal.lifetime_points >= t.minPoints) return t;
  }
  return null;
}

export async function listRewards(programId: string): Promise<LoyaltyReward[]> {
  assertDb();
  await ensureSchema();
  const sql = getSQL();
  const rows = (await sql`SELECT tiers FROM loyalty_programs WHERE id = ${programId} LIMIT 1`) as { tiers: LoyaltyTier[] }[];
  if (rows.length === 0) return [];
  return rows[0].tiers.map((t) => ({ name: t.name, cost: t.minPoints }));
}
