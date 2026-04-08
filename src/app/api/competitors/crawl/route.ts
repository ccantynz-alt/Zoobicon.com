import { NextResponse } from "next/server";
import { crawlCompetitor } from "@/lib/competitor-monitor";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL missing" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const snapshot = await crawlCompetitor(body.id);
    return NextResponse.json({ snapshot });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
