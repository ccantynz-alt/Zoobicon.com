import { NextRequest, NextResponse } from "next/server";
import { autoEdit } from "@/lib/video-auto-editor";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN not configured" },
      { status: 503 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 },
    );
  }

  let body: { videoUrl?: string };
  try {
    body = (await req.json()) as { videoUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const videoUrl = body.videoUrl;
  if (!videoUrl || typeof videoUrl !== "string") {
    return NextResponse.json({ error: "videoUrl required" }, { status: 400 });
  }

  try {
    const result = await autoEdit(videoUrl);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auto-edit] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
