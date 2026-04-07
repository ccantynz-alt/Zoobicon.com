import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/lib/analytics-engine";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

interface TrackBody {
  siteId?: string;
  eventType?: "pageview" | "click" | "custom";
  path?: string;
  referrer?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as TrackBody;
    if (!body.siteId || !body.path) {
      return NextResponse.json({ error: "siteId and path required" }, { status: 400, headers: CORS_HEADERS });
    }
    const ua = req.headers.get("user-agent") || "";
    const xff = req.headers.get("x-forwarded-for") || "";
    const ip = xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "0.0.0.0";
    const country = req.headers.get("cf-ipcountry") || undefined;

    await trackEvent({
      siteId: body.siteId,
      eventType: body.eventType || "pageview",
      path: body.path,
      referrer: body.referrer,
      userAgent: ua,
      ip,
      country,
    });
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "track failed";
    return NextResponse.json({ error: message }, { status: 500, headers: CORS_HEADERS });
  }
}
