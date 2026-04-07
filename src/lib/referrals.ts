/**
 * User-to-user referrals (peer-driven). Distinct from affiliate-program.ts
 * which models a paid partner network. This module is for end users sharing
 * codes with friends and earning credit/payouts.
 */
import { sql } from "./db";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export interface ReferralCode {
  id: string;
  userId: string;
  programId: string;
  code: string;
  createdAt: string;
}

export interface ReferralStats {
  clicks: number;
  signups: number;
  purchases: number;
  earnedCents: number;
}

export interface PayoutPeriod {
  period: string;
  earnedCents: number;
  purchases: number;
}

export type ReferralEventType = "click" | "signup" | "purchase";

interface CodeRow {
  id: string;
  user_id: string;
  program_id: string;
  code: string;
  created_at: string;
}

interface CountRow {
  c: string | number;
}

interface SumRow {
  s: string | number | null;
}

interface PayoutRow {
  period: string;
  s: string | number | null;
  c: string | number;
}

let schemaReady = false;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function newId(prefix: string): string {
  let out = prefix + "_";
  for (let i = 0; i < 16; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function newCode(): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS referral_codes (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      program_id  TEXT NOT NULL,
      code        TEXT UNIQUE NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS referral_events (
      id           TEXT PRIMARY KEY,
      code         TEXT NOT NULL,
      type         TEXT NOT NULL,
      ref_user_id  TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      ip           TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS referral_events_code_idx ON referral_events(code)`;
  await sql`CREATE INDEX IF NOT EXISTS referral_codes_user_idx ON referral_codes(user_id)`;
  schemaReady = true;
}

export async function createReferralCode(input: {
  userId: string;
  programId: string;
}): Promise<ReferralCode> {
  await ensureSchema();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const id = newId("rc");
    try {
      const rows = (await sql`
        INSERT INTO referral_codes (id, user_id, program_id, code)
        VALUES (${id}, ${input.userId}, ${input.programId}, ${code})
        RETURNING id, user_id, program_id, code, created_at
      `) as unknown as CodeRow[];
      const row = rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        programId: row.program_id,
        code: row.code,
        createdAt: String(row.created_at),
      };
    } catch {
      // collision on unique code, retry
    }
  }
  throw new Error("Failed to allocate unique referral code");
}

async function findCode(code: string): Promise<CodeRow | null> {
  const rows = (await sql`
    SELECT id, user_id, program_id, code, created_at
    FROM referral_codes
    WHERE code = ${code}
    LIMIT 1
  `) as unknown as CodeRow[];
  return rows[0] ?? null;
}

async function insertEvent(
  code: string,
  type: ReferralEventType,
  refUserId: string | null,
  amountCents: number,
  ip: string | null
): Promise<void> {
  const id = newId("re");
  await sql`
    INSERT INTO referral_events (id, code, type, ref_user_id, amount_cents, ip)
    VALUES (${id}, ${code}, ${type}, ${refUserId}, ${amountCents}, ${ip})
  `;
}

export async function trackClick(code: string, ip: string): Promise<boolean> {
  await ensureSchema();
  const found = await findCode(code);
  if (!found) return false;
  await insertEvent(code, "click", null, 0, ip);
  return true;
}

export async function recordSignup(
  code: string,
  newUserId: string
): Promise<boolean> {
  await ensureSchema();
  const found = await findCode(code);
  if (!found) return false;
  await insertEvent(code, "signup", newUserId, 0, null);
  return true;
}

export async function recordPurchase(
  code: string,
  amountCents: number
): Promise<boolean> {
  await ensureSchema();
  const found = await findCode(code);
  if (!found) return false;
  await insertEvent(code, "purchase", null, Math.max(0, Math.floor(amountCents)), null);
  return true;
}

export async function getStats(userId: string): Promise<ReferralStats> {
  await ensureSchema();
  const clicks = (await sql`
    SELECT COUNT(*)::int AS c
    FROM referral_events e
    JOIN referral_codes c ON c.code = e.code
    WHERE c.user_id = ${userId} AND e.type = 'click'
  `) as unknown as CountRow[];
  const signups = (await sql`
    SELECT COUNT(*)::int AS c
    FROM referral_events e
    JOIN referral_codes c ON c.code = e.code
    WHERE c.user_id = ${userId} AND e.type = 'signup'
  `) as unknown as CountRow[];
  const purchases = (await sql`
    SELECT COUNT(*)::int AS c
    FROM referral_events e
    JOIN referral_codes c ON c.code = e.code
    WHERE c.user_id = ${userId} AND e.type = 'purchase'
  `) as unknown as CountRow[];
  const earned = (await sql`
    SELECT COALESCE(SUM(e.amount_cents), 0)::bigint AS s
    FROM referral_events e
    JOIN referral_codes c ON c.code = e.code
    WHERE c.user_id = ${userId} AND e.type = 'purchase'
  `) as unknown as SumRow[];

  return {
    clicks: Number(clicks[0]?.c ?? 0),
    signups: Number(signups[0]?.c ?? 0),
    purchases: Number(purchases[0]?.c ?? 0),
    earnedCents: Math.floor(Number(earned[0]?.s ?? 0) * 0.1),
  };
}

export async function payouts(
  userId: string,
  period: "month" | "week" = "month"
): Promise<PayoutPeriod[]> {
  await ensureSchema();
  const fmt = period === "week" ? "IYYY-IW" : "YYYY-MM";
  const rows = (await sql`
    SELECT to_char(e.created_at, ${fmt}) AS period,
           COALESCE(SUM(e.amount_cents), 0)::bigint AS s,
           COUNT(*)::int AS c
    FROM referral_events e
    JOIN referral_codes c ON c.code = e.code
    WHERE c.user_id = ${userId} AND e.type = 'purchase'
    GROUP BY period
    ORDER BY period DESC
  `) as unknown as PayoutRow[];
  return rows.map((r) => ({
    period: r.period,
    earnedCents: Math.floor(Number(r.s ?? 0) * 0.1),
    purchases: Number(r.c ?? 0),
  }));
}
