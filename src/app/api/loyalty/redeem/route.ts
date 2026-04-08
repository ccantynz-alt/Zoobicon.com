import { NextRequest, NextResponse } from "next/server";
import { redeemPoints } from "@/lib/loyalty";

export const runtime = "nodejs";

interface Body {
  userId?: string;
  programId?: string;
  points?: number;
  reward?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as Body;
    if (!body.userId || !body.programId || typeof body.points !== "number" || !body.reward) {
      return NextResponse.json({ error: "userId, programId, points, reward required" }, { status: 400 });
    }
    const balance = await redeemPoints({
      userId: body.userId,
      programId: body.programId,
      points: body.points,
      reward: body.reward,
    });
    return NextResponse.json({ balance });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
