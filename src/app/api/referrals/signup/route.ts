import { NextResponse } from "next/server";
import { hasDatabase, recordSignup } from "@/lib/referrals";

export const runtime = "nodejs";

interface SignupBody {
  code?: unknown;
  newUserId?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as SignupBody;
  const code = typeof body.code === "string" ? body.code : "";
  const newUserId = typeof body.newUserId === "string" ? body.newUserId : "";
  if (!code || !newUserId) {
    return NextResponse.json({ error: "code and newUserId required" }, { status: 400 });
  }
  try {
    const ok = await recordSignup(code, newUserId);
    if (!ok) return NextResponse.json({ error: "code not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
