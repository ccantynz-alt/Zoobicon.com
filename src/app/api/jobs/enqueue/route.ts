import { NextRequest, NextResponse } from "next/server";
import { enqueue, type JobPayload } from "@/lib/job-queue";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as {
      queue?: string;
      type?: string;
      payload?: JobPayload;
      runAt?: string;
      maxAttempts?: number;
    };
    if (!body.queue || !body.type) {
      return NextResponse.json({ error: "queue and type required" }, { status: 400 });
    }
    const job = await enqueue({
      queue: body.queue,
      type: body.type,
      payload: body.payload ?? {},
      runAt: body.runAt ? new Date(body.runAt) : undefined,
      maxAttempts: body.maxAttempts,
    });
    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
