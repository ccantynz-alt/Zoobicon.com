import { NextResponse, type NextRequest } from "next/server";
import { createZap, listZaps, type ZapAction, type ZapTrigger } from "@/lib/integrations-hub";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  try {
    const zaps = await listZaps(userId);
    return NextResponse.json({ zaps });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}

interface CreateBody {
  userId?: string;
  name?: string;
  trigger?: ZapTrigger;
  action?: ZapAction;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not set" }, { status: 503 });
  }
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.userId || !body.name || !body.trigger || !body.action) {
    return NextResponse.json(
      { error: "userId, name, trigger, action required" },
      { status: 400 }
    );
  }
  try {
    const zap = await createZap({
      userId: body.userId,
      name: body.name,
      trigger: body.trigger,
      action: body.action,
    });
    return NextResponse.json({ zap });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}
