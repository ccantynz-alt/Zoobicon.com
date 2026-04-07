import { NextRequest, NextResponse } from "next/server";
import { sendSms, isTwilioConfigured, validatePhoneE164 } from "@/lib/twilio-sms";

export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({ ok: true, available: isTwilioConfigured() });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      to?: string;
      body?: string;
      mediaUrls?: string[];
      channel?: "sms" | "whatsapp";
      from?: string;
    };

    if (!body.to || !validatePhoneE164(body.to)) {
      return NextResponse.json(
        { ok: false, error: "Invalid 'to' phone number — must be E.164 (e.g. +14155551234)" },
        { status: 400 },
      );
    }
    if (!body.body || typeof body.body !== "string" || body.body.length < 1 || body.body.length > 1600) {
      return NextResponse.json(
        { ok: false, error: "Field 'body' is required and must be 1-1600 characters" },
        { status: 400 },
      );
    }
    if (body.channel && body.channel !== "sms" && body.channel !== "whatsapp") {
      return NextResponse.json(
        { ok: false, error: "Field 'channel' must be 'sms' or 'whatsapp'" },
        { status: 400 },
      );
    }
    if (!isTwilioConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in environment variables.",
        },
        { status: 500 },
      );
    }

    const result = await sendSms({
      to: body.to,
      body: body.body,
      mediaUrls: body.mediaUrls,
      channel: body.channel,
      from: body.from,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
