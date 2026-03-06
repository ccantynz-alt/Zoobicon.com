/**
 * Simple in-memory sliding window rate limiter.
 *
 * Works per serverless function instance. For production scale,
 * replace the store with Upstash Redis:
 *   https://vercel.com/integrations/upstash
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > 120_000) store.delete(key);
    }
  }, 300_000);
}

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

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(identifier);

  if (!existing || now - existing.windowStart >= config.windowMs) {
    // Start a new window
    store.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
  }

  if (existing.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.windowStart + config.windowMs,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: config.limit - existing.count,
    resetAt: existing.windowStart + config.windowMs,
  };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
