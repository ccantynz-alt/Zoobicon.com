import { NextRequest, NextResponse } from "next/server";
import { estimateCost } from "@/lib/video-broll";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const model = url.searchParams.get("model");
  const durationStr = url.searchParams.get("duration");

  if (!model) {
    return NextResponse.json({ error: "model query param required" }, { status: 400 });
  }
  const duration = durationStr ? Number(durationStr) : NaN;
  if (!Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "duration query param must be positive number" }, { status: 400 });
  }

  const cost = estimateCost(model, duration);
  return NextResponse.json({ model, durationSec: duration, estimatedCostUsd: cost });
}
