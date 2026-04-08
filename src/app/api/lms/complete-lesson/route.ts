import { NextResponse } from "next/server";
import { markLessonComplete, courseProgress } from "@/lib/lms-engine";

export const runtime = "nodejs";

interface CompleteBody {
  enrollmentId?: string;
  lessonId?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  }
  let body: CompleteBody;
  try {
    body = (await req.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.enrollmentId || !body.lessonId) {
    return NextResponse.json({ error: "Missing enrollmentId or lessonId" }, { status: 400 });
  }
  try {
    const enrollment = await markLessonComplete(body.enrollmentId, body.lessonId);
    const progress = await courseProgress(body.enrollmentId);
    return NextResponse.json({ enrollment, progress });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
