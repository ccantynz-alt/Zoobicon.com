import { NextRequest, NextResponse } from "next/server";
import { createCampaign, listCampaigns } from "@/lib/newsletter-engine";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      listId?: string;
      subject?: string;
      html?: string;
      text?: string;
      scheduledAt?: string;
    };
    if (!body.listId || !body.subject || !body.html || !body.text) {
      return NextResponse.json(
        { error: "listId, subject, html, text required" },
        { status: 400 }
      );
    }
    const camp = await createCampaign(
      body.listId,
      body.subject,
      body.html,
      body.text,
      body.scheduledAt
    );
    return NextResponse.json({ ok: true, campaign: camp });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const listId = url.searchParams.get("listId");
    if (!listId) {
      return NextResponse.json({ error: "listId required" }, { status: 400 });
    }
    const campaigns = await listCampaigns(listId);
    return NextResponse.json({ ok: true, campaigns });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
