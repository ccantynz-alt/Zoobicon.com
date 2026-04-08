import { NextResponse } from "next/server";
import { getStats, hasDatabase } from "@/lib/referrals";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "";
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  try {
    const stats = await getStats(userId);
    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
