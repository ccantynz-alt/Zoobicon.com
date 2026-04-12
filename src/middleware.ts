import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { getRateLimitConfig } from "@/lib/rateLimitConfig";

/**
 * Multi-Domain Middleware + Edge Rate Limiting
 *
 * 1. Bot blocking (scrapers, competitor bots)
 * 2. CORS preflight for API routes
 * 3. Rate limiting on /api/* routes (Redis-backed via Upstash REST)
 * 4. Domain-based rewriting (zoobicon.com/ai/io/sh, dominat8)
 *
 * @upstash/redis uses fetch (REST) — safe on Vercel edge runtime.
 */

const ALLOWED_ORIGINS = new Set([
  "https://zoobicon.com",
  "https://zoobicon.ai",
  "https://zoobicon.io",
  "https://zoobicon.sh",
  "https://dominat8.io",
  "https://dominat8.com",
  "http://localhost:3000",
]);

function setCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Max-Age", "86400");
  }
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const domain = hostname.split(":")[0];
  const origin = request.headers.get("origin");
  const pathname = request.nextUrl.pathname;

  // ── BOT BLOCKING ──
  const ua = request.headers.get("user-agent")?.toLowerCase() || "";
  const blockedBots = ["scrapy", "semrushbot", "ahrefsbot", "mj12bot", "dotbot", "bytespider", "petalbot"];
  if (blockedBots.some(bot => ua.includes(bot))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── CORS PREFLIGHT ──
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const preflightResponse = new NextResponse(null, { status: 204 });
    setCorsHeaders(preflightResponse, origin);
    return preflightResponse;
  }

  // ── RATE LIMITING (API routes only) ──
  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.ip ||
      "unknown";

    const config = getRateLimitConfig(pathname);
    const identifier = `${ip}:${pathname}`;

    const result = await checkRateLimit(identifier, config);

    if (!result.allowed) {
      const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
      const rateLimitResponse = NextResponse.json(
        {
          error: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": config.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": result.resetAt.toString(),
            "Retry-After": retryAfter.toString(),
          },
        }
      );
      setCorsHeaders(rateLimitResponse, origin);
      return rateLimitResponse;
    }

    // ── DOMAIN DETECTION (for API routes too — tag headers) ──
    let domainLabel = "com";
    let brandId = "zoobicon";
    if (domain === "dominat8.io" || domain.endsWith(".dominat8.io") ||
        domain === "dominat8.com" || domain.endsWith(".dominat8.com")) {
      domainLabel = domain.includes("dominat8.io") ? "dominat8-io" : "dominat8-com";
      brandId = "dominat8";
    } else if (domain === "zoobicon.ai" || domain.endsWith(".zoobicon.ai")) {
      domainLabel = "ai";
    } else if (domain === "zoobicon.io" || domain.endsWith(".zoobicon.io")) {
      domainLabel = "io";
    } else if (domain === "zoobicon.sh" || domain.endsWith(".zoobicon.sh")) {
      domainLabel = "sh";
    }

    const apiResponse = NextResponse.next();
    apiResponse.headers.set("X-RateLimit-Limit", config.limit.toString());
    apiResponse.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    apiResponse.headers.set("X-RateLimit-Reset", result.resetAt.toString());
    apiResponse.headers.set("x-zoobicon-domain", domainLabel);
    apiResponse.headers.set("x-brand-id", brandId);
    setCorsHeaders(apiResponse, origin);
    return apiResponse;
  }

  // ── DOMAIN REWRITING (non-API routes) ──
  let rewritePath: string | null = null;
  let domainLabel = "com";
  let brandId = "zoobicon";

  // Dominat8 domains
  if (domain === "dominat8.io" || domain.endsWith(".dominat8.io")) {
    rewritePath = "/dominat8";
    domainLabel = "dominat8-io";
    brandId = "dominat8";
  } else if (domain === "dominat8.com" || domain.endsWith(".dominat8.com")) {
    rewritePath = "/dominat8";
    domainLabel = "dominat8-com";
    brandId = "dominat8";
  }
  // Zoobicon domains
  else if (domain === "zoobicon.ai" || domain.endsWith(".zoobicon.ai")) {
    rewritePath = "/ai";
    domainLabel = "ai";
  } else if (domain === "zoobicon.io" || domain.endsWith(".zoobicon.io")) {
    rewritePath = "/io";
    domainLabel = "io";
  } else if (domain === "zoobicon.sh" || domain.endsWith(".zoobicon.sh")) {
    rewritePath = "/sh";
    domainLabel = "sh";
  }

  // Only rewrite the root path; everything else passes through
  if (rewritePath && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = rewritePath;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-zoobicon-domain", domainLabel);
    response.headers.set("x-brand-id", brandId);
    // CDN caching — rewritten domain pages are static, cache at edge
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    // Vary by host so CDN caches each domain separately
    response.headers.set("Vary", "Host");
    return response;
  }

  // Pass through — still tag the domain and brand headers
  const response = NextResponse.next();
  response.headers.set("x-zoobicon-domain", domainLabel);
  response.headers.set("x-brand-id", brandId);
  // Anti-scraping headers
  response.headers.set("X-Robots-Tag", "noai, noimageai");
  return response;
}

export const config = {
  // Match root path and all routes for domain detection
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
