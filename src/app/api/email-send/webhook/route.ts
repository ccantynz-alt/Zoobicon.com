/**
 * POST /api/email-send/webhook
 *
 * Receives delivery lifecycle events from Crontech's email service
 * (services/email-send, BLK-030).
 *
 * Events: delivered | bounced | complained | opened | clicked
 * Signature: x-crontech-signature: sha256=<hex>
 *            hmac_sha256(EMAIL_SEND_WEBHOOK_SECRET, raw_body)
 *
 * Register this URL in the Crontech email service per-tenant config:
 *   POST https://api.crontech.ai/email-send/v1/webhooks
 *   { "url": "https://zoobicon.com/api/email-send/webhook",
 *     "events": ["delivered","bounced","complained","opened","clicked"],
 *     "secret": "<EMAIL_SEND_WEBHOOK_SECRET>" }
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyEmailWebhookSignature } from "@/lib/email-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface EmailEvent {
  event: "delivered" | "bounced" | "complained" | "opened" | "clicked";
  messageId: string;
  tenantId?: string;
  to?: string;
  timestamp?: string;
  reason?: string; // present on bounced
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.EMAIL_SEND_WEBHOOK_SECRET || "";

  if (!webhookSecret) {
    console.warn("[email-send/webhook] EMAIL_SEND_WEBHOOK_SECRET not set — signature verification SKIPPED");
  }

  const rawBody = await req.text();

  if (webhookSecret) {
    const sig = req.headers.get("x-crontech-signature");
    const valid = await verifyEmailWebhookSignature(rawBody, sig, webhookSecret);
    if (!valid) {
      console.warn("[email-send/webhook] invalid_signature — rejected");
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  let payload: EmailEvent;
  try {
    payload = JSON.parse(rawBody) as EmailEvent;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { event, messageId, to, reason } = payload;

  switch (event) {
    case "delivered":
      console.log(`[email-send/webhook] delivered messageId=${messageId} to=${to}`);
      break;

    case "bounced":
      console.warn(`[email-send/webhook] BOUNCED messageId=${messageId} to=${to} reason=${reason}`);
      // Hard bounces are auto-suppressed by Crontech per-tenant.
      // Log here for our own visibility — could write to DB if needed.
      break;

    case "complained":
      console.error(`[email-send/webhook] COMPLAINT messageId=${messageId} to=${to}`);
      // Complaints also auto-suppressed. Flag is surfaced here for ops visibility.
      break;

    case "opened":
    case "clicked":
      // Engagement events — no action needed, just acknowledge.
      break;

    default:
      console.log(`[email-send/webhook] unknown event="${event}" messageId=${messageId}`);
  }

  return NextResponse.json({ ok: true });
}
