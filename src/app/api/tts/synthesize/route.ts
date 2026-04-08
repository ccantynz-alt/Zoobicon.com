import { NextRequest, NextResponse } from "next/server";
import { synthesizeWithFallback } from "@/lib/tts-elevenlabs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { text?: string; voiceId?: string };
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }
    const result = await synthesizeWithFallback({
      text: body.text,
      voiceId: body.voiceId,
    });
    return new NextResponse(result.audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "X-TTS-Provider": result.provider,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    const status = e.status === 503 ? 503 : 500;
    return NextResponse.json({ error: e.message || "TTS failed" }, { status });
  }
}
