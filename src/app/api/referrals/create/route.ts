import { NextResponse } from "next/server";
import { createReferralCode, hasDatabase } from "@/lib/referrals";

export const runtime = "nodejs";

interface CreateBody {
  userId?: unknown;
  programId?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as CreateBody;
  const userId = typeof body.userId === "string" ? body.userId : "";
  const programId = typeof body.programId === "string" ? body.programId : "default";
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  try {
    const code = await createReferralCode({ userId, programId });
    return NextResponse.json({ ok: true, code });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
