/**
 * Server-side error sanitization utility.
 *
 * NEVER return raw error.message to API clients — it can contain
 * env var names, API keys, stack traces, SQL errors, or internal details.
 *
 * Use this for all catch blocks in API routes.
 */

/**
 * Sanitize an error for client-facing API responses.
 * Logs the real error server-side, returns a safe message to the client.
 */
export function sanitizeApiError(err: unknown, context?: string): string {
  const raw = err instanceof Error ? err.message : String(err);

  // Log full error server-side for debugging
  if (context) {
    console.error(`[${context}]`, raw);
  }

  const lower = raw.toLowerCase();

  // Rate limiting
  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("too many"))
    return "Rate limited. Please wait a moment and try again.";

  // Auth failures
  if (lower.includes("authentication") || lower.includes("unauthorized") || lower.includes("401") || lower.includes("invalid api key"))
    return "Service temporarily unavailable. Please try again.";

  // Timeout
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("deadline"))
    return "Request timed out. Please try again.";

  // Network errors
  if (lower.includes("econnrefused") || lower.includes("etimedout") || lower.includes("fetch failed") || lower.includes("network"))
    return "Service temporarily unavailable. Please try again later.";

  // Database errors
  if (lower.includes("sql") || lower.includes("database") || lower.includes("relation") || lower.includes("column") || lower.includes("pg_"))
    return "Service error. Please try again later.";

  // Provider not configured (dev-facing)
  if (lower.includes("not configured") || lower.includes("api_key") || lower.includes("api key") || lower.includes("environment"))
    return "This feature is temporarily unavailable.";

  // Payment/subscription
  if (lower.includes("payment") || lower.includes("subscription") || lower.includes("upgrade"))
    return "This feature requires a plan upgrade.";

  // Generic safe message for anything else
  return "Something went wrong. Please try again.";
}

/**
 * Create a safe JSON error response.
 */
export function apiErrorResponse(err: unknown, context: string, status = 500): Response {
  const message = sanitizeApiError(err, context);
  return Response.json({ error: message }, { status });
}
