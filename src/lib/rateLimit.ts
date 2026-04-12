/**
 * Redis-backed sliding window rate limiter with in-memory fallback.
 *
 * Primary: Upstash Redis sorted sets (ZADD + ZREMRANGEBYSCORE + ZCARD).
 * Survives cold starts, works across all Vercel instances.
 *
 * Fallback: In-memory Map (when Redis is unavailable).
 * Only protects the current instance, resets on cold start.
 *
 * @upstash/redis uses fetch (REST), NOT TCP — safe on Vercel edge + serverless.
 */

import { getRedis } from "@/lib/redis";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ─── Admin bypass ───────────────────────────────────────────────────────────

/** Admin bypass — always allowed, unlimited remaining */
export function checkRateLimitAdmin(): RateLimitResult {
  return { allowed: true, remaining: Infinity, resetAt: 0 };
}

// ─── In-memory fallback store ───────────────────────────────────────────────

interface MemoryEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryEntry>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      // Remove entries where all timestamps are older than 10 minutes
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 600_000) {
        memoryStore.delete(key);
      }
    }
  }, 300_000);
}

function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = memoryStore.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    memoryStore.set(identifier, entry);
  }

  // Drop expired timestamps (sliding window)
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.limit) {
    // Find earliest timestamp still in the window to calculate resetAt
    const earliest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: earliest + config.windowMs,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.limit - entry.timestamps.length,
    resetAt: now + config.windowMs,
  };
}

// ─── Redis fallback warning throttle ────────────────────────────────────────

let _lastFallbackWarn = 0;

function warnFallback(reason: string): void {
  const now = Date.now();
  if (now - _lastFallbackWarn > 60_000) {
    _lastFallbackWarn = now;
    console.warn(
      `[rateLimit] Falling back to in-memory rate limiter — ${reason}. ` +
        "Cross-instance rate limiting is DISABLED."
    );
  }
}

// ─── Main export ────────────────────────────────────────────────────────────

/**
 * Check rate limit for `identifier` using sliding window.
 *
 * Uses Upstash Redis sorted sets as primary storage.
 * Falls back to in-memory Map if Redis is unavailable.
 *
 * @param identifier  e.g. `${ip}:/api/auth/login` or `${userId}:/api/generate`
 * @param config      `{ limit, windowMs }`
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis();

  if (!redis) {
    warnFallback("Redis not configured");
    return checkRateLimitMemory(identifier, config);
  }

  try {
    return await checkRateLimitRedis(identifier, config);
  } catch (err) {
    warnFallback(
      err instanceof Error ? err.message : String(err)
    );
    return checkRateLimitMemory(identifier, config);
  }
}

/**
 * Synchronous in-memory-only check. Kept for backward compatibility with
 * callers that can't await (e.g. api-middleware.ts, auth-guard.ts).
 * Uses the same sliding window logic as the async version's fallback.
 */
export function checkRateLimitSync(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  return checkRateLimitMemory(identifier, config);
}

// ─── Redis implementation (sorted set sliding window) ───────────────────────

async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedis()!;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const key = `rl:${identifier}`;
  // Use a unique member per request (timestamp + random suffix to avoid dedup)
  const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

  // Atomic pipeline: add current request, trim expired, count
  const pipeline = redis.pipeline();
  // 1. Remove entries outside the window
  pipeline.zremrangebyscore(key, 0, windowStart);
  // 2. Add current request with timestamp as score
  pipeline.zadd(key, { score: now, member });
  // 3. Count entries in the window
  pipeline.zcard(key);
  // 4. Set TTL to auto-clean (window + 1s buffer)
  pipeline.expire(key, Math.ceil(config.windowMs / 1000) + 1);

  const results = await pipeline.exec();

  // results = [zremrangebyscore result, zadd result, zcard result, expire result]
  const count = (results[2] as number) ?? 0;

  if (count > config.limit) {
    // Over limit — the ZADD already added this request, remove it
    // (we added then checked, so remove the one we just added)
    await redis.zrem(key, member).catch(() => {});

    // Get the earliest timestamp to calculate reset time
    const earliest = await redis.zrange(key, 0, 0, { withScores: true }).catch(() => []);
    const earliestScore =
      Array.isArray(earliest) && earliest.length > 0
        ? (earliest as Array<{ score: number }>)[0]?.score ?? now
        : now;

    return {
      allowed: false,
      remaining: 0,
      resetAt: (typeof earliestScore === "number" ? earliestScore : now) + config.windowMs,
    };
  }

  return {
    allowed: true,
    remaining: config.limit - count,
    resetAt: now + config.windowMs,
  };
}

// ─── Utility ────────────────────────────────────────────────────────────────

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
