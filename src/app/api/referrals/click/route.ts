import { NextResponse } from "next/server";
import { hasDatabase, trackClick } from "@/lib/referrals";

export const runtime = "nodejs";

interface ClickBody {
  code?: unknown;
  ip?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as ClickBody;
  const code = typeof body.code === "string" ? body.code : "";
  const headerIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "";
  const ip = typeof body.ip === "string" && body.ip ? body.ip : headerIp;
  if (!code) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }
  try {
    const ok = await trackClick(code, ip);
    if (!ok) return NextResponse.json({ error: "code not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
