import { NextRequest, NextResponse } from "next/server";
import { ask } from "@/lib/doc-qa";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { userId?: string; docId?: string; question?: string };
    if (!body.userId || !body.question) {
      return NextResponse.json({ error: "userId and question required" }, { status: 400 });
    }
    const result = await ask({
      userId: body.userId,
      docId: body.docId,
      question: body.question,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ask failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
