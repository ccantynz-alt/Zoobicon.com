import { NextResponse } from "next/server";
import { listCompetitors } from "@/lib/competitor-monitor";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL missing" }, { status: 503 });
  }
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const competitors = await listCompetitors(userId);
    return NextResponse.json({ competitors });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
