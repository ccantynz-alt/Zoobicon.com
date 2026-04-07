import { NextRequest, NextResponse } from "next/server";
import { subscribe } from "@/lib/newsletter-engine";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { listId?: string; email?: string; name?: string };
    if (!body.listId || !body.email) {
      return NextResponse.json({ error: "listId and email required" }, { status: 400 });
    }
    const { confirmationToken } = await subscribe(body.listId, body.email, body.name);
    return NextResponse.json({ ok: true, confirmationToken });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
