import { NextRequest, NextResponse } from "next/server";

// OpenAI Whisper API caps audio uploads at 25MB. Enforcing the limit
// before we forward the request stops a malicious client from billing
// us for oversized payloads (the API would still reject them, but we
// pay for the bandwidth on the way through).
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured on server" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const language = (formData.get("language") as string) || "en";

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: `Audio file too large (${file.size} bytes). Whisper accepts max ${MAX_AUDIO_BYTES} bytes.` },
        { status: 413 }
      );
    }

    // Forward to OpenAI Whisper API
    const whisperForm = new FormData();
    whisperForm.append("file", file, "audio.webm");
    whisperForm.append("model", "whisper-1");
    whisperForm.append("language", language);

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperForm,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Whisper API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
