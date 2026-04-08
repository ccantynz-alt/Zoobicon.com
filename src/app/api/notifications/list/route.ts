import { NextRequest, NextResponse } from "next/server";
import { listNotifications } from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const unread = searchParams.get("unread") === "true";
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    const notifications = await listNotifications(userId, unread);
    return NextResponse.json({ notifications });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
