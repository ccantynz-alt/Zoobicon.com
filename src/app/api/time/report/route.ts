import { NextResponse } from "next/server";
import { reportByProject } from "@/lib/time-tracker";

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
    const report = await reportByProject(userId, { from, to });
    return NextResponse.json({ report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
