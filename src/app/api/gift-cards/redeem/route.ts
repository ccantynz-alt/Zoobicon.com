import { NextRequest, NextResponse } from "next/server";
import { redeemGiftCard } from "@/lib/gift-cards";

export const runtime = "nodejs";

interface RedeemBody {
  code?: string;
  userId?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as RedeemBody;
    if (!body.code || !body.userId) {
      return NextResponse.json({ error: "code and userId required" }, { status: 400 });
    }
    const result = await redeemGiftCard(body.code, body.userId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
