import { NextResponse } from "next/server";
import { listTimers } from "@/lib/time-tracker";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  try {
    const entries = await listTimers(userId, { from, to });
    return NextResponse.json({ entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list timers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
