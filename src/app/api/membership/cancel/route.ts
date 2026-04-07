import { NextRequest, NextResponse } from "next/server";
import { cancelSubscription, hasDb } from "@/lib/membership";

export const runtime = "nodejs";

interface Body {
  subId?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!hasDb()) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  const body = (await req.json()) as Body;
  if (!body.subId) return NextResponse.json({ error: "Missing subId" }, { status: 400 });
  await cancelSubscription(body.subId);
  return NextResponse.json({ ok: true });
}
