import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/apiKey";

/**
 * GET /api/v1/auth/verify
 *
 * Lightweight endpoint the CLI hits during `zoobicon login` to confirm the
 * key it just received is genuine and to surface a friendly identifier
 * (email if recoverable, plan tier always). Stateless — uses the same HMAC
 * verification as every other v1 endpoint, no DB lookup required.
 *
 * Auth: Authorization: Bearer zbk_live_<payload>.<sig>
 *
 * Returns:
 *   200 { ok: true, plan, sub }       — key is valid
 *   401 { ok: false, reason }         — key missing, malformed, or invalid sig
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return NextResponse.json(
      { ok: false, reason: "missing_bearer" },
      { status: 401 },
    );
  }

  const key = match[1].trim();
  const result = await validateApiKey(key);
  if (!result.valid) {
    return NextResponse.json(
      { ok: false, reason: result.reason || "invalid" },
      { status: 401 },
    );
  }

  // We don't carry the original email in the key payload — only sha256(email)[0:16]
  // — so the email field is intentionally omitted. The CLI prints plan + sub,
  // which is enough for the user to confirm "yes, that's my key."
  return NextResponse.json({
    ok: true,
    plan: result.plan,
    sub: result.sub,
  });
}
