import { NextRequest, NextResponse } from "next/server";
import { sendCampaign } from "@/lib/newsletter-engine";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { campaignId?: string };
    if (!body.campaignId) {
      return NextResponse.json({ error: "campaignId required" }, { status: 400 });
    }
    const result = await sendCampaign(body.campaignId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, sentCount: result.sentCount });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
