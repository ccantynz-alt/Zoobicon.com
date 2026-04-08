import { NextRequest, NextResponse } from "next/server";
import { dequeue } from "@/lib/job-queue";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { queue?: string; workerId?: string };
    if (!body.queue || !body.workerId) {
      return NextResponse.json({ error: "queue and workerId required" }, { status: 400 });
    }
    const job = await dequeue(body.queue, body.workerId);
    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
