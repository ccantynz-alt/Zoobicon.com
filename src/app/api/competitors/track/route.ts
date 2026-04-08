import { NextResponse } from "next/server";
import { trackCompetitor } from "@/lib/competitor-monitor";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL missing" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { userId?: string; name?: string; url?: string };
    if (!body.userId || !body.name || !body.url) {
      return NextResponse.json({ error: "userId, name, url required" }, { status: 400 });
    }
    const competitor = await trackCompetitor({
      userId: body.userId,
      name: body.name,
      url: body.url,
    });
    return NextResponse.json({ competitor });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
