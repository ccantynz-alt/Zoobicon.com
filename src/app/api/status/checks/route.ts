import { NextRequest, NextResponse } from "next/server";
import { runChecks } from "@/lib/status-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { pageId?: unknown };
  try {
    body = (await req.json()) as { pageId?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const pageId = typeof body.pageId === "number" ? body.pageId : Number(body.pageId);
  if (!pageId || Number.isNaN(pageId)) {
    return NextResponse.json({ error: "pageId required" }, { status: 400 });
  }
  try {
    const results = await runChecks(pageId);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
