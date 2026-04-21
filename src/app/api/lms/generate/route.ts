import { NextResponse } from "next/server";
import { generateCourse, createCourse } from "@/lib/lms-engine";

export const runtime = "nodejs";

interface GenerateBody {
  topic?: string;
  level?: string;
  userId?: string;
  persist?: boolean;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 });
  }
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.topic || !body.level) {
    return NextResponse.json({ error: "Missing topic or level" }, { status: 400 });
  }
  try {
    const scaffold = await generateCourse({ topic: body.topic, level: body.level });
    if (body.persist && body.userId) {
      if (!process.env.DATABASE_URL) {
        return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
      }
      const course = await createCourse({
        userId: body.userId,
        title: scaffold.title,
        description: scaffold.description,
        modules: scaffold.modules,
      });
      return NextResponse.json({ scaffold, course });
    }
    return NextResponse.json({ scaffold });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
