/**
 * POST /api/voice/transcribe
 * multipart/form-data with field "audio" (File).
 * Returns { text, duration, languageCode, confidence }.
 *
 * Bible Law 8: every failure path returns a clear, actionable error.
 */

import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, VoiceBuildError } from "@/lib/voice-build";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      {
        error: "FAL_KEY not configured",
        hint: "Set FAL_KEY in Vercel env vars to enable voice transcription.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid form data";
    return NextResponse.json(
      {
        error: `Invalid multipart payload: ${message}`,
        hint: "POST multipart/form-data with an 'audio' file field.",
      },
      { status: 400 },
    );
  }

  const audio = form.get("audio");
  if (!audio || typeof audio === "string") {
    return NextResponse.json(
      {
        error: "Missing 'audio' file field",
        hint: "Mic not accessible? Check browser permissions and retry.",
      },
      { status: 400 },
    );
  }

  const file = audio as File;
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (err) {
    const message = err instanceof Error ? err.message : "buffer read failed";
    return NextResponse.json(
      {
        error: `Could not read audio buffer: ${message}`,
        hint: "Audio file unreadable — try recording again.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await transcribeAudio(buffer, file.type || "audio/webm");
    return NextResponse.json({
      text: result.text,
      duration: result.durationSec,
      languageCode: result.languageCode,
      confidence: result.confidence,
    });
  } catch (err) {
    if (err instanceof VoiceBuildError) {
      return NextResponse.json(
        { error: err.message, hint: err.hint },
        { status: err.status },
      );
    }
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      {
        error: `Transcription failed: ${message}`,
        hint: "Unexpected error — retry once or check server logs.",
      },
      { status: 500 },
    );
  }
}
