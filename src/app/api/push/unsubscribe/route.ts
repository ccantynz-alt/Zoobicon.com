import { NextRequest, NextResponse } from "next/server";
import { unsubscribe } from "@/lib/web-push";

export const runtime = "nodejs";

interface Body {
  endpoint?: string;
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
  if (!body.endpoint) {
    return NextResponse.json({ error: "missing endpoint" }, { status: 400 });
  }
  try {
    await unsubscribe(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
