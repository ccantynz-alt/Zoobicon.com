import { NextRequest, NextResponse } from "next/server";
import { subscribeUser, hasDb } from "@/lib/membership";

export const runtime = "nodejs";

interface Body {
  userId?: string;
  tierId?: string;
  stripeSubId?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!hasDb()) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  const body = (await req.json()) as Body;
  if (!body.userId || !body.tierId || !body.stripeSubId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const membership = await subscribeUser({
    userId: body.userId,
    tierId: body.tierId,
    stripeSubId: body.stripeSubId,
  });
  return NextResponse.json({ membership });
}
