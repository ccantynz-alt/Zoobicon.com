import { sql } from "@/lib/db";
import crypto from "crypto";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export interface GiftCard {
  id: string;
  code: string;
  amount_cents: number;
  currency: string;
  status: string;
  recipient_email: string | null;
  from_user_id: string | null;
  redeemed_by: string | null;
  redeemed_at: Date | null;
  expires_at: Date;
  created_at: Date;
}

export interface StoreCredit {
  id: string;
  user_id: string;
  amount_cents: number;
  source: string;
  source_id: string | null;
  created_at: Date;
}

export interface CreateGiftCardInput {
  amount: number;
  currency: string;
  recipientEmail?: string | null;
  fromUserId?: string | null;
  message?: string | null;
}

export interface RedeemResult {
  success: boolean;
  error?: string;
  amountCents?: number;
  currency?: string;
}

function ensureDb(): void {
  if (!process.env.DATABASE_URL) {
    const err = new Error("DATABASE_URL not configured") as Error & { status?: number };
    err.status = 503;
    throw err;
  }
}

function generateCode(): string {
  const bytes = crypto.randomBytes(16);
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += CROCKFORD[bytes[i] % 32];
  }
  return out;
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      recipient_email TEXT,
      from_user_id TEXT,
      message TEXT,
      redeemed_by TEXT,
      redeemed_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS store_credits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      source TEXT NOT NULL,
      source_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  schemaReady = true;
}

export async function createGiftCard(input: CreateGiftCardInput): Promise<GiftCard> {
  ensureDb();
  await ensureSchema();
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("amount must be > 0");
  }
  const id = newId("gc");
  const code = generateCode();
  const amountCents = Math.round(input.amount * 100);
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const rows = (await sql`
    INSERT INTO gift_cards (id, code, amount_cents, currency, status, recipient_email, from_user_id, message, expires_at)
    VALUES (${id}, ${code}, ${amountCents}, ${input.currency}, 'active', ${input.recipientEmail ?? null}, ${input.fromUserId ?? null}, ${input.message ?? null}, ${expires.toISOString()})
    RETURNING *
  `) as unknown as GiftCard[];
  return rows[0];
}

export async function redeemGiftCard(code: string, userId: string): Promise<RedeemResult> {
  ensureDb();
  await ensureSchema();
  if (!code || !userId) return { success: false, error: "code and userId required" };
  const updated = (await sql`
    UPDATE gift_cards
    SET status = 'redeemed', redeemed_by = ${userId}, redeemed_at = NOW()
    WHERE code = ${code} AND status = 'active' AND expires_at > NOW()
    RETURNING *
  `) as unknown as GiftCard[];
  if (updated.length === 0) {
    return { success: false, error: "invalid, expired, or already redeemed" };
  }
  const card = updated[0];
  const creditId = newId("sc");
  await sql`
    INSERT INTO store_credits (id, user_id, amount_cents, source, source_id)
    VALUES (${creditId}, ${userId}, ${card.amount_cents}, 'gift_card', ${card.id})
  `;
  return { success: true, amountCents: card.amount_cents, currency: card.currency };
}

export async function getBalance(userId: string): Promise<{ amountCents: number }> {
  ensureDb();
  await ensureSchema();
  const rows = (await sql`
    SELECT COALESCE(SUM(amount_cents), 0)::int AS total
    FROM store_credits WHERE user_id = ${userId}
  `) as unknown as Array<{ total: number }>;
  return { amountCents: rows[0]?.total ?? 0 };
}

export async function listUserCards(userId: string): Promise<GiftCard[]> {
  ensureDb();
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM gift_cards
    WHERE from_user_id = ${userId} OR redeemed_by = ${userId}
    ORDER BY created_at DESC
  `) as unknown as GiftCard[];
  return rows;
}
