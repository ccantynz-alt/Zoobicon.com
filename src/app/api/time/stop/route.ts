import { NextResponse } from "next/server";
import { stopTimer } from "@/lib/time-tracker";

export const runtime = "nodejs";

interface StopBody {
  timerId?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  let body: StopBody;
  try {
    body = (await req.json()) as StopBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.timerId) {
    return NextResponse.json({ error: "timerId required" }, { status: 400 });
  }
  try {
    const entry = await stopTimer(body.timerId);
    if (!entry) {
      return NextResponse.json({ error: "Timer not found or already stopped" }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to stop timer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
