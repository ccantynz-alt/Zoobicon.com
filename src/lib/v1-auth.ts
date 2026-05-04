/**
 * Public API v1 Auth Guard
 *
 * Wraps `validateAPIKey` from lib/api-keys.ts so v1 routes can authenticate
 * with one call. Returns either the validated APIKey row or a 401 NextResponse
 * the route should immediately return.
 *
 * Routes that previously accepted `userId` from the request body without
 * checking auth must now derive ownership from the validated key:
 *
 *   const auth = await requireApiKey(req);
 *   if (auth instanceof NextResponse) return auth;
 *   const userId = auth.ownerEmail;   // never trust client-supplied userId
 *
 * Admin requests (header `x-admin: 1` or cookie `admin=1`) bypass key
 * validation so internal tools can hit v1 routes during testing without
 * issuing themselves keys. This is safe because admin status is decided
 * by the same strict-equality helper used elsewhere.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey, type APIKey } from "@/lib/api-keys";
import { isAdminRequest } from "@/lib/admin-auth";

export type V1AuthSubject = APIKey | { id: "admin"; ownerEmail: "admin"; admin: true };

export async function requireApiKey(
  req: NextRequest | Request,
): Promise<V1AuthSubject | NextResponse> {
  if (isAdminRequest(req)) {
    return {
      id: "admin",
      ownerEmail: "admin",
      admin: true,
    };
  }

  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json(
      {
        error: "missing_authorization",
        message:
          "Authorization required. Send 'Authorization: Bearer zbk_live_...' or contact support to issue an API key.",
      },
      { status: 401 },
    );
  }

  try {
    return await validateAPIKey(authHeader);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid API key";
    const isRateLimit = message.toLowerCase().includes("rate limit");
    return NextResponse.json(
      {
        error: isRateLimit ? "rate_limit_exceeded" : "unauthorized",
        message,
      },
      { status: isRateLimit ? 429 : 401 },
    );
  }
}

/**
 * Type guard so callers can branch cleanly without `instanceof NextResponse`.
 * Useful when chaining inside try/catch blocks.
 */
export function isAuthenticated(
  subject: V1AuthSubject | NextResponse,
): subject is V1AuthSubject {
  return !(subject instanceof NextResponse);
}
