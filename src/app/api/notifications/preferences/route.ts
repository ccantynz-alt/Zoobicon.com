import { NextRequest, NextResponse } from "next/server";
import {
  getPreferences,
  setPreferences,
  NotificationPreferences,
} from "@/lib/notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    if (!userId || !type) {
      return NextResponse.json(
        { error: "userId and type required" },
        { status: 400 }
      );
    }
    const prefs = await getPreferences(userId, type);
    return NextResponse.json({ prefs });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      userId?: string;
      type?: string;
      prefs?: Partial<NotificationPreferences>;
    };
    if (!body.userId || !body.type || !body.prefs) {
      return NextResponse.json(
        { error: "userId, type, prefs required" },
        { status: 400 }
      );
    }
    const updated = await setPreferences(body.userId, body.type, body.prefs);
    return NextResponse.json({ ok: true, prefs: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
