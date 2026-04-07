import { NextRequest, NextResponse } from "next/server";
import { lookupIp } from "@/lib/geo";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    let ip = url.searchParams.get("ip") ?? "";
    if (!ip) {
      const fwd = req.headers.get("x-forwarded-for") ?? "";
      ip = fwd.split(",")[0]?.trim() ?? "";
    }
    if (!ip) ip = req.headers.get("x-real-ip") ?? "";
    if (!ip) {
      return NextResponse.json({ error: "no ip available" }, { status: 400 });
    }
    const data = await lookupIp(ip);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
