/**
 * Rate limit rules for all public API endpoints.
 *
 * Used by Next.js middleware to enforce limits at the edge BEFORE
 * route handlers run. Upstash Redis REST client is edge-compatible
 * (uses fetch, not TCP).
 */

import type { RateLimitConfig } from "@/lib/rateLimit";

interface RateLimitRule {
  /** Glob-like pattern. Exact prefix match (checked with startsWith). */
  pattern: string;
  config: RateLimitConfig;
}

/**
 * Rules are checked in order — first match wins.
 * More specific patterns MUST come before broader ones.
 */
const RATE_LIMIT_RULES: RateLimitRule[] = [
  // Auth — brute force protection
  { pattern: "/api/auth/", config: { limit: 10, windowMs: 60_000 } },

  // Stripe webhook — generous for retries
  { pattern: "/api/stripe/webhook", config: { limit: 100, windowMs: 60_000 } },

  // Email sending — spam prevention
  { pattern: "/api/email/send", config: { limit: 20, windowMs: 60_000 } },

  // Email webhook — Mailgun retries
  { pattern: "/api/email/webhook", config: { limit: 100, windowMs: 60_000 } },

  // Domain search — OpenSRS API cost protection
  { pattern: "/api/domains/search", config: { limit: 30, windowMs: 60_000 } },

  // Domain checkout — checkout abuse prevention
  { pattern: "/api/domains/checkout", config: { limit: 5, windowMs: 60_000 } },

  // AI generation — API cost protection
  { pattern: "/api/generate/", config: { limit: 10, windowMs: 60_000 } },

  // Video creator — Replicate cost protection (5 per 5 min)
  { pattern: "/api/video-creator/", config: { limit: 5, windowMs: 300_000 } },

  // Admin operations — higher limit for power users
  { pattern: "/api/admin/", config: { limit: 60, windowMs: 60_000 } },

  // Support — reasonable limit
  { pattern: "/api/support/", config: { limit: 20, windowMs: 60_000 } },
  { pattern: "/api/email-support/", config: { limit: 20, windowMs: 60_000 } },

  // Chat — moderate limit
  { pattern: "/api/chat", config: { limit: 20, windowMs: 60_000 } },
];

/** Default rate limit for any /api/* route not matching a specific rule. */
const DEFAULT_RATE_LIMIT: RateLimitConfig = { limit: 60, windowMs: 60_000 };

/**
 * Look up the rate limit config for a given API path.
 * First matching rule wins; falls back to DEFAULT_RATE_LIMIT.
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  for (const rule of RATE_LIMIT_RULES) {
    if (pathname.startsWith(rule.pattern) || pathname === rule.pattern.replace(/\/$/, "")) {
      return rule.config;
    }
  }
  return DEFAULT_RATE_LIMIT;
}

export { DEFAULT_RATE_LIMIT, RATE_LIMIT_RULES };
