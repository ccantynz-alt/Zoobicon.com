import { NextRequest, NextResponse } from "next/server";
import { createProgram, type LoyaltyTier } from "@/lib/loyalty";

export const runtime = "nodejs";

interface Body {
  siteId?: string;
  name?: string;
  pointsPerDollar?: number;
  tiers?: LoyaltyTier[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as Body;
    if (!body.siteId || !body.name || typeof body.pointsPerDollar !== "number" || !Array.isArray(body.tiers)) {
      return NextResponse.json({ error: "siteId, name, pointsPerDollar, tiers required" }, { status: 400 });
    }
    const program = await createProgram({
      siteId: body.siteId,
      name: body.name,
      pointsPerDollar: body.pointsPerDollar,
      tiers: body.tiers,
    });
    return NextResponse.json({ program });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
