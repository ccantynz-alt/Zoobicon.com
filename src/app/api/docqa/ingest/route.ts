import { NextRequest, NextResponse } from "next/server";
import { ingestDocument } from "@/lib/doc-qa";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { userId?: string; name?: string; content?: string };
    if (!body.userId || !body.name || typeof body.content !== "string") {
      return NextResponse.json({ error: "userId, name, content required" }, { status: 400 });
    }
    const result = await ingestDocument({
      userId: body.userId,
      name: body.name,
      content: body.content,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ingest failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
