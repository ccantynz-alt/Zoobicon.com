import { NextRequest, NextResponse } from "next/server";
import { publishNow } from "@/lib/social-poster";

export const runtime = "nodejs";

interface PublishBody {
  postId?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as PublishBody;
    if (!body.postId) {
      return NextResponse.json(
        { error: "postId required", hint: "POST { postId: 'sp_...' }" },
        { status: 400 }
      );
    }
    const post = await publishNow(body.postId);
    return NextResponse.json({ ok: true, post });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: message, hint: "Check post exists and platform tokens are configured in env" },
      { status: 500 }
    );
  }
}
