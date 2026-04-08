import { NextRequest, NextResponse } from "next/server";
import { registerAffiliate } from "@/lib/affiliate-program";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { userId?: string; payoutEmail?: string; paypalEmail?: string };
    if (!body.userId || !body.payoutEmail) {
      return NextResponse.json({ error: "userId and payoutEmail required" }, { status: 400 });
    }
    const result = await registerAffiliate(body.userId, body.payoutEmail, body.paypalEmail);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
