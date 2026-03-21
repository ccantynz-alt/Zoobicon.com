import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Multi-Domain Middleware
 *
 * Routes requests based on the incoming domain:
 *
 * Zoobicon domains:
 *   zoobicon.com  → / (homepage)
 *   zoobicon.ai   → /ai
 *   zoobicon.io   → /io
 *   zoobicon.sh   → /sh
 *
 * Dominat8 domains:
 *   dominat8.io   → /dominat8 (Dominat8 landing page)
 *   dominat8.com  → /dominat8 (Dominat8 landing page)
 *
 * All domains share the same builder, dashboard, auth, and API routes.
 * Only the root "/" path is rewritten — everything else passes through.
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

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const domain = hostname.split(":")[0]; // strip port for localhost
  const origin = request.headers.get("origin");

  // Handle CORS preflight for API routes
  if (request.nextUrl.pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const preflightResponse = new NextResponse(null, { status: 204 });
    setCorsHeaders(preflightResponse, origin);
    return preflightResponse;
  }

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
  if (rewritePath && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = rewritePath;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-zoobicon-domain", domainLabel);
    response.headers.set("x-brand-id", brandId);
    // CDN caching — rewritten domain pages are static, cache at edge
    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    // Vary by host so CDN caches each domain separately
    response.headers.set("Vary", "Host");
    if (request.nextUrl.pathname.startsWith("/api/")) {
      setCorsHeaders(response, origin);
    }
    return response;
  }

  // Pass through — still tag the domain and brand headers
  const response = NextResponse.next();
  response.headers.set("x-zoobicon-domain", domainLabel);
  response.headers.set("x-brand-id", brandId);
  if (request.nextUrl.pathname.startsWith("/api/")) {
    setCorsHeaders(response, origin);
  }
  return response;
}

export const config = {
  // Match root path and all routes for domain detection
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
