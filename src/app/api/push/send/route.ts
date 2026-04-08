import { NextRequest, NextResponse } from "next/server";
import { sendPush, broadcastPush } from "@/lib/web-push";

export const runtime = "nodejs";

interface Body {
  userId?: string;
  title?: string;
  body?: string;
  url?: string;
  icon?: string;
  broadcast?: boolean;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (
    !process.env.VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.VAPID_SUBJECT
  ) {
    return NextResponse.json({ error: "VAPID env vars missing" }, { status: 503 });
  }
  let payload: Body;
  try {
    payload = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!payload.title || !payload.body) {
    return NextResponse.json(
      { error: "missing title or body" },
      { status: 400 },
    );
  }
  try {
    if (payload.broadcast) {
      const result = await broadcastPush({
        title: payload.title,
        body: payload.body,
        url: payload.url,
        icon: payload.icon,
      });
      return NextResponse.json({ ok: true, ...result });
    }
    if (!payload.userId) {
      return NextResponse.json({ error: "missing userId" }, { status: 400 });
    }
    const result = await sendPush({
      userId: payload.userId,
      title: payload.title,
      body: payload.body,
      url: payload.url,
      icon: payload.icon,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: (err as Error).message },
      { status },
    );
  }
}
