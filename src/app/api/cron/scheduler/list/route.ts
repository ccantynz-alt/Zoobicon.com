import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureSchedulerTables, type CronJob } from "@/lib/cron-scheduler";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    await ensureSchedulerTables();
    const ownerId = req.nextUrl.searchParams.get("ownerId");
    if (!ownerId) {
      return NextResponse.json({ error: "ownerId required" }, { status: 400 });
    }
    const jobs = (await sql`
      SELECT * FROM cron_jobs WHERE owner_id = ${ownerId} ORDER BY created_at DESC
    `) as unknown as CronJob[];
    return NextResponse.json({ jobs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown error" },
      { status: 500 }
    );
  }
}
