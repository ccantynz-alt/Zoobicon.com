import { NextRequest, NextResponse } from "next/server";
import { checkAccess, hasDb } from "@/lib/membership";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!hasDb()) return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const contentId = searchParams.get("contentId");
  if (!userId || !contentId) {
    return NextResponse.json({ error: "Missing userId or contentId" }, { status: 400 });
  }
  const allowed = await checkAccess(userId, contentId);
  return NextResponse.json({ allowed });
}
