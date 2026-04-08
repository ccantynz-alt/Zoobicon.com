import { NextRequest } from "next/server";
import { verifyTwilioSignature } from "@/lib/twilio-sms";

export const maxDuration = 30;

const TWIML_OK = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twimlResponse(status = 200): Response {
  return new Response(TWIML_OK, {
    status,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = typeof value === "string" ? value : "";
    });

    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = req.headers.get("x-twilio-signature");

    if (authToken) {
      if (!signature) {
        console.warn("[sms-webhook] missing X-Twilio-Signature header — rejecting");
        return new Response("Forbidden", { status: 403 });
      }
      const proto = req.headers.get("x-forwarded-proto") ?? "https";
      const host = req.headers.get("host") ?? "";
      const url = `${proto}://${host}${req.nextUrl.pathname}`;
      const valid = verifyTwilioSignature(authToken, signature, url, params);
      if (!valid) {
        console.warn("[sms-webhook] signature verification failed");
        return new Response("Forbidden", { status: 403 });
      }
    } else {
      console.warn("[sms-webhook] TWILIO_AUTH_TOKEN missing — accepting without signature verification");
    }

    const from = params.From ?? "";
    const to = params.To ?? "";
    const body = params.Body ?? "";
    const messageSid = params.MessageSid ?? "";
    const numMedia = params.NumMedia ?? "0";

    console.log("[sms-inbound]", { from, to, body, messageSid, numMedia });

    return twimlResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sms-webhook] error:", message);
    return twimlResponse(200);
  }
}
