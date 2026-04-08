import { NextResponse } from "next/server";
import { registerWebhook } from "@/lib/webhook-delivery";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      customerId?: string;
      url?: string;
      events?: string[];
    };
    const { customerId, url, events } = body;
    if (!customerId || !url || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "customerId, url, and events[] are required" },
        { status: 400 },
      );
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return NextResponse.json({ error: "url must be http(s)" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }
    const webhook = await registerWebhook(customerId, url, events);
    return NextResponse.json(webhook);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
