import { NextRequest, NextResponse } from "next/server";
import { completeJob, failJob } from "@/lib/job-queue";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { id?: string; success?: boolean; error?: string };
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const job = body.success === false
      ? await failJob(body.id, body.error ?? "unknown error")
      : await completeJob(body.id);
    if (!job) {
      return NextResponse.json({ error: "job not found" }, { status: 404 });
    }
    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
