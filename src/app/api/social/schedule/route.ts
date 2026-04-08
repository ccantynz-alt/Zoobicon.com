import { NextRequest, NextResponse } from "next/server";
import { schedulePost, type SocialPlatform } from "@/lib/social-poster";

export const runtime = "nodejs";

interface ScheduleBody {
  userId?: string;
  platforms?: SocialPlatform[];
  content?: string;
  mediaUrl?: string;
  scheduledFor?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as ScheduleBody;
    if (!body.userId || !body.platforms || !body.content || !body.scheduledFor) {
      return NextResponse.json(
        { error: "Missing required fields", hint: "Provide userId, platforms[], content, scheduledFor (ISO)" },
        { status: 400 }
      );
    }
    const post = await schedulePost({
      userId: body.userId,
      platforms: body.platforms,
      content: body.content,
      mediaUrl: body.mediaUrl,
      scheduledFor: body.scheduledFor,
    });
    return NextResponse.json({ ok: true, post });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message, hint: "Check DATABASE_URL is set in env and payload is valid JSON" },
      { status: 500 }
    );
  }
}
