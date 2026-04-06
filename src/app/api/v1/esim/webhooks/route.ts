import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/v1/esim/webhooks
 *
 * Receives webhook events from eSIM providers (Celitech, Airalo).
 * Events: usage_threshold, esim_activated, esim_expired, esim_depleted
 *
 * TODO: Add webhook signature verification when provider API key is configured.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event || body.type || "unknown";

    console.log(`[eSIM Webhook] Event: ${event}`, JSON.stringify(body).slice(0, 500));

    switch (event) {
      case "usage_threshold":
      case "usage.threshold": {
        // eSIM hit 80% or 90% usage — could trigger email alert
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

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("eSIM webhook error:", err);
    return NextResponse.json({ received: true }, { status: 200 }); // Always 200 to avoid retries
  }
}
