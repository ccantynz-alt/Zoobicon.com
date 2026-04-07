import { NextRequest, NextResponse } from "next/server";
import { getPayoutQueue, markPaid } from "@/lib/affiliate-program";

function isAdmin(req: NextRequest): boolean {
  return req.headers.get("x-admin") === "true" || req.headers.get("x-admin-key") != null;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const queue = await getPayoutQueue();
    return NextResponse.json({ queue });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { conversionIds?: number[] };
    if (!Array.isArray(body.conversionIds)) {
      return NextResponse.json({ error: "conversionIds array required" }, { status: 400 });
    }
    await markPaid(body.conversionIds);
    return NextResponse.json({ ok: true, count: body.conversionIds.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
