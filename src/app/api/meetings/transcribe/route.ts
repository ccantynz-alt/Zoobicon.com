import { NextResponse } from "next/server";
import {
  transcribeMeeting,
  summarizeMeeting,
  saveMeeting,
} from "@/lib/meeting-recorder";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { audioUrl?: string; userId?: string };
    if (!body.audioUrl || !body.userId) {
      return NextResponse.json(
        { error: "audioUrl and userId are required" },
        { status: 400 }
      );
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        {
          error:
            "Meeting transcription unavailable: REPLICATE_API_TOKEN is not set in environment.",
        },
        { status: 503 }
      );
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Meeting summarization unavailable: ANTHROPIC_API_KEY is not set in environment.",
        },
        { status: 503 }
      );
    }

    const transcript = await transcribeMeeting(body.audioUrl);
    const summary = await summarizeMeeting(transcript);
    const record = await saveMeeting({
      userId: body.userId,
      audioUrl: body.audioUrl,
      transcript,
      summary,
    });

    return NextResponse.json({
      meetingId: record.id,
      transcript,
      summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
