import { NextRequest, NextResponse } from "next/server";
import { getBalance, currentTier } from "@/lib/loyalty";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const programId = searchParams.get("programId");
    if (!userId || !programId) {
      return NextResponse.json({ error: "userId and programId required" }, { status: 400 });
    }
    const balance = await getBalance(userId, programId);
    const tier = await currentTier(userId, programId);
    return NextResponse.json({ balance, tier });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
