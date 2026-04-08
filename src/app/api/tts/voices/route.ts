import { NextResponse } from "next/server";
import { listVoices } from "@/lib/tts-elevenlabs";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await listVoices();
    return NextResponse.json(data);
  } catch (err) {
    const e = err as Error;
    return NextResponse.json({ error: e.message || "list failed" }, { status: 500 });
  }
}
