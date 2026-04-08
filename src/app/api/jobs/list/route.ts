import { NextRequest, NextResponse } from "next/server";
import { listJobs, type JobStatus } from "@/lib/job-queue";

export const runtime = "nodejs";

const VALID_STATUSES: ReadonlySet<JobStatus> = new Set<JobStatus>([
  "pending",
  "running",
  "completed",
  "failed",
  "dead",
]);

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  try {
    const queue = req.nextUrl.searchParams.get("queue");
    const statusParam = req.nextUrl.searchParams.get("status");
    if (!queue) {
      return NextResponse.json({ error: "queue required" }, { status: 400 });
    }
    const status: JobStatus | undefined =
      statusParam && VALID_STATUSES.has(statusParam as JobStatus) ? (statusParam as JobStatus) : undefined;
    const jobs = await listJobs(queue, status);
    return NextResponse.json({ jobs });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
