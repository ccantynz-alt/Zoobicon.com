import { NextRequest, NextResponse } from "next/server";
import { registerJob, type ActionType } from "@/lib/cron-scheduler";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      ownerId?: string;
      name?: string;
      cronExpr?: string;
      actionType?: ActionType;
      actionPayload?: Record<string, unknown>;
    };
    if (!body.ownerId || !body.name || !body.cronExpr || !body.actionType) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }
    if (!["webhook", "email", "ai_prompt"].includes(body.actionType)) {
      return NextResponse.json({ error: "invalid actionType" }, { status: 400 });
    }
    const job = await registerJob(
      body.ownerId,
      body.name,
      body.cronExpr,
      body.actionType,
      body.actionPayload ?? {}
    );
    return NextResponse.json({ job });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown error" },
      { status: 500 }
    );
  }
}
