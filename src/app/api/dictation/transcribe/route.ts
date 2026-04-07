import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, isDeepgramAvailable, type DeepgramOptions } from "@/lib/deepgram";

export const maxDuration = 60;
export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
]);

function normalizeMime(m: string): string {
  return m.split(";")[0].trim().toLowerCase();
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isDeepgramAvailable()) {
    return NextResponse.json(
      {
        ok: false,
        error: "AI Dictation is not configured. DEEPGRAM_API_KEY env var is missing in Vercel.",
      },
      { status: 503 }
    );
  }

  try {
    const url = new URL(req.url);
    const opts: DeepgramOptions = {
      model: (url.searchParams.get("model") as DeepgramOptions["model"]) ?? "nova-3",
      language: url.searchParams.get("language") ?? "en",
      diarize: url.searchParams.get("diarize") === "true",
      utterances: url.searchParams.get("utterances") === "true",
    };

    const contentType = normalizeMime(req.headers.get("content-type") ?? "");

    let audioBuf: ArrayBuffer;
    let mime: string;

    if (contentType.startsWith("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ ok: false, error: "Missing 'file' field in form data." }, { status: 400 });
      }
      mime = normalizeMime(file.type || "audio/webm");
      if (!ALLOWED_MIME.has(mime)) {
        return NextResponse.json(
          { ok: false, error: `Unsupported audio type: ${mime}. Allowed: ${Array.from(ALLOWED_MIME).join(", ")}` },
          { status: 415 }
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ ok: false, error: `Audio exceeds 25MB limit.` }, { status: 413 });
      }
      audioBuf = await file.arrayBuffer();
    } else if (contentType.startsWith("audio/")) {
      mime = contentType;
      if (!ALLOWED_MIME.has(mime)) {
        return NextResponse.json(
          { ok: false, error: `Unsupported audio type: ${mime}.` },
          { status: 415 }
        );
      }
      audioBuf = await req.arrayBuffer();
      if (audioBuf.byteLength > MAX_BYTES) {
        return NextResponse.json({ ok: false, error: `Audio exceeds 25MB limit.` }, { status: 413 });
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Send multipart/form-data with 'file' or raw body with audio/* Content-Type." },
        { status: 400 }
      );
    }

    const result = await transcribeAudio(audioBuf, mime, opts);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown transcription error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
