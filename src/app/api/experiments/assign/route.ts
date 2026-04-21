import { NextRequest, NextResponse } from "next/server";
import { assignVariant } from "@/lib/ab-testing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { experimentId?: string; visitorHash?: string };
    if (!body.experimentId || !body.visitorHash) {
      return NextResponse.json(
        { error: "experimentId and visitorHash required" },
        { status: 400 }
      );
    }
    const result = await assignVariant(body.experimentId, body.visitorHash);
    if (!result) {
      return NextResponse.json({ error: "experiment not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
