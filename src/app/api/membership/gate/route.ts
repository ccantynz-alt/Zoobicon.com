import { NextRequest, NextResponse } from "next/server";
import { unlockContent, hasDb } from "@/lib/membership";

export const runtime = "nodejs";

interface Body {
  userId?: string;
  contentId?: string;
  tierIds?: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!hasDb()) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  const body = (await req.json()) as Body;
  if (!body.userId || !body.contentId || !Array.isArray(body.tierIds)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const gate = await unlockContent({
    userId: body.userId,
    contentId: body.contentId,
    tierIds: body.tierIds,
  });
  return NextResponse.json({ gate });
}
