import { NextRequest } from "next/server";
import { validateApiKey, type ApiKeyPlan } from "@/lib/apiKey";
import { checkRateLimit } from "@/lib/rateLimit";

export interface AuthenticatedRequest {
  plan: ApiKeyPlan;
  keyPrefix: string; // First 12 chars for rate limit tracking
}

// Rate limits per plan tier
const RATE_LIMITS: Record<ApiKeyPlan, { limit: number; windowMs: number }> = {
  free: { limit: 10, windowMs: 60_000 },       // 10 req/min
  pro: { limit: 60, windowMs: 60_000 },        // 60 req/min
  enterprise: { limit: 600, windowMs: 60_000 }, // 600 req/min
};

/**
 * Validate API key from Authorization header and enforce rate limits.
 * Returns the authenticated plan or an error Response.
 */
export async function authenticateApiKey(
  req: NextRequest
): Promise<AuthenticatedRequest | Response> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return errorResponse(401, "missing_api_key", "Authorization header required. Use: Authorization: Bearer zbk_live_...");
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return errorResponse(401, "missing_api_key", "API key is empty");
  }

  const validation = await validateApiKey(token);
  if (!validation.valid) {
    return errorResponse(401, "invalid_api_key", `API key validation failed: ${validation.reason}`);
  }

  const plan = validation.plan || "free";
  const keyPrefix = token.slice(0, 20); // Use prefix as rate limit identifier

  // Rate limit check
  const rateConfig = RATE_LIMITS[plan];
  const rateCheck = checkRateLimit(keyPrefix, rateConfig);
  if (!rateCheck.allowed) {
    return errorResponse(429, "rate_limit_exceeded", `Rate limit exceeded. Resets at ${new Date(rateCheck.resetAt).toISOString()}`, {
      "X-RateLimit-Limit": String(rateConfig.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil(rateCheck.resetAt / 1000)),
      "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
    });
  }

  return {
    plan,
    keyPrefix,
  };
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  headers?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );
}

/**
 * Standard API response wrapper
 */
export function apiResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function apiError(status: number, code: string, message: string): Response {
  return new Response(
    JSON.stringify({ error: { code, message } }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}
