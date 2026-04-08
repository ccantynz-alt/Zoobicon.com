import crypto from "crypto";

export interface SmsRequest {
  to: string;
  body: string;
  from?: string;
  mediaUrls?: string[];
  channel?: "sms" | "whatsapp";
}

export interface SmsResult {
  sid: string;
  status: "queued" | "sending" | "sent" | "failed" | "delivered";
  to: string;
  from: string;
  cost: number;
}

const COST_LOOKUP: Record<string, number> = {
  sms: 0.0079,
  whatsapp: 0.005,
};

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

export function getTwilioCreds(): { sid: string; token: string; from: string } {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid) throw new Error("TWILIO_ACCOUNT_SID environment variable is missing");
  if (!token) throw new Error("TWILIO_AUTH_TOKEN environment variable is missing");
  if (!from) throw new Error("TWILIO_FROM_NUMBER environment variable is missing");
  return { sid, token, from };
}

export function validatePhoneE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendSms(req: SmsRequest): Promise<SmsResult> {
  const { sid, token, from: defaultFrom } = getTwilioCreds();
  const channel: "sms" | "whatsapp" = req.channel ?? "sms";

  const rawTo = req.to;
  const rawFrom = req.from ?? defaultFrom;

  if (!validatePhoneE164(rawTo)) {
    throw new Error(`Invalid 'to' phone number: must be E.164 format (e.g. +14155551234)`);
  }
  if (!validatePhoneE164(rawFrom)) {
    throw new Error(`Invalid 'from' phone number: must be E.164 format`);
  }
  if (!req.body || req.body.length < 1 || req.body.length > 1600) {
    throw new Error(`Message body must be 1-1600 characters (got ${req.body?.length ?? 0})`);
  }

  const to = channel === "whatsapp" ? `whatsapp:${rawTo}` : rawTo;
  const from = channel === "whatsapp" ? `whatsapp:${rawFrom}` : rawFrom;

  const params = new URLSearchParams();
  params.append("To", to);
  params.append("From", from);
  params.append("Body", req.body);
  if (req.mediaUrls && req.mediaUrls.length > 0) {
    for (const url of req.mediaUrls) {
      params.append("MediaUrl", url);
    }
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (res.status >= 500) {
        lastErr = new Error(`Twilio 5xx: ${res.status} ${await res.text()}`);
        await sleep(2 ** attempt * 500);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Twilio error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as {
        sid: string;
        status: string;
        to: string;
        from: string;
      };

      return {
        sid: data.sid,
        status: data.status as SmsResult["status"],
        to: data.to,
        from: data.from,
        cost: COST_LOOKUP[channel] ?? 0.0079,
      };
    } catch (err) {
      lastErr = err;
      if (attempt === 3) break;
      await sleep(2 ** attempt * 500);
    }
  }

  throw new Error(
    `Twilio send failed after 4 attempts: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  );
}

export function verifyTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>,
): boolean {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }
  const expected = crypto.createHmac("sha1", authToken).update(data).digest("base64");
  return expected === signature;
}
