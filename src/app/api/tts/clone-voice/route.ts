import { NextRequest, NextResponse } from "next/server";
import { cloneVoice } from "@/lib/tts-elevenlabs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = form.get("name");
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    const fileEntries = form.getAll("files");
    if (fileEntries.length === 0) {
      return NextResponse.json({ error: "files required" }, { status: 400 });
    }
    const buffers: ArrayBuffer[] = [];
    for (const entry of fileEntries) {
      if (entry instanceof Blob) {
        buffers.push(await entry.arrayBuffer());
      }
    }
    if (buffers.length === 0) {
      return NextResponse.json({ error: "no valid file blobs" }, { status: 400 });
    }
    const voiceId = await cloneVoice({ name, files: buffers });
    return NextResponse.json({ voice_id: voiceId });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message || "clone failed" }, { status: 500 });
  }
}
