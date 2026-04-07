import { NextRequest, NextResponse } from "next/server";
import { recordConversion } from "@/lib/ab-testing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      experimentId?: string;
      visitorHash?: string;
      value?: number;
    };
    if (!body.experimentId || !body.visitorHash) {
      return NextResponse.json(
        { error: "experimentId and visitorHash required" },
        { status: 400 }
      );
    }
    const ok = await recordConversion(
      body.experimentId,
      body.visitorHash,
      typeof body.value === "number" ? body.value : 0
    );
    return NextResponse.json({ ok });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
