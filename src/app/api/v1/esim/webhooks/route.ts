import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/v1/esim/webhooks
 *
 * Receives webhook events from eSIM providers (Celitech, Airalo).
 * Events: usage_threshold, esim_activated, esim_expired, esim_depleted
 *
 * Signature verification:
 *   - Celitech sends an HMAC-SHA256 hex digest in `x-celitech-signature`
 *   - Airalo sends an HMAC-SHA256 hex digest in `x-airalo-signature`
 *   - The signing secret comes from CELITECH_WEBHOOK_SECRET / AIRALO_WEBHOOK_SECRET
 *
 * Behaviour:
 *   - If a webhook secret is configured for the matching provider, the
 *     signature MUST verify or the request is rejected with 401.
 *   - If no secret is configured for the matching provider, the request
 *     is rejected with 503 — we never accept unsigned webhooks in prod.
 *     The previous version accepted ANY POST and logged "received: true",
 *     letting an attacker forge purchases/activations.
 *   - Constant-time comparison via crypto.timingSafeEqual prevents timing
 *     attacks against the signature digest.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VerifyResult {
  ok: boolean;
  reason?: string;
  provider?: string;
  status?: number;
}

function verifySignature(req: NextRequest, rawBody: string): VerifyResult {
  const celitechSig = req.headers.get("x-celitech-signature");
  if (celitechSig) {
    const secret = process.env.CELITECH_WEBHOOK_SECRET;
    if (!secret) {
      return {
        ok: false,
        reason: "CELITECH_WEBHOOK_SECRET not configured in env",
        provider: "celitech",
        status: 503,
      };
    }
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const ok = safeCompare(celitechSig, expected);
    return { ok, reason: ok ? undefined : "celitech signature mismatch", provider: "celitech", status: ok ? 200 : 401 };
  }

  const airaloSig = req.headers.get("x-airalo-signature");
  if (airaloSig) {
    const secret = process.env.AIRALO_WEBHOOK_SECRET;
    if (!secret) {
      return {
        ok: false,
        reason: "AIRALO_WEBHOOK_SECRET not configured in env",
        provider: "airalo",
        status: 503,
      };
    }
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const ok = safeCompare(airaloSig, expected);
    return { ok, reason: ok ? undefined : "airalo signature mismatch", provider: "airalo", status: ok ? 200 : 401 };
  }

  return {
    ok: false,
    reason: "no recognised provider signature header (x-celitech-signature / x-airalo-signature)",
    status: 401,
  };
}

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

interface EsimWebhookBody {
  event?: string;
  type?: string;
  data?: { esimId?: string; percentUsed?: number };
  esim_id?: string;
  percent_used?: number;
}

export async function POST(req: NextRequest) {
  // Read raw body BEFORE parsing so we verify the exact bytes the provider signed.
  const rawBody = await req.text();
  const verify = verifySignature(req, rawBody);
  if (!verify.ok) {
    console.warn(`[eSIM Webhook] rejected: ${verify.reason}`);
    return NextResponse.json(
      { error: "unauthorised", message: verify.reason },
      { status: verify.status ?? 401 },
    );
  }

  let body: EsimWebhookBody;
  try {
    body = JSON.parse(rawBody) as EsimWebhookBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const event = body.event || body.type || "unknown";
  console.log(`[eSIM Webhook] provider=${verify.provider} event=${event}`);

  switch (event) {
    case "usage_threshold":
    case "usage.threshold": {
      const esimId = body.data?.esimId || body.esim_id;
      const percentUsed = body.data?.percentUsed || body.percent_used;
      console.log(`[eSIM] Usage alert: ${esimId} at ${percentUsed}%`);
      // TODO: Send push notification / email to user
      break;
    }

    case "esim_activated":
    case "esim.activated": {
      const esimId = body.data?.esimId || body.esim_id;
      console.log(`[eSIM] Activated: ${esimId}`);
      // TODO: Update DB status to "active"
      break;
    }

    case "esim_expired":
    case "esim.expired": {
      const esimId = body.data?.esimId || body.esim_id;
      console.log(`[eSIM] Expired: ${esimId}`);
      // TODO: Update DB status, send renewal prompt
      break;
    }

    case "esim_depleted":
    case "esim.depleted": {
      const esimId = body.data?.esimId || body.esim_id;
      console.log(`[eSIM] Depleted: ${esimId}`);
      // TODO: Update DB status, send topup prompt
      break;
    }

    default:
      console.log(`[eSIM Webhook] Unhandled event: ${event}`);
  }

  return NextResponse.json({ received: true, provider: verify.provider });
}
