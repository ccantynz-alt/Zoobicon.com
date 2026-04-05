/**
 * Public API Authentication & Key Management
 *
 * Zoobicon Public API at api.zoobicon.ai
 * Developers pay per API call to use our video, site, image, and domain services.
 *
 * Key format: zbk_live_[32 random chars] (production)
 *             zbk_test_[32 random chars] (sandbox)
 *
 * Auth: Bearer token in Authorization header
 * Rate limits: Based on plan (free: 100/day, pro: 10K/day, enterprise: unlimited)
 *
 * Revenue model:
 *   - Video generation: $0.50-1.00/video
 *   - Site generation: $1.00-2.00/site
 *   - Image generation: $0.10/image
 *   - Domain search: $0.01/search
 *   - AI name generation: $0.05/batch
 */

import { sql } from "./db";
import crypto from "crypto";

export interface APIKey {
  id: string;
  key: string; // zbk_live_xxx or zbk_test_xxx
  name: string;
  ownerEmail: string;
  plan: "free" | "pro" | "enterprise";
  environment: "live" | "test";
  rateLimitPerDay: number;
  usageToday: number;
  createdAt: Date;
  lastUsedAt: Date | null;
  active: boolean;
}

export interface APIUsageRecord {
  keyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  cost: number;
  timestamp: Date;
}

// Rate limits by plan
const RATE_LIMITS: Record<string, number> = {
  free: 100,
  pro: 10000,
  enterprise: 1000000,
};

// Cost per API call by endpoint
export const API_PRICING: Record<string, number> = {
  "/v1/video/generate": 0.50,
  "/v1/sites/generate": 1.00,
  "/v1/images/generate": 0.10,
  "/v1/domains/search": 0.01,
  "/v1/names/generate": 0.05,
  "/v1/transcribe": 0.10,
  "/v1/tts": 0.05,
};

/**
 * Initialize API key tables.
 */
export async function ensureAPIKeyTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key_hash        TEXT UNIQUE NOT NULL,
      key_prefix      TEXT NOT NULL,
      name            TEXT NOT NULL DEFAULT 'Default',
      owner_email     TEXT NOT NULL,
      plan            TEXT NOT NULL DEFAULT 'free',
      environment     TEXT NOT NULL DEFAULT 'live',
      rate_limit      INTEGER NOT NULL DEFAULT 100,
      active          BOOLEAN NOT NULL DEFAULT true,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at    TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS api_keys_owner_idx ON api_keys (owner_email)`;
  await sql`CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys (key_hash)`;

  await sql`
    CREATE TABLE IF NOT EXISTS api_usage (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key_id          UUID NOT NULL REFERENCES api_keys(id),
      endpoint        TEXT NOT NULL,
      method          TEXT NOT NULL DEFAULT 'POST',
      status_code     INTEGER NOT NULL,
      response_time   INTEGER NOT NULL DEFAULT 0,
      cost            DECIMAL(10,4) NOT NULL DEFAULT 0,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS api_usage_key_idx ON api_usage (key_id)`;
  await sql`CREATE INDEX IF NOT EXISTS api_usage_date_idx ON api_usage (created_at)`;
}

/**
 * Generate a new API key for a user.
 */
export async function createAPIKey(
  ownerEmail: string,
  name: string = "Default",
  environment: "live" | "test" = "live",
  plan: "free" | "pro" | "enterprise" = "free"
): Promise<{ key: string; id: string }> {
  await ensureAPIKeyTables();

  const prefix = environment === "live" ? "zbk_live_" : "zbk_test_";
  const randomPart = crypto.randomBytes(24).toString("hex").slice(0, 32);
  const fullKey = `${prefix}${randomPart}`;
  const keyHash = crypto.createHash("sha256").update(fullKey).digest("hex");

  const [row] = await sql`
    INSERT INTO api_keys (key_hash, key_prefix, name, owner_email, plan, environment, rate_limit)
    VALUES (${keyHash}, ${fullKey.slice(0, 12)}, ${name}, ${ownerEmail}, ${plan}, ${environment}, ${RATE_LIMITS[plan] || 100})
    RETURNING id
  `;

  return { key: fullKey, id: row.id as string };
}

/**
 * Validate an API key and check rate limits.
 * Returns the key record if valid, throws if invalid or rate-limited.
 */
export async function validateAPIKey(authHeader: string): Promise<APIKey> {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header. Use: Bearer zbk_live_xxx");
  }

  const key = authHeader.slice(7);
  if (!key.startsWith("zbk_")) {
    throw new Error("Invalid API key format. Keys start with zbk_live_ or zbk_test_");
  }

  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  await ensureAPIKeyTables();

  const [row] = await sql`
    SELECT id, key_prefix, name, owner_email, plan, environment, rate_limit, active, created_at, last_used_at
    FROM api_keys WHERE key_hash = ${keyHash}
  `;

  if (!row) throw new Error("Invalid API key");
  if (!row.active) throw new Error("API key has been revoked");

  // Check rate limit
  const [usage] = await sql`
    SELECT COUNT(*) as count FROM api_usage
    WHERE key_id = ${row.id} AND created_at > NOW() - INTERVAL '1 day'
  `;

  const usageCount = parseInt(usage?.count as string) || 0;
  if (usageCount >= (row.rate_limit as number)) {
    throw new Error(`Rate limit exceeded. ${row.plan} plan allows ${row.rate_limit} requests/day. Upgrade at zoobicon.com/pricing`);
  }

  // Update last used
  await sql`UPDATE api_keys SET last_used_at = NOW() WHERE id = ${row.id}`;

  return {
    id: row.id as string,
    key: (row.key_prefix as string) + "...",
    name: row.name as string,
    ownerEmail: row.owner_email as string,
    plan: row.plan as "free" | "pro" | "enterprise",
    environment: row.environment as "live" | "test",
    rateLimitPerDay: row.rate_limit as number,
    usageToday: usageCount,
    createdAt: row.created_at as Date,
    lastUsedAt: row.last_used_at as Date | null,
    active: true,
  };
}

/**
 * Record an API usage event.
 */
export async function recordUsage(
  keyId: string,
  endpoint: string,
  statusCode: number,
  responseTimeMs: number,
  cost: number
): Promise<void> {
  await sql`
    INSERT INTO api_usage (key_id, endpoint, status_code, response_time, cost)
    VALUES (${keyId}, ${endpoint}, ${statusCode}, ${responseTimeMs}, ${cost})
  `;
}

/**
 * Get usage summary for a key.
 */
export async function getUsageSummary(
  keyId: string,
  days: number = 30
): Promise<{
  totalRequests: number;
  totalCost: number;
  byEndpoint: Record<string, { count: number; cost: number }>;
}> {
  const rows = await sql`
    SELECT endpoint, COUNT(*) as count, SUM(cost) as total_cost
    FROM api_usage
    WHERE key_id = ${keyId} AND created_at > NOW() - INTERVAL '1 day' * ${days}
    GROUP BY endpoint
  `;

  const byEndpoint: Record<string, { count: number; cost: number }> = {};
  let totalRequests = 0;
  let totalCost = 0;

  for (const row of rows) {
    const count = parseInt(row.count as string);
    const cost = parseFloat(row.total_cost as string);
    byEndpoint[row.endpoint as string] = { count, cost };
    totalRequests += count;
    totalCost += cost;
  }

  return { totalRequests, totalCost, byEndpoint };
}
