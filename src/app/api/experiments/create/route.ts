import { NextRequest, NextResponse } from "next/server";
import { createExperiment, Variant } from "@/lib/ab-testing";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      siteId?: string;
      name?: string;
      variants?: Variant[];
      goalEvent?: string;
    };
    if (!body.siteId || !body.name || !body.variants || !body.goalEvent) {
      return NextResponse.json(
        { error: "siteId, name, variants, goalEvent required" },
        { status: 400 }
      );
    }
    const row = await createExperiment(
      body.siteId,
      body.name,
      body.variants,
      body.goalEvent
    );
    return NextResponse.json(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
