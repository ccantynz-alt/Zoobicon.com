import { NextRequest, NextResponse } from "next/server";
import { generateImageToVideo } from "@/lib/video-broll";
import { FalError } from "@/lib/fal-client";

export const runtime = "nodejs";
export const maxDuration = 300;

interface I2VBody {
  imageUrl?: unknown;
  motionPrompt?: unknown;
  durationSec?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: I2VBody;
  try {
    body = (await req.json()) as I2VBody;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  if (typeof body.imageUrl !== "string" || body.imageUrl.length === 0) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }
  if (typeof body.motionPrompt !== "string" || body.motionPrompt.length === 0) {
    return NextResponse.json({ error: "motionPrompt is required" }, { status: 400 });
  }

  const durationSec = typeof body.durationSec === "number" ? body.durationSec : 5;

  try {
    const result = await generateImageToVideo({
      imageUrl: body.imageUrl,
      motionPrompt: body.motionPrompt,
      durationSec,
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
