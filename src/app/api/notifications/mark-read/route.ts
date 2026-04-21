import { NextRequest, NextResponse } from "next/server";
import { markRead, markAllRead } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      notificationId?: string;
      userId?: string;
      all?: boolean;
    };
    if (!body.userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (body.all) {
      await markAllRead(body.userId);
      return NextResponse.json({ ok: true });
    }
    if (!body.notificationId) {
      return NextResponse.json(
        { error: "notificationId or all:true required" },
        { status: 400 }
      );
    }
    await markRead(body.notificationId, body.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
