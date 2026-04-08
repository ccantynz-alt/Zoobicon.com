import { NextRequest, NextResponse } from "next/server";
import { generateBroll, type BrollResolution, type BrollTier } from "@/lib/video-broll";
import { FalError } from "@/lib/fal-client";

export const runtime = "nodejs";
export const maxDuration = 300;

interface BrollBody {
  prompt?: unknown;
  durationSec?: unknown;
  resolution?: unknown;
  tier?: unknown;
  style?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: BrollBody;
  try {
    body = (await req.json()) as BrollBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body.prompt !== "string" || body.prompt.trim().length === 0) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const durationSec = typeof body.durationSec === "number" ? body.durationSec : 6;
  const resolution = (typeof body.resolution === "string" ? body.resolution : "1080p") as BrollResolution;
  const tier = (typeof body.tier === "string" && (body.tier === "premium" || body.tier === "budget")
    ? body.tier
    : "premium") as BrollTier;
  const style = typeof body.style === "string" ? body.style : undefined;

  try {
    const result = await generateBroll({
      prompt: body.prompt,
      durationSec,
      resolution,
      tier,
      style,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FalError) {
      return NextResponse.json(
        { error: err.message, model: err.model },
        { status: err.status === 503 ? 503 : 502 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
