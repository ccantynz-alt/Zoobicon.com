import { NextRequest, NextResponse } from "next/server";
import { listScheduled } from "@/lib/social-poster";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter required", hint: "Append ?userId=..." },
        { status: 400 }
      );
    }
    const posts = await listScheduled(userId);
    return NextResponse.json({ ok: true, posts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message, hint: "Check DATABASE_URL is set in env" },
      { status: 500 }
    );
  }
}
