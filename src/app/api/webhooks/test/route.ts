import { NextResponse } from "next/server";
import { deliverWebhook } from "@/lib/webhook-delivery";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { webhookId?: string };
    const { webhookId } = body;
    if (!webhookId) {
      return NextResponse.json({ error: "webhookId is required" }, { status: 400 });
    }
    const result = await deliverWebhook(webhookId, "test.ping", {
      ts: Date.now(),
      message: "Test ping from Zoobicon",
    });
    return NextResponse.json({ ok: result.ok, statusCode: result.statusCode });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
