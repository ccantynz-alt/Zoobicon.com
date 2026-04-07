import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const WHISPER_VERSION =
  "openai/whisper:4d50797290df275329f202e48c76360b3f22b08d28c196cbc54600319435f8d2";

export async function POST(req: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "REPLICATE_API_TOKEN not set" },
      { status: 503 }
    );
  }
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!audio || typeof audio === "string") {
      return NextResponse.json({ error: "Missing audio blob" }, { status: 400 });
    }
    const buf = Buffer.from(await (audio as Blob).arrayBuffer());
    const dataUrl = `data:${(audio as Blob).type || "audio/webm"};base64,${buf.toString("base64")}`;

    const startRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: WHISPER_VERSION,
        input: { audio: dataUrl, model: "base" },
      }),
    });
    const started = await startRes.json();
    if (!startRes.ok) {
      return NextResponse.json({ error: started?.detail || "Replicate error" }, { status: 502 });
    }
    let pred = started;
    const deadline = Date.now() + 50000;
    while (pred.status !== "succeeded" && pred.status !== "failed" && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await fetch(pred.urls.get, { headers: { Authorization: `Token ${token}` } });
      pred = await poll.json();
    }
    if (pred.status !== "succeeded") {
      return NextResponse.json({ error: pred.error || "Transcription failed" }, { status: 504 });
    }
    const text = pred.output?.transcription || pred.output?.text || "";
    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
