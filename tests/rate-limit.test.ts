/**
 * Tests for Redis-backed rate limiter with in-memory fallback.
 *
 * - Sliding window behavior (memory fallback)
 * - Rate limit config lookup (exact match, prefix, default)
 * - 429 response format
 * - Admin bypass
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock redis.ts so we can test both Redis and fallback paths ─────────────

let mockRedisClient: {
  pipeline: ReturnType<typeof vi.fn>;
  zrem: ReturnType<typeof vi.fn>;
  zrange: ReturnType<typeof vi.fn>;
} | null = null;

vi.mock("@/lib/redis", () => ({
  getRedis: () => mockRedisClient,
  hasRedis: () => mockRedisClient !== null,
}));

// Import AFTER mock is set up
import {
  checkRateLimit,
  checkRateLimitSync,
  checkRateLimitAdmin,
  getClientIp,
} from "@/lib/rateLimit";

import {
  getRateLimitConfig,
  DEFAULT_RATE_LIMIT,
} from "@/lib/rateLimitConfig";

// ─── In-memory fallback tests ───────────────────────────────────────────────

describe("checkRateLimitSync (in-memory sliding window)", () => {
  it("allows requests under the limit", () => {
    const id = `test-allow-${Date.now()}`;
    const config = { limit: 3, windowMs: 60_000 };

    const r1 = checkRateLimitSync(id, config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimitSync(id, config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimitSync(id, config);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests over the limit", () => {
    const id = `test-block-${Date.now()}`;
    const config = { limit: 2, windowMs: 60_000 };

    checkRateLimitSync(id, config);
    checkRateLimitSync(id, config);

    const r3 = checkRateLimitSync(id, config);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
    expect(r3.resetAt).toBeGreaterThan(Date.now());
  });

  it("returns resetAt in the future", () => {
    const id = `test-reset-${Date.now()}`;
    const config = { limit: 1, windowMs: 30_000 };

    const r1 = checkRateLimitSync(id, config);
    expect(r1.resetAt).toBeGreaterThan(Date.now());
    expect(r1.resetAt).toBeLessThanOrEqual(Date.now() + 30_000 + 100);
  });
});

// ─── Async checkRateLimit (falls back to memory when no Redis) ──────────────

describe("checkRateLimit (async, no Redis)", () => {
  beforeEach(() => {
    mockRedisClient = null;
  });

  it("falls back to in-memory when Redis is null", async () => {
    const id = `async-fallback-${Date.now()}`;
    const config = { limit: 2, windowMs: 60_000 };

    const r1 = await checkRateLimit(id, config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(1);

    const r2 = await checkRateLimit(id, config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(0);

    const r3 = await checkRateLimit(id, config);
    expect(r3.allowed).toBe(false);
  });
});

// ─── Async checkRateLimit with Redis mock ───────────────────────────────────

describe("checkRateLimit (async, with Redis)", () => {
  beforeEach(() => {
    const mockExec = vi.fn();
    mockRedisClient = {
      pipeline: vi.fn(() => ({
        zremrangebyscore: vi.fn(),
        zadd: vi.fn(),
        zcard: vi.fn(),
        expire: vi.fn(),
        exec: mockExec,
      })),
      zrem: vi.fn().mockResolvedValue(1),
      zrange: vi.fn().mockResolvedValue([]),
    };
    // Default: count = 1 (under limit)
    mockExec.mockResolvedValue([0, 1, 1, true]);
  });

  it("allows request when Redis count is under limit", async () => {
    const id = `redis-allow-${Date.now()}`;
    const config = { limit: 10, windowMs: 60_000 };

    const result = await checkRateLimit(id, config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(mockRedisClient!.pipeline).toHaveBeenCalled();
  });

  it("blocks request when Redis count exceeds limit", async () => {
    // Set count to 11 (over a limit of 10)
    const mockExec = vi.fn().mockResolvedValue([0, 1, 11, true]);
    mockRedisClient!.pipeline = vi.fn(() => ({
      zremrangebyscore: vi.fn(),
      zadd: vi.fn(),
      zcard: vi.fn(),
      expire: vi.fn(),
      exec: mockExec,
    }));

    const id = `redis-block-${Date.now()}`;
    const config = { limit: 10, windowMs: 60_000 };

    const result = await checkRateLimit(id, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(mockRedisClient!.zrem).toHaveBeenCalled();
  });

  it("falls back to memory on Redis error", async () => {
    const mockExec = vi.fn().mockRejectedValue(new Error("Redis connection failed"));
    mockRedisClient!.pipeline = vi.fn(() => ({
      zremrangebyscore: vi.fn(),
      zadd: vi.fn(),
      zcard: vi.fn(),
      expire: vi.fn(),
      exec: mockExec,
    }));

    const id = `redis-error-fallback-${Date.now()}`;
    const config = { limit: 5, windowMs: 60_000 };

    // Should not throw — should fall back to memory
    const result = await checkRateLimit(id, config);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });
});

// ─── Admin bypass ───────────────────────────────────────────────────────────

describe("checkRateLimitAdmin", () => {
  it("always allows with infinite remaining", () => {
    const result = checkRateLimitAdmin();
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
    expect(result.resetAt).toBe(0);
  });
});

// ─── Rate limit config lookup ───────────────────────────────────────────────

describe("getRateLimitConfig", () => {
  it("matches /api/auth/* to 10 req/min", () => {
    const config = getRateLimitConfig("/api/auth/login");
    expect(config.limit).toBe(10);
    expect(config.windowMs).toBe(60_000);
  });

  it("matches /api/auth/signup to 10 req/min", () => {
    const config = getRateLimitConfig("/api/auth/signup");
    expect(config.limit).toBe(10);
    expect(config.windowMs).toBe(60_000);
  });

  it("matches /api/stripe/webhook to 100 req/min", () => {
    const config = getRateLimitConfig("/api/stripe/webhook");
    expect(config.limit).toBe(100);
    expect(config.windowMs).toBe(60_000);
  });

  it("matches /api/domains/search to 30 req/min", () => {
    const config = getRateLimitConfig("/api/domains/search");
    expect(config.limit).toBe(30);
    expect(config.windowMs).toBe(60_000);
  });

  it("matches /api/domains/checkout to 5 req/min", () => {
    const config = getRateLimitConfig("/api/domains/checkout");
    expect(config.limit).toBe(5);
    expect(config.windowMs).toBe(60_000);
  });

  it("matches /api/generate/* to 10 req/min", () => {
    const config = getRateLimitConfig("/api/generate/react-stream");
    expect(config.limit).toBe(10);
    expect(config.windowMs).toBe(60_000);
  });

  it("matches /api/video-creator/* to 5 req/5min", () => {
    const config = getRateLimitConfig("/api/video-creator/chat");
    expect(config.limit).toBe(5);
    expect(config.windowMs).toBe(300_000);
  });

  it("matches /api/admin/* to 60 req/min", () => {
    const config = getRateLimitConfig("/api/admin/users");
    expect(config.limit).toBe(60);
    expect(config.windowMs).toBe(60_000);
  });

  it("matches /api/support/* to 20 req/min", () => {
    const config = getRateLimitConfig("/api/support/tickets");
    expect(config.limit).toBe(20);
    expect(config.windowMs).toBe(60_000);
  });

  it("returns default 60 req/min for unknown API routes", () => {
    const config = getRateLimitConfig("/api/some-random-route");
    expect(config.limit).toBe(DEFAULT_RATE_LIMIT.limit);
    expect(config.windowMs).toBe(DEFAULT_RATE_LIMIT.windowMs);
    expect(config.limit).toBe(60);
  });

  it("matches /api/email/send to 20 req/min", () => {
    const config = getRateLimitConfig("/api/email/send");
    expect(config.limit).toBe(20);
    expect(config.windowMs).toBe(60_000);
  });

  it("matches /api/chat to 20 req/min", () => {
    const config = getRateLimitConfig("/api/chat");
    expect(config.limit).toBe(20);
    expect(config.windowMs).toBe(60_000);
  });
});

// ─── getClientIp utility ────────────────────────────────────────────────────

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  it("returns 'unknown' when no IP headers", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });
});

// ─── 429 response format validation ────────────────────────────────────────

describe("429 response format", () => {
  it("blocked response has correct shape", async () => {
    mockRedisClient = null; // Force memory fallback
    const id = `format-test-${Date.now()}`;
    const config = { limit: 1, windowMs: 60_000 };

    // Use up the limit
    await checkRateLimit(id, config);

    // This one should be blocked
    const result = await checkRateLimit(id, config);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(typeof result.resetAt).toBe("number");
    expect(result.resetAt).toBeGreaterThan(Date.now());

    // Simulate what the middleware would return
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    const body = {
      error: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
      retryAfter,
    };
    expect(body.error).toBe("RATE_LIMITED");
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(body.retryAfter).toBeLessThanOrEqual(60);
  });
});
