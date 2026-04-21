import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { trackClick } from "@/lib/affiliate-program";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { code?: string };
    if (!body.code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const result = await trackClick(body.code, ipHash, ua);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
