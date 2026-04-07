import { NextRequest, NextResponse } from "next/server";
import { suggestHashtags, type SocialPlatform } from "@/lib/social-poster";

export const runtime = "nodejs";

interface HashtagsBody {
  content?: string;
  platform?: SocialPlatform;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as HashtagsBody;
    if (!body.content || !body.platform) {
      return NextResponse.json(
        { error: "content and platform required", hint: "POST { content, platform }" },
        { status: 400 }
      );
    }
    const hashtags = await suggestHashtags(body.content, body.platform);
    return NextResponse.json({ ok: true, hashtags });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message, hint: "Set ANTHROPIC_API_KEY in env to enable hashtag suggestions" },
      { status: 500 }
    );
  }
}
