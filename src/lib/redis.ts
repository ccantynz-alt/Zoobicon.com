/**
 * Upstash Redis client (REST — no persistent connection, safe on Vercel serverless).
 *
 * Used primarily for cross-instance idempotency (e.g. Stripe webhook dedup).
 * In-memory LRUs don't survive Vercel cold starts, so a retry arriving on a
 * fresh instance would re-process an event and double-charge a customer.
 *
 * If UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are unset, `redis` is
 * null and callers MUST fall back to whatever local dedup they have AND
 * surface the gap loudly (e.g. return 503 to the provider) — we must never
 * silently swallow duplicate events.
 *
 * Free tier: 10K commands/day. Sign up at https://upstash.com
 */

import { Redis } from "@upstash/redis";

let _redis: Redis | null | undefined;

function buildClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[redis] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — " +
        "falling back to in-memory dedup. Cross-instance idempotency is DISABLED. " +
        "Add the keys from https://upstash.com (free tier) to close the revenue leak."
    );
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (err) {
    console.error(
      "[redis] Failed to construct Upstash client:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Lazily-constructed Upstash Redis client.
 * Returns `null` if the env vars are missing or the client cannot be built.
 */
export function getRedis(): Redis | null {
  if (_redis === undefined) {
    _redis = buildClient();
  }
  return _redis;
}

/** True if Upstash is configured and ready. */
export function hasRedis(): boolean {
  return getRedis() !== null;
}
