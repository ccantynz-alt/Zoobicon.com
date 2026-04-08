import { NextRequest, NextResponse } from "next/server";
import { createTier, hasDb } from "@/lib/membership";

export const runtime = "nodejs";

interface Body {
  siteId?: string;
  name?: string;
  price_cents?: number;
  currency?: string;
  interval?: string;
  benefits?: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!hasDb()) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  const body = (await req.json()) as Body;
  if (!body.siteId || !body.name || typeof body.price_cents !== "number" || !body.currency || !body.interval) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const tier = await createTier({
    siteId: body.siteId,
    name: body.name,
    price_cents: body.price_cents,
    currency: body.currency,
    interval: body.interval,
    benefits: Array.isArray(body.benefits) ? body.benefits : [],
  });
  return NextResponse.json({ tier });
}
