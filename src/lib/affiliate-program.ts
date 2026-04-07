import { sql } from "@/lib/db";

export interface Affiliate {
  id: number;
  user_id: string;
  code: string;
  commission_pct: number;
  tier: string;
  payout_email: string;
  paypal_email: string | null;
  status: string;
  created_at: string;
}

export interface AffiliateStats {
  clicks: number;
  conversions: number;
  conversionRate: number;
  totalEarned: number;
  pendingPayout: number;
  paidOut: number;
}

export interface PayoutQueueEntry {
  affiliate_id: number;
  code: string;
  payout_email: string;
  paypal_email: string | null;
  conversion_ids: number[];
  total_cents: number;
}

const BASE = "https://zoobicon.com";

export async function ensureAffiliateTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS affiliates (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      commission_pct NUMERIC NOT NULL DEFAULT 30,
      tier TEXT NOT NULL DEFAULT 'standard',
      payout_email TEXT NOT NULL,
      paypal_email TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id SERIAL PRIMARY KEY,
      affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
      ip_hash TEXT,
      user_agent TEXT,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS affiliate_conversions (
      id SERIAL PRIMARY KEY,
      affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      order_amount_cents INTEGER NOT NULL,
      commission_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      confirmed_at TIMESTAMPTZ,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function genCode(len = 8): string {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return s;
}

export async function registerAffiliate(
  userId: string,
  payoutEmail: string,
  paypalEmail?: string
): Promise<{ affiliate: Affiliate; shareUrl: string }> {
  await ensureAffiliateTables();
  let code = genCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = (await sql`SELECT id FROM affiliates WHERE code = ${code}`) as Array<{ id: number }>;
    if (existing.length === 0) break;
    code = genCode();
  }
  const rows = (await sql`
    INSERT INTO affiliates (user_id, code, payout_email, paypal_email)
    VALUES (${userId}, ${code}, ${payoutEmail}, ${paypalEmail ?? null})
    RETURNING *
  `) as Affiliate[];
  return { affiliate: rows[0], shareUrl: `${BASE}/?ref=${code}` };
}

export async function trackClick(
  code: string,
  ipHash: string,
  userAgent: string
): Promise<{ ok: boolean }> {
  await ensureAffiliateTables();
  const rows = (await sql`SELECT id FROM affiliates WHERE code = ${code} AND status = 'active'`) as Array<{ id: number }>;
  if (rows.length === 0) return { ok: false };
  await sql`
    INSERT INTO affiliate_clicks (affiliate_id, ip_hash, user_agent)
    VALUES (${rows[0].id}, ${ipHash}, ${userAgent})
  `;
  return { ok: true };
}

export async function recordConversion(
  code: string,
  customerId: string,
  orderId: string,
  orderAmountCents: number
): Promise<{ ok: boolean; conversionId?: number; commissionCents?: number }> {
  await ensureAffiliateTables();
  const rows = (await sql`
    SELECT id, commission_pct FROM affiliates WHERE code = ${code} AND status = 'active'
  `) as Array<{ id: number; commission_pct: number }>;
  if (rows.length === 0) return { ok: false };
  const aff = rows[0];
  const commissionCents = Math.round((orderAmountCents * Number(aff.commission_pct)) / 100);
  const inserted = (await sql`
    INSERT INTO affiliate_conversions (affiliate_id, customer_id, order_id, order_amount_cents, commission_cents)
    VALUES (${aff.id}, ${customerId}, ${orderId}, ${orderAmountCents}, ${commissionCents})
    RETURNING id
  `) as Array<{ id: number }>;
  return { ok: true, conversionId: inserted[0].id, commissionCents };
}

export async function confirmConversion(conversionId: number): Promise<void> {
  await sql`
    UPDATE affiliate_conversions
    SET status = 'confirmed', confirmed_at = NOW()
    WHERE id = ${conversionId} AND status = 'pending'
  `;
}

export async function getStats(affiliateId: number): Promise<AffiliateStats> {
  await ensureAffiliateTables();
  const clickRows = (await sql`SELECT COUNT(*)::int AS c FROM affiliate_clicks WHERE affiliate_id = ${affiliateId}`) as Array<{ c: number }>;
  const convRows = (await sql`
    SELECT
      COUNT(*)::int AS conversions,
      COALESCE(SUM(commission_cents), 0)::int AS total_earned,
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN commission_cents ELSE 0 END), 0)::int AS pending_payout,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_cents ELSE 0 END), 0)::int AS paid_out
    FROM affiliate_conversions WHERE affiliate_id = ${affiliateId}
  `) as Array<{ conversions: number; total_earned: number; pending_payout: number; paid_out: number }>;
  const clicks = clickRows[0]?.c ?? 0;
  const c = convRows[0];
  const conversions = c?.conversions ?? 0;
  return {
    clicks,
    conversions,
    conversionRate: clicks > 0 ? conversions / clicks : 0,
    totalEarned: c?.total_earned ?? 0,
    pendingPayout: c?.pending_payout ?? 0,
    paidOut: c?.paid_out ?? 0,
  };
}

export async function getPayoutQueue(): Promise<PayoutQueueEntry[]> {
  await ensureAffiliateTables();
  const rows = (await sql`
    SELECT
      a.id AS affiliate_id,
      a.code,
      a.payout_email,
      a.paypal_email,
      ARRAY_AGG(c.id) AS conversion_ids,
      SUM(c.commission_cents)::int AS total_cents
    FROM affiliate_conversions c
    JOIN affiliates a ON a.id = c.affiliate_id
    WHERE c.status = 'confirmed'
    GROUP BY a.id, a.code, a.payout_email, a.paypal_email
  `) as Array<{
    affiliate_id: number;
    code: string;
    payout_email: string;
    paypal_email: string | null;
    conversion_ids: number[];
    total_cents: number;
  }>;
  return rows;
}

export async function markPaid(conversionIds: number[]): Promise<void> {
  if (conversionIds.length === 0) return;
  await sql`
    UPDATE affiliate_conversions
    SET status = 'paid', paid_at = NOW()
    WHERE id = ANY(${conversionIds}::int[]) AND status = 'confirmed'
  `;
}
