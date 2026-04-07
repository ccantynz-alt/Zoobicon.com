import { NextRequest, NextResponse } from "next/server";
import { subscribe } from "@/lib/web-push";

export const runtime = "nodejs";

interface Body {
  userId?: string;
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (
    !process.env.VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.VAPID_SUBJECT
  ) {
    return NextResponse.json({ error: "VAPID env vars missing" }, { status: 503 });
  }
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const userId = body.userId;
  const sub = body.subscription;
  if (
    !userId ||
    !sub ||
    !sub.endpoint ||
    !sub.keys ||
    !sub.keys.p256dh ||
    !sub.keys.auth
  ) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }
  try {
    await subscribe({
      userId,
      subscription: {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return NextResponse.json(
      { error: (err as Error).message },
      { status },
    );
  }
}
