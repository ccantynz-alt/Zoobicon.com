/**
 * POST /api/voice/command
 * multipart/form-data: { audio: File, currentProjectId?: string }
 *
 * Full voice-to-build orchestration:
 *   transcribe → classify → route to downstream module.
 *
 * Returns the full ProcessVoiceCommandResult payload.
 *
 * Bible Law 8: every failure path returns a clear, actionable error.
 */

import { NextRequest, NextResponse } from "next/server";
import { processVoiceCommand, VoiceBuildError } from "@/lib/voice-build";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      {
        error: "FAL_KEY not configured",
        hint: "Set FAL_KEY in Vercel env vars to enable voice commands.",
      },
      { status: 503 },
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error: "ANTHROPIC_API_KEY not configured",
        hint: "Set ANTHROPIC_API_KEY in Vercel env vars.",
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
        hint: "POST multipart/form-data with 'audio' and optional 'currentProjectId'.",
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

  const projectIdRaw = form.get("currentProjectId");
  const currentProjectId =
    typeof projectIdRaw === "string" && projectIdRaw.length > 0
      ? projectIdRaw
      : undefined;

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
    const payload = await processVoiceCommand({
      audioBuffer: buffer,
      mimeType: file.type || "audio/webm",
      currentProjectId,
    });
    return NextResponse.json(payload);
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
        error: `Voice command failed: ${message}`,
        hint: "Unexpected error — retry once or check server logs.",
      },
      { status: 500 },
    );
  }
}
