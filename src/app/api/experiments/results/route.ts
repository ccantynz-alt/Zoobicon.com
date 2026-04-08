import { NextRequest, NextResponse } from "next/server";
import { getResults } from "@/lib/ab-testing";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const experimentId = req.nextUrl.searchParams.get("experimentId");
    if (!experimentId) {
      return NextResponse.json({ error: "experimentId required" }, { status: 400 });
    }
    const results = await getResults(experimentId);
    if (!results) {
      return NextResponse.json({ error: "experiment not found" }, { status: 404 });
    }
    return NextResponse.json(results);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
