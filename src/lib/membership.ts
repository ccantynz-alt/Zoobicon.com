import { sql } from "./db";

export interface Tier {
  id: string;
  site_id: string;
  name: string;
  price_cents: number;
  currency: string;
  interval: string;
  benefits: string[];
}

export interface Membership {
  id: string;
  user_id: string;
  tier_id: string;
  stripe_sub_id: string;
  status: string;
}

function rid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export async function ensureMembershipSchema(): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS membership_tiers (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    interval TEXT NOT NULL,
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tier_id TEXT NOT NULL,
    stripe_sub_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    canceled_at TIMESTAMPTZ
  )`;
  await sql`CREATE TABLE IF NOT EXISTS gated_content (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    required_tier_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export interface CreateTierInput {
  siteId: string;
  name: string;
  price_cents: number;
  currency: string;
  interval: string;
  benefits: string[];
}

export async function createTier(input: CreateTierInput): Promise<Tier> {
  await ensureMembershipSchema();
  const id = rid("tier");
  await sql`INSERT INTO membership_tiers (id, site_id, name, price_cents, currency, interval, benefits)
    VALUES (${id}, ${input.siteId}, ${input.name}, ${input.price_cents}, ${input.currency}, ${input.interval}, ${JSON.stringify(input.benefits)}::jsonb)`;
  return {
    id,
    site_id: input.siteId,
    name: input.name,
    price_cents: input.price_cents,
    currency: input.currency,
    interval: input.interval,
    benefits: input.benefits,
  };
}

export interface SubscribeInput {
  userId: string;
  tierId: string;
  stripeSubId: string;
}

export async function subscribeUser(input: SubscribeInput): Promise<Membership> {
  await ensureMembershipSchema();
  const id = rid("mem");
  await sql`INSERT INTO memberships (id, user_id, tier_id, stripe_sub_id, status)
    VALUES (${id}, ${input.userId}, ${input.tierId}, ${input.stripeSubId}, 'active')`;
  return {
    id,
    user_id: input.userId,
    tier_id: input.tierId,
    stripe_sub_id: input.stripeSubId,
    status: "active",
  };
}

export async function cancelSubscription(subId: string): Promise<void> {
  await ensureMembershipSchema();
  await sql`UPDATE memberships SET status = 'canceled', canceled_at = NOW() WHERE id = ${subId} OR stripe_sub_id = ${subId}`;
}

export async function checkAccess(userId: string, contentId: string): Promise<boolean> {
  await ensureMembershipSchema();
  const gated = (await sql`SELECT required_tier_ids FROM gated_content WHERE content_id = ${contentId} LIMIT 1`) as Array<{ required_tier_ids: string[] }>;
  if (gated.length === 0) return true;
  const required = gated[0].required_tier_ids;
  if (!Array.isArray(required) || required.length === 0) return true;
  const rows = (await sql`SELECT tier_id FROM memberships WHERE user_id = ${userId} AND status = 'active'`) as Array<{ tier_id: string }>;
  const userTiers = new Set(rows.map((r) => r.tier_id));
  return required.some((t) => userTiers.has(t));
}

export interface UnlockInput {
  userId: string;
  contentId: string;
  tierIds: string[];
}

export async function unlockContent(input: UnlockInput): Promise<{ id: string; content_id: string; required_tier_ids: string[] }> {
  await ensureMembershipSchema();
  const id = rid("gate");
  await sql`INSERT INTO gated_content (id, content_id, required_tier_ids)
    VALUES (${id}, ${input.contentId}, ${JSON.stringify(input.tierIds)}::jsonb)`;
  return { id, content_id: input.contentId, required_tier_ids: input.tierIds };
}

export async function listMyTier(userId: string): Promise<Tier[]> {
  await ensureMembershipSchema();
  const rows = (await sql`SELECT t.id, t.site_id, t.name, t.price_cents, t.currency, t.interval, t.benefits
    FROM membership_tiers t
    INNER JOIN memberships m ON m.tier_id = t.id
    WHERE m.user_id = ${userId} AND m.status = 'active'`) as Array<{
    id: string;
    site_id: string;
    name: string;
    price_cents: number;
    currency: string;
    interval: string;
    benefits: string[];
  }>;
  return rows.map((r) => ({
    id: r.id,
    site_id: r.site_id,
    name: r.name,
    price_cents: r.price_cents,
    currency: r.currency,
    interval: r.interval,
    benefits: Array.isArray(r.benefits) ? r.benefits : [],
  }));
}
