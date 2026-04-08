import { NextRequest, NextResponse } from "next/server";
import { getStats } from "@/lib/affiliate-program";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const idParam = req.nextUrl.searchParams.get("affiliateId");
    if (!idParam) {
      return NextResponse.json({ error: "affiliateId required" }, { status: 400 });
    }
    const id = Number(idParam);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "affiliateId must be numeric" }, { status: 400 });
    }
    const stats = await getStats(id);
    return NextResponse.json(stats);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
