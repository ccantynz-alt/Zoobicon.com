import { NextResponse } from "next/server";
import { generateTalkingHead } from "@/lib/avatar-talking";

export const runtime = "nodejs";

interface TalkingHeadRequestBody {
  imageUrl?: unknown;
  audioUrl?: unknown;
  prompt?: unknown;
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: TalkingHeadRequestBody;
  try {
    body = (await req.json()) as TalkingHeadRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
  const audioUrl = typeof body.audioUrl === "string" ? body.audioUrl : "";
  const prompt = typeof body.prompt === "string" ? body.prompt : undefined;

  if (!imageUrl || !audioUrl) {
    return NextResponse.json(
      { error: "imageUrl and audioUrl are required" },
      { status: 400 },
    );
  }

  try {
    const result = await generateTalkingHead({ imageUrl, audioUrl, prompt });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const status =
      err && typeof err === "object" && "status" in err && typeof (err as { status?: number }).status === "number"
        ? (err as { status: number }).status
        : 500;
    const message = err instanceof Error ? err.message : "talking-head generation failed";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
